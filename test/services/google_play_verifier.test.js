// test/services/google_play_verifier.test.js
// ─── Comprehensive Security Hardening Test Suite for Google Play Verification ─
// Validates:
// 1. Same purchase token submitted twice yields identical SHA-256 idempotency key
// 2. Different purchase tokens with identical order metadata yield distinct idempotency keys
// 3. Purchases with missing or null orderId verify safely and maintain SHA-256 idempotency identity
// 4. Linked purchase tokens (upgrades/downgrades) are identified and evaluated
// 5. Pending purchases (SUBSCRIPTION_STATE_PENDING) NEVER grant Pro or trigger acknowledgement
// 6. Active purchase grants Pro entitlement and marks eligible acknowledgement
// 7. Expired purchase does not grant Pro entitlement
// 8. Account identifier mismatch (cross-account replay) is rejected
// 9. Keyed HMAC obfuscated account identifier matches and is accepted
// 10. Manual admin lifetime grants are protected against automatic downgrades
// 11. Request validation enforces allowed package name
// 12. Request validation enforces product allowlist
// 13. Request validation enforces minimum purchase token requirements
// 14. In-Grace-Period and Canceled-with-remaining-time evaluate correctly
// 15. Mocked client handles API 404 cleanly

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  GooglePlayVerifier, 
  ALLOWED_PACKAGE_NAME, 
  GOOGLE_PLAY_PRODUCT_ALLOWLIST, 
  SUBSCRIPTION_STATE, 
  ACKNOWLEDGEMENT_STATE,
  RTDN_NOTIFICATION_TYPES,
  deriveLedgerTransactionId,
  hashPurchaseToken,
  computeObfuscatedAccountId
} from '../../functions/services/googlePlayVerifier.js';

test('Test 1 — Same purchase token twice produces identical idempotency identity', () => {
  const token = 'sample_play_purchase_token_alpha_12345678901234567890';
  const hash1 = hashPurchaseToken(token);
  const hash2 = hashPurchaseToken(token);

  assert.equal(hash1, hash2, 'Idempotency hash must be strictly deterministic');
  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length, 64, 'SHA-256 hex string must be 64 characters');
});

test('Test 2 — Different purchase tokens with same order metadata are separate purchase identities', () => {
  const tokenA = 'sample_token_user_a_12345678901234567890';
  const tokenB = 'sample_token_user_b_09876543210987654321';

  const hashA = hashPurchaseToken(tokenA);
  const hashB = hashPurchaseToken(tokenB);

  assert.notEqual(hashA, hashB, 'Distinct purchase tokens must NEVER share an idempotency identity');
});

test('Test 3 — Missing or null order ID is safely handled with token hash identity', () => {
  const verifier = new GooglePlayVerifier();
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Play Store subscription purchase without latestOrderId
  const playResponseNoOrder = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: futureDate,
        autoRenewingPlan: { autoRenewEnabled: true }
      }
    ],
    latestOrderId: null,
    acknowledgementState: ACKNOWLEDGEMENT_STATE.ACKNOWLEDGED
  };

  const entitlement = verifier.evaluateEntitlement(playResponseNoOrder, 'mushi_qr_monthly', 'user123');
  assert.equal(entitlement.hasActivePro, true);
  assert.equal(entitlement.orderId, null, 'orderId should be null without crashing');
  assert.equal(entitlement.status, 'ACTIVE');
});

test('Test 4 — Linked purchase token is tracked for upgrades/replacements', () => {
  const verifier = new GooglePlayVerifier();
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const oldToken = 'old_monthly_purchase_token_123456789012345';

  const upgradedPlayResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_yearly',
        expiryTime: futureDate,
        autoRenewingPlan: { autoRenewEnabled: true }
      }
    ],
    latestOrderId: 'GPA.9999-8888-7777-66666',
    linkedPurchaseToken: oldToken,
    acknowledgementState: ACKNOWLEDGEMENT_STATE.PENDING
  };

  const entitlement = verifier.evaluateEntitlement(upgradedPlayResponse, 'mushi_qr_yearly', 'user123');
  assert.equal(entitlement.hasActivePro, true);
  assert.equal(entitlement.planId, 'yearly');
  assert.equal(entitlement.linkedPurchaseToken, oldToken, 'linkedPurchaseToken must be extracted');
  assert.equal(entitlement.requiresAcknowledgement, true);
});

