export default function Slider({ label, value, onChange, onStart, onEnd, min = 0, max = 100, step = 1, unit = '' }) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {typeof value === 'number' ? (Math.round(value * 100) / 100) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={onStart}
        onMouseUp={onEnd}
        onTouchStart={onStart}
        onTouchEnd={onEnd}
      />
    </div>
  );
}
