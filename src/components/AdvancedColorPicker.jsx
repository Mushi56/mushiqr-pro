import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';

export default function AdvancedColorPicker({ isOpen, initialColor, onConfirm, onCancel }) {
  const [tempColor, setTempColor] = useState(initialColor || '#ff0000');
  const [activeTab, setActiveTab] = useState('RGB');
  
  const wheelRef = useRef(null);
  const diamondRef = useRef(null);
  const stateRef = useRef({ h: 0, s: 0, v: 0 });

  // Sync stateRef with current color
  useEffect(() => {
    if (isOpen) {
      setTempColor(initialColor);
      const rgb = hexToRgb(initialColor);
      stateRef.current = rgbToHsv(rgb.r, rgb.g, rgb.b);
    }
  }, [isOpen, initialColor]);

  // Helper to convert hex to RGB
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return { r, g, b };
  }

  // Helper to convert RGB to Hex
  function rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Helper to convert RGB to HSV
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
  }

  // Helper to convert HSV to RGB
  function hsvToRgb(h, s, v) {
    h /= 360; s /= 100; v /= 100;
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  const { r, g, b } = hexToRgb(tempColor);
  const { h, s, v } = stateRef.current;

  const handleHsvUpdate = (newH, newS, newV) => {
    stateRef.current = { h: newH, s: newS, v: newV };
    const rgb = hsvToRgb(newH, newS, newV);
    setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const onHueStart = (e) => {
    e.target.setPointerCapture(e.pointerId);
    const target = e.target;
    
    const handleMove = (moveEvent) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = moveEvent.clientX - centerX;
      const y = moveEvent.clientY - centerY;
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      handleHsvUpdate(angle, stateRef.current.s, stateRef.current.v);
    };
    
    const handleUp = (upEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleUp);
    };
    
    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleUp);
    handleMove(e);
  };

  const onSVStart = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    const target = e.target;
    
    const handleMove = (moveEvent) => {
      if (!diamondRef.current) return;
      const rect = diamondRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
      handleHsvUpdate(stateRef.current.h, x * 100, (1 - y) * 100);
    };
    
    const handleUp = (upEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleUp);
    };
    
    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleUp);
    handleMove(e);
  };

  if (!isOpen) return null;

  return (
    <div className="advanced-picker-overlay">
      <div className="advanced-picker-container">
        <header className="picker-header">
          <button className="picker-close" onClick={onCancel}><X size={20} /></button>
          <div className="picker-preview-dual">
            <div className="picker-preview-old" style={{ backgroundColor: initialColor }} />
            <div className="picker-preview-new" style={{ backgroundColor: tempColor }} />
          </div>
          <button className="picker-confirm" onClick={() => onConfirm(tempColor)}><Check size={20} /></button>
        </header>

        <div className="picker-wheel-area">
          <div className="picker-wheel-container">
            <div 
              ref={wheelRef}
              className="hue-wheel" 
              style={{ background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)' }}
              onPointerDown={onHueStart}
            >
              <div 
                className="hue-handle" 
                style={{ transform: `rotate(${h - 90}deg) translateX(99px)` }}
              />
              
              <div 
                ref={diamondRef}
                className="sv-diamond"
                style={{ backgroundColor: `hsl(${h}, 100%, 50%)` }}
                onPointerDown={onSVStart}
              >
                <div className="sv-gradient-white" />
                <div className="sv-gradient-black" />
                <div 
                  className="sv-handle"
                  style={{ left: `${s}%`, top: `${100 - v}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="picker-tabs">
          {['HSB', 'RGB'].map(tab => (
            <button 
              key={tab}
              className={`picker-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >{tab}</button>
          ))}
        </div>

        <div className="picker-sliders">
          {activeTab === 'RGB' ? (
            <>
              <RgbSlider label="R" value={r} onChange={(val) => {
                const rgb = { r: parseInt(val), g, b };
                setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
                stateRef.current = rgbToHsv(rgb.r, rgb.g, rgb.b);
              }} color="red" />
              <RgbSlider label="G" value={g} onChange={(val) => {
                const rgb = { r, g: parseInt(val), b };
                setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
                stateRef.current = rgbToHsv(rgb.r, rgb.g, rgb.b);
              }} color="green" />
              <RgbSlider label="B" value={b} onChange={(val) => {
                const rgb = { r, g, b: parseInt(val) };
                setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
                stateRef.current = rgbToHsv(rgb.r, rgb.g, rgb.b);
              }} color="blue" />
            </>
          ) : (
            <>
              <RgbSlider label="H" value={Math.round(h)} max={360} onChange={(val) => handleHsvUpdate(parseInt(val), s, v)} color="#fff" />
              <RgbSlider label="S" value={Math.round(s)} max={100} onChange={(val) => handleHsvUpdate(h, parseInt(val), v)} color="#fff" />
              <RgbSlider label="B" value={Math.round(v)} max={100} onChange={(val) => handleHsvUpdate(h, s, parseInt(val))} color="#fff" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RgbSlider({ label, value, max = 255, onChange, color }) {
  return (
    <div className="rgb-slider-row">
      <span className="rgb-label">{label}</span>
      <button className="rgb-step" onClick={() => onChange(Math.max(0, value - 1))}><Minus size={14} /></button>
      <div className="rgb-track-container">
        <input 
          type="range" 
          min="0" 
          max={max} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="rgb-range-input"
          style={{ '--slider-color': color }}
        />
      </div>
      <button className="rgb-step" onClick={() => onChange(Math.min(max, value + 1))}><Plus size={14} /></button>
      <span className="rgb-value">{value}</span>
    </div>
  );
}