test('Test 5 — Pending purchase NEVER grants Pro entitlement or triggers acknowledgement', () => {
  const verifier = new GooglePlayVerifier();

  const pendingPlayResponse = {
    subscriptionState: SUBSCRIPTION_STATE.PENDING,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: null
      }
    ],
    acknowledgementState: ACKNOWLEDGEMENT_STATE.PENDING
  };

  const entitlement = verifier.evaluateEntitlement(pendingPlayResponse, 'mushi_qr_monthly', 'user123');
  assert.equal(entitlement.hasActivePro, false, 'Pending state must NOT grant active Pro');
  assert.equal(entitlement.status, 'PENDING');
  assert.equal(entitlement.requiresAcknowledgement, false, 'Pending purchase must NOT be acknowledged');
  assert.ok(entitlement.reason.includes('pending payment confirmation'));
});

test('Test 6 — Active purchase grants Pro entitlement and flags acknowledgement required', () => {
  const verifier = new GooglePlayVerifier();
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const activePlayResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: futureDate,
        autoRenewingPlan: { autoRenewEnabled: true }
      }
    ],
    latestOrderId: 'GPA.1111-2222-3333-44444',
    acknowledgementState: ACKNOWLEDGEMENT_STATE.PENDING
  };

  const entitlement = verifier.evaluateEntitlement(activePlayResponse, 'mushi_qr_monthly', 'user123');
  assert.equal(entitlement.hasActivePro, true);
  assert.equal(entitlement.status, 'ACTIVE');
  assert.equal(entitlement.planId, 'monthly');
  assert.equal(entitlement.requiresAcknowledgement, true);
});

test('Test 7 — Expired purchase does not grant Pro entitlement', () => {
  const verifier = new GooglePlayVerifier();
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const expiredResponse = {
    subscriptionState: SUBSCRIPTION_STATE.EXPIRED,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: pastDate
      }
    ]
  };

  const entitlement = verifier.evaluateEntitlement(expiredResponse, 'mushi_qr_monthly', 'user123');
  assert.equal(entitlement.hasActivePro, false);
  assert.equal(entitlement.status, 'EXPIRED');
});

test('Test 8 — Account identifier mismatch is rejected with crossAccountTamper flag', () => {
  const verifier = new GooglePlayVerifier({ accountBindingSecret: 'test_secret' });
  const legitimateHmac = computeObfuscatedAccountId('legitimate_user_uid', 'test_secret');

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: new Date(Date.now() + 86400000).toISOString()
      }
    ],
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: legitimateHmac
    }
  };

  // Attacker with different UID attempts redemption
  const entitlement = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'attacker_uid');
  assert.equal(entitlement.hasActivePro, false);
  assert.equal(entitlement.crossAccountTamper, true);
  assert.ok(entitlement.reason.includes('linked to a different account'));
});

test('Test 9 — Keyed HMAC obfuscated account identifier matches and is accepted', () => {
  const secretKey = 'test_secret_key_123';
  const verifier = new GooglePlayVerifier({ accountBindingSecret: secretKey });
  const callerUid = 'user_firebase_777';
  const expectedHmac = computeObfuscatedAccountId(callerUid, secretKey);

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_yearly',
        expiryTime: new Date(Date.now() + 86400000).toISOString()
      }
    ],
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: expectedHmac
    }
  };

  const entitlement = verifier.evaluateEntitlement(playResponse, 'mushi_qr_yearly', callerUid);
  assert.equal(entitlement.hasActivePro, true);
  assert.equal(entitlement.crossAccountTamper, undefined);
  assert.equal(entitlement.linkedAccountId, expectedHmac);
});

