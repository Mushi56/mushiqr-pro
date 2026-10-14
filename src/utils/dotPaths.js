// SVG-path based dot shapes (ported from the Mushi QR Pro "Dots & Eyes" reference).
// Each shape returns an SVG path "d" string in module units (1 module = 1x1).
// n = { L, R, U, D } -> neighbour in that direction is dark.

const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`;

const rr = (x, y, w, h, r) => {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  return `M${x + a} ${y}H${x + w - b}${b ? `A${b} ${b} 0 0 1 ${x + w} ${y + b}` : ''}V${y + h - c}${c ? `A${c} ${c} 0 0 1 ${x + w - c} ${y + h}` : ''}H${x + d}${d ? `A${d} ${d} 0 0 1 ${x} ${y + h - d}` : ''}V${y + a}${a ? `A${a} ${a} 0 0 1 ${x + a} ${y}` : ''}Z`;
};

const star = (cx, cy, R, r) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const k = i % 2 ? r : R;
    p.push((cx + k * Math.cos(a)).toFixed(2) + ' ' + (cy + k * Math.sin(a)).toFixed(2));
  }
  return 'M' + p.join('L') + 'Z';
};

const dia = (x, y, w) => `M${x + w / 2} ${y}L${x + w} ${y + w / 2}L${x + w / 2} ${y + w}L${x} ${y + w / 2}Z`;

// Keys match DOT_STYLES values used by the app.
export const DOT_PATHS = {
  square: (x, y) => `M${x} ${y}h1v1h-1z`,
  rounded: (x, y) => rr(x, y, 1, 1, 0.3),
  dots: (x, y) => circ(x + 0.5, y + 0.5, 0.5),
  small: (x, y) => circ(x + 0.5, y + 0.5, 0.32),
  diamond: (x, y) => dia(x, y, 1),
  star: (x, y) => star(x + 0.5, y + 0.5, 0.64, 0.3),
  heart: (x, y) => `M${x + 0.5} ${y + 0.92}C${x + 0.1} ${y + 0.6} ${x} ${y + 0.35} ${x + 0.15} ${y + 0.2}C${x + 0.3} ${y + 0.05} ${x + 0.45} ${y + 0.15} ${x + 0.5} ${y + 0.3}C${x + 0.55} ${y + 0.15} ${x + 0.7} ${y + 0.05} ${x + 0.85} ${y + 0.2}C${x + 1} ${y + 0.35} ${x + 0.9} ${y + 0.6} ${x + 0.5} ${y + 0.92}Z`,
  plus: (x, y) => `M${x + 0.35} ${y}h.3v.35h.35v.3h-.35v.35h-.3v-.35h-.35v-.3h.35Z`,
  classy: (x, y) => `M${x + 0.45} ${y}H${x + 1}V${y + 0.55}A.45 .45 0 0 1 ${x + 0.55} ${y + 1}H${x}V${y + 0.45}A.45 .45 0 0 1 ${x + 0.45} ${y}Z`,
  liquid: (x, y, n = {}) => rr(x, y, 1, 1, 0.5) + (n.R ? `M${x + 0.5} ${y}h1v1h-1z` : '') + (n.D ? `M${x} ${y + 0.5}h1v1h-1z` : ''),
  hbar: (x, y, n = {}) => rr(x - (n.L ? 0.4 : 0), y + 0.15, 1 + (n.L ? 0.4 : 0) + (n.R ? 0.4 : 0), 0.7, 0.35),
  vbar: (x, y, n = {}) => rr(x + 0.15, y - (n.U ? 0.4 : 0), 0.7, 1 + (n.U ? 0.4 : 0) + (n.D ? 0.4 : 0), 0.35),
};

export const isPathDot = (style) => Object.prototype.hasOwnProperty.call(DOT_PATHS, style);

// Thumbnail sample pattern (identical to the reference sheet)
const THUMB_PATTERN = ['11010', '01111', '10110', '11011', '01101'];
const pdk = (r, c) => r >= 0 && c >= 0 && r < 5 && c < 5 && THUMB_PATTERN[r][c] === '1';

export function thumbnailPath(style) {
  const fn = DOT_PATHS[style];
  if (!fn) return '';
  let d = '';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (pdk(r, c)) d += fn(c, r, { L: pdk(r, c - 1), R: pdk(r, c + 1), U: pdk(r - 1, c), D: pdk(r + 1, c) });
    }
  }
  return d;
}
