import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check, Info, Pencil, LayoutGrid, ShoppingCart, Factory, Globe, QrCode } from 'lucide-react';
import { BARCODE_STANDARDS, renderBarcode } from '../../utils/barcodeEngine';
import { BARCODE_CATEGORIES, FORMAT_CATEGORY_MAP, BARCODE_SPECS } from '../../utils/barcodeStandardsExtended';
import { FeatureAccessManager } from '../../services/FeatureAccessManager';
import PaidCrownBadge from '../PaidCrownBadge';

export default function BarcodeFormatSelector({
  selectedBcid,
  onSelectFormat,
  onOpenInfo,
  onOpenDataModal,
  showPaywall
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter formats enabled in FeatureAccessManager
  const availableFormats = useMemo(() => {
    return Object.entries(BARCODE_STANDARDS)
      .filter(([key]) => FeatureAccessManager.isFeatureEnabled(`barcode_${key}`))
      .map(([key, std]) => {
        const spec = BARCODE_SPECS[key] || {};
        const cat = FORMAT_CATEGORY_MAP[key] || 'industrial';
        return {
          id: key,
          name: std.name,
          subtitle: spec.subtitle || std.desc,
          category: cat,
          defaultValue: std.defaultValue,
          standard: std,
          spec
        };
      });
  }, []);

  // Filter based on category and search query
  const filteredFormats = useMemo(() => {
    return availableFormats.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [availableFormats, selectedCategory, searchQuery]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Search Bar ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-input, #FFFFFF)',
        borderRadius: 14,
        padding: '0 14px',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        height: 44
      }}>
        <Search size={18} color="var(--text-muted, #8E8E93)" style={{ flexShrink: 0, marginRight: 8 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search barcode format (e.g. EAN-13, Code 128)..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary, #1C1C1E)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
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

      {/* ── Category Chips ── */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        padding: '2px 0 4px 0',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        flexShrink: 0
      }}>
        {BARCODE_CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const getCategoryIcon = () => {
            switch (cat.id) {
              case 'all': return <LayoutGrid size={13} />;
              case 'retail': return <ShoppingCart size={13} />;
              case 'industrial': return <Factory size={13} />;
              case 'gs1': return <Globe size={13} />;
              case '2d': return <QrCode size={13} />;
              default: return null;
            }
          };

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                flex: '0 0 auto',
                padding: '7px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--accent-primary, #D60036)' : 'var(--bg-card, #151C2E)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isActive ? '0 4px 12px rgba(214, 0, 54, 0.35)' : 'none'
              }}
            >
              {getCategoryIcon()}
              <span>{cat.label}</span>
              {cat.id !== 'all' && (
                <span style={{
                  fontSize: 10,
                  opacity: isActive ? 0.9 : 0.7,
                  background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'var(--bg-hover, rgba(255,255,255,0.06))',
                  color: isActive ? '#FFFFFF' : 'var(--text-tertiary, #64748B)',
                  padding: '1px 6px',
                  borderRadius: 10
                }}>
                  {availableFormats.filter(f => f.category === cat.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Format Cards Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
        maxHeight: 290,
        overflowY: 'auto',
        padding: '2px 2px 8px 2px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {filteredFormats.map(item => {
          const isSelected = selectedBcid === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                const feat = `barcode_${item.id}`;
                const access = FeatureAccessManager.canUseFeature(feat);
                if (!access.allowed) {
                  showPaywall(feat);
                  return;
                }
                onSelectFormat(item.id);
              }}
              style={{
                background: isSelected ? 'var(--accent-soft, rgba(214, 0, 54, 0.18))' : 'var(--bg-card, #151C2E)',
                border: 'none',
                borderRadius: 16,
                padding: '10px 10px 8px 10px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected
                  ? '0 6px 20px rgba(214, 0, 54, 0.25)'
                  : '0 2px 6px rgba(0,0,0,0.04)',
                minHeight: 112,
                boxSizing: 'border-box'
              }}
            >
              {/* Pro Crown Badge */}
              <PaidCrownBadge featureId={`barcode_${item.id}`} position="floating" size={9} />

              {/* Selected Check Badge */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--accent-primary, #D60036)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(214,0,54,0.3)',
                  zIndex: 4
                }}>
                  <Check size={11} strokeWidth={3} />
                </div>
              )}

              {/* Mini Preview Thumbnail */}
              <div style={{
                width: '100%',
                height: 44,
                background: '#FFFFFF',
                borderRadius: 10,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                marginBottom: 8
              }}>
                <MiniThumbnail type={item.id} defaultValue={item.defaultValue} />
              </div>

              {/* Format Title and Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, width: '100%' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent-primary, #D60036)' : 'var(--text-primary, #FFFFFF)',
                  letterSpacing: '-0.2px'
                }}>
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenInfo) onOpenInfo(item.id);
                  }}
                  title="Symbology info"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: isSelected ? 'var(--accent-primary, #D60036)' : 'var(--text-muted, #8E8E93)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Info size={14} />
                </button>
              </div>
              
              {/* Edit Fields Button (Full Width) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenDataModal) onOpenDataModal(item.id);
                }}
                title="Edit fields"
                style={{
                  width: '100%',
                  background: 'var(--accent-primary, #D60036)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 0',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(214, 0, 54, 0.25)'
                }}
              >
                <Pencil size={11} strokeWidth={2.5} />
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Edit Fields</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniThumbnail({ type, defaultValue }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const std = BARCODE_STANDARDS[type] || BARCODE_STANDARDS.code128;
    const is2D = std.category === '2d-matrix';
    const isStacked = std.category === '2d-stacked';

    let thumbScale = 1;
    if (type === 'microqrcode') thumbScale = 1.6;
    else if (type === 'datamatrix') thumbScale = 1.3;
    else if (type === 'qrcode' || type === 'aztec' || type === 'hanxin') thumbScale = 1.1;
    else if (type === 'maxicode') thumbScale = 0.85;
    else if (type === 'pdf417') thumbScale = 1;
    else if (type === 'gs1128' || type === 'telepen' || type === 'planet') thumbScale = 0.75;

    renderBarcode(canvasRef.current, defaultValue || std.defaultValue, {
      bcid: type,
      barColor: '#000000',
      bgColor: '#FFFFFF',
      barWidth: thumbScale,
      height: is2D || isStacked ? null : 26,
      margin: 2,
      displayValue: false,
      isThumbnail: true
    });
  }, [type, defaultValue]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  );
}
