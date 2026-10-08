import qrcode from 'qrcode-generator';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import { drawTemplateBackground } from '../components/qr-templates/TemplateRenderer';
import { synthesizeAiArtQR } from './aiArtQrEngine';

/**
 * QR Code Generation Engine
 * Supports: URL, Text, WiFi, Email, Phone, vCard, SMS
 */

export const QR_TYPES = {
  URL: 'url',
  TEXT: 'text',
  WIFI: 'wifi',
  EMAIL: 'email',
  PHONE: 'phone',
  SMS: 'sms',
  VCARD: 'vcard',
  LOCATION: 'location',
  PDF: 'pdf',
  IMAGE: 'image',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  EVENT: 'event',
  CRYPTO: 'crypto',
  WHATSAPP: 'whatsapp',
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  X: 'x',
  LINKEDIN: 'linkedin',
};

export function formatQRData(type, data) {
  const featId = `qr_${type}`;
  const access = FeatureAccessManager.canUseFeature(featId);
  if (!access.allowed) {
    console.warn(`[qrEngine] formatQRData blocked: ${featId} feature is disabled or restricted for current plan.`);
    return '';
  }
  switch (type) {
    case QR_TYPES.URL: {
      const rawUrl = (data.url || '').trim();
      if (/^(javascript|data|vbscript):/i.test(rawUrl)) {
        return 'https://about:blank';
      }
      return rawUrl;
    }
    case QR_TYPES.TEXT:
      return data.text || '';
    case QR_TYPES.WIFI:
      return `WIFI:T:${data.encryption || 'WPA'};S:${data.ssid || ''};P:${data.password || ''};H:${data.hidden ? 'true' : 'false'};;`;
    case QR_TYPES.EMAIL:
      return `mailto:${data.email || ''}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
    case QR_TYPES.PHONE:
      return `tel:${data.phone || ''}`;
    case QR_TYPES.SMS:
      return `smsto:${data.phone || ''}:${data.message || ''}`;
    case QR_TYPES.VCARD:
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${data.lastName || ''};${data.firstName || ''}`,
        `FN:${data.firstName || ''} ${data.lastName || ''}`,
        data.org ? `ORG:${data.org}` : '',
        data.title ? `TITLE:${data.title}` : '',
        data.phone ? `TEL:${data.phone}` : '',
        data.email ? `EMAIL:${data.email}` : '',
        data.url ? `URL:${data.url}` : '',
        data.address ? `ADR:;;${data.address}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    case QR_TYPES.LOCATION:
      return `geo:${data.latitude || '0'},${data.longitude || '0'}`;
    case QR_TYPES.EVENT:
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${data.title || ''}`,
        `LOCATION:${data.location || ''}`,
        `DTSTART:${data.startDate ? data.startDate.replace(/[-:]/g, '') + 'T000000Z' : ''}`,
        `DTEND:${data.endDate ? data.endDate.replace(/[-:]/g, '') + 'T000000Z' : ''}`,
        'END:VEVENT'
      ].filter(Boolean).join('\n');
    case QR_TYPES.CRYPTO:
      return `${data.cryptoType || 'bitcoin'}:${data.address || ''}${data.amount ? '?amount=' + data.amount : ''}`;
    case QR_TYPES.WHATSAPP:
      return `https://wa.me/${(data.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(data.message || '')}`;
    case QR_TYPES.INSTAGRAM:
      return `https://instagram.com/${(data.username || '').replace('@', '')}`;
    case QR_TYPES.FACEBOOK:
      return `https://facebook.com/${data.username || ''}`;
    case QR_TYPES.X:
      return `https://x.com/${(data.username || '').replace('@', '')}`;
    case QR_TYPES.LINKEDIN:
      return `https://linkedin.com/in/${data.username || ''}`;
    case QR_TYPES.YOUTUBE:
    case QR_TYPES.PDF:
    case QR_TYPES.IMAGE:
    case QR_TYPES.AUDIO:
    case QR_TYPES.DOCUMENT:
      return data.url || '';
    default:
      return data.text || data.url || '';
  }
}

