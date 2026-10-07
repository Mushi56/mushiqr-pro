// src/components/qr-templates/TemplateGallery.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Heart, Clock } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '../../data/qrTemplates';
import { TemplateCard } from './TemplateCard';
import { FeatureAccessManager } from '../../services/FeatureAccessManager';
import { usePremium } from '../../services/premiumContext';

export const TemplateGallery = React.memo(function TemplateGallery({
  templates,
  selectedTemplate,
  onSelectTemplate,
  qrMatrixInfo,
  currentQrOptions,
  headlineText,
  handleText,
  onDragStart,
  isSheetDragging
}) {
  const { showPaywall } = usePremium();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('mushiqr_fav_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentTemplates, setRecentTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('mushiqr_recent_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try {
        localStorage.setItem('mushiqr_fav_templates', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleCardClick = useCallback((tpl) => {
    if (tpl) {
      const access = FeatureAccessManager.canUseFeature(`qr_template_${tpl.id}`);
      if (!access.allowed) {
        showPaywall(`qr_template_${tpl.id}`);
        return;
      }

      if (selectedTemplate?.id === tpl.id) {
        onSelectTemplate(null);
      } else {
        onSelectTemplate(tpl);
        setTimeout(() => {
          setRecentTemplates(prev => {
            const next = [tpl.id, ...prev.filter(id => id !== tpl.id)].slice(0, 10);
            try {
              localStorage.setItem('mushiqr_recent_templates', JSON.stringify(next));
            } catch {}
            return next;
          });
        }, 50);
      }
    } else {
      onSelectTemplate(null);
    }
  }, [selectedTemplate?.id, onSelectTemplate, showPaywall]);

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (selectedCategory === 'Favorites') {
      list = list.filter(t => favorites.includes(t.id));
    } else if (selectedCategory === 'Recent') {
      list = list.filter(t => recentTemplates.includes(t.id));
    } else if (selectedCategory === 'All') {
      list = templates;
    } else {
      list = templates.filter(t => t.category === selectedCategory);
    }

    return list.filter(t => FeatureAccessManager.isFeatureEnabled(`qr_template_${t.id}`));
  }, [templates, selectedCategory, favorites, recentTemplates]);

  const { vcards, frames, standards } = useMemo(() => {
    const vcardsList = [];
    const framesList = [];
    const standardsList = [];
    for (let i = 0; i < filteredTemplates.length; i++) {
      const t = filteredTemplates[i];
      if (t.styleFamily === 'vcard') {
        vcardsList.push(t);
      } else if (t.styleFamily === 'frame' || t.category === 'Scan Me Frames') {
        framesList.push(t);
      } else {
        standardsList.push(t);
      }
    }
    return { vcards: vcardsList, frames: framesList, standards: standardsList };
  }, [filteredTemplates]);

  const categories = useMemo(() => ['All', 'Favorites', 'Recent', ...TEMPLATE_CATEGORIES.filter(c => c !== 'All')], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Sticky Categories Bar with Integrated Center Pill Handle (Zero Gap) */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg-primary, #0B0F19)',
        margin: '0 -16px',
        padding: '4px 16px 6px 16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        boxShadow: '0 1px 0 var(--border-color, rgba(255, 255, 255, 0.06))'
      }}>
        {/* Centered Scrollable/Draggable Pill Handle */}
        {onDragStart && (
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{
              width: '100%',
              padding: '2px 0 3px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSheetDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              background: 'transparent',
              flexShrink: 0
            }}
            title="Drag up or down to resize templates"
          >
            <div
              style={{
                width: '42px',
                height: '4px',
                borderRadius: '999px',
                background: 'var(--text-tertiary, rgba(255, 255, 255, 0.38))',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                transition: isSheetDragging ? 'none' : 'transform 0.2s ease, background 0.2s ease',
                transform: isSheetDragging ? 'scale(1.12)' : 'scale(1)'
              }}
            />
          </div>
        )}

        {/* Horizontal Category Chips Row */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '2px 0 2px 0',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          flex: 1
        }}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flex: '0 0 auto',
                  padding: '7px 15px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  background: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.06))',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 10px rgba(255, 42, 85, 0.35)' : 'none'
                }}
              >
                {cat === 'Favorites' && <Heart size={13} fill={isSelected ? '#fff' : 'none'} />}
                {cat === 'Recent' && <Clock size={13} />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Card Grid — 2 columns for vCard (landscape) and Scan Me Frames, 3 columns for standard square */}
      {filteredTemplates.length > 0 ? (
        selectedCategory === 'vCard' ? (
          // Dedicated 2-per-row grid for vCard section
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {filteredTemplates.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isSelected={selectedTemplate?.id === tpl.id}
                onSelect={handleCardClick}
                isFavorite={favorites.includes(tpl.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : selectedCategory === 'Scan Me Frames' ? (
          // Dedicated 3-per-row grid for Scan Me Frames section
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            {filteredTemplates.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isSelected={selectedTemplate?.id === tpl.id}
                onSelect={handleCardClick}
                isFavorite={favorites.includes(tpl.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          // For other categories (e.g. All, Favorites, Social, Business)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. Standard Square Templates */}
            {standards.length > 0 && (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {standards.map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={selectedTemplate?.id === tpl.id}
                      onSelect={handleCardClick}
                      isFavorite={favorites.includes(tpl.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Scan Me Frames Section (Separated 3-per-row) */}
            {frames.length > 0 && (
              <div>
                {selectedCategory === 'All' && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px'
                  }}>
                    Scan Me Frames
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {frames.map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={selectedTemplate?.id === tpl.id}
                      onSelect={handleCardClick}
                      isFavorite={favorites.includes(tpl.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. vCard Digital Cards Section (Separated) */}
            {vcards.length > 0 && (
              <div>
                {selectedCategory === 'All' && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px'
                  }}>
                    Digital vCards
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {vcards.map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={selectedTemplate?.id === tpl.id}
                      onSelect={handleCardClick}
                      isFavorite={favorites.includes(tpl.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '13px'
        }}>
          No templates found in {selectedCategory}.
        </div>
      )}
    </div>
  );
});
