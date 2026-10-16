import React, { useState } from 'react';
import { Minus, Plus, Check, Info, ShieldAlert } from 'lucide-react';
import { convertDimension } from '../../utils/barcodeStandardsExtended';

export default function BarcodeDimensionsTab({
  bcid,
  currentStandard,
  spec,
  barWidth,
  height,
  margin,
  onChangeDimensions
}) {
  const [mode, setMode] = useState('standard'); // 'standard' | 'custom'
  const [unit, setUnit] = useState('mm'); // 'mm' | 'in' | 'px'

  const is2D = currentStandard?.category === '2d-matrix';
  const isHeightApplicable = currentStandard?.heightApplicable && !is2D;

  const stdDims = spec?.standardDims || {
    moduleWidthMm: 0.33,
    barHeightMm: 22.85,
    quietZoneMm: 3.63,
    moduleWidthPx: 2,
    barHeightPx: 85,
    quietZonePx: 16
  };

  // Convert stored values to current active unit for display
  const getDisplayVal = (pxVal, fallbackMm) => {
    if (unit === 'px') return pxVal;
    const inMm = fallbackMm !== undefined ? fallbackMm : pxVal / 3.78;
    return convertDimension(inMm, 'mm', unit);
  };

  const handleApplyStandard = () => {
    onChangeDimensions({
      barWidth: stdDims.moduleWidthPx || 2,
      height: stdDims.barHeightPx || 85,
      margin: stdDims.quietZonePx || 16
    });
  };

  const stepModuleWidth = (delta) => {
    const min = currentStandard.minBarWidth || 1;
    const max = currentStandard.maxBarWidth || 4;
    const step = currentStandard.stepBarWidth || 0.5;
    const next = Math.min(max, Math.max(min, barWidth + delta * step));
    onChangeDimensions({ barWidth: Math.round(next * 10) / 10 });
  };

  const stepBarHeight = (delta) => {
    const min = currentStandard.minHeight || 30;
    const max = currentStandard.maxHeight || 160;
    const step = currentStandard.stepHeight || 5;
    const cur = height || currentStandard.defaultHeight || 80;
    const next = Math.min(max, Math.max(min, cur + delta * step));
    onChangeDimensions({ height: next });
  };

  const stepQuietZone = (delta) => {
    const min = 4;
    const max = 40;
    const step = 2;
    const next = Math.min(max, Math.max(min, margin + delta * step));
    onChangeDimensions({ margin: next });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Mode Switcher & Unit Selector ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card, #FFFFFF)',
        padding: '6px',
        borderRadius: 16,
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Standard / Custom Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['standard', 'custom'].map(m => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                if (m === 'standard') handleApplyStandard();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: 'none',
                background: mode === m ? 'var(--accent-primary, #FF7C00)' : 'transparent',
                color: mode === m ? '#FFFFFF' : 'var(--text-secondary, #636366)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Units: mm | in | px */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-hover, rgba(0,0,0,0.04))', padding: '3px', borderRadius: 10 }}>
          {['mm', 'in', 'px'].map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: 'none',
                background: unit === u ? '#FFFFFF' : 'transparent',
                color: unit === u ? 'var(--accent-primary, #FF7C00)' : 'var(--text-muted, #8E8E93)',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                boxShadow: unit === u ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* ── STANDARD MODE ── */}
      {mode === 'standard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'var(--bg-card, #FFFFFF)',
            borderRadius: 18,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary, #1C1C1E)' }}>
                  {spec?.title || currentStandard.name} Standard Spec
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', display: 'block', marginTop: 2 }}>
                  Official ISO / GS1 recommended specifications
                </span>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#34C759',
                background: 'rgba(52, 199, 89, 0.1)',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                100% Magnification
              </span>
            </div>

            <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.06))' }} />

            {/* Parameter Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', fontWeight: 500 }}>
                  Module Width / X-Dimension:
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
                  {getDisplayVal(stdDims.moduleWidthPx, stdDims.moduleWidthMm)} {unit}
                </span>
              </div>

              {isHeightApplicable && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', fontWeight: 500 }}>
                    Bar Height:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
                    {getDisplayVal(stdDims.barHeightPx, stdDims.barHeightMm)} {unit}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', fontWeight: 500 }}>
                  Quiet Zone (Margin):
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
                  {getDisplayVal(stdDims.quietZonePx, stdDims.quietZoneMm)} {unit}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 30, 52, 0.04)',
            border: '1px solid rgba(239, 30, 52, 0.15)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Info size={16} color="var(--accent-primary, #FF7C00)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', lineHeight: 1.4 }}>
              Use standard dimensions for best scanning and print reliability in industrial/retail environments.
            </span>
          </div>
        </div>
      )}

      {/* ── CUSTOM MODE ── */}
      {mode === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Module Width / X-Dimension Control */}
          <div style={{
            background: 'var(--bg-card, #FFFFFF)',
            borderRadius: 18,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
                  Module Width / X-Dimension
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted, #8E8E93)' }}>
                  Thickness of narrowest bar/element
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => stepModuleWidth(-1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                  {getDisplayVal(barWidth * 4, stdDims.moduleWidthMm * (barWidth / 2))} {unit}
                </span>
                <button
                  onClick={() => stepModuleWidth(1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <input
              type="range"
              min={currentStandard.minBarWidth || 1}
              max={currentStandard.maxBarWidth || 4}
              step={currentStandard.stepBarWidth || 0.5}
              value={barWidth}
              onChange={(e) => onChangeDimensions({ barWidth: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Bar Height Control */}
          {isHeightApplicable ? (
            <div style={{
              background: 'var(--bg-card, #FFFFFF)',
              borderRadius: 18,
              border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
                    Bar Height
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted, #8E8E93)' }}>
                    Vertical height of barcode bars
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => stepBarHeight(-1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                    {getDisplayVal(height || currentStandard.defaultHeight || 80, ((height || 80) / 85) * stdDims.barHeightMm)} {unit}
                  </span>
                  <button
                    onClick={() => stepBarHeight(1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={currentStandard.minHeight || 30}
                max={currentStandard.maxHeight || 160}
                step={currentStandard.stepHeight || 5}
                value={height || currentStandard.defaultHeight || 80}
                onChange={(e) => onChangeDimensions({ height: parseInt(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          ) : (
            <div style={{
              background: 'rgba(52, 199, 89, 0.08)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Check size={16} color="#34C759" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-primary, #1C1C1E)', fontWeight: 600, lineHeight: 1.3 }}>
                Height locked to 1:1 square/hexagonal ratio. 2D modules are preserved without stretching.
              </span>
            </div>
          )}

          {/* Quiet Zone Control */}
          <div style={{
            background: 'var(--bg-card, #FFFFFF)',
            borderRadius: 18,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
                  Quiet Zone
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted, #8E8E93)' }}>
                  Clear optical margin around symbol
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => stepQuietZone(-1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                  {getDisplayVal(margin, (margin / 16) * stdDims.quietZoneMm)} {unit}
                </span>
                <button
                  onClick={() => stepQuietZone(1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-color, rgba(0,0,0,0.1))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <input
              type="range"
              min={4}
              max={40}
              step={2}
              value={margin}
              onChange={(e) => onChangeDimensions({ margin: parseInt(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
