import { useState, useEffect, useRef, useCallback, Component } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { 
  QrCode, 
  Sun, 
  Moon, 
  CheckCircle2, 
  XCircle,
  Save,
  Download,
  Copy,
  Loader2,
  Share2,
  ChevronDown,
  FileImage,
  FileCode,
  FileText,
  Pencil,
  Palette,
  Hexagon,
  Image as ImageIcon,
  LayoutGrid,
  ShieldCheck,
  UploadCloud,
  X,
  Menu,
  Info,
  Shield,
  FileText as FileIcon,
  ExternalLink
} from 'lucide-react';
import ColorPicker from './components/ColorPicker';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import LogoUpload from './components/LogoUpload';
import LogoPresets from './components/LogoPresets';
import QRTypeSelector from './components/QRTypeSelector';
import QRDataInput from './components/QRDataInput';
import { DotStyleSelector, EyeStyleSelector } from './components/StyleSelectors';
import { generateQRMatrix, renderQR, QR_TYPES, DOT_STYLES, EYE_STYLES, FRAME_STYLES, formatQRData } from './utils/qrEngine';
import { downloadPNG, downloadSVG, downloadPDF, downloadJPG } from './utils/exportUtils';
import { saveToHistory, getPreferences, savePreferences } from './utils/storage';
import QRScanner from './components/QRScanner';
import HistoryPage from './components/HistoryPage';
import AdvancedColorPicker from './components/AdvancedColorPicker';
import { ScanLine, History } from 'lucide-react';
import { MdOutlineQrCode2, MdQrCodeScanner } from 'react-icons/md';

/* ── Color Presets ── */
const COLOR_PRESETS = [
  { name: 'Classic',  qr: '#000000', bg: '#ffffff' },
  { name: 'Midnight', qr: '#ffffff', bg: '#030305' },
  { name: 'Cyan Neon',qr: '#00F0FF', bg: '#0A0A0F' },
  { name: 'Pink Neon',qr: '#FF007F', bg: '#0A0A0F' },
  { name: 'Ocean',    qr: '#0369a1', bg: '#e0f2fe' },
  { name: 'Forest',   qr: '#166534', bg: '#dcfce7' },
  { name: 'Sunset',   qr: '#9a3412', bg: '#fff7ed' },
  { name: 'Royal',    qr: '#4f46e5', bg: '#eef2ff' },
  { name: 'Rose',     qr: '#9f1239', bg: '#fff1f2' },
  { name: 'Gold',     qr: '#854d0e', bg: '#fefce8' },
  { name: 'Mint',     qr: '#00D1B2', bg: '#F0FFF4' },
  { name: 'Lavender', qr: '#8E44AD', bg: '#F4ECF7' },
  { name: 'Solar',    qr: '#F39C12', bg: '#FCF3CF' },
  { name: 'Emerald',  qr: '#27AE60', bg: '#E9F7EF' },
  { name: 'Nordic',   qr: '#2C3E50', bg: '#ECF0F1' },
  { name: 'Deep Sea', qr: '#00416A', bg: '#E1E8EB' },
];

const MockQR = () => {
  const size = 21;
  // Actual "Hello World" (Level M) pattern bits (Simplified representation for clarity)
  const pattern = [
    "11111110010101111111",
    "10000010110001000001",
    "10111010101011011101",
    "10111010001101011101",
    "10111010111001011101",
    "10000010001111000001",
    "11111110101010111111",
    "00000000110100000000",
    "11011101101111111010",
    "00101001101001011011",
    "11101100011110011010",
    "00000000101100111011",
    "11111110111001101010",
    "10000010111101011111",
    "10111010001010110010",
    "10111010111110111101",
    "10111010101010001111",
    "10000010110111110101",
    "11111110101011011010"
  ];
  return (
    <svg width="24" height="24" viewBox="0 0 21 21" fill="none">
      {pattern.map((row, y) => 
        row.split('').map((bit, x) => bit === '1' ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
        ) : null)
      )}
    </svg>
  );
};

