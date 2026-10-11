import React from 'react';
import { X, Info, Tag, Check, Shield, Layers, HelpCircle } from 'lucide-react';

export default function BarcodeInfoModal({
  isOpen,
  onClose,
  bcid,
  standard,
  spec
}) {
  if (!isOpen) return null;

  const info = spec || {
    title: standard?.name || 'Barcode Symbology',
    subtitle: standard?.desc || '',
    type: '1D / 2D Symbology',
    length: 'Variable',
    checksum: 'Self-checking / Modulo',
    usage: 'General Identification'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderRadius: 24,
        padding: '24px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary, #EF1E34)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              TECHNICAL SPECIFICATION
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary, #1C1C1E)' }}>
              {info.title || standard?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-hover, rgba(0,0,0,0.06))',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #636366)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary, #636366)', margin: 0, lineHeight: 1.45 }}>
          {info.subtitle || standard?.desc}
        </p>

        {/* Spec details grid */}
        <div style={{
          background: 'var(--bg-elevated, #F9F9FB)',
          borderRadius: 18,
          border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Symbology Type:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>{info.type || '1D Linear'}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.05))' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Capacity / Length:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>{info.length || 'Variable'}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.05))' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Checksum Requirement:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>{info.checksum || 'Required'}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.05))' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Typical Application:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)', textAlign: 'right', maxWidth: '60%' }}>{info.usage || 'Retail & Logistics'}</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          style={{
            background: 'var(--accent-primary, #EF1E34)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239, 30, 52, 0.3)'
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