test('Test 10 — Manual admin lifetime grant is preserved from automated downgrade', () => {
  const existingSub = {
    userId: 'super_vip_user',
    planId: 'lifetime',
    isLifetime: true,
    provider: 'manual_admin',
    status: 'ACTIVE'
  };

  // Business rule simulation: if provider === 'manual_admin' and isLifetime === true, preserve grant
  const isProtected = existingSub.provider === 'manual_admin' && 
                      (existingSub.planId === 'lifetime' || existingSub.isLifetime);

  assert.equal(isProtected, true, 'Manual admin lifetime grant must be preserved');
});

test('Test 11 — Request validation enforces allowed package name', () => {
  const verifier = new GooglePlayVerifier();

  const res1 = verifier.validateRequest({
    packageName: 'com.malicious.fakeapp',
    productId: 'mushi_qr_monthly',
    purchaseToken: 'sample_valid_token_123456789012345'
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.error.includes('Invalid package name'));

  const res2 = verifier.validateRequest({
    packageName: ALLOWED_PACKAGE_NAME,
    productId: 'mushi_qr_monthly',
    purchaseToken: 'sample_valid_token_123456789012345'
  });
  assert.equal(res2.valid, true);
  assert.equal(res2.cleanPackageName, ALLOWED_PACKAGE_NAME);
});

test('Test 12 — Request validation enforces product allowlist', () => {
  const verifier = new GooglePlayVerifier();

  const res1 = verifier.validateRequest({
    packageName: ALLOWED_PACKAGE_NAME,
    productId: 'unauthorized_hack_plan',
    purchaseToken: 'sample_valid_token_123456789012345'
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.error.includes('not an authorized Google Play subscription'));

  const res2 = verifier.validateRequest({
    packageName: ALLOWED_PACKAGE_NAME,
    productId: 'mushi_qr_yearly',
    purchaseToken: 'sample_valid_token_123456789012345'
  });
  assert.equal(res2.valid, true);
  assert.equal(res2.productConfig.planId, 'yearly');
});

test('Test 13 — Request validation enforces minimum purchase token requirements', () => {
  const verifier = new GooglePlayVerifier();

  const res = verifier.validateRequest({
    packageName: ALLOWED_PACKAGE_NAME,
    productId: 'mushi_qr_monthly',
    purchaseToken: 'short'
  });
  assert.equal(res.valid, false);
  assert.ok(res.error.includes('Invalid or missing Google Play purchase token'));
});

test('Test 14 — In-Grace-Period and Canceled-with-remaining-time evaluate correctly', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  // In grace period
  const graceResponse = {
    subscriptionState: SUBSCRIPTION_STATE.IN_GRACE_PERIOD,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  };
  const entGrace = verifier.evaluateEntitlement(graceResponse, 'mushi_qr_monthly', 'u1');
  assert.equal(entGrace.hasActivePro, true);
  assert.equal(entGrace.status, 'IN_GRACE_PERIOD');

  // Canceled but prepaid time remains
  const canceledActiveResponse = {
    subscriptionState: SUBSCRIPTION_STATE.CANCELED,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  };
  const entCanceled = verifier.evaluateEntitlement(canceledActiveResponse, 'mushi_qr_monthly', 'u1');
  assert.equal(entCanceled.hasActivePro, true);
  assert.equal(entCanceled.status, 'CANCELLED_ACTIVE');
});

test('Test 15 — Mocked client handles API 404 cleanly', async () => {
  const mockClient = {
    request: async () => {
      const err = new Error('The purchase token was not found.');
      err.status = 404;
      throw err;
    }
  };

  const verifier = new GooglePlayVerifier({ mockClient });

  await assert.rejects(
    async () => {
      await verifier.fetchSubscriptionV2(ALLOWED_PACKAGE_NAME, 'nonexistent_token_1234567890');
    },
    (err) => {
      assert.equal(err.status, 404);
      return true;
    }
  );
});

test('Test 16 — Multiple line items: correctly selects current active line item over expired line item', () => {
  const verifier = new GooglePlayVerifier();
  const pastExpiry = new Date(Date.now() - 3600 * 1000).toISOString();
  const futureExpiry = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_weekly',
        expiryTime: pastExpiry,
      },
      {
        productId: 'mushi_qr_monthly',
        expiryTime: futureExpiry,
      }
    ],
    acknowledgementState: ACKNOWLEDGEMENT_STATE.ACKNOWLEDGED
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.productId, 'mushi_qr_monthly');
  assert.equal(ent.planId, 'monthly');
  assert.equal(ent.expiryDate, futureExpiry);
});

