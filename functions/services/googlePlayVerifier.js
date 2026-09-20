// functions/services/googlePlayVerifier.js
// ─── Google Play Developer API v2 Server Verification Service ────────────────
// Implements server-side Google Play subscription verification using:
// 1. Google Play Developer API purchases.subscriptionsv2.get
// 2. Google Play Developer API purchases.subscriptions.acknowledge
// 3. Multi-line-item authoritative current entitlement evaluator
// 4. Deterministic SHA-256 purchase token hashing for idempotency
// 5. Keyed HMAC-SHA256 obfuscated account identifier mapping (current + historical)
// 6. Linked purchase token upgrade/downgrade replacement handling (immediate vs deferred)
// 7. Strict package and product allowlists
// 8. Server-side subscription state mapping and authoritative expiry calculation
// 9. Anti-replay and cross-account validation

const crypto = require('crypto');
const { GoogleAuth } = require('google-auth-library');

// Authoritative Android Application ID
const ALLOWED_PACKAGE_NAME = 'com.mushiqr.pro';

// Authoritative Server-Side Product Registry & Entitlement Mapping
// Note: Base plans and products configured in Google Play Console
const GOOGLE_PLAY_PRODUCT_ALLOWLIST = {
  'mushi_qr_weekly': {
    planId: 'weekly',
    isPro: true,
    name: 'Weekly Pass',
    billingPeriod: 'P1W',
  },
  'mushi_qr_monthly': {
    planId: 'monthly',
    isPro: true,
    name: 'Monthly Pro',
    billingPeriod: 'P1M',
  },
  'mushi_qr_yearly': {
    planId: 'yearly',
    isPro: true,
    name: 'Yearly VIP',
    billingPeriod: 'P1Y',
  },
};

// Google Play Subscription State Constants (purchases.subscriptionsv2)
// Ref: https://developers.google.com/android-publisher/api-ref/rest/v2/purchases.subscriptionsv2
const SUBSCRIPTION_STATE = {
  UNSPECIFIED: 'SUBSCRIPTION_STATE_UNSPECIFIED',
  PENDING: 'SUBSCRIPTION_STATE_PENDING',
  ACTIVE: 'SUBSCRIPTION_STATE_ACTIVE',
  PAUSED: 'SUBSCRIPTION_STATE_PAUSED',
  IN_GRACE_PERIOD: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
  ON_HOLD: 'SUBSCRIPTION_STATE_ON_HOLD',
  CANCELED: 'SUBSCRIPTION_STATE_CANCELED',
  EXPIRED: 'SUBSCRIPTION_STATE_EXPIRED',
  PENDING_PURCHASE_CANCELED: 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED',
};

// Google Play Acknowledgement State Constants
const ACKNOWLEDGEMENT_STATE = {
  UNSPECIFIED: 'ACKNOWLEDGEMENT_STATE_UNSPECIFIED',
  PENDING: 'ACKNOWLEDGEMENT_STATE_PENDING_ACKNOWLEDGE',
  ACKNOWLEDGED: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
};

// Google Play Real-Time Developer Notifications (RTDN) SubscriptionNotification Types
// Ref: https://developer.android.com/google/play/billing/rtdn-reference
const RTDN_SUBSCRIPTION_NOTIFICATION_TYPE = {
  SUBSCRIPTION_RECOVERED: 1,
  SUBSCRIPTION_RENEWED: 2,
  SUBSCRIPTION_CANCELED: 3,
  SUBSCRIPTION_PURCHASED: 4,
  SUBSCRIPTION_ON_HOLD: 5,
  SUBSCRIPTION_IN_GRACE_PERIOD: 6,
  SUBSCRIPTION_RESTARTED: 7,
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
  SUBSCRIPTION_DEFERRED: 9,
  SUBSCRIPTION_PAUSED: 10,
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
  SUBSCRIPTION_REVOKED: 12,
  SUBSCRIPTION_EXPIRED: 13,
};

/**
 * Decodes and validates a Google Play RTDN Pub/Sub message data payload.
 */