const FRAME_OPTIONS = [
  { 
    id: FRAME_STYLES.NONE,    
    label: 'No Frame',       
    icon: <div style={{ transform: 'scale(1.4)' }}><MockQR /></div> 
  },
  { 
    id: FRAME_STYLES.BOX,     
    label: 'Square',  
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="2" y="2" width="48" height="48" rx="2" stroke="black" strokeWidth="3" />
        <g transform="translate(14, 14)"><MockQR /></g>
      </svg>
    ) 
  },
  { 
    id: FRAME_STYLES.ROUNDED, 
    label: 'Rounded', 
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="2" y="2" width="48" height="48" rx="10" stroke="black" strokeWidth="3" />
        <g transform="translate(14, 14)"><MockQR /></g>
      </svg>
    ) 
  },
  { 
    id: FRAME_STYLES.MODERN,  
    label: 'Modern',     
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="2" y="2" width="48" height="48" rx="6" stroke="black" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="6" y="6" width="40" height="40" rx="3" stroke="black" strokeWidth="2.5" />
        <g transform="translate(14, 14)"><MockQR /></g>
      </svg>
    ) 
  },
  { 
    id: FRAME_STYLES.SCAN_ME, 
    label: 'Scan Me',      
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path d="M4 38h44v10c0 1-1 2-2 2H6c-1 0-2-1-2-2v-10z" fill="black" />
        <rect x="18" y="44" width="16" height="2" rx="1" fill="white" fillOpacity="0.8" />
        <g transform="translate(14, 10)"><MockQR /></g>
      </svg>
    ) 
  },
  { 
    id: FRAME_STYLES.TEXT_BOTTOM, 
    label: 'Stamp', 
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect x="6" y="38" width="40" height="10" rx="2" fill="black" />
        <rect x="18" y="42" width="16" height="2" rx="1" fill="white" fillOpacity="0.5" />
        <g transform="translate(14, 10)"><MockQR /></g>
      </svg>
    ) 
  },
];

/* ── Error Correction Levels ── */
const EC_LEVELS = [
  { key: 'L', label: 'L', pct: '7%',  width: 25,  desc: 'Low error correction. Best for simple QR codes with clean printing and close-range scanning.' },
  { key: 'M', label: 'M', pct: '15%', width: 50,  desc: 'Medium error correction. Good balance for most use cases — recommended as default.' },
  { key: 'Q', label: 'Q', pct: '25%', width: 75,  desc: 'Quartile error correction. Recommended when adding a logo or for medium-range scanning.' },
  { key: 'H', label: 'H', pct: '30%', width: 100, desc: 'High error correction. Best for complex logos, small print sizes, or harsh environments.' },
];

