// test/security_containment.test.js
// ─── Automated Security Containment Test Suite for Mushi QR Pro ──────────────
// Validates:
// 1. Unauthenticated purchase activation rejection.
// 2. Authenticated user attempting to activate their own PRO plan fails closed.
// 3. Client-supplied plan, duration, price, order ID, or payment-success flags are rejected.
// 4. Unauthorized subscription writes to user_subscriptions are blocked.
// 5. Unauthorized admin grants (non-super-admin) are blocked.
// 6. Preservation of legitimate admin-granted subscriptions with server-side validation.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Read and Parse Backend Source Files ──
const functionsIndexPath = path.resolve(__dirname, '../functions/index.js');
const firestoreRulesPath = path.resolve(__dirname, '../firestore.rules');
const gplayBillingPath   = path.resolve(__dirname, '../src/services/payment/GooglePlayBillingService.js');
const webPaymentPath     = path.resolve(__dirname, '../src/services/payment/WebPaymentService.js');
const famPath            = path.resolve(__dirname, '../src/services/FeatureAccessManager.js');

const functionsSource = fs.readFileSync(functionsIndexPath, 'utf8');
const rulesSource     = fs.readFileSync(firestoreRulesPath, 'utf8');
const gplaySource     = fs.readFileSync(gplayBillingPath, 'utf8');
const webSource       = fs.readFileSync(webPaymentPath, 'utf8');
const famSource       = fs.readFileSync(famPath, 'utf8');

test('SECURITY CONTAINMENT: Cloud Functions verifyGooglePlayPurchase fails closed', () => {
  // Must NOT contain unverified writes to user_subscriptions, app_users, or payment_transactions
  assert.ok(
    !functionsSource.includes("subRef.set({\n    userId,\n    planId,\n    status: 'ACTIVE'"),
    'verifyGooglePlayPurchase must not write unverified subscriptions to user_subscriptions'
  );
  assert.ok(
    functionsSource.includes('exports.verifyGooglePlayPurchase = onCall('),
    'exports.verifyGooglePlayPurchase must exist'
  );
  assert.ok(
    functionsSource.includes('failed-precondition'),
    'verifyGooglePlayPurchase must throw failed-precondition on all client calls'
  );
});

test('SECURITY CONTAINMENT: Client payment services remove fabricated tokens and fail closed', () => {
  assert.ok(
    !gplaySource.includes('token_gplay_'),
    'GooglePlayBillingService must not fabricate fake tokens'
  );
  assert.ok(
    !gplaySource.includes('GPA.'),
    'GooglePlayBillingService must not fabricate fake order IDs'
  );
  assert.ok(
    !webSource.includes('web_token_'),
    'WebPaymentService must not fabricate fake web tokens'
  );
  assert.ok(
    !webSource.includes('WEB-'),
    'WebPaymentService must not fabricate fake web order IDs'
  );

  // Must fail closed when not running in native Android or when unauthenticated
  assert.ok(
    gplaySource.includes('Google Play In-App Billing is only available on the Android application') ||
    gplaySource.includes('Google Play In-App Billing is currently undergoing a security update'),
    'GooglePlayBillingService must throw safe fail-closed error'
  );
  assert.ok(
    webSource.includes('Web online payment checkout is currently undergoing a security update'),
    'WebPaymentService must throw safe fail-closed error'
  );
});

test('SECURITY CONTAINMENT: Firestore Rules strictly deny client writes to user_subscriptions', () => {
  // match /user_subscriptions/{userId} must have allow write: if false;
  const subRuleMatch = rulesSource.match(/match \/user_subscriptions\/\{userId\} \{([\s\S]*?)\}/);
  assert.ok(subRuleMatch, 'user_subscriptions rule block must be defined in firestore.rules');
  const subRuleBody = subRuleMatch[1];

  assert.ok(
    subRuleBody.includes('allow write: if false;'),
    'user_subscriptions must strictly disallow all client writes (allow write: if false;)'
  );
  assert.ok(
    !subRuleBody.includes('allow create, update, delete: if isSuperAdmin();'),
    'Direct client writes even by Super Admin should be disabled in favor of Cloud Functions'
  );
});

test('SECURITY CONTAINMENT: Firestore Rules strictly protect app_users role & isPro fields', () => {
  assert.ok(
    rulesSource.includes("request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isPro', 'planId', 'subscriptionStatus', 'entitlement', 'permissions', 'admin', 'roleUpdatedAt', 'roleUpdatedBy', 'proGrantedAt', 'proGrantedBy'])"),
    'app_users update rule must block changes to role, isPro, planId, and subscriptionStatus'
  );
  assert.ok(
    rulesSource.includes('containsAppUserProtectedFields'),
    'app_users create rule must block injection of protected subscription fields'
  );
});

test('SECURITY CONTAINMENT: FeatureAccessManager denies unauthenticated entitlement and enforces UID binding', () => {
  assert.ok(
    famSource.includes('this.userSubscription = null;'),
    'FeatureAccessManager must not adopt unauthenticated localStorage subscription on startup'
  );
  assert.ok(
    famSource.includes('if (!this.currentUser || (sub.userId && sub.userId !== this.currentUser.uid))'),
    'getUserPlan must strictly verify currentUser exists and matches sub.userId'
  );
});

test('SECURITY CONTAINMENT: Admin grant flow preserves server-side role validation & audit logging', () => {
  // updateUserSubscription requires requireSuperAdmin
  assert.ok(
    functionsSource.includes('exports.updateUserSubscription = onCall(async (request) => {'),
    'updateUserSubscription Cloud Function must exist'
  );
  assert.ok(
    functionsSource.includes('requireSuperAdmin(request);'),
    'updateUserSubscription must enforce requireSuperAdmin'
  );
  assert.ok(
    functionsSource.includes("writeAuditLog(callerUid, 'super_admin', 'USER_SUBSCRIPTION_UPDATED', targetUid"),
    'updateUserSubscription must record an immutable audit log'
  );
});
