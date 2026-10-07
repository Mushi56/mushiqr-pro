import { ALL_50_TEMPLATES, getTemplateById } from '../data/qrTemplates';
import { drawTemplateBackground, drawVCardTemplate, drawFrameTemplate, getSvgImage } from '../components/qr-templates/TemplateRenderer';
import { getTemplateStylingPreset } from '../data/qrTemplates/templateStylingConfig';

const VCARD_HEIGHT_RATIO = 600 / 1050; // ≈ 0.5714 — landscape 1050×600

// Convert the structured templates into the App engine's template format
export const QR_TEMPLATES = ALL_50_TEMPLATES.map(tpl => {
  const isVCard = tpl.styleFamily === 'vcard';

  if (tpl.styleFamily === 'image') {
    return {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      styleFamily: 'image',
      dimensions: tpl.dimensions || '1080 x 1080 px',
      heightRatio: tpl.heightRatio || 1.0,
      qrSize: tpl.qrSize || 0.4,
      qrX: tpl.qrX || 0.5,
      qrY: tpl.qrY || 0.5,
      preset: tpl.preset || {},
      bgImage: tpl.bgImage,
      thumbImage: tpl.thumbImage,
      drawBackground(ctx, w, h, options) {
        if (!tpl.bgImage) return;
        const img = getSvgImage(tpl.bgImage);
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, 0, 0, w, h);
          return;
        }
        // Full image not ready yet: draw the (already cached) thumbnail instantly
        const thumb = tpl.thumbImage ? getSvgImage(tpl.thumbImage) : null;
        if (thumb && thumb.complete && thumb.naturalWidth !== 0) {
          ctx.drawImage(thumb, 0, 0, w, h);
        }
        if (img) {
          if (options?.onAssetPending) options.onAssetPending(tpl.bgImage);
          img.addEventListener('load', () => {
            if (options?.onAssetLoaded) options.onAssetLoaded();
          }, { once: true });
        }
      },
      drawForeground: () => {}
    };
  }

  if (isVCard) {
    // ── vCard landscape template ─────────────────────────────────────────────
    const vcardTpl = {
      id:             tpl.id,
      name:           tpl.name,
      category:       tpl.category,
      dimensions:     '1050 x 600 px',
      heightRatio:    VCARD_HEIGHT_RATIO,
      styleFamily:    'vcard',
      qrSize:   0.265,
      qrX:      0.82,
      qrY:      0.50,
      defaultHeadline: tpl.headline,
      defaultHandle:   tpl.subtitle,
      headline:  tpl.headline,
      subtitle:  tpl.subtitle,
      background: tpl.background,
      accent:     tpl.accent,
      textColor:  tpl.textColor,
      subColor:   tpl.subColor,
      borderColor: tpl.borderColor,
      isDark:     tpl.isDark,
      svg:        tpl.svg,
      qrType:     tpl.qrType,
      fields:     tpl.fields,
      preset: tpl.preset || {
        qrColor:   tpl.accent || '#000000',
        bgColor:   '#FFFFFF',
        dotStyle:  'rounded',
        eyeStyle:  'rounded'
      },
      drawBackground(ctx, W, H, options) {
        const coords = drawVCardTemplate(ctx, W, H, tpl, {
          name:     options?.vcardName     || 'Your Name',
          jobTitle: options?.vcardJobTitle || 'Job Title, Company',
          phone:    options?.vcardPhone    || '',
          email:    options?.vcardEmail    || '',
          address:  options?.vcardAddress  || '',
          url:      options?.vcardUrl      || '',
        });
        if (coords) {
          this._vcardQrBoxX    = coords.qrBoxX;
          this._vcardQrBoxY    = coords.qrBoxY;
          this._vcardQrBoxSize = coords.qrBoxSize;
          this.qrSize = coords.qrBoxSize / W;
          this.qrX    = (coords.qrBoxX + coords.qrBoxSize / 2) / W;
          this.qrY    = (coords.qrBoxY + coords.qrBoxSize / 2) / H;
        }
      },
      drawForeground: () => {}
    };
    return vcardTpl;
  }

  if (tpl.styleFamily === 'frame') {
    return {
      id:          tpl.id,
      name:        tpl.name,
      category:    tpl.category,
      styleFamily: 'frame',
      dimensions:  '1080 x 1080 px',
      heightRatio: 1.0,
      qrSize: 0.45,
      qrX:    0.50,
      qrY:    0.50,
      shape:       tpl.shape,
      labelType:   tpl.labelType,
      labelText:   tpl.labelText,
      background:  tpl.background,
      border:      tpl.border,
      labelBg:     tpl.labelBg,
      labelFg:     tpl.labelFg,
      qrCard:      tpl.qrCard,
      accent:      tpl.accent,
      extra:       tpl.extra,
      defaultHeadline: tpl.labelText,
      preset: tpl.preset || {
        qrColor:   tpl.accent || '#000000',
        bgColor:   '#FFFFFF',
        dotStyle:  'rounded',
        eyeStyle:  'rounded'
      },
      drawBackground(ctx, w, h, options) {
        const coords = drawFrameTemplate(ctx, w, h, tpl, options);
        if (coords) {
          this._frameQrBoxX    = coords.qrBoxX;
          this._frameQrBoxY    = coords.qrBoxY;
          this._frameQrBoxSize = coords.qrBoxSize;
          this.qrSize = coords.qrBoxSize / w;
          this.qrX    = (coords.qrBoxX + coords.qrBoxSize / 2) / w;
          this.qrY    = (coords.qrBoxY + coords.qrBoxSize / 2) / h;
        }
      },
      drawForeground: () => {}
    };
  }

  // ── Standard square template (with tailored platform colors, diverse eyes & dots) ──
  const stylingPreset = getTemplateStylingPreset(tpl);

  return {
    id:             tpl.id,
    name:           tpl.name,
    category:       tpl.category,
    dimensions:     '1080 x 1080 px',
    heightRatio:    1.0,
    qrSize: 0.35,
    qrX:    0.50,
    qrY:    0.601, // Shifted down 50px relative to 1080px (0.555 + 50/1080)
    defaultHeadline: tpl.headline,
    defaultHandle:   tpl.subtitle,
    headline:  tpl.headline,
    subtitle:  tpl.subtitle,
    background: tpl.background,
    svg:        tpl.svg,
    isDarkHeadline: tpl.isDarkHeadline,
    isDarkQrFrame:  tpl.isDarkQrFrame,
    isDarkUser:     tpl.isDarkUser,
    styleFamily: tpl.styleFamily,
    bgShapes:    tpl.bgShapes,
    qrType:      tpl.qrType,
    fields:      tpl.fields,
    preset: stylingPreset || tpl.preset || {
      qrColor:   '#1877F2',
      bgColor:   '#FFFFFF',
      dotStyle:  'fluid',
      eyeStyle:  'rounded'
    },
    drawBackground(ctx, w, h, options = {}) {
      const coords = drawTemplateBackground(ctx, w, h, tpl, options);
      if (coords) {
        this._stdQrBoxX    = coords.qrBoxX;
        this._stdQrBoxY    = coords.qrBoxY;
        this._stdQrBoxSize = coords.qrBoxSize;
      }
    },
    drawForeground: () => {}
  };
});

