import React, { useState, useEffect } from 'react';
import {
  Settings, ChevronRight, Moon, Sun, Info, Shield, FileText, Folder, Crown, Zap, Star, Sparkles, Scan
} from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/storage';
import { usePremium } from '../services/premiumContext';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import PaidCrownBadge from './PaidCrownBadge';

import SaveLocationModal from './SaveLocationModal';
import ScanSettingsModal from './ScanSettingsModal';

export default function YouPage({ onNavigate, theme, setTheme, effectiveTheme, currentUser, showToast }) {
  const [saveLocation, setSaveLocation] = useState(() => getPreferences().saveLocation || 'Pictures/Mushi QR Pro');
  const [scanSound, setScanSound] = useState(() => getPreferences().scanSound !== false);
  const [autoOpenUrl, setAutoOpenUrl] = useState(() => getPreferences().autoOpenUrl !== false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const { isPremium, currentPlan, showPaywall, subscription } = usePremium();

  useEffect(() => {
    const handlePrefSync = () => {
      const prefs = getPreferences();
      setSaveLocation(prefs.saveLocation || 'Pictures/Mushi QR Pro');
      setScanSound(prefs.scanSound !== false);
      setAutoOpenUrl(prefs.autoOpenUrl !== false);
    };
    window.addEventListener('preferences-sync', handlePrefSync);
    return () => window.removeEventListener('preferences-sync', handlePrefSync);
  }, []);

  const handleThemeChange = () => {
    let next;
    if (theme === 'dark') next = 'light';
    else if (theme === 'light') next = 'auto';
    else next = 'dark';
    setTheme(next);
    const updated = { ...getPreferences(), theme: next };
    savePreferences(updated);
    window.dispatchEvent(new Event('preferences-sync'));
  };

  const handleChooseFolder = () => {
    const access = FeatureAccessManager.canUseFeature('settings_save_location');
    if (!access.allowed) {
      showPaywall('settings_save_location');
      return;
    }
    setIsFolderModalOpen(true);
  };

  return (
    <div className="you-page fade-in" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px var(--main-padding-x) 100px' }}>


        {/* ── Premium Subscription Card ── */}
        {!isPremium ? (
          <div
            onClick={() => showPaywall()}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #EF1E34 0%, #ff4d6d 50%, #8b5cf6 100%)',
              borderRadius: '18px',
              padding: '22px 20px',
              marginBottom: '16px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.2s',
            }}
          >
            {/* Decorative sparkle */}
            <div style={{ position: 'absolute', top: 10, right: 16, opacity: 0.25 }}>
              <Sparkle />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Crown size={24} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 3 }}>
                  Upgrade to Pro
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                  Unlock all premium features, templates & export options
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 5,
                flexShrink: 0,
              }}>
                <Zap size={13} color="#fff" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>GO PRO</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '18px 20px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${currentPlan?.color || '#8b5cf6'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Crown size={22} color={currentPlan?.color || '#8b5cf6'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentPlan?.name || 'Pro'} Plan
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    background: `${currentPlan?.color || '#8b5cf6'}20`,
                    color: currentPlan?.color || '#8b5cf6',
                    padding: '2px 7px', borderRadius: 100, letterSpacing: '0.5px',
                  }}>Active</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  All premium features unlocked
                </div>
              </div>
              <Star size={20} color={currentPlan?.color || '#8b5cf6'} fill={currentPlan?.color || '#8b5cf6'} />
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="settings-group-container" style={{ borderRadius: '16px', overflow: 'hidden' }}>

          {/* Subscription */}
          <div className="settings-row-item" onClick={() => showPaywall()} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #EF1E34 0%, #ff4d6d 100%)' }}>
              <Crown size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Subscription</div>
            <div style={{ marginRight: '12px', fontSize: '13px', color: isPremium ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold' }}>
              {isPremium ? (currentPlan?.name || 'Pro') : 'Free'}
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Theme */}
          <div className="settings-row-item" onClick={handleThemeChange} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
            }}>
              {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Theme</div>
            <div style={{ marginRight: '12px', fontSize: '13px', textTransform: 'capitalize', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              {theme}
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Scan Settings */}
          <div className="settings-row-item" onClick={() => setIsScanModalOpen(true)} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
              <Scan size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Scan Settings</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Save Location */}
          <div className="settings-row-item" onClick={handleChooseFolder} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
              <Folder size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Save Location <PaidCrownBadge featureId="settings_save_location" position="inline" size={9} />
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Welcome Guide / Onboarding */}
          <div className="settings-row-item" onClick={() => onNavigate?.('onboarding')} style={{ padding: '16px', cursor: 'pointer' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
              <Sparkles size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Welcome Guide &amp; Features</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* About */}
          <div className="settings-row-item" onClick={() => window.location.hash = '#/about'} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }}>
              <Info size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>About Mushi QR Pro</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Privacy Policy */}
          <div className="settings-row-item" onClick={() => window.location.hash = '#/privacy-policy'} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)' }}>
              <Shield size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Privacy Policy</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '64px' }} />

          {/* Terms of Service */}
          <div className="settings-row-item" onClick={() => window.location.hash = '#/terms'} style={{ padding: '16px' }}>
            <div className="icon-container-gradient" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}>
              <FileText size={18} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Terms of Service</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      <SaveLocationModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={(newLoc) => setSaveLocation(newLoc)}
        showToast={showToast}
      />

      <ScanSettingsModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}

// Decorative sparkle SVG for the premium card
function Sparkle() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M30 0L33.5 26.5L60 30L33.5 33.5L30 60L26.5 33.5L0 30L26.5 26.5L30 0Z" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

