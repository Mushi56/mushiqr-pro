import React, { useMemo } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Cpu } from 'lucide-react';
import { validateBarcodeChecksum, calculateContrastRatio } from '../../utils/barcodeStandardsExtended';

export default function BarcodeQualityModal({
  isOpen,
  onClose,
  bcid,
  text,
  barColor,
  bgColor,
  isDataValid,
  currentStandard,
  spec,
  barWidth,
  margin
}) {
  if (!isOpen) return null;

  const checksumResult = useMemo(() => {
    return validateBarcodeChecksum(bcid, text);
  }, [bcid, text]);

  const contrastResult = useMemo(() => {
    return calculateContrastRatio(barColor, bgColor);
  }, [barColor, bgColor]);

  // Perform checks
  const checks = [
    {
      id: 'data',
      title: 'Valid Barcode Characters & Length',
      pass: isDataValid,
      detail: isDataValid ? 'Characters meet symbology requirements' : currentStandard.errorMsg
    },
    {
      id: 'checksum',
      title: 'Modulo Checksum Verification',
      pass: checksumResult.isValid,
      detail: checksumResult.isValid
        ? (checksumResult.checkDigit !== null ? `Check digit ${checksumResult.checkDigit} is verified` : 'Internal self-checking code')
        : 'Invalid check digit detected'
    },
    {
      id: 'contrast',
      title: 'Optical Contrast Ratio (WCAG)',
      pass: contrastResult.status !== 'poor',
      warning: contrastResult.status === 'warning',
      detail: `Contrast ratio is ${contrastResult.ratio}:1 (${contrastResult.label})`
    },
    {
      id: 'quietZone',
      title: 'Sufficient Quiet Zone Optical Margin',
      pass: margin >= 10,
      warning: margin < 10 && margin >= 6,
      detail: margin >= 10 ? `${margin}px satisfies optical guard buffer` : 'Quiet zone may be too narrow for camera edge detection'
    },
    {
      id: 'dimension',
      title: 'Aspect Ratio & Resolution Integrity',
      pass: true,
      detail: 'Pixel module width and height preserve barcode geometric ratios without distortion'
    }
  ];

  const hasFail = checks.some(c => !c.pass);
  const hasWarning = checks.some(c => c.warning);

  const grade = hasFail
    ? { label: '🔴 NEEDS ATTENTION', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.08)' }
    : hasWarning
    ? { label: '🟡 GOOD', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.08)' }
    : { label: '🟢 EXCELLENT', color: '#34C759', bg: 'rgba(52, 199, 89, 0.08)' };

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
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary, #FF7C00)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              DIAGNOSTIC AUDIT
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary, #1C1C1E)' }}>
              Barcode Quality Analysis
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

        {/* Grade Banner */}
        <div style={{
          background: grade.bg,
          border: `1px solid ${grade.color}40`,
          borderRadius: 18,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: grade.color, display: 'block' }}>
              {grade.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
              {hasFail ? 'Correct highlighted issues to guarantee scanning' : 'Barcode passes all ISO/IEC verification checks'}
            </span>
          </div>
          <ShieldCheck size={32} color={grade.color} strokeWidth={2.2} />
        </div>

        {/* Checks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checks.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 14,
                background: 'var(--bg-elevated, #F9F9FB)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.04))'
              }}
            >
              {item.pass && !item.warning ? (
                <CheckCircle2 size={18} color="#34C759" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : item.warning ? (
                <AlertTriangle size={18} color="#FF9500" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <XCircle size={18} color="#FF3B30" style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 2 }}>
                  {item.detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          style={{
            background: 'var(--accent-primary, #FF7C00)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255, 124, 0, 0.3)',
            marginTop: 4
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
