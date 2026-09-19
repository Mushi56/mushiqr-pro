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
  hashPurchaseToken,
  computeObfuscatedAccountId,
  deriveLedgerTransactionId,
  RTDN_NOTIFICATION_TYPES,
  ALLOWED_PACKAGE_NAME,
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
    const listResult = await admin.auth().listUsers(1000);
    const superAdminCount = listResult.users.filter(u => u.customClaims && u.customClaims.role === 'super_admin').length;

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

  const validPlanId = planId || (isPro ? 'monthly' : 'free');
  const proActive = Boolean(isPro) || validPlanId !== 'free';
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
// ═══════════════════════════════════════════════════════════════════════════
exports.getBillingAccountBinding = onCall({ secrets: [playAccountBindingSecret] }, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to obtain billing account binding.');
  }

  const callerUid = request.auth.uid;
  const secretKey = process.env.PLAY_ACCOUNT_BINDING_SECRET;
  if (!secretKey || typeof secretKey !== 'string' || secretKey.trim().length === 0) {
    throw new HttpsError('failed-precondition', 'Billing account-binding configuration is missing on the server. Fails closed.');
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

  // 1. Validate request shape and strict product/package allowlists
  const verifier = new GooglePlayVerifier({
    credentialsJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || null,
    accountBindingSecret: process.env.PLAY_ACCOUNT_BINDING_SECRET || null,
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
  const transactionId = `gplay_tx_${tokenHash}`;
  const txRef = db.collection('payment_transactions').doc(transactionId);
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
    // Writes initial purchase activation record with both token identity and event-level identity
    if (!txSnap.exists) {
      t.set(txRef, {
        transactionId,
        tokenHash,
        orderId: entitlement.orderId || null,
        userId: callerUid,
        provider: 'google_play',
        productId: cleanProductId,
        planId: entitlement.planId,
        eventType: 'PURCHASE_INITIAL',
        status: 'COMPLETED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Granular event ledger record for financial auditing
    const eventTxId = deriveLedgerTransactionId(tokenHash, entitlement.orderId, 'PURCHASE_INITIAL');
    const eventTxRef = db.collection('payment_transactions').doc(eventTxId);
    t.set(eventTxRef, {
      transactionId: eventTxId,
      tokenHash,
      orderId: entitlement.orderId || null,
      userId: callerUid,
      provider: 'google_play',
      productId: cleanProductId,
      planId: entitlement.planId,
      eventType: 'PURCHASE_INITIAL',
      status: 'COMPLETED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
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

// ═══════════════════════════════════════════════════════════════════════════
// handleGooglePlayRtdn — Real-Time Developer Notifications (RTDN) Pub/Sub Handler.
// Processes asynchronous Google Play subscription lifecycle events (renewals,
// cancellations, grace periods, on-hold, pauses, expirations, revocations).
// Re-verifies state authoritatively with Google Play Developer API before updating.
// ═══════════════════════════════════════════════════════════════════════════
exports.handleGooglePlayRtdn = onMessagePublished({
  topic: 'play-subs-rtdn',
  secrets: [googlePlayCredentialsSecret, playAccountBindingSecret],
}, async (event) => {
  let messageData = null;
  try {
    const rawString = Buffer.from(event.data.message.data, 'base64').toString('utf8');
    messageData = JSON.parse(rawString);
  } catch (err) {
    console.error('[RTDN] Failed to parse Pub/Sub message data:', err.message);
    return;
  }

  // 1. Check for Play Console test ping
  if (messageData.testNotification) {
    console.log('[RTDN] Received Google Play testNotification. Version:', messageData.testNotification.version);
    return;
  }

  const subNotification = messageData.subscriptionNotification;
  if (!subNotification) {
    console.warn('[RTDN] Pub/Sub message does not contain a subscriptionNotification. Ignoring.');
    return;
  }

  const {
    notificationType,
    purchaseToken,
    subscriptionId,
  } = subNotification;

  const eventName = RTDN_NOTIFICATION_TYPES[notificationType] || `UNKNOWN_TYPE_${notificationType}`;
  const tokenHash = hashPurchaseToken(purchaseToken);

  console.log(`[RTDN] Processing event ${eventName} (Type: ${notificationType}) for product ${subscriptionId}. TokenHash: ${tokenHash.slice(0, 10)}...`);

  // 2. Identify subscription owner from authoritative token lock registry
  const tokenLockSnap = await db.collection('play_purchase_tokens').doc(tokenHash).get();
  if (!tokenLockSnap.exists) {
    console.warn(`[RTDN] No registered user found for tokenHash ${tokenHash.slice(0, 10)}... (Event: ${eventName})`);
    return;
  }

  const { userId, packageName } = tokenLockSnap.data();
  if (!userId) {
    console.warn(`[RTDN] Token lock record missing userId for tokenHash ${tokenHash.slice(0, 10)}...`);
    return;
  }

  // 3. Query Google Play Developer API purchases.subscriptionsv2 authoritatively
  const verifier = new GooglePlayVerifier({
    credentialsJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || null,
    accountBindingSecret: process.env.PLAY_ACCOUNT_BINDING_SECRET || null,
  });

  let playData = null;
  try {
    playData = await verifier.fetchSubscriptionV2(packageName || ALLOWED_PACKAGE_NAME, purchaseToken);
  } catch (apiErr) {
    console.error(`[RTDN] Error querying Google Play API for tokenHash ${tokenHash.slice(0, 10)}...:`, apiErr.message);
    return;
  }

  // 4. Evaluate authoritative entitlement
  const entitlement = verifier.evaluateEntitlement(playData, subscriptionId, userId);

  // 5. Update user_subscriptions and payment_transactions atomically
  const userSubRef = db.collection('user_subscriptions').doc(userId);
  const userProfileRef = db.collection('app_users').doc(userId);
  const eventTxId = deriveLedgerTransactionId(tokenHash, entitlement.orderId, eventName);
  const eventTxRef = db.collection('payment_transactions').doc(eventTxId);

  await db.runTransaction(async (t) => {
    const subSnap = await t.get(userSubRef);
    const existingSub = subSnap.exists ? subSnap.data() : null;

    // Preserve manual_admin lifetime grants unconditionally
    if (existingSub && existingSub.provider === 'manual_admin' && (existingSub.planId === 'lifetime' || existingSub.isLifetime)) {
      console.log(`[RTDN] Preserving manual_admin lifetime subscription for UID ${userId}`);
      return;
    }

    const hasActivePro = Boolean(entitlement.hasActivePro);
    const newStatus = hasActivePro ? 'ACTIVE' : (entitlement.status || 'EXPIRED');

    // Update user subscription record
    t.set(userSubRef, {
      userId,
      planId: entitlement.planId || 'free',
      status: newStatus,
      provider: 'google_play',
      productId: entitlement.productId || subscriptionId,
      tokenHash,
      orderId: entitlement.orderId || null,
      autoRenew: entitlement.autoRenewingPlan || false,
      expiryDate: entitlement.expiryDate || null,
      rawPlayState: entitlement.rawPlayState,
      lastRtdnEvent: eventName,
      lastRtdnNotificationType: notificationType,
      lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system_rtdn',
    }, { merge: true });

    // Sync to app_users
    t.set(userProfileRef, {
      planId: hasActivePro ? entitlement.planId : 'free',
      subscriptionStatus: newStatus,
      isPro: hasActivePro,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Record financial lifecycle event in ledger
    t.set(eventTxRef, {
      transactionId: eventTxId,
      tokenHash,
      orderId: entitlement.orderId || null,
      userId,
      provider: 'google_play',
      productId: entitlement.productId || subscriptionId,
      planId: entitlement.planId || 'free',
      eventType: eventName,
      rawNotificationType: notificationType,
      status: hasActivePro ? 'COMPLETED' : 'STATUS_UPDATE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await writeAuditLog(userId, 'system', `RTDN_${eventName}`, userId, {
    tokenHash,
    notificationType,
    orderId: entitlement.orderId || null,
    hasActivePro: entitlement.hasActivePro,
    planId: entitlement.planId,
  });

  console.log(`[RTDN] Successfully processed ${eventName} for UID ${userId}. ActivePro: ${entitlement.hasActivePro}`);
});
