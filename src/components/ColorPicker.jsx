import { useState, useEffect, useRef } from 'react';

export default function ColorPicker({ label, value, onChange, onOpenAdvanced, className = '' }) {
  const [localValue, setLocalValue] = useState(value);
  const nativeInputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextChange = (e) => {
    let val = e.target.value.trim();
    
    // Auto-prefix with # if missing for internal processing
    const internalVal = val.startsWith('#') ? val : '#' + val;
    setLocalValue(internalVal);
    
    // Regex to validate 3 or 6 digit hex
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(internalVal)) {
      let fullHex = internalVal;
      // Convert 3-digit to 6-digit hex if needed
      if (internalVal.length === 4) {
        fullHex = '#' + internalVal[1]+internalVal[1] + internalVal[2]+internalVal[2] + internalVal[3]+internalVal[3];
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
  const displayValue = localValue.replace('#', '');

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
          value={displayValue}
          onChange={handleTextChange}
          placeholder="FFFFFF"
          spellCheck={false}
          maxLength={7}
        />
      </div>
    </div>
  );
}


