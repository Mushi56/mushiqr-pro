// src/components/admin/FeatureMatrixManager.jsx
// â”€â”€â”€ Visual Feature Ã— Plan Matrix Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Allows Super Admin to dynamically assign any of the 78 canonical features to specific plans.

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Shield, Sparkles, Layers, Search, 
  RefreshCw, Save, CheckCircle2, Lock, SlidersHorizontal
} from 'lucide-react';
import { FEATURE_REGISTRY, FEATURE_CATEGORIES } from '../services/FeatureAccessManager';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

const CANONICAL_PLANS = [
  { id: 'free',    name: 'Free Tier',    color: '#64748b' },
  { id: 'weekly',  name: 'Weekly Pass',  color: '#8b5cf6' },
  { id: 'monthly', name: 'Monthly Pro',  color: '#3b82f6' },
  { id: 'yearly',  name: 'Yearly VIP',   color: '#D60036' },
];

export default function FeatureMatrixManager({ onClose }) {
  const [matrix, setMatrix] = useState({});
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing membership configuration from Firestore
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'global_config', 'membership'));
        if (snap.exists()) {
          const data = snap.data();
          setMatrix(data.featureMatrix || {});
          setLimits(data.featureLimits || {});
        } else {
          // Initialize defaults
          const initMatrix = {};
          FEATURE_REGISTRY.forEach(f => {
            initMatrix[f.featureId] = f.defaultPlan === 'free' 
              ? ['free', 'weekly', 'monthly', 'yearly']
              : ['weekly', 'monthly', 'yearly'];
          });
          setMatrix(initMatrix);
        }
      } catch (e) {
        console.error('[FeatureMatrixManager] Failed to load matrix:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredFeatures = useMemo(() => {
    return FEATURE_REGISTRY.filter(f => {
      const matchCat = selectedCat === 'ALL' || f.category === selectedCat;
      const matchSearch = !search || 
        f.displayName.toLowerCase().includes(search.toLowerCase()) ||
        f.featureId.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, search]);

  const toggleFeaturePlan = (featureId, planId) => {
    setMatrix(prev => {
      const currentList = prev[featureId] || [];
      let nextList;
      if (currentList.includes(planId)) {
        nextList = currentList.filter(p => p !== planId);
      } else {
        nextList = [...currentList, planId];
      }
      return { ...prev, [featureId]: nextList };
    });
  };

  const setFeatureTierQuick = (featureId, targetTier) => {
    setMatrix(prev => ({
      ...prev,
      [featureId]: targetTier === 'free'
        ? ['free', 'weekly', 'monthly', 'yearly']
        : ['weekly', 'monthly', 'yearly']
    }));
  };

  const setAllFilteredFeaturesTierQuick = (targetTier) => {
    setMatrix(prev => {
      const updated = { ...prev };
      filteredFeatures.forEach(f => {
        updated[f.featureId] = targetTier === 'free'
          ? ['free', 'weekly', 'monthly', 'yearly']
          : ['weekly', 'monthly', 'yearly'];
      });
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Direct Firestore write for development
      await setDoc(doc(db, 'global_config', 'membership'), {
        featureMatrix: matrix,
        featureLimits: limits,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update subscription_plans/free features array
      const freeFeats = Object.entries(matrix)
        .filter(([_, plans]) => Array.isArray(plans) && plans.includes('free'))
        .map(([k]) => k);
      await setDoc(doc(db, 'subscription_plans', 'free'), { features: freeFeats }, { merge: true });

      // Optional background cloud function sync
      try {
        const publishFn = httpsCallable(functions, 'publishMembershipConfig');
        publishFn({
          plans: {
            free:    { name: 'Free Tier', active: true },
            weekly:  { name: 'Weekly Pass', active: true },
            monthly: { name: 'Monthly Pro', active: true },
            yearly:  { name: 'Yearly VIP', active: true },
          },
          featureMatrix: matrix,
          featureLimits: limits,
        }).catch(() => {});
      } catch {}

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('[FeatureMatrixManager] Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: 20, padding: '24px', color: 'var(--ad-text)', boxShadow: 'var(--ad-card-shadow)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ad-text)' }}>
            <SlidersHorizontal size={20} color="#FF4D9D" />
            Feature &times; Plan Entitlement Matrix
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ad-text-sec)', margin: '4px 0 0' }}>
            Control which subscription tier has access to each of the canonical app capabilities with 1-click Free/Pro actions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {saveSuccess && (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={16} /> Saved &amp; Version Published!
            </span>
          )}
          <button
            onClick={() => setAllFilteredFeaturesTierQuick('free')}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Make all currently filtered features Free"
          >
            <Shield size={14} />
            <span>Make All Free</span>
          </button>
          <button
            onClick={() => setAllFilteredFeaturesTierQuick('paid')}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Make all currently filtered features Pro Only"
          >
            <Sparkles size={14} />
            <span>Make All Pro</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#D60036',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 18px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)'
            }}
          >
            <Save size={14} />
            {saving ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ad-input)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--ad-border)', flex: 1, minWidth: 200 }}>
          <Search size={14} color="var(--ad-text-sec)" />
          <input
            type="text"
            placeholder="Search features..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', color: 'var(--ad-text)', outline: 'none', fontSize: 12, width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          style={{ background: 'var(--ad-input)', color: 'var(--ad-text)', border: '1px solid var(--ad-border)', padding: '6px 12px', borderRadius: 10, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
        >
          <option value="ALL">All Categories ({FEATURE_REGISTRY.length})</option>
          {Object.entries(FEATURE_CATEGORIES).map(([key, cat]) => (
            <option key={key} value={key}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Matrix Table */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--ad-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'var(--ad-input)', borderBottom: '1px solid var(--ad-border)' }}>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: 'var(--ad-text-sec)' }}>Feature Capability</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: 'var(--ad-text-sec)' }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', textAlign: 'center' }}>1-Click Tier</th>
              {CANONICAL_PLANS.map(plan => (
                <th key={plan.id} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, color: plan.color, textAlign: 'center' }}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.map(feat => {
              const assignedPlans = matrix[feat.featureId] || [];
              const isFree = assignedPlans.includes('free');
              return (
                <tr key={feat.featureId} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ad-text)' }}>{feat.displayName}</div>
                    <div style={{ fontSize: 10, color: 'var(--ad-text-sec)', marginTop: 2 }}>{feat.featureId}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--ad-text-sec)' }}>
                    {FEATURE_CATEGORIES[feat.category]?.name || feat.category}
                  </td>
                  {/* 1-Click Quick Tier Switcher */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--ad-input)', borderRadius: 10, padding: 2, border: '1px solid var(--ad-border)', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => setFeatureTierQuick(feat.featureId, 'free')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          border: 'none',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: isFree ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                          color: isFree ? '#fff' : 'var(--ad-text-sec)',
                        }}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureTierQuick(feat.featureId, 'paid')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          border: 'none',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: !isFree ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                          color: !isFree ? '#fff' : 'var(--ad-text-sec)',
                        }}
                      >
                        Pro
                      </button>
                    </div>
                  </td>
                  {CANONICAL_PLANS.map(plan => {
                    const isChecked = assignedPlans.includes(plan.id);
                    return (
                      <td key={plan.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleFeaturePlan(feat.featureId, plan.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: `1.5px solid ${isChecked ? plan.color : 'var(--ad-border)'}`,
                            background: isChecked ? `${plan.color}22` : 'transparent',
                            color: isChecked ? plan.color : 'var(--ad-text-sec)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {isChecked ? <Check size={14} strokeWidth={3} /> : <X size={12} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
