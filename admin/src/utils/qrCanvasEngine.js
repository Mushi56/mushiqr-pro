// admin/src/utils/qrCanvasEngine.js
// ─── Standalone 2D Canvas QR Shapes & Eyes Rendering Engine ────────────────
// 100% self-contained drawing engine for live admin thumbnails & matrix previews.

export const DOT_STYLES = {
  DENSO: 'denso',
  DOTS: 'dots',
  SPARKLE: 'sparkle',
  LIQUID: 'liquid',
  HBAR: 'hbar',
  VBAR: 'vbar',
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
};

function drawRoundedRect(ctx, x, y, w, h, r) {
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
 * Draw a single QR matrix dot module
 */
export function drawDotModule(ctx, x, y, size, style, neighbors = {}, options = {}, row = 0, col = 0) {
  const padding = size * 0.12;
  const s = size - padding * 2;
  const cx = x + size / 2;
  const cy = y + size / 2;

  switch (style) {
    case 'dots':
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'rounded':
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.32);
      break;

    case 'sparkle': {
      const r = s / 2;
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

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(cx, y + padding);
      ctx.lineTo(x + size - padding, cy);
      ctx.lineTo(cx, y + size - padding);
      ctx.lineTo(x + padding, cy);
      ctx.closePath();
      ctx.fill();
      break;

    case 'hexagon': {
      const r = s / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI / 3);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'hbar':
      drawRoundedRect(ctx, x + padding, y + padding + s * 0.25, s, s * 0.5, s * 0.25);
      break;

    case 'vbar':
      drawRoundedRect(ctx, x + padding + s * 0.25, y + padding, s * 0.5, s, s * 0.25);
      break;

    case 'liquid':
      drawRoundedRect(ctx, x + padding, y + padding, s, s, s * 0.4);
      break;

    case 'capsule':
      drawRoundedRect(ctx, x + padding + s * 0.1, y + padding, s * 0.8, s, s * 0.4);
      break;

    case 'star': {
      const spikes = 5, outerR = s / 2, innerR = s / 4;
      let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'heart': {
      const d = s * 0.8;
      const hx = x + (size - d) / 2, hy = y + (size - d) / 2 + d / 4;
      ctx.beginPath();
      ctx.moveTo(hx + d / 2, hy + d / 5);
      ctx.bezierCurveTo(hx + d / 2, hy, hx, hy, hx, hy + d / 3);
      ctx.bezierCurveTo(hx, hy + d / 2, hx + d / 2, hy + d, hx + d / 2, hy + d);
      ctx.bezierCurveTo(hx + d / 2, hy + d, hx + d, hy + d / 2, hx + d, hy + d / 3);
      ctx.bezierCurveTo(hx + d, hy, hx + d / 2, hy, hx + d / 2, hy + d / 5);
      ctx.fill();
      break;
    }

    case 'leaf': {
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

    case 'shield': {
      const leftX = x + padding, topY = y + padding;
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(leftX + s, topY);
      ctx.lineTo(leftX + s, topY + s * 0.5);
      ctx.quadraticCurveTo(leftX + s * 0.5, topY + s * 1.1, leftX, topY + s * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'pixel': {
      ctx.fillRect(x + padding, y + padding, s, s);
      const cut = s * 0.35;
      ctx.clearRect(cx - cut / 2, cy - cut / 2, cut, cut);
      break;
    }

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(cx, y + padding);
      ctx.lineTo(x + size - padding, y + size - padding);
      ctx.lineTo(x + padding, y + size - padding);
      ctx.closePath();
      ctx.fill();
      break;

    case 'octagon': {
      const r = s / 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4) + Math.PI / 8;
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'plus': {
      const t = s * 0.3;
      ctx.fillRect(cx - t / 2, y + padding, t, s);
      ctx.fillRect(x + padding, cy - t / 2, s, t);
      break;
    }

    case 'cross': {
      const t = s * 0.3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-t / 2, -s / 2, t, s);
      ctx.fillRect(-s / 2, -t / 2, s, t);
      ctx.restore();
      break;
    }

    case 'cherry-blossom':
    case 'violet-flower':
    case 'rose':
    case 'lotus':
    case 'daisy':
    case 'sunflower':
    case 'tulip':
    case 'lavender':
    case 'monstera':
    case 'pansy':
    case 'forget-me-not': {
      const r = s * 0.46;
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + Math.cos(a) * r * 0.5;
        const py = cy + Math.sin(a) * r * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = '#FCD34D';
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'denso':
    case 'square':
    default:
      ctx.fillRect(x, y, size + 0.5, size + 0.5);
      break;
  }
}

/**
 * Draw a single QR corner eye (outer frame + inner ball)
 */
export function drawEye(ctx, x, y, size, style, outerColor = '#000000', innerColor = '#000000', eyeType = 'top-left') {
  const outerSize = size;
  const borderWidth = outerSize * (1 / 7);
  const innerSize = outerSize * (3 / 7);
  const innerOffset = outerSize * (2 / 7);

  ctx.save();

  // 1. Draw Outer Frame
  ctx.fillStyle = outerColor;

  if (style === 'circle' || style === 'rounded') {
    const r = style === 'circle' ? outerSize / 2 : outerSize * 0.25;
    ctx.beginPath();
    ctx.arc(x + outerSize / 2, y + outerSize / 2, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(x + outerSize / 2, y);
    ctx.lineTo(x + outerSize, y + outerSize / 2);
    ctx.lineTo(x + outerSize / 2, y + outerSize);
    ctx.lineTo(x, y + outerSize / 2);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'leaf') {
    drawRoundedRect(ctx, x, y, outerSize, outerSize, outerSize * 0.35);
  } else {
    ctx.fillRect(x, y, outerSize, outerSize);
  }

  // Clear inner cavity
  ctx.clearRect(x + borderWidth, y + borderWidth, outerSize - borderWidth * 2, outerSize - borderWidth * 2);

  // 2. Draw Inner Ball
  ctx.fillStyle = innerColor;
  const inX = x + innerOffset;
  const inY = y + innerOffset;

  if (style === 'circle' || style === 'rounded') {
    ctx.beginPath();
    ctx.arc(inX + innerSize / 2, inY + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(inX + innerSize / 2, inY);
    ctx.lineTo(inX + innerSize, inY + innerSize / 2);
    ctx.lineTo(inX + innerSize / 2, inY + innerSize);
    ctx.lineTo(inX, inY + innerSize / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(inX, inY, innerSize, innerSize);
  }

  ctx.restore();
}