/* ── Error Boundary ── */
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
  // ── Tab & Theme ──
  const [activeTab, setActiveTab] = useState('content');
  const [activePage, setActivePage] = useState('generator'); // 'generator', 'scanner', 'history'
  const [theme, setTheme] = useState('auto');
  const [effectiveTheme, setEffectiveTheme] = useState('dark');

  // Resolve Auto Theme
  useEffect(() => {
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const check = (e) => setEffectiveTheme(e.matches ? 'dark' : 'light');
      setEffectiveTheme(mq.matches ? 'dark' : 'light');
      mq.addEventListener('change', check);
      return () => mq.removeEventListener('change', check);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);



  // ── QR Content ──
  const [qrType, setQrType] = useState(QR_TYPES.URL);
  const [qrData, setQrData] = useState({ url: 'https://example.com' });
  const [errorLevel, setErrorLevel] = useState('M');

  // ── Colors ──
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [eyeColor, setEyeColor] = useState('');
  const [eyeOuterColor, setEyeOuterColor] = useState('');
  const [syncEyes, setSyncEyes] = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  
  // ── Gradient ──
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#6c5ce7');
  const [gradientColor2, setGradientColor2] = useState('#a78bfa');
  const [gradientType, setGradientType] = useState('linear');

  // ── Shapes ──
  const [dotStyle, setDotStyle] = useState(DOT_STYLES.SQUARE);
  const [eyeStyle, setEyeStyle] = useState(EYE_STYLES.SQUARE);
  const [dotPadding, setDotPadding] = useState(0);
  const [eyePadding, setEyePadding] = useState(0);

  // ── Logo ──
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(0.18);
  const [logoPadding, setLogoPadding] = useState(10);
  const [logoBackground, setLogoBackground] = useState(false);
  const [logoBgColor, setLogoBgColor] = useState('#ffffff');
  const [logoBgShape, setLogoBgShape] = useState('circle');
  const [logoOutline, setLogoOutline] = useState(false);
  const [logoOutlineColor, setLogoOutlineColor] = useState('#ffffff');
  const [logoOutlineWidth, setLogoOutlineWidth] = useState(3);
  const [logoOutlineOpacity, setLogoOutlineOpacity] = useState(1);

  // ── Frame ──
  const [frameStyle, setFrameStyle] = useState('none');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameColor, setFrameColor] = useState('');

  // ── References ──
  const canvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const [qrMatrixInfo, setQrMatrixInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // ── Advanced Picker State ──
  const [advPicker, setAdvPicker] = useState({ open: false, color: '#000000', setter: null });
  const handleOpenAdv = (color, setter) => setAdvPicker({ open: true, color, setter });
  const [selectedFormat, setSelectedFormat] = useState('PNG');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const downloadBtnRef = useRef(null);
  const [qrAnimKey, setQrAnimKey] = useState(0);
  const [logoImgError, setLogoImgError] = useState(false);

  // ── Menu ──
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // ── Mobile App Fixes (Capacitor) ──
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.show();
        if (effectiveTheme === 'dark') {
          await StatusBar.setStyle({ style: 'DARK' });
          await StatusBar.setBackgroundColor({ color: '#030305' });
        } else {
          await StatusBar.setStyle({ style: 'LIGHT' });
          await StatusBar.setBackgroundColor({ color: '#FDFDFF' });
        }
      } catch (e) {
        console.warn('StatusBar plugin failed to update:', e);
      }
    };
    updateStatusBar();
  }, [effectiveTheme]);

  useEffect(() => {
    // Handle Android Back Button
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (advPicker.open) {
        setAdvPicker(prev => ({ ...prev, open: false }));
        return;
      }
      if (formatDropdownOpen) {
        setFormatDropdownOpen(false);
        return;
      }
      if (isMenuOpen) {
        setIsMenuOpen(false);
        return;
      }

      if (activePage !== 'generator') {
        setActivePage('generator');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [activePage, advPicker.open, formatDropdownOpen, isMenuOpen]);

  // ── Sync Eyes color with dots color when syncEyes is ON ──
  useEffect(() => {
    if (syncEyes) {
      setEyeColor(qrColor);
      setEyeOuterColor(qrColor);
    }
  }, [syncEyes, qrColor]);

  // ── Auto Theme Logic ──
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.theme) {
      setTheme(prefs.theme);
    } else {
      // Auto-detect system preference if no user preference is saved
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-update if the user hasn't explicitly set a preference
      const currentPrefs = getPreferences();
      if (!currentPrefs.theme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ── Bump canvas animation key ──
  useEffect(() => {
    if (qrMatrixInfo) setQrAnimKey(k => k + 1);
  }, [qrMatrixInfo]);

  // ── Auto-upgrade error correction when logo is present ──
  useEffect(() => {
    if (logo) {
      setErrorLevel(prev => (prev === 'L' || prev === 'M') ? 'H' : prev);
    } else {
      setErrorLevel(prev => prev === 'H' ? 'M' : prev);
    }
  }, [logo]);

  // ── Update body theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // ── Close dropdown/menu on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(e.target)) {
        setFormatDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // ── Toast ──
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Copy to Clipboard ──
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

  // ── Share ──
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

  // ── Download ──
  const FORMAT_MAP = { PNG: downloadPNG, SVG: downloadSVG, PDF: downloadPDF, JPG: downloadJPG };

  const handleDownload = async (format, downloadFn) => {
    if (!canvasRef.current) return;
    setDownloadingFormat(format);
    try {
      await downloadFn(canvasRef.current);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 800);
    }
  };

  // ── Save ──
  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataString = formatQRData(qrType, qrData);
    if (!dataString) { showToast('Please enter QR data first', 'error'); return; }
    saveToHistory({
      qrType, qrData, displayText: dataString.substring(0, 50), errorLevel,
      qrColor, bgColor, bgTransparent, gradientEnabled, gradientColor1, gradientColor2, gradientType,
      dotStyle, eyeStyle, eyeColor, eyeOuterColor, dotPadding, eyePadding,
      logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
      logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
      thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.5)
    });
    showToast('Saved to history');
  };

  // ── Generate QR Matrix ──
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

  useEffect(() => { regenerateMatrix(); }, [regenerateMatrix]);

  // ── Render Canvas ──
  const renderCanvas = useCallback(() => {
    if (!qrMatrixInfo || !canvasRef.current) return;
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      if (!canvasRef.current) return;
      renderQR(canvasRef.current, {
        ...qrMatrixInfo, size: 512,
        qrColor, bgColor, bgTransparent, dotStyle, eyeStyle,
        eyeColor: syncEyes ? qrColor : eyeColor,
        eyeOuterColor: syncEyes ? qrColor : eyeOuterColor,
        dotPadding, eyePadding,
        gradientEnabled, gradientColor1, gradientColor2, gradientType,
        logo: logo?.image, logoSize, logoPadding,
        logoBackground, logoBgColor, logoBgShape,
        logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
        quietZone: 2, frameStyle, frameText, frameColor,
      });
    }, 40);
  }, [
    qrMatrixInfo, qrColor, bgColor, bgTransparent, dotStyle, eyeStyle, eyeColor,
    eyeOuterColor, syncEyes, gradientEnabled, gradientColor1, gradientColor2, gradientType,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
    dotPadding, eyePadding, frameStyle, frameText, frameColor
  ]);

  useEffect(() => {
    renderCanvas();
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
      logo.image.onerror = () => showToast('Logo failed to load', 'error');
    }
  }, [renderCanvas, logo]);

  // ── Tab definitions ──
  const TABS = [
    { id: 'content', label: 'Content', icon: Pencil },
    { id: 'color',   label: 'Color',   icon: Palette },
    { id: 'shapes',  label: 'Shapes',  icon: Hexagon },
    { id: 'logo',    label: 'Logo',    icon: ImageIcon },
    // { id: 'frame',   label: 'Frame',   icon: LayoutGrid },
    { id: 'scan',    label: 'Scan',    icon: ShieldCheck },
  ];

  // ── Get the frame CSS class for the preview wrapper ──
  const getFrameClass = () => {
    switch (frameStyle) {
      case FRAME_STYLES.BOX: return 'frame-simple-border';
      case FRAME_STYLES.ROUNDED: return 'frame-rounded-border';
      case FRAME_STYLES.MODERN: return 'frame-shadow-box';
      case FRAME_STYLES.SCAN_ME: return 'frame-neon-glow';
      case FRAME_STYLES.TEXT_BOTTOM: return 'frame-vintage-stamp';
      default: return '';
    }
  };

  return (
    <div className="app redesigned">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-logo">
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

        <div className="app-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Main App Navigation */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '20px', marginRight: '8px' }}>
            <button
              className={`btn-theme-toggle`}
              onClick={() => setActivePage('generator')}
              title="QR Generator"
              style={{
                background: activePage === 'generator' ? 'var(--accent-primary)' : 'transparent',
                color: activePage === 'generator' ? '#000' : 'var(--text-primary)'
              }}
            >
              <MdOutlineQrCode2 size={20} />
            </button>
            <button
              className={`btn-theme-toggle`}
              onClick={() => setActivePage('scanner')}
              title="QR Scanner"
              style={{
                background: activePage === 'scanner' ? 'var(--accent-primary)' : 'transparent',
                color: activePage === 'scanner' ? '#000' : 'var(--text-primary)'
              }}
            >
              <MdQrCodeScanner size={20} />
            </button>
          </div>

          <div className="menu-container" ref={menuRef} style={{ position: 'relative' }}>
            <button
              className={`btn-menu-toggle ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            {isMenuOpen && (
              <div className="app-dropdown-menu fade-in">
                <div className="menu-links">
                  <button className={`menu-link-btn ${activePage === 'history' ? 'active' : ''}`} onClick={() => { setIsMenuOpen(false); setActivePage('history'); }}>
                    <History size={16} /> History
                  </button>
                  <button
                    className="menu-link-btn"
                    onClick={() => {
                      let next;
                      if (theme === 'dark') next = 'light';
                      else if (theme === 'light') next = 'auto';
                      else next = 'dark';
                      
                      setTheme(next);
                      savePreferences({ ...getPreferences(), theme: next });
                    }}
                  >
                    {theme === 'dark' ? (
                      <Moon size={16} />
                    ) : theme === 'light' ? (
                      <Sun size={16} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20" />
                        <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Theme <span style={{ 
                      textTransform: 'capitalize', 
                      marginLeft: 4,
                      color: theme === 'dark' ? '#00F0FF' : theme === 'light' ? '#FF007F' : (effectiveTheme === 'dark' ? '#00F0FF' : '#FF007F'),
                      fontWeight: 'bold'
                    }}>{theme}</span>
                  </button>
                  <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/about'}>
                    <Info size={16} /> About
                  </button>
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/privacy-policy'}>
                    <Shield size={16} /> Privacy Policy
                  </button>
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/terms'}>
                    <FileIcon size={16} /> Terms of Service
                  </button>
                </div>
                <div className="menu-footer">
                  <p>© 2026 MushiQR Pro</p>
                  <p>All rights reserved</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <AdvancedColorPicker 
          isOpen={advPicker.open}
          initialColor={advPicker.color}
          onChange={(newColor) => {
            if (advPicker.setter) advPicker.setter(newColor);
          }}
          onConfirm={(newColor) => {
            if (advPicker.setter) advPicker.setter(newColor);
            setAdvPicker({ ...advPicker, open: false });
          }}
          onCancel={() => {
            // Restore original color if canceled
            if (advPicker.setter) advPicker.setter(advPicker.color);
            setAdvPicker({ ...advPicker, open: false });
          }}
        />
      </header>

      {/* ── Main Content Area ── */}
      <main className="app-main-redesigned">
        {activePage === 'generator' ? (
          <>
            {/* ── QR Preview Card (always visible) ── */}
            <ErrorBoundary>
              <section className="qr-preview-card">
                <div className={`qr-preview-wrapper ${getFrameClass()}`}>
                  {!qrMatrixInfo ? (
                    <div className="preview-placeholder">
                      <span className="preview-placeholder-icon">
                        <QrCode size={80} color="var(--accent-primary)" strokeWidth={1} />
                      </span>
                      <span className="preview-placeholder-text">Your QR code will appear here</span>
                    </div>
                  ) : (
                    <canvas key={qrAnimKey} ref={canvasRef} className="preview-canvas" />
                  )}
                </div>

                {/* Unified Save & Actions Button */}
                <div className="save-split-wrapper" ref={downloadBtnRef}>
                  <div className={`save-split-btn${!qrMatrixInfo ? ' disabled' : ''}`}>
                    <button
                      className="save-split-main"
                      disabled={!qrMatrixInfo}
                      onClick={() => handleDownload(selectedFormat, FORMAT_MAP[selectedFormat])}
                    >
                      {downloadingFormat === selectedFormat
                        ? <Loader2 size={17} className="spinning" />
                        : <Download size={17} />
                      }
                      Save {selectedFormat}
                    </button>
                    <span className="save-split-divider" />
                    <button
                      className={`save-split-chevron${formatDropdownOpen ? ' open' : ''}`}
                      disabled={!qrMatrixInfo}
                      onClick={() => setFormatDropdownOpen(v => !v)}
                      aria-label="Action menu"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  {formatDropdownOpen && (
                    <div className="save-action-dropdown">
                      <div className="dropdown-section">
                        <div className="dropdown-label">Export Format</div>
                        <div className="format-grid">
                          {[
                            { label: 'PNG', Icon: FileImage, color: '#00F0FF' },
                            { label: 'SVG', Icon: FileCode, color: '#7000FF' },
                            { label: 'PDF', Icon: FileText, color: '#FF007F' },
                            { label: 'JPG', Icon: FileImage, color: '#FFD54F' },
                          ].map(({ label, Icon, color }) => (
                            <button
                              key={label}
                              className={`format-option${selectedFormat === label ? ' active' : ''}`}
                              onClick={() => { setSelectedFormat(label); setFormatDropdownOpen(false); }}
                            >
                              <Icon size={18} color={selectedFormat === label ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="dropdown-divider" />

                      <div className="dropdown-section">
                        <div className="dropdown-label">Actions</div>
                        <div className="dropdown-actions-row">
                          <button className="dropdown-action-btn primary" onClick={() => { handleSave(); setFormatDropdownOpen(false); }}>
                            <History size={18} /> <span>Save to History</span>
                          </button>
                          <button className="dropdown-action-btn" onClick={() => { handleCopyToClipboard(); setFormatDropdownOpen(false); }} title="Copy Image">
                            <Copy size={18} />
                          </button>
                          {typeof navigator !== 'undefined' && navigator.canShare && (
                            <button className="dropdown-action-btn" onClick={() => { handleShare(); setFormatDropdownOpen(false); }} title="Share QR Code">
                              <Share2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </ErrorBoundary>

            {/* ── Tab Panel Content ── */}
            <section className="tab-panel-area">
              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="tab-panel fade-in" id="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="panel-label" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '15px' }}>
                      Select QR Content Type
                    </label>
                    <QRTypeSelector 
                      activeType={qrType} 
                      onTypeChange={(type) => { 
                        setQrType(type); 
                        setIsDataModalOpen(true); 
                      }} 
                    />
                  </div>
                </div>
              )}

              {/* Color Tab */}
              {activeTab === 'color' && (
                <div className="tab-panel fade-in" id="panel-color">
                  <div>
                    <div className="eye-colors-grid">
                      <ColorPicker className="compact-picker" label="Background" value={bgColor} onChange={setBgColor} onOpenAdvanced={handleOpenAdv} />
                      <ColorPicker className="compact-picker" label="Dots Color" value={qrColor} onChange={setQrColor} onOpenAdvanced={handleOpenAdv} />
                    </div>

                    <div className="toggle-row" style={{ marginBottom: '12px' }}>
                      <Toggle label="Sync Eyes with Dots" checked={syncEyes} onChange={setSyncEyes} />
                    </div>

                    <div className="eye-colors-grid">
                      <ColorPicker 
                        className="compact-picker" 
                        label="Inner Eyes" 
                        value={syncEyes ? qrColor : (eyeColor || qrColor)} 
                        onChange={setEyeColor} 
                        onOpenAdvanced={handleOpenAdv}
                        disabled={syncEyes}
                      />
                      <ColorPicker 
                        className="compact-picker" 
                        label="Outer Eyes" 
                        value={syncEyes ? qrColor : (eyeOuterColor || qrColor)} 
                        onChange={setEyeOuterColor} 
                        onOpenAdvanced={handleOpenAdv}
                        disabled={syncEyes}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <label className="panel-label">Quick Presets</label>
                    <div className="color-presets-row">
                      {COLOR_PRESETS.map(preset => (
                        <div
                          key={preset.name}
                          className={`color-preset-swatch${activePreset === preset.name ? ' active' : ''}`}
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
                </div>
              )}

              {/* Shapes Tab */}
              {activeTab === 'shapes' && (
                <div className="tab-panel fade-in" id="panel-shapes">
                  <div>
                    <label className="panel-label">Corner Style</label>
                    <EyeStyleSelector value={eyeStyle} onChange={setEyeStyle} />
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <label className="panel-label">Dot Style</label>
                    <DotStyleSelector value={dotStyle} onChange={setDotStyle} />
                  </div>
                </div>
              )}

              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="tab-panel fade-in" id="panel-logo" style={{ overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <LogoUpload logo={logo} onLogoChange={setLogo} onLogoRemove={() => setLogo(null)} />

                    {logo && (
                      <>
                        <Slider
                          label="Logo Size"
                          value={logoSize}
                          min={0.1}
                          max={0.4}
                          step={0.01}
                          onChange={setLogoSize}
                        />
                        <Slider
                          label="Logo Padding"
                          value={logoPadding}
                          min={0}
                          max={20}
                          step={1}
                          onChange={setLogoPadding}
                          unit="px"
                        />

                        <div className="toggle-row">
                          <Toggle label="Smart Stroke" checked={logoOutline} onChange={setLogoOutline} />
                          <span className="toggle-hint">Outline logo for better visibility</span>
                        </div>
                        {logoOutline && (
                          <div className="nested-panel-section fade-in" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ColorPicker label="Stroke Color" value={logoOutlineColor} onChange={setLogoOutlineColor} onOpenAdvanced={handleOpenAdv} />
                            <Slider
                              label="Stroke Width"
                              value={logoOutlineWidth}
                              min={1}
                              max={10}
                              step={1}
                              onChange={setLogoOutlineWidth}
                              unit="px"
                            />
                          </div>
                        )}

                        <div className="toggle-row">
                          <Toggle label="Logo Background" checked={logoBackground} onChange={setLogoBackground} />
                          <span className="toggle-hint">Add shape behind logo</span>
                        </div>
                        {logoBackground && (
                          <div className="nested-panel-section fade-in" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ColorPicker label="Background Color" value={logoBgColor} onChange={setLogoBgColor} onOpenAdvanced={handleOpenAdv} />
                            <div className="selector-group">
                              <label className="panel-label-sub">Shape</label>
                              <div className="tabs-mini" style={{ display: 'flex', gap: '8px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px' }}>
                                {['circle', 'square'].map(s => (
                                  <button
                                    key={s}
                                    className={`tab-mini-btn ${logoBgShape === s ? 'active' : ''}`}
                                    onClick={() => setLogoBgShape(s)}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: logoBgShape === s ? 'var(--accent-primary)' : 'transparent',
                                      color: logoBgShape === s ? '#fff' : 'var(--text-secondary)',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      textTransform: 'capitalize',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <label className="panel-label">Quick Social Logos</label>
                    <LogoPresets onLogoChange={setLogo} />
                  </div>
                </div>
              )}

              {/* Frame Tab - Temporarily Hidden */}
              {/* activeTab === 'frame' && (
                <div className="tab-panel fade-in" id="panel-frame">
                  <div style={{ marginTop: 'auto' }}>
                    <label className="panel-label">Frame Style</label>
                    <div className="frame-options-list">
                      {FRAME_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          className={`frame-option-btn${frameStyle === opt.id ? ' active' : ''}`}
                          onClick={() => setFrameStyle(opt.id)}
                        >
                          <span className="frame-option-icon">{opt.icon}</span>
                          <span className="frame-option-label">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) */}

              {/* Scan Reliability Tab */}
              {activeTab === 'scan' && (
                <div className="tab-panel fade-in" id="panel-scan">
                  <div>
                    <p className="ec-description">
                      {EC_LEVELS.find(l => l.key === errorLevel)?.desc}
                    </p>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <label className="panel-label">Scan Reliability</label>
                    <div className="ec-buttons-row">
                      {EC_LEVELS.map(lv => (
                        <button
                          key={lv.key}
                          className={`ec-btn${errorLevel === lv.key ? ' active' : ''}`}
                          onClick={() => setErrorLevel(lv.key)}
                        >
                          <span className="ec-btn-letter">{lv.label}</span>
                          <span className="ec-btn-pct">{lv.pct}</span>
                        </button>
                      ))}
                    </div>
                    <div className="reliability-bar-track" style={{ marginTop: '8px' }}>
                      <div
                        className="reliability-bar-fill"
                        style={{ width: `${EC_LEVELS.find(l => l.key === errorLevel)?.width || 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

            </section>
          </>
        ) : activePage === 'scanner' ? (
          <QRScanner onBack={() => setActivePage('generator')} />
        ) : (
          <HistoryPage />
        )}
      </main>

      {/* ── Bottom Navigation Bar (Only for Generator) ── */}
      {activePage === 'generator' && (
        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`bottom-nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="bottom-nav-highlight" />
              <span className="bottom-nav-icon">
                <tab.icon size={20} strokeWidth={2} />
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── QR Data Modal ── */}
      {isDataModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDataModalOpen(false)}>
          <div className="modal-container glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <h3>{qrType.split('_').join(' ')}</h3>
                <p>Enter the details below</p>
              </div>
              <button className="modal-close" onClick={() => setIsDataModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <QRDataInput type={qrType} data={qrData} onChange={setQrData} />
            </div>
            <button className="modal-done-btn" onClick={() => setIsDataModalOpen(false)}>
              Update QR Code
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
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