export function getQRItemTitle(item) {
  if (!item) return 'QR Code';
  const type = (item.qrType || item.type || '').toLowerCase();
  
  if (type === 'url' || type === 'qr_url') return 'URL';
  if (type === 'text' || type === 'qr_text') return 'Text';
  if (type === 'wifi' || type === 'qr_wifi') return 'WiFi';
  if (type === 'vcard' || type === 'qr_vcard') return 'Contact';
  if (type === 'email' || type === 'qr_email') return 'Email';
  if (type === 'phone' || type === 'qr_phone') return 'Phone';
  if (type === 'sms' || type === 'qr_sms') return 'SMS';
  if (type === 'location' || type === 'geo' || type === 'qr_location') return 'Location';
  if (type === 'facebook' || type === 'qr_facebook') return 'Facebook';
  if (type === 'instagram' || type === 'qr_instagram') return 'Instagram';
  if (type === 'x' || type === 'twitter' || type === 'qr_x') return 'X';
  if (type === 'whatsapp' || type === 'qr_whatsapp') return 'WhatsApp';
  if (type === 'linkedin' || type === 'qr_linkedin') return 'LinkedIn';
  if (type === 'youtube' || type === 'qr_youtube') return 'YouTube';
  if (type === 'event' || type === 'qr_event') return 'Event';
  if (type === 'crypto' || type === 'qr_crypto') return 'Crypto';
  if (type === 'pdf' || type === 'qr_pdf') return 'PDF';
  if (type === 'image' || type === 'qr_image') return 'Image';
  if (type === 'audio' || type === 'qr_audio') return 'Audio';
  if (type === 'document' || type === 'qr_document') return 'Document';
  if (type === 'barcode') return 'Barcode';

  if (item.qrType || item.type) {
    const raw = (item.qrType || item.type).replace(/^(qr_)/i, '').replace(/_/g, ' ');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return 'QR Code';
}

export function getQRItemSubtitle(item) {
  if (!item) return '';
  const type = (item.qrType || item.type || '').toLowerCase();
  const data = item.qrData || (typeof item.data === 'object' ? item.data : {}) || {};
  const rawString = typeof item.data === 'string' ? item.data : (item.displayText || '');

  switch (type) {
    case 'url':
    case 'qr_url':
    case 'website':
      return data.url || (rawString && rawString !== 'Website Link' ? rawString : '');

    case 'text':
    case 'qr_text':
    case 'plain text':
      return data.text || (rawString && rawString !== 'Plain Text' ? rawString : '');

    case 'wifi':
    case 'qr_wifi':
      if (data.ssid) return `SSID: ${data.ssid}${data.encryption ? ` (${data.encryption})` : ''}`;
      return (rawString && !rawString.startsWith('WIFI:') ? rawString : (rawString ? rawString.replace(/^WIFI:.*S:([^;]+).*/i, 'SSID: $1') : ''));

    case 'vcard':
    case 'qr_vcard':
    case 'contact': {
      const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
      return name || data.organization || data.phone || data.email || (rawString && !rawString.startsWith('BEGIN:VCARD') ? rawString : 'Contact Card');
    }

    case 'email':
    case 'qr_email':
      return data.email ? `${data.email}${data.subject ? ` (${data.subject})` : ''}` : (data.subject || rawString || '');

    case 'phone':
    case 'qr_phone':
      return data.phone || rawString || '';

    case 'sms':
    case 'qr_sms':
      return data.phone ? `${data.phone}${data.message ? `: ${data.message}` : ''}` : (data.message || rawString || '');

    case 'location':
    case 'geo':
    case 'qr_location':
      return (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : (rawString || '');

    case 'facebook':
    case 'qr_facebook':
      return data.username ? `facebook.com/${data.username}` : (data.url || (rawString && rawString !== 'Facebook' ? rawString : ''));

    case 'instagram':
    case 'qr_instagram':
      return data.username ? `@${data.username.replace(/^@/, '')}` : (data.url || (rawString && rawString !== 'Instagram' ? rawString : ''));

    case 'x':
    case 'twitter':
    case 'qr_x':
      return data.username ? `@${data.username.replace(/^@/, '')}` : (data.url || (rawString && rawString !== 'X (Twitter)' ? rawString : ''));

    case 'whatsapp':
    case 'qr_whatsapp':
      return data.phone ? `wa.me/${data.phone}` : (data.message || rawString || '');

    case 'linkedin':
    case 'qr_linkedin':
      return data.username ? `linkedin.com/in/${data.username}` : (data.url || rawString || '');

    case 'youtube':
    case 'qr_youtube':
    case 'pdf':
    case 'qr_pdf':
    case 'image':
    case 'qr_image':
    case 'audio':
    case 'qr_audio':
    case 'document':
    case 'qr_document':
      return data.url || (rawString && rawString !== 'Document' ? rawString : '');

    case 'event':
    case 'qr_event':
      return data.title || data.summary || data.location || (rawString && !rawString.startsWith('BEGIN:VEVENT') ? rawString : 'Event');

    case 'crypto':
    case 'qr_crypto':
      return data.address ? `${data.cryptoType || 'Crypto'}: ${data.address}` : rawString || '';

    case 'barcode':
      return rawString || data.text || data.code || 'Barcode';

    default:
      if (item.displayText && item.displayText !== 'https://example.com' && item.displayText !== 'http://example.com') {
        return item.displayText;
      }
      if (data.text) return data.text;
      if (data.url && data.url !== 'https://example.com' && data.url !== 'http://example.com') return data.url;
      if (data.ssid) return `SSID: ${data.ssid}`;
      if (data.email) return data.email;
      if (data.phone) return data.phone;
      if (data.username) return data.username;
      if (rawString && rawString !== 'https://example.com' && rawString !== 'http://example.com') return rawString;
      return '';
  }
}

// Error correction levels
export const EC_LEVELS = {
  L: 'L', // 7%
  M: 'M', // 15%
  Q: 'Q', // 25%
  H: 'H', // 30%
};

// Dot styles (Ordered by popularity)
export const DOT_STYLES = {
  DENSO: 'denso',
  DOTS: 'dots',
  SPARKLE: 'sparkle',
  FLUID: 'fluid',
  CAPSULE: 'capsule',
  HEXAGON: 'hexagon',
  SQUARE: 'square',
  ROUNDED: 'rounded',
  LEAF: 'leaf',
  DIAMOND: 'diamond',
  PIXEL: 'pixel',
  SHIELD: 'shield',
  STAR: 'star',
  HEART: 'heart',
  TRIANGLE: 'triangle',
  OCTAGON: 'octagon',
  PLUS: 'plus',
  CROSS: 'cross',
  CHERRY_BLOSSOM: 'cherry-blossom',
  VIOLET_FLOWER: 'violet-flower',
  SUNFLOWER: 'sunflower',
  ROSE: 'rose',
  DAISY: 'daisy',
  TULIP: 'tulip',
  LOTUS: 'lotus',
  FORGET_ME_NOT: 'forget-me-not',
  PANSY: 'pansy',
  DOLLAR_COIN: 'dollar-coin',
  CUTE_EMOTICON: 'cute-emoticon',
  LAVENDER: 'lavender',
  MONSTERA: 'monstera',
  COFFEE_BEAN: 'coffee-bean',
  RAINDROP: 'raindrop',
  CACTUS_PLANT: 'cactus-plant',
  BASKETBALL_DOT: 'basketball-dot',
  CHESS_PAWN: 'chess-pawn',
  BOW_RIBBON: 'bow-ribbon',
};

// Eye styles (Ordered by popularity)
export const EYE_STYLES = {
  SQUARE: 'square',
  ROUNDED: 'rounded',
  CIRCLE: 'circle',
  LEAF: 'leaf',
  TEARDROP: 'teardrop',
  MODERN: 'modern',
  FLOWER: 'flower',
  SHIELD: 'shield',
  DIAMOND: 'diamond',
  GEOMETRIC: 'geometric',
  OCTAGON: 'octagon',
  HEXAGON: 'hexagon',
  LCD: 'notch',
  STAR: 'star',
  HEART: 'spotlight',
  TRIANGLE: 'pillow',
  DOLLAR_COIN: 'dollar-coin',
  CUTE_EMOTICON: 'cute-emoticon',
  CHERRY_BLOSSOM: 'cherry-blossom',
  LOTUS: 'lotus',
  SUNFLOWER: 'sunflower',
  LAVENDER: 'lavender',
  ROSE: 'rose',
  MONSTERA: 'monstera',
  DAISY: 'daisy',
  COFFEE_BEAN: 'coffee-bean-eye',
  RAINDROP: 'raindrop-eye',
  CACTUS: 'cactus-eye',
  BASKETBALL: 'basketball-eye',
  CHESS: 'chess-eye',
  BOW: 'bow-eye',
  VIOLET_FLOWER: 'violet-flower-eye',
  TULIP: 'tulip-eye',
  FORGET_ME_NOT: 'forget-me-not-eye',
  PANSY: 'pansy-eye',
};

// Frame styles
export const FRAME_STYLES = {
  NONE: 'none',
  SOLID: 'solid',
  ROUNDED: 'rounded',
  PILL: 'pill',
  OUTLINE: 'outline',
  UNDERLINE: 'underline',
  RIBBON: 'ribbon',
  GLOW: 'glow',
  BRACKETS: 'brackets',
  HEXAGON: 'hexagon',
  DOTS: 'dots',
};

/**
 * Generate QR matrix from data
 */
export function generateQRMatrix(text, ecLevel = 'H') {
  if (!text) return null;

  const access = FeatureAccessManager.canUseFeature('qr_matrix_engine');
  if (access && access.allowed === false) {
    console.warn('[qrEngine] generateQRMatrix blocked: qr_matrix_engine feature is disabled.');
    return null;
  }
  const typeNumber = 0; // auto-detect
  const errorCorrectionLevel = ecLevel;
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(text);
  qr.make();
  const moduleCount = qr.getModuleCount();
  const matrix = [];
  for (let row = 0; row < moduleCount; row++) {
    matrix[row] = [];
    for (let col = 0; col < moduleCount; col++) {
      matrix[row][col] = qr.isDark(row, col);
    }
  }
  return { matrix, moduleCount };
}

/**
 * Check if a cell is part of a finder pattern (eye)
 */
function isFinderPattern(row, col, moduleCount) {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

/**
 * Get finder pattern info
 */
function getFinderPatternInfo(row, col, moduleCount) {
  if (row < 7 && col < 7) return { position: 'top-left', centerRow: 3, centerCol: 3 };
  if (row < 7 && col >= moduleCount - 7) return { position: 'top-right', centerRow: 3, centerCol: moduleCount - 4 };
  if (row >= moduleCount - 7 && col < 7) return { position: 'bottom-left', centerRow: moduleCount - 4, centerCol: 3 };
  return null;
}

/**
 * Render QR code onto a canvas
 */
export function renderQR(canvas, options) {
  const {
    matrix,
    moduleCount,
    size = 1024,
    qrColor = '#000000',
    bgColor = '#ffffff',
    bgTransparent = false,
    qrBgShape = 'full',
    dotStyle = DOT_STYLES.DENSO,
    eyeStyle = EYE_STYLES.SQUARE,
    eyeColor = '',
    eyeOuterColor = '',
    syncEyes = true,
    gradientEnabled = false,
    gradientColor1 = '#000000',
    gradientColor2 = '#0066ff',
    gradientType = 'linear',
    logo = null,
    logoWidth = 0.18,
    logoHeight = 0.18,
    logoPadding = 10,
    logoBackground = false,
    logoBgColor = '#ffffff',
    logoBgShape = 'circle',
    logoOutline = false,
    logoOutlineColor = '#000000',
    logoOutlineWidth = 3,
    logoOutlineOpacity = 1,
    logoPosX = 0.5,
    logoPosY = 0.5,
    quietZone = 2,
    frameStyle = FRAME_STYLES.NONE,
    frameText = 'SCAN ME',
    frameColor = '',
    textCenter = null,
    textCenterSize = 0.1,
    textCenterFont = 'Inter',
    textCenterColor = '#000000',
    textCenterStrokeEnabled = false,
    textCenterStrokeWidth = 2,
    textCenterStrokeColor = '#ffffff',
    textCenterShadowEnabled = false,
    textCenterShadowBlur = 5,
    textCenterShadowColor = 'rgba(0,0,0,0.5)',
    textCenterPosX = 0.5,
    textCenterPosY = 0.5,
    frameFont = 'Inter',
    frameSize = 0.12,
    frameStrokeEnabled = false,
    frameStrokeWidth = 2,
    frameStrokeColor = '#ffffff',
    frameShadowEnabled = false,
    frameShadowBlur = 5,
    frameShadowColor = 'rgba(0,0,0,0.5)',
    logoOpacity = 1,
    logoRotation = 0,
    logoShadowEnabled = false,
    logoShadowColor = 'rgba(0,0,0,0.5)',
    logoShadowBlur = 10,
    logoShadowOffsetX = 0,
    logoShadowOffsetY = 4,
    logoInnerShadowEnabled = false,
    logoEraseColorEnabled = false,
    logoEraseColor = '#ffffff',
    logoEraseTolerance = 50,
    logoEraseSmoothing = 10,
    logoTexture = 'none',
    logoCrop = 'none',
    frameRotation = 0,
    framePosition = 'bottom',
    textCenterRotation = 0,
    textCenterWidth = null,
    textCenterHeight = null,
    qrTextureEnabled = false,
    qrTexture = null,
    qrTextureSyncEyes = true,
    backgroundImageEnabled = false,
    backgroundImage = null,
    backgroundImageOpacity = 0.7,
    backgroundImageBlur = 0,
    backgroundImageOverlayOpacity = 0.3,
    qrBackgroundCardEnabled = true,
    qrBackgroundCardOpacity = 0.9,
    qrBackgroundCardShape = 'rounded',
    qrSizeScale = 1.0,
    qrPosX = 0.5,
    qrPosY = 0.5
  } = options;

  if (!matrix || !canvas) return;

  const ctx = canvas.getContext('2d');
  const w = size;
  const h = options.template?.heightRatio ? Math.round(size * options.template.heightRatio) : size;
  canvas.width = w;
  canvas.height = h;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // ── AI ILLUSTRATION ART QR SYNTHESIS MODE ──
  const effectiveBgImg = backgroundImage?.image || backgroundImage || options.qrBgImage?.image || options.qrBgImage;
  if (options.aiArtQrEnabled && effectiveBgImg && !options.template) {
    const synthesized = synthesizeAiArtQR(ctx, effectiveBgImg, matrix, moduleCount, {
      size,
      quietZone,
      blendStrength: options.aiArtBlend !== undefined ? options.aiArtBlend : 0.85,
      artStyle: options.aiArtStyle || 'illustration',
      edgePreservation: options.aiArtEdgePreservation !== undefined ? options.aiArtEdgePreservation : 0.65
    });

    if (synthesized) {
      // Overlay optional Logo or Center Text if present
      if (logo) {
        drawLogo(ctx, logo, size, {
          ...options,
          contentX: quietZone * (size / (moduleCount + quietZone * 2)),
          contentY: quietZone * (size / (moduleCount + quietZone * 2)),
          contentSize: size - (quietZone * 2) * (size / (moduleCount + quietZone * 2)),
          moduleCount,
          quietZone
        });
      } else if (textCenter) {
        drawCenterText(ctx, textCenter, size, {
          textCenterSize,
          textCenterFont,
          textCenterColor,
          textCenterStrokeEnabled,
          textCenterStrokeWidth,
          textCenterStrokeColor,
          textCenterShadowEnabled,
          textCenterShadowBlur,
          textCenterShadowColor,
          textCenterPosX,
          textCenterPosY,
          textCenterRotation,
          textCenterWidth,
          textCenterHeight,
          logoPadding,
          logoBackground,
          logoBgColor,
          logoBgShape,
          contentX: quietZone * (size / (moduleCount + quietZone * 2)),
          contentY: quietZone * (size / (moduleCount + quietZone * 2)),
          contentSize: size - (quietZone * 2) * (size / (moduleCount + quietZone * 2)),
          moduleCount,
          quietZone
        });
      }

      return canvas;
    }
  }

  const effectiveBgTransparent = bgTransparent;

  // Background & Clipping
  const hasBgShape = !effectiveBgTransparent && qrBgShape && qrBgShape !== 'full' && qrBgShape !== 'none' && !options.template;
  
  if (hasBgShape || (backgroundImageEnabled && backgroundImage && !options.template)) {
    ctx.save();
    if (qrBgShape && qrBgShape !== 'full' && qrBgShape !== 'none') {
      ctx.beginPath();
      const r = size * 0.12; // corner radius
      if (qrBgShape === 'circle') {
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      } else if (qrBgShape === 'rounded') {
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(0, 0, size, size, r);
        } else {
          ctx.rect(0, 0, size, size);
        }
      } else if (qrBgShape === 'squircle') {
        const sr = size * 0.22;
        ctx.moveTo(sr, 0);
        ctx.lineTo(size - sr, 0);
        ctx.bezierCurveTo(size - sr/2, 0, size, sr/2, size, sr);
        ctx.lineTo(size, size - sr);
        ctx.bezierCurveTo(size, size - sr/2, size - sr/2, size, size - sr, size);
        ctx.lineTo(sr, size);
        ctx.bezierCurveTo(sr/2, size, 0, size - sr/2, 0, size - sr);
        ctx.lineTo(0, sr);
        ctx.bezierCurveTo(0, sr/2, sr/2, 0, sr, 0);
      } else if (qrBgShape === 'cut') {
        const cut = size * 0.12;
        ctx.moveTo(cut, 0);
        ctx.lineTo(size - cut, 0);
        ctx.lineTo(size, cut);
        ctx.lineTo(size, size - cut);
        ctx.lineTo(size - cut, size);
        ctx.lineTo(cut, size);
        ctx.lineTo(0, size - cut);
        ctx.lineTo(0, cut);
      } else if (qrBgShape === 'leaf') {
        const rLarge = size * 0.35;
        const rSmall = size * 0.05;
        ctx.moveTo(rLarge, 0);
        ctx.arcTo(size, 0, size, size, rSmall);
        ctx.arcTo(size, size, 0, size, rLarge);
        ctx.arcTo(0, size, 0, 0, rSmall);
        ctx.arcTo(0, 0, size, 0, rLarge);
      } else if (qrBgShape === 'shield') {
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.lineTo(size, size * 0.5);
        ctx.quadraticCurveTo(size, size * 0.85, size * 0.5, size);
        ctx.quadraticCurveTo(0, size * 0.85, 0, size * 0.5);
      } else if (qrBgShape === 'hexagon') {
        ctx.moveTo(size * 0.5, 0);
        ctx.lineTo(size, size * 0.25);
        ctx.lineTo(size, size * 0.75);
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(0, size * 0.75);
        ctx.lineTo(0, size * 0.25);
      } else if (qrBgShape === 'octagon') {
        const diff = size * 0.29;
        ctx.moveTo(diff, 0);
        ctx.lineTo(size - diff, 0);
        ctx.lineTo(size, diff);
        ctx.lineTo(size, size - diff);
        ctx.lineTo(size - diff, size);
        ctx.lineTo(diff, size);
        ctx.lineTo(0, size - diff);
        ctx.lineTo(0, diff);
      } else if (qrBgShape === 'diamond') {
        ctx.moveTo(size * 0.5, 0);
        ctx.lineTo(size, size * 0.5);
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(0, size * 0.5);
      }
      ctx.closePath();
      ctx.clip();
    }

    if (!effectiveBgTransparent && !options.template) {
      ctx.fillStyle = parseColorOrGradient(ctx, 0, 0, size, size, bgColor);
      ctx.fillRect(0, 0, size, size);
    }

    if (backgroundImageEnabled && backgroundImage && !options.template) {
      ctx.save();
      if (backgroundImageBlur > 0) {
        ctx.filter = `blur(${backgroundImageBlur}px)`;
      }
      const imgRatio = backgroundImage.width / backgroundImage.height;
      const canvasRatio = 1;
      let drawWidth, drawHeight, sx, sy;
      if (imgRatio > canvasRatio) {
        drawHeight = backgroundImage.height;
        drawWidth = backgroundImage.height * canvasRatio;
        sx = (backgroundImage.width - drawWidth) / 2;
        sy = 0;
      } else {
        drawWidth = backgroundImage.width;
        drawHeight = backgroundImage.width / canvasRatio;
        sx = 0;
        sy = (backgroundImage.height - drawHeight) / 2;
      }
      ctx.globalAlpha = backgroundImageOpacity;
      ctx.drawImage(backgroundImage, sx, sy, drawWidth, drawHeight, 0, 0, size, size);
      ctx.restore();

      if (backgroundImageOverlayOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${backgroundImageOverlayOpacity})`;
        ctx.fillRect(0, 0, size, size);
      }
    }
    
    ctx.restore();
  } else {
    if (!effectiveBgTransparent && !options.template) {
      ctx.fillStyle = parseColorOrGradient(ctx, 0, 0, size, size, bgColor);
      ctx.fillRect(0, 0, size, size);
    }
  }

  // Draw template background if template is active
  if (options.template) {
    if (typeof options.template.drawBackground === 'function') {
      options.template.drawBackground(ctx, w, h, options);
    } else {
      drawTemplateBackground(ctx, w, h, options.template, options);
    }
    ctx.save();

    if (options.template.styleFamily === 'vcard' && options.template._vcardQrBoxSize) {
      // ── vCard: use exact pixel coords stored by drawVCardTemplate ──────────
      const boxX    = options.template._vcardQrBoxX;
      const boxY    = options.template._vcardQrBoxY;
      const boxSize = options.template._vcardQrBoxSize;
      const margin  = boxSize * 0.05; // 5% inner padding
      const inner   = boxSize - margin * 2;
      ctx.translate(boxX + margin, boxY + margin);
      ctx.scale(inner / w, inner / w);
    } else if (options.template.styleFamily === 'frame' && options.template._frameQrBoxSize) {
      // ── Scan Me Frame: use exact pixel coords stored by drawFrameTemplate ──
      const boxX    = options.template._frameQrBoxX;
      const boxY    = options.template._frameQrBoxY;
      const boxSize = options.template._frameQrBoxSize;
      const margin  = boxSize * 0.06; // 6% inner padding
      const inner   = boxSize - margin * 2;
      ctx.translate(boxX + margin, boxY + margin);
      ctx.scale(inner / w, inner / w);
    } else if (options.template._stdQrBoxSize) {
      // ── Standard: use exact pixel coords from drawTemplateBackground ────────
      const boxX    = options.template._stdQrBoxX;
      const boxY    = options.template._stdQrBoxY;
      const boxSize = options.template._stdQrBoxSize;
      const margin  = boxSize * 0.07; // 7% inner padding for perfect margin
      const inner   = boxSize - margin * 2;
      ctx.translate(boxX + margin, boxY + margin);
      ctx.scale(inner / w, inner / w);
    } else {
      // ── Standard fallback: ratio-based QR positioning ───────────────────────
      const qrSize = w * (options.template.qrSize || 0.35);
      const qrX = w * (options.template.qrX || 0.5) - qrSize / 2;
      const qrY = h * (options.template.qrY || 0.555) - qrSize / 2;
      const margin = qrSize * 0.06;
      const inner = qrSize - margin * 2;
      ctx.translate(qrX + margin, qrY + margin);
      ctx.scale(inner / w, inner / w);
    }
  }

  // Define Content Area for the QR based on Frame Style
  const padding = size * 0.03;
  let contentX = 0;
  let contentY = 0;
  let contentSize = size;

  // Adjust content area for frames to give proper breathing space
  if (frameStyle !== FRAME_STYLES.NONE) {
    const labelHeight = size * 0.14; // Unify label height
    contentSize = size - (padding * 2) - labelHeight - (size * 0.06); 
    contentX = (size - contentSize) / 2;
    if (framePosition === 'top') {
      // Shift down to leave space at the top
      contentY = padding + labelHeight + (size - padding * 2 - labelHeight - contentSize) / 2;
    } else {
      // Shift up to leave space at the bottom
      contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
    }
  }

  // Adjust content area for background shape corners to fit perfectly with margins
  if (qrBgShape && qrBgShape !== 'full' && qrBgShape !== 'none') {
    let shapeScale = 1.0;
    if (qrBgShape === 'circle') {
      shapeScale = 0.68; // Leave a nice margin (0.707 is absolute max)
    } else if (qrBgShape === 'leaf') {
      shapeScale = 0.72; // Leaf shape cuts off top-left and bottom-right
    } else if (qrBgShape === 'cut') {
      shapeScale = 0.80; // Cut corners cut off diagonally
    } else if (qrBgShape === 'squircle') {
      shapeScale = 0.82; // Squircle has rounded corners
    } else if (qrBgShape === 'rounded') {
      shapeScale = 0.84; // Rounded box
    } else if (qrBgShape === 'shield') {
      shapeScale = 0.66; // Shield shape
    } else if (qrBgShape === 'hexagon') {
      shapeScale = 0.58; // Hexagon
    } else if (qrBgShape === 'octagon') {
      shapeScale = 0.66; // Octagon
    } else if (qrBgShape === 'diamond') {
      shapeScale = 0.45; // Diamond requires smaller scale to fit diagonally
    }

    contentSize = contentSize * shapeScale;
    contentX = (size - contentSize) / 2;
    if (frameStyle !== FRAME_STYLES.NONE) {
      const labelHeight = size * 0.14;
      if (framePosition === 'top') {
        contentY = padding + labelHeight + (size - padding * 2 - labelHeight - contentSize) / 2;
      } else {
        contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
      }
    } else {
      contentY = (size - contentSize) / 2;
    }
  }

  // Apply custom QR Size Scale
  if (qrSizeScale !== undefined && qrSizeScale !== 1.0) {
    const oldSize = contentSize;
    contentSize = contentSize * qrSizeScale;
    contentX = contentX + (oldSize - contentSize) / 2;
    contentY = contentY + (oldSize - contentSize) / 2;
  }

  // Apply custom QR Position Offset (qrPosX/Y from 0 to 1, default 0.5)
  if (qrPosX !== undefined && qrPosX !== 0.5) {
    const offsetX = (qrPosX - 0.5) * (size - contentSize);
    contentX += offsetX;
  }
  if (qrPosY !== undefined && qrPosY !== 0.5) {
    const offsetY = (qrPosY - 0.5) * (size - contentSize);
    contentY += offsetY;
  }

  // Draw frame if enabled
  if (frameStyle !== FRAME_STYLES.NONE) {
    drawFrame(ctx, size, padding, {
      frameStyle,
      frameText,
      frameColor: frameColor || (gradientEnabled ? gradientColor1 : qrColor),
      frameFont,
      frameSize,
      frameStrokeEnabled,
      frameStrokeWidth,
      frameStrokeColor,
      frameShadowEnabled,
      frameShadowBlur,
      frameShadowColor,
      showHandle: options.showHandle,
      selectedType: options.selectedType,
      frameRotation: options.frameRotation,
      framePosition: options.framePosition,
      bgColor,
      bgTransparent
    });
  }

  const totalModules = moduleCount + quietZone * 2;
  const cellSize = contentSize / totalModules;

  // Draw high-contrast container card behind the QR code (only if explicitly enabled)
  if (backgroundImageEnabled && backgroundImage && qrBackgroundCardEnabled && !options.template) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${qrBackgroundCardOpacity !== undefined ? qrBackgroundCardOpacity : 0.8})`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 16;
    
    const qrGridSize = moduleCount * cellSize;
    const qrX = contentX + quietZone * cellSize;
    const qrY = contentY + quietZone * cellSize;
    
    const paddingVal = cellSize * 1.0;
    const cardX = qrX - paddingVal;
    const cardY = qrY - paddingVal;
    const cardSize = qrGridSize + paddingVal * 2;
    
    const radius = cellSize * 1.5;
    ctx.beginPath();
    if (qrBackgroundCardShape === 'circle') {
      const cx = cardX + cardSize / 2;
      const cy = cardY + cardSize / 2;
      const r = cardSize / 2;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (qrBackgroundCardShape === 'cut') {
      const cut = radius * 1.2;
      ctx.moveTo(cardX + cut, cardY);
      ctx.lineTo(cardX + cardSize - cut, cardY);
      ctx.lineTo(cardX + cardSize, cardY + cut);
      ctx.lineTo(cardX + cardSize, cardY + cardSize - cut);
      ctx.lineTo(cardX + cardSize - cut, cardY + cardSize);
      ctx.lineTo(cardX + cut, cardY + cardSize);
      ctx.lineTo(cardX, cardY + cardSize - cut);
      ctx.lineTo(cardX, cardY + cut);
      ctx.closePath();
    } else if (qrBackgroundCardShape === 'leaf') {
      const rLarge = radius * 2.5;
      const rSmall = radius * 0.3;
      ctx.moveTo(cardX + rLarge, cardY);
      ctx.arcTo(cardX + cardSize, cardY, cardX + cardSize, cardY + cardSize, rSmall);
      ctx.arcTo(cardX + cardSize, cardY + cardSize, cardX, cardY + cardSize, rLarge);
      ctx.arcTo(cardX, cardY + cardSize, cardX, cardY, rSmall);
      ctx.arcTo(cardX, cardY, cardX + cardSize, cardY, rLarge);
      ctx.closePath();
    } else if (qrBackgroundCardShape === 'squircle') {
      const r = radius * 2.0;
      ctx.moveTo(cardX + r, cardY);
      ctx.lineTo(cardX + cardSize - r, cardY);
      ctx.bezierCurveTo(cardX + cardSize - r/2, cardY, cardX + cardSize, cardY + r/2, cardX + cardSize, cardY + r);
      ctx.lineTo(cardX + cardSize, cardY + cardSize - r);
      ctx.bezierCurveTo(cardX + cardSize, cardY + cardSize - r/2, cardX + cardSize - r/2, cardY + cardSize, cardX + cardSize - r, cardY + cardSize);
      ctx.lineTo(cardX + r, cardY + cardSize);
      ctx.bezierCurveTo(cardX + r/2, cardY + cardSize, cardX, cardY + cardSize - r/2, cardX, cardY + cardSize - r);
      ctx.lineTo(cardX, cardY + r);
      ctx.bezierCurveTo(cardX, cardY + r/2, cardX + r/2, cardY, cardX + r, cardY);
      ctx.closePath();
    } else { // default 'rounded'
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardSize, cardSize, radius);
      } else {
        ctx.rect(cardX, cardY, cardSize, cardSize);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  // Create gradient if enabled
  let fillStyle;
  if (gradientEnabled) {
    if (gradientType === 'linear') {
      fillStyle = ctx.createLinearGradient(0, 0, size, size);
    } else {
      fillStyle = ctx.createRadialGradient(
        size / 2, size / 2, 0, 
        size / 2, size / 2, size / 2
      );
    }
    fillStyle.addColorStop(0, gradientColor1);
    fillStyle.addColorStop(1, gradientColor2);
  } else {
    fillStyle = parseColorOrGradient(ctx, contentX, contentY, contentSize, contentSize, qrColor);
  }

  // --- BACKGROUND IMAGE AI SMART PIXEL SAMPLING ---
  let bgPixelData = null;
  if (backgroundImageEnabled && backgroundImage && !options.template) {
    try {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = size;
      sampleCanvas.height = size;
      const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      
      const imgRatio = backgroundImage.width / backgroundImage.height;
      let drawWidth, drawHeight, sx, sy;
      if (imgRatio > 1) {
        drawHeight = backgroundImage.height;
        drawWidth = backgroundImage.height;
        sx = (backgroundImage.width - drawWidth) / 2;
        sy = 0;
      } else {
        drawWidth = backgroundImage.width;
        drawHeight = backgroundImage.width;
        sx = 0;
        sy = (backgroundImage.height - drawHeight) / 2;
      }
      sCtx.drawImage(backgroundImage, sx, sy, drawWidth, drawHeight, 0, 0, size, size);
      bgPixelData = sCtx.getImageData(0, 0, size, size).data;
    } catch (e) {
      console.warn('Could not sample background image for adaptive contrast:', e);
    }
  }

  // Helper to measure perceived luminance under any coordinate
  const getSampledLuminance = (px, py, r = 4) => {
    if (!bgPixelData) return 255;
    let totalLum = 0;
    let count = 0;
    const startX = Math.max(0, Math.floor(px - r));
    const endX = Math.min(size - 1, Math.floor(px + r));
    const startY = Math.max(0, Math.floor(py - r));
    const endY = Math.min(size - 1, Math.floor(py + r));

    for (let y = startY; y <= endY; y += 2) {
      for (let x = startX; x <= endX; x += 2) {
        const idx = (y * size + x) * 4;
        const red = bgPixelData[idx];
        const green = bgPixelData[idx + 1];
        const blue = bgPixelData[idx + 2];
        const lum = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        totalLum += lum;
        count++;
      }
    }
    return count > 0 ? totalLum / count : 255;
  };

  // --- TEXTURE HANDLING PREP ---
  let silhouetteCanvas, silhouetteCtx;
  if (qrTextureEnabled && qrTexture?.image) {
    silhouetteCanvas = document.createElement('canvas');
    silhouetteCanvas.width = size;
    silhouetteCanvas.height = size;
    silhouetteCtx = silhouetteCanvas.getContext('2d');
  }

  // 1. Draw Eyes (Finder Patterns) with Sleek Rounded Safety Plates
  if (!options.hideEyes) {
    const eyePositions = [
      { r: 0, c: 0, type: 'top-left' }, // Top-left
      { r: 0, c: moduleCount - 7, type: 'top-right' }, // Top-right
      { r: moduleCount - 7, c: 0, type: 'bottom-left' } // Bottom-left
    ];
    
    eyePositions.forEach(pos => {
      const x = contentX + (pos.c + quietZone) * cellSize;
      const y = contentY + (pos.r + quietZone) * cellSize;
      const eyeSize = cellSize * 7;
      const eyeCenterX = x + eyeSize / 2;
      const eyeCenterY = y + eyeSize / 2;

      // ── Hard-Corner Square Safety Backing behind Finder Eyes for 100% Recognition ──
      if (backgroundImageEnabled && backgroundImage && !options.template) {
        ctx.save();
        const pad = cellSize * 0.45;
        const plateX = x - pad;
        const plateY = y - pad;
        const plateSize = eyeSize + pad * 2;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.beginPath();
        ctx.rect(plateX, plateY, plateSize, plateSize);
        ctx.fill();
        ctx.restore();
      }
      
      const useEyeColor = syncEyes ? fillStyle : (eyeColor || qrColor);
      const useEyeOuterColor = syncEyes ? fillStyle : (eyeOuterColor || useEyeColor);

      const parsedInner = typeof useEyeColor === 'string' ? parseColorOrGradient(ctx, x, y, eyeSize, eyeSize, useEyeColor) : useEyeColor;
      const parsedOuter = typeof useEyeOuterColor === 'string' ? parseColorOrGradient(ctx, x, y, eyeSize, eyeSize, useEyeOuterColor) : useEyeOuterColor;
      
      if (qrTextureEnabled && qrTexture?.image && qrTextureSyncEyes) {
        drawEye(silhouetteCtx, x, y, eyeSize, eyeStyle, '#000', '#000', pos.type);
      } else {
        drawEye(ctx, x, y, eyeSize, eyeStyle, parsedOuter, parsedInner, pos.type);
      }
    });
  }
  
  // 2. Draw QR modules with AI Adaptive Dual-Tone Halftone Processing
  if (!options.hideDots) {
    // Pass A: On messy/dark photo regions, render subtle light substrate on empty spaces
    if (backgroundImageEnabled && backgroundImage && !options.template && bgPixelData) {
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (isFinderPattern(row, col, moduleCount)) continue;
          if (matrix[row][col]) continue; // Only process empty modules (0)

          const x = contentX + (col + quietZone) * cellSize;
          const y = contentY + (row + quietZone) * cellSize;
          const moduleCenterX = x + cellSize / 2;
          const moduleCenterY = y + cellSize / 2;
          const localLum = getSampledLuminance(moduleCenterX, moduleCenterY, cellSize * 0.45);

          // If photo under empty cell is dark, brighten it slightly so camera binarizer doesn't mistake it for a dot
          if (localLum < 125) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
            ctx.beginPath();
            ctx.arc(moduleCenterX, moduleCenterY, cellSize * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // Pass B: Render Active Dots with Adaptive Micro-Backing
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderPattern(row, col, moduleCount)) continue;
        if (!matrix[row][col]) continue;

        const x = contentX + (col + quietZone) * cellSize;
        const y = contentY + (row + quietZone) * cellSize;
        const moduleCenterX = x + cellSize / 2;
        const moduleCenterY = y + cellSize / 2;

        const neighbors = {
          top: row > 0 && matrix[row-1][col] && !isFinderPattern(row-1, col, moduleCount),
          bottom: row < moduleCount - 1 && matrix[row+1][col] && !isFinderPattern(row+1, col, moduleCount),
          left: col > 0 && matrix[row][col-1] && !isFinderPattern(row, col-1, moduleCount),
          right: col < moduleCount - 1 && matrix[row][col+1] && !isFinderPattern(row, col+1, moduleCount)
        };

        if (qrTextureEnabled && qrTexture?.image) {
          silhouetteCtx.fillStyle = '#000';
          drawDotModule(silhouetteCtx, x, y, cellSize, dotStyle, neighbors, options, row, col);
        } else {
          // AI Adaptive Micro-Backing for Photo Backgrounds
          if (backgroundImageEnabled && backgroundImage && !options.template && bgPixelData) {
            const localLum = getSampledLuminance(moduleCenterX, moduleCenterY, cellSize * 0.45);
            
            ctx.save();
            // Draw protective micro-base under the active dot
            if (localLum < 145) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
              ctx.shadowBlur = 4;
              ctx.beginPath();
              ctx.arc(moduleCenterX, moduleCenterY, cellSize * 0.46, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#000000'; // Pure solid black module for 100% camera decodability
            drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, options, row, col);
            ctx.restore();
          } else {
            ctx.fillStyle = fillStyle;
            drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, options, row, col);
          }
        }
      }
    }
  }

  // --- APPLY TEXTURE ---
  if (qrTextureEnabled && qrTexture?.image) {
    ctx.save();
    silhouetteCtx.globalCompositeOperation = 'source-in';
    silhouetteCtx.drawImage(qrTexture.image, contentX, contentY, contentSize, contentSize);
    ctx.drawImage(silhouetteCanvas, 0, 0);
    ctx.restore();
  }

  // Draw logo or Text
  if (logo) {
    drawLogo(ctx, logo, size, {
      ...options,
      logoWidth,
      logoHeight,
      logoPadding,
      logoBackground,
      logoBgColor,
      logoBgShape,
      logoOutline,
      logoOutlineColor,
      logoOutlineWidth,
      logoOutlineOpacity,
      logoPosX,
      logoPosY,
      logoOpacity,
      logoRotation,
      logoShadowEnabled,
      logoShadowColor,
      logoShadowBlur,
      logoShadowOffsetX,
      logoShadowOffsetY,
      logoInnerShadowEnabled,
      logoEraseColorEnabled,
      logoEraseColor,
      logoEraseTolerance,
      logoEraseSmoothing,
      logoTexture,
      logoCrop,
      contentX,
      contentY,
      contentSize,
      moduleCount,
      quietZone
    });
  } else if (textCenter) {
    drawCenterText(ctx, textCenter, size, {
      textCenterSize,
      textCenterFont,
      textCenterColor,
      textCenterStrokeEnabled,
      textCenterStrokeWidth,
      textCenterStrokeColor,
      textCenterShadowEnabled,
      textCenterShadowBlur,
      textCenterShadowColor,
      textCenterPosX,
      textCenterPosY,
      textCenterRotation,
      textCenterWidth,
      textCenterHeight,
      logoPadding,
      logoBackground,
      logoBgColor,
      logoBgShape,
      contentX,
      contentY,
      contentSize,
      moduleCount,
      quietZone,
      showHandle: options.showHandle,
      selectedType: options.selectedType
    });
  }

  // ── Custom Multi-Text Layers ──
  if (options.customTexts && Array.isArray(options.customTexts) && options.customTexts.length > 0) {
    drawCustomTexts(ctx, options.customTexts, size, {
      ...options,
      contentX,
      contentY,
      contentSize,
      moduleCount,
      quietZone,
      showHandle: options.showHandle,
      selectedType: options.selectedType
    });
  }

  if (options.template) {
    ctx.restore();
  }

  return canvas;
}

/**
 * Draw a single dot module
 */
export function drawDotModule(ctx, x, y, size, style, neighbors = {}, options = {}, row = 0, col = 0) {
  const userPadding = options.dotPadding !== undefined ? options.dotPadding : 12;

  // Enforce healthy minimum padding for discrete shapes so dots stay separate and beautiful
  let effectivePaddingPct = userPadding;
  if (style === DOT_STYLES.DOTS) {
    effectivePaddingPct = Math.max(14, userPadding);
  } else if (style === DOT_STYLES.ROUNDED || style === DOT_STYLES.CLASSY || style === DOT_STYLES.EXTRA_ROUNDED) {
    effectivePaddingPct = Math.max(8, userPadding);
  } else if (style === DOT_STYLES.DIAMOND || style === DOT_STYLES.STAR || style === DOT_STYLES.HEART || style === DOT_STYLES.OCTAGON) {
    effectivePaddingPct = Math.max(10, userPadding);
  } else if (
    style === DOT_STYLES.CHERRY_BLOSSOM || style === DOT_STYLES.VIOLET_FLOWER ||
    style === DOT_STYLES.SUNFLOWER || style === DOT_STYLES.ROSE ||
    style === DOT_STYLES.DAISY || style === DOT_STYLES.TULIP ||
    style === DOT_STYLES.LOTUS || style === DOT_STYLES.FORGET_ME_NOT ||
    style === DOT_STYLES.PANSY || style === DOT_STYLES.DOLLAR_COIN ||
    style === DOT_STYLES.CUTE_EMOTICON || style === DOT_STYLES.LAVENDER ||
    style === DOT_STYLES.MONSTERA || style === DOT_STYLES.COFFEE_BEAN ||
    style === DOT_STYLES.RAINDROP || style === DOT_STYLES.CACTUS_PLANT ||
    style === DOT_STYLES.BASKETBALL_DOT || style === DOT_STYLES.CHESS_PAWN ||
    style === DOT_STYLES.BOW_RIBBON
  ) {
    // For premium floral and decorative styles, we handle sizing internally to match reference style
    effectivePaddingPct = 0; 
  }

  const padding = (size * effectivePaddingPct) / 100;
  const s = size - padding * 2;
  const { top, bottom, left, right } = neighbors;

  // Premium decorative/floral styles setup
  const isFloral = [
    DOT_STYLES.CHERRY_BLOSSOM, DOT_STYLES.VIOLET_FLOWER, DOT_STYLES.SUNFLOWER,
    DOT_STYLES.ROSE, DOT_STYLES.DAISY, DOT_STYLES.TULIP,
    DOT_STYLES.LOTUS, DOT_STYLES.FORGET_ME_NOT, DOT_STYLES.PANSY,
    DOT_STYLES.DOLLAR_COIN, DOT_STYLES.CUTE_EMOTICON, DOT_STYLES.LAVENDER,
    DOT_STYLES.MONSTERA, DOT_STYLES.COFFEE_BEAN, DOT_STYLES.RAINDROP,
    DOT_STYLES.CACTUS_PLANT, DOT_STYLES.BASKETBALL_DOT,
    DOT_STYLES.CHESS_PAWN, DOT_STYLES.BOW_RIBBON
  ].includes(style);

  // Deterministically scatter large premium flowers (~8% of the modules)
  // The rest are smaller floral filler dots, matching the style of the reference image.
  const isLarge = isFloral && ((row * 17 + col * 23) % 13 === 0);

  switch (style) {
    case DOT_STYLES.SQUARE:
      ctx.fillRect(x + padding, y + padding, s, s);
      break;
    case DOT_STYLES.ROUNDED:
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.32);
      break;
    case DOT_STYLES.DOTS:
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, s / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case DOT_STYLES.SPARKLE: {
      const cx = x + size / 2, cy = y + size / 2, r = s / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case DOT_STYLES.HEXAGON: {
      const r = s / 2, cx = x + size / 2, cy = y + size / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI / 3);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case DOT_STYLES.CAPSULE: {
      const r = s * 0.4;
      drawRoundedRect(ctx, x + padding + s * 0.1, y + padding, s * 0.8, s, r);
      break;
    }
    case DOT_STYLES.SHIELD: {
      const w = s, h = s, leftX = x + padding, topY = y + padding;
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(leftX + w, topY);
      ctx.lineTo(leftX + w, topY + h * 0.5);
      ctx.quadraticCurveTo(leftX + w * 0.5, topY + h * 1.1, leftX, topY + h * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case DOT_STYLES.PIXEL: {
      ctx.fillRect(x + padding, y + padding, s, s);
      const innerCut = s * 0.35;
      ctx.clearRect(x + size / 2 - innerCut / 2, y + size / 2 - innerCut / 2, innerCut, innerCut);
      break;
    }
    case DOT_STYLES.DIAMOND:
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + padding);
      ctx.lineTo(x + size - padding, y + size / 2);
      ctx.lineTo(x + size / 2, y + size - padding);
      ctx.lineTo(x + padding, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case DOT_STYLES.STAR: {
      const cx = x + size / 2, cy = y + size / 2, spikes = 5, outerRadius = s/2, innerRadius = s/4;
      let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
      ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius); rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fill();
      break;
    }
    case DOT_STYLES.TRIANGLE:
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + padding);
      ctx.lineTo(x + size - padding, y + size - padding);
      ctx.lineTo(x + padding, y + size - padding);
      ctx.closePath(); ctx.fill();
      break;
    case DOT_STYLES.HEART: {
      const d = s * 0.8;
      const hx = x + (size - d) / 2, hy = y + (size - d) / 2 + d / 4;
      ctx.beginPath();
      ctx.moveTo(hx + d/2, hy + d/5);
      ctx.bezierCurveTo(hx + d/2, hy, hx, hy, hx, hy + d/3);
      ctx.bezierCurveTo(hx, hy + d/2, hx + d/2, hy + d, hx + d/2, hy + d);
      ctx.bezierCurveTo(hx + d/2, hy + d, hx + d, hy + d/2, hx + d, hy + d/3);
      ctx.bezierCurveTo(hx + d, hy, hx + d/2, hy, hx + d/2, hy + d/5);
      ctx.fill();
      break;
    }
    case DOT_STYLES.OCTAGON: {
      const r = s / 2, cx = x + size / 2, cy = y + size / 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4) + Math.PI / 8;
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case DOT_STYLES.PLUS: {
      const t = s * 0.3;
      ctx.fillRect(x + size / 2 - t / 2, y + padding, t, s);
      ctx.fillRect(x + padding, y + size / 2 - t / 2, s, t);
      break;
    }
    case DOT_STYLES.CROSS: {
      const t = s * 0.3;
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate(Math.PI / 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-t / 2, -s / 2, t, s);
      ctx.fillRect(-s / 2, -t / 2, s, t);
      ctx.restore();
      break;
    }
    case DOT_STYLES.CLASSY:
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.5);
      break;
    case DOT_STYLES.DENSO:
      ctx.fillRect(x, y, size + 0.5, size + 0.5);
      break;
    case DOT_STYLES.EXTRA_ROUNDED:
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.45);
      break;
    case DOT_STYLES.FLUID: {
      const r = size * 0.45;
      const xL = left ? x - 0.6 : x;
      const xR = right ? x + size + 0.6 : x + size;
      const yT = top ? y - 0.6 : y;
      const yB = bottom ? y + size + 0.6 : y + size;

      ctx.beginPath();
      // TL corner
      if (top || left) ctx.moveTo(xL, yT);
      else { ctx.moveTo(x + r, y); ctx.arcTo(x, y, x, y + r, r); }
      // BL corner
      if (bottom || left) ctx.lineTo(xL, yB);
      else { ctx.lineTo(x, y + size - r); ctx.arcTo(x, y + size, x + r, y + size, r); }
      // BR corner
      if (bottom || right) ctx.lineTo(xR, yB);
      else { ctx.lineTo(x + size - r, y + size); ctx.arcTo(x + size, y + size, x + size, y + size - r, r); }
      // TR corner
      if (top || right) ctx.lineTo(xR, yT);
      else { ctx.lineTo(x + size, y + r); ctx.arcTo(x + size, y, x + size - r, y, r); }
      ctx.closePath(); ctx.fill();
      break;
    }
    case DOT_STYLES.LEAF: {
      const r = s * 0.8;
      ctx.beginPath();
      ctx.moveTo(x + padding + r, y + padding);
      ctx.lineTo(x + padding + s, y + padding);
      ctx.lineTo(x + padding + s, y + padding + s - r);
      ctx.quadraticCurveTo(x + padding + s, y + padding + s, x + padding + s - r, y + padding + s);
      ctx.lineTo(x + padding, y + padding + s);
      ctx.lineTo(x + padding, y + padding + r);
      ctx.quadraticCurveTo(x + padding, y + padding, x + padding + r, y + padding);
      ctx.fill();
      break;
    }
    // ── Floral / Decorative Dot Styles (9 premium flower shapes) ──
    case DOT_STYLES.CHERRY_BLOSSOM: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      const petalR = r * 0.55;
      const petalD = r * 0.45;
      const baseColor = ctx.fillStyle;

      ctx.save();
      // Draw 5 petals using scannable QR color
      ctx.fillStyle = baseColor;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        
        ctx.beginPath();
        // Heart shape notch representation
        const a1 = angle - 0.5;
        const a2 = angle + 0.5;
        ctx.moveTo(px, py);
        ctx.arc(px + Math.cos(a1) * petalR * 0.5, py + Math.sin(a1) * petalR * 0.5, petalR * 0.5, angle + Math.PI, angle + Math.PI * 2, false);
        ctx.arc(px + Math.cos(a2) * petalR * 0.5, py + Math.sin(a2) * petalR * 0.5, petalR * 0.5, angle + Math.PI, angle, true);
        ctx.closePath();
        ctx.fill();
      }
      // Center disc
      ctx.beginPath();
      ctx.fillStyle = '#ffe066'; // Golden yellow center
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.VIOLET_FLOWER: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      const petalR = r * 0.52;
      const petalD = r * 0.42;

      ctx.save();
      ctx.fillStyle = '#8e7cc3'; // Soft violet purple
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        ctx.moveTo(cx, cy);
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
      }
      ctx.fill();
      // Center yellow accent
      ctx.beginPath();
      ctx.fillStyle = '#ffd966';
      ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.SUNFLOWER: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);

      ctx.save();
      ctx.fillStyle = '#f1c232'; // Golden yellow sunflower petals
      ctx.beginPath();
      const petalCount = 10;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 2 * Math.PI / petalCount) - Math.PI / 2;
        const tipX = cx + Math.cos(angle) * r;
        const tipY = cy + Math.sin(angle) * r;
        const baseL = angle - 0.32;
        const baseR = angle + 0.32;
        const bD = r * 0.35;
        ctx.moveTo(cx + Math.cos(baseL) * bD, cy + Math.sin(baseL) * bD);
        ctx.quadraticCurveTo(tipX, tipY, cx + Math.cos(baseR) * bD, cy + Math.sin(baseR) * bD);
      }
      ctx.fill();
      // Dark center disc
      ctx.beginPath();
      ctx.fillStyle = '#7f6000'; // Sunflower dark center
      ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.ROSE: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);

      ctx.save();
      // Draw green leaves under the rose if large
      if (isLarge) {
        ctx.fillStyle = '#38761d';
        ctx.beginPath();
        // Leaf 1
        ctx.ellipse(cx - r * 0.4, cy + r * 0.4, r * 0.4, r * 0.25, Math.PI / 4, 0, Math.PI * 2);
        // Leaf 2
        ctx.ellipse(cx + r * 0.4, cy + r * 0.4, r * 0.4, r * 0.25, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#cc0000'; // Rich red rose
      // Outer petals
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5);
        const px = cx + Math.cos(angle) * r * 0.3;
        const py = cy + Math.sin(angle) * r * 0.3;
        ctx.moveTo(px + r * 0.5, py);
        ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
      }
      ctx.fill();

      // Inner rose detail
      ctx.fillStyle = '#990000'; // Darker rose core
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI / 3) + 0.5;
        const px = cx + Math.cos(angle) * r * 0.15;
        const py = cy + Math.sin(angle) * r * 0.15;
        ctx.moveTo(px + r * 0.3, py);
        ctx.arc(px, py, r * 0.3, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.DAISY: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);

      ctx.save();
      // Draw green leaves/stem if large
      if (isLarge) {
        ctx.strokeStyle = '#6aa84f';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + r);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff'; // White daisy petals
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = size * 0.02;
      const petalCount = 8;
      const petalLen = r * 0.9;
      const petalW = r * 0.26;
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 2 * Math.PI / petalCount);
        const tipX = cx + Math.cos(angle) * petalLen;
        const tipY = cy + Math.sin(angle) * petalLen;
        const perpAngle = angle + Math.PI / 2;
        const bl = { x: cx + Math.cos(perpAngle) * petalW, y: cy + Math.sin(perpAngle) * petalW };
        const br = { x: cx - Math.cos(perpAngle) * petalW, y: cy - Math.sin(perpAngle) * petalW };
        
        ctx.beginPath();
        ctx.moveTo(bl.x, bl.y);
        ctx.quadraticCurveTo(tipX + Math.cos(perpAngle) * petalW * 0.3, tipY + Math.sin(perpAngle) * petalW * 0.3, tipX, tipY);
        ctx.quadraticCurveTo(tipX - Math.cos(perpAngle) * petalW * 0.3, tipY - Math.sin(perpAngle) * petalW * 0.3, br.x, br.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Yellow Center disc
      ctx.beginPath();
      ctx.fillStyle = '#f1c232';
      ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.TULIP: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);

      ctx.save();
      // Stem & Leaf
      ctx.fillStyle = '#4f772d'; // Tulip stem olive green
      ctx.fillRect(cx - r * 0.08, cy, r * 0.16, r);
      if (isLarge) {
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.3, cy + r * 0.4, r * 0.3, r * 0.15, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tulip Cup
      ctx.fillStyle = '#ff4d6d'; // Pink tulip petals
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.9, cy - r * 0.2, cx - r * 0.3, cy - r * 0.9);
      ctx.quadraticCurveTo(cx, cy - r * 0.5, cx, cy + r * 0.2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.2);
      ctx.quadraticCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.3, cy - r * 0.9);
      ctx.quadraticCurveTo(cx, cy - r * 0.5, cx, cy + r * 0.2);
      ctx.fill();

      // Middle petal
      ctx.fillStyle = '#c9184a'; // Darker pink highlight
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.2, cy - r * 0.2);
      ctx.quadraticCurveTo(cx, cy - r * 1.0, cx + r * 0.2, cy - r * 0.2);
      ctx.quadraticCurveTo(cx, cy + r * 0.2, cx - r * 0.2, cy - r * 0.2);
      ctx.fill();

      ctx.restore();
      break;
    }
    case DOT_STYLES.LOTUS: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      const baseColor = ctx.fillStyle;

      ctx.save();
      // Base leaf (pad)
      ctx.fillStyle = '#2d6a4f'; // Darker forest green for scan contrast
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.3, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Layered petals using scannable QR color
      ctx.fillStyle = baseColor;
      const petalAngles = [-0.7, -0.35, 0, 0.35, 0.7];
      for (let i = 0; i < petalAngles.length; i++) {
        const angle = petalAngles[i] - Math.PI / 2;
        const tipX = cx + Math.cos(angle) * r * 0.95;
        const tipY = cy + Math.sin(angle) * r * 0.95;
        const spread = 0.32;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.1);
        ctx.quadraticCurveTo(cx + Math.cos(angle - spread) * r * 0.65, cy + Math.sin(angle - spread) * r * 0.65, tipX, tipY);
        ctx.quadraticCurveTo(cx + Math.cos(angle + spread) * r * 0.65, cy + Math.sin(angle + spread) * r * 0.65, cx, cy + r * 0.1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case DOT_STYLES.FORGET_ME_NOT: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      const petalR = r * 0.45;
      const petalD = r * 0.48;

      ctx.save();
      ctx.fillStyle = '#3a86c8'; // Sky blue forget-me-not petals
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        ctx.moveTo(px + petalR, py);
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
      }
      ctx.fill();

      // Center yellow accent
      ctx.beginPath();
      ctx.fillStyle = '#ffb703';
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.PANSY: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);

      ctx.save();
      // 2 top petals (Indigo purple)
      ctx.fillStyle = '#6c5ce7';
      for (let i = 0; i < 2; i++) {
        const angle = (i === 0 ? -0.55 : 0.55) - Math.PI / 2;
        const px = cx + Math.cos(angle) * r * 0.32;
        const py = cy + Math.sin(angle) * r * 0.32;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3 bottom petals (Lavender blue)
      ctx.fillStyle = '#a29bfe';
      for (let i = 0; i < 3; i++) {
        const angle = ((i - 1) * 0.6) + Math.PI / 2;
        const px = cx + Math.cos(angle) * r * 0.32;
        const py = cy + Math.sin(angle) * r * 0.32;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center yellow/black core
      ctx.beginPath();
      ctx.fillStyle = '#fdcb6e';
      ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case DOT_STYLES.DOLLAR_COIN: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      ctx.save();
      if (isLarge) {
        // Draw a stack of coins
        // Bottom coin
        ctx.fillStyle = '#d4af37'; // Gold border
        ctx.beginPath(); ctx.ellipse(cx - r*0.2, cy + r*0.3, r*0.6, r*0.3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd700'; // Gold fill
        ctx.beginPath(); ctx.ellipse(cx - r*0.2, cy + r*0.3, r*0.5, r*0.22, 0, 0, Math.PI*2); ctx.fill();

        // Middle coin
        ctx.fillStyle = '#d4af37';
        ctx.beginPath(); ctx.ellipse(cx + r*0.2, cy + r*0.1, r*0.6, r*0.3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.ellipse(cx + r*0.2, cy + r*0.1, r*0.5, r*0.22, 0, 0, Math.PI*2); ctx.fill();

        // Top coin
        ctx.fillStyle = '#d4af37';
        ctx.beginPath(); ctx.ellipse(cx, cy - r*0.2, r*0.6, r*0.3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.ellipse(cx, cy - r*0.2, r*0.5, r*0.22, 0, 0, Math.PI*2); ctx.fill();
        // $ sign
        ctx.fillStyle = '#996515';
        ctx.font = `bold ${r*0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy - r*0.2);
      } else {
        // Single flat coin
        ctx.fillStyle = '#d4af37';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#996515';
        ctx.font = `bold ${r*1.0}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy);
      }
      ctx.restore();
      break;
    }
    case DOT_STYLES.CUTE_EMOTICON: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      ctx.save();
      if (isLarge) {
        // Draw vertical orange pill-shaped character
        ctx.fillStyle = '#f39c12'; // Main orange color
        drawRoundedRect(ctx, cx - r * 0.5, cy - r, r, r * 2, r * 0.5);
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill();
        
        // Happy open mouth
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.1, r * 0.2, 0, Math.PI, false);
        ctx.fill();
      } else {
        // Small round face
        ctx.fillStyle = '#f1c40f'; // Cute yellow face
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(cx - r*0.3, cy - r*0.1, r*0.15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r*0.3, cy - r*0.1, r*0.15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy + r*0.3, r*0.2, 0, Math.PI, false); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case DOT_STYLES.LAVENDER: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      ctx.save();
      if (isLarge) {
        // Green stem
        ctx.strokeStyle = '#556b2f';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.lineTo(cx, cy - r * 0.8); ctx.stroke();

        // Stacked purple flower pods
        ctx.fillStyle = '#9b59b6'; // Deep lavender purple
        for (let i = 0; i < 4; i++) {
          const py = cy - r * 0.6 + i * r * 0.45;
          ctx.beginPath(); ctx.ellipse(cx - r * 0.35, py, r * 0.3, r * 0.18, -Math.PI/6, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + r * 0.35, py, r * 0.3, r * 0.18, Math.PI/6, 0, Math.PI*2); ctx.fill();
        }
        // Top bud
        ctx.beginPath(); ctx.arc(cx, cy - r * 0.8, r * 0.22, 0, Math.PI*2); ctx.fill();
      } else {
        // Cluster of lavender purple dots
        ctx.fillStyle = '#a29bfe';
        ctx.beginPath(); ctx.arc(cx, cy - r*0.4, r*0.7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#8e7cc3';
        ctx.beginPath(); ctx.arc(cx - r*0.4, cy + r*0.3, r*0.6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r*0.4, cy + r*0.3, r*0.6, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case DOT_STYLES.MONSTERA: {
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * (isLarge ? 0.75 : 0.45);
      ctx.save();
      ctx.fillStyle = '#27ae60'; // Vibrant green monstera
      if (isLarge) {
        // Draw heart-ish shape with cuts
        ctx.beginPath();
        ctx.moveTo(cx, cy + r);
        ctx.quadraticCurveTo(cx - r * 1.1, cy + r * 0.2, cx - r * 0.8, cy - r * 0.6);
        ctx.quadraticCurveTo(cx, cy - r * 1.1, cx + r * 0.8, cy - r * 0.6);
        ctx.quadraticCurveTo(cx + r * 1.1, cy + r * 0.2, cx, cy + r);
        ctx.closePath();
        ctx.fill();

        // Draw leaf vein cuts
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.06;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.6);
        ctx.lineTo(cx, cy + r * 0.6);
        // Slits
        ctx.moveTo(cx, cy - r * 0.2); ctx.lineTo(cx - r * 0.6, cy - r * 0.4);
        ctx.moveTo(cx, cy - r * 0.2); ctx.lineTo(cx + r * 0.6, cy - r * 0.4);
        ctx.moveTo(cx, cy + r * 0.2); ctx.lineTo(cx - r * 0.6, cy);
        ctx.moveTo(cx, cy + r * 0.2); ctx.lineTo(cx + r * 0.6, cy);
        ctx.stroke();
      } else {
        // Small round palm leaf/dot
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#1e8449';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath(); ctx.moveTo(cx - r*0.7, cy + r*0.7); ctx.lineTo(cx + r*0.7, cy - r*0.7); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    // ── NEW ICON DOT STYLES ──────────────────────────────────────────────────
    case DOT_STYLES.COFFEE_BEAN: {
      ctx.save();
      ctx.fillStyle = '#6f3d11';
      const cx = x + size / 2, cy = y + size / 2;
      const r = (size * 0.42);
      // Elliptical bean body
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.62, r, 0, 0, Math.PI * 2); ctx.fill();
      // Center crease line
      ctx.strokeStyle = '#3b1a06'; ctx.lineWidth = size * 0.08;
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.75); ctx.lineTo(cx, cy + r * 0.75); ctx.stroke();
      ctx.restore(); break;
    }
    case DOT_STYLES.RAINDROP: {
      ctx.save();
      ctx.fillStyle = '#1a5276';
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * 0.42;
      // Teardrop: circle bottom + pointed top
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy + r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.5, cy - r * 0.2, cx, cy - r);
      ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.2, cx + r * 0.35, cy + r * 0.2);
      ctx.closePath(); ctx.fill();
      ctx.restore(); break;
    }
    case DOT_STYLES.CACTUS_PLANT: {
      ctx.save();
      ctx.fillStyle = '#196f3d';
      const cx = x + size / 2, cy = y + size / 2;
      const u = size * 0.08;
      // Cactus trunk
      ctx.beginPath();
      ctx.roundRect(cx - u, cy - u * 2.5, u * 2, u * 6, u * 0.5);
      ctx.fill();
      // Left arm
      ctx.beginPath();
      ctx.roundRect(cx - u * 3.5, cy - u, u * 2.5, u, u * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cx - u * 3.5, cy - u * 2.5, u, u * 1.8, u * 0.5);
      ctx.fill();
      // Right arm
      ctx.beginPath();
      ctx.roundRect(cx + u, cy - u * 0.5, u * 2.5, u, u * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cx + u * 2.5, cy - u * 2, u, u * 1.8, u * 0.5);
      ctx.fill();
      ctx.restore(); break;
    }

    case DOT_STYLES.BASKETBALL_DOT: {
      ctx.save();
      const cx = x + size / 2, cy = y + size / 2;
      const r = size * 0.42;
      ctx.fillStyle = '#b94a00';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // Basketball seam lines
      ctx.strokeStyle = '#7a3000'; ctx.lineWidth = size * 0.07;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - r * 0.25, cy, r * 0.85, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + r * 0.25, cy, r * 0.85, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
      ctx.restore(); break;
    }
    case DOT_STYLES.CHESS_PAWN: {
      ctx.save();
      ctx.fillStyle = '#2c2c2c';
      const cx = x + size / 2, cy = y + size / 2;
      const u = size * 0.1;
      // Pawn head
      ctx.beginPath(); ctx.arc(cx, cy - u * 2, u * 1.5, 0, Math.PI * 2); ctx.fill();
      // Pawn neck
      ctx.beginPath(); ctx.roundRect(cx - u, cy - u * 0.5, u * 2, u * 1.5, u * 0.2); ctx.fill();
      // Pawn base
      ctx.beginPath(); ctx.roundRect(cx - u * 2, cy + u, u * 4, u * 1.5, u * 0.4); ctx.fill();
      ctx.restore(); break;
    }

    case DOT_STYLES.BOW_RIBBON: {
      ctx.save();
      ctx.fillStyle = '#c0175e';
      const cx = x + size / 2, cy = y + size / 2;
      const w = size * 0.42, h = size * 0.28;
      // Left wing
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx - w * 0.3, cy - h, cx - w, cy - h, cx - w, cy);
      ctx.bezierCurveTo(cx - w, cy + h, cx - w * 0.3, cy + h, cx, cy);
      ctx.closePath(); ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + w * 0.3, cy - h, cx + w, cy - h, cx + w, cy);
      ctx.bezierCurveTo(cx + w, cy + h, cx + w * 0.3, cy + h, cx, cy);
      ctx.closePath(); ctx.fill();
      // Center knot
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); break;
    }
    default: // SQUARE
      // Use 0.5px overfill to eliminate sub-pixel anti-aliasing gaps between adjacent modules
      ctx.fillRect(x + padding, y + padding, s + 0.5, s + 0.5);
      break;
  }
}

