import { useState, useEffect, useRef } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';

export default function AdvancedColorPicker({ isOpen, initialColor, onConfirm, onCancel }) {
  const [color, setColor] = useState(initialColor || '#ff0000');
  const [tempColor, setTempColor] = useState(initialColor || '#ff0000');
  const [activeTab, setActiveTab] = useState('RGB'); // 'HSB' or 'RGB'

  // Helper to convert hex to RGB
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return { r, g, b };
  };

  // Helper to convert RGB to Hex
  const rgbToHex = (r, g, b) => {
    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Helper to convert RGB to HSV
  const rgbToHsv = (r, g, b) => {
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
  };

  // Helper to convert HSV to RGB
  const hsvToRgb = (h, s, v) => {
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
  };

  const { r, g, b } = hexToRgb(tempColor);
  const { h, s, v } = rgbToHsv(r, g, b);

  const handleRgbChange = (channel, val) => {
    const newRgb = { r, g, b, [channel]: parseInt(val) || 0 };
    setTempColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHsvChange = (hue, sat, val) => {
    const newRgb = hsvToRgb(hue, sat, val);
    setTempColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  if (!isOpen) return null;

  return (
    <div className="advanced-picker-overlay">
      <div className="advanced-picker-container">
        {/* Header */}
        <header className="picker-header">
          <button className="picker-close" onClick={onCancel}><X size={24} /></button>
          <div className="picker-preview-dual">
            <div className="picker-preview-old" style={{ backgroundColor: initialColor }} />
            <div className="picker-preview-new" style={{ backgroundColor: tempColor }} />
          </div>
          <button className="picker-confirm" onClick={() => onConfirm(tempColor)}><Check size={24} /></button>
        </header>

        {/* Color Wheel Section */}
        <div className="picker-wheel-area">
          <div className="picker-wheel-container">
            {/* Hue Wheel */}
            <div 
              className="hue-wheel" 
              style={{ background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                if (angle < 0) angle += 360;
                handleHsvChange(angle, s, v);
              }}
            >
              <div 
                className="hue-handle" 
                style={{ transform: `rotate(${h - 90}deg) translateX(90px)` }}
              />
              
              {/* Saturation/Value Diamond */}
              <div 
                className="sv-diamond"
                style={{ backgroundColor: `hsl(${h}, 100%, 50%)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width;
                  const y = (e.clientY - rect.top) / rect.height;
                  // Simplified diamond math: diamond is square rotated 45deg
                  // We'll treat it as a square for simplicity in this version
                  handleHsvChange(h, x * 100, (1 - y) * 100);
                }}
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

        {/* Tabs */}
        <div className="picker-tabs">
          <button 
            className={`picker-tab-btn ${activeTab === 'HSB' ? 'active' : ''}`}
            onClick={() => setActiveTab('HSB')}
          >HSB</button>
          <button 
            className={`picker-tab-btn ${activeTab === 'RGB' ? 'active' : ''}`}
            onClick={() => setActiveTab('RGB')}
          >RGB</button>
        </div>

        {/* Sliders Area */}
        <div className="picker-sliders">
          {activeTab === 'RGB' ? (
            <>
              <RgbSlider label="R" value={r} onChange={(v) => handleRgbChange('r', v)} color="red" />
              <RgbSlider label="G" value={g} onChange={(v) => handleRgbChange('g', v)} color="green" />
              <RgbSlider label="B" value={b} onChange={(v) => handleRgbChange('b', v)} color="blue" />
            </>
          ) : (
            <>
              <RgbSlider label="H" value={Math.round(h)} max={360} onChange={(v) => handleHsvChange(v, s, v)} color="#fff" />
              <RgbSlider label="S" value={Math.round(s)} max={100} onChange={(v) => handleHsvChange(h, v, v)} color="#fff" />
              <RgbSlider label="B" value={Math.round(v)} max={100} onChange={(v) => handleHsvChange(h, s, v)} color="#fff" />
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
