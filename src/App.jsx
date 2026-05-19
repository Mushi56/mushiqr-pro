import { useState, useEffect, useRef, useCallback, Component } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
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
  Plus,
  Maximize,
  Shapes,
  ScanLine,
  History,
  PlusCircle,
  Undo2,
  Redo2,
  Check,
  RotateCw,
  Filter,
  Crop,
  Eraser,
  Layers
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
/* ── Color Presets (Expanded to 50) ── */
const COLOR_PRESETS = [
  { name: 'Classic', qr: '#000000', bg: '#FFFFFF' },
  { name: 'Midnight', qr: '#FFFFFF', bg: '#030305' },
  { name: 'Vibrant Red', qr: '#FF3B30', bg: '#FFFFFF' },
  { name: 'Electric Blue', qr: '#007AFF', bg: '#FFFFFF' },
  { name: 'Emerald', qr: '#34C759', bg: '#FFFFFF' },
  { name: 'Sunny', qr: '#FFCC00', bg: '#FFFFFF' },
  { name: 'Purple Neon', qr: '#AF52DE', bg: '#0F0F1A' },
  { name: 'Orange Glow', qr: '#FF9500', bg: '#FFFFFF' },
  { name: 'Indigo', qr: '#5856D6', bg: '#FFFFFF' },
  { name: 'Pink Punch', qr: '#FF2D55', bg: '#FFFFFF' },
  { name: 'Cyan Neon', qr: '#00F0FF', bg: '#0A0A0F' },
  { name: 'Rose Gold', qr: '#E91E63', bg: '#FFF1F2' },
  { name: 'Deep Ocean', qr: '#1A237E', bg: '#E8EAF6' },
  { name: 'Forest', qr: '#1B5E20', bg: '#E8F5E9' },
  { name: 'Hot Chili', qr: '#B71C1C', bg: '#FFEBEE' },
  { name: 'Amber', qr: '#FF6F00', bg: '#FFF8E1' },
  { name: 'Teal Mist', qr: '#004D40', bg: '#E0F2F1' },
  { name: 'Slate', qr: '#263238', bg: '#ECEFF1' },
  { name: 'Royal Purple', qr: '#4A148C', bg: '#F3E5F5' },
  { name: 'Lemonade', qr: '#FBC02D', bg: '#FFFDE7' },
  { name: 'Cyberpunk', qr: '#FFFF00', bg: '#FF00FF' },
  { name: 'Matrix', qr: '#00FF00', bg: '#000000' },
  { name: 'Blood Orange', qr: '#FF3D00', bg: '#FBE9E7' },
  { name: 'Space Grey', qr: '#9E9E9E', bg: '#212121' },
  { name: 'Mint Leaf', qr: '#00B894', bg: '#E8FDF9' },
  { name: 'Grape', qr: '#6C5CE7', bg: '#EFEEFE' },
  { name: 'Sky High', qr: '#0984E3', bg: '#EBF5FF' },
  { name: 'Coral', qr: '#D63031', bg: '#FFFAFA' },
  { name: 'Golden Hour', qr: '#F39C12', bg: '#1A1A1A' },
  { name: 'Tropical', qr: '#00D1B2', bg: '#F5FFFA' },
  { name: 'Volcano', qr: '#E74C3C', bg: '#34495E' },
  { name: 'Amethyst', qr: '#9B59B6', bg: '#F4ECF7' },
  { name: 'Cobalt', qr: '#2980B9', bg: '#EBF5FB' },
  { name: 'Pumpkin', qr: '#D35400', bg: '#FBEEE6' },
  { name: 'Asbestos', qr: '#7F8C8D', bg: '#F2F4F4' },
  { name: 'Belize', qr: '#2980B9', bg: '#2C3E50' },
  { name: 'Carrot', qr: '#E67E22', bg: '#1A1A1A' },
  { name: 'Sunflower', qr: '#F1C40F', bg: '#2C3E50' },
  { name: 'Turquoise', qr: '#1ABC9C', bg: '#16A085' },
  { name: 'Wet Asphalt', qr: '#ECF0F1', bg: '#34495E' },
  { name: 'Alizarin', qr: '#E74C3C', bg: '#FFFFFF' },
  { name: 'Wisteria', qr: '#8E44AD', bg: '#FFFFFF' },
  { name: 'Silver', qr: '#2C3E50', bg: '#BDC3C7' },
  { name: 'Concrete', qr: '#FFFFFF', bg: '#95A5A6' },
  { name: 'Green Sea', qr: '#FFFFFF', bg: '#16A085' },
  { name: 'Shadow', qr: '#34495E', bg: '#2C3E50' },
  { name: 'Midnight Blue', qr: '#2C3E50', bg: '#FFFFFF' },
  { name: 'Soft Pink', qr: '#FF80AB', bg: '#FCE4EC' },
  { name: 'Cool Mint', qr: '#1DE9B6', bg: '#E0F2F1' },
  { name: 'Light Blue', qr: '#00B0FF', bg: '#E1F5FE' },
  { name: 'Warm Amber', qr: '#FFAB00', bg: '#FFF8E1' },
  { name: 'Deep Purple', qr: '#6200EA', bg: '#EDE7F6' },
];

