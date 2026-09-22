// src/components/PremiumModal.jsx
// ─── Premium Paywall & Subscription Modal ───────────────────────────────────
// Multi-step flow: Features → Plans → Checkout → Processing → Success
// Clean white/pink reference design with RevenueCat native purchase integration.

import { useState, useEffect, useMemo } from 'react';
import {
  X, ChevronLeft, Crown, ArrowRight, Check,
  QrCode, Palette, Shapes, Upload, Image, Layers,
  Shield, Lock, AlertCircle, ChevronRight, RefreshCw
} from 'lucide-react';
import { usePremium } from '../services/premiumContext';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { PaymentProvider } from '../services/payment/PaymentProvider';
import { RevenueCatService } from '../services/payment/RevenueCatService';

// ─── Real Official Google Play Vector Icon ───────────────────────────────────
function GooglePlayIcon({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 466 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Play"
    >
      <path
        fill="#EA4335"
        d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z"
      />
      <path
        fill="#FBBC04"
        d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z"
      />
      <path
        fill="#34A853"
        d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z"
      />
      <path
        fill="#4285F4"
        d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z"
      />
    </svg>
  );
}

// ─── Real Mushi QR Pro Premium Features (from FeatureAccessManager) ─────────
const PRO_FEATURES = [
  {
    icon: QrCode,
    title: 'Unlimited QR & Barcode Generation',
    desc: 'All 20+ QR content types & 25+ barcode standards',
  },
  {
    icon: Image,
    title: 'HD & 4K Vector Export (SVG & PDF)',
    desc: 'Ultra-HD 2048px, 4K 4096px, and scalable SVG/PDF',
  },
  {
    icon: Shapes,
    title: 'Custom Dot & Eye Shapes (37+)',
    desc: '37 dot modules & 35 finder eye frame styles',
  },
  {
    icon: Upload,
    title: 'Custom Background & Artwork Upload',
    desc: 'Background images, textures & transparency',
  },
  {
    icon: Palette,
    title: 'Brand Logo Presets & Background Remover',
    desc: 'Logo gallery, custom upload & BG eraser tool',
  },
  {
    icon: Layers,
    title: 'Bulk Spreadsheet Generator & ZIP Export',
    desc: 'Batch generate 1,000+ codes with label sheets',
  },
];

// ─── Fallback subscription plan data (used when Firestore is unavailable) ───
const FALLBACK_PLANS = [
  { id: 'yearly',  name: 'Yearly Plan',  price: 12.75, period: '/year', desc: 'Best value for professional QR creation', popular: true },
  { id: 'monthly', name: 'Monthly Plan', price: 1.06,  period: '/month', desc: 'Full monthly access for creators' },
  { id: 'weekly',  name: 'Weekly Pass',  price: 0.21,  period: '/week', desc: '7-day full pro access pass' },
];

