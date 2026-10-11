// src/components/qr-templates/TemplateRenderer.js
// Universal Canvas 2D Renderer for all Follow Me, Social & Brand Pro Templates

import { TEMPLATE_LOGO_ICON_MAP } from '../../data/qrTemplates/templateIconMap';
import { TEMPLATE_ICONS } from '../../data/qrTemplates/templateIcons';

const svgImageCache = {};

import { SINGLE_WEIGHT_FONTS } from '../../data/fontOptions';

let _sharedOffscreenCanvas = null;
function getSharedOffscreen(w, h) {
  if (typeof document === 'undefined') return null;
  if (!_sharedOffscreenCanvas) {
    _sharedOffscreenCanvas = document.createElement('canvas');
  }
  if (_sharedOffscreenCanvas.width !== w || _sharedOffscreenCanvas.height !== h) {
    _sharedOffscreenCanvas.width = w;
    _sharedOffscreenCanvas.height = h;
  }
  return _sharedOffscreenCanvas;
}

export function getSvgImage(svgStringOrUrl, onLoaded) {
  if (!svgStringOrUrl) return null;
  if (svgImageCache[svgStringOrUrl]) {
    const cachedImg = svgImageCache[svgStringOrUrl];
    if (onLoaded && !cachedImg.complete) {
      cachedImg.addEventListener('load', onLoaded, { once: true });
    }
    return cachedImg;
  }
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  if (onLoaded) {
    img.addEventListener('load', onLoaded, { once: true });
    img.addEventListener('error', onLoaded, { once: true });
  }

  if (svgStringOrUrl.startsWith('/') || svgStringOrUrl.startsWith('http') || svgStringOrUrl.startsWith('data:')) {
    img.src = svgStringOrUrl;
  } else {
    let formattedSvg = svgStringOrUrl.trim();
    if (!formattedSvg.includes('xmlns=')) {
      formattedSvg = formattedSvg.replace(/<svg\b([^>]*)>/i, '<svg xmlns="http://www.w3.org/2000/svg" $1>');
    }
    if (!formattedSvg.includes('width=') && !formattedSvg.includes('height=')) {
      formattedSvg = formattedSvg.replace(/<svg\b([^>]*)>/i, '<svg width="24" height="24" $1>');
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(formattedSvg);
  }

  svgImageCache[svgStringOrUrl] = img;
  return img;
}

/**
 * Returns tailored brand typography font-family and weights for each template/platform
 */
export function getBrandTypography(templateId, category) {
  const id = (templateId || '').toLowerCase().replace('brand-', '');

  // 1. Tech, Modern & Minimalist (Google, Threads, X, GitHub, Discord, Drive) -> Inter / System Bold
  if (['google', 'threads', 'x', 'twitter', 'github', 'discord', 'drive', 'google-drive', 'reddit'].includes(id)) {
    return {
      headlineFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      headlineWeight: '800',
      handleFont: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      handleWeight: '600'
    };
  }

  // 2. High Impact, Bold & Media (YouTube, TikTok, Twitch, Spotify, Soundcloud, Podcast) -> Montserrat / Oswald
  if (['youtube', 'tiktok', 'twitch', 'spotify', 'soundcloud', 'podcast', 'event', 'ticket'].includes(id)) {
    return {
      headlineFont: "'Montserrat', 'Outfit', sans-serif",
      headlineWeight: '900',
      handleFont: "'Montserrat', sans-serif",
      handleWeight: '700'
    };
  }

  // 3. Social, Lifestyle & Visual (Instagram, Snapchat, Pinterest, Behance, Dribbble) -> Outfit / Montserrat
  if (['instagram', 'snapchat', 'pinterest', 'behance', 'dribbble', 'portfolio'].includes(id)) {
    return {
      headlineFont: "'Outfit', 'Montserrat', sans-serif",
      headlineWeight: '800',
      handleFont: "'Outfit', 'Inter', sans-serif",
      handleWeight: '600'
    };
  }

  // 4. Dining, Hospitality & Luxury (Menu, Restaurant, Food, Wine, Booking) -> Playfair Display / Montserrat
  if (['menu', 'digital-menu', 'restaurant', 'food', 'wine', 'bar', 'booking', 'hotel'].includes(id)) {
    return {
      headlineFont: "'Playfair Display', 'Georgia', serif",
      headlineWeight: '700',
      handleFont: "'Montserrat', 'Inter', sans-serif",
      handleWeight: '600'
    };
  }

  // 5. Casual, Fun, Creative & Retail (Review, Feedback, Discount, Coupon, Sale, Promo, Loyalty, Tip) -> Bebas Neue / Montserrat
  if (['review', 'feedback', 'discount', 'coupon', 'sale', 'promo', 'loyalty', 'tip', 'tip-jar', 'donation'].includes(id)) {
    return {
      headlineFont: "'Bebas Neue', 'Oswald', sans-serif",
      headlineWeight: '700',
      handleFont: "'Montserrat', 'Inter', sans-serif",
      handleWeight: '700'
    };
  }

  // 6. Corporate, Business & Communication (LinkedIn, WhatsApp, Telegram, Skype, Message, Email, Call, SMS, Contact, vCard, Wifi)
  if (['linkedin', 'whatsapp', 'telegram', 'skype', 'message', 'email', 'call', 'sms', 'contact', 'vcard', 'wifi', 'website', 'app-store', 'play-store'].includes(id)) {
    return {
      headlineFont: "'Outfit', 'Inter', sans-serif",
      headlineWeight: '800',
      handleFont: "'Inter', sans-serif",
      handleWeight: '600'
    };
  }

  // Default clean modern font
  return {
    headlineFont: "'Outfit', 'Inter', sans-serif",
    headlineWeight: '800',
    handleFont: "'Inter', sans-serif",
    handleWeight: '600'
  };
}

function parseBackground(ctx, bgString, x, y, w, h) {
  if (!bgString) {
    ctx.fillStyle = '#ffffff';
    return;
  }
  if (bgString.startsWith('linear-gradient')) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    const colorStopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))(?:\s+([0-9.]+)%)?/g;
    let match;
    const colors = [];
    while ((match = colorStopRegex.exec(bgString)) !== null) {
      colors.push({ color: match[1], stop: match[2] ? parseFloat(match[2]) / 100 : null });
    }
    if (colors.length > 0) {
      colors.forEach((c, idx) => {
        const stop = c.stop !== null ? c.stop : (colors.length > 1 ? idx / (colors.length - 1) : 0);
        try {
          grad.addColorStop(Math.min(1, Math.max(0, stop)), c.color);
        } catch (e) {}
      });
      ctx.fillStyle = grad;
      return;
    }
  }
  ctx.fillStyle = bgString;
}

