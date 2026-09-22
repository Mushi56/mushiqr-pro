// src/services/premiumContext.jsx
// ─── Premium Subscription Context ──────────────────────────────────────────
// Delegates entitlement and gating logic to FeatureAccessManager.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getUserSubscription,
} from './adminDataService';
import { FeatureAccessManager, FEATURE_REGISTRY, REASON } from './FeatureAccessManager';
import { PaymentProvider } from './payment/PaymentProvider';
import { RevenueCatService } from './payment/RevenueCatService';

const PremiumCtx = createContext(null);

export function PremiumProvider({ children }) {
  const [user, setUser]                     = useState(null);
  const [subscription, setSubscription]     = useState(null);
  const [paywallOpen, setPaywallOpen]       = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [loading, setLoading]               = useState(true);

  // Initialize Payment Provider & RevenueCat at launch
  useEffect(() => {
    PaymentProvider.init().catch(e => console.warn('[PremiumProvider] PaymentProvider init notice:', e));
  }, []);

  // Subscribe to real-time entitlement state changes from FeatureAccessManager
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  // Listen to auth state and link RevenueCat identity
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u?.uid) {
        RevenueCatService.identifyUser(u.uid);
      } else {
        RevenueCatService.logOut();
      }
    });
    return unsub;
  }, []);

  // Sync state with FeatureAccessManager
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (user?.uid) {
        try {
          const sub = await getUserSubscription(user.uid);
          if (!cancelled) setSubscription(sub);
        } catch (e) {
          console.error('[Premium] Failed to load user sub:', e);
        }
      } else {
        if (!cancelled) setSubscription(null);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Derived state
  const userPlan = FeatureAccessManager.getUserPlan();
  const isPremium = userPlan !== 'free';

  const canAccess = useCallback((featureId) => {
    return FeatureAccessManager.canUseFeature(featureId).allowed;
  }, []);

  const showPaywall = useCallback((featureId = null) => {
    setPaywallFeature(featureId);
    setPaywallOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallFeature(null);
  }, []);

  const requirePremium = useCallback((featureId) => {
    const access = FeatureAccessManager.canUseFeature(featureId);
    if (access.allowed) return true;
    showPaywall(featureId);
    return false;
  }, [showPaywall]);

  const value = {
    user,
    isPremium,
    currentPlan: userPlan,
    subscription,
    premiumFeatures: FEATURE_REGISTRY,
    canAccess,
    requirePremium,
    showPaywall,
    hidePaywall,
    paywallOpen,
    paywallFeature,
    loading,
  };

  return <PremiumCtx.Provider value={value}>{children}</PremiumCtx.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumCtx);
  if (!ctx) {
    return {
      isPremium: false,
      currentPlan: 'free',
      canAccess: () => true,
      requirePremium: () => true,
      showPaywall: () => {},
      hidePaywall: () => {},
      paywallOpen: false,
      premiumFeatures: FEATURE_REGISTRY,
      loading: false,
    };
  }
  return ctx;
}
