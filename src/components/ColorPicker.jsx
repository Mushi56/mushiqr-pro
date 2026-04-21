import { useState, useEffect, useRef } from 'react';

export default function ColorPicker({ label, value, onChange, onOpenAdvanced, className = '' }) {
  const [localValue, setLocalValue] = useState(value);
  const nativeInputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(val)) {
      let fullHex = val;
      if (val.length === 4) {
        fullHex = '#' + val[1]+val[1] + val[2]+val[2] + val[3]+val[3];
      }
      onChange(fullHex);
    }
  };

  const handlePreviewClick = () => {
    // Only use advanced picker on mobile (screen width < 768px)
    if (window.innerWidth < 768 && onOpenAdvanced) {
      onOpenAdvanced(safeColor, onChange);
    } else {
      // On desktop, trigger the native color input
      nativeInputRef.current?.click();
    }
  };

  const safeColor = /^#[A-Fa-f0-9]{6}$/.test(localValue) ? localValue : '#000000';

  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="color-picker-group">
        <div 
          className="color-preview" 
          style={{ backgroundColor: safeColor, cursor: 'pointer' }}
          onClick={handlePreviewClick}
        >
          <input
            ref={nativeInputRef}
            type="color"
            value={safeColor}
            onChange={(e) => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, pointerEvents: 'none' }}
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