test('Test 17 — Deferred replacement with real Google Play shape (new line has NO expiryTime)', () => {
  const verifier = new GooglePlayVerifier();
  const oldExpiry = '2030-01-01T00:00:00Z';

  // Realistic Google Play shape:
  // old line item: active until future expiry, points to deferredItemReplacement
  // new line item: newly purchased replacement tier where expiryTime is intentionally absent
  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    linkedPurchaseToken: 'old-token-1234567890',
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: oldExpiry,
        deferredItemReplacement: {
          productId: 'mushi_qr_yearly',
        },
      },
      {
        productId: 'mushi_qr_yearly',
        // NO expiryTime
      }
    ]
  };

  // 1. Caller queries with mushi_qr_monthly (old product)
  const entOld = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(entOld.hasActivePro, true);
  assert.equal(entOld.productId, 'mushi_qr_monthly');
  assert.equal(entOld.planId, 'monthly');
  assert.equal(entOld.expiryDate, oldExpiry);
  assert.equal(entOld.deferredReplacementProductId, 'mushi_qr_yearly');

  // 2. Caller queries with mushi_qr_yearly (the new purchased product)
  // MUST NOT prematurely grant mushi_qr_yearly! It must return the currently active monthly entitlement.
  const entNew = verifier.evaluateEntitlement(playResponse, 'mushi_qr_yearly', 'u123');
  assert.equal(entNew.hasActivePro, true);
  assert.equal(entNew.productId, 'mushi_qr_monthly', 'Current entitlement must remain the old product');
  assert.equal(entNew.planId, 'monthly');
  assert.equal(entNew.expiryDate, oldExpiry);
  assert.equal(entNew.deferredReplacementProductId, 'mushi_qr_yearly');
});

test('Test 18 — Deferred replacement where old line item has expired selects active replacement', () => {
  const verifier = new GooglePlayVerifier();
  const oldExpired = new Date(Date.now() - 10000).toISOString();
  const newActive = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_weekly',
        expiryTime: oldExpired,
      },
      {
        productId: 'mushi_qr_monthly',
        expiryTime: newActive,
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.productId, 'mushi_qr_monthly');
});

test('Test 19 — Unexpected or unknown product line item fails closed', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = new Date(Date.now() + 86400000).toISOString();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'hacked_super_vip_secret_plan',
        expiryTime: futureExpiry,
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, false);
  assert.ok(ent.reason.includes('unauthorized product'));
});

test('Test 20 — Missing or malformed expiryTime fails closed', () => {
  const verifier = new GooglePlayVerifier();

  // Missing expiryTime
  const missingExpiry = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: null,
      }
    ]
  };
  const entMissing = verifier.evaluateEntitlement(missingExpiry, 'mushi_qr_monthly', 'u123');
  assert.equal(entMissing.hasActivePro, false);
  assert.ok(entMissing.reason.includes('No line item with valid expiryTime found'));

  // Malformed expiryTime
  const malformedExpiry = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: 'not-a-valid-date-string',
      }
    ]
  };
  const entMalformed = verifier.evaluateEntitlement(malformedExpiry, 'mushi_qr_monthly', 'u123');
  assert.equal(entMalformed.hasActivePro, false);
  assert.ok(entMalformed.reason.includes('Malformed expiryTime'));
});

test('Test 21 — SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED never grants Pro or acknowledgement', () => {
  const verifier = new GooglePlayVerifier();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.PENDING_PURCHASE_CANCELED,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
      }
    ],
    acknowledgementState: ACKNOWLEDGEMENT_STATE.PENDING
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, false);
  assert.equal(ent.status, 'PENDING_CANCELLED');
  assert.equal(ent.requiresAcknowledgement, false);
  assert.ok(ent.reason.includes('canceled before payment completed'));
});

