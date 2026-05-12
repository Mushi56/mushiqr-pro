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
  ChevronUp,
  FileImage,
  FileCode,
  FileText,
  Pencil,
  Palette,
  Pipette,
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
  ExternalLink,
  Home,
  Bookmark,
  Settings,
  Type,
  Plus
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
import { saveToHistory, getSaved, saveToSaved, getPreferences, savePreferences } from './utils/storage';
import QRScanner from './components/QRScanner';
import HistoryPage from './components/HistoryPage';
import HomePage from './components/HomePage';
import SavedPage from './components/SavedPage';
import SettingsPage from './components/SettingsPage';
import AdvancedColorPicker from './components/AdvancedColorPicker';
import AppIcon from './components/AppIcon';
import { ScanLine, History } from 'lucide-react';
import { MdOutlineQrCode2, MdQrCodeScanner } from 'react-icons/md';

/* ── Color Presets ── */
const COLOR_PRESETS = [
  { name: 'Classic', qr: '#000000', bg: '#ffffff' },
  { name: 'Midnight', qr: '#ffffff', bg: '#030305' },
  { name: 'Cyan Neon', qr: '#00F0FF', bg: '#0A0A0F' },
  { name: 'Pink Neon', qr: '#FF007F', bg: '#0A0A0F' },
  { name: 'Ocean', qr: '#0369a1', bg: '#e0f2fe' },
  { name: 'Forest', qr: '#166534', bg: '#dcfce7' },
  { name: 'Sunset', qr: '#9a3412', bg: '#fff7ed' },
  { name: 'Royal', qr: '#4f46e5', bg: '#eef2ff' },
  { name: 'Rose', qr: '#9f1239', bg: '#fff1f2' },
  { name: 'Gold', qr: '#854d0e', bg: '#fefce8' },
  { name: 'Mint', qr: '#00D1B2', bg: '#F0FFF4' },
  { name: 'Lavender', qr: '#8E44AD', bg: '#F4ECF7' },
  { name: 'Solar', qr: '#F39C12', bg: '#FCF3CF' },
  { name: 'Emerald', qr: '#27AE60', bg: '#E9F7EF' },
  { name: 'Nordic', qr: '#2C3E50', bg: '#ECF0F1' },
  { name: 'Deep Sea', qr: '#00416A', bg: '#E1E8EB' },
];

const SWATCH_PRESETS = [
  '#000000', '#FFFFFF', '#FF3B30', '#34C759',
  '#007AFF', '#FFCC00', '#AF52DE', '#FF9500',
  '#5856D6', '#FF2D55', '#00F0FF', '#7000FF',
  '#FF007F', '#00D1FF', '#FFD700', '#8E8E93'
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
  { key: 'L', label: 'L', pct: '7%', width: 25, desc: 'Low error correction. Best for simple QR codes with clean printing and close-range scanning.' },
  { key: 'M', label: 'M', pct: '15%', width: 50, desc: 'Medium error correction. Good balance for most use cases — recommended as default.' },
  { key: 'Q', label: 'Q', pct: '25%', width: 75, desc: 'Quartile error correction. Recommended when adding a logo or for medium-range scanning.' },
  { key: 'H', label: 'H', pct: '30%', width: 100, desc: 'High error correction. Best for complex logos, small print sizes, or harsh environments.' },
];

const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter' },
  { id: 'Outfit', label: 'Outfit' },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Playfair Display', label: 'Playfair Display' },
  { id: 'Oswald', label: 'Oswald' },
  { id: 'Pacifico', label: 'Pacifico' },
  { id: 'Caveat', label: 'Caveat' },
  { id: 'Dancing Script', label: 'Dancing Script' },
  { id: 'Bebas Neue', label: 'Bebas Neue' },
  { id: 'Lobster', label: 'Lobster' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Open Sans', label: 'Open Sans' },
  { id: 'Lato', label: 'Lato' },
  { id: 'Poppins', label: 'Poppins' },
  { id: 'Raleway', label: 'Raleway' },
  { id: 'Merriweather', label: 'Merriweather' },
  { id: 'Noto Sans', label: 'Noto Sans' },
  { id: 'Ubuntu', label: 'Ubuntu' },
  { id: 'Anton', label: 'Anton' },
  { id: 'Permanent Marker', label: 'Permanent Marker' },
  { id: 'Righteous', label: 'Righteous' },
  { id: 'Cinzel', label: 'Cinzel' },
  { id: 'Courgette', label: 'Courgette' },
  { id: 'Fredoka One', label: 'Fredoka One' },
  { id: 'Great Vibes', label: 'Great Vibes' },
  { id: 'Kanit', label: 'Kanit' },
  { id: 'Luckiest Guy', label: 'Luckiest Guy' },
  { id: 'Orbitron', label: 'Orbitron' },
  { id: 'Quicksand', label: 'Quicksand' },
  { id: 'Satisfy', label: 'Satisfy' },
];

