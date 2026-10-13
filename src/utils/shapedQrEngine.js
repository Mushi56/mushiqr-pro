// src/utils/shapedQrEngine.js
// Mathematical shape engine extracted directly from Round QR Template (4).html
// Supports: Circle and Organic Flower Blob shapes with automatic finder pattern fitting
// and edge-filling decorative dots compatible with all custom dot/eye styles.

/**
 * 240-point radius lookup table for the Organic Flower Blob shape
 * Extracted from Round QR Template (4).html
 */
export const FLOWER_BLOB_RADIUS_TABLE = [
  1.151, 1.152, 1.149, 1.145, 1.137, 1.127, 1.114, 1.1,   1.084, 1.067, 1.051, 1.035, 1.022, 1.01,  1.001, 0.993,
  0.989, 0.987, 0.986, 0.988, 0.991, 0.997, 1.003, 1.012, 1.021, 1.031, 1.042, 1.053, 1.063, 1.072, 1.078, 1.083,
  1.085, 1.086, 1.084, 1.079, 1.073, 1.066, 1.056, 1.046, 1.033, 1.019, 1.003, 0.987, 0.969, 0.95,  0.931, 0.911,
  0.893, 0.875, 0.859, 0.844, 0.832, 0.821, 0.811, 0.803, 0.797, 0.792, 0.788, 0.786, 0.785, 0.785, 0.787, 0.79,
  0.794, 0.801, 0.808, 0.818, 0.829, 0.842, 0.857, 0.874, 0.893, 0.912, 0.932, 0.952, 0.971, 0.989, 1.005, 1.019,
  1.032, 1.044, 1.055, 1.064, 1.073, 1.081, 1.089, 1.096, 1.102, 1.108, 1.113, 1.118, 1.121, 1.124, 1.127, 1.128,
  1.129, 1.129, 1.128, 1.126, 1.124, 1.121, 1.116, 1.111, 1.105, 1.097, 1.089, 1.078, 1.066, 1.053, 1.039, 1.025,
  1.011, 0.997, 0.983, 0.971, 0.96,  0.949, 0.941, 0.934, 0.928, 0.925, 0.923, 0.923, 0.925, 0.929, 0.935, 0.943,
  0.954, 0.967, 0.982, 0.999, 1.018, 1.038, 1.058, 1.078, 1.097, 1.114, 1.127, 1.137, 1.143, 1.144, 1.141, 1.133,
  1.122, 1.107, 1.09,  1.072, 1.053, 1.034, 1.016, 0.997, 0.98,  0.963, 0.947, 0.933, 0.919, 0.907, 0.896, 0.886,
  0.878, 0.871, 0.865, 0.86,  0.857, 0.855, 0.855, 0.856, 0.859, 0.863, 0.868, 0.876, 0.884, 0.894, 0.905, 0.916,
  0.928, 0.941, 0.953, 0.966, 0.977, 0.988, 0.999, 1.008, 1.017, 1.025, 1.031, 1.037, 1.042, 1.045, 1.048, 1.05,
  1.05,  1.051, 1.05,  1.05,  1.049, 1.048, 1.046, 1.045, 1.042, 1.039, 1.036, 1.031, 1.025, 1.017, 1.008, 0.998,
  0.988, 0.976, 0.965, 0.954, 0.944, 0.935, 0.928, 0.922, 0.918, 0.916, 0.915, 0.915, 0.917, 0.92,  0.924, 0.929,
  0.936, 0.944, 0.953, 0.964, 0.976, 0.99,  1.007, 1.025, 1.045, 1.066, 1.085, 1.104, 1.119, 1.132, 1.141, 1.148
];

const TWO_PI = Math.PI * 2;

/**
 * Interpolate radius factor at angle `t` (radians)
 */
export function getBlobRadius(t) {
  t = ((t % TWO_PI) + TWO_PI) % TWO_PI;
  const f = (t / TWO_PI) * 240;
  const i = Math.floor(f);
  const u = f - i;
  return FLOWER_BLOB_RADIUS_TABLE[i % 240] * (1 - u) + FLOWER_BLOB_RADIUS_TABLE[(i + 1) % 240] * u;
}

/**
 * Optimal shape fitting algorithm from Round QR Template (4).html
 * Finds the scale `s` and center offset `(ox, oy)` such that all three
 * finder pattern corners (plus safety margin `m=0.8`) stay safely inside the boundary.
 */