/* ── Gradient Presets (Expanded to 50) ── */
const GRADIENT_PRESETS = [
  { name: 'Sunset', c1: '#FF512F', c2: '#DD2476' },
  { name: 'Ocean', c1: '#2193b0', c2: '#6dd5ed' },
  { name: 'Neon Night', c1: '#00F0FF', c2: '#7000FF' },
  { name: 'Lush', c1: '#56ab2f', c2: '#a8e063' },
  { name: 'Midnight', c1: '#232526', c2: '#414345' },
  { name: 'Candy', c1: '#ee9ca7', c2: '#ffdde1' },
  { name: 'Skyline', c1: '#1488CC', c2: '#2B32B2' },
  { name: 'Royal', c1: '#16222A', c2: '#3A6073' },
  { name: 'Sunrise', c1: '#f12711', c2: '#f5af19' },
  { name: 'Purple Love', c1: '#cc2b5e', c2: '#753a88' },
  { name: 'Deep Sea', c1: '#2C3E50', c2: '#4CA1AF' },
  { name: 'Fire', c1: '#f83600', c2: '#f9d423' },
  { name: 'Peach', c1: '#ED4264', c2: '#FFEDBC' },
  { name: 'Violet', c1: '#7F00FF', c2: '#E100FF' },
  { name: 'Emerald', c1: '#00b09b', c2: '#96c93d' },
  { name: 'Bora Bora', c1: '#2BC0E4', c2: '#EAECC6' },
  { name: 'Misty', c1: '#E0EAFC', c2: '#CFDEF3' },
  { name: 'Steel', c1: '#1F1C2C', c2: '#928DAB' },
  { name: 'Juicy', c1: '#FF8008', c2: '#FFC837' },
  { name: 'Pinky', c1: '#DD5E89', c2: '#F7BB97' },
  { name: 'Seaweed', c1: '#4b6cb7', c2: '#182848' },
  { name: 'Cherry', c1: '#EB3349', c2: '#F45C43' },
  { name: 'Mojito', c1: '#48c6ef', c2: '#6f86d6' },
  { name: 'Aqua', c1: '#00c6ff', c2: '#0072ff' },
  { name: 'Blueberry', c1: '#6a11cb', c2: '#2575fc' },
  { name: 'Bloody Mary', c1: '#FF512F', c2: '#DD2476' },
  { name: 'Rose', c1: '#e91e63', c2: '#ff8a80' },
  { name: 'Gold', c1: '#D4AF37', c2: '#F9E29C' },
  { name: 'Mint', c1: '#00b09b', c2: '#96c93d' },
  { name: 'Indigo', c1: '#396afc', c2: '#2948ff' },
  { name: 'Lime', c1: '#a8ff78', c2: '#78ffd6' },
  { name: 'Flamingo', c1: '#ff4b2b', c2: '#ff416c' },
  { name: 'Galaxy', c1: '#240b36', c2: '#c31432' },
  { name: 'Space', c1: '#0f0c29', c2: '#302b63' },
  { name: 'Cloudy', c1: '#fdfbfb', c2: '#ebedee' },
  { name: 'Forest', c1: '#5a3f37', c2: '#2c7744' },
  { name: 'Wine', c1: '#af2d2d', c2: '#631010' },
  { name: 'Magic', c1: '#5f2c82', c2: '#49a09d' },
  { name: 'Plum', c1: '#ada996', c2: '#f2f2f2' },
  { name: 'Steel Blue', c1: '#3a7bd5', c2: '#00d2ff' },
  { name: 'Turquoise', c1: '#136a8a', c2: '#267871' },
  { name: 'Venice', c1: '#085078', c2: '#85D8CE' },
  { name: 'Horizon', c1: '#003973', c2: '#E5E5BE' },
  { name: 'Electric', c1: '#6a11cb', c2: '#2575fc' },
  { name: 'Lava', c1: '#f12711', c2: '#f5af19' },
  { name: 'Toxic', c1: '#11998e', c2: '#38ef7d' },
  { name: 'Citrus', c1: '#FDC830', c2: '#F37335' },
  { name: 'Frost', c1: '#000428', c2: '#004e92' },
  { name: 'Coal', c1: '#000000', c2: '#434343' },
  { name: 'Titanium', c1: '#283048', c2: '#859398' },
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
  const [isPipetteActive, setIsPipetteActive] = useState(false);
  const [pipetteTarget, setPipetteTarget] = useState(null); // { setter }
  const [canvasSelection, setCanvasSelection] = useState(null); // 'logo' | 'text' | null

  // ── Gradient ──
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#6c5ce7');
  const [gradientColor2, setGradientColor2] = useState('#a78bfa');
  const [gradientType, setGradientType] = useState('linear');
  
  // ── QR Texture ──
  const [qrTextureEnabled, setQrTextureEnabled] = useState(false);
  const [qrTexture, setQrTexture] = useState(null); // { src, image, name }
  const [qrTextureSyncEyes, setQrTextureSyncEyes] = useState(true);

  // ── Shapes ──
  const [dotStyle, setDotStyle] = useState(DOT_STYLES.SQUARE);
  const [eyeStyle, setEyeStyle] = useState(EYE_STYLES.SQUARE);
  const [dotPadding, setDotPadding] = useState(0);
  const [eyePadding, setEyePadding] = useState(0);

  // ── Logo ──
  const [logo, setLogo] = useState(null);
  const [logoWidth, setLogoWidth] = useState(0.18);
  const [logoHeight, setLogoHeight] = useState(0.18);
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

  // New Logo Features
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoShadowEnabled, setLogoShadowEnabled] = useState(false);
  const [logoShadowColor, setLogoShadowColor] = useState('rgba(0,0,0,0.5)');
  const [logoShadowBlur, setLogoShadowBlur] = useState(10);
  const [logoShadowOffsetX, setLogoShadowOffsetX] = useState(0);
  const [logoShadowOffsetY, setLogoShadowOffsetY] = useState(4);
  const [logoInnerShadowEnabled, setLogoInnerShadowEnabled] = useState(false);
  const [logoEraseColorEnabled, setLogoEraseColorEnabled] = useState(false);
  const [logoEraseColor, setLogoEraseColor] = useState('#ffffff');
  const [logoTexture, setLogoTexture] = useState('none');
  const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [logoAspectRatioLocked, setLogoAspectRatioLocked] = useState(true);

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
  const [textCenterRotation, setTextCenterRotation] = useState(0);
  const [colorPopup, setColorPopup] = useState(null);
  const [shapePopup, setShapePopup] = useState(null);

  // ── References ──
  const canvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const tempCanvas = useRef(document.createElement('canvas'));
  const tempCtx = useRef(tempCanvas.current.getContext('2d'));
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
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalUpdate = useRef(false);
  const preEditSnapshot = useRef(null);

  const startEditing = (type, val) => {
    if (!preEditSnapshot.current) {
      preEditSnapshot.current = getSnapshot();
    }
    if (type === 'logo') setLogoPopup(val);
    else if (type === 'text') setTextPopup(val);
    else if (type === 'color') setColorPopup(val);
    else if (type === 'shapes') setShapePopup(val);
  };

  const cancelEditing = () => {
    if (preEditSnapshot.current) {
      applySnapshot(preEditSnapshot.current);
    }
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapePopup(null);
    preEditSnapshot.current = null;
  };

  const applyEditing = () => {
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapePopup(null);
    preEditSnapshot.current = null;
    saveSnapshot(); // Save the final result to history
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      if (logoPopup || textPopup || colorPopup || shapePopup) {
        applyEditing();
      }
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(tabId);
    }
  };

  // Custom navigation wrapper to track history
  const navigateTo = (page) => {
    if (page !== activePage) {
      if (logoPopup || textPopup || colorPopup || shapePopup) {
        applyEditing();
      }
      setPreviousPage(activePage);
      setActivePage(page);
      // Clear tab history when starting a new session or returning home
      if (page === 'generator' || page === 'home') {
        setTabHistory([]);
        if (page === 'generator') setActiveTab('content');
      }
    }
  };

  const getSnapshot = useCallback(() => {
    return {
      qrType, qrData, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes,
      gradientEnabled, gradientColor1, gradientColor2, gradientType,
      qrTextureEnabled, qrTexture: qrTexture ? { src: qrTexture.src, name: qrTexture.name } : null,
      qrTextureSyncEyes,
      dotStyle, eyeStyle, dotPadding, eyePadding,
      logo: logo ? { src: logo.src, name: logo.name } : null,
      logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
      logoOutline, logoOutlineColor, logoOutlineWidth, logoPosX, logoPosY,
      logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
      logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoTexture, logoCrop, logoAspectRatioLocked,
      frameStyle, frameText, frameColor, frameFont, frameSize,
      frameStrokeEnabled, frameStrokeWidth, frameStrokeColor,
      frameShadowEnabled, frameShadowBlur, frameShadowColor,
      textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
      textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
      textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
      textCenterPosX, textCenterPosY, textCenterRotation
    };
  }, [
    qrType, qrData, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType,
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    dotStyle, eyeStyle, dotPadding, eyePadding,
    logo, logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoPosX, logoPosY,
    logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
    logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoTexture, logoCrop, logoAspectRatioLocked,
    frameStyle, frameText, frameColor, frameFont, frameSize,
    frameStrokeEnabled, frameStrokeWidth, frameStrokeColor,
    frameShadowEnabled, frameShadowBlur, frameShadowColor,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY, textCenterRotation
  ]);

  const saveSnapshot = useCallback(() => {
    if (isInternalUpdate.current) return;
    const current = getSnapshot();
    
    // Avoid saving if the current state matches the one we're already at in history
    // This prevents Redo from breaking after an Undo action.
    if (historyIndex >= 0 && history[historyIndex]) {
      if (JSON.stringify(current) === JSON.stringify(history[historyIndex])) return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(current);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => {
      const newIndex = (historyIndex < 49) ? historyIndex + 1 : 49;
      return newIndex;
    });
  }, [getSnapshot, historyIndex, history]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const snapshot = history[prevIndex];
    applySnapshot(snapshot);
    setHistoryIndex(prevIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const snapshot = history[nextIndex];
    applySnapshot(snapshot);
    setHistoryIndex(nextIndex);
  }, [history, historyIndex]);

  const applySnapshot = (s) => {
    isInternalUpdate.current = true;
    if (s.qrType !== undefined) setQrType(s.qrType);
    if (s.qrData !== undefined) setQrData(s.qrData);
    if (s.qrTextureEnabled !== undefined) setQrTextureEnabled(s.qrTextureEnabled);
    if (s.qrTextureSyncEyes !== undefined) setQrTextureSyncEyes(s.qrTextureSyncEyes);
    if (s.qrTexture) {
      const img = new Image();
      img.onload = () => setQrTexture({ ...s.qrTexture, image: img });
      img.src = s.qrTexture.src;
    } else if (s.qrTexture === null) {
      setQrTexture(null);
    }
    if (s.qrColor !== undefined) setQrColor(s.qrColor);
    if (s.bgColor !== undefined) setBgColor(s.bgColor);
    if (s.bgTransparent !== undefined) setBgTransparent(s.bgTransparent);
    if (s.eyeColor !== undefined) setEyeColor(s.eyeColor);
    if (s.eyeOuterColor !== undefined) setEyeOuterColor(s.eyeOuterColor);
    if (s.syncEyes !== undefined) setSyncEyes(s.syncEyes);
    if (s.gradientEnabled !== undefined) setGradientEnabled(s.gradientEnabled);
    if (s.gradientColor1 !== undefined) setGradientColor1(s.gradientColor1);
    if (s.gradientColor2 !== undefined) setGradientColor2(s.gradientColor2);
    if (s.gradientType !== undefined) setGradientType(s.gradientType);
    if (s.dotStyle !== undefined) setDotStyle(s.dotStyle);
    if (s.eyeStyle !== undefined) setEyeStyle(s.eyeStyle);
    if (s.dotPadding !== undefined) setDotPadding(s.dotPadding);
    if (s.eyePadding !== undefined) setEyePadding(s.eyePadding);
    
    if (s.logo) {
      if (!logo || logo.src !== s.logo.src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setLogo({ src: s.logo.src, name: s.logo.name, image: img });
        img.src = s.logo.src;
      }
    } else {
      setLogo(null);
    }

    if (s.logoWidth !== undefined) setLogoWidth(s.logoWidth);
    if (s.logoHeight !== undefined) setLogoHeight(s.logoHeight);
    if (s.logoAspectRatioLocked !== undefined) setLogoAspectRatioLocked(s.logoAspectRatioLocked);
    if (s.logoPadding !== undefined) setLogoPadding(s.logoPadding);
    if (s.logoBackground !== undefined) setLogoBackground(s.logoBackground);
    if (s.logoBgColor !== undefined) setLogoBgColor(s.logoBgColor);
    if (s.logoBgShape !== undefined) setLogoBgShape(s.logoBgShape);
    if (s.logoOutline !== undefined) setLogoOutline(s.logoOutline);
    if (s.logoOutlineColor !== undefined) setLogoOutlineColor(s.logoOutlineColor);
    if (s.logoOutlineWidth !== undefined) setLogoOutlineWidth(s.logoOutlineWidth);
    if (s.logoPosX !== undefined) setLogoPosX(s.logoPosX);
    if (s.logoPosY !== undefined) setLogoPosY(s.logoPosY);
    if (s.frameStyle !== undefined) setFrameStyle(s.frameStyle);
    if (s.frameText !== undefined) setFrameText(s.frameText);
    if (s.frameColor !== undefined) setFrameColor(s.frameColor);
    if (s.frameFont !== undefined) setFrameFont(s.frameFont);
    if (s.frameSize !== undefined) setFrameSize(s.frameSize);
    if (s.frameStrokeEnabled !== undefined) setFrameStrokeEnabled(s.frameStrokeEnabled);
    if (s.frameStrokeWidth !== undefined) setFrameStrokeWidth(s.frameStrokeWidth);
    if (s.frameStrokeColor !== undefined) setFrameStrokeColor(s.frameStrokeColor);
    if (s.frameShadowEnabled !== undefined) setFrameShadowEnabled(s.frameShadowEnabled);
    if (s.frameShadowBlur !== undefined) setFrameShadowBlur(s.frameShadowBlur);
    if (s.frameShadowColor !== undefined) setFrameShadowColor(s.frameShadowColor);
    if (s.textCenterEnabled !== undefined) setTextCenterEnabled(s.textCenterEnabled);
    if (s.textCenterText !== undefined) setTextCenterText(s.textCenterText);
    if (s.textCenterSize !== undefined) setTextCenterSize(s.textCenterSize);
    if (s.textCenterColor !== undefined) setTextCenterColor(s.textCenterColor);
    if (s.textCenterFont !== undefined) setTextCenterFont(s.textCenterFont);
    if (s.textCenterStrokeEnabled !== undefined) setTextCenterStrokeEnabled(s.textCenterStrokeEnabled);
    if (s.textCenterStrokeWidth !== undefined) setTextCenterStrokeWidth(s.textCenterStrokeWidth);
    if (s.textCenterStrokeColor !== undefined) setTextCenterStrokeColor(s.textCenterStrokeColor);
    if (s.textCenterShadowEnabled !== undefined) setTextCenterShadowEnabled(s.textCenterShadowEnabled);
    if (s.textCenterShadowBlur !== undefined) setTextCenterShadowBlur(s.textCenterShadowBlur);
    if (s.textCenterShadowColor !== undefined) setTextCenterShadowColor(s.textCenterShadowColor);
    if (s.textCenterPosX !== undefined) setTextCenterPosX(s.textCenterPosX);
    if (s.textCenterPosY !== undefined) setTextCenterPosY(s.textCenterPosY);
    if (s.textCenterRotation !== undefined) setTextCenterRotation(s.textCenterRotation);
    
    setTimeout(() => { isInternalUpdate.current = false; }, 50);
  };

  // Initial snapshot
  useEffect(() => {
    if (history.length === 0) {
      const initial = getSnapshot();
      setHistory([initial]);
      setHistoryIndex(0);
    }
  }, []);

  // Debounced auto-save for continuous and discrete changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSnapshot();
    }, 800); // Slightly faster debounce
    return () => clearTimeout(timer);
  }, [
    qrColor, bgColor, logoWidth, logoHeight, logoPosX, logoPosY, textCenterSize, textCenterPosX, textCenterPosY,
    frameSize, dotPadding, eyePadding, textCenterText, frameText,
    dotStyle, eyeStyle, qrType, logo, syncEyes, gradientEnabled, frameStyle,
    eyeColor, eyeOuterColor, logoBackground, logoOutline, textCenterEnabled
  ]);

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
        
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
          // Disable overlay on Android for a clean solid status bar and 0px extra header space
          await StatusBar.setOverlaysWebView({ overlay: false });
          document.documentElement.classList.add('platform-android');
        } else {
          await StatusBar.setOverlaysWebView({ overlay: true });
          document.documentElement.classList.add('platform-ios');
        }
        
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
          logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
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

  // ── Back Button Handling (Centralized) ──
  const lastBackPress = useRef(0);
  const backHandlerRef = useRef();

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
      logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
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
    if (item.logoWidth) setLogoWidth(item.logoWidth);
    if (item.logoHeight) setLogoHeight(item.logoHeight);
    else if (item.logoWidth, logoHeight) { setLogoWidth(item.logoWidth, logoHeight); setLogoHeight(item.logoWidth, logoHeight); }
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
    setLogoWidth(0.18);
    setLogoHeight(0.18);
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
        eyeColor,
        eyeOuterColor,
        syncEyes,
        dotPadding, eyePadding,
        gradientEnabled,
        gradientColor1,
        gradientColor2,
        gradientType,
        qrTextureEnabled,
        qrTexture,
        qrTextureSyncEyes,
        logo: logo?.image, logoWidth, logoHeight, logoPadding,
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
        textCenterEnabled, 
        textCenter: textCenterEnabled ? textCenterText : null,
        textCenterSize, textCenterColor, textCenterFont,
        textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
        textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
        textCenterPosX, textCenterPosY, textCenterRotation,
        logoPosX, logoPosY,
        logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
        logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoTexture, logoCrop,
        showHandle: canvasSelection === 'logo' || canvasSelection === 'text',
        selectedType: canvasSelection
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
    logo, logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
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
    textCenterPosX, textCenterPosY, logoPosX, logoPosY,
    logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
    logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoTexture, logoCrop, 
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    activeTab, canvasSelection
  ]);

  useEffect(() => {
    renderCanvas();
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
      logo.image.onerror = () => showToast('Logo failed to load', 'error');
    }
    if (qrTexture?.image && !qrTexture.image.complete) {
      qrTexture.image.onload = renderCanvas;
      qrTexture.image.onerror = () => showToast('Texture failed to load', 'error');
    }
  }, [renderCanvas, logo, qrTexture]);
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
    
    // Save snapshot before dragging/resizing starts if not already set
    if (!preEditSnapshot.current) {
      preEditSnapshot.current = getSnapshot();
    }
    
    // Clear selection if not pipette
    if (!isPipetteActive) {
      setCanvasSelection(null);
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (isPipetteActive) {
      const rect = canvas.getBoundingClientRect();
      const scale = 512 / rect.width;
      const x = (clientX - rect.left) * scale;
      const y = (clientY - rect.top) * scale;
      
      const ctx = canvas.getContext('2d');
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      
      if (pipetteTarget?.setter) {
        pipetteTarget.setter(hex);
      }
      setIsPipetteActive(false);
      setAdvPicker(prev => ({ ...prev, open: true, color: hex }));
      e.preventDefault();
      return;
    }
    
    // Convert click to canvas coordinates (0-512)
    const scale = 512 / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;

    const { contentX, contentY, contentSize } = getQRContentArea();

    // Helper to check if point is in rect with generous padding
    const inRect = (px, py, rx, ry, rw, rh) => {
      const pad = 25; 
      return px >= rx - pad && px <= rx + rw + pad && py >= ry - pad && py <= ry + rh + pad;
    };

    // 1. Check Logo
    if (logo?.image) {
      const lw = contentSize * logoWidth;
      const lh = contentSize * logoHeight;
      const lx = contentX + (contentSize - lw) * logoPosX;
      const ly = contentY + (contentSize - lh) * logoPosY;
      
      const centerX = lx + lw / 2;
      const centerY = ly + lh / 2;

      const dx_raw = x - centerX;
      const dy_raw = y - centerY;
      const ang = (-logoRotation * Math.PI) / 180;
      const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
      const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);

      const hSize = 24; 
      const checkH = (hx, hy, type) => {
          if (localX >= hx - hSize && localX <= hx + hSize && localY >= hy - hSize && localY <= hy + hSize) {
              setIsDraggingCanvas(true);
              dragType.current = type;
              dragStartOffset.current = { 
                  x: localX, 
                  y: localY, 
                  startW: logoWidth, 
                  startH: logoHeight, 
                  startPosX: logoPosX, 
                  startPosY: logoPosY, 
                  startRotation: logoRotation,
                  startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
              };
              e.preventDefault();
              return true;
          }
          return false;
      };

      // Only allow interacting with handles (resizing, rotating, deleting) if the logo is already selected
      if (canvasSelection === 'logo') {
        // Bottom-Left Rotate Bracket (Offset -20, 20) with a larger hit area check (hSize = 24)
        const checkRotateLogo = (hx, hy) => {
            const rotHSize = 24; // Extra generous touch target size for rotation handle
            if (localX >= hx - rotHSize && localX <= hx + rotHSize && localY >= hy - rotHSize && localY <= hy + rotHSize) {
                setIsDraggingCanvas(true);
                dragType.current = 'rotate-logo';
                dragStartOffset.current = { 
                    x: localX, 
                    y: localY, 
                    startW: logoWidth, 
                    startH: logoHeight, 
                    startPosX: logoPosX, 
                    startPosY: logoPosY, 
                    startRotation: logoRotation,
                    startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
                };
                e.preventDefault();
                return true;
            }
            return false;
        };
        if (checkRotateLogo(lx - 20, ly + lh + 20)) return;
        if (checkH(lx + lw, ly + lh, 'resize-logo-br')) return;
        if (checkH(lx + lw, ly + lh/2, 'resize-logo-r')) return;
        if (checkH(lx + lw/2, ly + lh, 'resize-logo-b')) return;
        
        // Delete Button
        if (checkH(lx + lw, ly, 'delete-logo')) {
          setLogo(null);
          setIsDraggingCanvas(false);
          dragType.current = null;
          e.preventDefault();
          return;
        }
      }
      
      // Clicking inside the body region always triggers dragging/selection
      if (inRect(localX, localY, lx, ly, lw, lh)) {
        setCanvasSelection('logo');
        setIsDraggingCanvas(true);
        dragType.current = 'logo';
        dragStartOffset.current = { x: x - lx, y: y - ly };
        e.preventDefault();
        return;
      }
    }

    if (textCenterEnabled && textCenterText) {
      const fontSize = contentSize * textCenterSize;
      tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
      const metrics = tempCtx.current.measureText(textCenterText);
      const tw = metrics.width + (logoPadding || 10) * 2;
      const th = (fontSize * 0.8) + (logoPadding || 10) * 2;
      
      const tx = contentX + (contentSize - tw) * textCenterPosX;
      const ty = contentY + (contentSize - th) * textCenterPosY;
      
      const centerX = tx + tw / 2;
      const centerY = ty + th / 2;

      const dx_raw = x - centerX;
      const dy_raw = y - centerY;
      const ang = (-textCenterRotation * Math.PI) / 180;
      const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
      const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);

      const hSize = 24;
      const checkH = (hx, hy, type) => {
          if (localX >= hx - hSize && localX <= hx + hSize && localY >= hy - hSize && localY <= hy + hSize) {
              setIsDraggingCanvas(true);
              dragType.current = type;
              dragStartOffset.current = { 
                  x: localX, 
                  y: localY, 
                  startSize: textCenterSize, 
                  startPosX: textCenterPosX, 
                  startPosY: textCenterPosY, 
                  startRotation: textCenterRotation, 
                  startW: tw / contentSize, 
                  startH: th / contentSize,
                  startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
              };
              e.preventDefault();
              return true;
          }
          return false;
      };

      // Only allow interacting with handles if text is already selected
      if (canvasSelection === 'text') {
        // Bottom-Left Rotate Bracket (Offset -20, 20) with a larger hit area check (hSize = 24)
        const checkRotateText = (hx, hy) => {
            const rotHSize = 24; // Extra generous touch target size for rotation handle
            if (localX >= hx - rotHSize && localX <= hx + rotHSize && localY >= hy - rotHSize && localY <= hy + rotHSize) {
                setIsDraggingCanvas(true);
                dragType.current = 'rotate-text';
                dragStartOffset.current = { 
                    x: localX, 
                    y: localY, 
                    startSize: textCenterSize, 
                    startPosX: textCenterPosX, 
                    startPosY: textCenterPosY, 
                    startRotation: textCenterRotation, 
                    startW: tw / contentSize, 
                    startH: th / contentSize,
                    startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
                };
                e.preventDefault();
                return true;
            }
            return false;
        };
        if (checkRotateText(tx - 20, ty + th + 20)) return;
        if (checkH(tx + tw, ty + th, 'resize-text-br')) return;
        
        if (checkH(tx + tw, ty, 'delete-text')) {
          setTextCenterEnabled(false);
          setIsDraggingCanvas(false);
          dragType.current = null;
          e.preventDefault();
          return;
        }
      }

      // Clicking inside the body region always triggers dragging/selection
      if (inRect(localX, localY, tx, ty, tw, th)) {
        setCanvasSelection('text');
        setIsDraggingCanvas(true);
        dragType.current = 'text';
        dragStartOffset.current = { x: x - tx, y: y - ty };
        e.preventDefault();
        return;
      }
    }
  }, [qrMatrixInfo, logo, logoWidth, logoHeight, logoPosX, logoPosY, logoRotation, textCenterEnabled, textCenterText, textCenterSize, textCenterPosX, textCenterPosY, textCenterRotation, logoPadding, getQRContentArea, canvasSelection, getSnapshot]);

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

    if (dragType.current === 'rotate-logo') {
        const lw = contentSize * logoWidth;
        const lh = contentSize * logoHeight;
        const lx = contentX + (contentSize - lw) * logoPosX;
        const ly = contentY + (contentSize - lh) * logoPosY;
        const centerX = lx + lw / 2;
        const centerY = ly + lh / 2;
        
        const currentMouseAngle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        const angleDelta = currentMouseAngle - dragStartOffset.current.startMouseAngle;
        let newRotation = dragStartOffset.current.startRotation + angleDelta;
        
        let normalizedRot = (newRotation % 360 + 360) % 360;
        const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        const snapTolerance = 4;
        for (const target of snapTargets) {
            if (Math.abs(normalizedRot - target) <= snapTolerance) {
                normalizedRot = target === 360 ? 0 : target;
                break;
            }
        }
        setLogoRotation(Math.round(normalizedRot));
    } else if (dragType.current === 'rotate-text') {
        const fontSize = contentSize * textCenterSize;
        tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
        const metrics = tempCtx.current.measureText(textCenterText);
        const tw = metrics.width + (logoPadding || 10) * 2;
        const th = (fontSize * 0.8) + (logoPadding || 10) * 2;
        const tx = contentX + (contentSize - tw) * textCenterPosX;
        const ty = contentY + (contentSize - th) * textCenterPosY;
        const centerX = tx + tw / 2;
        const centerY = ty + th / 2;
        
        const currentMouseAngle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        const angleDelta = currentMouseAngle - dragStartOffset.current.startMouseAngle;
        let newRotation = dragStartOffset.current.startRotation + angleDelta;
        
        let normalizedRot = (newRotation % 360 + 360) % 360;
        const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        const snapTolerance = 4;
        for (const target of snapTargets) {
            if (Math.abs(normalizedRot - target) <= snapTolerance) {
                normalizedRot = target === 360 ? 0 : target;
                break;
            }
        }
        setTextCenterRotation(Math.round(normalizedRot));
    } else if (dragType.current && dragType.current.startsWith('resize-logo')) {
        const lw = contentSize * logoWidth;
        const lh = contentSize * logoHeight;
        const lx = contentX + (contentSize - lw) * logoPosX;
        const ly = contentY + (contentSize - lh) * logoPosY;
        const centerX = lx + lw / 2;
        const centerY = ly + lh / 2;
        const dx_raw = x - centerX;
        const dy_raw = y - centerY;
        const ang = (-logoRotation * Math.PI) / 180;
        const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
        const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
        const diffX = (localX - dragStartOffset.current.x) / contentSize;
        const diffY = (localY - dragStartOffset.current.y) / contentSize;
        
        const startW_px = contentSize * dragStartOffset.current.startW;
        const startH_px = contentSize * dragStartOffset.current.startH;
        const lx_start = contentX + (contentSize - startW_px) * dragStartOffset.current.startPosX;
        const ly_start = contentY + (contentSize - startH_px) * dragStartOffset.current.startPosY;

        let newW = dragStartOffset.current.startW;
        let newH = dragStartOffset.current.startH;
        if (dragType.current === 'resize-logo-br') {
            const scale = Math.max(0.1, (dragStartOffset.current.startW + diffX) / dragStartOffset.current.startW);
            newW = Math.max(0.05, Math.min(0.6, dragStartOffset.current.startW * scale));
            newH = Math.max(0.05, Math.min(0.6, dragStartOffset.current.startH * scale));
            
            // Adjust dragStartOffset.current.x to align with the clamp boundaries
            const maxScale = 0.6 / dragStartOffset.current.startW;
            const minScale = 0.05 / dragStartOffset.current.startW;
            const currentScale = (dragStartOffset.current.startW + diffX) / dragStartOffset.current.startW;
            if (currentScale > maxScale) {
                const maxDiffX = (maxScale - 1) * dragStartOffset.current.startW;
                dragStartOffset.current.x = localX - maxDiffX * contentSize;
            } else if (currentScale < minScale) {
                const minDiffX = (minScale - 1) * dragStartOffset.current.startW;
                dragStartOffset.current.x = localX - minDiffX * contentSize;
            }
        } else if (dragType.current === 'resize-logo-r') {
            newW = Math.max(0.05, Math.min(0.6, dragStartOffset.current.startW + diffX));
            
            // Adjust dragStartOffset.current.x to align with the clamp boundaries
            const maxDiffX = 0.6 - dragStartOffset.current.startW;
            const minDiffX = 0.05 - dragStartOffset.current.startW;
            if (diffX > maxDiffX) {
                dragStartOffset.current.x = localX - maxDiffX * contentSize;
            } else if (diffX < minDiffX) {
                dragStartOffset.current.x = localX - minDiffX * contentSize;
            }
        } else if (dragType.current === 'resize-logo-b') {
            newH = Math.max(0.05, Math.min(0.6, dragStartOffset.current.startH + diffY));
            
            // Adjust dragStartOffset.current.y to align with the clamp boundaries
            const maxDiffY = 0.6 - dragStartOffset.current.startH;
            const minDiffY = 0.05 - dragStartOffset.current.startH;
            if (diffY > maxDiffY) {
                dragStartOffset.current.y = localY - maxDiffY * contentSize;
            } else if (diffY < minDiffY) {
                dragStartOffset.current.y = localY - minDiffY * contentSize;
            }
        }
        
        const newW_px = contentSize * newW;
        const newH_px = contentSize * newH;
        let newPosX = dragStartOffset.current.startPosX;
        let newPosY = dragStartOffset.current.startPosY;
        
        // Symmetrical centering resize locks: if it was already centered at the start of the drag,
        // we lock it to exactly 0.5 center to keep it centered perfectly.
        // Otherwise, resize normally by keeping the top-left edge anchored with absolutely no jumps.
        if (dragStartOffset.current.startPosX === 0.5) {
            newPosX = 0.5;
        } else if (contentSize - newW_px > 0) {
            newPosX = Math.max(0, Math.min(1, (lx_start - contentX) / (contentSize - newW_px)));
        }
        
        if (dragStartOffset.current.startPosY === 0.5) {
            newPosY = 0.5;
        } else if (contentSize - newH_px > 0) {
            newPosY = Math.max(0, Math.min(1, (ly_start - contentY) / (contentSize - newH_px)));
        }

        setLogoWidth(Math.round(newW * 100) / 100);
        setLogoHeight(Math.round(newH * 100) / 100);
        setLogoPosX(Math.round(newPosX * 1000) / 1000);
        setLogoPosY(Math.round(newPosY * 1000) / 1000);
    } else if (dragType.current && dragType.current.startsWith('resize-text')) {
        const dx = x - dragStartOffset.current.x;
        const diff = dx / contentSize;
        const newSize = Math.max(0.05, Math.min(0.5, dragStartOffset.current.startSize + diff));
        
        // Adjust dragStartOffset.current.x to align with the clamp boundaries
        const maxDiff = 0.5 - dragStartOffset.current.startSize;
        const minDiff = 0.05 - dragStartOffset.current.startSize;
        if (diff > maxDiff) {
            dragStartOffset.current.x = x - maxDiff * contentSize;
        } else if (diff < minDiff) {
            dragStartOffset.current.x = x - minDiff * contentSize;
        }
        
        const startW = dragStartOffset.current.startW * contentSize;
        const startH = dragStartOffset.current.startH * contentSize;
        const tx_start = contentX + (contentSize - startW) * dragStartOffset.current.startPosX;
        const ty_start = contentY + (contentSize - startH) * dragStartOffset.current.startPosY;
        
        const fontSize = contentSize * newSize;
        tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
        const metrics = tempCtx.current.measureText(textCenterText);
        const newTw = metrics.width + (logoPadding || 10) * 2;
        const newTh = (fontSize * 0.8) + (logoPadding || 10) * 2;
        
        let newPosX = dragStartOffset.current.startPosX;
        let newPosY = dragStartOffset.current.startPosY;
        
        // Symmetrical centering resize locks: if it was already centered at the start of the drag,
        // we lock it to exactly 0.5 center to keep it centered perfectly.
        // Otherwise, resize normally by keeping the top-left edge anchored with absolutely no jumps.
        if (dragStartOffset.current.startPosX === 0.5) {
            newPosX = 0.5;
        } else if (contentSize - newTw > 0) {
            newPosX = Math.max(0, Math.min(1, (tx_start - contentX) / (contentSize - newTw)));
        }
        
        if (dragStartOffset.current.startPosY === 0.5) {
            newPosY = 0.5;
        } else if (contentSize - newTh > 0) {
            newPosY = Math.max(0, Math.min(1, (ty_start - contentY) / (contentSize - newTh)));
        }
        
        setTextCenterSize(Math.round(newSize * 100) / 100);
        setTextCenterPosX(Math.round(newPosX * 1000) / 1000);
        setTextCenterPosY(Math.round(newPosY * 1000) / 1000);
    } else if (dragType.current === 'logo' && logo?.image) {
        const lw = contentSize * logoWidth;
        const lh = contentSize * logoHeight;
        const newLx = x - dragStartOffset.current.x;
        const newLy = y - dragStartOffset.current.y;
        let valX = Math.max(0, Math.min(1, (newLx - contentX) / (contentSize - lw)));
        let valY = Math.max(0, Math.min(1, (newLy - contentY) / (contentSize - lh)));
        
        // Snapping tolerance of 0.02 around 0.5 center
        const snapTolerance = 0.02;
        if (Math.abs(valX - 0.5) <= snapTolerance) {
            valX = 0.5;
        }
        if (Math.abs(valY - 0.5) <= snapTolerance) {
            valY = 0.5;
        }
        
        setLogoPosX(Math.round(valX * 1000) / 1000);
        setLogoPosY(Math.round(valY * 1000) / 1000);
    } else if (dragType.current === 'text') {
      const fontSize = contentSize * textCenterSize;
      tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
      const metrics = tempCtx.current.measureText(textCenterText);
      const tw = metrics.width + (logoPadding || 10) * 2;
      const th = (fontSize * 0.8) + (logoPadding || 10) * 2;
      
      const newTx = x - dragStartOffset.current.x;
      const newTy = y - dragStartOffset.current.y;
      let valX = Math.max(0, Math.min(1, (newTx - contentX) / (contentSize - tw)));
      let valY = Math.max(0, Math.min(1, (newTy - contentY) / (contentSize - th)));
      
      // Snapping tolerance of 0.02 around 0.5 center
      const snapTolerance = 0.02;
      if (Math.abs(valX - 0.5) <= snapTolerance) {
          valX = 0.5;
      }
      if (Math.abs(valY - 0.5) <= snapTolerance) {
          valY = 0.5;
      }
      
      setTextCenterPosX(Math.round(valX * 1000) / 1000);
      setTextCenterPosY(Math.round(valY * 1000) / 1000);
    }
  }, [isDraggingCanvas, logo, logoWidth, logoHeight, logoRotation, textCenterEnabled, textCenterText, textCenterSize, textCenterPosX, textCenterPosY, textCenterRotation, textCenterFont, logoPadding, getQRContentArea]);

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
            <div className="header-undo-redo" style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
              <button 
                onClick={undo} 
                disabled={historyIndex <= 0}
                style={{ 
                  width: '36px', height: '36px', borderRadius: '10px', 
                  background: 'var(--bg-hover)', 
                  border: '1px solid var(--border-color)', 
                  color: historyIndex <= 0 ? 'var(--text-tertiary)' : 'var(--accent-primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: historyIndex <= 0 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: historyIndex <= 0 ? 0.5 : 1
                }}
                title="Undo"
              >
                <Undo2 size={18} strokeWidth={2.5} />
              </button>
              <button 
                onClick={redo} 
                disabled={historyIndex >= history.length - 1}
                style={{ 
                  width: '36px', height: '36px', borderRadius: '10px', 
                  background: 'var(--bg-hover)', 
                  border: '1px solid var(--border-color)', 
                  color: historyIndex >= history.length - 1 ? 'var(--text-tertiary)' : 'var(--accent-primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1
                }}
                title="Redo"
              >
                <Redo2 size={18} strokeWidth={2.5} />
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
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px 100px 20px', display: 'flex', flexDirection: 'column' }}>
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



              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="tab-panel fade-in" id="panel-logo">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '24px 20px 100px 20px' }}>
                    {/* 1. Presets Section */}
                    <LogoPresets 
                      logo={logo} 
                      onLogoChange={(l) => { 
                        setLogo(l); 
                        setLogoWidth(0.18); 
                        setLogoHeight(0.18); 
                        setLogoRotation(0);
                        setLogoPosX(0.5);
                        setLogoPosY(0.5);
                        startEditing('logo', 'size'); 
                      }} 
                      onLogoRemove={() => { 
                        setLogo(null); 
                        setLogoWidth(0.18);
                        setLogoHeight(0.18);
                        setLogoRotation(0);
                        if (logoPopup) cancelEditing(); 
                      }} 
                    />
                  </div>

                </div>
              )}




            </section>

            {/* ─── Shared Unified Expandable Toolbar (Centralized Bottom Layer) ─── */}
            {((activeTab === 'logo' && logo) || activeTab === 'text' || activeTab === 'color' || activeTab === 'shapes') && (
              <div className="logo-toolbar-container">
                <div className="unified-toolbar-card">
                  {(logoPopup || textPopup || colorPopup || shapePopup) ? (
                    <div className="toolbar-editing-view fade-in">
                      <div className="toolbar-editing-header">
                        <button className="toolbar-cancel-btn" onClick={cancelEditing}>
                          <X size={20} />
                        </button>
                        <button className="toolbar-apply-btn" onClick={applyEditing}>
                          <Check size={20} />
                        </button>
                      </div>

                      <div className="toolbar-properties-panel-full">
                      {logoPopup === 'size' && (
                        <div className="fade-in">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <Slider 
                                label="Logo Width" 
                                value={logoWidth} 
                                min={0.05} 
                                max={0.6} 
                                step={0.01} 
                                onChange={(val) => {
                                  if (logoAspectRatioLocked) {
                                    const ratio = logoWidth > 0 ? (logoHeight / logoWidth) : 1;
                                    setLogoWidth(val);
                                    setLogoHeight(Math.max(0.05, Math.min(0.6, val * ratio)));
                                  } else {
                                    setLogoWidth(val);
                                  }
                                }} 
                              />
                              <Slider 
                                label="Logo Height" 
                                value={logoHeight} 
                                min={0.05} 
                                max={0.6} 
                                step={0.01} 
                                onChange={(val) => {
                                  if (logoAspectRatioLocked) {
                                    const ratio = logoHeight > 0 ? (logoWidth / logoHeight) : 1;
                                    setLogoHeight(val);
                                    setLogoWidth(Math.max(0.05, Math.min(0.6, val * ratio)));
                                  } else {
                                    setLogoHeight(val);
                                  }
                                }} 
                              />
                            </div>
                            
                            <Toggle 
                              label="Resize Combined" 
                              checked={logoAspectRatioLocked} 
                              onChange={setLogoAspectRatioLocked} 
                            />
                            
                            <Slider label="Logo Padding" value={logoPadding} min={0} max={20} step={1} onChange={setLogoPadding} />
                          </div>
                        </div>
                      )}
                      {logoPopup === 'stroke' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {logoPopup === 'bg' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {logoPopup === 'pos' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {logoPopup === 'rotate' && (
                        <div className="fade-in">
                          <Slider label="Rotation" value={logoRotation} min={0} max={360} step={1} onChange={setLogoRotation} />
                        </div>
                      )}
                      {logoPopup === 'opacity' && (
                        <div className="fade-in">
                          <Slider label="Opacity" value={logoOpacity} min={0} max={1} step={0.01} onChange={setLogoOpacity} />
                        </div>
                      )}
                      {logoPopup === 'shadow' && (
                        <div className="fade-in">
                          <Toggle label="Drop Shadow" checked={logoShadowEnabled} onChange={setLogoShadowEnabled} />
                          {logoShadowEnabled && (
                            <div className="fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                               <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '-8px' }}>Shadow Color</div>
                               <ColorPicker value={logoShadowColor} onChange={setLogoShadowColor} />
                               <Slider label="Blur" value={logoShadowBlur} min={0} max={40} step={1} onChange={setLogoShadowBlur} />
                               <div style={{ display: 'flex', gap: '12px' }}>
                                 <div style={{ flex: 1 }}><Slider label="Offset X" value={logoShadowOffsetX} min={-20} max={20} step={1} onChange={setLogoShadowOffsetX} /></div>
                                 <div style={{ flex: 1 }}><Slider label="Offset Y" value={logoShadowOffsetY} min={-20} max={20} step={1} onChange={setLogoShadowOffsetY} /></div>
                               </div>
                            </div>
                          )}
                          <div style={{ marginTop: '16px' }}>
                            <Toggle label="Inner Shadow" checked={logoInnerShadowEnabled} onChange={setLogoInnerShadowEnabled} />
                          </div>
                        </div>
                      )}
                      {logoPopup === 'filter' && (
                        <div className="fade-in">
                           <Toggle label="Erase Color (Green Screen)" checked={logoEraseColorEnabled} onChange={setLogoEraseColorEnabled} />
                           {logoEraseColorEnabled && (
                             <div className="fade-in" style={{ marginTop: '16px' }}>
                               <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Target Color to Remove</div>
                               <ColorPicker value={logoEraseColor} onChange={setLogoEraseColor} />
                               <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>Automatically removes the selected color (e.g. white/black backgrounds).</p>
                             </div>
                           )}
                        </div>
                      )}
                      {logoPopup === 'texture' && (
                        <div className="fade-in">
                           <div className="font-scroll-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                                {['none', 'glass', 'carbon', 'metal', 'mesh', 'dots'].map(t => {
                                  const isActive = logoTexture === t;
                                  return (
                                    <button 
                                      key={t} 
                                      onClick={() => setLogoTexture(t)}
                                      className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                      style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)', fontSize: '14px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}
                                    >
                                      {t}
                                    </button>
                                  );
                                })}
                           </div>
                        </div>
                      )}
                      {logoPopup === 'crop' && (
                        <div className="fade-in">
                           <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Quick Shape Crop</div>
                           <div className="seg-control" style={{ marginBottom: '16px' }}>
                             <button className={`seg-btn ${logoCrop === 'none' ? 'active' : ''}`} onClick={() => setLogoCrop('none')}>None</button>
                             <button className={`seg-btn ${logoCrop === 'circle' ? 'active' : ''}`} onClick={() => setLogoCrop('circle')}>Circle</button>
                             <button className={`seg-btn ${logoCrop === 'rounded' ? 'active' : ''}`} onClick={() => setLogoCrop('rounded')}>Rounded</button>
                             <button className={`seg-btn ${logoCrop === 'square' ? 'active' : ''}`} onClick={() => setLogoCrop('square')}>Square</button>
                           </div>
                           <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                             Select a shape to instantly mask your logo.
                           </p>
                        </div>
                      )}

                      {/* TEXT PROPERTIES */}
                      {textPopup === 'input' && (
                        <div className="fade-in">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Enable Text</div>
                            <Toggle
                              checked={textEditMode === 'center' ? textCenterEnabled : frameStyle !== 'none'}
                              onChange={(val) => {
                                if (textEditMode === 'center') {
                                  setTextCenterEnabled(val);
                                  if (val) {
                                    setLogo(null);
                                    setLogoWidth(0.18);
                                    setLogoHeight(0.18);
                                    setLogoRotation(0);
                                  }
                                } else {
                                  setFrameStyle(val ? 'text-bottom' : 'none');
                                }
                              }}
                            />
                          </div>

                          <div className="editing-row-item">
                            <div className="seg-control" style={{ marginBottom: '16px' }}>
                              <button className={`seg-btn ${textEditMode === 'center' ? 'active' : ''}`} onClick={() => setTextEditMode('center')}>QR Text</button>
                              <button className={`seg-btn ${textEditMode === 'bottom' ? 'active' : ''}`} onClick={() => setTextEditMode('bottom')}>Bottom Text</button>
                            </div>
                            <input 
                              type="text" 
                              maxLength={textEditMode === 'center' ? 18 : 50} 
                              value={textEditMode === 'center' ? textCenterText : frameText} 
                              onChange={(e) => textEditMode === 'center' ? setTextCenterText(e.target.value) : setFrameText(e.target.value)} 
                              placeholder={`Type ${textEditMode === 'center' ? 'QR' : 'bottom'} text...`} 
                              className="text-input-premium" 
                              style={{ width: '100%' }} 
                            />
                          </div>
                        </div>
                      )}
                      
                      {textPopup === 'fonts' && (
                        <div className="fade-in">
                          <button onClick={() => fontInputRef.current?.click()} className="font-scroll-btn-wide"><Plus size={14} /> Add Font</button>
                          <input type="file" ref={fontInputRef} style={{ display: 'none' }} accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} />
                          <div className="fonts-grid">
                            {customFonts.map(font => (
                              <button key={font.id} onClick={() => { if (textEditMode === 'center') setTextCenterFont(font.id); else { setFrameFont(font.id); if (frameStyle === 'none') setFrameStyle('text-bottom'); } }} className={`font-btn ${(textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'active' : ''}`} style={{ fontFamily: font.id }}>{font.label} ★</button>
                            ))}
                            {FONT_OPTIONS.map(font => (
                              <button key={font.id} onClick={() => { if (textEditMode === 'center') setTextCenterFont(font.id); else { setFrameFont(font.id); if (frameStyle === 'none') setFrameStyle('text-bottom'); } }} className={`font-btn ${(textEditMode === 'center' ? textCenterFont : frameFont) === font.id ? 'active' : ''}`} style={{ fontFamily: font.id }}>{font.label}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {textPopup === 'size' && (
                        <div className="fade-in">
                          <Slider label="Size" min={0.02} max={0.18} step={0.01} value={textEditMode === 'center' ? textCenterSize : frameSize} onChange={textEditMode === 'center' ? setTextCenterSize : setFrameSize} />
                        </div>
                      )}
                      {textPopup === 'color' && (
                        <div className="fade-in">
                          <div className="swatch-grid-mini">
                            <ColorPicker isSwatch={true} icon={Pipette} value={textEditMode === 'center' ? textCenterColor : frameColor} onChange={textEditMode === 'center' ? setTextCenterColor : setFrameColor} onOpenAdvanced={handleOpenAdv} />
                            {SWATCH_PRESETS.map(color => (
                              <div key={color} className={`swatch-item${(textEditMode === 'center' ? textCenterColor : frameColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => textEditMode === 'center' ? setTextCenterColor(color) : setFrameColor(color)} />
                            ))}
                          </div>
                        </div>
                      )}
                      {textPopup === 'stroke' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {textPopup === 'shadow' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {textPopup === 'bg' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {textPopup === 'pos' && (
                        <div className="fade-in">
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
                        </div>
                      )}
                      {textPopup === 'rotate' && (
                        <div className="fade-in">
                          <Slider 
                            label="Rotation" 
                            value={textCenterRotation} 
                            min={0} 
                            max={360} 
                            step={1} 
                            onChange={(val) => {
                              if (textEditMode === 'center') setTextCenterRotation(val);
                            }} 
                          />
                        </div>
                      )}


                      {colorPopup === 'presets' && (
                        <div className="fade-in">
                          <div className="swatch-grid-mini" style={{ padding: '4px 0 16px 0', gap: '10px' }}>
                            {COLOR_PRESETS.map(p => {
                              const isSelected = qrColor === p.qr && bgColor === p.bg;
                              return (
                                <button 
                                  key={p.name} 
                                  onClick={() => { 
                                    setQrColor(p.qr); 
                                    setBgColor(p.bg); 
                                    if (syncEyes) { setEyeColor(p.qr); setEyeOuterColor(p.qr); } 
                                    setBgTransparent(false);
                                  }} 
                                  style={{ 
                                    flex: '0 0 auto',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    background: 'none', 
                                    border: 'none',
                                    padding: '0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    width: '60px'
                                  }}
                                >
                                  <div style={{ 
                                    width: '44px', 
                                    height: '44px', 
                                    borderRadius: '12px', 
                                    background: p.bg, 
                                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    boxShadow: isSelected ? '0 8px 16px rgba(255,59,48,0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
                                    transition: 'all 0.2s ease'
                                  }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: p.qr }} />
                                  </div>
                                  <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: isSelected ? 700 : 500, 
                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    width: '100%', 
                                    textAlign: 'center' 
                                  }}>{p.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {colorPopup === 'dots' && (
                        <div className="fade-in">
                          <div className="swatch-grid-mini">
                            <ColorPicker isSwatch={true} icon={Pipette} value={qrColor} onChange={(c) => { setQrColor(c); }} onOpenAdvanced={handleOpenAdv} />
                            {SWATCH_PRESETS.map(color => (
                              <div key={color} className={`swatch-item${qrColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => { setQrColor(color); }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {colorPopup === 'bg' && (
                        <div className="fade-in">
                          <Toggle label="Transparent Background" checked={bgTransparent} onChange={setBgTransparent} />
                          <div className="swatch-grid-mini" style={{ marginTop: '16px' }}>
                            <ColorPicker isSwatch={true} icon={Pipette} value={bgColor} onChange={(c) => { setBgColor(c); setLogoBgColor(c); setBgTransparent(false); }} onOpenAdvanced={handleOpenAdv} />
                            {['#FFFFFF', '#000000', ...SWATCH_PRESETS.slice(2)].map(color => (
                              <div key={color} className={`swatch-item${!bgTransparent && bgColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => { setBgColor(color); setLogoBgColor(color); setBgTransparent(false); }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {colorPopup === 'eyes' && (
                        <div className="fade-in">
                          <Toggle label="Sync Eyes with Dots" checked={syncEyes} onChange={setSyncEyes} />
                          {!syncEyes && (
                            <div className="fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Inner Eyes</div>
                                <div className="swatch-grid-mini">
                                  <ColorPicker isSwatch={true} icon={Pipette} value={eyeColor || qrColor} onChange={setEyeColor} onOpenAdvanced={handleOpenAdv} />
                                  {SWATCH_PRESETS.map(color => (
                                    <div key={color} className={`swatch-item${(eyeColor || qrColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setEyeColor(color)} />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Outer Eyes</div>
                                <div className="swatch-grid-mini">
                                  <ColorPicker isSwatch={true} icon={Pipette} value={eyeOuterColor || qrColor} onChange={setEyeOuterColor} onOpenAdvanced={handleOpenAdv} />
                                  {SWATCH_PRESETS.map(color => (
                                    <div key={color} className={`swatch-item${(eyeOuterColor || qrColor) === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setEyeOuterColor(color)} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {colorPopup === 'gradient' && (
                        <div className="fade-in">
                          <Toggle label="Enable Gradient" checked={gradientEnabled} onChange={setGradientEnabled} />
                          {gradientEnabled && (
                            <div className="fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <Toggle label="Sync Eyes with Gradient" checked={syncEyes} onChange={setSyncEyes} />
                              <div className="swatch-grid-mini" style={{ padding: '0 0 12px 0', gap: '10px' }}>
                                {GRADIENT_PRESETS.map(p => {
                                  const isSelected = gradientColor1 === p.c1 && gradientColor2 === p.c2;
                                  return (
                                    <button 
                                      key={p.name} 
                                      onClick={() => { 
                                        setGradientColor1(p.c1); 
                                        setGradientColor2(p.c2); 
                                      }} 
                                      style={{ 
                                        flex: '0 0 auto',
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        background: 'none', 
                                        border: 'none',
                                        padding: '0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        width: '60px'
                                      }}
                                    >
                                      <div style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '12px', 
                                        background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`, 
                                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                        boxShadow: isSelected ? '0 8px 16px rgba(255,59,48,0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
                                        transition: 'all 0.2s ease'
                                      }} />
                                      <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: isSelected ? 700 : 500, 
                                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        width: '100%', 
                                        textAlign: 'center' 
                                      }}>{p.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="seg-control">
                                <button className={`seg-btn ${gradientType === 'linear' ? 'active' : ''}`} onClick={() => setGradientType('linear')}>Linear</button>
                                <button className={`seg-btn ${gradientType === 'radial' ? 'active' : ''}`} onClick={() => setGradientType('radial')}>Radial</button>
                              </div>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Color 1</div>
                                  <ColorPicker value={gradientColor1} onChange={setGradientColor1} onOpenAdvanced={handleOpenAdv} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Color 2</div>
                                  <ColorPicker value={gradientColor2} onChange={setGradientColor2} onOpenAdvanced={handleOpenAdv} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {colorPopup === 'texture' && (
                        <div className="fade-in">
                          <Toggle label="Enable QR Texture" checked={qrTextureEnabled} onChange={setQrTextureEnabled} />
                          {qrTextureEnabled && (
                            <div className="fade-in" style={{ marginTop: '16px' }}>
                              <Toggle label="Sync Eyes with Texture" checked={qrTextureSyncEyes} onChange={setQrTextureSyncEyes} />
                              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select or Upload Texture</div>
                                <div className="font-scroll-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                                  <button 
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (re) => {
                                            const img = new Image();
                                            img.onload = () => setQrTexture({ src: re.target.result, image: img, name: file.name });
                                            img.src = re.target.result;
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="font-scroll-btn"
                                    style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: 'var(--bg-elevated)', color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)', fontSize: '14px' }}
                                  >
                                    <Plus size={16} /> Upload
                                  </button>
                                  {['glass', 'carbon', 'metal', 'mesh', 'dots', 'gold', 'silver', 'marble'].map(t => {
                                    const isActive = qrTexture?.name === t;
                                    return (
                                      <button 
                                        key={t} 
                                        onClick={() => {
                                          const img = new Image();
                                          const src = `/textures/${t}.jpg`; 
                                          img.onload = () => setQrTexture({ src, image: img, name: t });
                                          img.src = src;
                                        }}
                                        className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                        style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-primary)', border: '1px solid', borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)', fontSize: '14px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}
                                      >
                                        {t}
                                      </button>
                                    );
                                  })}
                                </div>
                                {qrTexture && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                    Active: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{qrTexture.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {shapePopup === 'dots' && (
                        <div className="fade-in">
                          <DotStyleSelector value={dotStyle} onChange={setDotStyle} />
                        </div>
                      )}
                      {shapePopup === 'eyes' && (
                        <div className="fade-in">
                          <EyeStyleSelector value={eyeStyle} onChange={setEyeStyle} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                    <div className="toolbar-tabs-row fade-in">
                      {activeTab === 'color' && (
                        <>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'presets')}><Bookmark size={18} /><span>Presets</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'dots')}><Palette size={18} /><span>Dots</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'bg')}><ImageIcon size={18} /><span>BG</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'eyes')}><ScanLine size={18} /><span>Eyes</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'gradient')}><Shapes size={18} /><span>Gradient</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('color', 'texture')}><Layers size={18} /><span>Texture</span></button>
                        </>
                      )}
                      {activeTab === 'shapes' && (
                        <>
                          <button className="text-toolbar-btn" onClick={() => startEditing('shapes', 'dots')}><LayoutGrid size={18} /><span>Dots</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('shapes', 'eyes')}><Hexagon size={18} /><span>Eyes</span></button>
                        </>
                      )}
                      {activeTab === 'logo' && (
                        <>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'size')}><ChevronUp size={18} /><span>Size</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'pos')}><Maximize size={18} /><span>Position</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'stroke')}><Pencil size={18} /><span>Stroke</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'bg')}><Hexagon size={18} /><span>Background</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'rotate')}><RotateCw size={18} /><span>Rotate</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'opacity')}><Sun size={18} /><span>Opacity</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'shadow')}><Moon size={18} /><span>Shadow</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'filter')}><Filter size={18} /><span>Filters</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'texture')}><Layers size={18} /><span>Texture</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'crop')}><Crop size={18} /><span>Crop</span></button>
                        </>
                      )}
                      {activeTab === 'text' && (
                        <>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'input')}><PlusCircle size={18} /><span>Content</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'pos')}><Maximize size={18} /><span>Position</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'fonts')}><Type size={18} /><span>Fonts</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'size')}><ChevronUp size={18} /><span>Size</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'color')}><Palette size={18} /><span>Color</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'stroke')}><Pencil size={18} /><span>Stroke</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'shadow')}><Moon size={18} /><span>Shadow</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'rotate')}><RotateCw size={18} /><span>Rotate</span></button>
                          <button className="text-toolbar-btn" onClick={() => startEditing('text', 'bg')}><Hexagon size={18} /><span>Shape</span></button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

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
        <nav className="bottom-nav">
          <button 
            className={`bottom-nav-tab${activePage === 'home' ? ' active' : ''}`}
            onClick={() => navigateTo('home')}
          >
            <span className="bottom-nav-icon"><Home size={22} /></span>
          </button>
          
          <button 
            className={`bottom-nav-tab${activePage === 'saved' ? ' active' : ''}`}
            onClick={() => navigateTo('saved')}
          >
            <span className="bottom-nav-icon"><Bookmark size={22} /></span>
          </button>
          
          {/* Integrated Scan Button */}
          <div 
            onClick={() => navigateTo('scanner')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: '-30px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            <button 
              className="floating-scan-btn"
              style={{ 
                width: '64px',
                height: '64px',
                borderRadius: '32px',
                background: 'var(--accent-primary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(214, 0, 54, 0.4)',
                color: 'white',
                zIndex: 101,
                transition: 'transform 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ScanLine size={28} />
            </button>
          </div>

          <button 
            className={`bottom-nav-tab${activePage === 'history' ? ' active' : ''}`}
            onClick={() => navigateTo('history')}
          >
            <span className="bottom-nav-icon"><History size={22} /></span>
          </button>
          
          <button 
            className={`bottom-nav-tab${activePage === 'settings' ? ' active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <span className="bottom-nav-icon"><Settings size={22} /></span>
          </button>
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
        onEnterPipetteMode={() => {
          setPipetteTarget({ setter: advPicker.setter });
          setAdvPicker(prev => ({ ...prev, open: false }));
          setIsPipetteActive(true);
        }}
      />

      {isPipetteActive && (
        <div 
          className="pipette-overlay fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div style={{ 
            background: 'var(--bg-primary)', 
            padding: '16px 24px', 
            borderRadius: '20px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid var(--accent-primary)',
            pointerEvents: 'all'
          }}>
            <Pipette size={24} className="text-accent" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Pipette Active</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tap on the preview to pick a color</div>
            </div>
            <button 
              onClick={() => { setIsPipetteActive(false); setAdvPicker(prev => ({ ...prev, open: true })); }}
              style={{ marginLeft: '12px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-primary)', fontWeight: 600 }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
