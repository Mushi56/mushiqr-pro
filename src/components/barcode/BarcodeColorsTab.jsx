import React, { useMemo } from 'react';
import { Pipette, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import ColorPicker from '../ColorPicker';
import { calculateContrastRatio } from '../../utils/barcodeStandardsExtended';

// ─── Classic Swatches ────────────────────────────────────────────────────────
const BAR_SWATCHES = [
  '#000000', '#FF3B30', '#007AFF', '#34C759', '#FFCC00', '#AF52DE',
  '#5856D6', '#FF9500', '#FF2D55', '#1C1C1E', '#3A3A3C', '#8E8E93'
];

const BG_SWATCHES = [
  '#FFFFFF', '#F2F2F7', '#E5E5EA', '#EFEFF4', '#000000', '#0A0A0F',
  '#FFF8F0', '#F0F9FF', '#F0FFF4', '#FAF0FF', '#FFF0F5', '#161C2E'
];

// ─── Authentic Color Presets (Old Style) ──────────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Classic', qr: '#000000', bg: '#FFFFFF' },
  { name: 'Orange & White', qr: '#FF7C00', bg: '#FFFFFF' },
  { name: 'Ocean', qr: '#0055FF', bg: '#EEF4FF' },
  { name: 'Forest', qr: '#008844', bg: '#F0FFF4' },
  { name: 'Sunset', qr: '#FF4400', bg: '#FFF5F0' },
  { name: 'Purple', qr: '#8800CC', bg: '#FAF0FF' },
  { name: 'Dark', qr: '#00FFFF', bg: '#111122' },
  { name: 'Monochrome', qr: '#FFFFFF', bg: '#000000' },
  { name: 'Cyberpunk', qr: '#FFFF00', bg: '#110022' }
];

