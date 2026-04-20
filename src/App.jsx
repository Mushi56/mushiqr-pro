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
  ChevronDown,
  FileImage,
  FileCode,
  FileText
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
import ControlsPanel, { COLOR_PRESETS } from './ControlsPanel';

/* ── Error Boundary: isolates QR engine failures from the rest of the UI ── */
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
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(e.target)) {
        setFormatDropdownOpen(false);
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
  // M is the right default — dense enough for reliability, scannable at small sizes.
  // Auto-upgrades to H when a logo is added (see logo useEffect below).
  const [errorLevel, setErrorLevel] = useState('M');

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
  const [logoSize, setLogoSize] = useState(0.18);
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
  // Tracks which colour preset is currently active for the active-ring indicator
  const [activePreset, setActivePreset] = useState(null);
  // Download format selector
  const [selectedFormat, setSelectedFormat] = useState('PNG');
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const downloadBtnRef = useRef(null);

  // Canvas animation key — bumped on every matrix update to replay the CSS appear animation
  const [qrAnimKey, setQrAnimKey] = useState(0);

  // Frame state
  const [frameStyle, setFrameStyle] = useState('none');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameColor, setFrameColor] = useState('');

  // Logo image fallback state (shows gradient icon if /logo.png fails to load)
  const [logoImgError, setLogoImgError] = useState(false);

  // Load preferences
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.theme) setTheme(prefs.theme);
  }, []);

  // Bump canvas animation key on every matrix update
  useEffect(() => {
    if (qrMatrixInfo) setQrAnimKey(k => k + 1);
  }, [qrMatrixInfo]);

  // Auto-upgrade error correction to H when a logo is present (logo occludes QR modules,
  // higher redundancy is needed). Downgrade back to M when logo is removed.
  useEffect(() => {
    if (logo) {
      setErrorLevel(prev => (prev === 'L' || prev === 'M') ? 'H' : prev);
    } else {
      setErrorLevel(prev => prev === 'H' ? 'M' : prev);
    }
  }, [logo]);

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

  // Web Share API — only shown when browser supports navigator.share
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


  // Format lookup — maps the selectedFormat label to its export function
  const FORMAT_MAP = {
    PNG: downloadPNG,
    SVG: downloadSVG,
    PDF: downloadPDF,
    JPG: downloadJPG,
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

  // Bump canvas key to replay appear animation on each new QR
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
        frameStyle,
        frameText,
        frameColor,
      });
    }, 40); // 40ms debounce to allow 60fps UI threads during slider changes
  }, [
    qrMatrixInfo, qrColor, bgColor, bgTransparent, dotStyle, eyeStyle, eyeColor, 
    eyeOuterColor, gradientEnabled, gradientColor1, gradientColor2, gradientType,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
    dotPadding, eyePadding,
    frameStyle, frameText, frameColor
  ]);

  useEffect(() => {
    renderCanvas();
    // Re-render when logo image loads or fails to load
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
      logo.image.onerror = () => showToast('Logo failed to load', 'error');
    }
  }, [renderCanvas, logo]);

  // Handle Loading from History
  const handleLoadQR = (item) => {
    setQrType(item.qrType);
    setQrData(item.qrData);
    setErrorLevel(item.errorLevel || 'H');
    
    // Restore styling
    if (item.qrColor !== undefined) setQrColor(item.qrColor);
    if (item.bgColor !== undefined) setBgColor(item.bgColor);
    if (item.bgTransparent !== undefined) setBgTransparent(item.bgTransparent);
    if (item.gradientEnabled !== undefined) setGradientEnabled(item.gradientEnabled);
    if (item.gradientColor1 !== undefined) setGradientColor1(item.gradientColor1);
    if (item.gradientColor2 !== undefined) setGradientColor2(item.gradientColor2);
    if (item.gradientType !== undefined) setGradientType(item.gradientType);
    if (item.dotStyle !== undefined) setDotStyle(item.dotStyle);
    if (item.eyeStyle !== undefined) setEyeStyle(item.eyeStyle);
    if (item.eyeColor !== undefined) setEyeColor(item.eyeColor);
    if (item.eyeOuterColor !== undefined) setEyeOuterColor(item.eyeOuterColor);
    if (item.dotPadding !== undefined) setDotPadding(item.dotPadding);
    if (item.eyePadding !== undefined) setEyePadding(item.eyePadding);
    if (item.logoSize !== undefined) setLogoSize(item.logoSize);
    if (item.logoPadding !== undefined) setLogoPadding(item.logoPadding);
    if (item.logoBackground !== undefined) setLogoBackground(item.logoBackground);
    if (item.logoBgColor !== undefined) setLogoBgColor(item.logoBgColor);
    if (item.logoBgShape !== undefined) setLogoBgShape(item.logoBgShape);
    if (item.logoOutline !== undefined) setLogoOutline(item.logoOutline);
    if (item.logoOutlineColor !== undefined) setLogoOutlineColor(item.logoOutlineColor);
    if (item.logoOutlineWidth !== undefined) setLogoOutlineWidth(item.logoOutlineWidth);
    if (item.logoOutlineOpacity !== undefined) setLogoOutlineOpacity(item.logoOutlineOpacity);
    
    // Clear logo since we can't easily save the uploaded file
    setLogo(null);
    
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
      qrColor,
      bgColor,
      bgTransparent,
      gradientEnabled,
      gradientColor1,
      gradientColor2,
      gradientType,
      dotStyle,
      eyeStyle,
      eyeColor,
      eyeOuterColor,
      dotPadding,
      eyePadding,
      logoSize,
      logoPadding,
      logoBackground,
      logoBgColor,
      logoBgShape,
      logoOutline,
      logoOutlineColor,
      logoOutlineWidth,
      logoOutlineOpacity,
      thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.5)
    });
    showToast('Saved to history');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          {/* App logo — gradient icon fallback if logo.png is missing */}
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
          {/* Visible nav tabs on desktop — Generator and History always accessible */}
          <nav className="header-nav">
            <button
              className={`header-nav-tab${activeTab === 'generator' ? ' active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <QrCode size={15} /> Generator
            </button>
            <button
              className={`header-nav-tab${activeTab === 'history' ? ' active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <HistoryIcon size={15} /> History
            </button>
          </nav>

          {/* Theme toggle — always visible, one-click switch */}
          <button
            className="btn-theme-toggle"
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              savePreferences({ ...getPreferences(), theme: next });
            }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Hamburger — mobile only (hidden on desktop via CSS) */}
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
              <ControlsPanel
                qrType={qrType} setQrType={setQrType}
                qrData={qrData} setQrData={setQrData}
                qrColor={qrColor} setQrColor={setQrColor}
                bgColor={bgColor} setBgColor={setBgColor}
                bgTransparent={bgTransparent} setBgTransparent={setBgTransparent}
                gradientEnabled={gradientEnabled} setGradientEnabled={setGradientEnabled}
                gradientColor1={gradientColor1} setGradientColor1={setGradientColor1}
                gradientColor2={gradientColor2} setGradientColor2={setGradientColor2}
                gradientType={gradientType} setGradientType={setGradientType}
                activePreset={activePreset} setActivePreset={setActivePreset}
                dotStyle={dotStyle} setDotStyle={setDotStyle}
                eyeStyle={eyeStyle} setEyeStyle={setEyeStyle}
                eyeColor={eyeColor} setEyeColor={setEyeColor}
                eyeOuterColor={eyeOuterColor} setEyeOuterColor={setEyeOuterColor}
                dotPadding={dotPadding} setDotPadding={setDotPadding}
                eyePadding={eyePadding} setEyePadding={setEyePadding}
                logo={logo} setLogo={setLogo}
                logoSize={logoSize} setLogoSize={setLogoSize}
                logoPadding={logoPadding} setLogoPadding={setLogoPadding}
                logoBackground={logoBackground} setLogoBackground={setLogoBackground}
                logoBgColor={logoBgColor} setLogoBgColor={setLogoBgColor}
                logoBgShape={logoBgShape} setLogoBgShape={setLogoBgShape}
                logoOutline={logoOutline} setLogoOutline={setLogoOutline}
                logoOutlineColor={logoOutlineColor} setLogoOutlineColor={setLogoOutlineColor}
                logoOutlineWidth={logoOutlineWidth} setLogoOutlineWidth={setLogoOutlineWidth}
                logoOutlineOpacity={logoOutlineOpacity} setLogoOutlineOpacity={setLogoOutlineOpacity}
                errorLevel={errorLevel} setErrorLevel={setErrorLevel}
                frameStyle={frameStyle} setFrameStyle={setFrameStyle}
                frameText={frameText} setFrameText={setFrameText}
                frameColor={frameColor} setFrameColor={setFrameColor}
              />
            </aside>

            {/* Error boundary: isolates QR engine crashes from the page shell */}
            <ErrorBoundary>
              <section className="preview-panel pt-4 pb-4">
                <div className="preview-container scale-in">

                  {/* Enhanced QR Card with integrated frames */}
                  <div className="preview-qr-wrapper">
                    {!qrMatrixInfo ? (
                      <div className="preview-placeholder">
                        <span className="preview-placeholder-icon">
                          <QrCode size={120} color="var(--accent-primary)" strokeWidth={1} />
                        </span>
                        <span className="preview-placeholder-text">Your QR code will appear here</span>
                        <span className="preview-placeholder-sub">Start by entering a URL or text above</span>
                      </div>
                    ) : (
                      <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                    )}
                  </div>

                  {/* Primary actions: copy, save to history, and native share */}
                  <div className="preview-action-row">
                    <button
                      className="btn-copy"
                      onClick={handleCopyToClipboard}
                      disabled={!qrMatrixInfo}
                      title="Copy image to clipboard"
                    >
                      <Copy size={16} /> Copy
                    </button>
                    {/* Save to history — was previously defined but never wired to a button */}
                    <button
                      className="btn-save"
                      onClick={handleSave}
                      disabled={!qrMatrixInfo}
                      title="Save to history"
                    >
                      <Save size={16} /> Save
                    </button>
                    {/* Share button — only shown when Web Share API is available */}
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

                  {/* Single split-button: left side triggers download, right side opens format picker */}
                  <div className="download-split-wrapper" ref={downloadBtnRef}>
                    <div className={`download-split-btn${!qrMatrixInfo ? ' disabled' : ''}`}>

                      {/* Left: trigger download in currently selected format */}
                      <button
                        className="download-split-main"
                        disabled={!qrMatrixInfo}
                        onClick={() => handleDownload(selectedFormat, FORMAT_MAP[selectedFormat])}
                      >
                        {downloadingFormat === selectedFormat
                          ? <Loader2 size={17} className="spinning" />
                          : <Download size={17} />
                        }
                        Download {selectedFormat}
                      </button>

                      {/* Divider */}
                      <span className="download-split-divider" />

                      {/* Right: open format picker dropdown */}
                      <button
                        className={`download-split-chevron${formatDropdownOpen ? ' open' : ''}`}
                        disabled={!qrMatrixInfo}
                        onClick={() => setFormatDropdownOpen(v => !v)}
                        aria-label="Choose download format"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    {/* Format picker dropdown */}
                    {formatDropdownOpen && (
                      <div className="download-format-dropdown">
                        <div className="download-format-dropdown-label">Choose format</div>
                        {[
                          { label: 'PNG',  tip: 'Best for web & sharing',    ext: '.png', Icon: FileImage, color: '#00F0FF' },
                          { label: 'SVG',  tip: 'Vector — scales to any size', ext: '.svg', Icon: FileCode, color: '#7000FF' },
                          { label: 'PDF',  tip: 'Best for documents & print', ext: '.pdf', Icon: FileText, color: '#FF007F' },
                          { label: 'JPG',  tip: 'Compressed — smaller file',  ext: '.jpg', Icon: FileImage, color: '#FFD54F' },
                        ].map(({ label, tip, ext, Icon, color }) => (
                          <button
                            key={label}
                            className={`download-format-option${selectedFormat === label ? ' active' : ''}`}
                            onClick={() => {
                              setSelectedFormat(label);
                              setFormatDropdownOpen(false);
                            }}
                          >
                              <div className="download-format-icon-wrapper" style={{ '--icon-color': color }}>
                                <Icon size={24} strokeWidth={1.5} />
                              </div>
                              <span className="download-format-name">{label}</span>

                          </button>
                        ))}
                      </div>
                    )}
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
