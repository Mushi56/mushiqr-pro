// test/firebase/firestore_rules_emulator.test.js
// ─── Firebase Emulator Integration Security Test Suite ────────────────────────
// Tests:
// Test A: Normal user cannot write subscription (user_subscriptions/userA -> PERMISSION_DENIED)
// Test B: Normal user cannot modify another user's subscription (user_subscriptions/userB -> PERMISSION_DENIED)
// Test C: Normal user cannot modify protected app_users fields (isPro, planId, role, etc. -> PERMISSION_DENIED)
// Test D: Normal user can perform legitimate profile operations (displayName, bio -> SUCCESS)
// Test E: User cannot write payment transactions (payment_transactions/test-tx -> PERMISSION_DENIED)
// Test F: User cannot access another user's subscription (get user_subscriptions/userB -> PERMISSION_DENIED)
// Test G: Unauthenticated user cannot access protected subscription (get user_subscriptions/userA -> PERMISSION_DENIED)
// Test H: Normal user can read their own subscription (get user_subscriptions/userA -> SUCCESS)
// Test I: Collection-wide subscription query blocked for normal users (list user_subscriptions -> PERMISSION_DENIED)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  initializeTestEnvironment, 
  assertFails, 
  assertSucceeds 
} from '@firebase/rules-unit-testing';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rulesPath = path.resolve(__dirname, '../../firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

const PROJECT_ID = 'mushi-qr-pro-emulator-testing';

let testEnv;

test.before(async () => {
  // Safeguard: Ensure we are pointed to local emulator, NEVER production
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

test.after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test.beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test('Test A — Normal user cannot write subscription', async () => {
  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const subRef = doc(db, 'user_subscriptions', 'userA');

  await assertFails(
    setDoc(subRef, {
      userId: 'userA',
      planId: 'yearly',
      status: 'ACTIVE',
      isPro: true,
      provider: 'client_spoof'
    })
  );
});

test("Test B — Normal user cannot modify another user's subscription", async () => {
  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const subRef = doc(db, 'user_subscriptions', 'userB');

  await assertFails(
    setDoc(subRef, {
      userId: 'userB',
      planId: 'monthly',
      status: 'ACTIVE',
      isPro: true
    })
  );
});

test('Test C — Normal user cannot modify protected app_users fields', async () => {
  // Seed an existing profile as admin
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();
    await setDoc(doc(adminDb, 'app_users', 'userA'), {
      displayName: 'User A',
      email: 'usera@example.com',
      isPro: false,
      planId: 'free',
      subscriptionStatus: 'FREE',
      role: 'user'
    });
  });

  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const userDocRef = doc(db, 'app_users', 'userA');

  // Attempt 1: Escalate isPro
  await assertFails(
    updateDoc(userDocRef, { isPro: true })
  );

  // Attempt 2: Escalate planId
  await assertFails(
    updateDoc(userDocRef, { planId: 'yearly' })
  );

  // Attempt 3: Escalate subscriptionStatus
  await assertFails(
    updateDoc(userDocRef, { subscriptionStatus: 'ACTIVE' })
  );

  // Attempt 4: Escalate role to super_admin
  await assertFails(
    updateDoc(userDocRef, { role: 'super_admin' })
  );

  // Attempt 5: Escalate entitlement
  await assertFails(
    updateDoc(userDocRef, { entitlement: 'pro' })
  );
});

test('Test D — Normal user can perform legitimate profile operations', async () => {
  // Seed existing profile with admin privileges
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();
    await setDoc(doc(adminDb, 'app_users', 'userA'), {
      displayName: 'Original Name',
      bio: 'Initial Bio',
      isPro: false,
      planId: 'free',
      role: 'user'
    });
  });

  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const userDocRef = doc(db, 'app_users', 'userA');

  // Normal profile fields permitted
  await assertSucceeds(
    updateDoc(userDocRef, {
      displayName: 'Updated Name',
      bio: 'My new profile bio',
      phoneNumber: '+1234567890'
    })
  );
});

test('Test E — User cannot write payment transactions', async () => {
  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const txRef = doc(db, 'payment_transactions', 'test-transaction-001');

  await assertFails(
    setDoc(txRef, {
      userId: 'userA',
      amount: 99.99,
      currency: 'USD',
      status: 'COMPLETED',
      provider: 'stripe',
      timestamp: Date.now()
    })
  );
});

test("Test F — User cannot access another user's subscription", async () => {
  // Seed userB subscription
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();
    await setDoc(doc(adminDb, 'user_subscriptions', 'userB'), {
      userId: 'userB',
      planId: 'yearly',
      status: 'ACTIVE',
      isPro: true
    });
  });

  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const subRef = doc(db, 'user_subscriptions', 'userB');

  await assertFails(getDoc(subRef));
});

test('Test G — Unauthenticated user cannot access protected subscription', async () => {
  // Seed userA subscription
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();
    await setDoc(doc(adminDb, 'user_subscriptions', 'userA'), {
      userId: 'userA',
      planId: 'yearly',
      status: 'ACTIVE',
      isPro: true
    });
  });

  const unauthContext = testEnv.unauthenticatedContext();
  const db = unauthContext.firestore();
  const subRef = doc(db, 'user_subscriptions', 'userA');

  await assertFails(getDoc(subRef));
});

test('Test H — Normal user can read their own subscription', async () => {
  // Seed userA subscription
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();
    await setDoc(doc(adminDb, 'user_subscriptions', 'userA'), {
      userId: 'userA',
      planId: 'monthly',
      status: 'ACTIVE',
      isPro: true
    });
  });

  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const subRef = doc(db, 'user_subscriptions', 'userA');

  await assertSucceeds(getDoc(subRef));
});

test('Test I — Collection-wide subscription query blocked for normal users', async () => {
  const userAContext = testEnv.authenticatedContext('userA', { email: 'usera@example.com' });
  const db = userAContext.firestore();
  const colRef = collection(db, 'user_subscriptions');

  await assertFails(getDocs(colRef));
});