// Preload every image template (thumb first, then full) during idle time so the
// editor canvas can draw them instantly when a template is selected.
if (typeof window !== 'undefined') {
  const preload = () => {
    QR_TEMPLATES.forEach(t => {
      if (t.styleFamily !== 'image') return;
      if (t.thumbImage) getSvgImage(t.thumbImage);
    });
    QR_TEMPLATES.forEach(t => {
      if (t.styleFamily === 'image' && t.bgImage) getSvgImage(t.bgImage);
    });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1500 });
  else setTimeout(preload, 300);
}


// ─── Cloud/Custom Templates Integration ─────────────────────────────────────
export function getUserTemplates() {
  try {
    const raw = localStorage.getItem('qrgen_cloud_templates');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.map(tpl => ({
      id: tpl.id,
      name: tpl.name,
      category: tpl.category || 'Custom',
      qrSize: tpl.qrSize || 0.5,
      qrX: tpl.qrX || 0.5,
      qrY: tpl.qrY || 0.5,
      isCustom: true,
      preset: {
        qrColor:       tpl.preset?.qrColor       || '#ffffff',
        bgColor:       tpl.preset?.bgColor        || '#000000',
        bgTransparent: tpl.preset?.bgTransparent  || false,
        eyeColor:      tpl.preset?.eyeColor       || tpl.preset?.qrColor || '#ffffff',
        eyeOuterColor: tpl.preset?.eyeOuterColor  || tpl.preset?.qrColor || '#ffffff',
        dotStyle:      tpl.preset?.dotStyle       || 'square',
        eyeStyle:      tpl.preset?.eyeStyle       || 'square',
      },
      drawBackground: (ctx, w, h) => {
        h = h || w;
        ctx.fillStyle = tpl.preset?.bgColor || '#1E293B';
        ctx.fillRect(0, 0, w, h);
      },
      drawForeground: () => {},
    }));
  } catch {
    return [];
  }
}

export function getAllTemplates() {
  return [...QR_TEMPLATES, ...getUserTemplates()];
}

export function getAppTemplateById(id) {
  if (!id) return null;
  const all = getAllTemplates();
  return all.find(t => t.id === id) || null;
}