/* ── Error Boundary ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('QR Engine error:', err); }
  render() {
    if (this.state.hasError) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-secondary)', padding: 40 }}>
        <QrCode size={48} strokeWidth={1} color="var(--text-muted)" />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Something went wrong generating your QR.</p>
        <p style={{ fontSize: 13 }}>Please check your input and try again.</p>
        <button className="btn btn-primary btn-sm" onClick={() => this.setState({ hasError: false })}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}


export default function App() {
  // ── Tab & Theme ──
  const [activeTab, setActiveTab] = useState('content');
  const [tabHistory, setTabHistory] = useState([]);
  const [activePage, setActivePage] = useState('home'); // 'home', 'generator', 'scanner', 'history'
  const [previousPage, setPreviousPage] = useState('home');
  const [theme, setTheme] = useState('auto');
  const [effectiveTheme, setEffectiveTheme] = useState('dark');

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(tabId);
    }
  };

  // Custom navigation wrapper to track history
  const navigateTo = (page) => {
    if (page !== activePage) {
      setPreviousPage(activePage);
      setActivePage(page);
      // Clear tab history when starting a new session or returning home
      if (page === 'generator' || page === 'home') {
        setTabHistory([]);
        if (page === 'generator') setActiveTab('content');
      }
    }
  };

  const goBack = () => {
    // 1. Close overlays first
    if (advPicker.open) {
      setAdvPicker(prev => ({ ...prev, open: false }));
      return;
    }
    if (formatDropdownOpen) {
      setFormatDropdownOpen(false);
      return;
    }
    if (isNavExpanded) {
      setIsNavExpanded(false);
      return;
    }
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    if (isDataModalOpen) {
      setIsDataModalOpen(false);
      return;
    }

    // 2. Navigation logic
    if (activePage === 'scanner') {
      // From Scan to Home
      setActivePage('home');
    } else if (activePage === 'generator') {
      // ── IMPROVED CREATOR NAVIGATION ──
      // If we have tab history, go back to previous tab
      if (tabHistory.length > 0) {
        const lastTab = tabHistory[tabHistory.length - 1];
        setTabHistory(prev => prev.slice(0, -1));
        setActiveTab(lastTab);
        return;
      }

      // If no tab history, exit to home immediately
      setActivePage(previousPage || 'home');
    } else if (activePage === 'history') {
      // From History/Recent/Menu to previous tab
      setActivePage(previousPage || 'home');
    } else if (activePage !== 'home') {
      setActivePage('home');
    }
  };

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
  const [frameFont, setFrameFont] = useState('Inter');
  const [textCenterEnabled, setTextCenterEnabled] = useState(false);
  const [textCenterText, setTextCenterText] = useState('');
  const [textCenterSize, setTextCenterSize] = useState(0.18);
  const [textCenterColor, setTextCenterColor] = useState('#000000');
  const [textCenterFont, setTextCenterFont] = useState('Inter');
  const [textCenterStrokeEnabled, setTextCenterStrokeEnabled] = useState(false);
  const [textCenterStrokeWidth, setTextCenterStrokeWidth] = useState(5);
  const [textCenterStrokeColor, setTextCenterStrokeColor] = useState('#ffffff');
  const [textCenterShadowEnabled, setTextCenterShadowEnabled] = useState(false);
  const [textCenterShadowBlur, setTextCenterShadowBlur] = useState(10);
  const [textCenterShadowColor, setTextCenterShadowColor] = useState('rgba(0,0,0,0.5)');

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
  const [logoImgError, setLogoImgError] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);
  const fontInputRef = useRef(null);

  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const fontData = event.target.result;
        const fontFace = new FontFace(fontName, fontData);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        
        const newFont = { id: fontName, label: file.name.split('.')[0], isCustom: true };
        setCustomFonts(prev => [...prev, newFont]);
        setTextCenterFont(fontName);
        showToast(`Font "${file.name}" installed successfully!`, 'success');
      } catch (err) {
        console.error('Font load error:', err);
        showToast('Failed to load font file. Use TTF, OTF or WOFF.', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset input so same file can be uploaded again if needed
    e.target.value = '';
  };

  // ── Menu ──
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // ── Bottom Nav Toggle ──
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // ── Mobile App Fixes (Capacitor) ──
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.show();
        // Set overlaysWebView to TRUE and add padding in CSS for the 24dp status bar
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        if (effectiveTheme === 'dark') {
          await StatusBar.setStyle({ style: 'DARK' }); // Light text/icons for dark background
          await StatusBar.setBackgroundColor({ color: '#13131D' });
        } else {
          await StatusBar.setStyle({ style: 'LIGHT' }); // Dark text/icons for light background
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        }
      } catch (e) {
        console.warn('StatusBar plugin failed to update:', e);
      }
    };
    updateStatusBar();
  }, [effectiveTheme]);


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


  // ── Save to History when leaving the generator page ──
  const prevPageRef = useRef(activePage);
  useEffect(() => {
    const prevPage = prevPageRef.current;
    prevPageRef.current = activePage;

    // Save generated code to history when navigating AWAY from the generator
    if (prevPage === 'generator' && activePage !== 'generator') {
      const dataString = formatQRData(qrType, qrData);
      if (dataString) {
        saveToHistory({
          source: 'create',
          qrType, qrData, displayText: dataString.substring(0, 50), errorLevel,
          qrColor, bgColor, bgTransparent, gradientEnabled, gradientColor1, gradientColor2, gradientType,
          dotStyle, eyeStyle, eyeColor, eyeOuterColor, dotPadding, eyePadding,
          logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
          logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
          logoSrc: logo?.src || null,
          logoName: logo?.name || null,
          thumbnail: canvasRef.current?.toDataURL('image/jpeg', 0.2) || null
        });
      }
    }
  }, [activePage]);

  // ── Auto-upgrade error correction when logo is present ──
  useEffect(() => {
    if (logo) {
      setErrorLevel(prev => (prev === 'L' || prev === 'M') ? 'H' : prev);
    } else {
      setErrorLevel(prev => prev === 'H' ? 'M' : prev);
    }
  }, [logo]);

  // ── Android Back Button Logic ──
  // ── Back Button Handling (Centralized) ──
  const lastBackPress = useRef(0);
  const backHandlerRef = useRef();

  // Update the ref whenever dependencies change
  backHandlerRef.current = () => {
    if (activePage === 'home' && !advPicker.open && !formatDropdownOpen && !isMenuOpen && !isDataModalOpen) {
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress.current = now;
        showToast('Press back again to exit', 'info');
      }
    } else {
      goBack();
    }
  };

  useEffect(() => {
    const setupListener = async () => {
      const backListener = await CapApp.addListener('backButton', (data) => {
        // data.canGoBack is available but we handle navigation internally
        if (backHandlerRef.current) {
          backHandlerRef.current();
        }
      });
      return backListener;
    };

    const listenerPromise = setupListener();
    
    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, []); // Run once on mount

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

  // ── Save to Saved ──
  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataString = formatQRData(qrType, qrData);
    if (!dataString) { showToast('Please enter QR data first', 'error'); return; }
    
    // We already save to history automatically, but user clicked "Add to Saved"
    saveToSaved({
      source: 'create',
      qrType, qrData, displayText: dataString.substring(0, 50), errorLevel,
      qrColor, bgColor, bgTransparent, gradientEnabled, gradientColor1, gradientColor2, gradientType,
      dotStyle, eyeStyle, eyeColor, eyeOuterColor, dotPadding, eyePadding,
      logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
      logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
      logoSrc: logo?.src || null,
      logoName: logo?.name || null,
      thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.5)
    });
    showToast('Added to Saved QRs', 'success');
  };

  // ── Load QR ──
  const handleLoadQR = (item) => {
    if (!item) return;
    
    // Core data
    if (item.qrType) setQrType(item.qrType);
    if (item.qrData) setQrData(item.qrData);
    if (item.errorLevel) setErrorLevel(item.errorLevel);

    // Appearance
    if (item.qrColor) setQrColor(item.qrColor);
    if (item.bgColor) setBgColor(item.bgColor);
    if (item.bgTransparent !== undefined) setBgTransparent(item.bgTransparent);
    if (item.gradientEnabled !== undefined) setGradientEnabled(item.gradientEnabled);
    if (item.gradientColor1) setGradientColor1(item.gradientColor1);
    if (item.gradientColor2) setGradientColor2(item.gradientColor2);
    if (item.gradientType) setGradientType(item.gradientType);

    // Shapes
    if (item.dotStyle) setDotStyle(item.dotStyle);
    if (item.eyeStyle) setEyeStyle(item.eyeStyle);
    if (item.dotPadding !== undefined) setDotPadding(item.dotPadding);
    if (item.eyePadding !== undefined) setEyePadding(item.eyePadding);

    // Logo (Note: logo.image is not serializable, so we only have metadata in storage usually)
    // If the storage includes a logo placeholder or source, we'd handle it here.
    // For now, we clear the logo or keep it if it's not provided in the template.
    if (item.logo === null) setLogo(null);
    if (item.logoSize) setLogoSize(item.logoSize);
    if (item.logoPadding !== undefined) setLogoPadding(item.logoPadding);
    if (item.logoBackground !== undefined) setLogoBackground(item.logoBackground);
    if (item.logoBgColor) setLogoBgColor(item.logoBgColor);
    if (item.logoBgShape) setLogoBgShape(item.logoBgShape);
    if (item.logoOutline !== undefined) setLogoOutline(item.logoOutline);
    if (item.logoOutlineColor) setLogoOutlineColor(item.logoOutlineColor);
    if (item.logoOutlineWidth !== undefined) setLogoOutlineWidth(item.logoOutlineWidth);
    if (item.logoOutlineOpacity !== undefined) setLogoOutlineOpacity(item.logoOutlineOpacity);

    // Reconstruct logo image if src exists
    if (item.logoSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLogo({
          image: img,
          name: item.logoName || 'Logo',
          src: item.logoSrc
        });
      };
      img.src = item.logoSrc;
    } else {
      setLogo(null);
    }

    setFrameColor(item.frameColor);

    // Reset tab history when loading a template
    setTabHistory([]);
    navigateTo('generator');
    showToast('Template loaded');
  };

  const resetGenerator = () => {
    // Content
    setQrType(QR_TYPES.URL);
    setQrData({ url: 'https://example.com' });
    setErrorLevel('M');

    // Appearance
    setQrColor('#000000');
    setBgColor('#ffffff');
    setBgTransparent(false);
    setSyncEyes(true);
    setEyeColor('');
    setEyeOuterColor('');
    setActivePreset(null);

    // Gradient
    setGradientEnabled(false);
    setGradientColor1('#6c5ce7');
    setGradientColor2('#a78bfa');
    setGradientType('linear');

    // Shapes
    setDotStyle(DOT_STYLES.SQUARE);
    setEyeStyle(EYE_STYLES.SQUARE);
    setDotPadding(0);
    setEyePadding(0);

    // Logo
    setLogo(null);
    setLogoSize(0.18);
    setLogoPadding(10);
    setLogoBackground(false);
    setLogoBgColor('#ffffff');
    setLogoBgShape('circle');
    setLogoOutline(false);
    setLogoOutlineColor('#ffffff');
    setLogoOutlineWidth(3);
    setLogoOutlineOpacity(1);

    // Frame
    setFrameStyle('none');
    setFrameText('SCAN ME');
    setFrameColor('');

    // Tabs
    setActiveTab('content');
    setTabHistory([]);
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

  // ── Device Capability Detection ──
  const isLowEndDevice = typeof navigator !== 'undefined' && 
    ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || 
     (navigator.deviceMemory && navigator.deviceMemory <= 4));
  const RENDER_DELAY = isLowEndDevice ? 60 : 0; // Throttle low-end to ~16fps, High-end uses native requestAnimationFrame (60-120fps)

  // ── Render Canvas ──
  const renderCanvas = useCallback(() => {
    if (!qrMatrixInfo || !canvasRef.current) return;
    
    const executeRender = async () => {
      // Fix: Wait for fonts to be ready so canvas renders correctly
      if (document.fonts) await document.fonts.ready;
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
        quietZone: 2, frameStyle, frameText, frameColor, frameFont,
        textCenter: textCenterEnabled ? textCenterText : null, 
        textCenterSize, textCenterColor, textCenterFont,
        textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
        textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
      });
    };

    if (isLowEndDevice) {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = setTimeout(executeRender, RENDER_DELAY);
    } else {
      if (renderTimeoutRef.current) cancelAnimationFrame(renderTimeoutRef.current);
      renderTimeoutRef.current = requestAnimationFrame(executeRender);
    }
  }, [
    qrMatrixInfo, qrColor, bgColor, bgTransparent, dotStyle, eyeStyle, eyeColor,
    eyeOuterColor, syncEyes, gradientEnabled, gradientColor1, gradientColor2, gradientType,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity,
    dotPadding, eyePadding, frameStyle, frameText, frameColor, frameFont,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor
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
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'shapes', label: 'Shapes', icon: Hexagon },
    { id: 'logo', label: 'Logo', icon: ImageIcon },
    // { id: 'frame',   label: 'Frame',   icon: LayoutGrid },
    { id: 'text', label: 'Text', icon: Type },
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
      <header className={`app-header ${['home', 'saved', 'history', 'settings'].includes(activePage) ? 'header-home' : ''}`}>
        <div className="app-logo">
          {activePage === 'scanner' && (
            <button 
              onClick={goBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '8px',
                marginRight: '8px',
                marginLeft: '-8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
          <AppIcon size={36} shadow />
          <div className="app-logo-text" style={{ whiteSpace: 'nowrap' }}>Mushi QR <span>Pro</span></div>
        </div>

        <div className="app-header-actions">
          {activePage === 'generator' && (
            <>
              <div className="header-save-container" ref={downloadBtnRef} style={{ position: 'relative' }}>
                <button
                  className={`btn-header-action btn-header-save ${!qrMatrixInfo ? 'disabled' : ''} ${formatDropdownOpen ? 'active' : ''}`}
                  onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                  disabled={!qrMatrixInfo}
                  title="Save As..."
                >
                  <Save size={20} />
                  <ChevronDown size={14} style={{ marginLeft: 2, opacity: 0.8 }} />
                </button>

                {formatDropdownOpen && (
                  <div className="app-dropdown-menu save-as-dropdown fade-in" style={{ top: 'calc(100% + 12px)', right: 0, width: '280px' }}>
                    
                    <div className="dropdown-section" style={{ padding: '12px' }}>
                      <div className="dropdown-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Export Format</div>
                      <div className="format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'PNG', Icon: FileImage },
                          { label: 'SVG', Icon: FileCode },
                          { label: 'PDF', Icon: FileText },
                          { label: 'JPG', Icon: FileImage },
                        ].map(({ label, Icon }) => (
                          <button
                            key={label}
                            className={`format-option ${selectedFormat === label ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFormat(label);
                              setFormatDropdownOpen(false);
                              handleDownload(label, FORMAT_MAP[label]);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              aspectRatio: '1 / 1',
                              padding: '0',
                              background: selectedFormat === label ? 'var(--accent-soft)' : 'var(--bg-hover)',
                              border: '1px solid',
                              borderColor: selectedFormat === label ? 'var(--accent-primary)' : 'transparent',
                              borderRadius: '12px',
                              color: selectedFormat === label ? 'var(--accent-primary)' : 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Icon size={18} />
                            <span style={{ fontSize: '10px', fontWeight: 700 }}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dropdown-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />

                    <div className="dropdown-section" style={{ padding: '12px' }}>
                      <div className="dropdown-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Scan Reliability</div>
                      <div className="ec-buttons-row" style={{ marginBottom: '10px', gap: '8px' }}>
                        {EC_LEVELS.map(lv => (
                          <button
                            key={lv.key}
                            className={`ec-btn${errorLevel === lv.key ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setErrorLevel(lv.key); }}
                          >
                            <span className="ec-btn-letter">{lv.label}</span>
                            <span className="ec-btn-pct">{lv.pct}</span>
                          </button>
                        ))}
                      </div>
                      <div className="reliability-bar-track" style={{ height: '4px', background: 'rgba(214, 0, 54, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          className="reliability-bar-fill"
                          style={{ 
                            width: `${EC_LEVELS.find(l => l.key === errorLevel)?.width || 50}%`,
                            height: '100%',
                            background: 'var(--accent-primary)',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    <div className="dropdown-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />

                    <div className="dropdown-section" style={{ padding: '12px' }}>
                      <div className="dropdown-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Quick Actions</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="menu-link-btn"
                          onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(); setFormatDropdownOpen(false); }}
                          style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', padding: 0 }}
                          title="Copy Image"
                        >
                          <Copy size={20} />
                        </button>
                        <button
                          className="menu-link-btn"
                          onClick={(e) => { e.stopPropagation(); handleSave(); setFormatDropdownOpen(false); }}
                          style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', padding: 0 }}
                          title="Add to Saved"
                        >
                          <Bookmark size={20} />
                        </button>
                        {typeof navigator !== 'undefined' && navigator.canShare && (
                          <button
                            className="menu-link-btn"
                            onClick={(e) => { e.stopPropagation(); handleShare(); setFormatDropdownOpen(false); }}
                            style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', padding: 0 }}
                            title="Share QR Code"
                          >
                            <Share2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  <div className="app-dropdown-menu fade-in" style={{ top: 'calc(100% + 12px)', right: 0 }}>
                    <div className="menu-links">
                      <button className={`menu-link-btn ${activePage === 'home' ? 'active' : ''}`} onClick={() => { setIsMenuOpen(false); navigateTo('home'); }}>
                        <Home size={16} /> Home
                      </button>
                      <button className={`menu-link-btn ${activePage === 'history' ? 'active' : ''}`} onClick={() => { setIsMenuOpen(false); navigateTo('history'); }}>
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
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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
                    <canvas ref={canvasRef} className="preview-canvas" style={{ willChange: 'transform' }} />
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
                <div className="tab-panel fade-in" id="panel-color" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                  <div className="color-customization-rows" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Quick Themes Section */}
                    <div>
                      <label className="panel-label">Quick Themes</label>
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
                              setLogoBgColor(preset.bg);
                              setLogoOutlineColor(preset.qr);
                              setBgTransparent(false);
                              setActivePreset(preset.name);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Dots Row */}
                    <div className="color-row-item">
                      <div className="color-row-header">
                        <label className="panel-label">Dots</label>
                      </div>
                      <div className="swatch-grid-mini">
                        <ColorPicker
                          isSwatch={true}
                          icon={Pipette}
                          value={qrColor}
                          onChange={(c) => { setQrColor(c); setLogoOutlineColor(c); }}
                          onOpenAdvanced={handleOpenAdv}
                        />
                        {SWATCH_PRESETS.map(color => (
                          <div
                            key={color}
                            className={`swatch-item${qrColor === color ? ' active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => { setQrColor(color); setLogoOutlineColor(color); }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Background Row */}
                    <div className="color-row-item">
                      <div className="color-row-header">
                        <label className="panel-label">Background</label>
                      </div>
                      <div className="swatch-grid-mini">
                        <ColorPicker
                          isSwatch={true}
                          icon={Pipette}
                          value={bgColor}
                          onChange={(c) => { setBgColor(c); setLogoBgColor(c); setBgTransparent(false); }}
                          onOpenAdvanced={handleOpenAdv}
                        />
                        {['#FFFFFF', '#000000', ...SWATCH_PRESETS.slice(2)].map(color => (
                          <div
                            key={color}
                            className={`swatch-item${bgColor === color ? ' active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => { setBgColor(color); setLogoBgColor(color); setBgTransparent(false); }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="toggle-row">
                      <Toggle label="Sync Eyes with Dots" checked={syncEyes} onChange={setSyncEyes} />
                    </div>

                    {/* Inner Eyes Row */}
                    <div className={`color-row-item${syncEyes ? ' disabled' : ''}`}>
                      <div className="color-row-header">
                        <label className="panel-label">Inner Eyes</label>
                      </div>
                      <div className="swatch-grid-mini">
                        <ColorPicker
                          isSwatch={true}
                          icon={Pipette}
                          value={syncEyes ? qrColor : (eyeColor || qrColor)}
                          onChange={setEyeColor}
                          onOpenAdvanced={handleOpenAdv}
                          disabled={syncEyes}
                        />
                        {SWATCH_PRESETS.map(color => (
                          <div
                            key={color}
                            className={`swatch-item${(syncEyes ? qrColor : eyeColor) === color ? ' active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => !syncEyes && setEyeColor(color)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Outer Eyes Row */}
                    <div className={`color-row-item${syncEyes ? ' disabled' : ''}`}>
                      <div className="color-row-header">
                        <label className="panel-label">Outer Eyes</label>
                      </div>
                      <div className="swatch-grid-mini">
                        <ColorPicker
                          isSwatch={true}
                          icon={Pipette}
                          value={syncEyes ? qrColor : (eyeOuterColor || qrColor)}
                          onChange={setEyeOuterColor}
                          onOpenAdvanced={handleOpenAdv}
                          disabled={syncEyes}
                        />
                        {SWATCH_PRESETS.map(color => (
                          <div
                            key={color}
                            className={`swatch-item${(syncEyes ? qrColor : eyeOuterColor) === color ? ' active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => !syncEyes && setEyeOuterColor(color)}
                          />
                        ))}
                      </div>
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
                            <div className="color-row-item">
                              <div className="color-row-header">
                                <label className="panel-label-sub">Stroke Color</label>
                              </div>
                              <div className="swatch-grid-mini">
                                <ColorPicker
                                  isSwatch={true}
                                  icon={Pipette}
                                  value={logoOutlineColor}
                                  onChange={setLogoOutlineColor}
                                  onOpenAdvanced={handleOpenAdv}
                                />
                                {SWATCH_PRESETS.map(color => (
                                  <div
                                    key={color}
                                    className={`swatch-item${logoOutlineColor === color ? ' active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setLogoOutlineColor(color)}
                                  />
                                ))}
                              </div>
                            </div>
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
                            <div className="color-row-item">
                              <div className="color-row-header">
                                <label className="panel-label-sub">Background Color</label>
                              </div>
                              <div className="swatch-grid-mini">
                                <ColorPicker
                                  isSwatch={true}
                                  icon={Pipette}
                                  value={logoBgColor}
                                  onChange={setLogoBgColor}
                                  onOpenAdvanced={handleOpenAdv}
                                />
                                {['#FFFFFF', '#000000', ...SWATCH_PRESETS.slice(2)].map(color => (
                                  <div
                                    key={color}
                                    className={`swatch-item${logoBgColor === color ? ' active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setLogoBgColor(color)}
                                  />
                                ))}
                              </div>
                            </div>
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
                    <LogoPresets
                      logo={logo}
                      onLogoChange={setLogo}
                      onLogoRemove={() => setLogo(null)}
                    />
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

              {activeTab === 'text' && (
                <div className="tab-panel fade-in" id="panel-text">
                  <div className="panel-section">
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Text Content</label>
                      <input 
                        type="text" 
                        value={frameText} 
                        onChange={(e) => {
                          setFrameText(e.target.value);
                          if (frameStyle === 'none' && e.target.value.trim() !== '') {
                            setFrameStyle('text-bottom'); // Auto-enable text style if they type
                          }
                        }}
                        placeholder="e.g. Scan Me, Your Name, Company..."
                        className="custom-input"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '15px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Font Style</label>
                      <div 
                        className="font-scroll-container" 
                        style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          overflowX: 'auto', 
                          padding: '4px 0 12px 0',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {/* Custom Font Upload Button */}
                        <button
                          onClick={() => fontInputRef.current?.click()}
                          className="font-scroll-btn"
                          style={{
                            flex: '0 0 auto',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            background: 'var(--bg-hover)',
                            color: 'var(--accent-primary)',
                            border: '2px dashed var(--accent-primary)',
                            fontSize: '15px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Plus size={16} /> Add Font
                        </button>

                        {/* Custom Fonts First */}
                        {customFonts.map(font => (
                          <button
                            key={font.id}
                            onClick={() => {
                              setFrameFont(font.id);
                              if (frameStyle === 'none') setFrameStyle('text-bottom');
                            }}
                            className={`font-scroll-btn ${frameFont === font.id ? 'active' : ''}`}
                            style={{
                              flex: '0 0 auto',
                              padding: '10px 20px',
                              borderRadius: '12px',
                              background: frameFont === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              color: frameFont === font.id ? '#ffffff' : 'var(--text-primary)',
                              border: '1px solid',
                              borderColor: frameFont === font.id ? 'var(--accent-primary)' : 'var(--border-color)',
                              fontFamily: font.id,
                              fontSize: '15px',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              boxShadow: frameFont === font.id ? '0 4px 12px rgba(255, 59, 48, 0.3)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {font.label} (Custom)
                          </button>
                        ))}

                        {/* Standard Fonts */}
                        {FONT_OPTIONS.map(font => (
                          <button
                            key={font.id}
                            onClick={() => {
                              setFrameFont(font.id);
                              if (frameStyle === 'none') setFrameStyle('text-bottom');
                            }}
                            className={`font-scroll-btn ${frameFont === font.id ? 'active' : ''}`}
                            style={{
                              flex: '0 0 auto',
                              padding: '10px 20px',
                              borderRadius: '12px',
                              background: frameFont === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              color: frameFont === font.id ? '#ffffff' : 'var(--text-primary)',
                              border: '1px solid',
                              borderColor: frameFont === font.id ? 'var(--accent-primary)' : 'var(--border-color)',
                              fontFamily: font.id,
                              fontSize: '15px',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              boxShadow: frameFont === font.id ? '0 4px 12px rgba(255, 59, 48, 0.3)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Text Layout</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setFrameStyle('none')}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${frameStyle === 'none' ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: frameStyle === 'none' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: frameStyle === 'none' ? 'var(--accent-primary)' : 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          Hidden
                        </button>
                        <button
                          onClick={() => setFrameStyle('text-bottom')}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${frameStyle === 'text-bottom' ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: frameStyle === 'text-bottom' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: frameStyle === 'text-bottom' ? 'var(--accent-primary)' : 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          Classic
                        </button>
                        <button
                          onClick={() => setFrameStyle('scan-me')}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${frameStyle === 'scan-me' ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: frameStyle === 'scan-me' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: frameStyle === 'scan-me' ? 'var(--accent-primary)' : 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          Pill Box
                        </button>
                      </div>
                    </div>

                    {/* New: Text in Center Section */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Center Text (Overlay)</label>
                      <Toggle
                        label="Draw Text in Center"
                        enabled={textCenterEnabled}
                        onChange={(val) => {
                          setTextCenterEnabled(val);
                          if (val) setLogo(null); // Clear logo if enabling center text
                        }}
                      />
                      
                      {textCenterEnabled && (
                        <div className="fade-in" style={{ marginTop: '16px' }}>
                          
                          {/* 1. Content & Font */}
                          <div className="panel-sub-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Content (Max 18 chars)</label>
                              <div style={{ position: 'relative' }}>
                                <input 
                                  type="text" 
                                  maxLength={18}
                                  value={textCenterText} 
                                  onChange={(e) => setTextCenterText(e.target.value)}
                                  placeholder="e.g. YOUR BRAND"
                                  className="custom-input"
                                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '15px' }}
                                />
                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  {textCenterText.length}/18
                                </span>
                              </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Font Family</label>
                              <div 
                                className="font-scroll-container" 
                                style={{ 
                                  display: 'flex', 
                                  gap: '10px', 
                                  overflowX: 'auto', 
                                  padding: '4px 0 12px 0',
                                  scrollbarWidth: 'none',
                                  msOverflowStyle: 'none',
                                  WebkitOverflowScrolling: 'touch'
                                }}
                              >
                                  {/* Custom Font Upload Button */}
                                  <button
                                    onClick={() => fontInputRef.current?.click()}
                                    className="font-scroll-btn"
                                    style={{
                                      flex: '0 0 auto',
                                      padding: '10px 20px',
                                      borderRadius: '12px',
                                      background: 'var(--bg-hover)',
                                      color: 'var(--accent-primary)',
                                      border: '2px dashed var(--accent-primary)',
                                      fontSize: '15px',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <Plus size={16} /> Add Font
                                  </button>
                                  <input 
                                    type="file" 
                                    ref={fontInputRef} 
                                    style={{ display: 'none' }} 
                                    accept=".ttf,.otf,.woff,.woff2" 
                                    onChange={handleFontUpload} 
                                  />

                                  {/* Custom Fonts First */}
                                  {customFonts.map(font => (
                                    <button
                                      key={font.id}
                                      onClick={() => setTextCenterFont(font.id)}
                                      className={`font-scroll-btn ${textCenterFont === font.id ? 'active' : ''}`}
                                      style={{
                                        flex: '0 0 auto',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        background: textCenterFont === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                        color: textCenterFont === font.id ? '#ffffff' : 'var(--text-primary)',
                                        border: '1px solid',
                                        borderColor: textCenterFont === font.id ? 'var(--accent-primary)' : 'var(--border-color)',
                                        fontFamily: font.id,
                                        fontSize: '15px',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        boxShadow: textCenterFont === font.id ? '0 4px 12px rgba(255, 59, 48, 0.3)' : 'none',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {font.label} (Custom)
                                    </button>
                                  ))}

                                  {/* Standard Fonts */}
                                  {FONT_OPTIONS.map(font => (
                                    <button
                                      key={font.id}
                                      onClick={() => setTextCenterFont(font.id)}
                                      className={`font-scroll-btn ${textCenterFont === font.id ? 'active' : ''}`}
                                      style={{
                                        flex: '0 0 auto',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        background: textCenterFont === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                        color: textCenterFont === font.id ? '#ffffff' : 'var(--text-primary)',
                                        border: '1px solid',
                                        borderColor: textCenterFont === font.id ? 'var(--accent-primary)' : 'var(--border-color)',
                                        fontFamily: font.id,
                                        fontSize: '15px',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        boxShadow: textCenterFont === font.id ? '0 4px 12px rgba(255, 59, 48, 0.3)' : 'none',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {font.label}
                                    </button>
                                  ))}
                              </div>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                               <label className="panel-label">Text Color & Size</label>
                               <div className="swatch-grid-mini" style={{ marginBottom: '16px' }}>
                                 <ColorPicker
                                   isSwatch={true}
                                   icon={Pipette}
                                   value={textCenterColor}
                                   onChange={setTextCenterColor}
                                   onOpenAdvanced={handleOpenAdv}
                                 />
                                 {SWATCH_PRESETS.map(color => (
                                   <div
                                     key={color}
                                     className={`swatch-item${textCenterColor === color ? ' active' : ''}`}
                                     style={{ backgroundColor: color }}
                                     onClick={() => setTextCenterColor(color)}
                                   />
                                 ))}
                               </div>
                               <Slider
                                 label="Text Size"
                                 min={0.02}
                                 max={0.18}
                                 step={0.01}
                                 value={textCenterSize}
                                 onChange={setTextCenterSize}
                               />
                            </div>
                          </div>

                          {/* 2. Stroke & Shadow (Pixel Lab Style) */}
                          <div className="panel-sub-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                             <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                               <div style={{ flex: 1 }}>
                                  <Toggle
                                    label="Stroke"
                                    enabled={textCenterStrokeEnabled}
                                    onChange={setTextCenterStrokeEnabled}
                                  />
                               </div>
                               <div style={{ flex: 1 }}>
                                  <Toggle
                                    label="Shadow"
                                    enabled={textCenterShadowEnabled}
                                    onChange={setTextCenterShadowEnabled}
                                  />
                               </div>
                             </div>

                             {textCenterStrokeEnabled && (
                               <div className="fade-in" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '12px' }}>
                                  <label className="panel-label" style={{ fontSize: '11px', marginBottom: '8px' }}>Stroke Color</label>
                                  <div className="swatch-grid-mini" style={{ marginBottom: '12px' }}>
                                    <ColorPicker
                                      isSwatch={true}
                                      icon={Pipette}
                                      value={textCenterStrokeColor}
                                      onChange={setTextCenterStrokeColor}
                                      onOpenAdvanced={handleOpenAdv}
                                    />
                                    {SWATCH_PRESETS.map(color => (
                                      <div
                                        key={color}
                                        className={`swatch-item${textCenterStrokeColor === color ? ' active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setTextCenterStrokeColor(color)}
                                      />
                                    ))}
                                  </div>
                                  <Slider
                                    label="Stroke Width"
                                    min={1}
                                    max={20}
                                    value={textCenterStrokeWidth}
                                    onChange={setTextCenterStrokeWidth}
                                  />
                               </div>
                             )}

                             {textCenterShadowEnabled && (
                               <div className="fade-in" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                  <label className="panel-label" style={{ fontSize: '11px', marginBottom: '8px' }}>Shadow Color</label>
                                  <div className="swatch-grid-mini" style={{ marginBottom: '12px' }}>
                                    <ColorPicker
                                      isSwatch={true}
                                      icon={Pipette}
                                      iconSize={14}
                                      value={textCenterShadowColor}
                                      onChange={setTextCenterShadowColor}
                                      onOpenAdvanced={handleOpenAdv}
                                    />
                                    {SWATCH_PRESETS.map(color => (
                                      <div
                                        key={color}
                                        className={`swatch-item${textCenterShadowColor === color ? ' active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setTextCenterShadowColor(color)}
                                      />
                                    ))}
                                  </div>
                                  <Slider
                                    label="Shadow Blur"
                                    min={0}
                                    max={30}
                                    value={textCenterShadowBlur}
                                    onChange={setTextCenterShadowBlur}
                                  />
                               </div>
                             )}
                          </div>

                          {/* 3. Background Shape (Default: Disabled) */}
                          <div className="panel-sub-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                            <Toggle
                              label="Clear Area (Background Shape)"
                              enabled={logoBackground}
                              onChange={setLogoBackground}
                            />
                            {logoBackground && (
                             <div className="fade-in" style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                  <button
                                    onClick={() => setLogoBgShape('circle')}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${logoBgShape === 'circle' ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: logoBgShape === 'circle' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: logoBgShape === 'circle' ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                                  >Circle</button>
                                  <button
                                    onClick={() => setLogoBgShape('rounded')}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${logoBgShape === 'rounded' ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: logoBgShape === 'rounded' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: logoBgShape === 'rounded' ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                                  >Square</button>
                                </div>
                                <label className="panel-label" style={{ fontSize: '11px', marginBottom: '8px' }}>Shape Color</label>
                                <div className="swatch-grid-mini">
                                  <ColorPicker
                                    isSwatch={true}
                                    icon={Pipette}
                                    value={logoBgColor}
                                    onChange={setLogoBgColor}
                                    onOpenAdvanced={handleOpenAdv}
                                  />
                                  {SWATCH_PRESETS.map(color => (
                                    <div
                                      key={color}
                                      className={`swatch-item${logoBgColor === color ? ' active' : ''}`}
                                      style={{ backgroundColor: color }}
                                      onClick={() => setLogoBgColor(color)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </section>
          </>
        ) : activePage === 'scanner' ? (
          <QRScanner onBack={() => setActivePage('home')} navigateTo={navigateTo} />
        ) : activePage === 'home' ? (
          <HomePage 
            onNavigate={(page) => {
              if (page === 'generator') resetGenerator();
              navigateTo(page);
            }}
            onQuickCreate={(type) => {
              resetGenerator();
              setQrType(type);
              navigateTo('generator');
              setIsDataModalOpen(true);
            }}
            onLoadQR={handleLoadQR}
            theme={theme}
            setTheme={(next) => {
              setTheme(next);
              savePreferences({ ...getPreferences(), theme: next });
            }}
            activePage={activePage}
            onMenuClick={() => navigateTo('settings')}
          />
        ) : activePage === 'saved' ? (
          <SavedPage onLoadQR={handleLoadQR} onNavigate={navigateTo} />
        ) : activePage === 'settings' ? (
          <SettingsPage theme={theme} setTheme={setTheme} effectiveTheme={effectiveTheme} />
        ) : (
          <HistoryPage onLoadQR={handleLoadQR} onNavigate={navigateTo} />
        )}
      </main>

      {/* ── Bottom Navigation Bar (Only for Generator) ── */}
      {activePage === 'generator' && (
        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`bottom-nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
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

      {/* ── Main App Navigation ── */}
      {(['home', 'saved', 'history', 'settings'].includes(activePage)) && (
        <div style={{
          position: 'fixed',
          bottom: '0px',
          left: 0, right: 0, 
          height: 'calc(70px + env(safe-area-inset-bottom))',
          backgroundColor: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
          padding: '10px 16px env(safe-area-inset-bottom) 16px', zIndex: 100,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
        }}>
          <button onClick={() => navigateTo('home')} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px 16px', borderRadius: '12px' }}>
            <Home size={22} /><span style={{ fontSize: '10px', fontWeight: 600 }}>Home</span>
          </button>
          <button onClick={() => navigateTo('saved')} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'saved' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px 16px', borderRadius: '12px' }}>
            <Bookmark size={22} /><span style={{ fontSize: '10px', fontWeight: 600 }}>Saved</span>
          </button>
          
          {/* Integrated Scan Button */}
          <div 
            onClick={() => navigateTo('scanner')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2px',
              marginTop: '-35px',
              cursor: 'pointer'
            }}
          >
            <button 
              className="floating-scan-btn"
              style={{ 
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                background: 'var(--accent-primary)',
                border: '4px solid var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(214, 0, 54, 0.3)',
                color: 'white',
                zIndex: 101
              }}
            >
              <ScanLine size={24} />
            </button>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              color: activePage === 'scanner' ? 'var(--accent-primary)' : 'var(--text-muted)',
              marginTop: '2px'
            }}>Scan</span>
          </div>

          <button onClick={() => navigateTo('history')} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'history' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px 16px', borderRadius: '12px' }}>
            <History size={22} /><span style={{ fontSize: '10px', fontWeight: 600 }}>History</span>
          </button>
          <button onClick={() => navigateTo('settings')} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'settings' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px 16px', borderRadius: '12px' }}>
            <Settings size={22} /><span style={{ fontSize: '10px', fontWeight: 600 }}>Settings</span>
          </button>
        </div>
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
      {/* Advanced Color Picker Modal */}
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
    </div>
  );
}
