import React, { useState, useEffect } from 'react';
import { Moon, Sun, Info, Shield, FileText, ChevronRight, Folder, Settings as SettingsIcon, Sparkles, Scan } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/storage';
import AppIcon from './AppIcon';
import PaidCrownBadge from './PaidCrownBadge';
import { usePremium } from '../services/premiumContext';
import { FeatureAccessManager } from '../services/FeatureAccessManager';

import SaveLocationModal from './SaveLocationModal';
import ScanSettingsModal from './ScanSettingsModal';

export default function SettingsPage({ onNavigate, theme, setTheme, effectiveTheme, currentUser, showToast }) {
  const [saveLocation, setSaveLocation] = useState(() => getPreferences().saveLocation || 'Pictures/Mushi QR Pro');
  const [scanSound, setScanSound] = useState(() => getPreferences().scanSound !== false);
  const [autoOpenUrl, setAutoOpenUrl] = useState(() => getPreferences().autoOpenUrl !== false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const { showPaywall } = usePremium();

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

  const menuItems = [
    {
      id: 'theme',
      label: 'Theme',
      icon: theme === 'dark' ? <Moon size={20} /> : theme === 'light' ? <Sun size={20} /> : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      value: <span style={{
        textTransform: 'capitalize',
        color: theme === 'dark' ? '#00F0FF' : theme === 'light' ? '#FF3B50' : (effectiveTheme === 'dark' ? '#00F0FF' : '#FF3B50'),
        fontWeight: 'bold'
      }}>{theme}</span>,
      onClick: handleThemeChange
    },
    {
      id: 'scanSettings',
      label: 'Scan Settings',
      icon: <Scan size={20} />,
      onClick: () => setIsScanModalOpen(true)
    },
    {
      id: 'saveLocation',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Save Location <PaidCrownBadge featureId="settings_save_location" position="inline" size={9} />
        </span>
      ),
      icon: <Folder size={20} />,
      onClick: handleChooseFolder
    },
    {
      id: 'guide',
      label: 'Welcome Guide & Features',
      icon: <Sparkles size={20} />,
      onClick: () => onNavigate?.('onboarding')
    },
    {
      id: 'about',
      label: 'About Mushi Qr Pro',
      icon: <Info size={20} />,
      onClick: () => window.location.hash = '#/about'
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: <Shield size={20} />,
      onClick: () => window.location.hash = '#/privacy-policy'
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      icon: <FileText size={20} />,
      onClick: () => window.location.hash = '#/terms'
    }
  ];

  return (
    <div className="settings-page fade-in" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', 
        paddingLeft: 'var(--main-padding-x)', 
        paddingRight: 'var(--main-padding-x)', 
        paddingBottom: '16px', 
        background: 'var(--bg-primary)', 
        zIndex: 10 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative'
        }}>
          <div className="page-header-icon-box" style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 30, 52, 0.2)',
            flexShrink: 0
          }}>
            <SettingsIcon size={20} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>Settings</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              Customize your app experience
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px var(--main-padding-x) 100px' }}>

        <div className="settings-group-container">
          {menuItems.map((item, index) => {
            // Pick a background gradient based on the setting ID
            let gradient = 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)';
            if (item.id === 'scanSettings') gradient = 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
            else if (item.id === 'saveLocation') gradient = 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)';
            else if (item.id === 'guide') gradient = 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)';
            else if (item.id === 'about') gradient = 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)';
            else if (item.id === 'privacy') gradient = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
            else if (item.id === 'terms') gradient = 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)';

            return (
              <div key={item.id}>
                <div 
                  onClick={item.onClick}
                  className="settings-row-item"
                >
                  <div className="icon-container-gradient" style={{ background: gradient }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: '15px', fontWeight: 600 }}>
                    {item.label}
                  </div>
                  {item.value && (
                    <div style={{ marginRight: '12px', fontSize: '14px' }}>
                      {item.value}
                    </div>
                  )}
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
                {index < menuItems.length - 1 && (
                  <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '72px' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <AppIcon size={56} shadow />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Mushi Qr Pro</p>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Version 1.1.0</p>
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
