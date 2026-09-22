import React, { useMemo } from 'react';
import { Pencil, Check, AlertCircle, Sparkles, RefreshCw, Hash } from 'lucide-react';
import {
  calculateEAN13CheckDigit,
  calculateUPCACheckDigit,
  calculateEAN8CheckDigit,
  calculateITF14CheckDigit,
  validateBarcodeChecksum
} from '../../utils/barcodeStandardsExtended';

export default function BarcodeContentTab({
  bcid,
  text,
  onChangeText,
  currentStandard,
  spec,
  autoCheckDigit,
  onToggleAutoCheckDigit,
  onOpenDataModal
}) {
  const digits = String(text || '').replace(/\D/g, '');

  // Determine check digit calculations
  const checkDigitInfo = useMemo(() => {
    return validateBarcodeChecksum(bcid, text);
  }, [bcid, text]);

  // Handle manual input with auto-check digit handling
  const handleInputChange = (e) => {
    let val = e.target.value;

    if (bcid === 'ean13') {
      const clean = val.replace(/\D/g, '').slice(0, 13);
      if (autoCheckDigit) {
        if (clean.length === 12) {
          const cd = calculateEAN13CheckDigit(clean);
          onChangeText(`${clean}${cd}`);
          return;
        } else if (clean.length === 13) {
          const cd = calculateEAN13CheckDigit(clean.slice(0, 12));
          onChangeText(`${clean.slice(0, 12)}${cd}`);
          return;
        }
      }
      onChangeText(clean);
      return;
    }

    if (bcid === 'upca') {
      const clean = val.replace(/\D/g, '').slice(0, 12);
      if (autoCheckDigit) {
        if (clean.length === 11) {
          const cd = calculateUPCACheckDigit(clean);
          onChangeText(`${clean}${cd}`);
          return;
        } else if (clean.length === 12) {
          const cd = calculateUPCACheckDigit(clean.slice(0, 11));
          onChangeText(`${clean.slice(0, 11)}${cd}`);
          return;
        }
      }
      onChangeText(clean);
      return;
    }

    if (bcid === 'ean8') {
      const clean = val.replace(/\D/g, '').slice(0, 8);
      if (autoCheckDigit) {
        if (clean.length === 7) {
          const cd = calculateEAN8CheckDigit(clean);
          onChangeText(`${clean}${cd}`);
          return;
        } else if (clean.length === 8) {
          const cd = calculateEAN8CheckDigit(clean.slice(0, 7));
          onChangeText(`${clean.slice(0, 7)}${cd}`);
          return;
        }
      }
      onChangeText(clean);
      return;
    }

    if (bcid === 'itf14') {
      const clean = val.replace(/\D/g, '').slice(0, 14);
      if (autoCheckDigit) {
        if (clean.length === 13) {
          const cd = calculateITF14CheckDigit(clean);
          onChangeText(`${clean}${cd}`);
          return;
        } else if (clean.length === 14) {
          const cd = calculateITF14CheckDigit(clean.slice(0, 13));
          onChangeText(`${clean.slice(0, 13)}${cd}`);
          return;
        }
      }
      onChangeText(clean);
      return;
    }

    onChangeText(val);
  };

  const isEan13 = bcid === 'ean13';
  const isUpcA = bcid === 'upca';
  const isEan8 = bcid === 'ean8';
  const isItf14 = bcid === 'itf14';
  const supportsAutoChecksum = isEan13 || isUpcA || isEan8 || isItf14;

  const isNumericOnly = currentStandard?.validate && currentStandard.errorMsg?.toLowerCase().includes('digit');

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Format Subtitle Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2px'
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary, #1C1C1E)', letterSpacing: '-0.3px' }}>
            {spec?.title || currentStandard?.name}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', margin: '2px 0 0 0' }}>
            {spec?.subtitle || currentStandard?.desc}
          </p>
        </div>

        {/* Structured Field Assistant button */}
        <button
          onClick={onOpenDataModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(214, 0, 61, 0.08)',
            border: '1px solid rgba(214, 0, 61, 0.2)',
            color: 'var(--accent-primary, #D6003D)',
            padding: '8px 14px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Pencil size={13} strokeWidth={2.5} />
          <span>Fields</span>
        </button>
      </div>

      {/* ── Barcode Content Input ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            CONTENT / DATA
          </label>
          <span style={{ fontSize: 11, color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>
            {text.length} chars
          </span>
        </div>

        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input, #FFFFFF)',
          borderRadius: 16,
          border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
          padding: '0 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          height: 48
        }}>
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            inputMode={isNumericOnly ? 'numeric' : 'text'}
            placeholder={currentStandard?.placeholder || 'Enter barcode data'}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.5px',
              color: 'var(--text-primary, #1C1C1E)'
            }}
          />
          {text && (
            <button
              onClick={() => onChangeText('')}
              style={{
                background: 'var(--bg-hover, rgba(0,0,0,0.05))',
                border: 'none',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted, #8E8E93)',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
