import { auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FeatureAccessManager } from '../FeatureAccessManager';

export const WebPaymentService = {
  async init() {
    console.log('[WebPaymentService] Initialized Web payment provider');
    return { ok: true };
  },

  async getProducts() {
    return [];
  },

  async purchase(plan, options = {}) {
    const productId = plan.webProductId || plan.id;
    console.log(`[WebPaymentService] Web checkout requested for plan: ${plan.id} (${productId})`);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in with your Google or Email account before completing your purchase so your subscription is linked to your profile.');
    }

    // EMERGENCY SECURITY CONTAINMENT:
    // Simulated/fabricated client payment tokens and order IDs have been removed.
    // Real web payment requires Stripe hosted checkout session or Elements integration.
    // Fail closed safely without granting unverified entitlements.
    throw new Error('Web online payment checkout is currently undergoing a security update. Please contact support or check back shortly.');
  },

  async restorePurchases() {
    return { success: true, message: 'Web account active subscription checked.' };
  }
};

