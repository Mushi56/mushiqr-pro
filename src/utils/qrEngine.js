import qrcode from 'qrcode-generator';

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
  switch (type) {
    case QR_TYPES.URL:
      return data.url || '';
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

// Error correction levels
export const EC_LEVELS = {
  L: 'L', // 7%
  M: 'M', // 15%
  Q: 'Q', // 25%
  H: 'H', // 30%
};

// Dot styles
export const DOT_STYLES = {
  SQUARE: 'square',
  ROUNDED: 'rounded',
  DOTS: 'dots',
  CLASSY: 'classy',
  DIAMOND: 'diamond',
  STAR: 'star',
  TRIANGLE: 'triangle',
  HEART: 'heart',
  OCTAGON: 'octagon',
  PLUS: 'plus',
  CROSS: 'cross',
  DENSO: 'denso',
  EXTRA_ROUNDED: 'extra-rounded',
  LEAF: 'leaf',
  FLUID: 'fluid',
};

// Eye styles
export const EYE_STYLES = {
  SQUARE: 'square',
  ROUNDED: 'rounded',
  CIRCLE: 'circle',
  LEAF: 'leaf',
  FLOWER: 'flower',
  SHIELD: 'shield',
  OCTAGON: 'octagon',
  HEXAGON: 'hexagon',
  STAR: 'star',
  HEART: 'spotlight',
  TRIANGLE: 'pillow',
  DIAMOND: 'diamond',
  GEOMETRIC: 'geometric',
  MODERN: 'modern',
  LCD: 'notch',
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
    dotStyle = DOT_STYLES.SQUARE,
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
    logoTexture = 'none',
    logoCrop = 'none',
    textCenterRotation = 0,
    qrTextureEnabled = false,
    qrTexture = null,
    qrTextureSyncEyes = true
  } = options;

  if (!matrix || !canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Background
  if (!bgTransparent) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Define Content Area for the QR based on Frame Style
  const padding = size * 0.03;
  let contentX = 0;
  let contentY = 0;
  let contentSize = size;

  // Adjust content area for frames to give proper breathing space
  if (frameStyle !== FRAME_STYLES.NONE) {
    const labelHeight = size * 0.14; // Unify label height
    // Shrink and shift UP to give more breathing space
    contentSize = size - (padding * 2) - labelHeight - (size * 0.06); 
    contentX = (size - contentSize) / 2;
    contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
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
      bgColor,
      bgTransparent
    });
  }

  const totalModules = moduleCount + quietZone * 2;
  const cellSize = contentSize / totalModules;

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
    fillStyle = qrColor;
  }

  // --- TEXTURE HANDLING PREP ---
  let silhouetteCanvas, silhouetteCtx;
  if (qrTextureEnabled && qrTexture?.image) {
    silhouetteCanvas = document.createElement('canvas');
    silhouetteCanvas.width = size;
    silhouetteCanvas.height = size;
    silhouetteCtx = silhouetteCanvas.getContext('2d');
  }

  // 1. Draw Eyes (Finder Patterns)
  const eyePositions = [
    { r: 0, c: 0 }, // Top-left
    { r: 0, c: moduleCount - 7 }, // Top-right
    { r: moduleCount - 7, c: 0 } // Bottom-left
  ];
  
  eyePositions.forEach(pos => {
    const x = contentX + (pos.c + quietZone) * cellSize;
    const y = contentY + (pos.r + quietZone) * cellSize;
    
    const useEyeColor = syncEyes ? fillStyle : (eyeColor || qrColor);
    const useEyeOuterColor = syncEyes ? fillStyle : (eyeOuterColor || useEyeColor);
    
    // If texture enabled and syncing eyes, draw eye on silhouette
    if (qrTextureEnabled && qrTexture?.image && qrTextureSyncEyes) {
      drawEye(silhouetteCtx, x, y, cellSize * 7, eyeStyle, '#000', '#000');
    } else {
      drawEye(ctx, x, y, cellSize * 7, eyeStyle, useEyeOuterColor, useEyeColor);
    }
  });
  
  // 2. Draw QR modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isFinderPattern(row, col, moduleCount)) continue;
      if (!matrix[row][col]) continue;

      const x = contentX + (col + quietZone) * cellSize;
      const y = contentY + (row + quietZone) * cellSize;

      const neighbors = {
        top: row > 0 && matrix[row-1][col] && !isFinderPattern(row-1, col, moduleCount),
        bottom: row < moduleCount - 1 && matrix[row+1][col] && !isFinderPattern(row+1, col, moduleCount),
        left: col > 0 && matrix[row][col-1] && !isFinderPattern(row, col-1, moduleCount),
        right: col < moduleCount - 1 && matrix[row][col+1] && !isFinderPattern(row, col+1, moduleCount)
      };

      if (qrTextureEnabled && qrTexture?.image) {
        silhouetteCtx.fillStyle = '#000';
        drawDotModule(silhouetteCtx, x, y, cellSize, dotStyle, neighbors, options);
      } else {
        ctx.fillStyle = fillStyle;
        drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, options);
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

  return canvas;
}

