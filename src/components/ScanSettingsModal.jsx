import React, { useState, useEffect } from 'react';
import { Scan, X, Volume2, VolumeX, ExternalLink, Check } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/storage';

export default function ScanSettingsModal({ isOpen, onClose, showToast }) {
  const [scanSound, setScanSound] = useState(() => getPreferences().scanSound !== false);
  const [autoOpenUrl, setAutoOpenUrl] = useState(() => getPreferences().autoOpenUrl !== false);

  useEffect(() => {
    if (isOpen) {
      const prefs = getPreferences();
      setScanSound(prefs.scanSound !== false);
      setAutoOpenUrl(prefs.autoOpenUrl !== false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !scanSound;
    setScanSound(next);
    const updated = { ...getPreferences(), scanSound: next };
    savePreferences(updated);
    try { localStorage.setItem('qrgen_scan_sound', String(next)); } catch {}
    window.dispatchEvent(new Event('preferences-sync'));
  };

  const handleToggleAutoOpenUrl = () => {
    const next = !autoOpenUrl;
    setAutoOpenUrl(next);
    const updated = { ...getPreferences(), autoOpenUrl: next };
    savePreferences(updated);
    try { localStorage.setItem('qrgen_auto_open_url', String(next)); } catch {}
    window.dispatchEvent(new Event('preferences-sync'));
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(9, 9, 15, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated, #0C0C14)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '24px',
          padding: '24px 20px',
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          animation: 'dropdownFadeIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 8px 18px rgba(6, 182, 212, 0.35)'
            }}>
              <Scan size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Scan Settings
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Configure scanner behaviors
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--bg-hover, rgba(255,255,255,0.08))',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          margin: '8px 0 16px'
        }}>
          {/* Option 1: Scan Beep Sound */}
          <div 
            onClick={handleToggleSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-secondary, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: scanSound 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' 
                  : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: scanSound ? '#FFFFFF' : 'var(--text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                {scanSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Scan Beep Sound
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Play audio feedback on detection
                </div>
              </div>
            </div>
            {/* Switch */}
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: scanSound ? 'var(--accent-primary, #D60036)' : 'rgba(255, 255, 255, 0.18)',
              padding: '2px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.25s ease',
              flexShrink: 0
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                transform: scanSound ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>

          {/* Option 2: Auto Open Scanned URL */}
          <div 
            onClick={handleToggleAutoOpenUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-secondary, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: autoOpenUrl 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: autoOpenUrl ? '#FFFFFF' : 'var(--text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <ExternalLink size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Auto Open Scanned URL
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Automatically open web links upon scan
                </div>
              </div>
            </div>
            {/* Switch */}
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: autoOpenUrl ? 'var(--accent-primary, #D60036)' : 'rgba(255, 255, 255, 0.18)',
              padding: '2px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.25s ease',
              flexShrink: 0
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                transform: autoOpenUrl ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '14px',
            background: 'var(--accent-gradient, linear-gradient(135deg, #D60036 0%, #FF2A55 100%))',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Check size={16} /> Done
        </button>
      </div>
    </div>
  );
}
