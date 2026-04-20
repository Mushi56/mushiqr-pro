import { useState, useEffect } from 'react';

export default function ColorPicker({ label, value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    
    // Only trigger onChange if it's a valid hex code (3 or 6 chars + #)
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(val)) {
      let fullHex = val;
      if (val.length === 4) {
        fullHex = '#' + val[1]+val[1] + val[2]+val[2] + val[3]+val[3];
      }
      onChange(fullHex);
    }
  };

  const handleColorChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  // Safe color for the HTML color input: must be 7-char valid hex, else default to #000000
  const safeColor = /^#[A-Fa-f0-9]{6}$/.test(localValue) ? localValue : '#000000';

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="color-picker-group">
        <div className="color-preview" style={{ backgroundColor: safeColor }}>
          <input
            type="color"
            value={safeColor}
            onChange={handleColorChange}
          />
        </div>
        <input
          className="color-hex"
          type="text"
          value={localValue}
          onChange={handleTextChange}
          spellCheck={false}
          maxLength={7}
        />
      </div>
    </div>
  );
}
