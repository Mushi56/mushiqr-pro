/**
 * ControlsPanel
 *
 * The left sidebar of the QR generator. Receives all QR configuration state
 * as props and fires setter callbacks — it owns zero state of its own,
 * which makes it trivially testable and replaceable.
 *
 * Props are grouped by concern:
 *   content  — qrType, qrData, setQrType, setQrData
 *   colors   — qrColor, bgColor, bgTransparent, gradientEnabled, …
 *   shapes   — dotStyle, eyeStyle, dotPadding, eyePadding, eyeColor, eyeOuterColor
 *   logo     — logo, logoSize, logoPadding, logoBackground, logoBgColor, …
 *   reliability — errorLevel, setErrorLevel
 *   presets  — activePreset, setActivePreset (drives the active-ring on swatches)
 */

import { Globe, Wifi, User, Palette, Wand2, Shapes, ShieldCheck, Image as ImageIcon, Frame } from 'lucide-react';
import Section from './components/Section';
import ColorPicker from './components/ColorPicker';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import LogoUpload from './components/LogoUpload';
import QRTypeSelector from './components/QRTypeSelector';
import QRDataInput from './components/QRDataInput';
import { DotStyleSelector, EyeStyleSelector } from './components/StyleSelectors';
import { QR_TYPES, FRAME_STYLES } from './utils/qrEngine';

// Color palette presets — defined here so they live alongside the UI that renders them.
// Previously in App.jsx they were a module-level constant mixed in with app state.
export const COLOR_PRESETS = [
  { name: 'Classic',  qr: '#000000', bg: '#ffffff' },
  { name: 'Midnight', qr: '#ffffff', bg: '#0a0a1a' },
  { name: 'Ocean',    qr: '#0369a1', bg: '#e0f2fe' },
  { name: 'Forest',   qr: '#166534', bg: '#dcfce7' },
  { name: 'Sunset',   qr: '#9a3412', bg: '#fff7ed' },
  { name: 'Royal',    qr: '#4f46e5', bg: '#eef2ff' },
  { name: 'Rose',     qr: '#9f1239', bg: '#fff1f2' },
  { name: 'Slate',    qr: '#334155', bg: '#f8fafc' },
];

