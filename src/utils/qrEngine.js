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
  HEART: 'heart',
  TRIANGLE: 'triangle',
  DIAMOND: 'diamond',
  GEOMETRIC: 'geometric',
  MODERN: 'modern',
  LCD: 'lcd',
};

// Frame styles
export const FRAME_STYLES = {
  NONE: 'none',
  SCAN_ME: 'scan-me',
  TEXT_BOTTOM: 'text-bottom',
  TEXT_TOP: 'text-top',
  BOX: 'box',
  ROUNDED: 'rounded',
  MODERN: 'modern',
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
    gradientEnabled = false,
    gradientColor1 = '#000000',
    gradientColor2 = '#0066ff',
    gradientType = 'linear',
    logo = null,
    logoSize = 0.25,
    logoPadding = 10,
    logoBackground = false,
    logoBgColor = '#ffffff',
    logoBgShape = 'circle',
    logoOutline = false,
    logoOutlineColor = '#000000',
    logoOutlineWidth = 3,
    logoOutlineOpacity = 1,
    quietZone = 2,
    frameStyle = FRAME_STYLES.NONE,
    frameText = 'SCAN ME',
    frameColor = '',
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
    if (frameStyle === FRAME_STYLES.SCAN_ME) {
      const labelHeight = size * 0.16;
      // Shrink and shift UP to give more breathing space
      contentSize = size - (padding * 2) - labelHeight - (size * 0.12); 
      contentX = (size - contentSize) / 2;
      contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
    } else if (frameStyle === FRAME_STYLES.TEXT_BOTTOM) {
      const labelHeight = size * 0.1;
      contentSize = size - (padding * 2) - labelHeight;
      contentX = (size - contentSize) / 2;
      contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
    } else {
      // Basic frame padding
      contentX = padding + size * 0.08;
      contentY = padding + size * 0.08;
      contentSize = size - (contentX * 2);
    }
  }

  // Draw frame if enabled
  if (frameStyle !== FRAME_STYLES.NONE) {
    drawFrame(ctx, size, {
      frameStyle,
      frameText,
      frameColor: frameColor || (gradientEnabled ? gradientColor1 : qrColor),
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
      fillStyle = ctx.createLinearGradient(contentX, contentY, contentX + contentSize, contentY + contentSize);
    } else {
      fillStyle = ctx.createRadialGradient(
        contentX + contentSize / 2, contentY + contentSize / 2, 0, 
        contentX + contentSize / 2, contentY + contentSize / 2, contentSize / 2
      );
    }
    fillStyle.addColorStop(0, gradientColor1);
    fillStyle.addColorStop(1, gradientColor2);
  } else {
    fillStyle = qrColor;
  }

  // Draw QR modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const isFinder = isFinderPattern(row, col, moduleCount);
        const x = contentX + (col + quietZone) * cellSize;
        const y = contentY + (row + quietZone) * cellSize;

        if (isFinder) {
          const finderInfo = getFinderPatternInfo(row, col, moduleCount);
          const relRow = row - (finderInfo.centerRow - 3);
          const relCol = col - (finderInfo.centerCol - 3);
          
          // Only draw the entire eye once from the top-left cell (0,0 relative)
          if (relRow === 0 && relCol === 0) {
            const useEyeColor = eyeColor || (gradientEnabled ? gradientColor1 : qrColor);
            const useEyeOuterColor = eyeOuterColor || useEyeColor;
            drawEye(ctx, x, y, cellSize * 7, eyeStyle, useEyeOuterColor, useEyeColor);
          }
          continue;
        }

        if (!matrix[row][col]) continue;

        const neighbors = {
          top: row > 0 && matrix[row-1][col] && !isFinderPattern(row-1, col, moduleCount),
          bottom: row < moduleCount - 1 && matrix[row+1][col] && !isFinderPattern(row+1, col, moduleCount),
          left: col > 0 && matrix[row][col-1] && !isFinderPattern(row, col-1, moduleCount),
          right: col < moduleCount - 1 && matrix[row][col+1] && !isFinderPattern(row, col+1, moduleCount)
        };
        ctx.fillStyle = fillStyle;
        drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, options);
      }
    }

  // Draw logo
  if (logo) {
    // Adjust logo drawing to be centered in content area
    drawLogo(ctx, logo, size, {
      logoSize,
      logoPadding,
      logoBackground,
      logoBgColor,
      logoBgShape,
      logoOutline,
      logoOutlineColor,
      logoOutlineWidth,
      logoOutlineOpacity,
      contentX,
      contentY,
      contentSize
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
 * Draw eye module
 */
/**
 * Draw the full 7x7 eye (finder pattern) as a single unit
 */
function drawEye(ctx, x, y, size, style, outerColor, innerColor) {
  const s = size / 28; // Scale factor from 28x28 coordinate space
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  
  // 1. Draw Outer Ring (using even-odd fill for the hole)
  ctx.fillStyle = outerColor;
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
      // Outer
      ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.quadraticCurveTo(28, 0, 28, 8); ctx.lineTo(28, 28); ctx.lineTo(8, 28); ctx.quadraticCurveTo(0, 28, 0, 20); ctx.closePath();
      // Inner Hole
      ctx.moveTo(4, 4); ctx.lineTo(20, 4); ctx.quadraticCurveTo(24, 4, 24, 8); ctx.lineTo(24, 24); ctx.lineTo(8, 24); ctx.quadraticCurveTo(4, 24, 4, 20); ctx.closePath();
      break;
    case EYE_STYLES.FLOWER:
      // Outer Petals
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const r = i % 2 === 0 ? 14 : 11;
        ctx.lineTo(14 + r * Math.cos(a), 14 + r * Math.sin(a));
      }
      ctx.closePath();
      // Hole
      ctx.moveTo(14 + 10, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.SHIELD:
      // Outer
      ctx.moveTo(0, 2); ctx.lineTo(28, 2); ctx.lineTo(28, 14); ctx.quadraticCurveTo(28, 24, 14, 28); ctx.quadraticCurveTo(0, 24, 0, 14); ctx.closePath();
      // Hole
      ctx.moveTo(4, 6); ctx.lineTo(24, 6); ctx.lineTo(24, 14); ctx.quadraticCurveTo(24, 20, 14, 24); ctx.quadraticCurveTo(4, 20, 4, 14); ctx.closePath();
      break;
    case EYE_STYLES.OCTAGON:
      // Outer
      ctx.moveTo(9, 0); ctx.lineTo(19, 0); ctx.lineTo(28, 9); ctx.lineTo(28, 19); ctx.lineTo(19, 28); ctx.lineTo(9, 28); ctx.lineTo(0, 19); ctx.lineTo(0, 9); ctx.closePath();
      // Hole
      ctx.moveTo(10, 4); ctx.lineTo(18, 4); ctx.lineTo(24, 10); ctx.lineTo(24, 18); ctx.lineTo(18, 24); ctx.lineTo(10, 24); ctx.lineTo(4, 18); ctx.lineTo(4, 10); ctx.closePath();
      break;
    case EYE_STYLES.HEXAGON:
      // Outer
      ctx.moveTo(14, 0); ctx.lineTo(26, 7); ctx.lineTo(26, 21); ctx.lineTo(14, 28); ctx.lineTo(2, 21); ctx.lineTo(2, 7); ctx.closePath();
      // Hole
      ctx.moveTo(14, 5); ctx.lineTo(22, 9); ctx.lineTo(22, 19); ctx.lineTo(14, 23); ctx.lineTo(6, 19); ctx.lineTo(6, 9); ctx.closePath();
      break;
    case EYE_STYLES.STAR:
      // Outer Star
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? 14 : 6;
        ctx.lineTo(14 + r * Math.cos(a), 14 + r * Math.sin(a));
      }
      ctx.closePath();
      // Hole
      ctx.moveTo(14 + 10, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.HEART:
      // Outer Heart
      ctx.moveTo(14, 26);
      ctx.bezierCurveTo(2, 18, 0, 12, 0, 8);
      ctx.bezierCurveTo(0, 2, 6, 0, 10, 0);
      ctx.bezierCurveTo(14, 0, 14, 4, 14, 4);
      ctx.bezierCurveTo(14, 4, 14, 0, 18, 0);
      ctx.bezierCurveTo(22, 0, 28, 2, 28, 8);
      ctx.bezierCurveTo(28, 12, 26, 18, 14, 26);
      ctx.closePath();
      // Hole
      ctx.moveTo(14 + 10, 14);
      ctx.arc(14, 14, 10, 0, Math.PI * 2, true);
      break;
    case EYE_STYLES.TRIANGLE:
      // Outer
      ctx.moveTo(14, 0); ctx.lineTo(28, 26); ctx.lineTo(0, 26); ctx.closePath();
      // Hole
      ctx.moveTo(14, 6); ctx.lineTo(22, 22); ctx.lineTo(6, 22); ctx.closePath();
      break;
    case EYE_STYLES.GEOMETRIC:
      // Outer
      ctx.moveTo(0, 0); ctx.lineTo(28, 0); ctx.lineTo(28, 10); ctx.lineTo(18, 10); ctx.lineTo(18, 18); ctx.lineTo(10, 18); ctx.lineTo(10, 28); ctx.lineTo(0, 28); ctx.closePath();
      // Hole
      ctx.moveTo(4, 4); ctx.lineTo(24, 4); ctx.lineTo(24, 8); ctx.lineTo(14, 8); ctx.lineTo(14, 14); ctx.lineTo(8, 14); ctx.lineTo(8, 24); ctx.lineTo(4, 24); ctx.closePath();
      break;
    case EYE_STYLES.MODERN:
      // Outer
      drawRoundedRectPath(ctx, 0, 0, 28, 28, 2);
      drawRoundedRectPath(ctx, 3, 3, 22, 22, 1);
      // Extra inner ring
      drawRoundedRectPath(ctx, 6, 6, 16, 16, 1);
      drawRoundedRectPath(ctx, 9, 9, 10, 10, 0.5);
      break;
    case EYE_STYLES.DIAMOND:
      // Outer
      ctx.moveTo(14, 0); ctx.lineTo(28, 14); ctx.lineTo(14, 28); ctx.lineTo(0, 14); ctx.closePath();
      // Hole
      ctx.moveTo(14, 6); ctx.lineTo(22, 14); ctx.lineTo(14, 22); ctx.lineTo(6, 14); ctx.closePath();
      break;
    case EYE_STYLES.LCD:
      // Handled separately below to allow for a unique segmented look
      break;
    default: // SQUARE
      ctx.rect(0, 0, 28, 28);
      ctx.rect(4, 4, 20, 20);
      break;
  }
  ctx.fill('evenodd');

  // 1.1 Special case for LCD ring (if we want dashed look, we do it after fill)
  if (style === EYE_STYLES.LCD) {
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    // Segmented bars to look like LCD
    ctx.rect(6, 1, 16, 2.5);
    ctx.rect(24.5, 6, 2.5, 16);
    ctx.rect(6, 24.5, 16, 2.5);
    ctx.rect(1, 6, 2.5, 16);
    ctx.fill();
  }

  // 2. Draw Inner Dot
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  switch (style) {
    case EYE_STYLES.CIRCLE:
    case EYE_STYLES.FLOWER:
    case EYE_STYLES.SHIELD:
    case EYE_STYLES.OCTAGON:
    case EYE_STYLES.HEXAGON:
    case EYE_STYLES.STAR:
    case EYE_STYLES.HEART:
    case EYE_STYLES.LCD:
      ctx.arc(14, 14, 6, 0, Math.PI * 2);
      break;
    case EYE_STYLES.TRIANGLE:
      ctx.arc(14, 18, 4, 0, Math.PI * 2);
      break;
    case EYE_STYLES.ROUNDED:
    case EYE_STYLES.LEAF:
    case EYE_STYLES.MODERN:
      drawRoundedRectPath(ctx, 8, 8, 12, 12, 4);
      break;
    case EYE_STYLES.GEOMETRIC:
      ctx.rect(8, 8, 8, 8);
      break;
    case EYE_STYLES.DIAMOND:
      ctx.moveTo(14, 8); ctx.lineTo(20, 14); ctx.lineTo(14, 20); ctx.lineTo(8, 14); ctx.closePath();
      break;
    default: // SQUARE
      ctx.rect(8, 8, 12, 12);
      break;
  }
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw rounded rectangle
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
    logoSize,
    logoPadding,
    logoBackground,
    logoBgColor,
    logoBgShape,
    logoOutline,
    logoOutlineColor,
    logoOutlineWidth,
    logoOutlineOpacity,
    contentX = 0,
    contentY = 0,
    contentSize = canvasSize
  } = options;

  const logoW = contentSize * logoSize;
  const logoH = logoW * (logoImg.height / logoImg.width);
  const logoX = contentX + (contentSize - logoW) / 2;
  const logoY = contentY + (contentSize - logoH) / 2;
  const paddedW = logoW + logoPadding * 2;
  const paddedH = logoH + logoPadding * 2;
  const paddedX = logoX - logoPadding;
  const paddedY = logoY - logoPadding;

  ctx.save();

  // Draw outline (smart shape-following)
  if (logoOutline && logoOutlineWidth > 0) {
    ctx.globalAlpha = logoOutlineOpacity;
    drawSmartOutline(ctx, logoImg, canvasSize, logoW, logoH, logoX, logoY, {
      outlineColor: logoOutlineColor,
      outlineWidth: logoOutlineWidth,
      logoBgShape,
      logoPadding,
    });
    ctx.globalAlpha = 1;
  }

  // Draw background behind logo
  if (logoBackground) {
    ctx.fillStyle = logoBgColor;
    if (logoBgShape === 'circle') {
      const radius = Math.max(paddedW, paddedH) / 2;
      ctx.beginPath();
      ctx.arc(logoX + logoW/2, logoY + logoH/2, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (logoBgShape === 'rounded') {
      drawRoundedRect(ctx, paddedX, paddedY, paddedW, paddedH, 12);
    } else {
      ctx.fillRect(paddedX, paddedY, paddedW, paddedH);
    }
  }

  // Draw the logo image preserving transparency
  ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  ctx.restore();
}

/**
 * Smart outline that follows logo shape using fast circular stamping (Stroke effect)
 */
function drawSmartOutline(ctx, logoImg, canvasSize, logoW, logoH, logoX, logoY, options) {
  const { outlineColor, outlineWidth } = options;

  // Step 1: Create a solid color silhouette of the logo
  const silhouetteCanvas = document.createElement('canvas');
  const silCtx = silhouetteCanvas.getContext('2d');
  silhouetteCanvas.width = logoW;
  silhouetteCanvas.height = logoH;

  // Draw the original image
  silCtx.drawImage(logoImg, 0, 0, logoW, logoH);
  
  // Fill the opaque parts with the desired stroke color
  silCtx.globalCompositeOperation = 'source-in';
  silCtx.fillStyle = outlineColor;
  silCtx.fillRect(0, 0, logoW, logoH);

  // Step 2: Stamp the silhouette in a circle to create a smooth, thick stroke
  // The number of steps depends on thickness to ensure no gaps (minimum 16)
  const steps = Math.max(16, Math.ceil(outlineWidth * Math.PI)); 
  
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const dx = Math.cos(angle) * outlineWidth;
    const dy = Math.sin(angle) * outlineWidth;
    // Draw the silhouette offset by (dx, dy)
    ctx.drawImage(silhouetteCanvas, logoX + dx, logoY + dy, logoW, logoH);
  }
}

/**
 * Draw decorative frame around the QR code
 */
function drawFrame(ctx, size, options) {
  const { frameStyle, frameText, frameColor, bgColor, bgTransparent } = options;
  const padding = size * 0.03; // Moved closer to edge (3%) to give QR more room
  const innerSize = size - padding * 2;
  
  ctx.save();
  ctx.fillStyle = frameColor;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = size * 0.025; // Slightly thicker for premium feel
  
  switch (frameStyle) {
    case FRAME_STYLES.SCAN_ME: {
      const labelHeight = size * 0.16;
      const cornerRadius = size * 0.08;
      
      // Removed Main box outline for cleaner look
      
      // Label box at bottom - solid pill style
      ctx.beginPath();
      const labelPadding = size * 0.02;
      drawRoundedRectPath(ctx, padding + labelPadding, size - padding - labelHeight + labelPadding, innerSize - labelPadding * 2, labelHeight - labelPadding * 2, cornerRadius * 0.5);
      ctx.fill();
      
      // Indicator line/pill at the very bottom of the label box
      ctx.fillStyle = bgTransparent ? '#ffffff' : bgColor;
      const indicatorW = innerSize * 0.2;
      const indicatorH = size * 0.01;
      ctx.beginPath();
      drawRoundedRectPath(ctx, (size - indicatorW) / 2, size - padding - labelHeight * 0.25, indicatorW, indicatorH, indicatorH / 2);
      ctx.fill();

      // Text
      ctx.fillStyle = bgTransparent ? '#ffffff' : bgColor;
      ctx.font = `bold ${labelHeight * 0.42}px Outfit, Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText, size / 2, size - padding - labelHeight / 1.7);
      break;
    }
    case FRAME_STYLES.TEXT_BOTTOM: {
      const labelHeight = size * 0.12;
      const cornerRadius = size * 0.04;
      
      // Removed outer box for cleaner look
      
      // Solid Stamp label at bottom
      ctx.beginPath();
      drawRoundedRectPath(ctx, padding + size * 0.05, size - padding - labelHeight, innerSize - size * 0.1, labelHeight, cornerRadius);
      ctx.fill();

      // Text
      ctx.fillStyle = bgTransparent ? '#ffffff' : bgColor;
      ctx.font = `bold ${labelHeight * 0.45}px Outfit, Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText, size / 2, size - padding - labelHeight / 2);
      break;
    }
    case FRAME_STYLES.BOX: {
      ctx.strokeRect(padding, padding, innerSize, innerSize);
      break;
    }
    case FRAME_STYLES.ROUNDED: {
      ctx.beginPath();
      drawRoundedRectPath(ctx, padding, padding, innerSize, innerSize, size * 0.1);
      ctx.stroke();
      break;
    }
    case FRAME_STYLES.MODERN: {
      const cornerSize = size * 0.18;
      // TL
      ctx.beginPath();
      ctx.moveTo(padding, padding + cornerSize);
      ctx.lineTo(padding, padding);
      ctx.lineTo(padding + cornerSize, padding);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(size - padding - cornerSize, padding);
      ctx.lineTo(size - padding, padding);
      ctx.lineTo(size - padding, padding + cornerSize);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(size - padding, size - padding - cornerSize);
      ctx.lineTo(size - padding, size - padding);
      ctx.lineTo(size - padding - cornerSize, size - padding);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(padding + cornerSize, size - padding);
      ctx.lineTo(padding, size - padding);
      ctx.lineTo(padding, size - padding - cornerSize);
      ctx.stroke();
      break;
    }
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
}

