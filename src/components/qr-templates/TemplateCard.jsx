import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { drawTemplateBackground, drawVCardTemplate, drawFrameTemplate, getSvgImage } from './TemplateRenderer';
import { generateQRMatrix, renderQR } from '../../utils/qrEngine';
import { getTemplateStylingPreset } from '../../data/qrTemplates/templateStylingConfig';
import { LOGO_PRESETS } from '../../data/logoPresets';
import PaidCrownBadge from '../PaidCrownBadge';

const isVCard = (t) => t?.styleFamily === 'vcard';
const isFrame = (t) => t?.styleFamily === 'frame';
const isImage = (t) => t?.styleFamily === 'image';

// Reusable shared static demo matrix for ultra-fast thumbnail generation without recomputing
const DEMO_MATRIX = generateQRMatrix('https://mushiqr.pro', 'M');

// Module-level in-memory thumbnail cache (max 400 entries)
const templateThumbnailCache = new Map();

function getTemplateThumbnailKey(template, headlineText, handleText) {
  return `${template?.id || 'tpl'}__${headlineText || ''}__${handleText || ''}`;
}

// Shared single offscreen thumbnail canvas to prevent DOM garbage collection overhead
let _qrThumbCanvas = null;
function getSharedThumbCanvas() {
  if (typeof document === 'undefined') return null;
  if (!_qrThumbCanvas) {
    _qrThumbCanvas = document.createElement('canvas');
    _qrThumbCanvas.width = 160;
    _qrThumbCanvas.height = 160;
  }
  return _qrThumbCanvas;
}