export default function ControlsPanel({
  // Content
  qrType, setQrType,
  qrData, setQrData,
  // Colors
  qrColor, setQrColor,
  bgColor, setBgColor,
  bgTransparent, setBgTransparent,
  gradientEnabled, setGradientEnabled,
  gradientColor1, setGradientColor1,
  gradientColor2, setGradientColor2,
  gradientType, setGradientType,
  // Active preset ring
  activePreset, setActivePreset,
  // Shapes
  dotStyle, setDotStyle,
  eyeStyle, setEyeStyle,
  eyeColor, setEyeColor,
  eyeOuterColor, setEyeOuterColor,
  dotPadding, setDotPadding,
  eyePadding, setEyePadding,
  // Logo
  logo, setLogo,
  logoSize, setLogoSize,
  logoPadding, setLogoPadding,
  logoBackground, setLogoBackground,
  logoBgColor, setLogoBgColor,
  logoBgShape, setLogoBgShape,
  logoOutline, setLogoOutline,
  logoOutlineColor, setLogoOutlineColor,
  logoOutlineWidth, setLogoOutlineWidth,
  logoOutlineOpacity, setLogoOutlineOpacity,
  // Reliability
  errorLevel, setErrorLevel,
  // Frames
  frameStyle, setFrameStyle,
  frameText, setFrameText,
  frameColor, setFrameColor,
}) {
  return (
    <div className="sidebar-scroll fade-in">

      {/* ── QR Content ─────────────────────────────────────── */}
      <Section title="QR Content" icon={Wand2} defaultOpen={true}>
        <QRTypeSelector activeType={qrType} onTypeChange={setQrType} />
        <div style={{ marginTop: 16 }}>
          <QRDataInput type={qrType} data={qrData} onChange={setQrData} />
        </div>
      </Section>

      {/* ── Colors ─────────────────────────────────────────── */}
      <Section title="Colors" icon={Palette} defaultOpen={true}>
        {/* Colour presets — one-click combos for QR + background color */}
        <div>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Quick Presets</label>
          <div className="color-presets">
            {COLOR_PRESETS.map(preset => (
              <div
                key={preset.name}
                className={`color-preset-swatch${activePreset === preset.name ? ' active' : ''}`}
                data-name={preset.name}
                title={preset.name}
                style={{ background: `linear-gradient(135deg, ${preset.qr} 50%, ${preset.bg} 50%)` }}
                onClick={() => {
                  setQrColor(preset.qr);
                  setBgColor(preset.bg);
                  setBgTransparent(false);
                  setActivePreset(preset.name);
                }}
              />
            ))}
          </div>
        </div>
        <ColorPicker label="QR Code Color" value={qrColor} onChange={setQrColor} />
        <Toggle label="Transparent Background" checked={bgTransparent} onChange={setBgTransparent} />
        {!bgTransparent && (
          <ColorPicker label="Background Color" value={bgColor} onChange={setBgColor} />
        )}

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Toggle label="Enable Gradient" checked={gradientEnabled} onChange={setGradientEnabled} />
          {gradientEnabled && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Gradient Type</label>
                <select
                  className="form-select"
                  value={gradientType}
                  onChange={e => setGradientType(e.target.value)}
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              <ColorPicker label="Color 1" value={gradientColor1} onChange={setGradientColor1} />
              <ColorPicker label="Color 2" value={gradientColor2} onChange={setGradientColor2} />
            </div>
          )}
        </div>
      </Section>

      {/* ── Design & Shapes ────────────────────────────────── */}
      <Section title="Design & Shapes" icon={Shapes} defaultOpen={false}>
        <div className="form-group">
          <label className="form-label">Pattern Style</label>
          <DotStyleSelector value={dotStyle} onChange={setDotStyle} />
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Corner Eyes Style</label>
          <EyeStyleSelector value={eyeStyle} onChange={setEyeStyle} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Slider label="Pattern Thickness" value={100 - dotPadding} min={30} max={100} step={1}
            onChange={(val) => setDotPadding(100 - val)} />
          <Slider label="Eye Frame Thickness" value={100 - eyePadding} min={30} max={100} step={1}
            onChange={(val) => setEyePadding(100 - val)} />
        </div>

        <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
          <div className="section-title" style={{ fontSize: 13, marginBottom: 12 }}>
            <Palette size={14} /> Eye Colors Override
          </div>
          <ColorPicker label="Corner Frame Color" value={eyeOuterColor} onChange={setEyeOuterColor} />
          <div style={{ margin: '8px 0' }} />
          <ColorPicker label="Corner Dot Color" value={eyeColor} onChange={setEyeColor} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Leave blank to use main QR color
          </div>
        </div>
      </Section>

      {/* ── Logo & Image ───────────────────────────────────── */}
      <Section title="Logo & Image" icon={ImageIcon} defaultOpen={false}>
        <LogoUpload logo={logo} onLogoChange={setLogo} onLogoRemove={() => setLogo(null)} />

        {logo && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Slider label="Logo Size" value={logoSize} min={0.1} max={0.4} step={0.01} onChange={setLogoSize} />

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <Toggle label="Smart Stroke (Follows transparent shape)" checked={logoOutline} onChange={setLogoOutline} />
              {logoOutline && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ColorPicker label="Stroke Color" value={logoOutlineColor} onChange={setLogoOutlineColor} />
                  <Slider label="Stroke Thickness" value={logoOutlineWidth} min={1} max={100} step={1} onChange={setLogoOutlineWidth} />
                  <Slider label="Stroke Opacity" value={logoOutlineOpacity} min={0.1} max={1} step={0.1} onChange={setLogoOutlineOpacity} />
                </div>
              )}
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <Toggle label="Solid Background Box" checked={logoBackground} onChange={setLogoBackground} />
              {logoBackground && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Box Shape</label>
                    <select className="form-select" value={logoBgShape} onChange={e => setLogoBgShape(e.target.value)}>
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                      <option value="circle">Circle</option>
                    </select>
                  </div>
                  <ColorPicker label="Box Color" value={logoBgColor} onChange={setLogoBgColor} />
                  <Slider label="Box Padding" value={logoPadding} min={0} max={30} step={1} onChange={setLogoPadding} />
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── Frames ───────────────────────────────────────── */}
      <Section title="Frames" icon={Frame} defaultOpen={false}>
        <div className="form-group">
          <label className="form-label">Frame Style</label>
          <select 
            className="form-select" 
            value={frameStyle} 
            onChange={(e) => setFrameStyle(e.target.value)}
          >
            <option value={FRAME_STYLES.NONE}>None</option>
            <option value={FRAME_STYLES.SCAN_ME}>Scan Me (Classic)</option>
            <option value={FRAME_STYLES.TEXT_BOTTOM}>Text Bottom</option>
            <option value={FRAME_STYLES.BOX}>Square Box</option>
            <option value={FRAME_STYLES.ROUNDED}>Rounded Box</option>
            <option value={FRAME_STYLES.MODERN}>Modern Corners</option>
          </select>
        </div>

        {frameStyle !== FRAME_STYLES.NONE && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Only show text input for styles that use text */}
            {[FRAME_STYLES.SCAN_ME, FRAME_STYLES.TEXT_BOTTOM].includes(frameStyle) && (
              <div className="form-group">
                <label className="form-label">Frame Text</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={frameText} 
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="e.g. SCAN ME"
                />
              </div>
            )}
            
            <ColorPicker 
              label="Frame Color" 
              value={frameColor || qrColor} 
              onChange={setFrameColor} 
              showClear={true}
              onClear={() => setFrameColor('')}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
              Leave empty to match QR color.
            </div>
          </div>
        )}
      </Section>

      {/* ── Scan Reliability ───────────────────────────────── */}
      <Section title="Scan Reliability" icon={ShieldCheck} defaultOpen={false}>
        <div className="form-group">
          <label className="form-label">Reliability Level</label>
          <select className="form-select" value={errorLevel} onChange={(e) => setErrorLevel(e.target.value)}>
            <option value="L">Fast Scan — Best for simple QR codes</option>
            <option value="M">Standard — Good for most uses</option>
            <option value="Q">High — Recommended with logos</option>
            <option value="H">Maximum — Best for complex logos</option>
          </select>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            Higher reliability lets you add larger logos but increases QR complexity.
          </div>
        </div>
      </Section>

    </div>
  );
}