/**
 * Draw the full 7x7 eye (finder pattern) as a single unit
 */
export function drawEye(ctx, x, y, size, style, outerColor, innerColor, eyeType = 'top-left') {
  const s = size / 28; // Scale factor from 28x28 coordinate space

  // 1. Draw Outer Ring Path
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  switch (style) {
    case EYE_STYLES.CIRCLE:
    case EYE_STYLES.DOLLAR_COIN:
    case EYE_STYLES.CUTE_EMOTICON:
    case EYE_STYLES.BASKETBALL:
      ctx.arc(14, 14, 14, 0, Math.PI * 2);
      ctx.moveTo(24, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.ROUNDED:
    case EYE_STYLES.CHERRY_BLOSSOM:
    case EYE_STYLES.LOTUS:
    case EYE_STYLES.SUNFLOWER:
    case EYE_STYLES.LAVENDER:
    case EYE_STYLES.ROSE:
    case EYE_STYLES.MONSTERA:
    case EYE_STYLES.DAISY:
    case EYE_STYLES.COFFEE_BEAN:
    case EYE_STYLES.RAINDROP:
    case EYE_STYLES.CACTUS:
    case EYE_STYLES.CHESS:
    case EYE_STYLES.BOW:
    case EYE_STYLES.VIOLET_FLOWER:
    case EYE_STYLES.TULIP:
    case EYE_STYLES.FORGET_ME_NOT:
    case EYE_STYLES.PANSY:
      drawRoundedRectPath(ctx, 0, 0, 28, 28, 8);
      drawRoundedRectPath(ctx, 4, 4, 20, 20, 4);
      break;
    case EYE_STYLES.LEAF:
      if (eyeType === 'top-right' || eyeType === 'bottom-left') {
        // Flipped leaf (sharp at top-right and bottom-left)
        ctx.moveTo(28, 0); ctx.lineTo(8, 0); ctx.quadraticCurveTo(0, 0, 0, 8); ctx.lineTo(0, 28); ctx.lineTo(20, 28); ctx.quadraticCurveTo(28, 28, 28, 20); ctx.closePath();
        ctx.moveTo(24, 4); ctx.lineTo(8, 4); ctx.quadraticCurveTo(4, 4, 4, 8); ctx.lineTo(4, 24); ctx.lineTo(20, 24); ctx.quadraticCurveTo(24, 24, 24, 20); ctx.closePath();
      } else {
        // Original leaf (sharp at top-left and bottom-right)
        ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.quadraticCurveTo(28, 0, 28, 8); ctx.lineTo(28, 28); ctx.lineTo(8, 28); ctx.quadraticCurveTo(0, 28, 0, 20); ctx.closePath();
        ctx.moveTo(4, 4); ctx.lineTo(20, 4); ctx.quadraticCurveTo(24, 4, 24, 8); ctx.lineTo(24, 24); ctx.lineTo(8, 24); ctx.quadraticCurveTo(4, 24, 4, 20); ctx.closePath();
      }
      break;
    case EYE_STYLES.TEARDROP: {
      const sharpCorner = (eyeType === 'top-right') ? 'bottom-left' : (eyeType === 'bottom-left' ? 'top-right' : 'bottom-right');
      const drawT = (pad, r) => {
        const s = 28;
        if (sharpCorner === 'bottom-left') {
          ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad - r, pad); ctx.quadraticCurveTo(s - pad, pad, s - pad, pad + r); ctx.lineTo(s - pad, s - pad - r); ctx.quadraticCurveTo(s - pad, s - pad, s - pad - r, s - pad); ctx.lineTo(pad, s - pad); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
        } else if (sharpCorner === 'top-right') {
          ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad, pad); ctx.lineTo(s - pad, s - pad - r); ctx.quadraticCurveTo(s - pad, s - pad, s - pad - r, s - pad); ctx.lineTo(pad + r, s - pad); ctx.quadraticCurveTo(pad, s - pad, pad, s - pad - r); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
        } else {
          ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad - r, pad); ctx.quadraticCurveTo(s - pad, pad, s - pad, pad + r); ctx.lineTo(s - pad, s - pad); ctx.lineTo(pad + r, s - pad); ctx.quadraticCurveTo(pad, s - pad, pad, s - pad - r); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
        }
        ctx.closePath();
      };
      drawT(0, 8);
      drawT(4, 4);
      break;
    }
    case EYE_STYLES.FLOWER:
      for (let i = 0; i < 24; i++) {
        const a = i * Math.PI / 12;
        const r = i % 2 === 0 ? 14 : 12.5;
        ctx.lineTo(14 + r * Math.cos(a), 14 + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.moveTo(14 + 10, 14);
      ctx.arc(14, 14, 9, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.SHIELD: {
      let angle = 0;
      if (eyeType === 'bottom-left') angle = Math.PI;

      if (angle !== 0) {
        ctx.translate(14, 14);
        ctx.rotate(angle);
        ctx.translate(-14, -14);
      }

      ctx.moveTo(0, 2); ctx.lineTo(28, 2); ctx.lineTo(28, 14); ctx.quadraticCurveTo(28, 24, 14, 28); ctx.quadraticCurveTo(0, 24, 0, 14); ctx.closePath();
      ctx.moveTo(4, 6); ctx.lineTo(24, 6); ctx.lineTo(24, 14); ctx.quadraticCurveTo(24, 20, 14, 24); ctx.quadraticCurveTo(4, 20, 4, 14); ctx.closePath();

      if (angle !== 0) {
        ctx.translate(14, 14);
        ctx.rotate(-angle);
        ctx.translate(-14, -14);
      }
      break;
    }
    case EYE_STYLES.OCTAGON:
      ctx.moveTo(9, 0); ctx.lineTo(19, 0); ctx.lineTo(28, 9); ctx.lineTo(28, 19); ctx.lineTo(19, 28); ctx.lineTo(9, 28); ctx.lineTo(0, 19); ctx.lineTo(0, 9); ctx.closePath();
      ctx.moveTo(10, 4); ctx.lineTo(18, 4); ctx.lineTo(24, 10); ctx.lineTo(24, 18); ctx.lineTo(18, 24); ctx.lineTo(10, 24); ctx.lineTo(4, 18); ctx.lineTo(4, 10); ctx.closePath();
      break;
    case EYE_STYLES.HEXAGON:
    case EYE_STYLES.STAR:
    case EYE_STYLES.TRIANGLE:
    case EYE_STYLES.ROUNDED:
      const r_outer = style === EYE_STYLES.TRIANGLE ? 12 : (style === EYE_STYLES.HEXAGON ? 6 : (style === EYE_STYLES.STAR ? 4 : 8));
      const r_inner = style === EYE_STYLES.TRIANGLE ? 8 : (style === EYE_STYLES.HEXAGON ? 3 : (style === EYE_STYLES.STAR ? 2 : 4));
      drawRoundedRectPath(ctx, 0, 0, 28, 28, r_outer);
      drawRoundedRectPath(ctx, 4, 4, 20, 20, r_inner);
      break;
    case EYE_STYLES.HEART:
      ctx.rect(0, 0, 28, 28);
      ctx.moveTo(24, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.GEOMETRIC:
      ctx.rect(0, 0, 28, 28);
      ctx.moveTo(4, 10); ctx.lineTo(10, 10); ctx.lineTo(10, 4); ctx.lineTo(18, 4); ctx.lineTo(18, 10);
      ctx.lineTo(24, 10); ctx.lineTo(24, 18); ctx.lineTo(18, 18); ctx.lineTo(18, 24); ctx.lineTo(10, 24);
      ctx.lineTo(10, 18); ctx.lineTo(4, 18); ctx.closePath();
      break;
    case EYE_STYLES.MODERN:
      ctx.rect(0, 0, 28, 28);
      drawRoundedRectPath(ctx, 4, 4, 20, 20, 3);
      break;
    case EYE_STYLES.DIAMOND:
      drawRoundedRectPath(ctx, 0, 0, 28, 28, 2);
      ctx.moveTo(14, 5); ctx.lineTo(23, 14); ctx.lineTo(14, 23); ctx.lineTo(5, 14); ctx.closePath();
      break;
    case EYE_STYLES.LCD:
      drawRoundedRectPath(ctx, 0, 0, 28, 28, 5);
      ctx.rect(4, 4, 20, 20);
      break;
    default: // SQUARE
      ctx.rect(0, 0, 28, 28);
      ctx.rect(4, 4, 20, 20);
      break;
  }
  ctx.restore();
  ctx.fillStyle = outerColor;
  if (style === EYE_STYLES.DOLLAR_COIN) ctx.fillStyle = '#d4af37';
  else if (style === EYE_STYLES.CUTE_EMOTICON) ctx.fillStyle = '#f39c12';
  else if (style === EYE_STYLES.CHERRY_BLOSSOM) ctx.fillStyle = '#c9184a'; // Match container
  else if (style === EYE_STYLES.LOTUS) ctx.fillStyle = '#1e3a8a'; // Match container
  else if (style === EYE_STYLES.SUNFLOWER) ctx.fillStyle = '#4a2500'; // Match container
  else if (style === EYE_STYLES.LAVENDER) ctx.fillStyle = '#6c3483'; // Match container
  else if (style === EYE_STYLES.ROSE) ctx.fillStyle = '#990000'; // Match container
  else if (style === EYE_STYLES.MONSTERA) ctx.fillStyle = '#196f3d'; // Match container
  else if (style === EYE_STYLES.DAISY) ctx.fillStyle = '#d4ac0d'; // Match container
  else if (style === EYE_STYLES.COFFEE_BEAN) ctx.fillStyle = '#b35900'; // Match container
  else if (style === EYE_STYLES.RAINDROP) ctx.fillStyle = '#2471a3'; // Match container
  else if (style === EYE_STYLES.CACTUS) ctx.fillStyle = '#196f3d';
  else if (style === EYE_STYLES.BASKETBALL) ctx.fillStyle = '#b94a00';
  else if (style === EYE_STYLES.CHESS) ctx.fillStyle = '#6c7a89'; // Match container
  else if (style === EYE_STYLES.BOW) ctx.fillStyle = '#d81b60'; // Match container
  else if (style === EYE_STYLES.VIOLET_FLOWER) ctx.fillStyle = '#8e7cc3';
  else if (style === EYE_STYLES.TULIP) ctx.fillStyle = '#ff4d6d';
  else if (style === EYE_STYLES.FORGET_ME_NOT) ctx.fillStyle = '#3a86c8';
  else if (style === EYE_STYLES.PANSY) ctx.fillStyle = '#6c5ce7';
  ctx.fill('evenodd');

  // New icon eye styles: delegate to dedicated draw function and return
  const iconEyeStyles = [
    EYE_STYLES.COFFEE_BEAN, EYE_STYLES.RAINDROP, EYE_STYLES.CACTUS,
    EYE_STYLES.SPACE_STAR, EYE_STYLES.BASKETBALL, EYE_STYLES.CHESS,
    EYE_STYLES.RED_HEART, EYE_STYLES.GOLD_STAR, EYE_STYLES.BOW,
  ];
  if (iconEyeStyles.includes(style)) {
    drawEyeIconPupil(ctx, x, y, size, style);
    return;
  }

  // 2. Draw Inner Dot Path
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  switch (style) {
    case EYE_STYLES.CIRCLE:
    case EYE_STYLES.FLOWER:
    case EYE_STYLES.STAR:
    case EYE_STYLES.HEART:
      ctx.arc(14, 14, 6, 0, Math.PI * 2);
      break;
    case EYE_STYLES.SHIELD: {
      let angle = 0;
      if (eyeType === 'bottom-left') angle = Math.PI;

      if (angle !== 0) {
        ctx.translate(14, 14);
        ctx.rotate(angle);
        ctx.translate(-14, -14);
      }

      ctx.moveTo(8, 9); ctx.lineTo(20, 9); ctx.lineTo(20, 14); ctx.quadraticCurveTo(20, 18, 14, 20); ctx.quadraticCurveTo(8, 18, 8, 14); ctx.closePath();

      if (angle !== 0) {
        ctx.translate(14, 14);
        ctx.rotate(-angle);
        ctx.translate(-14, -14);
      }
      break;
    }
    case EYE_STYLES.OCTAGON:
      ctx.moveTo(12, 8); ctx.lineTo(16, 8); ctx.lineTo(20, 12); ctx.lineTo(20, 16); ctx.lineTo(16, 20); ctx.lineTo(12, 20); ctx.lineTo(8, 16); ctx.lineTo(8, 12); ctx.closePath();
      break;
    case EYE_STYLES.HEXAGON: {
      const hr = 6;
      ctx.moveTo(14 + hr, 14);
      for (let i = 1; i <= 6; i++) {
        const a = i * Math.PI / 3;
        ctx.lineTo(14 + hr * Math.cos(a), 14 + hr * Math.sin(a));
      }
      ctx.closePath();
      break;
    }
    case EYE_STYLES.DIAMOND:
      ctx.moveTo(14, 8); ctx.lineTo(20, 14); ctx.lineTo(14, 20); ctx.lineTo(8, 14); ctx.closePath();
      break;
    case EYE_STYLES.TRIANGLE:
      drawRoundedRectPath(ctx, 8, 8, 12, 12, 5);
      break;
    case EYE_STYLES.GEOMETRIC:
      ctx.rect(12, 8, 4, 12);
      ctx.rect(8, 12, 12, 4);
      break;
    case EYE_STYLES.LCD:
      ctx.rect(8, 8, 12, 12);
      break;
    case EYE_STYLES.MODERN:
      drawRoundedRectPath(ctx, 7, 7, 14, 14, 2);
      break;
    case EYE_STYLES.ROUNDED:
      drawRoundedRectPath(ctx, 8, 8, 12, 12, 4);
      break;
    case EYE_STYLES.LEAF:
      if (eyeType === 'top-right' || eyeType === 'bottom-left') {
        ctx.moveTo(20, 8); ctx.lineTo(12, 8); ctx.quadraticCurveTo(8, 8, 8, 12); ctx.lineTo(8, 20); ctx.lineTo(16, 20); ctx.quadraticCurveTo(20, 20, 20, 16); ctx.closePath();
      } else {
        ctx.moveTo(8, 8); ctx.lineTo(16, 8); ctx.quadraticCurveTo(20, 8, 20, 12); ctx.lineTo(20, 20); ctx.lineTo(12, 20); ctx.quadraticCurveTo(8, 20, 8, 16); ctx.closePath();
      }
      break;
    case EYE_STYLES.TEARDROP: {
      const sharpCorner = (eyeType === 'top-right') ? 'bottom-left' : (eyeType === 'bottom-left' ? 'top-right' : 'bottom-right');
      const pad = 8, r = 3, s = 28;
      if (sharpCorner === 'bottom-left') {
        ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad - r, pad); ctx.quadraticCurveTo(s - pad, pad, s - pad, pad + r); ctx.lineTo(s - pad, s - pad - r); ctx.quadraticCurveTo(s - pad, s - pad, s - pad - r, s - pad); ctx.lineTo(pad, s - pad); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
      } else if (sharpCorner === 'top-right') {
        ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad, pad); ctx.lineTo(s - pad, s - pad - r); ctx.quadraticCurveTo(s - pad, s - pad, s - pad - r, s - pad); ctx.lineTo(pad + r, s - pad); ctx.quadraticCurveTo(pad, s - pad, pad, s - pad - r); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
      } else {
        ctx.moveTo(pad + r, pad); ctx.lineTo(s - pad - r, pad); ctx.quadraticCurveTo(s - pad, pad, s - pad, pad + r); ctx.lineTo(s - pad, s - pad); ctx.lineTo(pad + r, s - pad); ctx.quadraticCurveTo(pad, s - pad, pad, s - pad - r); ctx.lineTo(pad, pad + r); ctx.quadraticCurveTo(pad, pad, pad + r, pad);
      }
      ctx.closePath();
      break;
    }
    case EYE_STYLES.DOLLAR_COIN: {
      ctx.fillStyle = '#ffd700'; // Gold center
      ctx.beginPath(); ctx.arc(14, 14, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#996515';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 14, 14);
      ctx.restore();
      return;
    }
    case EYE_STYLES.CUTE_EMOTICON: {
      ctx.fillStyle = '#f1c40f'; // Yellow base
      ctx.beginPath(); ctx.arc(14, 14, 7, 0, Math.PI * 2); ctx.fill();
      
      // Left winking eye
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.arc(11, 13, 1.5, Math.PI, 0, false); ctx.stroke();
      
      // Right happy winking eye
      ctx.beginPath(); ctx.arc(17, 13, 1.5, Math.PI, 0, false); ctx.stroke();
      
      // Sticking out tongue
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(14, 16, 2, 0, Math.PI, false); ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.CHERRY_BLOSSOM: {
      // 1. Strong dark container
      ctx.fillStyle = '#c9184a'; // Strong crimson cherry pink
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Darker petals so entire pupil reads as solid dark to binarizer
      const cx = 14, cy = 14, r = 4.5;
      const petalR = r * 0.55;
      const petalD = r * 0.45;
      ctx.fillStyle = '#8b0027'; // Dark rose — darker than container
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        ctx.beginPath();
        const a1 = angle - 0.5;
        const a2 = angle + 0.5;
        ctx.moveTo(px, py);
        ctx.arc(px + Math.cos(a1) * petalR * 0.5, py + Math.sin(a1) * petalR * 0.5, petalR * 0.5, angle + Math.PI, angle + Math.PI * 2, false);
        ctx.arc(px + Math.cos(a2) * petalR * 0.5, py + Math.sin(a2) * petalR * 0.5, petalR * 0.5, angle + Math.PI, angle, true);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#a30040'; // Deep magenta center — still dark
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.LOTUS: {
      // 1. Pupil container (strong dark blue, high contrast)
      ctx.fillStyle = '#1e3a8a';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Scaled down Lotus flower (r=4.5)
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#52b788'; // Original green leaf base
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.3, r * 0.7, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a86c8'; // Original blue petals
      const petalAngles = [-0.7, -0.35, 0, 0.35, 0.7];
      for (let i = 0; i < petalAngles.length; i++) {
        const angle = petalAngles[i] - Math.PI / 2;
        const tipX = cx + Math.cos(angle) * r * 0.95;
        const tipY = cy + Math.sin(angle) * r * 0.95;
        const spread = 0.32;
        ctx.beginPath(); ctx.moveTo(cx, cy + r * 0.1);
        ctx.quadraticCurveTo(cx + Math.cos(angle - spread) * r * 0.65, cy + Math.sin(angle - spread) * r * 0.65, tipX, tipY);
        ctx.quadraticCurveTo(cx + Math.cos(angle + spread) * r * 0.65, cy + Math.sin(angle + spread) * r * 0.65, cx, cy + r * 0.1);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      return;
    }
    case EYE_STYLES.VIOLET_FLOWER: {
      ctx.fillStyle = '#8e7cc3'; // Soft violet purple container
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      const cx = 14, cy = 14, r = 4.5;
      const petalR = r * 0.52;
      const petalD = r * 0.42;
      ctx.fillStyle = '#5c4b8b'; // Darker violet
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        ctx.moveTo(cx, cy);
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#ffd966'; // Center yellow
      ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.TULIP: {
      ctx.fillStyle = '#ff4d6d'; // Pinkish-red container
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#4f772d'; // Olive green stem
      ctx.fillRect(cx - r * 0.08, cy, r * 0.16, r);
      ctx.fillStyle = '#c9184a'; // Rich tulip red cup
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.9, cy - r * 0.2, cx - r * 0.3, cy - r * 0.9);
      ctx.quadraticCurveTo(cx, cy - r * 0.5, cx, cy + r * 0.2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.2);
      ctx.quadraticCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.3, cy - r * 0.9);
      ctx.quadraticCurveTo(cx, cy - r * 0.5, cx, cy + r * 0.2);
      ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.FORGET_ME_NOT: {
      ctx.fillStyle = '#3a86c8'; // Sky blue container
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      const cx = 14, cy = 14, r = 4.5;
      const petalR = r * 0.45;
      const petalD = r * 0.48;
      ctx.fillStyle = '#1b4d8a'; // Darker blue petals
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * petalD;
        const py = cy + Math.sin(angle) * petalD;
        ctx.moveTo(cx, cy);
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#ffe066'; // Yellow center
      ctx.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.PANSY: {
      ctx.fillStyle = '#6c5ce7'; // Indigo purple container
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      const cx = 14, cy = 14, r = 4.5;
      // Top two petals (deep violet/blue)
      ctx.fillStyle = '#3f076b';
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.45, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.35, cy - r * 0.35, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Side/bottom petals (Bright Lavender/Yellow)
      ctx.fillStyle = '#a29bfe';
      ctx.beginPath();
      ctx.arc(cx - r * 0.45, cy + r * 0.2, r * 0.42, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.45, cy + r * 0.2, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // Center yellow spot
      ctx.fillStyle = '#fdcb6e';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.SUNFLOWER: {
      // 1. Strong dark container (Dark Brown for contrast with golden petals)
      ctx.fillStyle = '#4a2500';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Darker petals so entire pupil reads as solid dark to binarizer
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#b8860b'; // Dark golden amber — darker than container
      ctx.beginPath();
      const petalCount = 10;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 2 * Math.PI / petalCount) - Math.PI / 2;
        const tipX = cx + Math.cos(angle) * r;
        const tipY = cy + Math.sin(angle) * r;
        const baseL = angle - 0.32;
        const baseR = angle + 0.32;
        const bD = r * 0.35;
        ctx.moveTo(cx + Math.cos(baseL) * bD, cy + Math.sin(baseL) * bD);
        ctx.quadraticCurveTo(tipX, tipY, cx + Math.cos(baseR) * bD, cy + Math.sin(baseR) * bD);
      }
      ctx.fill();
      ctx.fillStyle = '#4a3800'; // Very dark brown center — darkest element
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.LAVENDER: {
      // 1. Pupil container (strong dark purple, high contrast)
      ctx.fillStyle = '#6c3483';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Scaled down Lavender (r=4.5)
      const cx = 14, cy = 14, r = 4.5;
      ctx.strokeStyle = '#556b2f'; // Original green stem
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.lineTo(cx, cy - r * 0.8); ctx.stroke();
      ctx.fillStyle = '#9b59b6'; // Original purple buds
      for (let i = 0; i < 4; i++) {
        const py = cy - r * 0.6 + i * r * 0.45;
        ctx.beginPath(); ctx.ellipse(cx - r * 0.35, py, r * 0.3, r * 0.18, -Math.PI / 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + r * 0.35, py, r * 0.3, r * 0.18, Math.PI / 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy - r * 0.8, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.ROSE: {
      // 1. Pupil container (strong very dark red, high contrast)
      ctx.fillStyle = '#990000'; // Deeper dark red for contrast against petals
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Scaled down Rose (r=4.5)
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#cc0000'; // Original rose red petals (visible against dark container)
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5);
        const px = cx + Math.cos(angle) * r * 0.3;
        const py = cy + Math.sin(angle) * r * 0.3;
        ctx.moveTo(px + r * 0.5, py); ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = '#990000'; // Original dark red center details
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI / 3) + 0.5;
        const px = cx + Math.cos(angle) * r * 0.15;
        const py = cy + Math.sin(angle) * r * 0.15;
        ctx.moveTo(px + r * 0.3, py); ctx.arc(px, py, r * 0.3, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
      return;
    }
    case EYE_STYLES.MONSTERA: {
      // 1. Pupil container (strong dark green, high contrast)
      ctx.fillStyle = '#196f3d';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Scaled down Monstera (r=4.5)
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#27ae60'; // Original green leaf
      ctx.beginPath();
      ctx.moveTo(cx, cy + r);
      ctx.quadraticCurveTo(cx - r * 1.1, cy + r * 0.2, cx - r * 0.8, cy - r * 0.6);
      ctx.quadraticCurveTo(cx, cy - r * 1.1, cx + r * 0.8, cy - r * 0.6);
      ctx.quadraticCurveTo(cx + r * 1.1, cy + r * 0.2, cx, cy + r);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#76d7a0'; // Light green vein cuts (no white)
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.6); ctx.lineTo(cx, cy + r * 0.6);
      ctx.moveTo(cx, cy - r * 0.2); ctx.lineTo(cx - r * 0.6, cy - r * 0.4);
      ctx.moveTo(cx, cy - r * 0.2); ctx.lineTo(cx + r * 0.6, cy - r * 0.4);
      ctx.moveTo(cx, cy + r * 0.2); ctx.lineTo(cx - r * 0.6, cy);
      ctx.moveTo(cx, cy + r * 0.2); ctx.lineTo(cx + r * 0.6, cy);
      ctx.stroke();
      ctx.restore();
      return;
    }
    case EYE_STYLES.DAISY: {
      // 1. Pupil container (strong gold/yellow, high contrast)
      ctx.fillStyle = '#d4ac0d';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);

      // 2. Draw original flower centered and perfectly fitted inside (r=4.5)
      const cx = 14, cy = 14, r = 4.5;
      ctx.fillStyle = '#ffe066'; // Warm yellow petals (no white)
      ctx.strokeStyle = '#d4ac0d'; // Matching golden outline
      ctx.lineWidth = 0.15;
      const petalCount = 8;
      const petalLen = r * 0.9;
      const petalW = r * 0.26;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 2 * Math.PI / petalCount);
        const tipX = cx + Math.cos(angle) * petalLen;
        const tipY = cy + Math.sin(angle) * petalLen;
        const perpAngle = angle + Math.PI / 2;
        const bl = { x: cx + Math.cos(perpAngle) * petalW, y: cy + Math.sin(perpAngle) * petalW };
        const br = { x: cx - Math.cos(perpAngle) * petalW, y: cy - Math.sin(perpAngle) * petalW };
        ctx.beginPath(); ctx.moveTo(bl.x, bl.y);
        ctx.quadraticCurveTo(tipX + Math.cos(perpAngle) * petalW * 0.3, tipY + Math.sin(perpAngle) * petalW * 0.3, tipX, tipY);
        ctx.quadraticCurveTo(tipX - Math.cos(perpAngle) * petalW * 0.3, tipY - Math.sin(perpAngle) * petalW * 0.3, br.x, br.y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#f1c232'; // Original yellow center
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    default: // SQUARE
      ctx.rect(8, 8, 12, 12);
      break;
  }
  ctx.restore();
  ctx.fillStyle = innerColor;
  ctx.fill();

  // ── NEW ICON EYE STYLES ──────────────────────────────────────────────────
  // (handled below as draw-after-restore since they use multi-color icons)
}

function drawEyeIconPupil(ctx, x, y, size, style) {
  const s = size / 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  switch(style) {
    case EYE_STYLES.COFFEE_BEAN: {
      // Warm medium brown container (contrasts with dark bean)
      ctx.fillStyle = '#b35900';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      // Bean body (dark brown)
      ctx.fillStyle = '#3b1a06';
      ctx.beginPath(); ctx.ellipse(14, 14, 3.8, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      // Bean crease
      ctx.strokeStyle = '#1a0a00'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, 9); ctx.lineTo(14, 19); ctx.stroke();
      break;
    }
    case EYE_STYLES.RAINDROP: {
      // Strong blue container
      ctx.fillStyle = '#2471a3';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      // Raindrop shape (dark blue)
      ctx.fillStyle = '#0d2b3e';
      ctx.beginPath();
      ctx.arc(14, 15.5, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(11, 15.5);
      ctx.quadraticCurveTo(10.5, 12.5, 14, 9.2);
      ctx.quadraticCurveTo(17.5, 12.5, 17, 15.5);
      ctx.closePath(); ctx.fill();
      break;
    }
    case EYE_STYLES.CACTUS: {
      // Mini cactus (green - matches ring color)
      ctx.fillStyle = '#196f3d';
      // Trunk
      ctx.beginPath(); ctx.roundRect(12, 9, 4, 11, 1); ctx.fill();
      // Left arm
      ctx.beginPath(); ctx.roundRect(8, 13, 5, 2, 1); ctx.fill();
      ctx.beginPath(); ctx.roundRect(8, 11, 2, 3, 1); ctx.fill();
      // Right arm
      ctx.beginPath(); ctx.roundRect(15, 14.5, 5, 2, 1); ctx.fill();
      ctx.beginPath(); ctx.roundRect(18, 12.5, 2, 3, 1); ctx.fill();
      break;
    }
    case EYE_STYLES.BASKETBALL: {
      // Ball circle (dark orange)
      ctx.fillStyle = '#5c2600';
      ctx.beginPath(); ctx.arc(14, 14, 6.5, 0, Math.PI * 2); ctx.fill();
      // Seam lines
      ctx.strokeStyle = '#2a1200'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(7.5, 14); ctx.lineTo(20.5, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 7.5); ctx.lineTo(14, 20.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(11, 14, 5.5, -0.7, 0.7); ctx.stroke();
      ctx.beginPath(); ctx.arc(17, 14, 5.5, Math.PI - 0.7, Math.PI + 0.7); ctx.stroke();
      break;
    }
    case EYE_STYLES.CHESS: {
      // Slate grey container
      ctx.fillStyle = '#6c7a89';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      // Chess pawn silhouette (dark)
      ctx.fillStyle = '#0a0a0a';
      // Pawn head
      ctx.beginPath(); ctx.arc(14, 11.5, 2.2, 0, Math.PI * 2); ctx.fill();
      // Pawn neck
      ctx.beginPath(); ctx.roundRect(12.5, 13.7, 3, 2.3, 0.4); ctx.fill();
      // Pawn base
      ctx.beginPath(); ctx.roundRect(10.5, 16.5, 7, 2.5, 0.8); ctx.fill();
      break;
    }
    case EYE_STYLES.BOW: {
      // Vibrant pink container
      ctx.fillStyle = '#d81b60';
      drawRoundedRect(ctx, 8, 8, 12, 12, 3.5);
      // Bow wings (dark pink)
      ctx.fillStyle = '#6b0d35';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.bezierCurveTo(12, 11, 8.5, 10.5, 8.5, 14);
      ctx.bezierCurveTo(8.5, 17.5, 12, 17, 14, 14);
      ctx.closePath(); ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.bezierCurveTo(16, 11, 19.5, 10.5, 19.5, 14);
      ctx.bezierCurveTo(19.5, 17.5, 16, 17, 14, 14);
      ctx.closePath(); ctx.fill();
      // Center knot
      ctx.beginPath(); ctx.arc(14, 14, 1.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }

  ctx.restore();
}

/**
 * Draw a filled rounded rectangle
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw logo with transparency, background, and outline
 */
function drawLogo(ctx, logoImg, canvasSize, options) {
  let imgElement = logoImg;
  if (logoImg && typeof logoImg === 'object' && !(logoImg instanceof HTMLImageElement) && !(logoImg instanceof HTMLCanvasElement)) {
    if (logoImg.image) {
      imgElement = logoImg.image;
    } else {
      return;
    }
  }
  if (!imgElement) return;

  const {
    logoWidth,
    logoHeight,
    logoPadding,
    logoBackground,
    logoBgColor,
    logoBgShape,
    logoOutline,
    logoOutlineColor,
    logoOutlineWidth,
    logoOutlineOpacity = 1,
    logoOpacity = 1,
    logoRotation = 0,
    logoShadowEnabled = false,
    logoShadowColor = 'rgba(0,0,0,0.5)',
    logoShadowBlur = 10,
    logoShadowOffsetX = 0,
    logoShadowOffsetY = 4,
    logoInnerShadowEnabled = false,
    logoEraseColorEnabled = false,
    logoEraseColor = '#ffffff',
    logoEraseTolerance = 50,
    logoEraseSmoothing = 10,
    logoTexture = 'none',
    logoCrop = 'none',
    logoPosX = 0.5,
    logoPosY = 0.5,
    contentX = 0,
    contentY = 0,
    contentSize = canvasSize,
    moduleCount = 21,
    quietZone = 2,
    showHandle = false
  } = options;

  const logoW = Math.max(1, contentSize * (logoWidth || 0.18));
  const logoH = Math.max(1, contentSize * (logoHeight || 0.18));
  const rawX = contentX + (contentSize - logoW) * logoPosX;
  const rawY = contentY + (contentSize - logoH) * logoPosY;
  
  // Apply Safety Zone Constraints (Avoid Eyes)
  const safePos = constrainToSafeZone(rawX, rawY, logoW, logoH, contentX, contentY, contentSize, moduleCount, quietZone);
  const logoX = safePos.x;
  const logoY = safePos.y;

  const paddedW = logoW + logoPadding * 2;
  const paddedH = logoH + logoPadding * 2;
  const paddedX = logoX - logoPadding;
  const paddedY = logoY - logoPadding;

  const centerX = logoX + logoW / 2;
  const centerY = logoY + logoH / 2;

  ctx.save();
  ctx.globalAlpha = logoOpacity;

  try {
    // 1. Setup Rotation at Center of Logo
    ctx.translate(centerX, centerY);
    ctx.rotate((logoRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // 2. Apply Shadow (if enabled)
    if (logoShadowEnabled) {
      ctx.shadowColor = logoShadowColor;
      ctx.shadowBlur = logoShadowBlur;
      ctx.shadowOffsetX = logoShadowOffsetX;
      ctx.shadowOffsetY = logoShadowOffsetY;
    }

    // 3. Draw Background
    if (logoBackground) {
      drawBackgroundShape(ctx, logoBgShape, paddedX, paddedY, paddedW, paddedH, logoBgColor, contentSize * 0.005);
    }

    // 4. Draw Outline
    if (logoOutline && logoOutlineWidth > 0) {
      ctx.globalAlpha = logoOpacity * logoOutlineOpacity;
      drawSmartOutline(ctx, imgElement, canvasSize, logoW, logoH, logoX, logoY, {
        outlineColor: logoOutlineColor,
        outlineWidth: logoOutlineWidth,
        logoBgShape,
        logoPadding,
        hasBackground: logoBackground
      });
      ctx.globalAlpha = logoOpacity;
    }

    // 5. Final Processing of Logo Image (Opacity, Erase Color, Texture)
    
    // Process image if color erase, texture, or CROP is needed
    if (logoEraseColorEnabled || logoTexture !== 'none' || logoCrop !== 'none') {
      const procCanvas = document.createElement('canvas');
      procCanvas.width = Math.max(1, logoW);
      procCanvas.height = Math.max(1, logoH);
      const pctx = procCanvas.getContext('2d');
      
      // Apply Crop Mask BEFORE drawing the image if it's a mask
      if (logoCrop && logoCrop !== 'none') {
        pctx.beginPath();
        const minDim = Math.min(logoW, logoH);
        const halfW = logoW / 2;
        const halfH = logoH / 2;
        const radius = minDim / 2;

        if (logoCrop === 'circle') {
          pctx.arc(halfW, halfH, radius, 0, Math.PI * 2);
        } else if (logoCrop === 'rounded') {
          const r = minDim * 0.22;
          pctx.roundRect ? pctx.roundRect(0, 0, logoW, logoH, r) : pctx.rect(0, 0, logoW, logoH);
        } else if (logoCrop === 'hexagon') {
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = halfW + radius * Math.cos(angle);
            const y = halfH + radius * Math.sin(angle);
            if (i === 0) pctx.moveTo(x, y);
            else pctx.lineTo(x, y);
          }
          pctx.closePath();
        } else if (logoCrop === 'octagon') {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i - Math.PI / 8;
            const x = halfW + radius * Math.cos(angle);
            const y = halfH + radius * Math.sin(angle);
            if (i === 0) pctx.moveTo(x, y);
            else pctx.lineTo(x, y);
          }
          pctx.closePath();
        } else if (logoCrop === 'triangle') {
          pctx.moveTo(halfW, 0);
          pctx.lineTo(logoW, logoH);
          pctx.lineTo(0, logoH);
          pctx.closePath();
        } else if (logoCrop === 'diamond') {
          pctx.moveTo(halfW, 0);
          pctx.lineTo(logoW, halfH);
          pctx.lineTo(halfW, logoH);
          pctx.lineTo(0, halfH);
          pctx.closePath();
        } else if (logoCrop === 'heart') {
          const topCurve = logoH * 0.3;
          pctx.moveTo(halfW, logoH * 0.25);
          pctx.bezierCurveTo(halfW, logoH * 0.05, 0, logoH * 0.05, 0, topCurve);
          pctx.bezierCurveTo(0, logoH * 0.55, halfW * 0.6, logoH * 0.75, halfW, logoH * 0.95);
          pctx.bezierCurveTo(logoW - halfW * 0.6, logoH * 0.75, logoW, logoH * 0.55, logoW, topCurve);
          pctx.bezierCurveTo(logoW, logoH * 0.05, halfW, logoH * 0.05, halfW, logoH * 0.25);
          pctx.closePath();
        } else if (logoCrop === 'star') {
          const outerR = radius;
          const innerR = outerR * 0.42;
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            const x = halfW + r * Math.cos(angle);
            const y = halfH + r * Math.sin(angle);
            if (i === 0) pctx.moveTo(x, y);
            else pctx.lineTo(x, y);
          }
          pctx.closePath();
        } else if (logoCrop === 'shield') {
          pctx.moveTo(0, 0);
          pctx.lineTo(logoW, 0);
          pctx.lineTo(logoW, logoH * 0.55);
          pctx.bezierCurveTo(logoW, logoH * 0.82, halfW, logoH * 0.95, halfW, logoH);
          pctx.bezierCurveTo(halfW, logoH * 0.95, 0, logoH * 0.82, 0, logoH * 0.55);
          pctx.closePath();
        } else {
          pctx.rect(0, 0, logoW, logoH);
        }
        pctx.clip();
      }

      pctx.drawImage(imgElement, 0, 0, logoW, logoH);

      // Erase Color Filter (Remove Background)
      if (logoEraseColorEnabled && logoEraseColor) {
        const imgData = pctx.getImageData(0, 0, Math.max(1, logoW), Math.max(1, logoH));
        const data = imgData.data;
        const target = hexToRgb(logoEraseColor);
        const tolerance = logoEraseTolerance !== undefined ? logoEraseTolerance : 50;
        const smoothing = logoEraseSmoothing !== undefined ? logoEraseSmoothing : 10;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          // Euclidean distance in RGB color space
          const dist = Math.sqrt((r - target.r) ** 2 + (g - target.g) ** 2 + (b - target.b) ** 2);
          
          if (dist < tolerance) {
            data[i+3] = 0; // Fully transparent
          } else if (dist < tolerance + smoothing && smoothing > 0) {
            // Smooth edge feathering
            const factor = (dist - tolerance) / smoothing;
            data[i+3] = Math.round(data[i+3] * factor);
          }
        }
        pctx.putImageData(imgData, 0, 0);
      }

      // Apply Texture Overlay
      if (logoTexture !== 'none') {
        pctx.globalCompositeOperation = 'source-atop';
        pctx.fillStyle = getTexturePattern(logoTexture, pctx, logoW, logoH);
        pctx.globalAlpha = 0.4;
        pctx.fillRect(0, 0, logoW, logoH);
        pctx.globalAlpha = 1;
      }

      ctx.drawImage(procCanvas, logoX, logoY, logoW, logoH);
    } else {
      ctx.drawImage(imgElement, logoX, logoY, logoW, logoH);
    }

    // 6. Draw Inner Shadow (on top of the logo)
    if (logoInnerShadowEnabled) {
      const isCanvas = document.createElement('canvas');
      isCanvas.width = Math.max(1, logoW);
      isCanvas.height = Math.max(1, logoH);
      const isCtx = isCanvas.getContext('2d');
      
      isCtx.drawImage(imgElement, 0, 0, logoW, logoH);
      isCtx.globalCompositeOperation = 'source-out';
      isCtx.shadowColor = logoShadowColor; 
      isCtx.shadowBlur = 10;
      isCtx.shadowOffsetX = 2;
      isCtx.shadowOffsetY = 2;
      isCtx.fillRect(0, 0, logoW, logoH);
      
      isCtx.globalCompositeOperation = 'destination-in';
      isCtx.drawImage(imgElement, 0, 0, logoW, logoH);
      
      ctx.drawImage(isCanvas, logoX, logoY, logoW, logoH);
    }
  } catch (err) {
    console.error("Logo Render Error:", err);
    // Fallback: Just draw the basic logo
    ctx.drawImage(imgElement, logoX, logoY, logoW, logoH);
  }

  ctx.restore();

  // Draw Resize Handles if requested
  if (options.showHandle && options.selectedType === 'logo') {
    // Draw Center Alignment Guide Lines
    ctx.save();
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    
    if (logoPosX === 0.5) {
      ctx.beginPath();
      ctx.moveTo(contentX + contentSize / 2, contentY);
      ctx.lineTo(contentX + contentSize / 2, contentY + contentSize);
      ctx.stroke();
    }
    if (logoPosY === 0.5) {
      ctx.beginPath();
      ctx.moveTo(contentX, contentY + contentSize / 2);
      ctx.lineTo(contentX + contentSize, contentY + contentSize / 2);
      ctx.stroke();
    }
    ctx.restore();

    drawTransformationBox(ctx, logoX, logoY, logoW, logoH, centerX, centerY, logoRotation, canvasSize, 'logo');
  }
}

/**
 * Shared, DPI-scaled professional selection frame with resize, rotate, and delete controls
 */
function drawTransformationBox(ctx, boxX, boxY, boxW, boxH, centerX, centerY, rotation, canvasSize, type) {
  const sf = Math.max(1, canvasSize / 512);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(((rotation || 0) * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  // 1. Bounding Box Outline
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2.5 * sf;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // 2. Corner Top-Left (Anchor Square)
  const sqSize = 9 * sf;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2 * sf;
  ctx.fillRect(boxX - sqSize / 2, boxY - sqSize / 2, sqSize, sqSize);
  ctx.strokeRect(boxX - sqSize / 2, boxY - sqSize / 2, sqSize, sqSize);

  // 3. Top-Center Rotate Stalk & Handle
  const rotStalkY = boxY - 26 * sf;
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 1.8 * sf;
  ctx.setLineDash([3 * sf, 3 * sf]);
  ctx.beginPath();
  ctx.moveTo(centerX, boxY);
  ctx.lineTo(centerX, rotStalkY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top-Center Rotate Circle with Curved Arrow
  const rotRadius = 11 * sf;
  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.arc(centerX, rotStalkY, rotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6 * sf;
  ctx.beginPath();
  ctx.arc(centerX, rotStalkY, 5.5 * sf, 0.4 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  // Arrowhead on top rotate circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(centerX + 5.5 * sf, rotStalkY);
  ctx.lineTo(centerX + 2.5 * sf, rotStalkY - 3.5 * sf);
  ctx.lineTo(centerX + 8.5 * sf, rotStalkY - 3.5 * sf);
  ctx.closePath();
  ctx.fill();

  // 4. Bottom-Left Rotate Bracket (Alternative Grab Handle)
  const brX = boxX - 20 * sf;
  const brY = boxY + boxH + 20 * sf;
  ctx.save();
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 3.5 * sf;
  ctx.beginPath();
  ctx.arc(brX, brY, 14 * sf, 0.5 * Math.PI, Math.PI);
  ctx.stroke();
  const drawBracketArrow = (ax, ay, rotAngle) => {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rotAngle);
    ctx.fillStyle = '#007AFF';
    ctx.beginPath();
    ctx.moveTo(-3 * sf, -3 * sf);
    ctx.lineTo(4 * sf, 0);
    ctx.lineTo(-3 * sf, 3 * sf);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawBracketArrow(brX + 14 * sf * Math.cos(0.5 * Math.PI), brY + 14 * sf * Math.sin(0.5 * Math.PI), Math.PI);
  drawBracketArrow(brX + 14 * sf * Math.cos(Math.PI), brY + 14 * sf * Math.sin(Math.PI), Math.PI / 2);
  ctx.restore();

  // 5. Side Stretch Handles (Right & Bottom)
  const stretchSize = 8 * sf;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2 * sf;
  // Right Stretch
  ctx.fillRect(boxX + boxW - stretchSize / 2, boxY + boxH / 2 - stretchSize / 2, stretchSize, stretchSize);
  ctx.strokeRect(boxX + boxW - stretchSize / 2, boxY + boxH / 2 - stretchSize / 2, stretchSize, stretchSize);
  // Bottom Stretch
  ctx.fillRect(boxX + boxW / 2 - stretchSize / 2, boxY + boxH - stretchSize / 2, stretchSize, stretchSize);
  ctx.strokeRect(boxX + boxW / 2 - stretchSize / 2, boxY + boxH - stretchSize / 2, stretchSize, stretchSize);

  // 6. Bottom-Right Proportional Resize Handle (Circle)
  const resizeR = 12 * sf;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2.5 * sf;
  ctx.beginPath();
  ctx.arc(boxX + boxW, boxY + boxH, resizeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Inner resize dot
  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.arc(boxX + boxW, boxY + boxH, 4 * sf, 0, Math.PI * 2);
  ctx.fill();

  // 7. Top-Right Delete Action Button (Red circle with clean white ✕)
  const delR = 13 * sf;
  ctx.fillStyle = '#EF4444';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * sf;
  ctx.beginPath();
  ctx.arc(boxX + boxW, boxY, delR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White ✕ stroke
  const xSize = 4.5 * sf;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2 * sf;
  ctx.beginPath();
  ctx.moveTo(boxX + boxW - xSize, boxY - xSize);
  ctx.lineTo(boxX + boxW + xSize, boxY + xSize);
  ctx.moveTo(boxX + boxW + xSize, boxY - xSize);
  ctx.lineTo(boxX + boxW - xSize, boxY + xSize);
  ctx.stroke();

  ctx.restore();
}

/**
 * Smart outline that follows logo shape using fast circular stamping (Stroke effect)
 */
function drawSmartOutline(ctx, logoImg, canvasSize, logoW, logoH, logoX, logoY, options) {
  const { outlineColor, outlineWidth, logoBgShape, logoPadding, hasBackground } = options;
  const strokeVal = parseColorOrGradient(ctx, logoX - logoPadding, logoY - logoPadding, logoW + logoPadding * 2, logoH + logoPadding * 2, outlineColor);

  if (hasBackground) {
    // If there's a background, we outline the background shape instead of the logo pixels
    const paddedW = logoW + logoPadding * 2;
    const paddedH = logoH + logoPadding * 2;
    const paddedX = logoX - logoPadding;
    const paddedY = logoY - logoPadding;

    ctx.strokeStyle = strokeVal;
    ctx.lineWidth = outlineWidth * 2; // Double because stroke is centered
    ctx.lineJoin = 'round';
    
    if (logoBgShape === 'circle') {
      ctx.beginPath();
      ctx.arc(paddedX + paddedW / 2, paddedY + paddedH / 2, Math.min(paddedW, paddedH) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (logoBgShape === 'rounded') {
      const r = Math.min(paddedW, paddedH) * 0.2;
      ctx.beginPath();
      drawRoundedRectPath(ctx, paddedX, paddedY, paddedW, paddedH, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(paddedX, paddedY, paddedW, paddedH);
    }
    return;
  }

  // Step 1: Create a solid color silhouette of the logo
  const silhouetteCanvas = document.createElement('canvas');
  const silCtx = silhouetteCanvas.getContext('2d');
  silhouetteCanvas.width = logoW;
  silhouetteCanvas.height = logoH;

  silCtx.drawImage(logoImg, 0, 0, logoW, logoH);
  silCtx.globalCompositeOperation = 'source-in';
  silCtx.fillStyle = strokeVal;
  silCtx.fillRect(0, 0, logoW, logoH);

  const steps = Math.max(16, Math.ceil(outlineWidth * Math.PI)); 
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const dx = Math.cos(angle) * outlineWidth;
    const dy = Math.sin(angle) * outlineWidth;
    ctx.drawImage(silhouetteCanvas, logoX + dx, logoY + dy, logoW, logoH);
  }
}

/**
 * Draw text in the center of the QR code
 */
function drawCenterText(ctx, text, canvasSize, options) {
  const {
    textCenterSize,
    textCenterFont,
    textCenterColor,
    textCenterStrokeEnabled = false,
    textCenterStrokeWidth = 2,
    textCenterStrokeColor = '#ffffff',
    textCenterShadowEnabled = false,
    textCenterShadowColor = 'rgba(0,0,0,0.5)',
    textCenterPosX = 0.5,
    textCenterPosY = 0.5,
    textCenterRotation = 0,
    textCenterWidth = null,
    textCenterHeight = null,
    logoPadding,
    logoBackground,
    logoBgColor,
    logoBgShape,
    contentX = 0,
    contentY = 0,
    contentSize = canvasSize,
    moduleCount = 21,
    quietZone = 2
  } = options;

  const fontSize = contentSize * textCenterSize;
  ctx.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 0.8; 

  const paddedW = textCenterWidth ? (textCenterWidth * contentSize) : (textWidth + (logoPadding || 10) * 2);
  const paddedH = textCenterHeight ? (textCenterHeight * contentSize) : (textHeight + (logoPadding || 10) * 2);

  const rawX = contentX + (contentSize - paddedW) * textCenterPosX;
  const rawY = contentY + (contentSize - paddedH) * textCenterPosY;

  // Apply Safety Zone Constraints (Avoid Eyes)
  const safePos = constrainToSafeZone(rawX, rawY, paddedW, paddedH, contentX, contentY, contentSize, moduleCount, quietZone);
  const logoX = safePos.x;
  const logoY = safePos.y;

  const centerX = logoX + paddedW / 2;
  const centerY = logoY + paddedH / 2;

  const paddedX = logoX;
  const paddedY = logoY;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((textCenterRotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  // 1. Clear area if background is enabled
  if (logoBackground) {
    drawBackgroundShape(ctx, logoBgShape, paddedX, paddedY, paddedW, paddedH, logoBgColor, contentSize * 0.005);
  }

  // 2. Setup Text Properties
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;

  // 4. Draw Stroke (behind fill, no shadow)
  if (textCenterStrokeEnabled) {
    ctx.strokeStyle = parseColorOrGradient(ctx, logoX, logoY, paddedW, paddedH, textCenterStrokeColor || '#ffffff');
    ctx.lineWidth = fontSize * (textCenterStrokeWidth / 100);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, centerX, centerY + fontSize * 0.045);
  }

  // 5. Apply Shadow (to fill only)
  if (textCenterShadowEnabled) {
    ctx.shadowColor = textCenterShadowColor;
    ctx.shadowBlur = textCenterShadowBlur;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }

  // 6. Draw Fill (on top of stroke)
  ctx.fillStyle = parseColorOrGradient(ctx, logoX, logoY, paddedW, paddedH, textCenterColor || '#000000');
  ctx.fillText(text, centerX, centerY + fontSize * 0.045);
  ctx.restore();
  ctx.restore();

  // Draw Transformation Frame (5-point system) if requested
  if (options.showHandle && options.selectedType === 'text') {
    // Draw Center Alignment Guide Lines
    ctx.save();
    ctx.strokeStyle = '#007AFF'; // Premium blue alignment guidelines
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    
    if (textCenterPosX === 0.5) {
        ctx.beginPath();
        ctx.moveTo(contentX + contentSize / 2, contentY);
        ctx.lineTo(contentX + contentSize / 2, contentY + contentSize);
        ctx.stroke();
    }
    if (textCenterPosY === 0.5) {
        ctx.beginPath();
        ctx.moveTo(contentX, contentY + contentSize / 2);
        ctx.lineTo(contentX + contentSize, contentY + contentSize / 2);
        ctx.stroke();
    }
    ctx.restore();
    drawTransformationBox(ctx, logoX, logoY, paddedW, paddedH, centerX, centerY, textCenterRotation, canvasSize, 'text');
  }
}

/**
 * Draw custom free-floating text layers with individual styling, transformation frame, and handles
 */
function drawCustomTexts(ctx, customTexts, canvasSize, options) {
  const {
    contentX = 0,
    contentY = 0,
    contentSize = canvasSize,
    showHandle = false,
    selectedType = null
  } = options;

  customTexts.forEach((item) => {
    if (!item || !item.text) return;
    const {
      id,
      text,
      posX = 0.5,
      posY = 0.5,
      size = 0.08,
      font = 'Outfit',
      color = '#000000',
      rotation = 0,
      strokeEnabled = false,
      strokeWidth = 5,
      strokeColor = '#ffffff',
      shadowEnabled = false,
      shadowBlur = 10,
      shadowColor = 'rgba(0,0,0,0.5)',
      width = null,
      height = null,
      padding = 10
    } = item;

    const fontSize = contentSize * (size || 0.08);
    ctx.save();
    ctx.font = `bold ${fontSize}px '${font || 'Outfit'}', sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 0.8;

    const paddedW = width ? (width * contentSize) : (textWidth + padding * 2);
    const paddedH = height ? (height * contentSize) : (textHeight + padding * 2);

    const rawX = contentX + (contentSize - paddedW) * posX;
    const rawY = contentY + (contentSize - paddedH) * posY;

    const textX = rawX;
    const textY = rawY;
    const centerX = textX + paddedW / 2;
    const centerY = textY + paddedH / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(((rotation || 0) * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Setup Text Properties
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Stroke (behind fill)
    if (strokeEnabled) {
      ctx.save();
      ctx.strokeStyle = parseColorOrGradient(ctx, textX, textY, paddedW, paddedH, strokeColor || '#ffffff');
      ctx.lineWidth = fontSize * ((strokeWidth || 5) / 100);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, centerX, centerY + fontSize * 0.045);
      ctx.restore();
    }

    // 2. Shadow & Fill
    ctx.save();
    if (shadowEnabled) {
      ctx.shadowColor = shadowColor || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadowBlur || 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    ctx.fillStyle = parseColorOrGradient(ctx, textX, textY, paddedW, paddedH, color || '#000000');
    ctx.fillText(text, centerX, centerY + fontSize * 0.045);
    ctx.restore();
    ctx.restore();

    // Draw Transformation Frame if selected
    if (showHandle && selectedType === 'custom-text-' + id) {
      ctx.save();
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      if (Math.abs(posX - 0.5) < 0.01) {
        ctx.beginPath();
        ctx.moveTo(contentX + contentSize / 2, contentY);
        ctx.lineTo(contentX + contentSize / 2, contentY + contentSize);
        ctx.stroke();
      }
      if (Math.abs(posY - 0.5) < 0.01) {
        ctx.beginPath();
        ctx.moveTo(contentX, contentY + contentSize / 2);
        ctx.lineTo(contentX + contentSize, contentY + contentSize / 2);
        ctx.stroke();
      }
      ctx.restore();

      drawTransformationBox(ctx, textX, textY, paddedW, paddedH, centerX, centerY, rotation, canvasSize, 'custom-text');
    }
  });
}

/**
 * Draw decorative frame around the QR code
 */
function drawFrame(ctx, size, padding, options) {
  const {
    frameStyle,
    frameText,
    frameColor,
    frameFont,
    frameSize,
    frameStrokeEnabled,
    frameStrokeWidth,
    frameStrokeColor,
    frameShadowEnabled,
    frameShadowBlur,
    frameShadowColor,
    showHandle = false,
    selectedType = null,
    frameRotation = 0,
    framePosition = 'bottom',
    bgColor,
    bgTransparent
  } = options;

  const innerSize = size - padding * 2;
  
  ctx.save();
  ctx.fillStyle = frameColor;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = size * 0.025; // Slightly thicker for premium feel
  
  const labelHeight = size * 0.14;
  let labelY, textY;
  if (framePosition === 'top') {
    labelY = padding;
    textY = padding + labelHeight / 2;
  } else {
    labelY = size - padding - labelHeight;
    textY = size - padding - labelHeight / 2;
  }
  const labelW = innerSize - size * 0.1;
  const labelX = padding + size * 0.05;

  if (frameStyle !== 'text' && frameStyle !== 'text-bottom' && frameStyle !== 'text-top') {
    drawBackgroundShape(ctx, frameStyle, labelX, labelY, labelW, labelHeight, frameColor, size * 0.005);
  }

  // Text
  const textFillVal = frameStyle === 'text' || frameStyle === 'text-bottom' || frameStyle === 'text-top' ? frameColor : (bgTransparent ? '#ffffff' : bgColor);
  ctx.fillStyle = parseColorOrGradient(ctx, labelX, textY - 20, labelW, 40, textFillVal);
  ctx.font = `bold ${size * frameSize}px ${frameFont}, Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (frameShadowEnabled) { 
    ctx.shadowColor = frameShadowColor; 
    ctx.shadowBlur = frameShadowBlur; 
    ctx.shadowOffsetX = 2; 
    ctx.shadowOffsetY = 2; 
  }
  
  // Apply rotation
  ctx.save();
  ctx.translate(size / 2, textY);
  ctx.rotate(((frameRotation || 0) * Math.PI) / 180);
  ctx.translate(-size / 2, -textY);

  if (frameStrokeEnabled) { 
    ctx.strokeStyle = parseColorOrGradient(ctx, labelX, textY - 20, labelW, 40, frameStrokeColor); 
    ctx.lineWidth = frameStrokeWidth; 
    ctx.strokeText(frameText, size / 2, textY + (size * frameSize) * 0.045); 
  }
  
  ctx.fillText(frameText, size / 2, textY + (size * frameSize) * 0.045);
  ctx.restore();

  ctx.shadowColor = 'transparent'; 
  ctx.shadowBlur = 0; 
  ctx.shadowOffsetX = 0; 
  ctx.shadowOffsetY = 0;

  // Draw Transformation Frame (5-point system) if requested
  if (showHandle && selectedType === 'frame-text') {
    ctx.save();
    
    // Draw Center Alignment Guide Lines (horizontal/vertical)
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    
    ctx.beginPath();
    ctx.moveTo(size / 2, padding);
    ctx.lineTo(size / 2, size - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, textY);
    ctx.lineTo(size - padding, textY);
    ctx.stroke();
    ctx.restore();

    const tw = ctx.measureText(frameText).width + size * 0.04;
    const th = (size * frameSize) * 1.2;
    const tx = size / 2 - tw / 2;
    const ty = textY - th / 2;

    ctx.save();
    ctx.translate(size / 2, textY);
    ctx.rotate(((frameRotation || 0) * Math.PI) / 180);
    ctx.translate(-size / 2, -textY);

    ctx.strokeStyle = '#007AFF'; 
    ctx.lineWidth = size * 0.008; 
    ctx.strokeRect(tx, ty, tw, th);
    
    const hSize = size * 0.02;
    const drawH = (hx, hy, isCircle = false, color = '#ffffff', stroke = '#007AFF') => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = size * 0.005;
        if (isCircle) {
            ctx.arc(hx, hy, hSize/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(hx - hSize/2, hy - hSize/2, hSize, hSize);
            ctx.strokeRect(hx - hSize/2, hy - hSize/2, hSize, hSize);
        }
    };

    // Rotate handle at bottom-left
    drawH(tx - 20 * (size / 512), ty + th + 20 * (size / 512), true, '#007AFF', '#ffffff');
    // Resize bottom-right
    drawH(tx + tw, ty + th, false);
    // Delete top-right
    drawH(tx + tw, ty, false, '#FF3B30', '#ffffff');
    
    ctx.restore();
  }
  
  ctx.restore();
}

function parseColorOrGradient(ctx, x, y, w, h, colorString) {
  if (!colorString || typeof colorString !== 'string') return colorString;
  
  if (colorString.startsWith('linear-gradient(')) {
    const match = colorString.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/i);
    if (match) {
      const color1 = match[2].trim();
      const color2 = match[3].trim();
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      return grad;
    }
  } else if (colorString.startsWith('radial-gradient(')) {
    const match = colorString.match(/radial-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/i);
    if (match) {
      const color1 = match[2].trim();
      const color2 = match[3].trim();
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.max(w, h) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      return grad;
    }
  }
  return colorString;
}

/**
 * Unified helper to draw background shapes for text or logo
 */
function drawBackgroundShape(ctx, shape, x, y, w, h, color, sizeMultiplier = 1) {
  ctx.save();
  ctx.beginPath();
  const fill = parseColorOrGradient(ctx, x, y, w, h, color);
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  
  switch (shape) {
    case 'solid':
    case 'rect':
      ctx.fillRect(x, y, w, h);
      break;
    case 'rounded':
      drawRoundedRectPath(ctx, x, y, w, h, h * 0.2);
      ctx.fill();
      break;
    case 'pill':
      drawRoundedRectPath(ctx, x, y, w, h, h / 2);
      ctx.fill();
      break;
    case 'circle':
      const radius = Math.max(w, h) / 2;
      ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'outline':
      drawRoundedRectPath(ctx, x, y, w, h, h * 0.2);
      ctx.lineWidth = sizeMultiplier * 2;
      ctx.stroke();
      break;
    case 'underline':
      ctx.lineWidth = sizeMultiplier * 4;
      ctx.moveTo(x + w * 0.1, y + h * 0.85);
      ctx.lineTo(x + w * 0.9, y + h * 0.85);
      ctx.stroke();
      break;
    case 'ribbon':
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - h * 0.4, y + h / 2);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + h * 0.4, y + h / 2);
      ctx.fill();
      break;
    case 'glow':
      ctx.shadowColor = color;
      ctx.shadowBlur = sizeMultiplier * 10;
      drawRoundedRectPath(ctx, x + sizeMultiplier * 4, y + sizeMultiplier * 4, w - sizeMultiplier * 8, h - sizeMultiplier * 8, h * 0.2);
      ctx.fill();
      break;
    case 'brackets':
      ctx.lineWidth = sizeMultiplier * 3;
      ctx.moveTo(x + w * 0.1, y + h * 0.15);
      ctx.lineTo(x, y + h * 0.15);
      ctx.lineTo(x, y + h * 0.85);
      ctx.lineTo(x + w * 0.1, y + h * 0.85);
      
      ctx.moveTo(x + w * 0.9, y + h * 0.15);
      ctx.lineTo(x + w, y + h * 0.15);
      ctx.lineTo(x + w, y + h * 0.85);
      ctx.lineTo(x + w * 0.9, y + h * 0.85);
      ctx.stroke();
      break;
    case 'hexagon':
      ctx.moveTo(x + w * 0.25, y);
      ctx.lineTo(x + w * 0.75, y);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x + w * 0.75, y + h);
      ctx.lineTo(x + w * 0.25, y + h);
      ctx.lineTo(x, y + h * 0.5);
      ctx.fill();
      break;
    case 'dots':
      ctx.lineWidth = sizeMultiplier * 2;
      ctx.setLineDash([sizeMultiplier * 4, sizeMultiplier * 4]);
      drawRoundedRectPath(ctx, x, y, w, h, h * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
  }
  ctx.restore();

  if (options.template) {
    ctx.restore();
    const w = size;
    const h = options.template?.heightRatio ? Math.round(size * options.template.heightRatio) : size;
    options.template.drawForeground(ctx, w, h, options);
  }
}

/**
 * Path helper for rounded rect (doesn't call fill/stroke)
 */
function drawRoundedRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
/**
 * Constrain an element to stay within the QR content area and avoid the 3 finder patterns (eyes)
 */
export function constrainToSafeZone(x, y, w, h, contentX, contentY, contentSize, moduleCount, quietZone) {
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = contentSize / totalModules;
  // Eye region is 7x7 modules. We add 1 module buffer for safe scanning.
  const eyeSize = cellSize * 8; 
  const qzOffset = quietZone * cellSize;

  // Define eye rectangles relative to contentX/Y
  const eyes = [
    { x: qzOffset, y: qzOffset, w: eyeSize, h: eyeSize }, // Top-Left
    { x: contentSize - qzOffset - eyeSize, y: qzOffset, w: eyeSize, h: eyeSize }, // Top-Right
    { x: qzOffset, y: contentSize - qzOffset - eyeSize, w: eyeSize, h: eyeSize } // Bottom-Left
  ];

  let resX = x;
  let resY = y;

  // If the element is very large, eye avoidance is mathematically impossible and will force 
  // the element to the center, breaking canvas handle alignments. In this case, we bypass
  // the safety zone and only apply boundary clamping.
  const isVeryLarge = w > contentSize * 0.32 || h > contentSize * 0.32;

  if (!isVeryLarge) {
    // Safety Nudging (Absolute Eye Avoidance)
    for (let i = 0; i < eyes.length; i++) {
      const eye = eyes[i];
      const eyeAbsX = contentX + eye.x;
      const eyeAbsY = contentY + eye.y;
      
      // Check intersection
      if (resX < eyeAbsX + eye.w && resX + w > eyeAbsX && resY < eyeAbsY + eye.h && resY + h > eyeAbsY) {
         // We are in the Danger Zone! 
         // Escape options MUST stay within the QR module area [minX, maxX]
         const canGoRight = (eyeAbsX + eye.w + w) <= (contentX + contentSize - qzOffset);
         const canGoDown = (eyeAbsY + eye.h + h) <= (contentY + contentSize - qzOffset);
         const canGoLeft = (eyeAbsX - w) >= (contentX + qzOffset);
         const canGoUp = (eyeAbsY - h) >= (contentY + qzOffset);

         const distRight = (eyeAbsX + eye.w) - resX;
         const distLeft = (resX + w) - eyeAbsX;
         const distBottom = (eyeAbsY + eye.h) - resY;
         const distTop = (resY + h) - eyeAbsY;

         // Filter escape routes that stay in bounds
         const options = [];
         if (canGoRight) options.push({ dist: distRight, axis: 'x', val: eyeAbsX + eye.w });
         if (canGoLeft) options.push({ dist: distLeft, axis: 'x', val: eyeAbsX - w });
         if (canGoDown) options.push({ dist: distBottom, axis: 'y', val: eyeAbsY + eye.h });
         if (canGoUp) options.push({ dist: distTop, axis: 'y', val: eyeAbsY - h });

         if (options.length > 0) {
           // Sort by distance to find the closest valid escape
           options.sort((a, b) => a.dist - b.dist);
           const best = options[0];
           if (best.axis === 'x') resX = best.val;
           else resY = best.val;
         } else {
           // EMERGENCY: If it doesn't fit anywhere else (rare), force to center
           resX = contentX + (contentSize - w) / 2;
           resY = contentY + (contentSize - h) / 2;
         }
      }
    }
  }

  // Final Clamp: Ensure it never goes outside the QR MODULE area (excluding quiet zone)
  const minX = contentX + qzOffset;
  const minY = contentY + qzOffset;
  const maxX = contentX + contentSize - qzOffset - w;
  const maxY = contentY + contentSize - qzOffset - h;

  resX = Math.max(minX, Math.min(maxX, resX));
  resY = Math.max(minY, Math.min(maxY, resY));

  return { x: resX, y: resY };
}

/**
 * Helper to convert hex to rgb
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

/**
 * Helper to create texture patterns
 */
function getTexturePattern(type, ctx, w, h) {
  const tCanvas = document.createElement('canvas');
  const tCtx = tCanvas.getContext('2d');
  tCanvas.width = 16;
  tCanvas.height = 16;

  switch (type) {
    case 'glass':
      tCtx.fillStyle = 'rgba(255,255,255,0.2)';
      tCtx.fillRect(0, 0, 16, 16);
      tCtx.strokeStyle = 'rgba(255,255,255,0.4)';
      tCtx.strokeRect(0, 0, 16, 16);
      break;
    case 'carbon':
      tCtx.fillStyle = '#111';
      tCtx.fillRect(0, 0, 16, 16);
      tCtx.fillStyle = '#222';
      tCtx.fillRect(0, 0, 8, 8);
      tCtx.fillRect(8, 8, 8, 8);
      break;
    case 'metal':
      const grad = tCtx.createLinearGradient(0, 0, 16, 16);
      grad.addColorStop(0, '#888');
      grad.addColorStop(0.5, '#fff');
      grad.addColorStop(1, '#888');
      tCtx.fillStyle = grad;
      tCtx.fillRect(0, 0, 16, 16);
      break;
    case 'mesh':
      tCtx.strokeStyle = '#555';
      tCtx.beginPath();
      tCtx.moveTo(0, 0); tCtx.lineTo(16, 16);
      tCtx.moveTo(16, 0); tCtx.lineTo(0, 16);
      tCtx.stroke();
      break;
    case 'dots':
      tCtx.fillStyle = '#555';
      tCtx.beginPath();
      tCtx.arc(8, 8, 2, 0, Math.PI * 2);
      tCtx.fill();
      break;
  }

  return ctx.createPattern(tCanvas, 'repeat');
}
