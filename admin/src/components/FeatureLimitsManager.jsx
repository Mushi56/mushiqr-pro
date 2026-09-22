// src/components/admin/FeatureLimitsManager.jsx
// â”€â”€â”€ Quantitative Feature Limits Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Allows Super Admin to configure numerical and quantitative usage limits per plan tier.

import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { T } from './AdminUIKit';

const LIMIT_DEFINITIONS = [
  { id: 'bulk_batch_csv_upload', name: 'Batch QR Spreadsheet Upload Rows', category: 'Bulk Generation', desc: 'Max rows allowed per CSV/XLSX file upload', defaults: { free: 5, weekly: 100, monthly: -1, yearly: -1 } },
  { id: 'bulk_barcode_rows',      name: 'Batch Barcode Rows',               category: 'Bulk Generation', desc: 'Max barcode items generated in a single batch', defaults: { free: 5, weekly: 50,  monthly: -1, yearly: -1 } },
  { id: 'daily_export_quota',     name: 'Daily High-Res Export Limit',      category: 'Export',          desc: 'Max downloads per 24 hours per user',          defaults: { free: 10, weekly: 250, monthly: -1, yearly: -1 } },
  { id: 'cloud_saved_templates',  name: 'Saved Custom Templates Storage',   category: 'Templates',       desc: 'Max saved custom design presets',              defaults: { free: 2, weekly: 20,  monthly: -1, yearly: -1 } },
];

const CANONICAL_PLANS = [
  { id: 'free',    name: 'Free Starter', color: '#64748b' },
  { id: 'weekly',  name: 'Weekly Pass',  color: '#8b5cf6' },
  { id: 'monthly', name: 'Monthly Pro',  color: '#3b82f6' },
  { id: 'yearly',  name: 'Yearly VIP',   color: '#D60036' },
];

export default function FeatureLimitsManager() {
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'global_config', 'membership'));
        if (snap.exists() && snap.data().featureLimits) {
          setLimits(snap.data().featureLimits);
        } else {
          // Initialize defaults
          const init = {};
          LIMIT_DEFINITIONS.forEach(def => {
            init[def.id] = { ...def.defaults };
          });
          setLimits(init);
        }
      } catch (e) {
        console.error('[FeatureLimitsManager] Load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLimitChange = (featureId, planId, value) => {
    const num = parseInt(value, 10);
    setLimits(prev => ({
      ...prev,
      [featureId]: {
        ...(prev[featureId] || {}),
        [planId]: isNaN(num) ? 0 : num
      }
    }));
  };

  const toggleUnlimited = (featureId, planId) => {
    setLimits(prev => {
      const current = prev[featureId]?.[planId];
      const nextVal = current === -1 ? 100 : -1;
      return {
        ...prev,
        [featureId]: {
          ...(prev[featureId] || {}),
          [planId]: nextVal
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Direct write fallback / Cloud Function
      await setDoc(doc(db, 'global_config', 'membership'), {
        featureLimits: limits,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save limits: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--ad-text)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ad-card)', padding: '18px 22px', borderRadius: T.r.lg, border: `1px solid var(--ad-border)`, boxShadow: 'var(--ad-card-shadow)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ad-text)' }}>
            <Sliders size={20} color={T.accent} /> Quantitative Feature Limits
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ad-text-sec)', margin: '4px 0 0' }}>
            Define exact numerical quotas (e.g. batch size, daily exports, saved presets) for each membership tier.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveSuccess && (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={16} /> Limits Published!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#D60036',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)'
            }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Limits Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {LIMIT_DEFINITIONS.map(def => {
          const planLimits = limits[def.id] || def.defaults;

          return (
            <div
              key={def.id}
              style={{
                background: 'var(--ad-card)',
                borderRadius: T.r.lg,
                border: `1px solid var(--ad-border)`,
                boxShadow: 'var(--ad-card-shadow)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ad-text)' }}>{def.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', marginTop: 2 }}>{def.desc} &middot; <span style={{ color: '#FF4D9D', fontWeight: 700 }}>{def.category}</span></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {CANONICAL_PLANS.map(plan => {
                  const val = planLimits[plan.id] !== undefined ? planLimits[plan.id] : (def.defaults[plan.id] ?? -1);
                  const isUnlimited = val === -1;

                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: 'var(--ad-input)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        border: `1px solid ${isUnlimited ? plan.color + '66' : 'var(--ad-border)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: plan.color }}>{plan.name}</span>
                        <button
                          onClick={() => toggleUnlimited(def.id, plan.id)}
                          style={{
                            background: isUnlimited ? plan.color : 'rgba(255, 77, 157, 0.12)',
                            color: isUnlimited ? '#fff' : '#FF4D9D',
                            border: 'none',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <InfinityIcon size={12} /> {isUnlimited ? 'Unlimited' : 'Set Unlimited'}
                        </button>
                      </div>

                      {isUnlimited ? (
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
                          <InfinityIcon size={20} /> Unlimited
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={e => handleLimitChange(def.id, plan.id, e.target.value)}
                          style={{
                            background: 'var(--ad-card)',
                            border: `1px solid var(--ad-border)`,
                            borderRadius: 8,
                            padding: '6px 10px',
                            color: 'var(--ad-text)',
                            fontSize: 14,
                            fontWeight: 700,
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
