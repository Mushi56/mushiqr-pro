import { useState, useEffect, useRef, useCallback, Component } from 'react';
import { 
  QrCode, 
  History as HistoryIcon, 
  Sun, 
  Moon, 
  CheckCircle2, 
  XCircle,
  Wand2,
  Palette,
  Shapes,
  Image as ImageIcon,
  ShieldCheck,
  Save,
  Download,
  Copy,
  Loader2,
  Share2,
  Smartphone,
  ScanLine,
  Globe,
  Wifi,
  User,
  Menu,
  X,
  Monitor,
  ChevronRight
} from 'lucide-react';
import Section from './components/Section';
import ColorPicker from './components/ColorPicker';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import LogoUpload from './components/LogoUpload';
import QRTypeSelector from './components/QRTypeSelector';
import QRDataInput from './components/QRDataInput';
import { DotStyleSelector, EyeStyleSelector } from './components/StyleSelectors';
import HistoryPage from './components/HistoryPage';
import { generateQRMatrix, renderQR, QR_TYPES, DOT_STYLES, EYE_STYLES, formatQRData } from './utils/qrEngine';
import { downloadPNG, downloadSVG, downloadPDF, downloadJPG } from './utils/exportUtils';
import { saveToHistory, getPreferences, savePreferences } from './utils/storage';

/* ── Fix 22: Error Boundary ────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('QR Engine error:', err); }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, color:'var(--text-secondary)', padding:40 }}>
        <QrCode size={48} strokeWidth={1} color="var(--text-muted)" />
        <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>Something went wrong generating your QR.</p>
        <p style={{ fontSize:13 }}>Please check your input and try again.</p>
        <button className="btn btn-primary btn-sm" onClick={() => this.setState({ hasError: false })}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

/* ── Fix 18: Color palette presets ─────────────────────── */
const COLOR_PRESETS = [
  { name: 'Classic',  qr: '#000000', bg: '#ffffff' },
  { name: 'Midnight', qr: '#ffffff', bg: '#0a0a1a' },
  { name: 'Ocean',    qr: '#0369a1', bg: '#e0f2fe' },
  { name: 'Forest',   qr: '#166534', bg: '#dcfce7' },
  { name: 'Sunset',   qr: '#9a3412', bg: '#fff7ed' },
  { name: 'Royal',    qr: '#4f46e5', bg: '#eef2ff' },
  { name: 'Rose',     qr: '#9f1239', bg: '#fff1f2' },
  { name: 'Slate',    qr: '#334155', bg: '#f8fafc' },
];