function isLightBackground(bgString) {
  if (!bgString || typeof bgString !== 'string') return false;
  const s = bgString.toLowerCase();
  if (s.includes('#fffc00') || s.includes('#fff') || s.includes('#e8eaed') || s.includes('#f3f4f6') || s.includes('rgb(255, 252') || s.includes('#fafafa')) {
    return true;
  }
  // Check hex luminance of colors in gradient
  const hexMatches = s.match(/#([0-9a-f]{3,6})/gi);
  if (hexMatches && hexMatches.length > 0) {
    let totalLum = 0;
    let count = 0;
    for (const h of hexMatches) {
      let hex = h.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        totalLum += lum;
        count++;
      }
    }
    if (count > 0 && (totalLum / count) > 0.78) {
      return true; // Light background -> needs dark text for contrast
    }
  }
  return false;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

/**
 * Draws background decorative SVG shapes (from brand style 5 and network style templates)
 */
function drawBgShapes(ctx, w, h, bgShapesSvg, onLoaded, onPending) {
  if (!bgShapesSvg) return;
  const fullSvg = bgShapesSvg.startsWith('<svg') 
    ? bgShapesSvg 
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">${bgShapesSvg}</svg>`;
  const img = getSvgImage(fullSvg, onLoaded);
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.save();
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  } else {
    if (onPending) onPending();
  }
}

/**
 * Universal Canvas 2D Renderer for all templates
 * - Card Inset: 5.33% (16px / 300px)
 * - Top Icon Slot: 11.5% Y center
 * - Headline Center: 24.5% Y center with brand-tailored typography & glassy container
 * - QR Box Center: 55.5% Y center
 * - Bottom Handle Center: 89.5% Y center with brand-tailored typography
 */