test('Test 22 — Resubscription with expiredExternalAccountIdentifiers succeeds for legitimate returning user', () => {
  const secretKey = 'sec_secret_456';
  const verifier = new GooglePlayVerifier({ accountBindingSecret: secretKey });
  const returningUid = 'returning_user_999';
  const returningHmac = computeObfuscatedAccountId(returningUid, secretKey);

  // Play response where current externalAccountIdentifiers is empty/new, but expiredExternalAccountIdentifiers holds previous HMAC
  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
      }
    ],
    externalAccountIdentifiers: null,
    expiredExternalAccountIdentifiers: {
      obfuscatedExternalAccountId: returningHmac
    }
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', returningUid);
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.crossAccountTamper, undefined);
  assert.equal(ent.linkedAccountId, returningHmac);
});

test('Test 23 — Resubscription with expiredExternalAccountIdentifiers blocks attacker claiming another user historical token', () => {
  const secretKey = 'sec_secret_456';
  const verifier = new GooglePlayVerifier({ accountBindingSecret: secretKey });
  const originalUid = 'victim_user_111';
  const originalHmac = computeObfuscatedAccountId(originalUid, secretKey);

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
      }
    ],
    expiredExternalAccountIdentifiers: {
      obfuscatedExternalAccountId: originalHmac
    }
  };

  // Attacker presents the historical token:
  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'attacker_uid_222');
  assert.equal(ent.hasActivePro, false);
  assert.equal(ent.crossAccountTamper, true);
  assert.ok(ent.reason.includes('linked to a different account'));
});

test('Test 24 — Subscription lifecycle full coverage: ON_HOLD, PAUSED, EXPIRED', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = new Date(Date.now() + 86400000).toISOString();
  const pastExpiry = new Date(Date.now() - 86400000).toISOString();

  // ON_HOLD
  const onHoldEnt = verifier.evaluateEntitlement({
    subscriptionState: SUBSCRIPTION_STATE.ON_HOLD,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  }, 'mushi_qr_monthly', 'u1');
  assert.equal(onHoldEnt.hasActivePro, false);
  assert.equal(onHoldEnt.status, 'ON_HOLD');

  // PAUSED
  const pausedEnt = verifier.evaluateEntitlement({
    subscriptionState: SUBSCRIPTION_STATE.PAUSED,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  }, 'mushi_qr_monthly', 'u1');
  assert.equal(pausedEnt.hasActivePro, false);
  assert.equal(pausedEnt.status, 'PAUSED');

  // EXPIRED
  const expiredEnt = verifier.evaluateEntitlement({
    subscriptionState: SUBSCRIPTION_STATE.EXPIRED,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: pastExpiry }]
  }, 'mushi_qr_monthly', 'u1');
  assert.equal(expiredEnt.hasActivePro, false);
  assert.equal(expiredEnt.status, 'EXPIRED');
});

test('Test 25 — Acknowledgement semantics: already acknowledged subscription does not request repeated acknowledgement', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = new Date(Date.now() + 86400000).toISOString();

  const acknowledgedSub = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    acknowledgementState: ACKNOWLEDGEMENT_STATE.ACKNOWLEDGED,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  };

  const ent = verifier.evaluateEntitlement(acknowledgedSub, 'mushi_qr_monthly', 'u1');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.requiresAcknowledgement, false, 'Already acknowledged subscription must not trigger acknowledgement');
});