export default function App() {
  // State: Tab & Theme
  const [activeTab, setActiveTab] = useState('generator');
  const [theme, setTheme] = useState('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // State: QR Content
  const [qrType, setQrType] = useState(QR_TYPES.URL);
  const [qrData, setQrData] = useState({ url: 'https://example.com' });
  const [errorLevel, setErrorLevel] = useState('H');

  // State: Colors
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  
  // State: Gradient
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#6c5ce7');
  const [gradientColor2, setGradientColor2] = useState('#a78bfa');
  const [gradientType, setGradientType] = useState('linear');
  
  // State: Shapes
  const [dotStyle, setDotStyle] = useState(DOT_STYLES.SQUARE);
  const [eyeStyle, setEyeStyle] = useState(EYE_STYLES.SQUARE);
  const [eyeColor, setEyeColor] = useState('');
  const [eyeOuterColor, setEyeOuterColor] = useState('');
  
  // State: Shapes padding
  const [dotPadding, setDotPadding] = useState(0);
  const [eyePadding, setEyePadding] = useState(0);
  
  // State: Logo
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(0.25);
  const [logoPadding, setLogoPadding] = useState(10);
  const [logoBackground, setLogoBackground] = useState(false);
  const [logoBgColor, setLogoBgColor] = useState('#ffffff');
  const [logoBgShape, setLogoBgShape] = useState('circle');
  
  // State: Logo Smart Outline
  const [logoOutline, setLogoOutline] = useState(false);
  const [logoOutlineColor, setLogoOutlineColor] = useState('#ffffff');
  const [logoOutlineWidth, setLogoOutlineWidth] = useState(3);
  const [logoOutlineOpacity, setLogoOutlineOpacity] = useState(1);

  // References
  const canvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const [qrMatrixInfo, setQrMatrixInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Fix 25: QR animation key
  const [qrAnimKey, setQrAnimKey] = useState(0);

  // Fix 26: Phone preview toggle
  const [phonePreview, setPhonePreview] = useState(false);

  // Fix 20: Scan frame toggle
  const [scanFrame, setScanFrame] = useState(false);

  // Fix 10: Logo image error state
  const [logoImgError, setLogoImgError] = useState(false);

  // Load preferences
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.theme) setTheme(prefs.theme);
  }, []);

  // Update body theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Copy QR to clipboard
  const handleCopyToClipboard = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('Copied to clipboard!');
      } catch (err) {
        showToast('Copy not supported in this browser', 'error');
      }
    });
  };

  // Fix 7: Web Share API
  const handleShare = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        await navigator.share({ files: [file], title: 'My QR Code' });
        showToast('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') showToast('Share failed', 'error');
      }
    });
  };

  // Download with loading state
  const handleDownload = async (format, downloadFn) => {
    if (!canvasRef.current) return;
    setDownloadingFormat(format);
    try {
      await downloadFn(canvasRef.current);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 800);
    }
  };

  // 1. Generate QR Data Matrix (when content changes)
  const regenerateMatrix = useCallback(() => {
    const dataString = formatQRData(qrType, qrData);
    if (!dataString) return;
    try {
      const matrixInfo = generateQRMatrix(dataString, errorLevel);
      setQrMatrixInfo(matrixInfo);
    } catch (e) {
      console.error('QR Generate Error:', e);
    }
  }, [qrType, qrData, errorLevel]);

  useEffect(() => {
    regenerateMatrix();
  }, [regenerateMatrix]);

  // Fix 25: increment animation key whenever matrix updates
  useEffect(() => {
    if (qrMatrixInfo) setQrAnimKey(k => k + 1);
  }, [qrMatrixInfo]);

  // 2. Render Canvas (when visual settings change)
  const renderCanvas = useCallback(() => {
    if (!qrMatrixInfo || !canvasRef.current) return;
    
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      if (!canvasRef.current) return;
      renderQR(canvasRef.current, {
        ...qrMatrixInfo,
        size: 512,
        qrColor,
        bgColor,
        bgTransparent,
        dotStyle,
        eyeStyle,
        eyeColor,
        eyeOuterColor,
        dotPadding,
        eyePadding,
        gradientEnabled,
        gradientColor1,
        gradientColor2,
        gradientType,
        logo: logo?.image,
        logoSize,
        logoPadding,
        logoBackground,
        logoBgColor,
        logoBgShape,
        logoOutline,
        logoOutlineColor,
        logoOutlineWidth,
        logoOutlineOpacity,
        quietZone: 2,
      });
    }, 40); // 40ms debounce to allow 60fps UI threads during slider changes
  }, [
    qrMatrixInfo, qrColor, bgColor, bgTransparent, dotStyle, eyeStyle, eyeColor, 
    eyeOuterColor, gradientEnabled, gradientColor1, gradientColor2, gradientType,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
    dotPadding, eyePadding
  ]);

  useEffect(() => {
    renderCanvas();
    // Re-render when logo image loads
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
    }
  }, [renderCanvas, logo]);

  // Handle Loading from History
  const handleLoadQR = (item) => {
    setQrType(item.qrType);
    setQrData(item.qrData);
    setErrorLevel(item.errorLevel || 'H');
    setActiveTab('generator');
    showToast('Loaded from history');
  };

  // Handle Save
  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const dataString = formatQRData(qrType, qrData);
    if (!dataString) {
      showToast('Please enter QR data first', 'error');
      return;
    }
    
    saveToHistory({
      qrType,
      qrData,
      displayText: dataString.substring(0, 50),
      errorLevel,
      thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.5)
    });
    showToast('Saved to history');
  };

  // Render Left Panel Content
  const renderControls = () => (
    <div className="sidebar-scroll fade-in">
      {/* CONTENT */}
      <Section title="QR Content" icon={Wand2} defaultOpen={true}>
        {/* Fix 19: Quick Templates */}
        <div className="quick-templates">
          <button
            className={`quick-template-btn${qrType === QR_TYPES.URL ? ' active' : ''}`}
            onClick={() => { setQrType(QR_TYPES.URL); setQrData({ url: 'https://' }); }}
          >🌐 Website</button>
          <button
            className={`quick-template-btn${qrType === QR_TYPES.WIFI ? ' active' : ''}`}
            onClick={() => { setQrType(QR_TYPES.WIFI); }}
          >📶 WiFi</button>
          <button
            className={`quick-template-btn${qrType === QR_TYPES.VCARD ? ' active' : ''}`}
            onClick={() => { setQrType(QR_TYPES.VCARD); }}
          >👤 Contact</button>
        </div>
        <QRTypeSelector activeType={qrType} onTypeChange={setQrType} />
        <div style={{ marginTop: 12 }}>
          <QRDataInput type={qrType} data={qrData} onChange={setQrData} />
        </div>
      </Section>

      {/* COLORS */}
      <Section title="Colors" icon={Palette} defaultOpen={true}>
        {/* Fix 18: Color Palette Presets */}
        <div>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Quick Presets</label>
          <div className="color-presets">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                className="color-preset-swatch"
                data-name={preset.name}
                title={preset.name}
                style={{ background: `linear-gradient(135deg, ${preset.qr} 50%, ${preset.bg} 50%)` }}
                onClick={() => { setQrColor(preset.qr); setBgColor(preset.bg); setBgTransparent(false); }}
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

      {/* SHAPES */}
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
          <Slider label="Pattern Thickness" value={100 - dotPadding} min={30} max={100} step={1} onChange={(val) => setDotPadding(100 - val)} />
          <Slider label="Eye Frame Thickness" value={100 - eyePadding} min={30} max={100} step={1} onChange={(val) => setEyePadding(100 - val)} />
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

      {/* LOGO */}
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
      
      {/* SCAN RELIABILITY */}
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

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          {/* Fix 10: Logo with fallback */}
          <div className="app-logo-image" style={{ width: 42, height: 42, marginRight: 10, flexShrink: 0 }}>
            {logoImgError ? (
              <div className="app-logo-fallback">
                <QrCode size={24} color="white" />
              </div>
            ) : (
              <img
                src="/logo.png"
                alt="Mushi QR Pro"
                style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover', display: 'block' }}
                onError={() => setLogoImgError(true)}
              />
            )}
          </div>
          <div className="app-logo-text" style={{ whiteSpace: 'nowrap' }}>Mushi QR <span>Pro</span></div>
        </div>
        
        <div className="header-actions">
          {/* Hamburger menu */}
          <div className="app-menu-wrapper" ref={menuRef}>
            <button
              className={`btn btn-ghost btn-icon app-menu-trigger${menuOpen ? ' active' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Open menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {menuOpen && (
              <div className="app-menu-dropdown">
                <div className="app-menu-header">
                  <span className="app-menu-title">Menu</span>
                </div>

                {/* Theme section */}
                <div className="app-menu-section-label">Appearance</div>
                <button
                  className={`app-menu-item${theme === 'light' ? ' menu-item-active' : ''}`}
                  onClick={() => {
                    setTheme('light');
                    savePreferences({ ...getPreferences(), theme: 'light' });
                  }}
                >
                  <Sun size={16} />
                  <span className="menu-label">Light Mode</span>
                  {theme === 'light' && <span className="menu-dot" />}
                </button>
                <button
                  className={`app-menu-item${theme === 'dark' ? ' menu-item-active' : ''}`}
                  onClick={() => {
                    setTheme('dark');
                    savePreferences({ ...getPreferences(), theme: 'dark' });
                  }}
                >
                  <Moon size={16} />
                  <span className="menu-label">Dark Mode</span>
                  {theme === 'dark' && <span className="menu-dot" />}
                </button>

                <div className="app-menu-divider" />

                {/* Navigation section */}
                <div className="app-menu-section-label">Navigate</div>
                <button
                  className={`app-menu-item${activeTab === 'generator' ? ' menu-item-active' : ''}`}
                  onClick={() => { setActiveTab('generator'); setMenuOpen(false); }}
                >
                  <QrCode size={16} />
                  <span className="menu-label">QR Generator</span>
                  {activeTab === 'generator' && <span className="menu-dot" />}
                </button>
                <button
                  className={`app-menu-item${activeTab === 'history' ? ' menu-item-active' : ''}`}
                  onClick={() => { setActiveTab('history'); setMenuOpen(false); }}
                >
                  <HistoryIcon size={16} />
                  <span className="menu-label">History</span>
                  {activeTab === 'history' && <span className="menu-dot" />}
                </button>

                <div style={{ height: 8 }} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'generator' ? (
          <>
            <aside className="sidebar">
              {renderControls()}
            </aside>

            {/* Fix 22: ErrorBoundary wrap */}
            <ErrorBoundary>
              <section className="preview-panel pt-4 pb-4">
                <div className="preview-container scale-in">

                  {/* Fix 26+20: Toggle buttons */}
                  <div className="preview-panel-toggles">
                    <button
                      className={`phone-preview-toggle${phonePreview ? ' active' : ''}`}
                      onClick={() => setPhonePreview(v => !v)}
                    >
                      <Smartphone size={14} /> Phone Preview
                    </button>
                    <button
                      className={`scan-frame-toggle${scanFrame ? ' active' : ''}`}
                      onClick={() => setScanFrame(v => !v)}
                    >
                      <ScanLine size={14} /> Add Frame
                    </button>
                  </div>

                  {/* Fix 26: Phone mockup wrapper (conditional) */}
                  {phonePreview ? (
                    <div className="phone-mockup">
                      <div className="phone-mockup-notch" />
                      <div className="phone-mockup-screen">
                        {/* Fix 20: Scan frame inside phone */}
                        {scanFrame && qrMatrixInfo ? (
                          <div className="scan-frame-wrapper">
                            <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                            <div className="scan-frame-label">SCAN ME</div>
                          </div>
                        ) : (
                          !qrMatrixInfo ? (
                            <div className="preview-placeholder" style={{ padding: 24 }}>
                              <span className="preview-placeholder-icon">
                                <QrCode size={48} color="var(--text-tertiary)" strokeWidth={1} />
                              </span>
                              <span className="preview-placeholder-text">Your QR code will appear here</span>
                            </div>
                          ) : (
                            <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                          )
                        )}
                      </div>
                      <div className="phone-mockup-home" />
                    </div>
                  ) : (
                    /* Normal QR wrapper */
                    <div className="preview-qr-wrapper">
                      {!qrMatrixInfo ? (
                        /* Fix 4: Improved placeholder */
                        <div className="preview-placeholder">
                          <span className="preview-placeholder-icon">
                            <QrCode size={96} color="var(--accent-primary)" strokeWidth={1} />
                          </span>
                          <span className="preview-placeholder-text">Your QR code will appear here</span>
                          <span className="preview-placeholder-sub">Start by entering a URL or text above</span>
                        </div>
                      ) : scanFrame ? (
                        /* Fix 20: Scan Me frame */
                        <div className="scan-frame-wrapper">
                          <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                          <div className="scan-frame-label">SCAN ME</div>
                        </div>
                      ) : (
                        /* Fix 25: animated canvas with key */
                        <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                      )}
                    </div>
                  )}

                  {/* Fix 7: Copy + Share action row */}
                  <div className="preview-action-row">
                    <button
                      className="btn-copy"
                      onClick={handleCopyToClipboard}
                      disabled={!qrMatrixInfo}
                      title="Copy image to clipboard"
                    >
                      <Copy size={16} /> Copy Image
                    </button>
                    {/* Fix 7: only show Share if supported */}
                    {typeof navigator !== 'undefined' && navigator.canShare && (
                      <button
                        className="btn-share"
                        onClick={handleShare}
                        disabled={!qrMatrixInfo}
                        title="Share QR code"
                      >
                        <Share2 size={16} /> Share
                      </button>
                    )}
                  </div>

                  {/* Fix 15: Download buttons with loading state */}
                  <div className="download-grid" style={{ width: '100%' }}>
                    {[
                      { label: 'PNG', fn: downloadPNG },
                      { label: 'SVG', fn: downloadSVG },
                      { label: 'PDF', fn: downloadPDF },
                      { label: 'JPG', fn: downloadJPG },
                    ].map(({ label, fn }) => (
                      <button
                        key={label}
                        className="download-btn"
                        disabled={!qrMatrixInfo}
                        onClick={() => handleDownload(label, fn)}
                      >
                        {downloadingFormat === label
                          ? <Loader2 size={20} className="download-btn-icon spinning" />
                          : <Download size={20} className="download-btn-icon" />
                        }
                        {label}
                      </button>
                    ))}
                  </div>

                </div>
              </section>
            </ErrorBoundary>
          </>
        ) : (
          <HistoryPage onLoadQR={handleLoadQR} />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 color="var(--success)" size={18} />
          ) : (
            <XCircle color="var(--error)" size={18} />
          )} 
          {toast.message}
        </div>
      )}
    </div>
  );
}
