// src/components/qr-templates/TemplateCustomizer.jsx
import React from 'react';
import { Type, AtSign, Sparkles, RefreshCw, Layers } from 'lucide-react';
import QRDataInput from '../QRDataInput';

export function TemplateCustomizer({
  selectedTemplate,
  headlineText,
  onHeadlineChange,
  handleText,
  onHandleChange,
  qrType,
  qrData,
  onQRDataChange,
  onResetToDefault
}) {
  if (!selectedTemplate) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      background: 'var(--bg-elevated)',
      padding: '16px',
      borderRadius: '18px',
      border: '1.5px solid var(--accent-primary)',
      marginBottom: '16px'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {selectedTemplate.name} Template
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          background: 'rgba(239, 30, 52, 0.1)',
          padding: '3px 8px',
          borderRadius: '8px',
          textTransform: 'uppercase'
        }}>
          {selectedTemplate.category}
        </span>
      </div>

      {/* Editable Headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Top Headline Banner
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '0 12px'
        }}>
          <Type size={14} color="var(--text-tertiary)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            value={headlineText}
            onChange={(e) => onHeadlineChange(e.target.value)}
            placeholder={selectedTemplate.headline || 'HEADLINE'}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}
          />
        </div>
      </div>

      {/* Editable Subtitle / Username */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Bottom Handle / Text
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '0 12px'
        }}>
          <AtSign size={14} color="var(--text-tertiary)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            value={handleText}
            onChange={(e) => onHandleChange(e.target.value)}
            placeholder={selectedTemplate.subtitle || '@handle'}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Reset Defaults button */}
      {onResetToDefault && (
        <button
          onClick={onResetToDefault}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0'
          }}
        >
          <RefreshCw size={11} /> Reset template text to defaults
        </button>
      )}
    </div>
  );
}
