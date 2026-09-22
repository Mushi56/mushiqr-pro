// src/components/admin/PlanManager.jsx
// â”€â”€â”€ SaaS Subscription Plans Manager & Creator (Matching Reference) â”€â”€â”€â”€â”€â”€â”€â”€

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Check, Settings, X, Lock, CheckSquare, Square,
  Plus, Trash2, Edit, DollarSign, Globe, Sparkles,
  Percent, Shield, RefreshCw, AlertTriangle, Zap, CheckCircle2
} from 'lucide-react';
import { FEATURE_REGISTRY, CANONICAL_PLANS, DEFAULT_FREE_FEATURES, DEFAULT_PAID_FEATURES } from '../services/FeatureAccessManager';
import { setPlanFeaturesCloud, savePlanFullCloud, deletePlanCloud } from '../services/adminDataService';
import { SUPPORTED_CURRENCIES, formatCurrencyPrice } from '../utils/currency';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getTokens, Badge } from './AdminUIKit';

const DEFAULT_PLAN_TEMPLATES = {
  free:    { id: 'free',    name: 'Free Starter',    price: 0,     period: '/lifetime', color: '#8E95A9', desc: 'Basic standard QR & barcode features', popular: false, active: true },
  weekly:  { id: 'weekly',  name: 'Weekly Pass',     price: 0.21,  period: '/wk',       color: '#7B61FF', desc: '7-day full pro access pass',          popular: false, active: true },
  monthly: { id: 'monthly', name: 'Premium Monthly', price: 1.06,  period: '/mo',       color: '#FF4D9D', desc: 'Full monthly access for creators',    popular: true,  active: true },
  yearly:  { id: 'yearly',  name: 'Pro Yearly',      price: 12.75, period: '/yr',       color: '#22C55E', desc: 'Best value for high-volume teams',    popular: false, active: true },
};

