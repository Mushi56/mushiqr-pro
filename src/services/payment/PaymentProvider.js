// src/services/payment/PaymentProvider.js
// ─── Platform-Agnostic Payment Provider Interface ──────────────────────────
// Primary in-app purchase and subscription router.
// On Android, prioritizes RevenueCat cross-platform SDK with seamless fallback
// to GooglePlayBillingService or WebPaymentService.

import { RevenueCatService } from './RevenueCatService';
import { GooglePlayBillingService } from './GooglePlayBillingService';
import { WebPaymentService } from './WebPaymentService';

export const PaymentProvider = {
  isNativeAndroid() {
    return typeof window !== 'undefined' && 
           Boolean(window.Capacitor?.isNativePlatform && window.Capacitor.getPlatform() === 'android');
  },

  async init() {
    if (this.isNativeAndroid()) {
      try {
        const rcRes = await RevenueCatService.init();
        if (rcRes?.ok) {
          return rcRes;
        }
      } catch (err) {
        console.warn('[PaymentProvider] RevenueCat init failed, falling back to GooglePlayBillingService:', err);
      }
      return GooglePlayBillingService.init();
    }
    return WebPaymentService.init();
  },

  async getProducts() {
    if (this.isNativeAndroid()) {
      try {
        const offerings = await RevenueCatService.getOfferings();
        if (offerings?.current?.availablePackages?.length > 0) {
          return offerings.current.availablePackages.map(pkg => ({
            id: pkg.identifier,
            productId: pkg.product?.identifier,
            name: pkg.product?.title || pkg.identifier,
            price: pkg.product?.priceString,
            type: 'subs',
            pkg
          }));
        }
      } catch (err) {
        console.warn('[PaymentProvider] RevenueCat getOfferings error:', err);
      }
      return GooglePlayBillingService.getProducts();
    }
    return WebPaymentService.getProducts();
  },

  async purchase(plan, options = {}) {
    if (this.isNativeAndroid()) {
      // 1. Prioritize RevenueCat purchase flow
      try {
        console.log('[PaymentProvider] Attempting purchase via RevenueCat...');
        return await RevenueCatService.purchase(plan, options);
      } catch (rcErr) {
        console.warn('[PaymentProvider] RevenueCat purchase error:', rcErr.message);
        // If user cancelled, do not fallback to another provider
        if (rcErr.message?.toLowerCase().includes('cancel')) {
          throw rcErr;
        }
        // Fallback to direct Google Play Billing Service if configured
        if (GooglePlayBillingService.isNativeAndroid()) {
          console.log('[PaymentProvider] Falling back to direct GooglePlayBillingService...');
          return await GooglePlayBillingService.purchase(plan, options);
        }
        throw rcErr;
      }
    }
    return WebPaymentService.purchase(plan, options);
  },

  async restorePurchases() {
    if (this.isNativeAndroid()) {
      try {
        console.log('[PaymentProvider] Restoring purchases via RevenueCat...');
        const res = await RevenueCatService.restorePurchases();
        if (res.restored) {
          return res;
        }
      } catch (err) {
        console.warn('[PaymentProvider] RevenueCat restore notice:', err.message);
      }
      return GooglePlayBillingService.restorePurchases();
    }
    return WebPaymentService.restorePurchases();
  }
};
