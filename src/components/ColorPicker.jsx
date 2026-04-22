import { useState, useEffect, useRef } from 'react';

export default function ColorPicker({ label, value, onChange, onOpenAdvanced, className = '', disabled = false }) {
  const [localValue, setLocalValue] = useState(value);
  const nativeInputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handlePreviewClick = () => {
    if (disabled) return;
    
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
    <div className={`form-group ${className} ${disabled ? 'disabled' : ''}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="color-picker-group">
        <div 
          className={`color-preview ${disabled ? 'disabled' : ''}`}
          style={{ 
            backgroundColor: safeColor, 
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: '100%',
            height: '44px',
            borderRadius: '12px',
            opacity: disabled ? 0.4 : 1,
            filter: disabled ? 'grayscale(0.5)' : 'none'
          }}
          onClick={handlePreviewClick}
        >
          {!disabled && (
            <input
              ref={nativeInputRef}
              type="color"
              value={safeColor}
              onChange={(e) => onChange(e.target.value)}
              style={{ opacity: 0, position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