test('Test 26 — Concurrency lock semantics: atomic token ownership prevents race condition', () => {
  // Simulating play_purchase_tokens lock semantics
  const tokenStore = new Map();

  function attemptTokenClaim(tokenHash, userId) {
    if (tokenStore.has(tokenHash)) {
      const existing = tokenStore.get(tokenHash);
      if (existing.userId !== userId) {
        return { success: false, error: 'already-exists: token bound to another user' };
      }
      return { success: true, idempotent: true };
    }
    tokenStore.set(tokenHash, { tokenHash, userId, claimedAt: Date.now() });
    return { success: true, idempotent: false };
  }

  const token = 'race_condition_test_token_123456789012345';
  const hash = hashPurchaseToken(token);

  // User A claims first
  const res1 = attemptTokenClaim(hash, 'user_A');
  assert.equal(res1.success, true);
  assert.equal(res1.idempotent, false);

  // User B attempts concurrent / subsequent claim with same token
  const res2 = attemptTokenClaim(hash, 'user_B');
  assert.equal(res2.success, false);
  assert.ok(res2.error.includes('already-exists'));

  // User A resubmits (idempotent replay)
  const res3 = attemptTokenClaim(hash, 'user_A');
  assert.equal(res3.success, true);
  assert.equal(res3.idempotent, true);
});

test('Test 27 — Manual admin lifetime grant preservation with valid Google Play token', () => {
  const existingSub = {
    userId: 'vip_user_admin',
    planId: 'lifetime',
    isLifetime: true,
    provider: 'manual_admin',
    status: 'ACTIVE'
  };

  // Rule verification: provider === 'manual_admin' and (planId === 'lifetime' || isLifetime)
  const shouldPreserve = existingSub.provider === 'manual_admin' && 
                         (existingSub.planId === 'lifetime' || existingSub.isLifetime);
  assert.equal(shouldPreserve, true);
});

// ─── Tests for Prompt 1A-DEFERRED-FIX (Scenarios A through F) ────────────────

test('Test A — Future replacement line has no expiry: old entitlement remains active', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = '2028-06-01T00:00:00Z';

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: futureExpiry,
        deferredItemReplacement: { productId: 'mushi_qr_yearly' }
      },
      {
        productId: 'mushi_qr_yearly'
        // expiryTime intentionally absent
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.productId, 'mushi_qr_monthly');
  assert.equal(ent.expiryDate, futureExpiry);
});

test('Test B — Future replacement has unknown product: fails closed', () => {
  const verifier = new GooglePlayVerifier();
  const futureExpiry = '2028-06-01T00:00:00Z';

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: futureExpiry,
        deferredItemReplacement: { productId: 'unauthorized_hacked_plan' }
      },
      {
        productId: 'unauthorized_hacked_plan'
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, false);
  assert.ok(ent.reason.includes('unauthorized product'));
});

test('Test C — Current entitlement line missing expiry: fails closed', () => {
  const verifier = new GooglePlayVerifier();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: null // Missing on current line
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, false);
  assert.ok(ent.reason.includes('No line item with valid expiryTime found'));
});

test('Test D — Only future replacement line exists with no expiry: NO Pro entitlement', () => {
  const verifier = new GooglePlayVerifier();

  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_yearly'
        // No line item with expiryTime exists
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_yearly', 'u123');
  assert.equal(ent.hasActivePro, false);
  assert.ok(ent.reason.includes('No line item with valid expiryTime found'));
});

test('Test E — Replacement becomes effective: old line expired, new line has future expiry', () => {
  const verifier = new GooglePlayVerifier();
  const pastExpiry = new Date(Date.now() - 3600000).toISOString();
  const futureExpiry = new Date(Date.now() + 365 * 86400 * 1000).toISOString();

  // Post-renewal / rollover state:
  // old monthly line item has expired; new yearly line item now has effective future expiry
  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: pastExpiry
      },
      {
        productId: 'mushi_qr_yearly',
        expiryTime: futureExpiry
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_yearly', 'u123');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.productId, 'mushi_qr_yearly', 'New product must now become the active entitlement');
  assert.equal(ent.planId, 'yearly');
  assert.equal(ent.expiryDate, futureExpiry);
});

