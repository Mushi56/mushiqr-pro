import { useState, useEffect, useRef, useCallback } from 'react';
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
  Download
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

export default function App() {
  // State: Tab & Theme
  const [activeTab, setActiveTab] = useState('generator');
  const [theme, setTheme] = useState('dark');

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
        size: 1024,
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
      {/* 1. CONTENT */}
      <Section title="1. QR Content" icon={Wand2} defaultOpen={true}>
        <QRTypeSelector activeType={qrType} onTypeChange={setQrType} />
        <div style={{ marginTop: 12 }}>
          <QRDataInput type={qrType} data={qrData} onChange={setQrData} />
        </div>
      </Section>

      {/* 2. COLORS */}
      <Section title="2. Colors" icon={Palette} defaultOpen={true}>
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

      {/* 3. SHAPES */}
      <Section title="3. Design & Shapes" icon={Shapes} defaultOpen={false}>
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Leave blank to use main QR color
          </div>
        </div>
      </Section>

      {/* 4. LOGO */}
      <Section title="4. Logo & Image" icon={ImageIcon} defaultOpen={false}>
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
      
      {/* 5. QUALITY */}
      <Section title="5. Error Correction" icon={ShieldCheck} defaultOpen={false}>
        <div className="form-group">
          <label className="form-label">Level</label>
          <select className="form-select" value={errorLevel} onChange={(e) => setErrorLevel(e.target.value)}>
            <option value="L">L (7%) - Best for clean QR</option>
            <option value="M">M (15%) - Standard</option>
            <option value="Q">Q (25%) - Good for small logos</option>
            <option value="H">H (30%) - Best for large logos</option>
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Higher levels allow larger logos but make the QR dots denser.
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
          <div className="app-logo-image" style={{ width: 32, height: 32, marginRight: 10 }}>
            <img src="/logo.png" alt="MushiQR Pro" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
          </div>
          <div className="app-logo-text">MushiQR <span>Pro</span></div>
        </div>
        
        <div className="header-actions">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <Wand2 size={16} /> Generator
            </button>
            <button 
              className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <HistoryIcon size={16} /> History
            </button>
          </div>
          
          <button 
            className="btn btn-ghost btn-icon"
            onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              savePreferences({ ...getPreferences(), theme: newTheme });
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'generator' ? (
          <>
            <aside className="sidebar">
              {renderControls()}
            </aside>
            
            <section className="preview-panel pt-4 pb-4">
              <div className="preview-container scale-in">
                <div className="preview-qr-wrapper">
                  {!qrMatrixInfo ? (
                    <div className="preview-placeholder">
                      <span className="preview-placeholder-icon">
                        <QrCode size={64} color="var(--text-tertiary)" strokeWidth={1} />
                      </span>
                      <span className="preview-placeholder-text">Enter data to generate QR</span>
                    </div>
                  ) : (
                    <canvas ref={canvasRef} className="preview-canvas" />
                  )}
                </div>
                
                <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '14px' }} onClick={handleSave}>
                    <Save size={18} /> Save to History
                  </button>
                </div>
                
                <div className="download-grid" style={{ width: '100%' }}>
                  <button className="download-btn" onClick={() => canvasRef.current && downloadPNG(canvasRef.current)}>
                    <Download size={16} className="download-btn-icon" /> PNG
                  </button>
                  <button className="download-btn" onClick={() => canvasRef.current && downloadSVG(canvasRef.current)}>
                    <Download size={16} className="download-btn-icon" /> SVG
                  </button>
                  <button className="download-btn" onClick={() => canvasRef.current && downloadPDF(canvasRef.current)}>
                    <Download size={16} className="download-btn-icon" /> PDF
                  </button>
                  <button className="download-btn" onClick={() => canvasRef.current && downloadJPG(canvasRef.current)}>
                    <Download size={16} className="download-btn-icon" /> JPG
                  </button>
                </div>
              </div>
            </section>
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