/**
 * Draw a single dot module
 */
function drawDotModule(ctx, x, y, size, style, neighbors = {}, options = {}) {
  const dotPadding = options.dotPadding !== undefined ? options.dotPadding : 5;
  const padding = (size * dotPadding) / 100;
  const s = size - padding * 2;
  const { top, bottom, left, right } = neighbors;

  switch (style) {
    case DOT_STYLES.ROUNDED:
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.3);
      break;
    case DOT_STYLES.DOTS:
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, s / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
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
      ctx.beginPath();
      // TL corner
      if (top || left) ctx.moveTo(x, y);
      else { ctx.moveTo(x + r, y); ctx.arcTo(x, y, x, y + r, r); }
      // BL corner
      if (bottom || left) ctx.lineTo(x, y + size);
      else { ctx.lineTo(x, y + size - r); ctx.arcTo(x, y + size, x + r, y + size, r); }
      // BR corner
      if (bottom || right) ctx.lineTo(x + size, y + size);
      else { ctx.lineTo(x + size - r, y + size); ctx.arcTo(x + size, y + size, x + size, y + size - r, r); }
      // TR corner
      if (top || right) ctx.lineTo(x + size, y);
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
    default: // SQUARE
      // Use 0.5px overfill to eliminate sub-pixel anti-aliasing gaps between adjacent modules
      ctx.fillRect(x + padding, y + padding, s + 0.5, s + 0.5);
      break;
  }
}

/**
 * Draw the full 7x7 eye (finder pattern) as a single unit
 */
