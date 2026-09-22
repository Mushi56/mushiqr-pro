// src/services/payment/RevenueCatService.js
// ─── RevenueCat Cross-Platform Purchases Integration ────────────────────────
// Securely wraps @revenuecat/purchases-capacitor for Android/iOS with fallback.
// 1. Configured with user's RevenueCat Android API key.
// 2. Automatically binds customerInfo with Firebase Auth UID.
// 3. Syncs active entitlements ('pro', 'premium', etc.) directly to FeatureAccessManager.
// 4. Provides getOfferings, purchasePackage, and restorePurchases.

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { FeatureAccessManager } from '../FeatureAccessManager';

export const REVENUECAT_CONFIG = {
  apiKey: 'goog_HAKZltjGkynBXKPJjAMEmXEkjNd',
  entitlementId: 'pro', // Default entitlement identifier in RevenueCat
  fallbackEntitlements: ['pro', 'premium', 'mushi_qr_pro', 'vip']
};

class RevenueCatServiceClass {
  constructor() {
    this.isInitialized = false;
    this.currentCustomerInfo = null;
    this.currentOfferings = null;
  }

  isNative() {
    return typeof window !== 'undefined' &&
           Boolean(window.Capacitor?.isNativePlatform && window.Capacitor.getPlatform() === 'android');
  }

