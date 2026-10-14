// Geometry for shaped QR codes (Paper frame, Torn paper, Flower blob, Round circle).
// Ported from the Round QR Template reference. All units are QR modules, origin at QR center.
import { SHAPE_RADIAL_BLOB, SHAPE_RADIAL_TORN, SHAPE_RADIAL_PAPER } from './shapeRadials';

export const SHAPED_QR_IDS = ['paper', 'torn', 'blob', 'round'];
export const isShapedQr = (id) => SHAPED_QR_IDS.includes(id);

const PROFILES = {
  paper: SHAPE_RADIAL_PAPER,
  torn: SHAPE_RADIAL_TORN,
  blob: SHAPE_RADIAL_BLOB,
};

const TAU = 6.283185307;

function radial(t, B) {
  const n = B.length;
  t = ((t % TAU) + TAU) % TAU;
  const f = (t / TAU) * n;
  const i = Math.floor(f);
  const u = f - i;
  return B[i % n] * (1 - u) + B[(i + 1) % n] * u;
}

// Finds the smallest scale/offset so the three finder eyes sit fully inside the outline.
function fitShape(N, B) {
  const h = N / 2, m = 0.8, pts = [];
  for (const [x0, y0] of [[-h, -h], [h - 7, -h], [-h, h - 7]]) {
    for (let k = 0; k <= 8; k++) {
      const u = -m + (k * (7 + 2 * m)) / 8;
      for (const v of [-m, 7 + m]) pts.push([x0 + u, y0 + v], [x0 + v, y0 + u]);
    }
  }
  for (let s = N * 0.45; s < N * 1.3; s += 0.1) {
    let best = null, bd = 1e9;
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        const ox = i * 0.025 * s, oy = j * 0.025 * s;
        if (pts.every(([x, y]) => Math.hypot(x - ox, y - oy) <= s * radial(Math.atan2(y - oy, x - ox), B))) {
          const d = ox * ox + oy * oy;
          if (d < bd) { bd = d; best = [ox, oy]; }
        }
      }
    }
    if (best) return { s: s * 1.02, ox: best[0], oy: best[1] };
  }
  return { s: N, ox: 0, oy: 0 };
}

const cache = new Map();

/**
 * Builds the outline for a shaped QR.
 * Returns { ox, oy, rf(angle), points[360], R, V } in module units (V = half view size).
 */
export function buildQrShape(shapeId, N) {
  const key = shapeId + ':' + N;
  if (cache.has(key)) return cache.get(key);

  const h = N / 2;
  const isRound = shapeId === 'round';
  const B = PROFILES[shapeId] || SHAPE_RADIAL_BLOB;
  const F = isRound ? { s: h * Math.SQRT2 + 1.5, ox: 0, oy: 0 } : fitShape(N, B);
  const rf = isRound ? () => F.s : (t) => F.s * radial(t, B);
  const R = F.s * (isRound ? 1 : 1.22) + Math.hypot(F.ox, F.oy);
  const V = R + 1.2;

  const points = [];
  for (let i = 0; i < 360; i++) {
    const t = (i / 360) * 6.2832;
    const r = rf(t);
    points.push([F.ox + r * Math.cos(t), F.oy + r * Math.sin(t)]);
  }

  const result = { ox: F.ox, oy: F.oy, rf, points, R, V };
  cache.set(key, result);
  return result;
}

export function shapePath2D(shape) {
  const p = new Path2D();
  shape.points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

// Deterministic pseudo-random used to scatter decorative dots
export function decoHash(c, r) {
  const f = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
  return f - Math.floor(f);
}