export default function PremiumModal() {
  const {
    paywallOpen, hidePaywall, paywallFeature,
    premiumFeatures, isPremium, currentPlan,
  } = usePremium();

  const [step, setStep] = useState('features'); // 'features' | 'plans' | 'checkout' | 'processing' | 'success'
  const [livePlans, setLivePlans] = useState({});
  const [selectedPlanId, setSelectedPlanId] = useState('yearly');
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // Subscribe to live subscription_plans from Firestore
  useEffect(() => {
    return onSnapshot(collection(db, 'subscription_plans'), colSnap => {
      const plans = {};
      colSnap.forEach(d => { plans[d.id] = d.data(); });
      setLivePlans(plans);
    }, () => {});
  }, []);

  // Reset step when modal opens
  useEffect(() => {
    if (paywallOpen) {
      setStep('features');
      setError(null);
    }
  }, [paywallOpen]);

  // Merge live Firestore plans with fallback data
  const displayPlans = useMemo(() => {
    return FALLBACK_PLANS.map(fp => {
      const live = livePlans[fp.id];
      return {
        ...fp,
        ...(live || {}),
        id: fp.id,
        name: live?.name || fp.name,
        price: live?.price ?? fp.price,
        period: live?.period || fp.period,
        desc: live?.desc || fp.desc,
        popular: live?.popular ?? fp.popular,
      };
    }).filter(p => p.active !== false);
  }, [livePlans]);

  if (!paywallOpen) return null;

  const isNativeAndroid = PaymentProvider.isNativeAndroid();
  const selectedPlan = displayPlans.find(p => p.id === selectedPlanId) || displayPlans[0];
  const detectedCurrency = detectUserCurrency();

  const lockedFeature = paywallFeature
    ? premiumFeatures.find(f => f.featureId === paywallFeature)
    : null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    hidePaywall();
    setStep('features');
    setError(null);
  };

  const handleBack = () => {
    setError(null);
    if (step === 'plans') setStep('features');
    else if (step === 'checkout') setStep('plans');
    else if (step === 'success') handleClose();
    else handleClose();
  };

  const handlePurchase = async () => {
    if (!isNativeAndroid) return;
    
    setStep('processing');
    setError(null);

    try {
      console.log('[PremiumModal] Initiating purchase for plan:', selectedPlan.id);
      const result = await PaymentProvider.purchase(selectedPlan, {
        currency: detectedCurrency,
        paymentMethod: 'gplay'
      });
      console.log('[PremiumModal] Purchase result:', result?.ok ? 'SUCCESS' : 'UNKNOWN');
      
      // Verify entitlement is actually active
      if (result?.ok) {
        setStep('success');
      } else {
        setError('Purchase could not be confirmed. Please check your subscription status.');
        setStep('checkout');
      }
    } catch (err) {
      console.warn('[PremiumModal] Purchase error:', err.message);
      if (err.message?.toLowerCase().includes('cancel')) {
        setError('Purchase was cancelled.');
      } else {
        setError(err.message || 'Payment was not completed. Please try again.');
      }
      setStep('checkout');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      await PaymentProvider.restorePurchases();
      // If FeatureAccessManager detected active pro after restore, it will update automatically.
      // We don't close the modal since the premium context state change will update the UI.
    } catch (e) {
      setError('Could not restore purchases: ' + e.message);
    } finally {
      setRestoring(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="premium-modal-overlay" onClick={handleClose}>
      <div className="premium-modal" onClick={e => e.stopPropagation()}>
        {/* Mobile Drag Indicator */}
        <div className="premium-modal-handle" />

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1: UPGRADE TO PRO (Features Overview)
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'features' && (
          <div className="pro-step-enter" key="features">
            {/* Header */}
            <div className="pro-header-bar">
              <button className="pro-back-btn" onClick={handleClose} aria-label="Close">
                <ChevronLeft size={20} />
              </button>
              <div style={{ flex: 1 }} />
              <button className="pro-close-btn" onClick={handleClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <h2 className="pro-page-title">Upgrade to Pro</h2>
            <p className="pro-page-subtitle">
              {lockedFeature
                ? `Unlock "${lockedFeature.displayName}" and all premium tools`
                : 'Unlock the full power of Mushi QR'}
            </p>

            {/* Go Pro Hero Banner */}
            <div className="pro-hero-banner">
              <div className="pro-hero-icon">
                <Crown size={22} />
              </div>
              <div className="pro-hero-text" style={{ flex: 1 }}>
                <h3>Go Pro</h3>
                <p>More features. More possibilities.</p>
              </div>
              <div className="pro-hero-arrow">
                <ChevronRight size={22} />
              </div>
            </div>

            {/* Real Pro Feature List */}
            <div className="pro-feature-list">
              {PRO_FEATURES.map((f, i) => (
                <div key={i} className="pro-feature-row">
                  <div className="pro-feature-icon-box">
                    <f.icon size={20} />
                  </div>
                  <div className="pro-feature-info">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button className="pro-btn-primary" onClick={() => setStep('plans')}>
              Upgrade to Pro
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2: CHOOSE YOUR PLAN
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'plans' && (
          <div className="pro-step-enter" key="plans">
            {/* Header */}
            <div className="pro-header-bar">
              <button className="pro-back-btn" onClick={handleBack} aria-label="Back">
                <ChevronLeft size={20} />
              </button>
              <div style={{ flex: 1 }} />
              <button className="pro-close-btn" onClick={handleClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <h2 className="pro-page-title">Choose Your Plan</h2>
            <p className="pro-page-subtitle">Flexible plans for your needs</p>

            {/* Plan Cards */}
            <div className="pro-plan-cards">
              {displayPlans.map(plan => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = isPremium && currentPlan === plan.id;
                const formattedPrice = formatCurrencyPrice(plan.price, detectedCurrency);

                return (
                  <div
                    key={plan.id}
                    className={`pro-plan-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {plan.popular && (
                      <div className="pro-popular-badge">Most Popular</div>
                    )}

                    {/* Radio */}
                    <div className="pro-radio">
                      <div className="pro-radio-dot" />
                    </div>

                    {/* Plan Info */}
                    <div className="pro-plan-info">
                      <div className="pro-plan-name">{plan.name}</div>
                      <div className="pro-plan-desc">{plan.desc}</div>
                      <div className="pro-plan-price-row">
                        <span className="pro-plan-amount">{formattedPrice}</span>
                        <span className="pro-plan-period">{plan.period}</span>
                      </div>
                      <div className="pro-plan-meta">
                        <span className="pro-plan-meta-item">
                          <Check size={12} color="#10B981" /> All Pro features
                        </span>
                        <span className="pro-plan-meta-item">
                          <Check size={12} color="#10B981" /> Cancel anytime
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secure Payment Footer */}
            <div className="pro-secure-footer" style={{ marginBottom: 16 }}>
              <Lock size={14} />
              <span>Secure payment via Google Play</span>
            </div>

            {/* CTA */}
            <button className="pro-btn-primary" onClick={() => setStep('checkout')}>
              Subscribe Now
              <ArrowRight size={18} />
            </button>

            {/* Restore Purchases */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                className="pro-restore-link"
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring ? 'Restoring purchases...' : 'Restore Purchases'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3: CHECKOUT / PAYMENT METHOD
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'checkout' && (
          <div className="pro-step-enter" key="checkout">
            {/* Header */}
            <div className="pro-header-bar">
              <button className="pro-back-btn" onClick={handleBack} aria-label="Back">
                <ChevronLeft size={20} />
              </button>
              <div style={{ flex: 1 }} />
              <span className="pro-header-badge">
                <Crown size={11} /> Pro
              </span>
            </div>

            {/* Title */}
            <h2 className="pro-page-title">Payment Method</h2>
            <p className="pro-page-subtitle">Choose your preferred payment method</p>

            {/* Error Banner */}
            {error && (
              <div className="pro-error-banner">
                <AlertCircle size={16} className="pro-error-banner-icon" />
                <p>{error}</p>
              </div>
            )}

            {/* Selected Plan Summary Card */}
            <div className="pro-checkout-card">
              <div className="pro-checkout-crown">
                <Crown size={22} />
              </div>
              <div className="pro-checkout-info">
                <h4>{selectedPlan.name}</h4>
                <span>{formatCurrencyPrice(selectedPlan.price, detectedCurrency)}{selectedPlan.period}</span>
              </div>
            </div>

            {/* Payment Method: Google Play */}
            <div className="pro-payment-methods">
              <div className="pro-payment-method selected">
                <div className="pro-payment-method-icon gplay">
                  <GooglePlayIcon size={24} />
                </div>
                <div className="pro-payment-method-info" style={{ flex: 1 }}>
                  <h4>Google Play</h4>
                  <p>Subscribe with Google Play (Recommended)</p>
                </div>
                <div className="pro-radio">
                  <div className="pro-radio-dot" style={{ background: '#E60050' }} />
                </div>
              </div>
            </div>

            {/* Localhost Notice (non-native) */}
            {!isNativeAndroid && (
              <div className="pro-localhost-notice">
                <AlertCircle size={16} className="pro-localhost-notice-icon" />
                <p>
                  <strong>Desktop / Browser Testing Mode</strong><br />
                  Google Play In-App Billing requires the native Android app.
                  To complete a purchase, install the app from Google Play Internal Testing
                  and subscribe from there.
                </p>
              </div>
            )}

            {/* Security Info */}
            <div className="pro-payment-secure">
              <Lock size={14} />
              <span>Your payment information is secure and encrypted.</span>
            </div>

            {/* CTA */}
            <button
              className="pro-btn-primary"
              onClick={handlePurchase}
              disabled={!isNativeAndroid}
            >
              {isNativeAndroid ? (
                <>Continue <ArrowRight size={18} /></>
              ) : (
                <>Subscribe via Google Play App</>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4: PROCESSING
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'processing' && (
          <div className="pro-step-enter" key="processing">
            <div className="pro-processing-container">
              <div className="pro-processing-crown">
                <Crown size={36} />
              </div>
              <h3>Processing your purchase...</h3>
              <p>Please wait while we confirm your subscription with Google Play.</p>
              <div className="pro-processing-spinner" />
              <div className="pro-secure-footer" style={{ marginTop: 8 }}>
                <Shield size={14} />
                <span>Your payment is processed securely by Google Play.</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5: SUCCESS
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="pro-step-enter" key="success">
            <div className="pro-success-container">
              <div className="pro-success-crown">
                <Crown size={48} />
              </div>
              <h3>Welcome to Mushi QR Pro!</h3>
              <p>Your subscription is now active.</p>

              {/* Active Plan Card */}
              <div className="pro-active-plan-card">
                <h4>
                  {selectedPlan.name}
                  <span className="pro-active-badge">Active</span>
                </h4>
                <div className="pro-plan-price-row">
                  <span className="pro-plan-amount">{formatCurrencyPrice(selectedPlan.price, detectedCurrency)}</span>
                  <span className="pro-plan-period">{selectedPlan.period}</span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                className="pro-btn-primary"
                onClick={handleClose}
                style={{ marginTop: 8 }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small PRO Badge for locked features ───────────────────────────────────
export function ProBadge({ featureId, onClick, children, style }) {
  const { canAccess, showPaywall } = usePremium();
  
  if (canAccess(featureId)) return children || null;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClick) onClick(e);
    else showPaywall(featureId);
  };

  return (
    <div className="pro-badge-wrapper" style={style}>
      {children}
      <button className="pro-badge" onClick={handleClick} title="PRO feature — tap to upgrade">
        <Crown size={8} />
        <span>PRO</span>
      </button>
    </div>
  );
}
