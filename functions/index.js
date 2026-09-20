// functions/index.js
// ─── Firebase Cloud Functions Backend for Mushi QR Pro ─────────────────────
// Handles trusted role assignment, authoritative subscription management,
// and server-side immutable audit logging.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { 
  GooglePlayVerifier, 
  ALLOWED_PACKAGE_NAME,
  RTDN_SUBSCRIPTION_NOTIFICATION_TYPE,
  parseRTDNMessage,
  hashPurchaseToken,
  computeObfuscatedAccountId
} = require('./services/googlePlayVerifier');

// Define Cloud Secrets for server-side verification (server-only, zero client exposure)
const googlePlayCredentialsSecret = defineSecret('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
const playAccountBindingSecret = defineSecret('PLAY_ACCOUNT_BINDING_SECRET');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// ─── Designated Super Admin Owner Emails ──────────────────────────────────
// These emails are the bootstrap owners. Cloud Functions recognize these emails
// as Super Admin even before custom claims are minted.
const SUPER_ADMIN_EMAILS = [
  'mabuneri143@gmail.com',
  'mabuneri143@gamil.com'
];
const SUPER_ADMIN_EMAIL = 'mabuneri143@gmail.com';

/**
 * Helper: Check if caller is Super Admin (by custom claim OR designated owner email)
 */
function callerIsSuperAdmin(request) {
  if (!request.auth || !request.auth.uid) return false;
  const claims = request.auth.token || {};
  if (claims.role === 'super_admin') return true;
  const callerEmail = (claims.email || '').toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === callerEmail)) return true;
  return false;
}

/**
 * Helper: Require Super Admin — throws HttpsError if not authorized
 */
function requireSuperAdmin(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }
  if (!callerIsSuperAdmin(request)) {
    throw new HttpsError(
      'permission-denied',
      'You do not have Super Admin permissions. Your account must have the super_admin role or be the designated system owner.'
    );
  }
}

/**
 * Trusted Helper: Writes immutable audit record to global_audit_logs
 */
