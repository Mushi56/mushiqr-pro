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
      const rcRes = await RevenueCatService.init();
      if (rcRes?.ok) {
        return rcRes;
      }
      throw new Error('RevenueCat initialization failed: ' + (rcRes?.error || 'Unknown error'));
    }
    return WebPaymentService.init();
  },

  async getProducts() {
    if (this.isNativeAndroid()) {
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
      throw new Error('No products available in RevenueCat offerings.');
    }
    return WebPaymentService.getProducts();
  },

  async purchase(plan, options = {}) {
    if (this.isNativeAndroid()) {
      console.log('[PaymentProvider] Attempting purchase via RevenueCat...');
      return await RevenueCatService.purchase(plan, options);
    }
    return WebPaymentService.purchase(plan, options);
  },

  async restorePurchases() {
    if (this.isNativeAndroid()) {
      console.log('[PaymentProvider] Restoring purchases via RevenueCat...');
      return await RevenueCatService.restorePurchases();
    }
    return WebPaymentService.restorePurchases();
  }
};