  /**
   * Initializes RevenueCat Purchases SDK
   */
  async init() {
    if (this.isInitialized) return { ok: true };

    if (!this.isNative()) {
      console.log('[RevenueCatService] Non-native environment; skipping native Purchases.configure');
      return { ok: true, web: true };
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      } else {
        await Purchases.setLogLevel({ level: LOG_LEVEL.INFO });
      }

      const uid = auth.currentUser?.uid || null;

      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.apiKey,
        appUserID: uid || undefined
      });

      this.isInitialized = true;
      console.log('[RevenueCatService] Purchases configured successfully with API Key');

      // Listen for customer info updates
      await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log('[RevenueCatService] CustomerInfo updated via listener');
        this.handleCustomerInfoUpdate(customerInfo);
      });

      // Fetch initial customer info
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.handleCustomerInfoUpdate(customerInfo);

      return { ok: true };
    } catch (err) {
      console.warn('[RevenueCatService] Failed to configure Purchases:', err);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Log in user to RevenueCat when Firebase Auth changes
   */
  async identifyUser(uid) {
    if (!this.isNative() || !this.isInitialized || !uid) return;

    try {
      console.log('[RevenueCatService] Identifying user with RevenueCat:', uid);
      const { customerInfo } = await Purchases.logIn({ appUserID: uid });
      this.handleCustomerInfoUpdate(customerInfo);
    } catch (err) {
      console.warn('[RevenueCatService] Error identifying user:', err.message);
    }
  }

  /**
   * Log out user from RevenueCat when user signs out
   */
  async logOut() {
    if (!this.isNative() || !this.isInitialized) return;

    try {
      const { customerInfo } = await Purchases.logOut();
      this.handleCustomerInfoUpdate(customerInfo);
    } catch (err) {
      console.warn('[RevenueCatService] Error on logOut:', err.message);
    }
  }

  /**
   * Evaluates customerInfo and updates FeatureAccessManager & Firestore
   */
  handleCustomerInfoUpdate(customerInfo) {
    if (!customerInfo) return;
    this.currentCustomerInfo = customerInfo;

    const activeEntitlements = customerInfo.entitlements?.active || {};
    
    // Check configured entitlement or any common pro entitlements
    let isPro = Boolean(activeEntitlements[REVENUECAT_CONFIG.entitlementId]);
    let activeEntitlementObj = activeEntitlements[REVENUECAT_CONFIG.entitlementId];

    if (!isPro) {
      for (const ent of REVENUECAT_CONFIG.fallbackEntitlements) {
        if (activeEntitlements[ent]) {
          isPro = true;
          activeEntitlementObj = activeEntitlements[ent];
          break;
        }
      }
    }

    // If any active entitlement exists at all, consider user Pro
    if (!isPro && Object.keys(activeEntitlements).length > 0) {
      isPro = true;
      const firstKey = Object.keys(activeEntitlements)[0];
      activeEntitlementObj = activeEntitlements[firstKey];
    }

    console.log('[RevenueCatService] Active Pro Entitlement:', isPro, activeEntitlements);

    // Sync to FeatureAccessManager immediately
    if (isPro && activeEntitlementObj) {
      const prodId = activeEntitlementObj.productIdentifier || '';
      let planId = 'monthly';
      if (prodId.includes('week')) planId = 'weekly';
      else if (prodId.includes('year') || prodId.includes('annual')) planId = 'yearly';
      else if (prodId.includes('life')) planId = 'lifetime';

      const expDate = activeEntitlementObj.expirationDate 
        ? new Date(activeEntitlementObj.expirationDate).toISOString() 
        : null;

      FeatureAccessManager.setProState({
        isPro: true,
        planId,
        status: 'ACTIVE',
        expiryDate: expDate,
        provider: 'revenuecat'
      });

      // If user is authenticated, back up active entitlement in user_subscriptions Firestore
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        try {
          setDoc(doc(db, 'user_subscriptions', uid), {
            userId: uid,
            isPro: true,
            planId,
            status: 'ACTIVE',
            expiryDate: expDate,
            paymentMethod: 'revenuecat',
            provider: 'revenuecat',
            productIdentifier: prodId,
            lastVerifiedClientAt: Date.now(),
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(e => console.warn('[RevenueCatService] Firestore sync non-fatal warning:', e));
        } catch {}
      }
    }
  }

  /**
   * Fetches offerings from RevenueCat
   */
  async getOfferings() {
    if (!this.isNative()) {
      return null;
    }
    await this.init();
    try {
      const offerings = await Purchases.getOfferings();
      this.currentOfferings = offerings;
      return offerings;
    } catch (err) {
      console.warn('[RevenueCatService] Failed to get offerings:', err);
      return null;
    }
  }

  /**
   * Purchases a package through RevenueCat
   */
  async purchase(plan, options = {}) {
    if (!this.isNative()) {
      throw new Error('RevenueCat is only available on native Android/iOS.');
    }

    await this.init();

    // Find corresponding package in offerings
    const offerings = await this.getOfferings();
    const currentOffering = offerings?.current;

    let targetPackage = null;

    if (currentOffering && currentOffering.availablePackages?.length > 0) {
      const targetId = (plan.id || '').toLowerCase();
      // Try to match package identifier or underlying product identifier
      targetPackage = currentOffering.availablePackages.find(pkg => {
        const pId = pkg.identifier.toLowerCase();
        const prodId = (pkg.product?.identifier || '').toLowerCase();
        return pId.includes(targetId) || prodId.includes(targetId) ||
               (targetId === 'weekly' && (pId.includes('week') || prodId.includes('week'))) ||
               (targetId === 'monthly' && (pId.includes('month') || prodId.includes('month'))) ||
               (targetId === 'yearly' && (pId.includes('year') || pId.includes('annual') || prodId.includes('year')));
      });

      // Fallback to first available package if none matched explicitly
      if (!targetPackage) {
        targetPackage = currentOffering.availablePackages[0];
      }
    }

    if (!targetPackage) {
      throw new Error('No subscription package found for this plan in RevenueCat offerings.');
    }

    console.log('[RevenueCatService] Initiating purchase for package:', targetPackage.identifier);

    try {
      const { customerInfo } = await Purchases.purchasePackage({
        aPackage: targetPackage
      });

      this.handleCustomerInfoUpdate(customerInfo);

      return {
        ok: true,
        customerInfo,
        provider: 'revenuecat'
      };
    } catch (purchaseError) {
      if (purchaseError.userCancelled) {
        throw new Error('Purchase was cancelled.');
      }
      throw new Error(purchaseError.message || 'Payment was not completed.');
    }
  }

  /**
   * Restores existing purchases
   */
  async restorePurchases() {
    if (!this.isNative()) {
      return { ok: true, restored: false };
    }

    await this.init();

    try {
      console.log('[RevenueCatService] Restoring purchases...');
      const { customerInfo } = await Purchases.restorePurchases();
      this.handleCustomerInfoUpdate(customerInfo);

      const hasActive = customerInfo.entitlements?.active &&
                        Object.keys(customerInfo.entitlements.active).length > 0;

      return {
        ok: true,
        restored: hasActive,
        customerInfo
      };
    } catch (err) {
      console.warn('[RevenueCatService] Restore error:', err);
      throw new Error(err.message || 'Failed to restore purchases.');
    }
  }
}

export const RevenueCatService = new RevenueCatServiceClass();