async function writeAuditLog(actorUid, actorRole, action, targetUid, meta = {}) {
  try {
    await db.collection('global_audit_logs').add({
      action,
      actorUid: actorUid || 'system',
      actorRole: actorRole || 'system',
      targetUid: targetUid || null,
      meta,
      ts: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[CloudFunctions Audit Error]:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// bootstrapSuperAdmin — One-time self-service to mint super_admin custom claim
// Only the designated SUPER_ADMIN_EMAIL can call this.
// ═══════════════════════════════════════════════════════════════════════════
exports.bootstrapSuperAdmin = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerEmail = (request.auth.token?.email || '').toLowerCase().trim();
  if (!SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === callerEmail)) {
    throw new HttpsError(
      'permission-denied',
      'Only the designated system owner can bootstrap Super Admin. Your email does not match.'
    );
  }

  const callerUid = request.auth.uid;

  // Check if already has super_admin claim
  const currentUser = await admin.auth().getUser(callerUid);
  const currentClaims = currentUser.customClaims || {};

  if (currentClaims.role === 'super_admin') {
    return {
      success: true,
      message: 'You already have the super_admin role. No changes made.',
      alreadyBootstrapped: true,
    };
  }

  // Mint the custom claim
  await admin.auth().setCustomUserClaims(callerUid, {
    ...currentClaims,
    role: 'super_admin',
  });

  // Update app_users document
  await db.collection('app_users').doc(callerUid).set({
    role: 'super_admin',
    roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    roleUpdatedBy: callerUid,
    email: callerEmail,
  }, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'SUPER_ADMIN_BOOTSTRAPPED', callerUid, {
    email: callerEmail,
  });

  return {
    success: true,
    message: 'Super Admin role has been minted. Please refresh your browser to activate the new permissions.',
    alreadyBootstrapped: false,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// setUserRole — Grants or modifies user custom claims and profile role.
// Restricted to Super Admin only. Includes Last Super Admin Protection.
// ═══════════════════════════════════════════════════════════════════════════
exports.setUserRole = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { targetUid, newRole } = request.data || {};
  const allowedRoles = ['super_admin', 'admin', 'editor', 'support', 'user'];

  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid targetUid string must be provided.');
  }
  if (!newRole || !allowedRoles.includes(newRole)) {
    throw new HttpsError('invalid-argument', `Invalid newRole. Allowed values: ${allowedRoles.join(', ')}.`);
  }

  // Fetch target user
  let targetUser;
  try {
    targetUser = await admin.auth().getUser(targetUid);
  } catch {
    throw new HttpsError('not-found', `Target user with UID ${targetUid} was not found.`);
  }

  const currentClaims = targetUser.customClaims || {};
  const currentRole = currentClaims.role || 'user';

  // Last Super Admin Protection
  if (currentRole === 'super_admin' && newRole !== 'super_admin') {
    let superAdminCount = 0;
    let nextPageToken;
    do {
      const listResult = await admin.auth().listUsers(1000, nextPageToken);
      superAdminCount += listResult.users.filter(u => u.customClaims && u.customClaims.role === 'super_admin').length;
      nextPageToken = listResult.pageToken;
      if (superAdminCount > 1) break; // Early exit once more than 1 is found
    } while (nextPageToken);

    if (superAdminCount <= 1) {
      throw new HttpsError(
        'failed-precondition',
        'Operation blocked: Cannot demote or remove the last remaining Super Admin.'
      );
    }
  }

  // Update Custom Claims
  const updatedClaims = { ...currentClaims, role: newRole };
  await admin.auth().setCustomUserClaims(targetUid, updatedClaims);

  // Sync role metadata to app_users/{targetUid}
  await db.collection('app_users').doc(targetUid).set({
    role: newRole,
    roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    roleUpdatedBy: callerUid,
  }, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'USER_ROLE_CHANGED', targetUid, {
    previousRole: currentRole,
    newRole,
  });

  return {
    success: true,
    message: `Successfully assigned role '${newRole}' to UID: ${targetUid}. User ID token refresh required.`,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// updateUserSubscription — Authoritative subscription updates.
// Restricted to Super Admin role only.
// ═══════════════════════════════════════════════════════════════════════════
exports.updateUserSubscription = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { targetUid, planId, isPro, durationDays, reason } = request.data || {};

  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid targetUid string must be provided.');
  }

  const ALLOWED_ADMIN_PLANS = ['free', 'weekly', 'monthly', 'yearly', 'lifetime'];
  const requestedPlan = planId ? String(planId).toLowerCase().trim() : (isPro ? 'monthly' : 'free');
  if (!ALLOWED_ADMIN_PLANS.includes(requestedPlan)) {
    throw new HttpsError('invalid-argument', `Invalid planId '${planId}'. Allowed plans: ${ALLOWED_ADMIN_PLANS.join(', ')}.`);
  }

  const validPlanId = requestedPlan;
  const proActive = validPlanId !== 'free' && (isPro !== false);
  const now = new Date();
  
  let expiryDate = null;
  if (validPlanId === 'lifetime') {
    expiryDate = null;
  } else if (durationDays && typeof durationDays === 'number' && durationDays > 0) {
    expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  }

  const subRef = db.collection('user_subscriptions').doc(targetUid);
  const existingSubSnap = await subRef.get();
  const previousSub = existingSubSnap.exists ? existingSubSnap.data() : null;

  const newSubData = {
    userId: targetUid,
    planId: validPlanId,
    status: proActive ? 'ACTIVE' : 'FREE',
    provider: 'manual_admin',
    isTrial: false,
    autoRenew: false,
    expiryDate,
    lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    grantedBy: callerUid,
    grantReason: reason || 'Manual Admin Update',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: callerUid,
  };

  await subRef.set(newSubData, { merge: true });

  // Sync to app_users
  await db.collection('app_users').doc(targetUid).set({
    planId: validPlanId,
    subscriptionStatus: proActive ? 'ACTIVE' : 'FREE',
    isPro: proActive,
    proGrantedAt: proActive ? admin.firestore.FieldValue.serverTimestamp() : null,
    proGrantedBy: proActive ? callerUid : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'USER_SUBSCRIPTION_UPDATED', targetUid, {
    previousPlan: previousSub?.planId || 'free',
    newPlan: validPlanId,
    status: proActive ? 'ACTIVE' : 'FREE',
    durationDays,
    reason: reason || 'Manual Admin Update',
  });

  return {
    success: true,
    message: `Updated subscription for UID ${targetUid} to plan '${validPlanId}'.`,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// publishMembershipConfig — Authoritative global membership configuration publisher.
// ═══════════════════════════════════════════════════════════════════════════
exports.publishMembershipConfig = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { plans, featureMatrix, featureLimits } = request.data || {};

  if (!plans || typeof plans !== 'object') {
    throw new HttpsError('invalid-argument', 'Valid plans map must be provided.');
  }

  const configRef = db.collection('global_config').doc('membership');
  const snap = await configRef.get();
  const currentVersion = snap.exists ? (snap.data().configVersion || 100) : 100;
  const nextVersion = currentVersion + 1;

  const payload = {
    schemaVersion: 2,
    configVersion: nextVersion,
    plans: plans || {},
    featureMatrix: featureMatrix || {},
    featureLimits: featureLimits || {},
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: callerUid,
  };

  await configRef.set(payload, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'MEMBERSHIP_CONFIG_PUBLISHED', null, {
    configVersion: nextVersion,
    planCount: Object.keys(plans).length,
    matrixCount: Object.keys(featureMatrix || {}).length,
  });

  return {
    success: true,
    configVersion: nextVersion,
    message: `Published membership configuration version ${nextVersion}.`,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// saveAdminConfig — Generic server-authorized config writer for global_config/*
// ═══════════════════════════════════════════════════════════════════════════
exports.saveAdminConfig = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { docId, data } = request.data || {};

  const allowedDocs = [
    'appSettings', 'featureFlags', 'announcement', 'remoteConfig',
    'membership', 'subscriptionPlans', 'premiumFeatures', 'promo_codes',
  ];

  if (!docId || !allowedDocs.includes(docId)) {
    throw new HttpsError('invalid-argument', `Invalid docId '${docId}'. Allowed: ${allowedDocs.join(', ')}.`);
  }

  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Data object must be provided.');
  }

  const configRef = db.collection('global_config').doc(docId);
  await configRef.set({
    ...data,
    _updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    _updatedBy: callerUid,
  }, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', `CONFIG_UPDATED_${docId.toUpperCase()}`, null, {
    docId,
    keys: Object.keys(data),
  });

  return {
    success: true,
    message: `Successfully updated global_config/${docId}.`,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// getBillingAccountBinding — Authenticated account-binding generator.
// Computes and returns the caller's own opaque HMAC-SHA256 account-binding
// identifier for Google Play Billing (setObfuscatedAccountId).
// Requires Firebase Authentication. Never exposes or logs the server secret.
// Strictly fails closed if the server secret is unconfigured.
// ═══════════════════════════════════════════════════════════════════════════
exports.getBillingAccountBinding = onCall({ secrets: [playAccountBindingSecret] }, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to obtain billing account binding.');
  }

  const callerUid = request.auth.uid;
  const secretKey = process.env.PLAY_ACCOUNT_BINDING_SECRET;

  if (!secretKey || secretKey.trim().length === 0) {
    console.error('[GooglePlayBilling] Missing PLAY_ACCOUNT_BINDING_SECRET in environment.');
    throw new HttpsError('failed-precondition', 'Billing account binding service is temporarily unconfigured.');
  }

  const obfuscatedAccountId = computeObfuscatedAccountId(callerUid, secretKey);

  return {
    obfuscatedAccountId,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// verifyGooglePlayPurchase — Server-side purchase verification.
// Authoritatively verifies purchase with Google Play Developer API,
// validates SHA-256 token idempotency and HMAC account binding,
// manages linked purchase token transitions, acknowledges eligible purchases,
// and updates user_subscriptions with Admin SDK.
// ═══════════════════════════════════════════════════════════════════════════
exports.verifyGooglePlayPurchase = onCall({ secrets: [googlePlayCredentialsSecret, playAccountBindingSecret] }, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to verify purchases.');
  }

  const callerUid = request.auth.uid;
  const { packageName, productId, purchaseToken } = request.data || {};

  const bindingSecret = process.env.PLAY_ACCOUNT_BINDING_SECRET;
  if (!bindingSecret || bindingSecret.trim().length === 0) {
    console.error('[GooglePlayVerification] Missing PLAY_ACCOUNT_BINDING_SECRET in environment.');
    throw new HttpsError('failed-precondition', 'Purchase verification service is temporarily unconfigured.');
  }

  // 1. Validate request shape and strict product/package allowlists
  const verifier = new GooglePlayVerifier({
    credentialsJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || null,
    accountBindingSecret: bindingSecret,
  });

  const reqValidation = verifier.validateRequest({ packageName, productId, purchaseToken });
  if (!reqValidation.valid) {
    throw new HttpsError('invalid-argument', reqValidation.error);
  }

  const { cleanPackageName, cleanProductId, cleanPurchaseToken, tokenHash, productConfig } = reqValidation;

  // 2. Query Google Play Developer API purchases.subscriptionsv2
  let playPurchaseData;
  try {
    playPurchaseData = await verifier.fetchSubscriptionV2(cleanPackageName, cleanPurchaseToken);
  } catch (error) {
    console.error(`[GooglePlayVerification] API error for UID ${callerUid}:`, error.message);
    const statusCode = error.response?.status || error.status;
    if (statusCode === 404) {
      throw new HttpsError('not-found', 'The provided purchase token was not found on Google Play.');
    }
    if (statusCode === 400) {
      throw new HttpsError('invalid-argument', 'The provided purchase token is invalid or malformed.');
    }
    throw new HttpsError('internal', 'Unable to reach Google Play verification services. Please try again.');
  }

  // 3. Evaluate entitlement server-side
  const entitlement = verifier.evaluateEntitlement(playPurchaseData, cleanProductId, callerUid);

  if (entitlement.crossAccountTamper) {
    console.warn(`[Security Alert] Cross-account purchase token reuse detected: caller ${callerUid} vs token owner ${entitlement.linkedAccountId}`);
    await writeAuditLog(callerUid, 'user', 'PURCHASE_TOKEN_REPLAY_ATTEMPT', callerUid, {
      tokenHash,
      linkedAccountId: entitlement.linkedAccountId,
    });
    throw new HttpsError('permission-denied', entitlement.reason);
  }

  // Explicit PENDING check: Pending transactions NEVER grant Pro or acknowledgement
  if (!entitlement.hasActivePro) {
    console.warn(`[GooglePlayVerification] Purchase not active for UID ${callerUid}: ${entitlement.status} (${entitlement.reason || 'No active pro'})`);
    throw new HttpsError('failed-precondition', entitlement.reason || 'Purchase does not confer an active subscription.');
  }

  // 4. Server-Side Idempotency, Concurrency Lock & Atomic Ledger Persistence
  // Uses db.runTransaction to prevent race conditions when simultaneous requests with the same token arrive
  const tokenLockRef = db.collection('play_purchase_tokens').doc(tokenHash);
  const userSubRef = db.collection('user_subscriptions').doc(callerUid);
  // Robust ledger identity: orderId takes precedence to capture individual billing cycles,
  // falling back to tokenHash if orderId is not generated by Google Play
  const ledgerId = entitlement.orderId ? `gplay_order_${entitlement.orderId.replace(/[^a-zA-Z0-9_-]/g, '_')}` : `gplay_tx_${tokenHash}`;
  const txRef = db.collection('payment_transactions').doc(ledgerId);
  const userProfileRef = db.collection('app_users').doc(callerUid);

  let acknowledgedNow = false;

  await db.runTransaction(async (t) => {
    const [tokenLockSnap, userSubSnap, txSnap] = await Promise.all([
      t.get(tokenLockRef),
      t.get(userSubRef),
      t.get(txRef),
    ]);

    // A. Concurrency & Cross-Account Replay Check
    if (tokenLockSnap.exists) {
      const lockData = tokenLockSnap.data();
      if (lockData.userId !== callerUid) {
        console.warn(`[Security Alert] Token ${tokenHash.slice(0, 10)} already bound to UID ${lockData.userId}, caller is ${callerUid}`);
        throw new HttpsError('already-exists', 'This purchase token is already associated with another account.');
      }
    } else {
      // First legitimate redemption claims the token lock atomically
      t.set(tokenLockRef, {
        tokenHash,
        userId: callerUid,
        productId: cleanProductId,
        packageName: cleanPackageName,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // B. Protect existing manual_admin grants
    const existingSub = userSubSnap.exists ? userSubSnap.data() : null;
    if (existingSub && existingSub.provider === 'manual_admin' && (existingSub.planId === 'lifetime' || existingSub.isLifetime)) {
      console.log(`[GooglePlayVerification] Preserving lifetime manual_admin subscription for UID ${callerUid}`);
      return;
    }

    // C. Write authoritative subscription record (Admin SDK)
    const subRecord = {
      userId: callerUid,
      planId: entitlement.planId,
      status: 'ACTIVE',
      provider: 'google_play',
      productId: cleanProductId,
      packageName: cleanPackageName,
      tokenHash, // Authoritative idempotency key
      orderId: entitlement.orderId || null, // Stored purely as transaction metadata, NOT primary key
      linkedPurchaseToken: entitlement.linkedPurchaseToken || null,
      autoRenew: entitlement.autoRenewingPlan,
      expiryDate: entitlement.expiryDate,
      lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      rawPlayState: entitlement.rawPlayState,
      acknowledgementState: entitlement.acknowledgementState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: callerUid,
    };
    t.set(userSubRef, subRecord, { merge: true });

    // D. Sync to app_users for admin reporting
    t.set(userProfileRef, {
      planId: entitlement.planId,
      subscriptionStatus: 'ACTIVE',
      isPro: true,
      proGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // E. Idempotent Payment Transaction Ledger Write
    if (!txSnap.exists) {
      t.set(txRef, {
        transactionId: ledgerId,
        eventType: 'INITIAL_PURCHASE',
        tokenHash,
        orderId: entitlement.orderId || null,
        userId: callerUid,
        provider: 'google_play',
        productId: cleanProductId,
        planId: entitlement.planId,
        status: 'COMPLETED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  // 5. Backend Subscription Acknowledgement
  // Executed only after database transaction commits securely
  if (entitlement.requiresAcknowledgement) {
    try {
      await verifier.acknowledgeSubscription(cleanPackageName, cleanProductId, cleanPurchaseToken);
      acknowledgedNow = true;
      console.log(`[GooglePlayVerification] Successfully acknowledged purchase token ${tokenHash.slice(0, 12)}... on Google Play`);
      await userSubRef.update({
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
      });
    } catch (ackError) {
      console.warn(`[GooglePlayVerification] Acknowledgement attempt response for UID ${callerUid}:`, ackError.message);
    }
  }

  // 6. Linked Purchase Token Replacement (Upgrades / Downgrades / Crossgrades)
  if (entitlement.linkedPurchaseToken) {
    const oldTokenHash = hashPurchaseToken(entitlement.linkedPurchaseToken);
    console.log(`[GooglePlayVerification] Superseding linked token (hash: ${oldTokenHash}) for UID ${callerUid}`);
    const oldSubDocs = await db.collection('user_subscriptions')
      .where('tokenHash', '==', oldTokenHash)
      .get();

    for (const d of oldSubDocs.docs) {
      await d.ref.update({
        status: 'SUPERSEDED',
        supersededByTokenHash: tokenHash,
        supersededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  await writeAuditLog(callerUid, 'user', 'GOOGLE_PLAY_PURCHASE_VERIFIED', callerUid, {
    planId: entitlement.planId,
    productId: cleanProductId,
    tokenHash,
    orderId: entitlement.orderId || null,
    acknowledgedNow,
  });

  return {
    success: true,
    message: `Successfully verified Google Play subscription for plan '${productConfig.name}'.`,
    planId: entitlement.planId,
    status: 'ACTIVE',
    expiryDate: entitlement.expiryDate,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// handleGooglePlayRTDN — Google Play Real-Time Developer Notifications Handler.
// Triggered via Google Cloud Pub/Sub topic for Android Developer Notifications.
// Receives subscription lifecycle events (RENEWED, CANCELED, IN_GRACE_PERIOD,
// ON_HOLD, PAUSED, REVOKED, EXPIRED).
// Verifies token with Google Play Developer API, updates Firestore entitlement,
// and appends granular financial/lifecycle events to payment_transactions.
// ═══════════════════════════════════════════════════════════════════════════
exports.handleGooglePlayRTDN = onMessagePublished({
  topic: 'play-subscription-notifications',
  secrets: [googlePlayCredentialsSecret, playAccountBindingSecret]
}, async (event) => {
  const base64Data = event.data?.message?.data;
  if (!base64Data) {
    console.warn('[RTDN] Received Pub/Sub message with empty data payload.');
    return;
  }

  let parsedMessage;
  try {
    parsedMessage = parseRTDNMessage(base64Data);
  } catch (err) {
    console.error('[RTDN] Failed to parse message:', err.message);
    return;
  }

  // Check test notifications (Play Console ping)
  if (parsedMessage.testNotification) {
    console.log('[RTDN] Received Google Play test notification version:', parsedMessage.testNotification.version);
    return;
  }

  const { packageName, eventTimeMillis, subscriptionNotification } = parsedMessage;
  if (!subscriptionNotification) {
    console.log('[RTDN] Non-subscription notification received, skipping.');
    return;
  }

  if (packageName && packageName !== ALLOWED_PACKAGE_NAME) {
    console.warn(`[RTDN] Unauthorized packageName '${packageName}'. Expected '${ALLOWED_PACKAGE_NAME}'.`);
    return;
  }

  const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
  if (!purchaseToken) {
    console.warn('[RTDN] Missing purchaseToken in subscriptionNotification.');
    return;
  }

  const tokenHash = hashPurchaseToken(purchaseToken);
  const bindingSecret = process.env.PLAY_ACCOUNT_BINDING_SECRET;
  if (!bindingSecret) {
    console.error('[RTDN] PLAY_ACCOUNT_BINDING_SECRET missing in environment. Aborting RTDN processing.');
    return;
  }

  // 1. Resolve associated user via token lock registry
  const tokenLockSnap = await db.collection('play_purchase_tokens').doc(tokenHash).get();
  let targetUid = null;
  if (tokenLockSnap.exists) {
    targetUid = tokenLockSnap.data()?.userId;
  } else {
    // Fallback search in user_subscriptions by tokenHash
    const subQuerySnap = await db.collection('user_subscriptions')
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();
    if (!subQuerySnap.empty) {
      targetUid = subQuerySnap.docs[0].id;
    }
  }

  if (!targetUid) {
    console.warn(`[RTDN] No registered user found for token hash: ${tokenHash.slice(0, 10)}... (Type: ${notificationType})`);
    return;
  }

  // 2. Query Google Play Developer API purchases.subscriptionsv2 for authoritative state
  const verifier = new GooglePlayVerifier({
    credentialsJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || null,
    accountBindingSecret: bindingSecret,
  });

  let playData;
  try {
    playData = await verifier.fetchSubscriptionV2(ALLOWED_PACKAGE_NAME, purchaseToken);
  } catch (err) {
    console.error(`[RTDN] Google API error fetching token for UID ${targetUid}:`, err.message);
    return;
  }

  // 3. Evaluate Authoritative Entitlement
  const expectedProductId = subscriptionId || tokenLockSnap.data()?.productId;
  const entitlement = verifier.evaluateEntitlement(playData, expectedProductId, targetUid);

  // Map RTDN Notification Type to Event String
  let eventType = 'SUBSCRIPTION_EVENT';
  switch (notificationType) {
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_RECOVERED:
      eventType = 'RECOVERED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_RENEWED:
      eventType = 'RENEWED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_CANCELED:
      eventType = 'CANCELED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PURCHASED:
      eventType = 'PURCHASED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_ON_HOLD:
      eventType = 'ON_HOLD';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_IN_GRACE_PERIOD:
      eventType = 'IN_GRACE_PERIOD';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_RESTARTED:
      eventType = 'RESTARTED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PRICE_CHANGE_CONFIRMED:
      eventType = 'PRICE_CHANGE_CONFIRMED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_DEFERRED:
      eventType = 'DEFERRED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PAUSED:
      eventType = 'PAUSED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED:
      eventType = 'PAUSE_SCHEDULE_CHANGED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_REVOKED:
      eventType = 'REVOKED';
      break;
    case RTDN_SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRED:
      eventType = 'EXPIRED';
      break;
    default:
      eventType = `NOTIFICATION_${notificationType}`;
      break;
  }

  console.log(`[RTDN] Processing ${eventType} for UID: ${targetUid} (State: ${entitlement.status})`);

  // 4. Atomic Firestore Update: user_subscriptions, app_users, payment_transactions
  const userSubRef = db.collection('user_subscriptions').doc(targetUid);
  const userProfileRef = db.collection('app_users').doc(targetUid);

  // Granular Ledger Entry ID:
  // For RENEWED and other financial events, use orderId if present; otherwise combine tokenHash, eventType, and eventTimeMillis
  // This guarantees duplicate Pub/Sub delivery is strictly idempotent and does not generate duplicate ledger documents.
  const orderIdClean = entitlement.orderId ? entitlement.orderId.replace(/[^a-zA-Z0-9_-]/g, '_') : null;
  const ledgerId = orderIdClean ? `gplay_order_${orderIdClean}` : `gplay_event_${tokenHash.slice(0, 16)}_${eventType}_${eventTimeMillis || 0}`;
  const txRef = db.collection('payment_transactions').doc(ledgerId);

  await db.runTransaction(async (t) => {
    const userSubSnap = await t.get(userSubRef);
    const existingSub = userSubSnap.exists ? userSubSnap.data() : null;

    // Never downgrade manual admin lifetime grants
    if (existingSub && existingSub.provider === 'manual_admin' && (existingSub.planId === 'lifetime' || existingSub.isLifetime)) {
      console.log(`[RTDN] Preserving manual admin lifetime grant for UID ${targetUid}`);
      return;
    }

    // A. Update user_subscriptions
    t.set(userSubRef, {
      userId: targetUid,
      planId: entitlement.planId,
      status: entitlement.status,
      isPro: entitlement.hasActivePro,
      provider: 'google_play',
      productId: entitlement.productId || expectedProductId,
      packageName: ALLOWED_PACKAGE_NAME,
      tokenHash,
      orderId: entitlement.orderId || null,
      autoRenew: entitlement.autoRenewingPlan,
      // If entitlement is no longer active (revoked, expired, on-hold), ensure expiryDate reflects the authoritative date or now
      expiryDate: entitlement.expiryDate || (entitlement.hasActivePro ? existingSub?.expiryDate : new Date().toISOString()) || null,
      rawPlayState: entitlement.rawPlayState,
      lastRtdnEvent: eventType,
      lastRtdnTime: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // B. Sync app_users for quick feature check & admin UI
    t.set(userProfileRef, {
      planId: entitlement.planId,
      subscriptionStatus: entitlement.status,
      isPro: entitlement.hasActivePro,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // C. Write financial / lifecycle event to payment_transactions ledger
    t.set(txRef, {
      transactionId: ledgerId,
      eventType: `RTDN_${eventType}`,
      notificationType,
      tokenHash,
      orderId: entitlement.orderId || null,
      userId: targetUid,
      provider: 'google_play',
      productId: entitlement.productId || expectedProductId,
      planId: entitlement.planId,
      status: entitlement.hasActivePro ? 'COMPLETED' : 'INACTIVE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  // Acknowledge if eligible and pending
  if (entitlement.requiresAcknowledgement) {
    try {
      await verifier.acknowledgeSubscription(ALLOWED_PACKAGE_NAME, entitlement.productId, purchaseToken);
      await userSubRef.update({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' });
      console.log(`[RTDN] Acknowledged purchase token for UID ${targetUid}`);
    } catch (ackErr) {
      console.warn(`[RTDN] Acknowledgement notice for UID ${targetUid}:`, ackErr.message);
    }
  }

  await writeAuditLog(targetUid, 'system', `RTDN_${eventType}`, targetUid, {
    tokenHash,
    orderId: entitlement.orderId || null,
    status: entitlement.status,
    hasActivePro: entitlement.hasActivePro,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Canonical Feature Registry IDs for server-side validation
// ═══════════════════════════════════════════════════════════════════════════
const CANONICAL_FEATURE_IDS = [
  // 1. HOME
  'home_view', 'home_recent_items', 'home_quick_qr', 'home_quick_barcode', 'home_scanner_shortcut', 'home_batch_shortcut',
  // 2. QR_CONTENT
  'qr_text', 'qr_url', 'qr_wifi', 'qr_email', 'qr_phone', 'qr_sms', 'qr_vcard', 'qr_location', 'qr_pdf', 'qr_image', 'qr_audio', 'qr_document', 'qr_event', 'qr_crypto', 'qr_whatsapp', 'qr_youtube', 'qr_instagram', 'qr_facebook', 'qr_x', 'qr_linkedin',
  // 3. QR_ENGINE
  'qr_matrix_engine', 'qr_error_correction', 'qr_quiet_zone', 'qr_center_text', 'qr_size_custom',
  // 4. BARCODE_FORMATS
  'barcode_code128', 'barcode_code39', 'barcode_ean13', 'barcode_ean8', 'barcode_upca', 'barcode_upce', 'barcode_itf14', 'barcode_i25', 'barcode_codabar', 'barcode_code93', 'barcode_code11', 'barcode_msi', 'barcode_datamatrix', 'barcode_pdf417', 'barcode_aztec', 'barcode_gs1databar', 'barcode_gs1128', 'barcode_postnet', 'barcode_planet', 'barcode_royalmail', 'barcode_telepen', 'barcode_pharmacode', 'barcode_maxicode', 'barcode_qrcode', 'barcode_microqrcode', 'barcode_hanxin', 'barcode_codablockf', 'barcode_code16k', 'barcode_code49', 'barcode_channelcode',
  // 5. BARCODE_ENGINE
  'barcode_custom_colors', 'barcode_dimension_controls', 'barcode_text_display',
  // 6. SCANNER
  'scanner_camera_live', 'scanner_image_upload', 'scanner_flashlight', 'scanner_zoom', 'scanner_barcode_detect', 'scanner_result_actions',
  // 7. DESIGN
  'custom_logo_upload', 'custom_logo_presets', 'custom_colors_solid', 'custom_colors_gradient', 'custom_dot_styles', 'custom_eye_styles', 'custom_frames',
  // 8. TEMPLATES
  'templates_browse', 'templates_free_apply', 'templates_premium_apply', 'templates_save_custom', 'templates_cloud_library',
  // 9. EXPORT
  'export_png', 'export_jpg', 'export_svg', 'export_pdf', 'export_native_share',
  // 10. BATCH
  'batch_view', 'batch_csv_import', 'batch_manual_input', 'batch_custom_style', 'batch_zip_export',
  // 11. SAVED
  'saved_view', 'saved_save_action', 'saved_delete_action', 'saved_search_filter',
  // 12. HISTORY
  'history_view', 'history_save_auto', 'history_delete_item', 'history_clear_all',
  // 13. CLOUD
  'cloud_sync_auto', 'cloud_firestore_mirror', 'cloud_template_upload', 'cloud_preferences_sync',
  // 14. SETTINGS
  'settings_view', 'settings_theme_toggle', 'settings_save_location', 'settings_haptics',
  // 15. ACCOUNT
  'account_view', 'account_google_signin', 'account_subscription_status', 'account_logout',
  // Legacy Compatibility IDs
  'qr_generator', 'barcode_generator', 'scanner', 'history', 'saved', 'cloud_sync', 'custom_logo', 'custom_colors', 'custom_shapes', 'premium_templates', 'bulk_generation', 'save_location'
];

// ═══════════════════════════════════════════════════════════════════════════
// updateFeatureFlag — Global feature enable/disable toggle.
// ═══════════════════════════════════════════════════════════════════════════
exports.updateFeatureFlag = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { featureId, enabled } = request.data || {};

  if (!featureId || !CANONICAL_FEATURE_IDS.includes(featureId)) {
    throw new HttpsError('invalid-argument', `Invalid featureId '${featureId}'. Must be one of canonical Feature Registry.`);
  }

  if (typeof enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Enabled parameter must be a boolean value.');
  }

  const flagsRef = db.collection('global_config').doc('featureFlags');
  const snap = await flagsRef.get();
  const currentFlags = snap.exists ? snap.data() : {};
  const previousValue = currentFlags[featureId] !== undefined ? currentFlags[featureId] : true;

  await flagsRef.set({
    [featureId]: enabled,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: callerUid,
  }, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'FEATURE_FLAG_UPDATED', null, {
    featureId,
    previousValue,
    newValue: enabled,
  });

  return {
    success: true,
    message: `Successfully updated feature flag '${featureId}' to ${enabled}.`,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// updatePlanFeatures — Updates feature list for a subscription plan.
// ═══════════════════════════════════════════════════════════════════════════
exports.updatePlanFeatures = onCall(async (request) => {
  requireSuperAdmin(request);

  const callerUid = request.auth.uid;
  const { planId, features } = request.data || {};
  const allowedPlans = ['free', 'weekly', 'monthly', 'yearly'];

  if (!planId || !allowedPlans.includes(planId)) {
    throw new HttpsError('invalid-argument', `Invalid planId '${planId}'. Allowed plans: ${allowedPlans.join(', ')}.`);
  }

  if (!Array.isArray(features)) {
    throw new HttpsError('invalid-argument', 'Features parameter must be an array of canonical feature IDs.');
  }

  // Validate every feature ID and check for duplicates
  const validatedFeatures = [];
  for (const fId of features) {
    if (!CANONICAL_FEATURE_IDS.includes(fId)) {
      throw new HttpsError('invalid-argument', `Unknown feature ID '${fId}' cannot be assigned to plan.`);
    }
    if (!validatedFeatures.includes(fId)) {
      validatedFeatures.push(fId);
    }
  }

  const planRef = db.collection('subscription_plans').doc(planId);
  const snap = await planRef.get();
  const previousData = snap.exists ? snap.data() : {};

  const updatedData = {
    planId,
    name: planId.charAt(0).toUpperCase() + planId.slice(1),
    enabled: true,
    features: validatedFeatures,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: callerUid,
  };

  await planRef.set(updatedData, { merge: true });

  await writeAuditLog(callerUid, 'super_admin', 'PLAN_FEATURES_UPDATED', null, {
    planId,
    previousFeatures: previousData.features || [],
    newFeatures: validatedFeatures,
  });

  return {
    success: true,
    message: `Successfully updated features for plan '${planId}'.`,
    featureCount: validatedFeatures.length,
  };
});
