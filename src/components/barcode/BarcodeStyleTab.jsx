import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type, Square, LayoutTemplate } from 'lucide-react';
import { BARCODE_STANDARDS } from '../../utils/barcodeEngine';

export default function BarcodeStyleTab({
  bcid,
  displayValue,
  textPosition,
  textAlign,
  textFont,
  hasBorder,
  borderWidth,
  decorativeMargin,
  onChangeStyle
}) {
  const isRetail = ['ean13', 'ean8', 'upca', 'upce'].includes(bcid);
  const currentStandard = BARCODE_STANDARDS[bcid] || BARCODE_STANDARDS.ean13;
  const is2D = currentStandard.category?.startsWith('2d');

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── TEXT LABEL OPTIONS ── */}
      {!is2D && (
        <div style={{
          background: 'var(--bg-card, #FFFFFF)',
          borderRadius: 18,
          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {/* Section Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
                TEXT LABEL OPTIONS
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
                Human-readable characters formatting
              </span>
            </div>

            {/* Show Text Label Toggle */}
            <button
              onClick={() => onChangeStyle({ displayValue: !displayValue })}
              style={{
                width: 52,
                height: 30,
                borderRadius: 20,
                background: displayValue ? 'var(--accent-primary, #D6003D)' : 'var(--bg-hover, #E5E5EA)',
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
                transform: displayValue ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>

          {displayValue && (
            <>
              <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.06))' }} />

              {/* Text Position: Below / Above / Hidden */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase' }}>
                  Position
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'below', label: 'Below' },
                    { id: 'above', label: 'Above' }
                  ].map(pos => {
                    const isSelected = textPosition === pos.id;
                    return (
                      <button
                        key={pos.id}
                        onClick={() => {
                          onChangeStyle({ textPosition: pos.id, displayValue: true });
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 12,
                          border: isSelected ? '2px solid var(--accent-primary, #D6003D)' : '1px solid var(--border-color, rgba(0,0,0,0.08))',
                          background: isSelected ? 'rgba(214, 0, 61, 0.06)' : 'var(--bg-elevated, #FFFFFF)',
                          color: isSelected ? 'var(--accent-primary, #D6003D)' : 'var(--text-primary, #1C1C1E)',
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isRetail && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase' }}>
                    Alignment
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { id: 'center', label: 'Center', Icon: AlignCenter },
                      { id: 'left', label: 'Left', Icon: AlignLeft },
                      { id: 'right', label: 'Right', Icon: AlignRight }
                    ].map(align => {
                      const isSelected = textAlign === align.id;
                      return (
                        <button
                          key={align.id}
                          onClick={() => onChangeStyle({ textAlign: align.id })}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 12,
                            border: isSelected ? '2px solid var(--accent-primary, #D6003D)' : '1px solid var(--border-color, rgba(0,0,0,0.08))',
                            background: isSelected ? 'rgba(214, 0, 61, 0.06)' : 'var(--bg-elevated, #FFFFFF)',
                            color: isSelected ? 'var(--accent-primary, #D6003D)' : 'var(--text-primary, #1C1C1E)',
                            fontWeight: isSelected ? 700 : 600,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                        >
                          <align.Icon size={14} />
                          <span>{align.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BORDER & DECORATIVE MARGIN ── */}
      <div style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderRadius: 18,
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Border Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary, #1C1C1E)', display: 'block' }}>
              Add Border (Bearer Bars)
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
              Surrounding bearer frame for industrial cartons
            </span>
          </div>

          <button
            onClick={() => onChangeStyle({ hasBorder: !hasBorder, borderWidth: !hasBorder && borderWidth === 0 ? 2 : borderWidth })}
            style={{
              width: 52,
              height: 30,
              borderRadius: 20,
              background: hasBorder ? 'var(--accent-primary, #D6003D)' : 'var(--bg-hover, #E5E5EA)',
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
              transform: hasBorder ? 'translateX(22px)' : 'translateX(0px)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        {hasBorder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)' }}>
              <span>BORDER WIDTH</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{borderWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={borderWidth}
              onChange={(e) => onChangeStyle({ borderWidth: parseInt(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
