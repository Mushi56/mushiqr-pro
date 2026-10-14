import Toggle from './Toggle';

const OPTIONS = [
  {
    key: 'clean',
    label: 'Clean Edges',
    hint: 'Never crop decorative dots at the outline',
  },
  {
    key: 'decor',
    label: 'Decorative Dots',
    hint: 'Scatter dots around the code to fill the shape',
  },
  {
    key: 'outline',
    label: 'Outline',
    hint: 'Draw a line around the shape in the QR color',
  },
];

/**
 * Option toggles for shaped QR codes (Paper Frame, Torn Paper, Flower Blob, Round Burst).
 * Uses the app's standard Toggle so it matches the rest of the Background section.
 */
export default function ShapedQrOptions({ opts, onChange }) {
  const set = (key, value) => onChange({ ...opts, [key]: value });

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '10px 12px',
        borderRadius: '14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px',
        }}
      >
        Shape Options
      </div>
      {OPTIONS.map((o) => (
        <div key={o.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Toggle label={o.label} checked={!!opts[o.key]} onChange={(v) => set(o.key, v)} />
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '-4px', paddingBottom: '4px' }}>
            {o.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