export default function BarcodeColorsTab({
  barColor,
  bgColor,
  isTransparentBg,
  onChangeColors,
  onOpenAdvancedPicker
}) {
  const contrast = useMemo(() => {
    return calculateContrastRatio(barColor, isTransparentBg ? 'transparent' : bgColor);
  }, [barColor, bgColor, isTransparentBg]);

  const handleSelectPreset = (preset) => {
    onChangeColors({
      barColor: preset.qr,
      bgColor: preset.bg,
      isTransparentBg: false
    });
  };

  const handleToggleTransparent = () => {
    const next = !isTransparentBg;
    onChangeColors({
      isTransparentBg: next,
      bgColor: next ? 'transparent' : '#FFFFFF'
    });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Contrast Check Indicator Card ── */}
      <div style={{
        background: contrast.status === 'excellent' ? 'rgba(52, 199, 89, 0.08)' : contrast.status === 'warning' ? 'rgba(255, 149, 0, 0.08)' : 'rgba(255, 59, 48, 0.08)',
        border: `1px solid ${contrast.status === 'excellent' ? '#34C75940' : contrast.status === 'warning' ? '#FF950040' : '#FF3B3040'}`,
        borderRadius: 18,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {contrast.status === 'excellent' ? (
            <CheckCircle2 size={20} color="#34C759" strokeWidth={2.5} />
          ) : contrast.status === 'warning' ? (
            <AlertTriangle size={20} color="#FF9500" strokeWidth={2.5} />
          ) : (
            <XCircle size={20} color="#FF3B30" strokeWidth={2.5} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary, #1C1C1E)' }}>
                Contrast: {contrast.label}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#FFFFFF',
                background: contrast.status === 'excellent' ? '#34C759' : contrast.status === 'warning' ? '#FF9500' : '#FF3B30',
                padding: '2px 6px',
                borderRadius: 6
              }}>
                {contrast.ratio}:1
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 1, display: 'block' }}>
              {contrast.description}
            </span>
          </div>
        </div>
      </div>

      {/* ── BAR COLOR: SWIPABLE SWATCHES (OLD STYLE) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Bar Color
          </label>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
            {barColor.toUpperCase()}
          </span>
        </div>
        <div className="swatch-grid-mini" style={{ padding: '4px 0 8px 0', gap: '10px' }}>
          <ColorPicker
            isSwatch={true}
            icon={Pipette}
            value={barColor}
            onChange={(c) => onChangeColors({ barColor: c })}
            onOpenAdvanced={(c) => onOpenAdvancedPicker('bar', c)}
          />
          {BAR_SWATCHES.map(color => (
            <div
              key={color}
              className={`swatch-item${barColor.toLowerCase() === color.toLowerCase() ? ' active' : ''}`}
              style={{
                backgroundColor: color,
                border: barColor.toLowerCase() === color.toLowerCase() ? '2px solid var(--accent-primary, #FF7C00)' : '1px solid rgba(0,0,0,0.1)'
              }}
              onClick={() => onChangeColors({ barColor: color })}
            />
          ))}
        </div>
      </div>

      {/* ── BACKGROUND COLOR: SWIPABLE SWATCHES (OLD STYLE) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Background Color
          </label>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
            {isTransparentBg ? 'TRANSPARENT' : bgColor.toUpperCase()}
          </span>
        </div>
        <div className="swatch-grid-mini" style={{ padding: '4px 0 8px 0', gap: '10px' }}>
          <ColorPicker
            isSwatch={true}
            icon={Pipette}
            value={isTransparentBg ? '#FFFFFF' : bgColor}
            disabled={isTransparentBg}
            onChange={(c) => onChangeColors({ bgColor: c, isTransparentBg: false })}
            onOpenAdvanced={(c) => {
              if (!isTransparentBg) onOpenAdvancedPicker('bg', c);
            }}
          />
          {BG_SWATCHES.map(color => (
            <div
              key={color}
              className={`swatch-item${!isTransparentBg && bgColor.toLowerCase() === color.toLowerCase() ? ' active' : ''}`}
              style={{
                backgroundColor: color,
                border: !isTransparentBg && bgColor.toLowerCase() === color.toLowerCase() ? '2px solid var(--accent-primary, #FF7C00)' : '1px solid rgba(0,0,0,0.1)'
              }}
              onClick={() => onChangeColors({ bgColor: color, isTransparentBg: false })}
            />
          ))}
        </div>
      </div>

      {/* ── COLOR PRESETS (OLD HORIZONTAL SWIPABLE STYLE) ── */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 8 }}>
          Presets
        </label>
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '4px 2px 10px 2px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}>
          {COLOR_PRESETS.map(p => {
            const isSel = !isTransparentBg &&
              barColor.toUpperCase() === p.qr.toUpperCase() &&
              bgColor.toUpperCase() === p.bg.toUpperCase();

            return (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(p)}
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  width: 56
                }}
              >
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: p.bg,
                  border: isSel ? '2px solid var(--accent-primary, #FF7C00)' : '1px solid var(--border-color, rgba(0,0,0,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: isSel ? '0 8px 18px rgba(255, 124, 0, 0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: isSel ? 'scale(1.08)' : 'scale(1)'
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: p.qr }} />
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? 'var(--accent-primary, #FF7C00)' : 'var(--text-secondary, #636366)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Transparent Background Toggle ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card, #FFFFFF)',
        padding: '14px 16px',
        borderRadius: 18,
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
            Transparent Background
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
            Supported for PNG, SVG, and vector design workflows
          </span>
        </div>

        <button
          onClick={handleToggleTransparent}
          style={{
            width: 52,
            height: 30,
            borderRadius: 20,
            background: isTransparentBg ? 'var(--accent-primary, #FF7C00)' : 'var(--bg-hover, #E5E5EA)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.25s ease',
            padding: 2
          }}
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#FFFFFF',
            transform: isTransparentBg ? 'translateX(22px)' : 'translateX(0px)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>
    </div>
  );
}
