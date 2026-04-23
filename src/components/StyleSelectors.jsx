import { DOT_STYLES, EYE_STYLES } from '../utils/qrEngine';

const DOT_PREVIEWS = {
  [DOT_STYLES.SQUARE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.ROUNDED]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" rx="6" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DOTS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.CLASSY]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" rx="12" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DIAMOND]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 26,14 14,26 2,14" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.STAR]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 18,10 26,10 20,16 22,25 14,20 6,25 8,16 2,10 10,10" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.TRIANGLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 26,26 2,26" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.HEART]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 26s-12-7.5-12-14.5a6.5 6.5 0 0 1 12-3.5 6.5 6.5 0 0 1 12 3.5c0 7-12 14.5-12 14.5z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.OCTAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="9,2 19,2 26,9 26,19 19,26 9,26 2,19 2,9" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.PLUS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="11" y="2" width="6" height="24" fill="currentColor" />
      <rect x="2" y="11" width="24" height="6" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.CROSS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="11" y="2" width="6" height="24" fill="currentColor" transform="rotate(45 14 14)" />
      <rect x="2" y="11" width="24" height="6" fill="currentColor" transform="rotate(45 14 14)" />
    </svg>
  ),
  [DOT_STYLES.DENSO]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="0" y="0" width="28" height="28" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.EXTRA_ROUNDED]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" rx="10" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.LEAF]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2 H26 V14 Q26 26 14 26 H2 V14 Q2 2 14 2 Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.FLUID]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M4 14 a10 10 0 0 1 10 -10 v20 a10 10 0 0 1 -10 -10 M14 4 h4 a10 10 0 0 1 0 20 h-4 Z" fill="currentColor" />
    </svg>
  ),
};

const EYE_PREVIEWS = {
  [EYE_STYLES.SQUARE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="9" y="9" width="10" height="10" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.ROUNDED]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="9" y="9" width="10" height="10" rx="3" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.CIRCLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.LEAF]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M3 3 L20 3 Q25 3 25 8 L25 25 L8 25 Q3 25 3 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="9" y="9" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.FLOWER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2 a3 3 0 0 1 3 3 v4 a3 3 0 0 1 -6 0 v-4 a3 3 0 0 1 3 -3 M26 14 a3 3 0 0 1 -3 3 h-4 a3 3 0 0 1 0 -6 h4 a3 3 0 0 1 3 3 M14 26 a3 3 0 0 1 -3 -3 v-4 a3 3 0 0 1 6 0 v4 a3 3 0 0 1 -3 3 M2 14 a3 3 0 0 1 3 -3 h4 a3 3 0 0 1 0 6 h-4 a3 3 0 0 1 -3 -3" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.SHIELD]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M2 3 h24 v10 q0 10 -12 13 q-12 -3 -12 -13 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.OCTAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="9,1 19,1 27,9 27,19 19,27 9,27 1,19 1,9" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.DIAMOND]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,1 27,14 14,27 1,14" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="10" width="8" height="8" transform="rotate(45 14 14)" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.HEXAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,1 26,7 26,21 14,27 2,21 2,7" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.STAR]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 1 L18 10 L27 10 L20 16 L23 25 L14 20 L5 25 L8 16 L1 10 L10 10 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="14" r="4" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.HEART]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 26s-12-7.5-12-14.5a6.5 6.5 0 0 1 12-3.5 6.5 6.5 0 0 1 12 3.5c0 7-12 14.5-12 14.5z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="14" r="4" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.TRIANGLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 26,25 2,25" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="17" r="4" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.GEOMETRIC]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M2 2 L26 2 L26 10 L18 10 L18 18 L10 18 L10 26 L2 26 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="8" y="8" width="6" height="6" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.MODERN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="6" width="16" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="10" width="8" height="8" rx="0.5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.LCD]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M4 2h20M26 4v20M24 26H4M2 24V4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="5 3" />
      <rect x="9" y="9" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  ),
};

export function DotStyleSelector({ value, onChange }) {
  return (
    <div className="style-grid">
      {Object.entries(DOT_PREVIEWS).map(([style, preview]) => (
        <button
          key={style}
          className={`style-option ${value === style ? 'active' : ''}`}
          onClick={() => onChange(style)}
          title={style}
        >
          <div className="style-option-preview">{preview}</div>
        </button>
      ))}
    </div>
  );
}

export function EyeStyleSelector({ value, onChange }) {
  return (
    <div className="style-grid">
      {Object.entries(EYE_PREVIEWS).map(([style, preview]) => (
        <button
          key={style}
          className={`style-option ${value === style ? 'active' : ''}`}
          onClick={() => onChange(style)}
          title={style}
        >
          <div className="style-option-preview">{preview}</div>
        </button>
      ))}
    </div>
  );
}