export const TemplateCard = React.memo(function TemplateCard({
  template,
  isSelected,
  onSelect,
  isFavorite,
  onToggleFavorite,
  headlineText,
  handleText
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [localTick, setLocalTick] = useState(0);

  const cacheKey = getTemplateThumbnailKey(template, headlineText, handleText);
  const [cachedImgSrc, setCachedImgSrc] = useState(() => templateThumbnailCache.get(cacheKey) || null);
  const [isVisible, setIsVisible] = useState(() => Boolean(templateThumbnailCache.has(cacheKey)));

  // Viewport-aware lazy observer (250px preload buffer)
  useEffect(() => {
    if (isVisible) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '250px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  // Thumbnail generation & caching
  useEffect(() => {
    if (!isVisible) return;

    const key = getTemplateThumbnailKey(template, headlineText, handleText);
    const existing = templateThumbnailCache.get(key);
    if (existing && localTick === 0) {
      if (cachedImgSrc !== existing) setCachedImgSrc(existing);
      return;
    }

    // Debounce generation to prevent blocking the main thread during fast scrolling
    const timer = setTimeout(() => {
      const canvas = canvasRef.current || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let hasPendingAssets = false;
      const onAssetPending = () => { hasPendingAssets = true; };
      const onAssetLoaded = () => setLocalTick(t => t + 1);

      const qrTempCanvas = getSharedThumbCanvas();
      const activeMatrix = DEMO_MATRIX;

      if (isVCard(template)) {
      // ── vCard 16:9 thumbnail ─────────────────────────────────────────────
      const W = 525;
      const H = 300;
      canvas.width  = W;
      canvas.height = H;

      const coords = drawVCardTemplate(ctx, W, H, template, {
        name:     'Your Name',
        jobTitle: 'Job Title, Company',
        phone:    '+60 12-345 6789',
        email:    'you@example.com',
        address:  '123 Business Street, Your City',
        url:      'https://example.com',
        onAssetLoaded,
        onAssetPending
      });

      if (coords && activeMatrix && qrTempCanvas) {
        renderQR(qrTempCanvas, {
          ...activeMatrix,
          size: 160,
          qrColor: template.preset?.qrColor || '#000000',
          bgColor: 'transparent',
          bgTransparent: true,
          dotStyle: template.preset?.dotStyle || 'rounded',
          eyeStyle: template.preset?.eyeStyle || 'rounded',
          quietZone: 0
        });
        ctx.save();
        const margin = coords.qrBoxSize * 0.08;
        ctx.drawImage(
          qrTempCanvas,
          coords.qrBoxX + margin,
          coords.qrBoxY + margin,
          coords.qrBoxSize - margin * 2,
          coords.qrBoxSize - margin * 2
        );
        ctx.restore();
      }
    } else if (isFrame(template)) {
      // ── Scan Me Frame thumbnail ───────────────────────────────────────────
      const w = 260;
      const h = 260;
      canvas.width  = w;
      canvas.height = h;

      const coords = drawFrameTemplate(ctx, w, h, template, {
        templateHeadline: headlineText !== undefined ? headlineText : template.labelText,
        onAssetLoaded,
        onAssetPending
      });

      if (coords && activeMatrix && qrTempCanvas) {
        renderQR(qrTempCanvas, {
          ...activeMatrix,
          size: 160,
          qrColor: template.preset?.qrColor || template.accent || '#000000',
          bgColor: 'transparent',
          bgTransparent: true,
          dotStyle: template.preset?.dotStyle || 'rounded',
          eyeStyle: template.preset?.eyeStyle || 'rounded',
          quietZone: 0
        });
        ctx.save();
        const margin = coords.qrBoxSize * 0.08;
        ctx.drawImage(
          qrTempCanvas,
          coords.qrBoxX + margin,
          coords.qrBoxY + margin,
          coords.qrBoxSize - margin * 2,
          coords.qrBoxSize - margin * 2
        );
        ctx.restore();
      }
    } else if (isImage(template)) {
      const w = 260;
      const h = 260 * (template.heightRatio || 1.0);
      canvas.width = w;
      canvas.height = h;

      const thumbSrc = template.thumbImage || template.bgImage;
      if (thumbSrc) {
        const img = getSvgImage(thumbSrc);
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, 0, 0, w, h);
        } else if (img) {
          onAssetPending(thumbSrc);
          img.addEventListener('load', () => onAssetLoaded(), { once: true });
          img.addEventListener('error', () => onAssetLoaded(), { once: true });
          return; // wait for background
        }
      }

      if (activeMatrix && qrTempCanvas) {
        const qrSizeRatio = template.qrSize || 0.4;
        const qrSizePx = w * qrSizeRatio;
        const qrX = w * (template.qrX || 0.5) - qrSizePx / 2;
        const qrY = h * (template.qrY || 0.5) - qrSizePx / 2;
        
        let logoImageObj = null;
        if (template.preset?.logo?.image) {
          const lImg = getSvgImage(template.preset.logo.image);
          if (lImg && lImg.complete && lImg.naturalWidth !== 0) {
            logoImageObj = lImg;
          } else if (lImg) {
            onAssetPending(template.preset.logo.image);
            lImg.addEventListener('load', () => onAssetLoaded(), { once: true });
            return; // wait for logo
          }
        }

        renderQR(qrTempCanvas, {
          ...activeMatrix,
          size: 160,
          qrColor: template.preset?.qrColor || '#000000',
          bgColor: 'transparent',
          bgTransparent: true,
          dotStyle: template.preset?.dotStyle || 'fluid',
          eyeStyle: template.preset?.eyeStyle || 'rounded',
          eyeColor: template.preset?.eyeColor || template.preset?.qrColor || '#000000',
          eyeOuterColor: template.preset?.eyeOuterColor || template.preset?.qrColor || '#000000',
          syncEyes: true,
          quietZone: 2,
          logo: logoImageObj,
          logoWidth: template.preset?.logo?.width || 0.20,
          logoHeight: template.preset?.logo?.height || 0.20,
          logoBackground: template.preset?.logo?.background || false,
          logoBgColor: template.preset?.logo?.bgColor || '#FFFFFF',
          logoShadowEnabled: template.preset?.logoShadowEnabled,
          logoShadowColor: template.preset?.logoShadowColor,
          logoShadowBlur: template.preset?.logoShadowBlur,
          logoShadowOffsetX: template.preset?.logoShadowOffsetX,
          logoShadowOffsetY: template.preset?.logoShadowOffsetY,
        });
        
        ctx.save();
        ctx.drawImage(qrTempCanvas, qrX, qrY, qrSizePx, qrSizePx);
        ctx.restore();
      }
    } else {
      // ── Standard square thumbnail ────────────────────────────────────────
      const w = 260;
      const h = 260;
      canvas.width  = w;
      canvas.height = h;

      const coords = drawTemplateBackground(ctx, w, h, template, {
        templateHeadline:   headlineText !== undefined ? headlineText : template.headline,
        templateHandleText: handleText !== undefined ? handleText : template.subtitle,
        onAssetLoaded,
        onAssetPending
      });

      const stylePreset = getTemplateStylingPreset(template) || template.preset;

      if (coords && activeMatrix && qrTempCanvas) {
        let logoImageObj = null;
        if (stylePreset?.logo) {
          const foundLogo = LOGO_PRESETS.find(p => p.slug === stylePreset.logo);
          if (foundLogo) {
            const lImg = new Image();
            lImg.src = foundLogo.url;
            if (lImg.complete && lImg.naturalWidth !== 0) {
              logoImageObj = lImg;
            }
          }
        }

        renderQR(qrTempCanvas, {
          ...activeMatrix,
          size: 160,
          qrColor: stylePreset?.qrColor || '#1877F2',
          bgColor: 'transparent',
          bgTransparent: true,
          dotStyle: stylePreset?.dotStyle || 'fluid',
          eyeStyle: stylePreset?.eyeStyle || 'rounded',
          eyeColor: stylePreset?.eyeColor || stylePreset?.qrColor || '#1877F2',
          eyeOuterColor: stylePreset?.eyeOuterColor || stylePreset?.qrColor || '#1877F2',
          syncEyes: true,
          logo: logoImageObj,
          logoWidth: 0.20,
          logoHeight: 0.20,
          logoBackground: Boolean(stylePreset?.logoBgColor),
          logoBgColor: stylePreset?.logoBgColor || '#FFFFFF',
          logoBgShape: stylePreset?.logoBgShape || 'rounded',
          logoPadding: 6,
          quietZone: 0
        });
        ctx.save();
        const margin = coords.qrBoxSize * 0.08;
        ctx.drawImage(
          qrTempCanvas,
          coords.qrBoxX + margin,
          coords.qrBoxY + margin,
          coords.qrBoxSize - margin * 2,
          coords.qrBoxSize - margin * 2
        );
        ctx.restore();
      }
    }

    if (!hasPendingAssets) {
      try {
        const dataUrl = canvas.toDataURL('image/webp', 0.90) || canvas.toDataURL('image/png');
        if (dataUrl && dataUrl.length > 50) {
          if (templateThumbnailCache.size > 400) {
            const firstKey = templateThumbnailCache.keys().next().value;
            templateThumbnailCache.delete(firstKey);
          }
          templateThumbnailCache.set(key, dataUrl);
          setCachedImgSrc(dataUrl);
        }
      } catch {
        // Fallback to active canvas
      }
    }
    }, 120); // 120ms debounce prevents rendering if user scrolls past quickly

    return () => clearTimeout(timer);
  }, [template, headlineText, handleText, isVisible, localTick]);

  const vcardCard = isVCard(template);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    if (onSelect) onSelect(template);
  }, [onSelect, template]);

  const handleFavClick = useCallback((e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(template.id);
  }, [onToggleFavorite, template.id]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      style={{
        position:        'relative',
        borderRadius:    '4px',
        overflow:        'hidden',
        cursor:          'pointer',
        border:          isSelected ? '2.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
        boxShadow:       isSelected ? '0 6px 20px rgba(255, 42, 85, 0.35)' : '0 2px 10px rgba(0,0,0,0.1)',
        transform:       isHovered ? 'translateY(-2px)' : (isSelected ? 'scale(1.02)' : 'scale(1)'),
        transition:      'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'var(--bg-elevated)',
        aspectRatio:     vcardCard ? '7 / 4' : '1 / 1',
        display:         'flex',
        flexDirection:   'column'
      }}
    >
      {cachedImgSrc ? (
        <img
          src={cachedImgSrc}
          alt={template.name}
          loading="lazy"
          style={{
            width:         '100%',
            height:        '100%',
            display:       'block',
            objectFit:     'contain',
            pointerEvents: 'none'
          }}
        />
      ) : isVisible ? (
        <canvas
          ref={canvasRef}
          style={{
            width:      '100%',
            height:     '100%',
            display:    'block',
            objectFit:  'contain'
          }}
        />
      ) : (
        <div
          style={{
            width:      '100%',
            height:     '100%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.07) 100%)'
          }}
        />
      )}

      {/* Template Name Overlay — Appears on Hover */}
      <div style={{
        position:       'absolute',
        bottom:         '6px',
        left:           '6px',
        right:          '6px',
        padding:        '5px 8px',
        background:     'var(--bg-elevated, rgba(255, 255, 255, 0.92))',
        border:         '1px solid var(--border-color, rgba(0, 0, 0, 0.12))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius:   '4px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          'var(--text-primary, #1e293b)',
        fontSize:       '10px',
        fontWeight:     700,
        letterSpacing:  '0.3px',
        boxShadow:      '0 2px 8px rgba(0, 0, 0, 0.12)',
        pointerEvents:  'none',
        opacity:        isHovered || isSelected ? 1 : 0,
        transform:      isHovered || isSelected ? 'translateY(0)' : 'translateY(6px)',
        transition:     'opacity 0.2s ease, transform 0.2s ease'
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {template.name}
        </span>
      </div>

      {/* Favorite Heart Button (Top-Left Position) */}
      {onToggleFavorite && (
        <button
          onClick={handleFavClick}
          style={{
            position:       'absolute',
            top:            '8px',
            left:           '8px',
            zIndex:         25,
            width:          '28px',
            height:         '28px',
            borderRadius:   '50%',
            background:     isFavorite ? 'rgba(255, 42, 85, 0.95)' : 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border:         isFavorite ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.18)',
            color:          '#FFFFFF',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         'pointer',
            boxShadow:      isFavorite ? '0 2px 12px rgba(255, 42, 85, 0.55)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition:     'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart 
            size={13} 
            color="#FFFFFF" 
            fill={isFavorite ? '#FFFFFF' : 'none'} 
            strokeWidth={2.2} 
          />
        </button>
      )}

      {/* Dynamic Pro/Paid Crown Badge controlled by Super Admin Panel */}
      <PaidCrownBadge 
        featureId={`qr_template_${template.id}`} 
        position="corner" 
        size={11}
      />
    </div>
  );
});
