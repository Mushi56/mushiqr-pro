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
  Check,
  Menu,
  Info,
  Shield,
  FileText as FileIcon,
  ExternalLink,
  Home,
  Bookmark,
  Settings,
  Type,
  Plus,
  Maximize,
  Shapes,
  ScanLine,
  History,
  PlusCircle,
  Undo2,
  Redo2,
  Eye
} from 'lucide-react';
import ColorPicker from './components/ColorPicker';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
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
import { MdOutlineQrCode2, MdQrCodeScanner } from 'react-icons/md';

const TEXT_SHAPES = [
  { id: 'solid', label: 'Solid Box' },
  { id: 'rounded', label: 'Rounded Box' },
  { id: 'pill', label: 'Pill Box' },
  { id: 'outline', label: 'Outline Box' },
  { id: 'underline', label: 'Underline' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'glow', label: 'Glow Effect' },
  { id: 'brackets', label: 'Brackets' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'dots', label: 'Dotted Box' }
];

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
  const [logoPosX, setLogoPosX] = useState(0.5);
  const [logoPosY, setLogoPosY] = useState(0.5);

  // ── Frame ──
  const [frameStyle, setFrameStyle] = useState('none');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameColor, setFrameColor] = useState('');
  const [frameFont, setFrameFont] = useState('Inter');
  const [frameSize, setFrameSize] = useState(0.12);
  const [frameStrokeEnabled, setFrameStrokeEnabled] = useState(false);
  const [frameStrokeWidth, setFrameStrokeWidth] = useState(5);
  const [frameStrokeColor, setFrameStrokeColor] = useState('#ffffff');
  const [frameShadowEnabled, setFrameShadowEnabled] = useState(false);
  const [frameShadowBlur, setFrameShadowBlur] = useState(10);
  const [frameShadowColor, setFrameShadowColor] = useState('rgba(0,0,0,0.5)');
  const [textCenterEnabled, setTextCenterEnabled] = useState(false);
  const [textPopup, setTextPopup] = useState(null);
  const [logoPopup, setLogoPopup] = useState(null);
  const [colorPopup, setColorPopup] = useState(null);
  const [shapesPopup, setShapesPopup] = useState(null);
  const [textEditMode, setTextEditMode] = useState('center');

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
  const [textCenterPosX, setTextCenterPosX] = useState(0.5);
  const [textCenterPosY, setTextCenterPosY] = useState(0.5);

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
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragType = useRef(null); // 'logo' or 'text'
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const [customFonts, setCustomFonts] = useState([]);
  const fontInputRef = useRef(null);

  // --- Undo/Redo System ---
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isUndoing = useRef(false);

  useEffect(() => {
    setHistory([getState()]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getState = useCallback(() => ({
    qrType, qrData, errorLevel, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType, dotStyle, eyeStyle, dotPadding, eyePadding,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape, logoOutline, logoOutlineColor,
    logoOutlineWidth, logoPosX, logoPosY, frameStyle, frameText, frameColor, frameFont, frameSize,
    frameStrokeEnabled, frameStrokeWidth, frameStrokeColor, frameShadowEnabled, frameShadowBlur, frameShadowColor,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont, textCenterStrokeEnabled,
    textCenterStrokeWidth, textCenterStrokeColor, textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY
  }), [
    qrType, qrData, errorLevel, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType, dotStyle, eyeStyle, dotPadding, eyePadding,
    logo, logoSize, logoPadding, logoBackground, logoBgColor, logoBgShape, logoOutline, logoOutlineColor,
    logoOutlineWidth, logoPosX, logoPosY, frameStyle, frameText, frameColor, frameFont, frameSize,
    frameStrokeEnabled, frameStrokeWidth, frameStrokeColor, frameShadowEnabled, frameShadowBlur, frameShadowColor,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont, textCenterStrokeEnabled,
    textCenterStrokeWidth, textCenterStrokeColor, textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY
  ]);

  const applyState = (state) => {
    isUndoing.current = true;
    setQrType(state.qrType);
    setQrData(state.qrData);
    setErrorLevel(state.errorLevel);
    setQrColor(state.qrColor);
    setBgColor(state.bgColor);
    setBgTransparent(state.bgTransparent);
    setEyeColor(state.eyeColor);
    setEyeOuterColor(state.eyeOuterColor);
    setSyncEyes(state.syncEyes);
    setGradientEnabled(state.gradientEnabled);
    setGradientColor1(state.gradientColor1);
    setGradientColor2(state.gradientColor2);
    setGradientType(state.gradientType);
    setDotStyle(state.dotStyle);
    setEyeStyle(state.eyeStyle);
    setDotPadding(state.dotPadding);
    setEyePadding(state.eyePadding);
    setLogo(state.logo);
    setLogoSize(state.logoSize);
    setLogoPadding(state.logoPadding);
    setLogoBackground(state.logoBackground);
    setLogoBgColor(state.logoBgColor);
    setLogoBgShape(state.logoBgShape);
    setLogoOutline(state.logoOutline);
    setLogoOutlineColor(state.logoOutlineColor);
    setLogoOutlineWidth(state.logoOutlineWidth);
    setLogoPosX(state.logoPosX);
    setLogoPosY(state.logoPosY);
    setFrameStyle(state.frameStyle);
    setFrameText(state.frameText);
    setFrameColor(state.frameColor);
    setFrameFont(state.frameFont);
    setFrameSize(state.frameSize);
    setFrameStrokeEnabled(state.frameStrokeEnabled);
    setFrameStrokeWidth(state.frameStrokeWidth);
    setFrameStrokeColor(state.frameStrokeColor);
    setFrameShadowEnabled(state.frameShadowEnabled);
    setFrameShadowBlur(state.frameShadowBlur);
    setFrameShadowColor(state.frameShadowColor);
    setTextCenterEnabled(state.textCenterEnabled);
    setTextCenterText(state.textCenterText);
    setTextCenterSize(state.textCenterSize);
    setTextCenterColor(state.textCenterColor);
    setTextCenterFont(state.textCenterFont);
    setTextCenterStrokeEnabled(state.textCenterStrokeEnabled);
    setTextCenterStrokeWidth(state.textCenterStrokeWidth);
    setTextCenterStrokeColor(state.textCenterStrokeColor);
    setTextCenterShadowEnabled(state.textCenterShadowEnabled);
    setTextCenterShadowBlur(state.textCenterShadowBlur);
    setTextCenterShadowColor(state.textCenterShadowColor);
    setTextCenterPosX(state.textCenterPosX);
    setTextCenterPosY(state.textCenterPosY);
    setTimeout(() => { isUndoing.current = false; }, 800);
  };

  const pushHistory = useCallback(() => {
    if (isUndoing.current) return;
    const currentState = getState();
    setHistory(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dataChanged = JSON.stringify(currentState.qrData) !== JSON.stringify(last.qrData);
        const othersChanged = Object.keys(currentState).some(key => key !== 'qrData' && currentState[key] !== last[key]);
        if (!dataChanged && !othersChanged) return prev;
      }
      return [...prev.slice(-49), currentState];
    });
    setRedoStack([]);
  }, [getState]);

  useEffect(() => {
    const timer = setTimeout(pushHistory, 500);
    return () => clearTimeout(timer);
  }, [pushHistory]);

  const undo = () => {
    if (history.length <= 1) return;
    const currentState = history[history.length - 1];
    const previousState = history[history.length - 2];
    setRedoStack(prev => [currentState, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    applyState(previousState);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setHistory(prev => [...prev, nextState]);
    applyState(nextState);
  };

  const [editSnapshot, setEditSnapshot] = useState(null);
  
  const handleOpenProperty = (type, mode) => {
    setEditSnapshot(getState());
    setLogoPopup(mode === 'logo' ? type : null);
    setTextPopup(mode === 'text' ? type : null);
    setColorPopup(mode === 'color' ? type : null);
    setShapesPopup(mode === 'shapes' ? type : null);
  };

  const handleApplyProperty = () => {
    setEditSnapshot(null);
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapesPopup(null);
    pushHistory();
  };

  const handleCancelProperty = () => {
    if (editSnapshot) {
      applyState(editSnapshot);
    }
    setEditSnapshot(null);
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapesPopup(null);
  };

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
    setHistory([]);
    setRedoStack([]);
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
    setLogoPosX(0.5);
    setLogoPosY(0.5);
    setTextCenterPosX(0.5);
    setTextCenterPosY(0.5);

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
        frameSize,
        frameStrokeEnabled,
        frameStrokeWidth,
        frameStrokeColor,
        frameShadowEnabled,
        frameShadowBlur,
        frameShadowColor,
        textCenter: textCenterEnabled ? textCenterText : null, 
        textCenterSize, textCenterColor, textCenterFont,
        textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
        textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
        textCenterPosX, textCenterPosY,
        logoPosX, logoPosY,
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
        frameSize,
        frameStrokeEnabled,
        frameStrokeWidth,
        frameStrokeColor,
        frameShadowEnabled,
        frameShadowBlur,
        frameShadowColor,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,

    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY, logoPosX, logoPosY
  ]);

  useEffect(() => {
    renderCanvas();
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
      logo.image.onerror = () => showToast('Logo failed to load', 'error');
    }
  }, [renderCanvas, logo]);
  const getQRContentArea = useCallback(() => {
    const size = 512;
    const padding = size * 0.03;
    let contentX = 0;
    let contentY = 0;
    let contentSize = size;

    if (frameStyle !== 'none') {
      const labelHeight = size * 0.14;
      contentSize = size - (padding * 2) - labelHeight - (size * 0.06); 
      contentX = (size - contentSize) / 2;
      contentY = padding + (size - padding * 2 - labelHeight - contentSize) / 2;
    }
    return { contentX, contentY, contentSize };
  }, [frameStyle]);

  // ── Canvas Interaction (Drag to Position) ──
  const handleCanvasInteraction = useCallback((e) => {
    if (!canvasRef.current || !qrMatrixInfo) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Convert click to canvas coordinates (0-512)
    const scale = 512 / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;

    const { contentX, contentY, contentSize } = getQRContentArea();

    // Helper to check if point is in rect with generous padding
    const inRect = (px, py, rx, ry, rw, rh) => {
      const pad = 25; // Generous hit area
      return px >= rx - pad && px <= rx + rw + pad && py >= ry - pad && py <= ry + rh + pad;
    };

    // 1. Check Logo
    if (logo?.image) {
      const lw = contentSize * logoSize;
      const lh = lw * (logo.image.height / logo.image.width);
      const lx = contentX + (contentSize - lw) * logoPosX;
      const ly = contentY + (contentSize - lh) * logoPosY;
      
      if (inRect(x, y, lx, ly, lw, lh)) {
        setIsDraggingCanvas(true);
        dragType.current = 'logo';
        dragStartOffset.current = { x: x - lx, y: y - ly };
        e.preventDefault();
        return;
      }
    }

    // 2. Check Text
    if (textCenterEnabled && textCenterText) {
      const fontSize = contentSize * textCenterSize;
      const tw = textCenterText.length * fontSize * 0.6;
      const th = fontSize;
      const tx = contentX + (contentSize - tw) * textCenterPosX;
      const ty = contentY + (contentSize - th) * textCenterPosY;

      if (inRect(x, y, tx, ty, tw, th)) {
        setIsDraggingCanvas(true);
        dragType.current = 'text';
        dragStartOffset.current = { x: x - tx, y: y - ty };
        e.preventDefault();
        return;
      }
    }
  }, [qrMatrixInfo, logo, logoSize, logoPosX, logoPosY, textCenterEnabled, textCenterText, textCenterSize, textCenterPosX, textCenterPosY, getQRContentArea]);

  const handleCanvasMove = useCallback((e) => {
    if (!isDraggingCanvas || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scale = 512 / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;

    const { contentX, contentY, contentSize } = getQRContentArea();
    const newTargetX = x - dragStartOffset.current.x - contentX;
    const newTargetY = y - dragStartOffset.current.y - contentY;

    if (dragType.current === 'logo' && logo?.image) {
      const lw = contentSize * logoSize;
      const lh = lw * (logo.image.height / logo.image.width);
      setLogoPosX(Math.max(0, Math.min(1, newTargetX / (contentSize - lw))));
      setLogoPosY(Math.max(0, Math.min(1, newTargetY / (contentSize - lh))));
    } else if (dragType.current === 'text') {
      const fontSize = contentSize * textCenterSize;
      const tw = textCenterText.length * fontSize * 0.6;
      const th = fontSize;
      setTextCenterPosX(Math.max(0, Math.min(1, newTargetX / (contentSize - tw))));
      setTextCenterPosY(Math.max(0, Math.min(1, newTargetY / (contentSize - th))));
    }
  }, [isDraggingCanvas, logo, logoSize, textCenterSize, textCenterText, getQRContentArea]);

  const stopCanvasDrag = useCallback(() => {
    setIsDraggingCanvas(false);
    dragType.current = null;
  }, []);

  useEffect(() => {
    if (isDraggingCanvas) {
      window.addEventListener('mousemove', handleCanvasMove);
      window.addEventListener('mouseup', stopCanvasDrag);
      window.addEventListener('touchmove', handleCanvasMove, { passive: false });
      window.addEventListener('touchend', stopCanvasDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleCanvasMove);
      window.removeEventListener('mouseup', stopCanvasDrag);
      window.removeEventListener('touchmove', handleCanvasMove);
      window.removeEventListener('touchend', stopCanvasDrag);
    };
  }, [isDraggingCanvas, handleCanvasMove, stopCanvasDrag]);

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
          {activePage === 'generator' ? (
            <div className="header-history-controls" style={{ marginLeft: '12px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={undo} 
                disabled={history.length <= 1} 
                className="header-history-btn"
                title="Undo"
              >
                <Undo2 size={18} />
              </button>
              <button 
                onClick={redo} 
                disabled={redoStack.length === 0} 
                className="header-history-btn"
                title="Redo"
              >
                <Redo2 size={18} />
              </button>
            </div>
          ) : (
            <div className="app-logo-text" style={{ whiteSpace: 'nowrap' }}>Mushi QR <span>Pro</span></div>
          )}
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
                    <canvas 
                      ref={canvasRef} 
                      className="preview-canvas" 
                      onMouseDown={handleCanvasInteraction}
                      onTouchStart={handleCanvasInteraction}
                      style={{ 
                        willChange: 'transform',
                        cursor: isDraggingCanvas ? 'grabbing' : (logo?.image || textCenterEnabled ? 'move' : 'default'),
                        touchAction: 'none'
                      }} 
                    />
                  )}
                </div>



              </section>
            </ErrorBoundary>

            {/* ── Tab Panel Content ── */}
            <section className="tab-panel-area">
              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="tab-panel fade-in" id="panel-content">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px' }}>
                    <div className="panel-empty-state" style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>
                      <Palette size={32} style={{ marginBottom: '12px' }} />
                      <p>Adjust colors using the toolbar below</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shapes Tab */}
              {activeTab === 'shapes' && (
                <div className="tab-panel fade-in" id="panel-shapes">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px' }}>
                    <div className="panel-empty-state" style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>
                      <Hexagon size={32} style={{ marginBottom: '12px' }} />
                      <p>Adjust shapes using the toolbar below</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="tab-panel fade-in" id="panel-logo">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px' }}>
                    <div className="panel-empty-state" style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>
                      <ImageIcon size={32} style={{ marginBottom: '12px' }} />
                      <p>Manage your logo using the toolbar below</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="tab-panel fade-in" id="panel-text">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px' }}>
                    <div className="panel-empty-state" style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>
                      <Type size={32} style={{ marginBottom: '12px' }} />
                      <p>Customize your text using the toolbar below</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ─── Shared Unified Expandable Toolbar (Centralized Bottom Layer) ─── */}
            {['color', 'shapes', 'logo', 'text'].includes(activeTab) && (
              <div className="logo-toolbar-container">
                <div className="unified-toolbar-card">
                   {(logoPopup || textPopup || colorPopup || shapesPopup) && (
                    <div className="property-edit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
                       <button onClick={handleCancelProperty} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                         <X size={20} />
                       </button>
                       
                       <button onClick={handleApplyProperty} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                         <Check size={20} />
                       </button>
                    </div>
                  )}

                  {/* PROPERTIES PANEL */}
                  {(logoPopup || textPopup || colorPopup || shapesPopup) && (
                    <div className="toolbar-properties-panel" style={{ padding: '20px', background: 'var(--bg-primary)' }}>
                      
                      {/* COLOR PROPERTIES */}
                      {activeTab === 'color' && colorPopup && (
                        <div className="fade-in">
                          {colorPopup === 'themes' && (
                            <div className="color-presets-row">
                              {COLOR_PRESETS.map(preset => (
                                <div
                                  key={preset.name}
                                  className={`color-preset-swatch${activePreset === preset.name ? ' active' : ''}`}
                                  title={preset.name}
                                  style={{ background: `linear-gradient(135deg, ${preset.qr} 50%, ${preset.bg} 50%)` }}
                                  onClick={() => { setQrColor(preset.qr); setBgColor(preset.bg); setLogoBgColor(preset.bg); setLogoOutlineColor(preset.qr); setBgTransparent(false); setActivePreset(preset.name); }}
                                />
                              ))}
                            </div>
                          )}
                          {colorPopup === 'dots' && (
                            <div className="swatch-grid-mini">
                              <ColorPicker isSwatch={true} icon={Pipette} value={qrColor} onChange={(c) => { setQrColor(c); setLogoOutlineColor(c); }} onOpenAdvanced={handleOpenAdv} />
                              {SWATCH_PRESETS.map(color => (
                                <div key={color} className={`swatch-item${qrColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => { setQrColor(color); setLogoOutlineColor(color); }} />
                              ))}
                            </div>
                          )}
                          {colorPopup === 'bg' && (
                            <div className="swatch-grid-mini">
                              <ColorPicker isSwatch={true} icon={Pipette} value={bgColor} onChange={(c) => { setBgColor(c); setLogoBgColor(c); setBgTransparent(false); }} onOpenAdvanced={handleOpenAdv} />
                              {['#FFFFFF', '#000000', ...SWATCH_PRESETS.slice(2)].map(color => (
                                <div key={color} className={`swatch-item${bgColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => { setBgColor(color); setLogoBgColor(color); setBgTransparent(false); }} />
                              ))}
                            </div>
                          )}
                          {colorPopup === 'eyes' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <Toggle label="Sync Eyes with Dots" checked={syncEyes} onChange={setSyncEyes} />
                              <div style={{ opacity: syncEyes ? 0.5 : 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Inner Eyes</div>
                                <div className="swatch-grid-mini" style={{ marginBottom: '14px' }}>
                                  <ColorPicker isSwatch={true} icon={Pipette} value={syncEyes ? qrColor : (eyeColor || qrColor)} onChange={setEyeColor} onOpenAdvanced={handleOpenAdv} disabled={syncEyes} />
                                  {SWATCH_PRESETS.map(color => (
                                    <div key={color} className={`swatch-item${(syncEyes ? qrColor : eyeColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => !syncEyes && setEyeColor(color)} />
                                  ))}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Outer Eyes</div>
                                <div className="swatch-grid-mini">
                                  <ColorPicker isSwatch={true} icon={Pipette} value={syncEyes ? qrColor : (eyeOuterColor || qrColor)} onChange={setEyeOuterColor} onOpenAdvanced={handleOpenAdv} disabled={syncEyes} />
                                  {SWATCH_PRESETS.map(color => (
                                    <div key={color} className={`swatch-item${(syncEyes ? qrColor : eyeOuterColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => !syncEyes && setEyeOuterColor(color)} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SHAPES PROPERTIES */}
                      {activeTab === 'shapes' && shapesPopup && (
                        <div className="fade-in">
                          {shapesPopup === 'corner' && (
                            <EyeStyleSelector value={eyeStyle} onChange={setEyeStyle} />
                          )}
                          {shapesPopup === 'dots' && (
                            <DotStyleSelector value={dotStyle} onChange={setDotStyle} />
                          )}
                        </div>
                      )}

                      {/* LOGO PROPERTIES */}
                      {activeTab === 'logo' && logoPopup && (
                        <div className="fade-in">
                          {logoPopup === 'source' && (
                            <LogoPresets logo={logo} onLogoChange={setLogo} onLogoRemove={() => setLogo(null)} />
                          )}
                          {logoPopup === 'size' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                              <Slider label="Logo Size" value={logoSize} min={0.1} max={0.4} step={0.01} onChange={setLogoSize} />
                              <Slider label="Logo Padding" value={logoPadding} min={0} max={20} step={1} onChange={setLogoPadding} />
                            </div>
                          )}
                          {logoPopup === 'stroke' && (
                            <>
                              <Toggle label="Enable Stroke" checked={logoOutline} onChange={setLogoOutline} />
                              {logoOutline && (
                                <div className="fade-in" style={{ marginTop: '14px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Stroke Color</div>
                                  <div className="swatch-grid-mini" style={{ marginBottom: '18px' }}>
                                    <ColorPicker isSwatch={true} icon={Pipette} value={logoOutlineColor} onChange={setLogoOutlineColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${logoOutlineColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setLogoOutlineColor(color)} />
                                    ))}
                                  </div>
                                  <Slider label="Stroke Width" value={logoOutlineWidth} min={1} max={10} step={1} onChange={setLogoOutlineWidth} />
                                </div>
                              )}
                            </>
                          )}
                          {logoPopup === 'bg' && (
                            <>
                              <Toggle label="Enable Background" checked={logoBackground} onChange={setLogoBackground} />
                              {logoBackground && (
                                <div className="fade-in" style={{ marginTop: '14px' }}>
                                  <div className="font-scroll-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', marginBottom: '14px' }}>
                                    {TEXT_SHAPES.map(shape => {
                                      const isActive = logoBgShape === shape.id;
                                      return (
                                        <button 
                                          key={shape.id} 
                                          onClick={() => setLogoBgShape(shape.id)}
                                          className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                          style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)', fontSize: '14px', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? '0 4px 12px rgba(255,59,48,0.3)' : 'none' }}
                                        >
                                          {shape.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Background Color</div>
                                  <div className="swatch-grid-mini">
                                    <ColorPicker isSwatch={true} icon={Pipette} value={logoBgColor} onChange={setLogoBgColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${logoBgColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setLogoBgColor(color)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          {logoPopup === 'pos' && (
                            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                                  {[0, 0.5, 1].map(y => [0, 0.5, 1].map(x => (
                                    <button key={`${x}-${y}`} onClick={() => { setLogoPosX(x); setLogoPosY(y); }} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: logoPosX === x && logoPosY === y ? 'var(--accent-primary)' : 'var(--bg-primary)', cursor: 'pointer', transition: 'all 0.2s ease' }} />
                                  )))}
                                </div>
                              </div>
                              <Slider label="Horizontal" value={logoPosX} min={0} max={1} step={0.01} onChange={setLogoPosX} />
                              <Slider label="Vertical" value={logoPosY} min={0} max={1} step={0.01} onChange={setLogoPosY} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* TEXT PROPERTIES */}
                      {activeTab === 'text' && textPopup && (
                        <div className="fade-in">
                          {textPopup === 'input' && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Enable Text</div>
                                <Toggle
                                  checked={textEditMode === 'center' ? textCenterEnabled : frameStyle !== 'none'}
                                  onChange={(val) => {
                                    if (textEditMode === 'center') {
                                      setTextCenterEnabled(val);
                                      if (val) setLogo(null);
                                    } else {
                                      setFrameStyle(val ? 'text-bottom' : 'none');
                                    }
                                  }}
                                />
                              </div>

                              <div className="seg-control" style={{ marginBottom: '16px' }}>
                                <button className={`seg-btn ${textEditMode === 'center' ? 'active' : ''}`} onClick={() => setTextEditMode('center')}>QR Text</button>
                                <button className={`seg-btn ${textEditMode === 'bottom' ? 'active' : ''}`} onClick={() => setTextEditMode('bottom')}>Bottom Text</button>
                              </div>

                              {textEditMode === 'center' && (
                                <div style={{ opacity: textCenterEnabled ? 1 : 0.5, pointerEvents: textCenterEnabled ? 'all' : 'none' }}>
                                  <input type="text" maxLength={18} value={textCenterText} onChange={(e) => setTextCenterText(e.target.value)} placeholder="Type QR text..." className="text-input-premium" style={{ width: '100%', marginBottom: '4px' }} />
                                </div>
                              )}

                              {textEditMode === 'bottom' && (
                                <div style={{ opacity: frameStyle !== 'none' ? 1 : 0.5, pointerEvents: frameStyle !== 'none' ? 'all' : 'none' }}>
                                  <input type="text" value={frameText} onChange={(e) => { setFrameText(e.target.value); if (frameStyle === 'none' && e.target.value.trim() !== '') { setFrameStyle('solid'); } }} placeholder="Type bottom text..." className="text-input-premium" style={{ width: '100%', marginBottom: '4px' }} />
                                </div>
                              )}
                            </>
                          )}
                          
                          {textPopup === 'fonts' && (
                            <div className="font-scroll-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                              <button onClick={() => fontInputRef.current?.click()} className="font-scroll-btn" style={{ flex: '0 0 auto', padding: '10px 20px', borderRadius: '12px', background: 'transparent', color: 'var(--accent-primary)', border: '2px dashed var(--accent-primary)', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={14} /> Add Font</button>
                              <input type="file" ref={fontInputRef} style={{ display: 'none' }} accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} />
                              {customFonts.map(font => (
                                <button key={font.id} onClick={() => { if (textEditMode === 'center') setTextCenterFont(font.id); else { setFrameFont(font.id); if (frameStyle === 'none') setFrameStyle('text-bottom'); } }} className={`font-scroll-btn ${(textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'active' : ''}`} style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'var(--accent-primary)' : 'var(--border-color)', fontFamily: font.id, fontSize: '14px', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? '0 4px 12px rgba(255,59,48,0.3)' : 'none', transition: 'all 0.2s ease' }}>{font.label} ★</button>
                              ))}
                              {FONT_OPTIONS.map(font => (
                                <button key={font.id} onClick={() => { if (textEditMode === 'center') setTextCenterFont(font.id); else { setFrameFont(font.id); if (frameStyle === 'none') setFrameStyle('text-bottom'); } }} className={`font-scroll-btn ${(textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'active' : ''}`} style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'var(--accent-primary)' : 'var(--border-color)', fontFamily: font.id, fontSize: '14px', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: (textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? '0 4px 12px rgba(255,59,48,0.3)' : 'none', transition: 'all 0.2s ease' }}>{font.label}</button>
                              ))}
                            </div>
                          )}
                          {textPopup === 'size' && (
                            <Slider label="Size" min={0.02} max={0.18} step={0.01} value={textEditMode === 'center' ? textCenterSize : frameSize} onChange={textEditMode === 'center' ? setTextCenterSize : setFrameSize} />
                          )}
                          {textPopup === 'color' && (
                            <div className="swatch-grid-mini">
                              <ColorPicker isSwatch={true} icon={Pipette} value={textEditMode === 'center' ? textCenterColor : frameColor} onChange={textEditMode === 'center' ? setTextCenterColor : setFrameColor} onOpenAdvanced={handleOpenAdv} />
                              {SWATCH_PRESETS.map(color => (
                                <div key={color} className={`swatch-item${(textEditMode === 'center' ? textCenterColor : frameColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => textEditMode === 'center' ? setTextCenterColor(color) : setFrameColor(color)} />
                              ))}
                            </div>
                          )}
                          {textPopup === 'stroke' && (
                            <>
                              <Toggle label="Enable Stroke" checked={textEditMode === 'center' ? textCenterStrokeEnabled : frameStrokeEnabled} onChange={textEditMode === 'center' ? setTextCenterStrokeEnabled : setFrameStrokeEnabled} />
                              {(textEditMode === 'center' ? textCenterStrokeEnabled : frameStrokeEnabled) && (
                                <div className="fade-in" style={{ marginTop: '14px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Stroke Color</div>
                                  <div className="swatch-grid-mini" style={{ marginBottom: '12px' }}>
                                    <ColorPicker isSwatch={true} icon={Pipette} value={textEditMode === 'center' ? textCenterStrokeColor : frameStrokeColor} onChange={textEditMode === 'center' ? setTextCenterStrokeColor : setFrameStrokeColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${(textEditMode === 'center' ? textCenterStrokeColor : frameStrokeColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => textEditMode === 'center' ? setTextCenterStrokeColor(color) : setFrameStrokeColor(color)} />
                                    ))}
                                  </div>
                                  <Slider label="Stroke Width" min={1} max={20} value={textEditMode === 'center' ? textCenterStrokeWidth : frameStrokeWidth} onChange={textEditMode === 'center' ? setTextCenterStrokeWidth : setFrameStrokeWidth} />
                                </div>
                              )}
                            </>
                          )}
                          {textPopup === 'shadow' && (
                            <>
                              <Toggle label="Enable Shadow" checked={textEditMode === 'center' ? textCenterShadowEnabled : frameShadowEnabled} onChange={textEditMode === 'center' ? setTextCenterShadowEnabled : setFrameShadowEnabled} />
                              {(textEditMode === 'center' ? textCenterShadowEnabled : frameShadowEnabled) && (
                                <div className="fade-in" style={{ marginTop: '14px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Shadow Color</div>
                                  <div className="swatch-grid-mini" style={{ marginBottom: '12px' }}>
                                    <ColorPicker isSwatch={true} icon={Pipette} iconSize={14} value={textEditMode === 'center' ? textCenterShadowColor : frameShadowColor} onChange={textEditMode === 'center' ? setTextCenterShadowColor : setFrameShadowColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${(textEditMode === 'center' ? textCenterShadowColor : frameShadowColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => textEditMode === 'center' ? setTextCenterShadowColor(color) : setFrameShadowColor(color)} />
                                    ))}
                                  </div>
                                  <Slider label="Shadow Blur" min={0} max={30} value={textEditMode === 'center' ? textCenterShadowBlur : frameShadowBlur} onChange={textEditMode === 'center' ? setTextCenterShadowBlur : setFrameShadowBlur} />
                                </div>
                              )}
                            </>
                          )}
                          {textPopup === 'bg' && (
                            <>
                              {textEditMode === 'center' && (
                                <Toggle label="Enable Background" checked={logoBackground} onChange={setLogoBackground} />
                              )}
                              {(textEditMode === 'bottom' || logoBackground) && (
                                <div className="fade-in" style={{ marginTop: textEditMode === 'center' ? '14px' : '0' }}>
                                  <div className="font-scroll-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', marginBottom: '14px' }}>
                                    {TEXT_SHAPES.map(shape => {
                                      const isActive = textEditMode === 'center' ? logoBgShape === shape.id : frameStyle === shape.id;
                                      return (
                                        <button 
                                          key={shape.id} 
                                          onClick={() => {
                                            if (textEditMode === 'center') setLogoBgShape(shape.id);
                                            else setFrameStyle(shape.id);
                                          }}
                                          className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                          style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)', fontSize: '14px', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? '0 4px 12px rgba(255,59,48,0.3)' : 'none' }}
                                        >
                                          {shape.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Shape Color</div>
                                  <div className="swatch-grid-mini">
                                    <ColorPicker isSwatch={true} icon={Pipette} value={textEditMode === 'center' ? logoBgColor : frameColor} onChange={textEditMode === 'center' ? setLogoBgColor : setFrameColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${(textEditMode === 'center' ? logoBgColor : frameColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => textEditMode === 'center' ? setLogoBgColor(color) : setFrameColor(color)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          {textPopup === 'pos' && (
                            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                                  {[0, 0.5, 1].map(y => [0, 0.5, 1].map(x => (
                                    <button key={`${x}-${y}`} onClick={() => { setTextCenterPosX(x); setTextCenterPosY(y); }} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: textCenterPosX === x && textCenterPosY === y ? 'var(--accent-primary)' : 'var(--bg-primary)', cursor: 'pointer', transition: 'all 0.2s ease' }} />
                                  )))}
                                </div>
                              </div>
                              <Slider label="Horizontal" value={textCenterPosX} min={0} max={1} step={0.01} onChange={setTextCenterPosX} />
                              <Slider label="Vertical" value={textCenterPosY} min={0} max={1} step={0.01} onChange={setTextCenterPosY} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MAIN TOOLS ROW (Hidden when editing) */}
                  {!logoPopup && !textPopup && !colorPopup && !shapesPopup && (
                    <div className="toolbar-tabs-row">
                      {activeTab === 'color' && (
                        <>
                          <button className={`text-toolbar-btn ${colorPopup === 'themes' ? 'active' : ''}`} onClick={() => handleOpenProperty('themes', 'color')}><LayoutGrid size={18} /><span>Themes</span></button>
                          <button className={`text-toolbar-btn ${colorPopup === 'dots' ? 'active' : ''}`} onClick={() => handleOpenProperty('dots', 'color')}><Palette size={18} /><span>Dots</span></button>
                          <button className={`text-toolbar-btn ${colorPopup === 'bg' ? 'active' : ''}`} onClick={() => handleOpenProperty('bg', 'color')}><Hexagon size={18} /><span>Background</span></button>
                          <button className={`text-toolbar-btn ${colorPopup === 'eyes' ? 'active' : ''}`} onClick={() => handleOpenProperty('eyes', 'color')}><Eye size={18} /><span>Eyes</span></button>
                        </>
                      )}
                      {activeTab === 'shapes' && (
                        <>
                          <button className={`text-toolbar-btn ${shapesPopup === 'corner' ? 'active' : ''}`} onClick={() => handleOpenProperty('corner', 'shapes')}><Maximize size={18} /><span>Corners</span></button>
                          <button className={`text-toolbar-btn ${shapesPopup === 'dots' ? 'active' : ''}`} onClick={() => handleOpenProperty('dots', 'shapes')}><LayoutGrid size={18} /><span>Dots</span></button>
                        </>
                      )}
                      {activeTab === 'logo' && (
                        <>
                          <button className={`text-toolbar-btn ${logoPopup === 'source' ? 'active' : ''}`} onClick={() => handleOpenProperty('source', 'logo')}><ImageIcon size={18} /><span>Logo</span></button>
                          <button className={`text-toolbar-btn ${logoPopup === 'size' ? 'active' : ''}`} onClick={() => handleOpenProperty('size', 'logo')}><ChevronUp size={18} /><span>Size</span></button>
                          <button className={`text-toolbar-btn ${logoPopup === 'pos' ? 'active' : ''}`} onClick={() => handleOpenProperty('pos', 'logo')}><Maximize size={18} /><span>Position</span></button>
                          <button className={`text-toolbar-btn ${logoPopup === 'stroke' ? 'active' : ''}`} onClick={() => handleOpenProperty('stroke', 'logo')}><Pencil size={18} /><span>Stroke</span></button>
                          <button className={`text-toolbar-btn ${logoPopup === 'bg' ? 'active' : ''}`} onClick={() => handleOpenProperty('bg', 'logo')}><Hexagon size={18} /><span>Background</span></button>
                        </>
                      )}
                      {activeTab === 'text' && (
                        <>
                          <button className={`text-toolbar-btn ${textPopup === 'input' ? 'active' : ''}`} onClick={() => handleOpenProperty('input', 'text')}><PlusCircle size={18} /><span>Content</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'pos' ? 'active' : ''}`} onClick={() => handleOpenProperty('pos', 'text')}><Maximize size={18} /><span>Position</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'fonts' ? 'active' : ''}`} onClick={() => handleOpenProperty('fonts', 'text')}><Type size={18} /><span>Fonts</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'size' ? 'active' : ''}`} onClick={() => handleOpenProperty('size', 'text')}><ChevronUp size={18} /><span>Size</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'color' ? 'active' : ''}`} onClick={() => handleOpenProperty('color', 'text')}><Palette size={18} /><span>Color</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'stroke' ? 'active' : ''}`} onClick={() => handleOpenProperty('stroke', 'text')}><Pencil size={18} /><span>Stroke</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'shadow' ? 'active' : ''}`} onClick={() => handleOpenProperty('shadow', 'text')}><Moon size={18} /><span>Shadow</span></button>
                          <button className={`text-toolbar-btn ${textPopup === 'bg' ? 'active' : ''}`} onClick={() => handleOpenProperty('bg', 'text')}><Hexagon size={18} /><span>Shape</span></button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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
        ) : activePage === 'scanner' ? (
          <QRScanner 
            onScan={(data) => {
              const parsed = JSON.parse(data);
              onLoadQR(parsed);
              showToast('QR Code scanned successfully!', 'success');
            }}
            onClose={() => setActivePage('home')}
          />
        ) : activePage === 'history' ? (
          <HistoryPage onLoadQR={handleLoadQR} onNavigate={navigateTo} />
        ) : (
          <SavedPage onLoadQR={handleLoadQR} onNavigate={navigateTo} />
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
                <tab.icon size={24} strokeWidth={2} />
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* ── Main App Navigation ── */}
      {(['home', 'saved', 'history', 'settings'].includes(activePage)) && (
        <div className="main-app-nav">
          <button 
            onClick={() => navigateTo('home')} 
            className={`main-nav-btn ${activePage === 'home' ? 'active' : ''}`}
          >
            <Home size={26} />
          </button>
          <button 
            onClick={() => navigateTo('saved')} 
            className={`main-nav-btn ${activePage === 'saved' ? 'active' : ''}`}
          >
            <Bookmark size={26} />
          </button>
          
          {/* Integrated Scan Button */}
          <div 
            onClick={() => navigateTo('scanner')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2px',
              marginTop: '-32px',
              cursor: 'pointer'
            }}
          >
            <button 
              className="floating-scan-btn"
              style={{ 
                width: '72px',
                height: '72px',
                borderRadius: '36px',
                background: 'var(--accent-primary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 28px rgba(214, 0, 54, 0.45)',
                color: 'white',
                zIndex: 101,
                outline: 'none'
              }}
            >
              <ScanLine size={28} />
            </button>
          </div>

          <button 
            onClick={() => navigateTo('history')} 
            className={`main-nav-btn ${activePage === 'history' ? 'active' : ''}`}
          >
            <History size={26} />
          </button>
          <button 
            onClick={() => navigateTo('settings')} 
            className={`main-nav-btn ${activePage === 'settings' ? 'active' : ''}`}
          >
            <Settings size={26} />
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