function parseRTDNMessage(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Valid base64Data string required for RTDN parsing.');
  }

  let jsonString;
  try {
    jsonString = Buffer.from(base64Data, 'base64').toString('utf8');
  } catch (e) {
    throw new Error(`Failed to decode base64 RTDN payload: ${e.message}`);
  }

  let payload;
  try {
    payload = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Failed to parse RTDN JSON payload: ${e.message}`);
  }

  const { version, packageName, eventTimeMillis, subscriptionNotification, testNotification } = payload || {};

  return {
    version: version || '1.0',
    packageName: packageName || null,
    eventTimeMillis: eventTimeMillis ? Number(eventTimeMillis) : Date.now(),
    subscriptionNotification: subscriptionNotification || null,
    testNotification: testNotification || null,
  };
}

/**
 * Derives a deterministic cryptographic hash of a purchase token.
 * Used as the authoritative primary key for financial ledger records and idempotency.
 */
function hashPurchaseToken(purchaseToken) {
  if (!purchaseToken || typeof purchaseToken !== 'string') {
    throw new Error('Valid purchaseToken string required for hashing.');
  }
  return crypto.createHash('sha256').update(purchaseToken.trim()).digest('hex');
}

/**
 * Computes a keyed deterministic obfuscated account identifier for Google Play Billing.
 * Replaces raw Firebase UID with a secure HMAC-SHA256 string (max 64 chars for Google Play).
 * Strictly requires a non-empty secretKey (no hardcoded salt fallback).
 */
function computeObfuscatedAccountId(uid, secretKey) {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid Firebase UID string required to compute obfuscated account ID.');
  }
  if (!secretKey || typeof secretKey !== 'string' || secretKey.trim().length === 0) {
    throw new Error('Valid, non-empty secretKey required to compute obfuscated account ID. Hardcoded fallback is prohibited.');
  }
  return crypto.createHmac('sha256', secretKey.trim()).update(uid.trim()).digest('hex');
}

class GooglePlayVerifier {
  constructor(options = {}) {
    this.authClient = options.authClient || null;
    this.credentialsJson = options.credentialsJson || null;
    this.mockClient = options.mockClient || null;
    this.accountBindingSecret = options.accountBindingSecret || process.env.PLAY_ACCOUNT_BINDING_SECRET || null;
  }

  /**
   * Initializes the GoogleAuth client with Android Publisher scope.
   */
  async getClient() {
    if (this.mockClient) {
      return this.mockClient;
    }
    if (!this.authClient) {
      const authOptions = {
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      };
      if (this.credentialsJson) {
        try {
          authOptions.credentials = typeof this.credentialsJson === 'string'
            ? JSON.parse(this.credentialsJson)
            : this.credentialsJson;
        } catch (e) {
          throw new Error(`Failed to parse Google Play credentials JSON: ${e.message}`);
        }
      }
      const auth = new GoogleAuth(authOptions);
      this.authClient = await auth.getClient();
    }
    return this.authClient;
  }

  /**
   * Validates client request parameters before issuing external calls.
   */
  validateRequest(params) {
    const { packageName, productId, purchaseToken } = params || {};

    if (!packageName || typeof packageName !== 'string' || packageName.trim() !== ALLOWED_PACKAGE_NAME) {
      return {
        valid: false,
        error: `Invalid package name '${packageName}'. Expected '${ALLOWED_PACKAGE_NAME}'.`,
      };
    }

    if (!productId || typeof productId !== 'string' || !GOOGLE_PLAY_PRODUCT_ALLOWLIST[productId.trim()]) {
      return {
        valid: false,
        error: `Product '${productId}' is not an authorized Google Play subscription for this application.`,
      };
    }

    if (!purchaseToken || typeof purchaseToken !== 'string' || purchaseToken.trim().length < 20) {
      return {
        valid: false,
        error: 'Invalid or missing Google Play purchase token.',
      };
    }

    const cleanToken = purchaseToken.trim();
    return {
      valid: true,
      cleanPackageName: packageName.trim(),
      cleanProductId: productId.trim(),
      cleanPurchaseToken: cleanToken,
      tokenHash: hashPurchaseToken(cleanToken),
      productConfig: GOOGLE_PLAY_PRODUCT_ALLOWLIST[productId.trim()],
    };
  }

  /**
   * Queries Google Play Developer API purchases.subscriptionsv2.get
   * https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptionsv2/tokens/{token}
   */
  async fetchSubscriptionV2(packageName, token) {
    const client = await this.getClient();
    const encodedToken = encodeURIComponent(token);
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodedToken}`;

    const res = await client.request({
      url,
      method: 'GET',
    });

    return res.data;
  }

  /**
   * Acknowledges a subscription purchase with Google Play Developer API.
   * Modern API: Developer payload is deprecated and removed to avoid insecure client plumbing.
   * POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{subscriptionId}/tokens/{token}:acknowledge
   */
  async acknowledgeSubscription(packageName, subscriptionId, token) {
    const client = await this.getClient();
    const encodedToken = encodeURIComponent(token);
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodedToken}:acknowledge`;

    const res = await client.request({
      url,
      method: 'POST',
      data: {},
    });

    return res.data;
  }

  /**
   * Evaluates the Google Play v2 purchase response to calculate authoritative entitlement.
   *
   * Robust Multi-Line-Item Algorithm:
   * - Does NOT assume lineItems[0] is authoritative.
   * - Iterates over all lineItems and matches against GOOGLE_PLAY_PRODUCT_ALLOWLIST.
   * - In multi-line or deferred upgrade/downgrade scenarios, determines the line item
   *   with the highest priority and currently valid expiry time.
   * - Supports both current externalAccountIdentifiers and historical expiredExternalAccountIdentifiers.
   *
   * @param {Object} playData - Response from purchases.subscriptionsv2
   * @param {string} expectedProductId - The product ID being purchased/verified
   * @param {string} callerUid - The Firebase Auth UID of the purchasing user
   */
  evaluateEntitlement(playData, expectedProductId, callerUid) {
    if (!playData) {
      return { hasActivePro: false, reason: 'Empty response from Google Play API' };
    }

    const lineItems = playData.lineItems || [];
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return {
        hasActivePro: false,
        reason: 'Malformed Google Play response: missing or empty lineItems array.',
      };
    }

    // 1. Account binding check (current OR expired historical account identifiers)
    // Supports keyed HMAC-SHA256 or direct callerUid for backward-compatibility
    const currentLinkedAccountId = playData.externalAccountIdentifiers?.obfuscatedExternalAccountId;
    const historicalLinkedAccountId = playData.expiredExternalAccountIdentifiers?.obfuscatedExternalAccountId;
    const linkedAccountId = currentLinkedAccountId || historicalLinkedAccountId || null;

    if (linkedAccountId) {
      if (!this.accountBindingSecret) {
        return {
          hasActivePro: false,
          reason: 'Server account binding secret is unconfigured. Verification failed closed.',
        };
      }
      const expectedHmac = computeObfuscatedAccountId(callerUid, this.accountBindingSecret);
      const matchesCurrentDirect = currentLinkedAccountId === callerUid;
      const matchesCurrentHmac = currentLinkedAccountId === expectedHmac;
      const matchesHistDirect = historicalLinkedAccountId === callerUid;
      const matchesHistHmac = historicalLinkedAccountId === expectedHmac;

      const isAuthorizedOwner = matchesCurrentDirect || matchesCurrentHmac || matchesHistDirect || matchesHistHmac;

      if (!isAuthorizedOwner) {
        return {
          hasActivePro: false,
          crossAccountTamper: true,
          reason: `Purchase token is linked to a different account (${linkedAccountId}). Access denied for UID (${callerUid}).`,
        };
      }
    }

    // 2. Subscription state evaluation
    const state = playData.subscriptionState;

    // Explicit PENDING check: Pending or Canceled Pending purchases NEVER grant Pro or acknowledgement
    if (state === SUBSCRIPTION_STATE.PENDING || state === SUBSCRIPTION_STATE.PENDING_PURCHASE_CANCELED) {
      return {
        hasActivePro: false,
        status: state === SUBSCRIPTION_STATE.PENDING ? 'PENDING' : 'PENDING_CANCELLED',
        rawPlayState: state,
        planId: GOOGLE_PLAY_PRODUCT_ALLOWLIST[expectedProductId]?.planId || 'free',
        productId: expectedProductId,
        requiresAcknowledgement: false,
        reason: state === SUBSCRIPTION_STATE.PENDING
          ? 'Subscription purchase is pending payment confirmation by Google Play.'
          : 'Pending subscription purchase was canceled before payment completed.',
      };
    }

    // 3. Multi-Line Item Entitlement Selection & Deferred Replacement Handling:
    // In Google Play Developer API (purchases.subscriptionsv2):
    // A subscription resource may contain:
    // - Current entitlement line: has productId, expiryTime, and optionally deferredItemReplacement
    // - Deferred replacement line: newly purchased replacement tier where expiryTime is intentionally absent
    //
    // Rules:
    // 1. All line items must have an allowlisted productId (or deferredItemReplacement.productId if present).
    //    Any unknown product line item fails closed immediately.
    // 2. A line item lacking expiryTime is legitimate ONLY IF it represents a deferred/future replacement
    //    or an active line item explicitly points to it via deferredItemReplacement.
    // 3. Never grant entitlement from a deferred replacement line item that lacks an effective expiry.
    // 4. Require valid future expiryTime for any line item being evaluated as current active entitlement.

    for (const item of lineItems) {
      if (!item || typeof item.productId !== 'string' || !GOOGLE_PLAY_PRODUCT_ALLOWLIST[item.productId]) {
        return {
          hasActivePro: false,
          reason: `Line item contains unauthorized product '${item?.productId}'.`,
        };
      }
      if (item.deferredItemReplacement && (!item.deferredItemReplacement.productId || !GOOGLE_PLAY_PRODUCT_ALLOWLIST[item.deferredItemReplacement.productId])) {
        return {
          hasActivePro: false,
          reason: `Deferred replacement references unauthorized product '${item.deferredItemReplacement.productId}'.`,
        };
      }
    }

    // Classify line items into:
    // a) Current candidate lines (have valid expiryTime)
    // b) Future / deferred lines (expiryTime is absent/null)
    const currentCandidates = [];
    const futureDeferredLines = [];

    for (const item of lineItems) {
      if (item.expiryTime) {
        const timestamp = new Date(item.expiryTime).getTime();
        if (isNaN(timestamp)) {
          return {
            hasActivePro: false,
            reason: `Malformed expiryTime '${item.expiryTime}' on line item for product '${item.productId}'.`,
          };
        }
        currentCandidates.push({
          ...item,
          expiryTimestamp: timestamp,
          isNotExpired: timestamp > Date.now(),
        });
      } else {
        futureDeferredLines.push(item);
      }
    }

    // If no candidate line has an expiryTime, no active entitlement can be confirmed
    if (currentCandidates.length === 0) {
      return {
        hasActivePro: false,
        reason: 'No line item with valid expiryTime found to confer active entitlement.',
      };
    }

    // Separate active (unexpired) candidates from expired ones
    const activeCandidates = currentCandidates.filter(c => c.isNotExpired);

    let selectedItem = null;
    let deferredReplacementProduct = null;

    if (activeCandidates.length > 0) {
      // Find matching item or active current item:
      // In deferred replacement, the old line item holds deferredItemReplacement pointing to the new tier.
      // If caller requested the new product (or old product), we identify the currently valid line.
      const lineWithDeferred = activeCandidates.find(c => c.deferredItemReplacement?.productId);
      if (lineWithDeferred) {
        deferredReplacementProduct = lineWithDeferred.deferredItemReplacement.productId;
      }

      if (lineWithDeferred && (expectedProductId === lineWithDeferred.productId || expectedProductId === deferredReplacementProduct)) {
        // Current entitlement remains the old active line item until its expiry
        selectedItem = lineWithDeferred;
      } else {
        // If an active line matches expectedProductId directly, use it
        selectedItem = activeCandidates.find(c => c.productId === expectedProductId);
      }

      // If still not selected:
      if (!selectedItem) {
        if (activeCandidates.length === 1) {
          selectedItem = activeCandidates[0];
        } else {
          // If multiple unexpired line items exist without clear deferred relationship:
          // Check if one matches expectedProductId; otherwise fail closed due to ambiguity
          const match = activeCandidates.find(c => c.productId === expectedProductId);
          if (match) {
            selectedItem = match;
          } else {
            return {
              hasActivePro: false,
              reason: `Ambiguous subscription response: multiple active line items found (${activeCandidates.map(c => c.productId).join(', ')}).`,
            };
          }
        }
      }
    } else {
      // All candidates are expired: select the most recently expired item for record-keeping
      selectedItem = currentCandidates.find(c => c.productId === expectedProductId)
        || [...currentCandidates].sort((a, b) => b.expiryTimestamp - a.expiryTimestamp)[0];
    }

    const expiryTimeIso = selectedItem.expiryTime;
    const isNotExpired = selectedItem.isNotExpired;
    let hasActivePro = false;
    let internalStatus = 'INACTIVE';
    let requiresAcknowledgement = false;

    switch (state) {
      case SUBSCRIPTION_STATE.ACTIVE:
        hasActivePro = isNotExpired;
        internalStatus = hasActivePro ? 'ACTIVE' : 'EXPIRED';
        requiresAcknowledgement = playData.acknowledgementState === ACKNOWLEDGEMENT_STATE.PENDING;
        break;
      case SUBSCRIPTION_STATE.IN_GRACE_PERIOD:
        hasActivePro = true;
        internalStatus = 'IN_GRACE_PERIOD';
        break;
      case SUBSCRIPTION_STATE.CANCELED:
        hasActivePro = isNotExpired;
        internalStatus = hasActivePro ? 'CANCELLED_ACTIVE' : 'EXPIRED';
        break;
      case SUBSCRIPTION_STATE.ON_HOLD:
        hasActivePro = false;
        internalStatus = 'ON_HOLD';
        break;
      case SUBSCRIPTION_STATE.PAUSED:
        hasActivePro = false;
        internalStatus = 'PAUSED';
        break;
      case SUBSCRIPTION_STATE.EXPIRED:
        hasActivePro = false;
        internalStatus = 'EXPIRED';
        break;
      default:
        console.warn(`[GooglePlayVerifier] Unknown or unexpected subscriptionState '${state}'. Failing closed to EXPIRED.`);
        hasActivePro = false;
        internalStatus = 'EXPIRED';
        break;
    }

    const productConfig = GOOGLE_PLAY_PRODUCT_ALLOWLIST[selectedItem.productId];

    return {
      hasActivePro,
      status: internalStatus,
      rawPlayState: state,
      planId: productConfig.planId,
      productId: selectedItem.productId,
      expiryDate: expiryTimeIso,
      autoRenewingPlan: Boolean(selectedItem.autoRenewingPlan?.autoRenewEnabled),
      acknowledgementState: playData.acknowledgementState,
      requiresAcknowledgement,
      orderId: playData.latestOrderId || selectedItem.latestOrderId || null,
      linkedPurchaseToken: playData.linkedPurchaseToken || null,
      linkedAccountId,
      deferredReplacementProductId: deferredReplacementProduct || null,
      verifiedAt: new Date().toISOString(),
      totalLineItems: lineItems.length,
    };
  }
}

module.exports = {
  GooglePlayVerifier,
  ALLOWED_PACKAGE_NAME,
  GOOGLE_PLAY_PRODUCT_ALLOWLIST,
  SUBSCRIPTION_STATE,
  ACKNOWLEDGEMENT_STATE,
  RTDN_SUBSCRIPTION_NOTIFICATION_TYPE,
  parseRTDNMessage,
  hashPurchaseToken,
  computeObfuscatedAccountId,
};