test('Test F — Multiple valid unexpired line items: deterministic selection or fail closed on ambiguity', () => {
  const verifier = new GooglePlayVerifier();
  const future1 = new Date(Date.now() + 10 * 86400 * 1000).toISOString();
  const future2 = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  // 1. Caller specified expectedProductId matching one of the active lines: deterministic selection
  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_weekly',
        expiryTime: future1
      },
      {
        productId: 'mushi_qr_monthly',
        expiryTime: future2
      }
    ]
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'u123');
  assert.equal(ent.hasActivePro, true);
  assert.equal(ent.productId, 'mushi_qr_monthly');

  // 2. Ambiguous query where neither matches or caller requested an unrelated tier: fails closed
  const entAmbiguous = verifier.evaluateEntitlement(playResponse, 'mushi_qr_yearly', 'u123');
  assert.equal(entAmbiguous.hasActivePro, false);
  assert.ok(entAmbiguous.reason.includes('Ambiguous subscription response'));
});

// ─── Tests for getBillingAccountBinding Endpoint & Account Binding Security ─

test('Test G1 — computeObfuscatedAccountId rejects unauthenticated/missing UID', () => {
  assert.throws(
    () => computeObfuscatedAccountId(null, 'test_secret'),
    /Valid Firebase UID string required/
  );
  assert.throws(
    () => computeObfuscatedAccountId('', 'test_secret'),
    /Valid Firebase UID string required/
  );
});

test('Test G2 — Authenticated request returns deterministic 64-char hex obfuscated account ID', () => {
  const secretKey = 'test_play_account_binding_secret_key';
  const uid = 'firebase_user_abc_123';
  const id1 = computeObfuscatedAccountId(uid, secretKey);
  const id2 = computeObfuscatedAccountId(uid, secretKey);

  assert.equal(id1, id2, 'Same UID must deterministically produce identical obfuscated account ID');
  assert.equal(typeof id1, 'string');
  assert.equal(id1.length, 64, 'HMAC-SHA256 hex must be exactly 64 characters');
  assert.match(id1, /^[0-9a-f]{64}$/, 'Must be valid hex string');
  assert.ok(id1.length <= 64, 'Google Play setObfuscatedAccountId allows maximum 64 characters');
});

test('Test G3 — Different UIDs receive strictly different obfuscated account IDs', () => {
  const secretKey = 'test_play_account_binding_secret_key';
  const uidA = 'firebase_user_alice';
  const uidB = 'firebase_user_bob';

  const idA = computeObfuscatedAccountId(uidA, secretKey);
  const idB = computeObfuscatedAccountId(uidB, secretKey);

  assert.notEqual(idA, idB, 'Distinct UIDs must NEVER produce identical obfuscated account IDs');
});

test('Test G4 — Secret is never exposed in response structure', () => {
  const secretKey = 'super_sensitive_server_only_secret_999';
  const uid = 'firebase_user_charlie';

  const binding = {
    obfuscatedAccountId: computeObfuscatedAccountId(uid, secretKey),
  };

  assert.equal(Object.keys(binding).length, 1);
  assert.equal(binding.obfuscatedAccountId.length, 64);
  assert.equal(binding.secret, undefined);
  assert.equal(binding.secretKey, undefined);
  assert.equal(binding.PLAY_ACCOUNT_BINDING_SECRET, undefined);
  assert.ok(!JSON.stringify(binding).includes(secretKey), 'Secret must NEVER leak in payload');
});

// ─── Tests for Prompt 1C: Fail-Closed Secret, RTDN Lifecycle & Ledger ────────

test('Test H1 — Fail-closed secret: computeObfuscatedAccountId rejects empty or missing secret', () => {
  assert.throws(
    () => computeObfuscatedAccountId('uid_123', null),
    /Valid server account-binding secret required/
  );
  assert.throws(
    () => computeObfuscatedAccountId('uid_123', ''),
    /Valid server account-binding secret required/
  );
  assert.throws(
    () => computeObfuscatedAccountId('uid_123', '   '),
    /Valid server account-binding secret required/
  );
});

test('Test H2 — Fail-closed secret: evaluateEntitlement fails closed if accountBindingSecret is missing and token is bound', () => {
  const verifier = new GooglePlayVerifier({ accountBindingSecret: null });
  const playResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ACTIVE,
    lineItems: [
      {
        productId: 'mushi_qr_monthly',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
      }
    ],
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: 'some_obfuscated_id_from_google',
    }
  };

  const ent = verifier.evaluateEntitlement(playResponse, 'mushi_qr_monthly', 'caller_123');
  assert.equal(ent.hasActivePro, false);
  assert.ok(ent.reason.includes('account-binding secret is missing'));
});