function drawEye(ctx, x, y, size, style, outerColor, innerColor) {
  const s = size / 28; // Scale factor from 28x28 coordinate space

  // 1. Draw Outer Ring Path
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  switch (style) {
    case EYE_STYLES.CIRCLE:
      ctx.arc(14, 14, 14, 0, Math.PI * 2);
      ctx.moveTo(24, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.ROUNDED:
      drawRoundedRectPath(ctx, 0, 0, 28, 28, 8);
      drawRoundedRectPath(ctx, 4, 4, 20, 20, 4);
      break;
    case EYE_STYLES.LEAF:
      ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.quadraticCurveTo(28, 0, 28, 8); ctx.lineTo(28, 28); ctx.lineTo(8, 28); ctx.quadraticCurveTo(0, 28, 0, 20); ctx.closePath();
      ctx.moveTo(4, 4); ctx.lineTo(20, 4); ctx.quadraticCurveTo(24, 4, 24, 8); ctx.lineTo(24, 24); ctx.lineTo(8, 24); ctx.quadraticCurveTo(4, 24, 4, 20); ctx.closePath();
      break;
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
    case EYE_STYLES.SHIELD:
      ctx.moveTo(0, 2); ctx.lineTo(28, 2); ctx.lineTo(28, 14); ctx.quadraticCurveTo(28, 24, 14, 28); ctx.quadraticCurveTo(0, 24, 0, 14); ctx.closePath();
      ctx.moveTo(4, 6); ctx.lineTo(24, 6); ctx.lineTo(24, 14); ctx.quadraticCurveTo(24, 20, 14, 24); ctx.quadraticCurveTo(4, 20, 4, 14); ctx.closePath();
      break;
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
  ctx.fill('evenodd');

  // 2. Draw Inner Dot Path
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  switch (style) {
    case EYE_STYLES.CIRCLE:
    case EYE_STYLES.FLOWER:
    case EYE_STYLES.SHIELD:
    case EYE_STYLES.OCTAGON:
    case EYE_STYLES.STAR:
    case EYE_STYLES.HEART:
      ctx.arc(14, 14, 6, 0, Math.PI * 2);
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
    case EYE_STYLES.LEAF:
      drawRoundedRectPath(ctx, 8, 8, 12, 12, 4);
      break;
    default: // SQUARE
      ctx.rect(8, 8, 12, 12);
      break;
  }
  ctx.restore();
  ctx.fillStyle = innerColor;
  ctx.fill();
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
      drawSmartOutline(ctx, logoImg, canvasSize, logoW, logoH, logoX, logoY, {
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
      if (logoCrop !== 'none') {
        pctx.beginPath();
        if (logoCrop === 'circle') {
          pctx.arc(logoW/2, logoH/2, Math.min(logoW, logoH)/2, 0, Math.PI * 2);
        } else if (logoCrop === 'rounded') {
          const r = Math.min(logoW, logoH) * 0.2;
          // Compatible rounded rect
          pctx.moveTo(r, 0);
          pctx.lineTo(logoW - r, 0);
          pctx.quadraticCurveTo(logoW, 0, logoW, r);
          pctx.lineTo(logoW, logoH - r);
          pctx.quadraticCurveTo(logoW, logoH, logoW - r, logoH);
          pctx.lineTo(r, logoH);
          pctx.quadraticCurveTo(0, logoH, 0, logoH - r);
          pctx.lineTo(0, r);
          pctx.quadraticCurveTo(0, 0, r, 0);
          pctx.closePath();
        } else {
          pctx.rect(0, 0, logoW, logoH);
        }
        pctx.clip();
      }

      pctx.drawImage(logoImg, 0, 0, logoW, logoH);

      // Erase Color Filter
      if (logoEraseColorEnabled && logoEraseColor) {
        const imgData = pctx.getImageData(0, 0, Math.max(1, logoW), Math.max(1, logoH));
        const data = imgData.data;
        const target = hexToRgb(logoEraseColor);
        const tolerance = 50; // Color distance tolerance
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          const dist = Math.sqrt((r-target.r)**2 + (g-target.g)**2 + (b-target.b)**2);
          if (dist < tolerance) data[i+3] = 0;
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
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    }

    // 6. Draw Inner Shadow (on top of the logo)
    if (logoInnerShadowEnabled) {
      const isCanvas = document.createElement('canvas');
      isCanvas.width = Math.max(1, logoW);
      isCanvas.height = Math.max(1, logoH);
      const isCtx = isCanvas.getContext('2d');
      
      isCtx.drawImage(logoImg, 0, 0, logoW, logoH);
      isCtx.globalCompositeOperation = 'source-out';
      isCtx.shadowColor = logoShadowColor; 
      isCtx.shadowBlur = 10;
      isCtx.shadowOffsetX = 2;
      isCtx.shadowOffsetY = 2;
      isCtx.fillRect(0, 0, logoW, logoH);
      
      isCtx.globalCompositeOperation = 'destination-in';
      isCtx.drawImage(logoImg, 0, 0, logoW, logoH);
      
      ctx.drawImage(isCanvas, logoX, logoY, logoW, logoH);
    }
  } catch (err) {
    console.error("Logo Render Error:", err);
    // Fallback: Just draw the basic logo
    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  }

  ctx.restore();

  // Draw Resize Handles (5-point system) if requested
  if (options.showHandle && options.selectedType === 'logo') {
    // Draw Center Alignment Guide Lines
    ctx.save();
    ctx.strokeStyle = '#007AFF'; // Premium blue alignment guidelines
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
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((logoRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.strokeStyle = '#007AFF'; 
    ctx.lineWidth = 4.5; // Premium bold solid outline stroke
    ctx.strokeRect(logoX, logoY, logoW, logoH);
    
    const hSize = 10;
    const bigHSize = 16;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 2.5; // Bold handles stroke

    const drawH = (hx, hy, size = hSize, isCircle = false) => {
        ctx.beginPath();
        if (isCircle) {
            ctx.arc(hx, hy, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(hx - size/2, hy - size/2, size, size);
            ctx.strokeRect(hx - size/2, hy - size/2, size, size);
        }
    };

    // 1. Bottom-Left Curved Rotate Bracket Arrow (Radius 16, Offset -20, 20)
    const drawRotateBracket = (bx, by, angleStart, angleEnd, ox, oy) => {
        ctx.save();
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 4.5; // Bold rotate bracket stroke
        ctx.beginPath();
        const ax = bx + ox;
        const ay = by + oy;
        ctx.arc(ax, ay, 16, angleStart, angleEnd); // Radius increased to 16
        ctx.stroke();
        
        ctx.fillStyle = '#007AFF';
        const drawArrow = (arrowX, arrowY, rotAngle) => {
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(rotAngle);
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, 0);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        
        const e1x = ax + 16 * Math.cos(angleStart);
        const e1y = ay + 16 * Math.sin(angleStart);
        drawArrow(e1x, e1y, angleStart + Math.PI/2);
        
        const e2x = ax + 16 * Math.cos(angleEnd);
        const e2y = ay + 16 * Math.sin(angleEnd);
        drawArrow(e2x, e2y, angleEnd - Math.PI/2);
        
        ctx.restore();
    };

    // Draw only Bottom-Left rotate bracket (offset -20, 20)
    drawRotateBracket(logoX, logoY + logoH, 0.5 * Math.PI, Math.PI, -20, 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#007AFF';

    // 2. Right (Stretch X)
    drawH(logoX + logoW, logoY + logoH/2); 

    // 3. Bottom (Stretch Y)
    drawH(logoX + logoW/2, logoY + logoH); 

    // 4. Bottom-Right (Resize Proportional - Big Circle)
    drawH(logoX + logoW, logoY + logoH, bigHSize, true);

    // 5. Top-Right (Delete Button - Red Circle with X)
    ctx.fillStyle = '#FF3B30';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5; // Bold delete button X stroke
    drawH(logoX + logoW, logoY, 22, true);
    // Draw X
    ctx.beginPath();
    ctx.moveTo(logoX + logoW - 6, logoY - 6);
    ctx.lineTo(logoX + logoW + 6, logoY + 6);
    ctx.moveTo(logoX + logoW + 6, logoY - 6);
    ctx.lineTo(logoX + logoW - 6, logoY + 6);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Smart outline that follows logo shape using fast circular stamping (Stroke effect)
 */
function drawSmartOutline(ctx, logoImg, canvasSize, logoW, logoH, logoX, logoY, options) {
  const { outlineColor, outlineWidth, logoBgShape, logoPadding, hasBackground } = options;

  if (hasBackground) {
    // If there's a background, we outline the background shape instead of the logo pixels
    const paddedW = logoW + logoPadding * 2;
    const paddedH = logoH + logoPadding * 2;
    const paddedX = logoX - logoPadding;
    const paddedY = logoY - logoPadding;

    ctx.strokeStyle = outlineColor;
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
  silCtx.fillStyle = outlineColor;
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

  const paddedW = textWidth + (logoPadding || 10) * 2;
  const paddedH = textHeight + (logoPadding || 10) * 2;

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
    ctx.strokeStyle = textCenterStrokeColor || '#ffffff';
    ctx.lineWidth = fontSize * (textCenterStrokeWidth / 100);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, centerX, centerY);
  }

  // 5. Apply Shadow (to fill only)
  if (textCenterShadowEnabled) {
    ctx.shadowColor = textCenterShadowColor;
    ctx.shadowBlur = textCenterShadowBlur;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }

  // 6. Draw Fill (on top of stroke)
  ctx.fillStyle = textCenterColor || '#000000';
  ctx.fillText(text, centerX, centerY);
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
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((textCenterRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.strokeStyle = '#007AFF'; 
    ctx.lineWidth = 4.5; // Premium bold solid outline stroke
    ctx.strokeRect(logoX, logoY, paddedW, paddedH);
    
    const hSize = 10;
    const bigHSize = 16;
    
    const drawH = (hx, hy, size = hSize, isCircle = false, color = '#ffffff', stroke = '#007AFF') => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2.5; // Bold handles stroke
        if (isCircle) {
            ctx.arc(hx, hy, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(hx - size/2, hy - size/2, size, size);
            ctx.strokeRect(hx - size/2, hy - size/2, size, size);
        }
    };

    // 1. Bottom-Left Curved Rotate Bracket Arrow (Radius 16, Offset -20, 20)
    const drawRotateBracket = (bx, by, angleStart, angleEnd, ox, oy) => {
        ctx.save();
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 4.5; // Bold rotate bracket stroke
        ctx.beginPath();
        const ax = bx + ox;
        const ay = by + oy;
        ctx.arc(ax, ay, 16, angleStart, angleEnd); // Radius increased to 16
        ctx.stroke();
        
        ctx.fillStyle = '#007AFF';
        const drawArrow = (arrowX, arrowY, rotAngle) => {
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(rotAngle);
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, 0);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        
        const e1x = ax + 16 * Math.cos(angleStart);
        const e1y = ay + 16 * Math.sin(angleStart);
        drawArrow(e1x, e1y, angleStart + Math.PI/2);
        
        const e2x = ax + 16 * Math.cos(angleEnd);
        const e2y = ay + 16 * Math.sin(angleEnd);
        drawArrow(e2x, e2y, angleEnd - Math.PI/2);
        
        ctx.restore();
    };

    // Draw only Bottom-Left rotate bracket (offset -20, 20)
    drawRotateBracket(logoX, logoY + paddedH, 0.5 * Math.PI, Math.PI, -20, 20);

    // 2. Bottom-Right (Resize Proportional - Big Circle)
    drawH(logoX + paddedW, logoY + paddedH, bigHSize, true);

    // 3. Top-Right (Delete Button)
    drawH(logoX + paddedW, logoY, 22, true, '#FF3B30', '#ffffff');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5; // Bold delete button X stroke
    ctx.beginPath();
    ctx.moveTo(logoX + paddedW - 6, logoY - 6);
    ctx.lineTo(logoX + paddedW + 6, logoY + 6);
    ctx.moveTo(logoX + paddedW + 6, logoY - 6);
    ctx.lineTo(logoX + paddedW - 6, logoY + 6);
    ctx.stroke();

    ctx.restore();
  }
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
    bgColor,
    bgTransparent
  } = options;

  const innerSize = size - padding * 2;
  
  ctx.save();
  ctx.fillStyle = frameColor;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = size * 0.025; // Slightly thicker for premium feel
  
  const labelHeight = size * 0.14;
  const labelY = size - padding - labelHeight;
  const textY = size - padding - labelHeight / 2;
  const labelW = innerSize - size * 0.1;
  const labelX = padding + size * 0.05;

  drawBackgroundShape(ctx, frameStyle, labelX, labelY, labelW, labelHeight, frameColor, size * 0.005);

  // Text
  ctx.fillStyle = bgTransparent ? '#ffffff' : bgColor;
  ctx.font = `bold ${size * frameSize}px ${frameFont}, Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (frameShadowEnabled) { 
    ctx.shadowColor = frameShadowColor; 
    ctx.shadowBlur = frameShadowBlur; 
    ctx.shadowOffsetX = 2; 
    ctx.shadowOffsetY = 2; 
  }
  
  if (frameStrokeEnabled) { 
    ctx.strokeStyle = frameStrokeColor; 
    ctx.lineWidth = frameStrokeWidth; 
    ctx.strokeText(frameText, size / 2, textY); 
  }
  
  ctx.fillText(frameText, size / 2, textY);
  ctx.shadowColor = 'transparent'; 
  ctx.shadowBlur = 0; 
  ctx.shadowOffsetX = 0; 
  ctx.shadowOffsetY = 0;
  
  ctx.restore();
}

/**
 * Unified helper to draw background shapes for text or logo
 */
function drawBackgroundShape(ctx, shape, x, y, w, h, color, sizeMultiplier = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  
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
      ctx.moveTo(x + h * 0.4, y);
      ctx.lineTo(x + w - h * 0.4, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w - h * 0.4, y + h);
      ctx.lineTo(x + h * 0.4, y + h);
      ctx.lineTo(x, y + h / 2);
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
function constrainToSafeZone(x, y, w, h, contentX, contentY, contentSize, moduleCount, quietZone) {
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