export function drawTemplateBackground(ctx, w, h, template, options = {}) {
  ctx.save();

  const isBrandStyle = template.styleFamily === 'brand' || Boolean(template.bgShapes);
  const isNetworkStyle = template.styleFamily === 'network' || Boolean(template.netSvg);
  const typography = getBrandTypography(template.id, template.category);

  // 1 + 2. Background layer with 20% Gaussian blur (brand-style only).
  // Gradient + bgShapes + glow spots are rendered to an offscreen canvas,
  // then composited with a blur filter — card contents remain crisp.
  if (isBrandStyle && template.bgShapes) {
    const offscreen = getSharedOffscreen(w, h);
    if (!offscreen) return { qrBoxX: w * 0.25, qrBoxY: h * 0.25, qrBoxSize: w * 0.5 };
    const offCtx = offscreen.getContext('2d');
    offCtx.clearRect(0, 0, w, h);

    // Gradient background on offscreen
    if (template.background) {
      parseBackground(offCtx, template.background, 0, 0, w, h);
    } else {
      offCtx.fillStyle = '#0f172a';
    }
    offCtx.fillRect(0, 0, w, h);

    // Decorative SVG shapes
    drawBgShapes(offCtx, w, h, template.bgShapes, options.onAssetLoaded, options.onAssetPending);

    // story-light::before: 4 radial white ambient glow spots
    const glowSpots = [
      { cx: 0.80, cy: 0.12, r: 0.30, alpha: 0.65 },
      { cx: 0.15, cy: 0.25, r: 0.25, alpha: 0.45 },
      { cx: 0.85, cy: 0.82, r: 0.30, alpha: 0.40 },
      { cx: 0.25, cy: 0.88, r: 0.25, alpha: 0.35 },
    ];
    for (const s of glowSpots) {
      const gx = w * s.cx;
      const gy = h * s.cy;
      const gr = Math.max(w, h) * s.r;
      const rg = offCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      rg.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      offCtx.fillStyle = rg;
      offCtx.fillRect(0, 0, w, h);
    }

    // Composite to main canvas with 1% Gaussian blur.
    // Overshoot by 2x blurPx on each side to prevent edge-fade artifacts.
    const blurPx = Math.round(w * 0.01);
    const over   = blurPx * 2;
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(offscreen, -over, -over, w + over * 2, h + over * 2);
    ctx.filter = 'none';
    ctx.restore();

  } else if (isNetworkStyle && template.netSvg) {
    if (template.background) {
      parseBackground(ctx, template.background, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.fillRect(0, 0, w, h);
    drawBgShapes(ctx, w, h, template.netSvg, options.onAssetLoaded, options.onAssetPending);
  } else {
    if (template.background) {
      parseBackground(ctx, template.background, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.filter = `blur(${Math.round(w * 0.08)}px)`;
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.18, w * 0.20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    ctx.arc(w * 0.20, h * 0.82, w * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Central Card Frame (16px inset on 300px = 0.05333)
  const cardInset = w * 0.05333;
  const cardX = cardInset;
  const cardY = cardInset;
  const cardW = w - cardInset * 2;
  const cardH = h - cardInset * 2;
  const cardRadius = w * 0.06; // 18px on 300px

  const glassyFill = isBrandStyle ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.10)';
  const glassyStroke = isBrandStyle ? 'rgba(255, 255, 255, 0.50)' : 'rgba(255, 255, 255, 0.32)';
  const glassyStrokeWidth = Math.max(1.2, w * 0.003);

  // Central Card Frame with subtle backdrop depth
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = w * 0.03;
  ctx.shadowOffsetY = w * 0.01;
  ctx.fillStyle = glassyFill;
  ctx.strokeStyle = glassyStroke;
  ctx.lineWidth = glassyStrokeWidth;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── Layout Geometry: Exact 12px Proportional Spacing ─────────────────────
  // Base design scale: 300px width card -> (12 / 300) * w = 0.04 * w exact gap
  const spacing12 = (12 / 300) * w;

  // 1. Top Icon + Container
  const containerSize = Math.round(w * 0.125);
  const containerPad = Math.round(w * 0.016);
  const iconSize = containerSize - containerPad * 2;
  const containerRadius = containerSize * 0.28;

  // 2. Headline Font Size & Height
  const isBebas = typography.headlineFont.includes('Bebas');
  const headlineFontSize = isBebas ? Math.round(w * 0.046) : Math.round(w * 0.036);
  const letterSpacingPx = isBebas ? Math.round(w * 0.003) : Math.round(w * 0.0018);
  const headlineApproxHeight = headlineFontSize * 0.85;

  // 3. QR Frame / Holder
  const isDarkQrFrame = template.isDarkQrFrame || false;
  const qrFrameSize = w * 0.45;
  const qrFrameX = (w - qrFrameSize) / 2;
  const qrFrameRadius = w * 0.052;

  // 4. Subtitle Font Size & Height
  const subtitleFontSize = Math.round(w * 0.034);
  const subtitleApproxHeight = subtitleFontSize * 0.85;

  // Total stack height: IconContainer + Gap + Headline + Gap + QRFrame + Gap + Subtitle
  const totalStackHeight = containerSize + spacing12 + headlineApproxHeight + spacing12 + qrFrameSize + spacing12 + subtitleApproxHeight;

  // Vertically center the entire stack inside the central card
  const stackStartY = cardY + (cardH - totalStackHeight) / 2;

  // Exact positions calculated sequentially with spacing12
  const containerY = stackStartY;
  const containerX = (w - containerSize) / 2;
  const iconX = (w - iconSize) / 2;
  const iconY = containerY + containerPad;

  const headlineTopY = containerY + containerSize + spacing12;
  const headlineCenterY = headlineTopY + headlineApproxHeight / 2;

  const qrFrameY = headlineTopY + headlineApproxHeight + spacing12;

  const subtitleTopY = qrFrameY + qrFrameSize + spacing12;
  const subtitleY = subtitleTopY + subtitleApproxHeight / 2;

  // ── 4. Platform Top Icon Slot (with rounded corner container) ───────────────
  const svgSource = template.svg || (template.id ? TEMPLATE_LOGO_ICON_MAP[template.id] : null) || (template.id ? TEMPLATE_ICONS[template.id] : null) || (template.qrType ? TEMPLATE_ICONS[template.qrType] : null);
  if (svgSource) {
    const iconImg = getSvgImage(svgSource, options.onAssetLoaded);
    if (iconImg && iconImg.complete && iconImg.naturalWidth !== 0) {
      ctx.save();
      ctx.fillStyle = isLightBackground(template.background) 
        ? 'rgba(0, 0, 0, 0.08)' 
        : 'rgba(255, 255, 255, 0.15)';
      drawRoundedRect(ctx, containerX, containerY, containerSize, containerSize, containerRadius);
      ctx.fill();
      ctx.restore();

      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
    } else {
      if (options.onAssetPending) options.onAssetPending();
    }
  }

  // ── 5. Headline Text (Exact Spacing) ────────────────────────────────────────
  const headlineText = (options.templateHeadline !== undefined ? options.templateHeadline : (template.headline || '')).toUpperCase();

  ctx.save();
  const templateFontClean = options.templateFont ? options.templateFont.replace(/['"]/g, '').trim() : null;
  const headlineWeight = (templateFontClean && SINGLE_WEIGHT_FONTS.has(templateFontClean)) ? 'normal' : typography.headlineWeight;
  ctx.font = `${headlineWeight} ${headlineFontSize}px ${templateFontClean ? `"${templateFontClean}", ` : ''}${typography.headlineFont}`;

  const needsDarkText = isLightBackground(template.background);
  ctx.fillStyle = needsDarkText ? '#111111' : '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (typeof ctx.letterSpacing === 'string') {
    ctx.letterSpacing = `${letterSpacingPx}px`;
  }
  
  const letterSpacingComp = letterSpacingPx > 0 ? letterSpacingPx / 2 : 0;
  ctx.fillText(headlineText, w * 0.5 + letterSpacingComp, headlineCenterY);
  ctx.restore();

  // ── 6. QR Frame & QR White Box (Exact Spacing) ──────────────────────────────
  // Translucent outer frame
  ctx.save();
  ctx.fillStyle = isDarkQrFrame ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = isDarkQrFrame ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = glassyStrokeWidth;
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, qrFrameRadius);
  ctx.fill();
  ctx.stroke();

  // Inner QR box (uses strong contrast background color)
  const qrBoxPadding = w * 0.0267;
  const qrBoxSize = qrFrameSize - qrBoxPadding * 2;
  const qrBoxX = qrFrameX + qrBoxPadding;
  const qrBoxY = qrFrameY + qrBoxPadding;
  const qrBoxRadius = w * 0.038;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = w * 0.040;
  ctx.shadowOffsetY = w * 0.018;
  const holderBg = options.bgColor || options.templateBgColor || template.holderBg || '#FFFFFF';
  ctx.fillStyle = holderBg;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrBoxRadius);
  ctx.fill();
  ctx.restore();

  // ── 7. Bottom Username / Subtitle Row (Exact Spacing) ───────────────────────
  const subtitleText = options.templateHandleText !== undefined ? options.templateHandleText : (options.customText !== undefined ? options.customText : (template.subtitle || ''));

  ctx.save();
  ctx.fillStyle = needsDarkText ? '#111111' : '#FFFFFF';
  const handleWeight = (templateFontClean && SINGLE_WEIGHT_FONTS.has(templateFontClean)) ? 'normal' : typography.handleWeight;
  ctx.font = `${handleWeight} ${subtitleFontSize}px ${templateFontClean ? `"${templateFontClean}", ` : ''}${typography.handleFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${Math.round(w * 0.0012)}px`;
  ctx.fillText(subtitleText, w * 0.5, subtitleY);
  ctx.restore();

  ctx.restore();

  return { qrBoxX, qrBoxY, qrBoxSize };
}

// ─────────────────────────────────────────────────────────────────────────────
// vCard Landscape Renderer — 1050 × 600 px
// Reproduces vcard-templates-2.html layout:
//   Left panel: Name (huge), Job title (accent), divider, 3 contact rows (phone/email/address)
//   Right panel: Glassmorphic QR frame with white inner box
// ─────────────────────────────────────────────────────────────────────────────

function parseRadialGradients(ctx, bgString, W, H) {
  // Fallback: just paint the base linear-gradient colour extracted from the string
  const linearMatch = bgString.match(/linear-gradient\([^,]+,\s*(#[0-9a-fA-F]{6})/);
  const base = linearMatch ? linearMatch[1] : '#111111';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Overlay each radial gradient as a blurred coloured circle
  const radialRe = /radial-gradient\(circle at (\d+)% (\d+)%,\s*(#[0-9a-fA-F]{6})/g;
  let m;
  while ((m = radialRe.exec(bgString)) !== null) {
    const cx = W * parseInt(m[1], 10) / 100;
    const cy = H * parseInt(m[2], 10) / 100;
    const col = m[3];
    const r = W * 0.55; // generous radius like the CSS
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, col + 'CC'); // ~80% opacity
    grad.addColorStop(1, col + '00');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// ── Beautiful Vector Icons with Theme-Matching Glassy Badge Containers ────────

function drawIconBadgeContainer(ctx, x, y, size, accentColor, isDark) {
  ctx.save();
  // Rounded squircle container
  const radius = size * 0.28;
  // Glassy tinted container fill matching template accent
  ctx.fillStyle = isDark ? `${accentColor}22` : `${accentColor}18`;
  ctx.strokeStyle = `${accentColor}44`;
  ctx.lineWidth = Math.max(1, size * 0.05);
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPhoneIcon(ctx, x, y, size, color, isDark) {
  drawIconBadgeContainer(ctx, x, y, size, color, isDark);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.075;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pad = size * 0.26;
  const s = size - pad * 2;
  const ox = x + pad;
  const oy = y + pad;

  // Modern crisp phone receiver
  ctx.beginPath();
  ctx.moveTo(ox + s * 0.18, oy + s * 0.12);
  ctx.bezierCurveTo(ox + s * 0.38, oy + s * 0.06, ox + s * 0.50, oy + s * 0.24, ox + s * 0.42, oy + s * 0.40);
  ctx.lineTo(ox + s * 0.36, oy + s * 0.48);
  ctx.bezierCurveTo(ox + s * 0.42, oy + s * 0.60, ox + s * 0.52, oy + s * 0.70, ox + s * 0.64, oy + s * 0.76);
  ctx.lineTo(ox + s * 0.72, oy + s * 0.70);
  ctx.bezierCurveTo(ox + s * 0.88, oy + s * 0.62, ox + s * 1.06, oy + s * 0.74, ox + s * 1.00, oy + s * 0.94);
  ctx.bezierCurveTo(ox + s * 0.94, oy + s * 1.06, ox + s * 0.78, oy + s * 1.08, ox + s * 0.68, oy + s * 1.02);
  ctx.bezierCurveTo(ox + s * 0.32, oy + s * 0.88, ox + s * 0.12, oy + s * 0.68, ox + s * 0.00, oy + s * 0.34);
  ctx.bezierCurveTo(ox - s * 0.06, oy + s * 0.24, ox - s * 0.04, oy + s * 0.08, ox + s * 0.18, oy + s * 0.12);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawEmailIcon(ctx, x, y, size, color, isDark) {
  drawIconBadgeContainer(ctx, x, y, size, color, isDark);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.075;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pad = size * 0.26;
  const s = size - pad * 2;
  const ox = x + pad;
  const oy = y + pad;

  // Envelope Body
  drawRoundedRect(ctx, ox, oy + s * 0.12, s, s * 0.76, s * 0.16);
  ctx.stroke();
  // V-Flap
  ctx.beginPath();
  ctx.moveTo(ox + s * 0.08, oy + s * 0.22);
  ctx.lineTo(ox + s * 0.50, oy + s * 0.54);
  ctx.lineTo(ox + s * 0.92, oy + s * 0.22);
  ctx.stroke();
  ctx.restore();
}

function drawLocationIcon(ctx, x, y, size, color, isDark) {
  drawIconBadgeContainer(ctx, x, y, size, color, isDark);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.075;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pad = size * 0.24;
  const s = size - pad * 2;
  const cx = x + size * 0.5;
  const cy = y + pad + s * 0.38;

  // Pin Head
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.34, Math.PI * 0.75, Math.PI * 2.25, false);
  ctx.lineTo(cx, y + pad + s * 0.96);
  ctx.closePath();
  ctx.stroke();

  // Pin Inner Circle
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWebsiteIcon(ctx, x, y, size, color, isDark) {
  drawIconBadgeContainer(ctx, x, y, size, color, isDark);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.075;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pad = size * 0.25;
  const s = size - pad * 2;
  const cx = x + size * 0.5;
  const cy = y + size * 0.5;
  const r = s * 0.48;

  // Outer Globe Circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Meridian Ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Equator Line
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.restore();
}

/**
 * vCard Landscape (1050×600) Canvas Renderer
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W  — canvas width
 * @param {number} H  — canvas height
 * @param {Object} template
 * @param {Object} options — { name, jobTitle, phone, email, address, url }
 *   All contact fields are optional — empty ones are hidden automatically.
 */
export function drawVCardTemplate(ctx, W, H, template, options = {}) {
  ctx.save();

  const isDark = template.isDark !== false; // default dark
  const accent    = template.accent    || '#FFA36C';
  const textColor = template.textColor || (isDark ? '#ffffff' : '#1a1a1a');
  const subColor  = template.subColor  || (isDark ? '#e0e0e0' : '#555555');
  const borderColor = template.borderColor || 'rgba(255,255,255,0.30)';

  // ── 1. Background ──────────────────────────────────────────────────────────
  parseRadialGradients(ctx, template.background || '', W, H);

  // Dark overlay (matches vcard-templates-2.html .vcard::after)
  ctx.save();
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Grain noise (subtle fractalNoise simulation with tiny dots)
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let gy = 0; gy < H; gy += 3) {
    for (let gx = 0; gx < W; gx += 3) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.fillRect(gx, gy, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();


  // ── 3. Layout constants (match HTML: padding 64px 60px, gap 45px, QR right 280px) ─
  const pad   = W * 0.057;      // ~60px on 1050
  const gap   = W * 0.043;      // ~45px gap
  const qrFrameW = W * 0.316;   // right panel width (matches 332px ≈ 24+280+24+4)
  const leftW    = W - pad * 2 - gap - qrFrameW;

  const leftX  = pad;
  const rightX = leftX + leftW + gap;
  const midY   = H / 2;

  // ── 4. Left panel — Name + Title + Divider + Contact rows ─────────────────
  // Font sizes matching vcard-templates-2.html (at H=600):
  //   name: 54px  title: 25px (increased for legibility)  rows: 22px  icons: 28px
  const nameFontSize  = Math.round(H * 0.090);
  const titleFontSize = Math.round(H * 0.042); // increased size (~25px on 600)
  const rowFontSize   = Math.round(H * 0.037);
  const iconSize      = H * 0.047;   // 28px
  const blockGap      = H * 0.053;   // 32px — gap between name-block / divider / rows
  const rowGap        = H * 0.037;   // 22px — gap between rows
  const rowStride     = iconSize + rowGap;

  const nameFont  = `800 ${nameFontSize}px 'Manrope', 'Outfit', 'Inter', sans-serif`;
  const titleFont = `600 ${titleFontSize}px 'Manrope', 'Outfit', 'Inter', sans-serif`;
  const rowFont   = `500 ${rowFontSize}px 'Inter', 'Outfit', sans-serif`;

  // ── Displayed text — fall back to placeholders only for name/title ─────────
  const nameText  = options.name     || options.fullName    || 'Your Name';
  const titleText = options.jobTitle || options.organization || 'Job Title, Company';

  // ── Build visible rows — skip any field left empty ─────────────────────────
  const visibleRows = [
    { icon: 'phone',    text: (options.phone   || '').trim() },
    { icon: 'email',    text: (options.email   || '').trim() },
    { icon: 'location', text: (options.address || '').trim() },
    { icon: 'website',  text: (options.url     || '').trim() },
  ].filter(r => r.text !== '');

  // ── Measure total block height for vertical centering ─────────────────────
  const nameLineH     = nameFontSize  * 1.15;
  const titleLineH    = titleFontSize * 1.25;
  const nameGap       = H * 0.007;
  const dividerTopGap = H * 0.016; // ~10px on 600 (sits close right under job title)
  const dividerBotGap = H * 0.045; // ~27px gap between divider and contact rows
  const nameBlockH    = nameLineH + nameGap + titleLineH;
  const rowsH         = visibleRows.length > 0
    ? iconSize + rowStride * (visibleRows.length - 1)
    : 0;
  const totalContentH = nameBlockH + dividerTopGap + 1
    + (visibleRows.length > 0 ? dividerBotGap + rowsH : 0);

  // Vertical padding: 64px on 600 → H * 0.107
  const padV   = H * 0.107;
  const availH = H - padV * 2;
  const startY = padV + Math.max(0, (availH - totalContentH) / 2);

  // ── Clip left panel so text never bleeds into the QR frame ────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftX - 2, 0, leftW + 4, H);
  ctx.clip();

  // ── Name (First Name + Lighter Second Name) ────────────────────────────────
  const nameY = startY;
  const nameParts = nameText.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const secondName = nameParts.slice(1).join(' ');

  ctx.save();
  ctx.font = nameFont;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';

  let nameMeasuredW = 0;
  if (secondName) {
    // Draw first name in primary textColor
    ctx.fillStyle = textColor;
    ctx.fillText(firstName, leftX, nameY);
    const firstW = ctx.measureText(firstName + ' ').width;

    // Draw second name in lighter color (subColor / softer accent tone)
    ctx.fillStyle = subColor || (isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.60)');
    ctx.fillText(secondName, leftX + firstW, nameY, leftW - firstW);
    nameMeasuredW = Math.min(firstW + ctx.measureText(secondName).width, leftW);
  } else {
    ctx.fillStyle = textColor;
    ctx.fillText(firstName, leftX, nameY, leftW);
    nameMeasuredW = Math.min(ctx.measureText(firstName).width, leftW);
  }
  ctx.restore();

  // ── Job Title & Organization (Increased size, aligned to right edge of name) ──
  const titleY = nameY + nameLineH + nameGap;
  const nameRightEdgeX = leftX + nameMeasuredW;
  ctx.save();
  ctx.font = titleFont;
  ctx.fillStyle = accent;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'right';
  ctx.fillText(titleText, nameRightEdgeX, titleY, Math.max(nameMeasuredW, leftW));
  ctx.restore();

  // ── Divider Line (Close under job title text) ──────────────────────────────
  const dividerY = titleY + titleLineH + dividerTopGap;
  const dividerEndW = Math.max(nameMeasuredW, leftW * 0.75);
  ctx.save();
  const divGrad = ctx.createLinearGradient(leftX, dividerY, leftX + dividerEndW, dividerY);
  divGrad.addColorStop(0,   accent + '66');
  divGrad.addColorStop(0.85, accent + '00');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = Math.max(1, H * 0.0017);
  ctx.beginPath();
  ctx.moveTo(leftX, dividerY);
  ctx.lineTo(leftX + dividerEndW, dividerY);
  ctx.stroke();
  ctx.restore();

  // ── Contact rows ──────────────────────────────────────────────────────────
  if (visibleRows.length > 0) {
    const firstRowY   = dividerY + 1 + dividerBotGap;
    const textGapX    = iconSize + W * 0.014;
    const rowTextMaxW = leftW - textGapX;

    visibleRows.forEach((row, i) => {
      const rowY  = firstRowY + i * rowStride;
      const iconY = rowY;

      if (row.icon === 'phone')    drawPhoneIcon   (ctx, leftX, iconY, iconSize, accent, isDark);
      if (row.icon === 'email')    drawEmailIcon   (ctx, leftX, iconY, iconSize, accent, isDark);
      if (row.icon === 'location') drawLocationIcon(ctx, leftX, iconY, iconSize, accent, isDark);
      if (row.icon === 'website')  drawWebsiteIcon (ctx, leftX, iconY, iconSize, accent, isDark);

      ctx.save();
      ctx.font = rowFont;
      ctx.fillStyle = subColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign    = 'left';
      ctx.fillText(row.text, leftX + textGapX, iconY + iconSize / 2, rowTextMaxW);
      ctx.restore();
    });
  }

  // Restore left-panel clip
  ctx.restore();


  // ── 5. Right panel — QR Frame (matches .qr-frame-vc styling) ──────────────
  const qrFramePad = W * 0.023;   // ~24px on 1050
  const qrBoxSize  = qrFrameW - qrFramePad * 2;   // 280px equivalent
  const qrFrameH   = qrFrameW;    // square frame
  const qrFrameX   = rightX;
  const qrFrameY   = midY - qrFrameH / 2;
  const qrFrameRadius = W * 0.030; // ~32px on 1050

  // Outer glassmorphic frame (matches background: linear-gradient(160deg, rgba(255,255,255,0.16)…))
  ctx.save();
  const frameGrad = ctx.createLinearGradient(qrFrameX, qrFrameY, qrFrameX + qrFrameW, qrFrameY + qrFrameH);
  frameGrad.addColorStop(0, 'rgba(255,255,255,0.16)');
  frameGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.fillStyle = frameGrad;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = Math.max(1, W * 0.001);
  ctx.shadowColor = 'rgba(0,0,0,0.30)';
  ctx.shadowBlur  = W * 0.025;
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, qrFrameRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Inner QR box (matches .qr-box-vc: border-radius 22px, shadow, adapts to user-selected background color)
  const qrBoxX = qrFrameX + qrFramePad;
  const qrBoxY = qrFrameY + qrFramePad;
  const qrBoxRadius = W * 0.021; // ~22px on 1050

  ctx.save();
  ctx.shadowColor  = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur   = W * 0.032;
  ctx.shadowOffsetY = W * 0.015;
  const vcardHolderBg = options.bgColor || options.templateBgColor || template.holderBg || '#FFFFFF';
  ctx.fillStyle = vcardHolderBg;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrBoxRadius);
  ctx.fill();
  ctx.restore();

  // ── 6. Inset Card Edge Stroke Border ─────────────────────────────────────
  ctx.save();
  const strokeInset = W * 0.015; // ~16px inset on 1050
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = Math.max(1.5, W * 0.002);
  const cardRadius = W * 0.024; // ~25px radius
  drawRoundedRect(
    ctx, 
    strokeInset, 
    strokeInset, 
    W - strokeInset * 2, 
    H - strokeInset * 2, 
    cardRadius
  );
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Return QR box coordinates so the caller can draw the QR code inside
  return { qrBoxX, qrBoxY, qrBoxSize };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRAW SCAN ME FRAME TEMPLATE (50 Standalone Frame Styles from qr-templates-premium-50-2.html)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function drawFrameTemplate(ctx, w, h, template, options = {}) {
  ctx.save();
  try {
    const shape = template.shape || 'soft';
    const labelType = template.labelType || 'banner';
    const labelText = (options.templateHeadline !== undefined ? options.templateHeadline : (template.labelText || 'SCAN ME')).toUpperCase();
    const labelBg = template.labelBg || '#111111';
    const labelFg = template.labelFg || '#ffffff';
    const accent = template.accent || '#111111';
    const extra = template.extra || [];

    // Determine stage layout dimensions
    const centerX = w / 2;
    const centerY = h / 2;

    // Background fills and stage effects
    const frameWidth = w * 0.72;
    const frameHeight = h * 0.72;
    const frameX = centerX - frameWidth / 2;
    const frameY = centerY - frameHeight / 2 + (labelType === 'pill' || labelType === 'bubble' ? h * 0.04 : (labelType === 'banner' || labelType === 'flag' || labelType === 'tag' ? -h * 0.04 : 0));

    // Draw Frame Container with specific shapes
    ctx.save();

    // Effects: Glow, Double border, Lift, Rainbow
    if (extra.includes('glow')) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = w * 0.08;
    } else if (extra.includes('lift')) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.20)';
      ctx.shadowBlur = w * 0.04;
      ctx.shadowOffsetX = w * 0.03;
      ctx.shadowOffsetY = w * 0.035;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = w * 0.03;
      ctx.shadowOffsetY = w * 0.015;
    }

    // Draw Frame Background (Gradient or solid)
    parseBackground(ctx, template.background || '#ffffff', frameX, frameY, frameWidth, frameHeight);

  // Path by shape
  ctx.beginPath();
  let frameRadius = 0;
  if (shape === 'sharp') {
    frameRadius = 0;
    drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, 0);
  } else if (shape === 'soft') {
    frameRadius = frameWidth * 0.10;
    drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, frameRadius);
  } else if (shape === 'round') {
    frameRadius = frameWidth * 0.20;
    drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, frameRadius);
  } else if (shape === 'circle') {
    ctx.arc(centerX, frameY + frameHeight / 2, frameWidth / 2, 0, Math.PI * 2);
  } else if (shape === 'arch') {
    const rTop = frameWidth * 0.36;
    const rBot = frameWidth * 0.06;
    ctx.moveTo(frameX + rTop, frameY);
    ctx.lineTo(frameX + frameWidth - rTop, frameY);
    ctx.arcTo(frameX + frameWidth, frameY, frameX + frameWidth, frameY + rTop, rTop);
    ctx.lineTo(frameX + frameWidth, frameY + frameHeight - rBot);
    ctx.arcTo(frameX + frameWidth, frameY + frameHeight, frameX + frameWidth - rBot, frameY + frameHeight, rBot);
    ctx.lineTo(frameX + rBot, frameY + frameHeight);
    ctx.arcTo(frameX, frameY + frameHeight, frameX, frameY + frameHeight - rBot, rBot);
    ctx.lineTo(frameX, frameY + rTop);
    ctx.arcTo(frameX, frameY, frameX + rTop, frameY, rTop);
    ctx.closePath();
  } else if (shape === 'ticket') {
    const notchR = frameWidth * 0.08;
    const r = frameWidth * 0.07;
    ctx.moveTo(frameX + r, frameY);
    ctx.lineTo(frameX + frameWidth - r, frameY);
    ctx.arcTo(frameX + frameWidth, frameY, frameX + frameWidth, frameY + r, r);
    ctx.lineTo(frameX + frameWidth, frameY + frameHeight / 2 - notchR);
    ctx.arc(frameX + frameWidth, frameY + frameHeight / 2, notchR, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.lineTo(frameX + frameWidth, frameY + frameHeight - r);
    ctx.arcTo(frameX + frameWidth, frameY + frameHeight, frameX + frameWidth - r, frameY + frameHeight, r);
    ctx.lineTo(frameX + r, frameY + frameHeight);
    ctx.arcTo(frameX, frameY + frameHeight, frameX, frameY + frameHeight - r, r);
    ctx.lineTo(frameX, frameY + frameHeight / 2 + notchR);
    ctx.arc(frameX, frameY + frameHeight / 2, notchR, Math.PI * 0.5, Math.PI * 1.5, true);
    ctx.lineTo(frameX, frameY + r);
    ctx.arcTo(frameX, frameY, frameX + r, frameY, r);
    ctx.closePath();
  } else {
    frameRadius = frameWidth * 0.14;
    drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, frameRadius);
  }
  ctx.fill();

  // Border strokes if configured
  if (template.border) {
    ctx.lineWidth = Math.max(1.5, w * 0.006);
    if (extra.includes('dashed')) {
      ctx.setLineDash([w * 0.018, w * 0.012]);
    }
    ctx.strokeStyle = template.border.includes('#') ? template.border.match(/#[0-9a-fA-F]+/)[0] : accent;
    ctx.stroke();
  }
  ctx.restore();

  // Inner QR Card Box
  const qrBoxSize = shape === 'circle' || shape === 'hex' ? frameWidth * 0.62 : frameWidth * 0.70;
  const qrBoxX = centerX - qrBoxSize / 2;
  const qrBoxY = frameY + (frameHeight - qrBoxSize) / 2 + (labelType === 'banner' ? -frameHeight * 0.06 : (labelType === 'pill' ? frameHeight * 0.05 : 0));
  const qrBoxRadius = qrBoxSize * 0.12;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = w * 0.03;
  ctx.shadowOffsetY = w * 0.01;
  ctx.fillStyle = template.qrCard || '#ffffff';
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrBoxRadius);
  ctx.fill();
  ctx.restore();

  // Draw Labels / Badges (pill, bubble, banner, flag, tag, corner, side, script)
  ctx.save();
  const templateFontClean = options.templateFont ? options.templateFont.replace(/['"]/g, '').trim() : null;
  const labelWeight = (templateFontClean && SINGLE_WEIGHT_FONTS.has(templateFontClean)) ? 'normal' : '800';
  const labelFontSize = Math.round(w * 0.036);
  ctx.font = `${labelWeight} ${labelFontSize}px ${templateFontClean ? `"${templateFontClean}", ` : ''}'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const isShimmer = extra.includes('shimmer');
  const bgBadgeFill = isShimmer ? '#e9d68a' : labelBg;
  const fgBadgeText = isShimmer ? '#2a1e00' : labelFg;

  if (labelType === 'pill') {
    const pillW = frameWidth * 0.64;
    const pillH = frameHeight * 0.16;
    const pillX = centerX - pillW / 2;
    const pillY = frameY - pillH * 0.35;
    ctx.fillStyle = bgBadgeFill;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = w * 0.02;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, pillY + pillH / 2);
  } else if (labelType === 'bubble') {
    const bubW = frameWidth * 0.68;
    const bubH = frameHeight * 0.17;
    const bubX = centerX - bubW / 2;
    const bubY = frameY - bubH - h * 0.025;
    ctx.fillStyle = bgBadgeFill;
    drawRoundedRect(ctx, bubX, bubY, bubW, bubH, bubH * 0.3);
    ctx.fill();
    // Bubble pointer
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.02, bubY + bubH);
    ctx.lineTo(centerX + w * 0.02, bubY + bubH);
    ctx.lineTo(centerX, bubY + bubH + h * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, bubY + bubH / 2);
  } else if (labelType === 'banner') {
    const banW = frameWidth * 0.76;
    const banH = frameHeight * 0.16;
    const banX = centerX - banW / 2;
    const banY = frameY + frameHeight - banH * 1.15;
    ctx.fillStyle = bgBadgeFill;
    drawRoundedRect(ctx, banX, banY, banW, banH, banH * 0.35);
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, banY + banH / 2);
  } else if (labelType === 'flag') {
    const flagW = frameWidth;
    const flagH = frameHeight * 0.18;
    const flagX = frameX;
    const flagY = frameY + frameHeight + h * 0.01;
    ctx.fillStyle = bgBadgeFill;
    drawRoundedRect(ctx, flagX, flagY, flagW, flagH, 0);
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, flagY + flagH / 2);
  } else if (labelType === 'tag') {
    const tagW = frameWidth * 0.64;
    const tagH = frameHeight * 0.17;
    const tagX = centerX - tagW / 2;
    const tagY = frameY + frameHeight + h * 0.02;
    ctx.fillStyle = bgBadgeFill;
    // Tag pointer
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.02, tagY);
    ctx.lineTo(centerX + w * 0.02, tagY);
    ctx.lineTo(centerX, tagY - h * 0.015);
    ctx.closePath();
    ctx.fill();
    drawRoundedRect(ctx, tagX, tagY, tagW, tagH, tagH * 0.3);
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, tagY + tagH / 2);
  } else if (labelType === 'corner') {
    ctx.save();
    ctx.translate(frameX + frameWidth - w * 0.06, frameY + h * 0.06);
    ctx.rotate((40 * Math.PI) / 180);
    ctx.fillStyle = bgBadgeFill;
    const ribbonW = w * 0.28;
    const ribbonH = h * 0.06;
    ctx.fillRect(-ribbonW / 2, -ribbonH / 2, ribbonW, ribbonH);
    ctx.fillStyle = fgBadgeText;
    ctx.font = `${labelWeight} ${Math.round(w * 0.028)}px ${templateFontClean ? `"${templateFontClean}", ` : ''}'Inter', sans-serif`;
    ctx.fillText(labelText === 'SCAN ME' ? 'SCAN' : labelText, 0, 0);
    ctx.restore();
  } else if (labelType === 'side') {
    const sideW = w * 0.09;
    const sideH = frameHeight * 0.78;
    const sideX = frameX + frameWidth;
    const sideY = frameY + (frameHeight - sideH) / 2;
    ctx.fillStyle = bgBadgeFill;
    drawRoundedRect(ctx, sideX, sideY, sideW, sideH, sideW * 0.25);
    ctx.fill();
    ctx.save();
    ctx.translate(sideX + sideW / 2, sideY + sideH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = fgBadgeText;
    ctx.font = `${labelWeight} ${Math.round(w * 0.028)}px ${templateFontClean ? `"${templateFontClean}", ` : ''}'Inter', sans-serif`;
    ctx.fillText(labelText, 0, 0);
    ctx.restore();
  } else if (labelType === 'script') {
    // ── Script / Neon Callout typography label ─────────────────────────────
    const scriptY = frameY + frameHeight + h * 0.045;
    ctx.save();
    ctx.font = `${templateFontClean ? labelWeight : '700 italic'} ${Math.round(w * 0.042)}px ${templateFontClean ? `"${templateFontClean}", ` : ''}'Outfit', 'Montserrat', 'Inter', cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ambient glow for neon/script text
    ctx.shadowColor = accent || '#00eaff';
    ctx.shadowBlur = w * 0.025;
    ctx.fillStyle = labelFg || accent || '#ffffff';
    ctx.fillText(labelText, centerX, scriptY);
    ctx.restore();
  } else if (labelType !== 'none') {
    // ── Fallback for any other labelType: elegant pill badge ───────────────
    const pillW = frameWidth * 0.64;
    const pillH = frameHeight * 0.16;
    const pillX = centerX - pillW / 2;
    const pillY = frameY + frameHeight - pillH * 0.75;
    ctx.fillStyle = bgBadgeFill;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = w * 0.02;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = fgBadgeText;
    ctx.fillText(labelText, centerX, pillY + pillH / 2);
  }

    ctx.restore();
    ctx.restore();

    return { qrBoxX, qrBoxY, qrBoxSize };
  } catch (err) {
    console.error('Error drawing frame template:', err);
    ctx.restore();
    const fallbackSize = w * 0.50;
    return { qrBoxX: (w - fallbackSize) / 2, qrBoxY: (h - fallbackSize) / 2, qrBoxSize: fallbackSize };
  }
}