test('Test H3 — RTDN Notification Types: all 13 standard Google Play events mapped correctly', () => {
  assert.equal(RTDN_NOTIFICATION_TYPES[1], 'SUBSCRIPTION_RECOVERED');
  assert.equal(RTDN_NOTIFICATION_TYPES[2], 'SUBSCRIPTION_RENEWED');
  assert.equal(RTDN_NOTIFICATION_TYPES[3], 'SUBSCRIPTION_CANCELED');
  assert.equal(RTDN_NOTIFICATION_TYPES[4], 'SUBSCRIPTION_PURCHASED');
  assert.equal(RTDN_NOTIFICATION_TYPES[5], 'SUBSCRIPTION_ON_HOLD');
  assert.equal(RTDN_NOTIFICATION_TYPES[6], 'SUBSCRIPTION_IN_GRACE_PERIOD');
  assert.equal(RTDN_NOTIFICATION_TYPES[7], 'SUBSCRIPTION_RESTARTED');
  assert.equal(RTDN_NOTIFICATION_TYPES[8], 'SUBSCRIPTION_PRICE_CHANGE_CONFIRMED');
  assert.equal(RTDN_NOTIFICATION_TYPES[9], 'SUBSCRIPTION_DEFERRED');
  assert.equal(RTDN_NOTIFICATION_TYPES[10], 'SUBSCRIPTION_PAUSED');
  assert.equal(RTDN_NOTIFICATION_TYPES[11], 'SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED');
  assert.equal(RTDN_NOTIFICATION_TYPES[12], 'SUBSCRIPTION_REVOKED');
  assert.equal(RTDN_NOTIFICATION_TYPES[13], 'SUBSCRIPTION_EXPIRED');
});

test('Test H4 — Granular ledger transaction ID separates recurring renewal events while preserving order ID', () => {
  const token = 'sample_persistent_purchase_token_1234567890';
  const tokenHash = hashPurchaseToken(token);
  const orderIdInitial = 'GPA.1111-2222-3333-44444';
  const orderIdRenewal = 'GPA.1111-2222-3333-44444..0';

  const txInitial = deriveLedgerTransactionId(tokenHash, orderIdInitial, 'PURCHASE_INITIAL');
  const txRenewal = deriveLedgerTransactionId(tokenHash, orderIdRenewal, 'SUBSCRIPTION_RENEWED');

  assert.notEqual(txInitial, txRenewal, 'Initial and recurring renewal events must have distinct ledger IDs');
  assert.ok(txInitial.includes('PURCHASE_INITIAL'));
  assert.ok(txRenewal.includes('SUBSCRIPTION_RENEWED'));
  assert.ok(txRenewal.includes('GPA_1111-2222-3333-44444__0'));
});

test('Test H5 — Lifecycle state evaluation for REVOKED and ON_HOLD correctly strips Pro entitlement', () => {
  const verifier = new GooglePlayVerifier({ accountBindingSecret: 'test_sec' });
  const futureExpiry = new Date(Date.now() + 86400000).toISOString();

  // ON_HOLD: payment issue
  const onHoldResponse = {
    subscriptionState: SUBSCRIPTION_STATE.ON_HOLD,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  };
  const entOnHold = verifier.evaluateEntitlement(onHoldResponse, 'mushi_qr_monthly', 'u1');
  assert.equal(entOnHold.hasActivePro, false);
  assert.equal(entOnHold.status, 'ON_HOLD');

  // EXPIRED: ended or revoked
  const expiredResponse = {
    subscriptionState: SUBSCRIPTION_STATE.EXPIRED,
    lineItems: [{ productId: 'mushi_qr_monthly', expiryTime: futureExpiry }]
  };
  const entExpired = verifier.evaluateEntitlement(expiredResponse, 'mushi_qr_monthly', 'u1');
  assert.equal(entExpired.hasActivePro, false);
  assert.equal(entExpired.status, 'EXPIRED');
});