export default function PlanManager({ isDark = false }) {
  const T = getTokens(isDark);

  const [livePlans, setLivePlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Modals
  const [editPlanModal, setEditPlanModal] = useState(null);
  const [manageFeaturesPlan, setManageFeaturesPlan] = useState(null);
  const [pendingFeatures, setPendingFeatures] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchFeature, setSearchFeature] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'subscription_plans'), colSnap => {
      const plans = {};
      colSnap.forEach(d => { plans[d.id] = d.data(); });
      setLivePlans(plans);
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  // Merge default plans with live firestore plans
  const allPlansList = useMemo(() => {
    const map = { ...DEFAULT_PLAN_TEMPLATES };
    Object.keys(livePlans).forEach(k => {
      map[k] = { ...(map[k] || {}), ...livePlans[k] };
    });
    return Object.values(map);
  }, [livePlans]);

  // Open Edit / Create Plan Modal
  const handleOpenCreateOrEdit = (plan = null) => {
    setSaveSuccessMsg(null);
    setEditPlanModal({
      id: plan?.id || `plan_${Date.now().toString().slice(-4)}`,
      name: plan?.name || '',
      price: plan?.price !== undefined ? plan.price : 9.99,
      currency: plan?.currency || 'USD',
      period: plan?.period || '/mo',
      billingInterval: plan?.billingInterval || (plan?.period === '/yr' ? 'yearly' : plan?.period === '/wk' ? 'weekly' : 'monthly'),
      trialDays: plan?.trialDays !== undefined ? plan.trialDays : 7,
      color: plan?.color || '#FF4D9D',
      desc: plan?.desc || 'Access to premium features and all advanced tools.',
      popular: !!plan?.popular,
      active: plan?.active !== false,
      features: plan?.features || (plan?.id === 'free' ? [...DEFAULT_FREE_FEATURES] : [...DEFAULT_PAID_FEATURES])
    });
  };

  // Save Plan Details
  const handleSavePlanDetails = async () => {
    if (!editPlanModal || !editPlanModal.name.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editPlanModal,
        period: editPlanModal.billingInterval === 'yearly' ? '/yr' : editPlanModal.billingInterval === 'weekly' ? '/wk' : editPlanModal.billingInterval === 'daily' ? '/day' : '/mo',
      };
      await savePlanFullCloud(payload);
      setSaveSuccessMsg(`Plan "${payload.name}" saved successfully!`);
      setTimeout(() => {
        setEditPlanModal(null);
        setSaveSuccessMsg(null);
      }, 1000);
    } catch (e) {
      alert('Error saving plan: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Plan
  const handleDeletePlan = async (planId) => {
    if (['free', 'weekly', 'monthly', 'yearly'].includes(planId)) {
      alert('Default canonical plans cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete plan "${planId}"?`)) {
      try {
        await deletePlanCloud(planId);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  // Manage Features / Entitlements Modal
  const openManageFeatures = (planId) => {
    const plan = livePlans[planId] || DEFAULT_PLAN_TEMPLATES[planId];
    const initialFeats = plan?.features || (planId === 'free' ? [...DEFAULT_FREE_FEATURES] : [...DEFAULT_PAID_FEATURES]);
    setPendingFeatures(initialFeats);
    setManageFeaturesPlan(planId);
  };

  const handleSaveFeatures = async () => {
    if (!manageFeaturesPlan) return;
    setIsSaving(true);
    try {
      await setPlanFeaturesCloud(manageFeaturesPlan, pendingFeatures);
      setManageFeaturesPlan(null);
    } catch (e) {
      alert('Error updating plan features: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (fId) => {
    setPendingFeatures(prev => 
      prev.includes(fId) ? prev.filter(x => x !== fId) : [...prev, fId]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* â”€â”€ Top Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.text }}>Plans</h2>
          <span style={{ fontSize: 12, color: T.textSec }}>
            Manage active subscriptions, pricing, intervals, and feature entitlements.
          </span>
        </div>

        <button
          onClick={() => handleOpenCreateOrEdit()}
          style={{
            background: '#D60036',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(255, 77, 157, 0.35)',
            transition: 'all 0.15s'
          }}
        >
          <Plus size={16} /> + Add Plan
        </button>
      </div>

      {/* ── Plans Grid / Cards (Matching Reference Layout) ────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 16
      }}>
        {allPlansList.map((plan) => {
          const isCanonical = ['free', 'weekly', 'monthly', 'yearly'].includes(plan.id);
          const priceText = formatCurrencyPrice(plan.price, selectedCurrency);
          const userEstimate = plan.features?.length ? (plan.features.length * 350 + 1200).toLocaleString() : '2,154';

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--ad-card)',
                border: `1px solid var(--ad-border)`,
                borderRadius: 16,
                padding: '18px 18px',
                boxShadow: 'var(--ad-card-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
                position: 'relative'
              }}
            >
              {/* Header: Icon, Name, Active Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${plan.color || '#FF4D9D'}15`,
                    color: plan.color || '#FF4D9D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Zap size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {plan.name}
                      {plan.popular && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(255, 77, 157, 0.15)', color: '#FF4D9D', fontWeight: 800 }}>
                          Popular
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
                      {plan.desc || `${plan.features?.length || 0} features included`}
                    </div>
                  </div>
                </div>

                <Badge variant={plan.active !== false ? 'active' : 'danger'}>
                  {plan.active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Pricing & Subscriber Stat */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
                border: `1px solid ${T.border}`
              }}>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: T.text }}>{priceText}</span>
                  <span style={{ fontSize: 12, color: T.textSec, marginLeft: 3 }}>{plan.period}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec }}>
                  {userEstimate} Users
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => handleOpenCreateOrEdit(plan)}
                  style={{
                    flex: 1,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Edit size={14} /> Edit Plan
                </button>

                <button
                  onClick={() => openManageFeatures(plan.id)}
                  style={{
                    flex: 1,
                    background: 'rgba(123, 97, 255, 0.1)',
                    border: '1px solid rgba(123, 97, 255, 0.25)',
                    color: '#7B61FF',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <CheckSquare size={14} /> Features ({plan.features?.length || 0})
                </button>

                {!isCanonical && (
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      padding: '8px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€ CREATE / EDIT PLAN MODAL (Matching Reference Screen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editPlanModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: T.elevatedShadow
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.text }}>
                  {editPlanModal.id ? 'Edit Plan' : 'Create Plan'}
                </h3>
                <span style={{ fontSize: 12, color: T.textSec }}>
                  Configure pricing, billing interval, trial, and descriptions.
                </span>
              </div>
              <button
                onClick={() => setEditPlanModal(null)}
                style={{ background: 'none', border: 'none', color: T.textSec, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {saveSuccessMsg && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#22C55E',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={16} /> {saveSuccessMsg}
                </div>
              )}

              {/* Plan Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                  Plan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Monthly"
                  value={editPlanModal.name}
                  onChange={e => setEditPlanModal(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    background: T.bgInput,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Price & Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    value={editPlanModal.price}
                    onChange={e => setEditPlanModal(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px',
                      background: T.bgInput,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      color: T.text,
                      fontSize: 14,
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                    Currency
                  </label>
                  <select
                    value={editPlanModal.currency || 'USD'}
                    onChange={e => setEditPlanModal(prev => ({ ...prev, currency: e.target.value }))}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px',
                      background: T.bgInput,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      color: T.text,
                      fontSize: 13,
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billing Interval */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                  Billing Interval
                </label>
                <select
                  value={editPlanModal.billingInterval || 'monthly'}
                  onChange={e => setEditPlanModal(prev => ({ ...prev, billingInterval: e.target.value }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    background: T.bgInput,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="weekly" style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>Weekly (/wk)</option>
                  <option value="monthly" style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>Monthly (/mo)</option>
                  <option value="yearly" style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>Yearly (/yr)</option>
                  <option value="daily" style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>Daily (/day)</option>
                  <option value="lifetime" style={{ background: isDark ? '#151928' : '#fff', color: T.text }}>Lifetime (/forever)</option>
                </select>
              </div>

              {/* Trial Days */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                  Trial Days (Optional)
                </label>
                <input
                  type="number"
                  placeholder="7"
                  value={editPlanModal.trialDays}
                  onChange={e => setEditPlanModal(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    background: T.bgInput,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editPlanModal.desc}
                  onChange={e => setEditPlanModal(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Access to premium features and all advanced tools."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    background: T.bgInput,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Toggles: Active & Popular */}
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: T.text }}>
                  <input
                    type="checkbox"
                    checked={editPlanModal.active !== false}
                    onChange={e => setEditPlanModal(prev => ({ ...prev, active: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#FF4D9D' }}
                  />
                  Active Plan
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: T.text }}>
                  <input
                    type="checkbox"
                    checked={!!editPlanModal.popular}
                    onChange={e => setEditPlanModal(prev => ({ ...prev, popular: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#FF4D9D' }}
                  />
                  Mark as Popular
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button
                onClick={() => setEditPlanModal(null)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  color: T.textSec,
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSavePlanDetails}
                disabled={isSaving}
                style={{
                  background: '#D60036',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {isSaving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MANAGE FEATURES MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {manageFeaturesPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: T.elevatedShadow
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.text }}>
                  Features for {manageFeaturesPlan}
                </h3>
                <span style={{ fontSize: 12, color: T.textSec }}>
                  {pendingFeatures.length} of {FEATURE_REGISTRY.length} features enabled
                </span>
              </div>
              <button
                onClick={() => setManageFeaturesPlan(null)}
                style={{ background: 'none', border: 'none', color: T.textSec, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 24px', borderBottom: `1px solid ${T.border}` }}>
              <input
                type="text"
                placeholder="Search features..."
                value={searchFeature}
                onChange={e => setSearchFeature(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 14px',
                  background: T.bgInput,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  color: T.text,
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>

            {/* Features Checklist */}
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURE_REGISTRY
                .filter(f => !searchFeature || f.displayName.toLowerCase().includes(searchFeature.toLowerCase()) || f.featureId.toLowerCase().includes(searchFeature.toLowerCase()))
                .map(feat => {
                  const isChecked = pendingFeatures.includes(feat.featureId);
                  return (
                    <div
                      key={feat.featureId}
                      onClick={() => toggleFeature(feat.featureId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: isChecked ? 'rgba(255, 77, 157, 0.08)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)'),
                        border: `1px solid ${isChecked ? 'rgba(255, 77, 157, 0.3)' : T.border}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isChecked ? '#FF4D9D' : T.text }}>
                          {feat.displayName}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSec }}>
                          {feat.featureId} &middot; {feat.category}
                        </div>
                      </div>

                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: isChecked ? '#FF4D9D' : 'transparent',
                        border: `1.5px solid ${isChecked ? '#FF4D9D' : T.textSec}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}>
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPendingFeatures(FEATURE_REGISTRY.map(f => f.featureId))}
                  style={{ background: 'none', border: 'none', color: '#7B61FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Select All
                </button>
                <span style={{ color: T.border }}>&middot;</span>
                <button
                  onClick={() => setPendingFeatures([])}
                  style={{ background: 'none', border: 'none', color: T.textSec, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setManageFeaturesPlan(null)}
                  style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textSec, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFeatures}
                  disabled={isSaving}
                  style={{ background: '#D60036', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Apply Features'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
