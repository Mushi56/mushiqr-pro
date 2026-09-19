// src/services/payment/GooglePlayBillingService.js
// ─── Native Google Play Billing Integration with Backend Verification ────────
// Implements client-side purchase flow and restoration bridge with strict security:
// 1. Authenticated user requests opaque account-binding identifier from backend: getBillingAccountBinding.
// 2. Client launches native Google Play purchase flow using NativeAndroidApp.launchGooglePlayPurchase.
// 3. Purchase event is delivered via native event listener.
// 4. Client submits { packageName, productId, purchaseToken } to verifyGooglePlayPurchase callable function.
// 5. Client NEVER grants Pro locally from Purchase state; Pro entitlement is driven solely
//    by backend Firestore subscription updates listened to by FeatureAccessManager.
// 6. Zero secrets on client; no raw tokens or secrets logged.

import { auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FeatureAccessManager } from '../FeatureAccessManager';

export const ALLOWED_PLAY_PRODUCTS = [
  'mushi_qr_weekly',
  'mushi_qr_monthly',
  'mushi_qr_yearly'
];

export const GooglePlayBillingService = {
  isNativeAndroid() {
    return typeof window !== 'undefined' &&
           Boolean(window.NativeAndroidApp && typeof window.NativeAndroidApp.launchGooglePlayPurchase === 'function');
  },

  async init() {
    console.log('[GooglePlayBillingService] Initialized Android billing bridge');
    return { ok: true };
  },

  async getProducts() {
    return [
      { id: 'mushi_qr_weekly',  name: 'Weekly Pass', type: 'subs' },
      { id: 'mushi_qr_monthly', name: 'Monthly Pro',  type: 'subs' },
      { id: 'mushi_qr_yearly',  name: 'Yearly VIP',   type: 'subs' }
    ];
  },

  /**
   * Fetches the caller's server-computed HMAC-SHA256 opaque account identifier.
   * Required before launching Google Play Billing purchase flow.
   */
  async getOpaqueAccountBinding() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in with your account before completing your purchase so your subscription is linked to your profile.');
    }

    try {
      const getBindingCallable = httpsCallable(functions, 'getBillingAccountBinding');
      const res = await getBindingCallable({});
      const bindingId = res.data?.obfuscatedAccountId;
      if (!bindingId || typeof bindingId !== 'string' || bindingId.length > 64) {
        throw new Error('Invalid account-binding identifier received from server.');
      }
      return bindingId;
    } catch (err) {
      console.warn('[GooglePlayBillingService] Failed to obtain account binding from server:', err.message);
      throw new Error('Unable to prepare secure purchase verification. Please verify your connection and try again.');
    }
  },

  /**
   * Initiates Google Play In-App Purchase.
   *
   * Flow:
   * 1. Check user authentication.
   * 2. Obtain opaque account binding from backend Cloud Function.
   * 3. Launch native Play Billing flow with setObfuscatedAccountId.
   * 4. Await native event callback.
   * 5. Call verifyGooglePlayPurchase Cloud Function.
   * 6. Return backend verification outcome (entitlement updated via Firestore).
   */
  async purchase(plan, options = {}) {
    const rawProductId = plan?.storeProductId || (plan?.id?.startsWith('mushi_qr_') ? plan.id : `mushi_qr_${plan?.id}`);
    const productId = rawProductId?.trim();

    if (!ALLOWED_PLAY_PRODUCTS.includes(productId)) {
      throw new Error(`Product '${productId}' is not an authorized Google Play subscription product.`);
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in with your account before completing your purchase.');
    }

    if (!this.isNativeAndroid()) {
      throw new Error('Google Play In-App Billing is only available on the Android application.');
    }

    // 1. Fetch server-derived opaque account-binding ID
    const obfuscatedAccountId = await this.getOpaqueAccountBinding();

    // 2. Identify if this is a replacement (upgrade/downgrade/deferred)
    const existingSub = FeatureAccessManager.getUserSubscription();
    const oldPurchaseToken = options.oldPurchaseToken || existingSub?.rawPurchaseToken || null;
    const replacementMode = options.replacementMode || 0; // 0 = default DEFERRED

    return new Promise((resolve, reject) => {
      let cleanupListeners = null;

      const onSuccess = async (event) => {
        cleanupListeners();
        const { productId: returnedProd, purchaseToken, packageName } = event.detail || {};

        if (!purchaseToken || !packageName) {
          return reject(new Error('Incomplete purchase data received from Google Play.'));
        }

        try {
          // Send to authoritative backend verifier
          const verifyCallable = httpsCallable(functions, 'verifyGooglePlayPurchase');
          const verificationResult = await verifyCallable({
            packageName,
            productId: returnedProd || productId,
            purchaseToken
          });

          // Pro entitlement is received via real-time Firestore listener in FeatureAccessManager
          resolve({
            success: true,
            status: verificationResult.data?.status || 'ACTIVE',
            planId: verificationResult.data?.planId,
            message: 'Subscription successfully verified with Google Play.',
          });
        } catch (verifyErr) {
          console.warn('[GooglePlayBillingService] Verification rejected by backend:', verifyErr.message);
          reject(new Error(verifyErr.message || 'Purchase verification failed on server.'));
        }
      };

      const onPending = () => {
        cleanupListeners();
        resolve({
          success: false,
          pending: true,
          message: 'Your purchase is pending payment confirmation by Google Play. Pro access will be activated automatically once Google confirms payment.',
        });
      };

      const onCancelled = () => {
        cleanupListeners();
        reject(new Error('Purchase was cancelled by the user.'));
      };

      const onFailed = (event) => {
        cleanupListeners();
        const msg = event.detail?.debugMessage || 'Purchase failed on Google Play.';
        reject(new Error(msg));
      };

      cleanupListeners = () => {
        window.removeEventListener('onPlayPurchaseSuccess', onSuccess);
        window.removeEventListener('onPlayPurchasePending', onPending);
        window.removeEventListener('onPlayPurchaseCancelled', onCancelled);
        window.removeEventListener('onPlayPurchaseFailed', onFailed);
      };

      window.addEventListener('onPlayPurchaseSuccess', onSuccess);
      window.addEventListener('onPlayPurchasePending', onPending);
      window.addEventListener('onPlayPurchaseCancelled', onCancelled);
      window.addEventListener('onPlayPurchaseFailed', onFailed);

      // 3. Launch native purchase flow
      try {
        window.NativeAndroidApp.launchGooglePlayPurchase(
          productId,
          obfuscatedAccountId,
          oldPurchaseToken,
          replacementMode
        );
      } catch (nativeErr) {
        cleanupListeners();
        reject(new Error(`Failed to launch Google Play billing dialog: ${nativeErr.message}`));
      }
    });
  },

  /**
   * Queries existing Google Play subscriptions from device BillingClient
   * and reconciles them with the backend verifier.
   */
  async restorePurchases() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in before restoring purchases.');
    }

    if (!this.isNativeAndroid()) {
      return { success: true, count: 0, message: 'Restore checked.' };
    }

    return new Promise((resolve, reject) => {
      let cleanupListeners = null;

      const onRestored = async (event) => {
        cleanupListeners();
        const purchases = event.detail?.purchases || [];
        if (purchases.length === 0) {
          return resolve({
            success: true,
            count: 0,
            message: 'No active Google Play subscriptions found on this Google account.'
          });
        }

        let verifiedCount = 0;
        const verifyCallable = httpsCallable(functions, 'verifyGooglePlayPurchase');

        for (const p of purchases) {
          if (!ALLOWED_PLAY_PRODUCTS.includes(p.productId)) continue;
          try {
            await verifyCallable({
              packageName: p.packageName,
              productId: p.productId,
              purchaseToken: p.purchaseToken,
            });
            verifiedCount++;
          } catch (err) {
            console.warn('[GooglePlayBillingService] Restore item verification failed:', err.message);
          }
        }

        resolve({
          success: true,
          count: verifiedCount,
          message: verifiedCount > 0
            ? `Successfully restored ${verifiedCount} subscription(s).`
            : 'Purchases were found but could not be verified for this account.'
        });
      };

      const onRestoreFailed = (event) => {
        cleanupListeners();
        reject(new Error(event.detail?.message || 'Failed to query Google Play purchases.'));
      };

      cleanupListeners = () => {
        window.removeEventListener('onPlayPurchasesRestored', onRestored);
        window.removeEventListener('onPlayPurchasesRestoreFailed', onRestoreFailed);
      };

      window.addEventListener('onPlayPurchasesRestored', onRestored);
      window.addEventListener('onPlayPurchasesRestoreFailed', onRestoreFailed);

      try {
        window.NativeAndroidApp.queryGooglePlayPurchases();
      } catch (err) {
        cleanupListeners();
        reject(new Error(`Failed to query Google Play: ${err.message}`));
      }
    });
  }
};