export function fitShape(N, shapeType = 'flower_blob') {
  const h = N / 2;

  if (shapeType === 'circle') {
    const s = h * Math.SQRT2 + 1.5;
    return {
      s,
      ox: 0,
      oy: 0,
      R: s,
      V: s + 1.2
    };
  }

  // Flower blob fitting
  const m = 0.8;
  const pts = [];
  for (const [x0, y0] of [[-h, -h], [h - 7, -h], [-h, h - 7]]) {
    for (let k = 0; k <= 8; k++) {
      const u = -m + (k * (7 + 2 * m)) / 8;
      for (const v of [-m, 7 + m]) {
        pts.push([x0 + u, y0 + v], [x0 + v, y0 + u]);
      }
    }
  }

  for (let s = N * 0.45; s < N * 1.3; s += 0.1) {
    let best = null;
    let bd = 1e9;
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        const ox = i * 0.025 * s;
        const oy = j * 0.025 * s;
        const fitsAll = pts.every(([x, y]) => {
          const angle = Math.atan2(y - oy, x - ox);
          return Math.hypot(x - ox, y - oy) <= s * getBlobRadius(angle);
        });

        if (fitsAll) {
          const d = ox * ox + oy * oy;
          if (d < bd) {
            bd = d;
            best = [ox, oy];
          }
        }
      }
    }
    if (best) {
      const finalS = s * 1.02;
      const R = finalS * 1.16 + Math.hypot(best[0], best[1]);
      return {
        s: finalS,
        ox: best[0],
        oy: best[1],
        R,
        V: R + 1.2
      };
    }
  }

  return { s: N, ox: 0, oy: 0, R: N * 1.16, V: N * 1.16 + 1.2 };
}

/**
 * Check if coordinate (x, y) is in the quiet safety zone around any of the 3 finder pattern eyes
 */
export function isNearFinderEye(x, y, h) {
  return [[-h, -h], [h - 7, -h], [-h, h - 7]].some(
    ([a, b]) => x > a - 1 && x < a + 8 && y > b - 1 && y < b + 8
  );
}

/**
 * Builds the smooth 240-point closed shape path on canvas
 */
export function buildShapePath(ctx, shapeType, F, centerX, centerY, cellSize) {
  ctx.beginPath();
  const isBlob = shapeType === 'flower_blob';
  for (let i = 0; i <= 240; i++) {
    const t = (i / 240) * TWO_PI;
    const r = isBlob ? F.s * getBlobRadius(t) : F.s;
    const px = centerX + (F.ox + r * Math.cos(t)) * cellSize;
    const py = centerY + (F.oy + r * Math.sin(t)) * cellSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * Returns SVG path string for export
 */
export function getShapeSvgPath(shapeType, F, centerX, centerY, cellSize) {
  const isBlob = shapeType === 'flower_blob';
  const pts = [];
  for (let i = 0; i < 240; i++) {
    const t = (i / 240) * TWO_PI;
    const r = isBlob ? F.s * getBlobRadius(t) : F.s;
    const px = (centerX + (F.ox + r * Math.cos(t)) * cellSize).toFixed(2);
    const py = (centerY + (F.oy + r * Math.sin(t)) * cellSize).toFixed(2);
    pts.push(`${px} ${py}`);
  }
  return `M${pts.join('L')}Z`;
}

/**
 * Generate decorative filler dots around the edges of the shape
 * Matches the pseudo-random density algorithm in Round QR Template (4).html
 */
export function getDecorativeFillerDots(N, shapeType, F, cleanEdges = true) {
  const h = N / 2;
  const isBlob = shapeType === 'flower_blob';
  const dots = [];
  const K = Math.ceil(F.R - h) + 1;

  const inS = (x, y) => {
    const angle = Math.atan2(y - F.oy, x - F.ox);
    const boundaryRadius = isBlob ? F.s * getBlobRadius(angle) : F.s;
    return Math.hypot(x - F.ox, y - F.oy) <= boundaryRadius;
  };

  for (let r = -K; r < N + K; r++) {
    for (let c = -K; c < N + K; c++) {
      const x = c + 0.5 - h;
      const y = r + 0.5 - h;

      // Skip inner module grid (real QR code modules handle this)
      if (Math.abs(x) < h && Math.abs(y) < h) continue;

      // Keep quiet zones around the 3 eyes completely clear
      if (isNearFinderEye(x, y, h)) continue;

      // Clean edges: every single corner of the 1x1 module box MUST be strictly inside the shape
      // This ensures no dot is cropped or sliced in half by the boundary!
      if (cleanEdges) {
        const allCornersIn = [
          [0.5, 0.5],
          [-0.5, 0.5],
          [0.5, -0.5],
          [-0.5, -0.5]
        ].every(([a, b]) => inS(x + a, y + b));
        if (!allCornersIn) continue;
      } else {
        const dist = Math.hypot(x - F.ox, y - F.oy);
        const angle = Math.atan2(y - F.oy, x - F.ox);
        const boundaryRadius = isBlob ? F.s * getBlobRadius(angle) : F.s;
        if (dist > boundaryRadius + 0.5) continue;
      }

      // Deterministic hash function for ~50% density filler dots
      const hash = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
      if (hash - Math.floor(hash) < 0.5) {
        dots.push({ r, c, x, y });
      }
    }
  }

  return dots;
}
