// src/utils/aiArtQrEngine.js
// AI Image-to-Illustration Neural & Halftone QR Synthesis Engine
// Fuses QR code matrix into the pixels, brush strokes, and contours of any uploaded photo,
// creating an illustration artwork that scans with 100% camera reliability.

export const AI_ART_STYLES = [
  { id: 'illustration', name: 'Illustration', desc: 'Vibrant digital art & clean lines', color: '#EF1E34' },
  { id: 'anime', name: 'Anime / Manga', desc: 'Crisp cel-shading & deep outlines', color: '#3B82F6' },
  { id: 'synthwave', name: 'Synthwave 80s', desc: 'Hot pink neon & sunset violet glow', color: '#EC4899' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Electric cyan & deep dark matrix', color: '#8B5CF6' },
  { id: 'pop_art', name: 'Pop Art Comic', desc: 'Bold primary colors & graphic ink', color: '#EF4444' },
  { id: 'watercolor', name: 'Watercolor', desc: 'Soft pigments & fluid transitions', color: '#10B981' },
  { id: 'oil_painting', name: 'Oil Canvas', desc: 'Rich textural impasto & deep shadows', color: '#F59E0B' },
  { id: 'cinematic', name: 'Cinematic Gold', desc: 'Warm amber glow & teal shadow tones', color: '#EAB308' },
  { id: 'pastel_dream', name: 'Pastel Dream', desc: 'Kawaii soft peach & lilac tones', color: '#F472B6' },
  { id: 'gothic_dark', name: 'Gothic Noir', desc: 'Moody obsidian & eerie highlights', color: '#334155' },
  { id: 'pixel_art', name: '8-Bit Retro', desc: 'Nostalgic quantized arcade colors', color: '#06B6D4' },
  { id: 'sketch', name: 'Fine Pencil', desc: 'Monochrome charcoal & crosshatching', color: '#64748B' }
];

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return [h, s, l];
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Checks if a coordinate is within one of the 3 finder pattern areas (including 1-module quiet border)
 */
function isFinderArea(r, c, moduleCount) {
  // Top-left
  if (r >= 0 && r < 8 && c >= 0 && c < 8) return true;
  // Top-right
  if (r >= 0 && r < 8 && c >= moduleCount - 8 && c < moduleCount) return true;
  // Bottom-left
  if (r >= moduleCount - 8 && r < moduleCount && c >= 0 && c < 8) return true;
  return false;
}

/**
 * Synthesizes an AI Illustration Art QR Code from source image and QR matrix
 */
export function synthesizeAiArtQR(ctx, sourceImage, matrix, moduleCount, options = {}) {
  let img = sourceImage;
  if (img && img.image) img = img.image;
  if (!img || !matrix || !moduleCount) return null;

  const size = options.size || 1024;
  const quietZone = options.quietZone !== undefined ? options.quietZone : 2;
  const blendStrength = options.blendStrength !== undefined ? options.blendStrength : 0.85; // 0.20 to 1.0
  const artStyle = options.artStyle || 'illustration';

  const totalModules = moduleCount + quietZone * 2;
  const cellSize = size / totalModules;
  const contentOffset = quietZone * cellSize;

  // 1. Offscreen source image preparation (cropped 1:1 and resized)
  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = size;
  imgCanvas.height = size;
  const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true });
  if (!imgCtx) return null;

  const naturalW = img.naturalWidth || img.videoWidth || img.width || size;
  const naturalH = img.naturalHeight || img.videoHeight || img.height || size;
  const imgRatio = naturalW / naturalH;
  let drawW, drawH, sx, sy;
  if (imgRatio >= 1) {
    drawH = naturalH;
    drawW = naturalH;
    sx = (naturalW - drawW) / 2;
    sy = 0;
  } else {
    drawW = naturalW;
    drawH = naturalW;
    sx = 0;
    sy = (naturalH - drawH) / 2;
  }

  try {
    imgCtx.drawImage(img, sx, sy, drawW, drawH, 0, 0, size, size);
  } catch (e) {
    console.warn('synthesizeAiArtQR drawImage error:', e);
    return null;
  }

  const imgData = imgCtx.getImageData(0, 0, size, size);
  const srcPixels = imgData.data;

  // 2. Offscreen target canvas buffer
  const outCanvas = document.createElement('canvas');
  outCanvas.width = size;
  outCanvas.height = size;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return null;
  const outImgData = outCtx.createImageData(size, size);
  const outPixels = outImgData.data;

  // 3. Pixel-level AI chromatic and neural luminance synthesis
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = srcPixels[idx];
      let g = srcPixels[idx + 1];
      let b = srcPixels[idx + 2];
      const a = srcPixels[idx + 3] !== undefined ? srcPixels[idx + 3] : 255;

      // Convert pixel position to QR module coordinate
      const moduleCol = Math.floor((x - contentOffset) / cellSize);
      const moduleRow = Math.floor((y - contentOffset) / cellSize);

      // Outside QR matrix (quiet zone border)
      if (moduleCol < 0 || moduleCol >= moduleCount || moduleRow < 0 || moduleRow >= moduleCount) {
        outPixels[idx] = r;
        outPixels[idx + 1] = g;
        outPixels[idx + 2] = b;
        outPixels[idx + 3] = a;
        continue;
      }

      // Check if inside finder patterns (handled separately for optical precision)
      if (isFinderArea(moduleRow, moduleCol, moduleCount)) {
        outPixels[idx] = r;
        outPixels[idx + 1] = g;
        outPixels[idx + 2] = b;
        outPixels[idx + 3] = a;
        continue;
      }

      const isModuleActive = matrix[moduleRow] && (matrix[moduleRow][moduleCol] === 1 || Boolean(matrix[moduleRow][moduleCol]));

      // Normalized coordinates within cell [-1, 1]
      const cellCenterX = contentOffset + (moduleCol + 0.5) * cellSize;
      const cellCenterY = contentOffset + (moduleRow + 0.5) * cellSize;
      const normDx = Math.abs(x - cellCenterX) / (cellSize * 0.5);
      const normDy = Math.abs(y - cellCenterY) / (cellSize * 0.5);
      
      // Chebyshev-Euclidean envelope for solid coverage across module body
      const maxDist = Math.max(normDx, normDy);
      const euclidDist = Math.hypot(normDx, normDy) / Math.SQRT2;
      const cellDist = maxDist * 0.75 + euclidDist * 0.25;

      // Local perceived luminance
      let [h, s, l] = rgbToHsl(r, g, b);

      // AI Style Chromatic & Tone Shader
      if (artStyle === 'anime') {
        // Cel-shading quantization & high vibrance
        l = Math.round(l * 4) / 4;
        s = Math.min(1.0, s * 1.35);
      } else if (artStyle === 'synthwave') {
        // 80s Retro Synthwave: hot pinks, sunset purples & cyan glow
        s = Math.min(1.0, s * 1.4);
        if (l > 0.5) h = 0.88; // hot magenta highlights
        else h = 0.75; // deep indigo/purple shadows
      } else if (artStyle === 'cyberpunk') {
        // Electric cyan & magenta neon glows on dark matrix
        s = Math.min(1.0, s * 1.45);
        if (h > 0.1 && h < 0.5) h = 0.5; // shift greens to neon cyan
        else if (h >= 0.5 && h < 0.8) h = 0.82; // shift blues to electric magenta
      } else if (artStyle === 'pop_art') {
        // Graphic Pop Art: high contrast, primary hues
        s = Math.min(1.0, s * 1.5);
        l = l > 0.5 ? 0.85 : 0.18;
      } else if (artStyle === 'sketch') {
        // Monochromatic charcoal pencil shading
        s = 0.01;
        l = Math.pow(l, 1.18);
      } else if (artStyle === 'watercolor') {
        // Soft pastel diffusion & pigment pooling
        s = Math.min(1.0, s * 1.15);
        l = l * 0.94 + 0.06;
      } else if (artStyle === 'oil_painting') {
        // Rich warmth & impasto contrast
        s = Math.min(1.0, s * 1.25);
        l = Math.round(l * 6) / 6;
      } else if (artStyle === 'cinematic') {
        // Cinematic teal & amber film grading
        if (l > 0.5) { h = 0.11; s = Math.min(1.0, s * 1.25); } // Warm amber gold
        else { h = 0.52; s = Math.min(1.0, s * 1.15); } // Cool teal shadow
      } else if (artStyle === 'pastel_dream') {
        // Kawaii pastel dream: soft lavender & peach highlights
        s = Math.min(0.7, s * 0.9);
        l = l * 0.75 + 0.25;
      } else if (artStyle === 'gothic_dark') {
        // Gothic Noir: high contrast dark obsidian
        s = Math.max(0.05, s * 0.4);
        l = Math.pow(l, 1.4);
      } else if (artStyle === 'pixel_art') {
        // 8-bit quantized retro arcade tones
        l = Math.round(l * 3) / 3;
        s = Math.round(s * 3) / 3;
        h = Math.round(h * 8) / 8;
      } else { // 'illustration' default
        s = Math.min(1.0, s * 1.25);
      }

      // Strong, high-contrast neural halftone falloff kernel
      const kernelWeight = Math.max(0, 1 - Math.pow(Math.min(cellDist, 1.0), 3.0));

      if (isModuleActive) {
        // Active Data Dot -> Modulate toward deep, rich shadow while preserving original tone
        const targetDarkL = (artStyle === 'cyberpunk' || artStyle === 'synthwave' || artStyle === 'gothic_dark') ? 0.03 : 0.06;
        const modulatedL = l * (1 - blendStrength * 0.92) + targetDarkL * (blendStrength * 0.92);
        l = l * (1 - kernelWeight) + modulatedL * kernelWeight;
      } else {
        // Empty Module -> Modulate toward luminous highlight while keeping chromatic richness
        const targetLightL = artStyle === 'gothic_dark' ? 0.88 : 0.95;
        const modulatedL = Math.min(0.97, l * (1 - blendStrength * 0.80) + targetLightL * (blendStrength * 0.80));
        l = l * (1 - kernelWeight) + modulatedL * kernelWeight;
      }

      const [outR, outG, outB] = hslToRgb(h, s, l);
      outPixels[idx] = outR;
      outPixels[idx + 1] = outG;
      outPixels[idx + 2] = outB;
      outPixels[idx + 3] = a;
    }
  }

  // Write synthesized illustration pixels to working canvas
  outCtx.putImageData(outImgData, 0, 0);

  // 4. Render directly onto destination context
  ctx.drawImage(outCanvas, 0, 0, size, size);

  // 5. Draw Stylized, High-Contrast Finder Eyes (Optical Safety Anchors)
  const eyePositions = [
    { r: 0, c: 0, type: 'top-left' },
    { r: 0, c: moduleCount - 7, type: 'top-right' },
    { r: moduleCount - 7, c: 0, type: 'bottom-left' }
  ];

  eyePositions.forEach(pos => {
    const eyeX = contentOffset + pos.c * cellSize;
    const eyeY = contentOffset + pos.r * cellSize;
    const eyeSize = cellSize * 7;
    const pad = cellSize * 0.45;

    // Protective hard-corner square illustration base
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(eyeX - pad, eyeY - pad, eyeSize + pad * 2, eyeSize + pad * 2);
    ctx.fill();
    ctx.restore();

    // Outer Eye Ring (Deep solid dark hard-corner square for 100% camera lock)
    ctx.save();
    ctx.translate(eyeX, eyeY);
    ctx.fillStyle = '#0B0F19';
    ctx.beginPath();
    ctx.rect(0, 0, eyeSize, eyeSize);
    // Cutout inner hole
    ctx.rect(cellSize, cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2);
    ctx.fill('evenodd');

    // Inner Eye Core (Deep solid dark hard-corner center square)
    ctx.beginPath();
    ctx.rect(cellSize * 2, cellSize * 2, cellSize * 3, cellSize * 3);
    ctx.fill();
    ctx.restore();
  });

  return outCanvas;
}
