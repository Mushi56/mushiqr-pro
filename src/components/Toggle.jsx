export default function Toggle({ label, checked, onChange }) {
  return (
    <div className="toggle-group">
      <span className="form-label">{label}</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}
