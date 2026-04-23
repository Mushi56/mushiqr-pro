import { useState, useEffect, useRef } from 'react';

export default function ColorPicker({ label, value, onChange, onOpenAdvanced, className = '', disabled = false, isSwatch = false, icon: Icon }) {
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

  // Helper for contrast
  const isLight = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };
  const iconColor = isLight(safeColor) ? '#000000' : '#ffffff';

  if (isSwatch) {
    return (
      <div 
        className={`swatch-item color-picker-swatch ${className} ${disabled ? 'disabled' : ''}`}
        style={{ 
          backgroundColor: safeColor, 
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'sticky',
          left: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}
        onClick={handlePreviewClick}
      >
        {Icon && <Icon size={20} color={iconColor} style={{ opacity: 0.9 }} />}
        {!disabled && (
          <input
            ref={nativeInputRef}
            type="color"
            value={safeColor}
            onChange={(e) => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, pointerEvents: 'none' }}
          />
        )}
        <div className="swatch-indicator-picker" />
      </div>
    );
  }

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
            filter: disabled ? 'grayscale(0.5)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handlePreviewClick}
        >
          {Icon && <Icon size={20} color={iconColor} />}
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
