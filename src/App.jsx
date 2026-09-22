import { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
  Folder,
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
  User,
  Type,
  ALargeSmall,
  Paintbrush,
  Plus,
  Maximize,
  Maximize2,
  Shapes,
  ScanLine,
  History,
  PlusCircle,
  Undo2,
  Redo2,
  Check,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Filter,
  Crop,
  Eraser,
  Sparkles,
  Wand2,
  Layers,
  AlertCircle,
  LogOut,
  Edit2,
  ChevronRight,
  Cloud,
  Lock,
  Smartphone,
  Trash2
} from 'lucide-react';
import ColorPicker from './components/ColorPicker';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import LogoPresets from './components/LogoPresets';
import { LOGO_PRESETS } from './data/logoPresets';
import QRTypeSelector from './components/QRTypeSelector';
import QRDataInput from './components/QRDataInput';
import { DotStyleSelector, EyeStyleSelector } from './components/StyleSelectors';
import { generateQRMatrix, renderQR, QR_TYPES, DOT_STYLES, EYE_STYLES, FRAME_STYLES, formatQRData, constrainToSafeZone, getQRItemTitle, getQRItemSubtitle } from './utils/qrEngine';
import { downloadPNG, downloadSVG, downloadPDF, downloadJPG } from './utils/exportUtils';
import {
  saveToHistory,
  getHistory,
  getSaved,
  saveToSaved,
  getPreferences,
  savePreferences,
  syncUserFirestoreData,
  syncUserSavedData,
  syncUserHistoryData,
  syncUserAllData,
  restoreUserSavedData,
  restoreUserHistoryData,
  restoreUserAllData,
  clearUserCloudSavedData,
  clearUserCloudHistoryData,
  clearUserCloudAllData,
  getUserCloudCounts,
  handleLogoutClear
} from './utils/storage';
import { QR_TEMPLATES, getAllTemplates, getUserTemplates, getAppTemplateById } from './utils/qrTemplates';
import QRScanner from './components/QRScanner';
import HistoryPage from './components/HistoryPage';
import HomePage from './components/HomePage';
import SavedPage from './components/SavedPage';
import SettingsPage from './components/SettingsPage';
import YouPage from './components/YouPage';
import AuthDropdownPanel from './components/AuthDropdownPanel';
import GoldenAdminBadge from './components/GoldenAdminBadge';
import { useUserRole } from './services/roleService';
import { checkIsSuperAdmin } from './services/authService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { trackUserProfile, trackAnonymousVisitor, linkVisitorToUser } from './services/adminDataService';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import BatchPage from './components/BatchPage';
import BarcodePage from './components/BarcodePage';
import AdvancedColorPicker from './components/AdvancedColorPicker';
import AppIcon from './components/AppIcon';
import SaveLocationModal from './components/SaveLocationModal';
import PremiumModal from './components/PremiumModal';
import PaidCrownBadge from './components/PaidCrownBadge';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import OnboardingFlow from './components/auth/OnboardingFlow';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import { usePremium } from './services/premiumContext';
import { FeatureAccessManager } from './services/FeatureAccessManager';
import UserAvatar from './components/UserAvatar';
import { MdOutlineQrCode2, MdQrCodeScanner } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { TemplateGallery } from './components/qr-templates/TemplateGallery';
import { TemplateCustomizer } from './components/qr-templates/TemplateCustomizer';
import { FullScreenPreviewModal } from './components/FullScreenPreviewModal';
import ImageCropShapeModal, { SHAPE_OPTIONS } from './components/ImageCropShapeModal';
import { AI_ART_STYLES } from './utils/aiArtQrEngine';
const QRDotsIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="mushi-pro-wide-dots">
    {/* Smaller Rounded Star (Preserving the shape and style) */}
    <path d="M12 4 L13 8.5 L17.5 9.5 L13 10.5 L12 15 L11 10.5 L6.5 9.5 L11 8.5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    
    {/* Much Larger Smooth Dots, set further apart (Increased spacing) */}
    <circle cx="6.5" cy="15.5" r="3" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <circle cx="17.5" cy="15.5" r="3" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
  </svg>
);
const QREyesIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="qr-eye-heavy-bold">
    {/* Main outer shape with hole cut out (evenodd fill rule) */}
    <path fillRule="evenodd" d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7zm4-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7z" clipRule="evenodd" />
    
    {/* Enlarged Central Pupil (Increased from 5x5 to 8x8) */}
    <rect x="8" y="8" width="8" height="8" rx="1.5" />
  </svg>
);
const QRStyleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mushi-qr-star-all-circles">
    {/* Top Left Eye & Pupil */}
    <rect x="3" y="3" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="6.5" cy="6.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    
    {/* Top Right Eye & Pupil */}
    <rect x="14" y="3" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="17.5" cy="6.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    
    {/* Bottom Left Eye & Pupil */}
    <rect x="3" y="14" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="6.5" cy="17.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    
    {/* The Pro Sparkle */}
    <path d="M17 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    
    {/* Two Circular Dots Below */}
    <circle cx="15" cy="20" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <circle cx="19.5" cy="20" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
  </svg>
);
const QRGradientIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="qr-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#qr-icon-grad)" />
  </svg>
);
const QRSizeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-size-expand">
    <path d="M15 3h6v6" />
    <path d="M21 3l-7 7" />
    <path d="M9 21H3v-6" />
    <path d="M3 21l7-7" />
  </svg>
);
const QRBgIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="shape-square">
    <rect x="3" y="3" width="18" height="18" rx="4" style={{ fill: 'currentColor', fillOpacity: 1 }} />
  </svg>
);
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
const LOGO_BG_SHAPES = [
  { id: 'circle', label: 'Circle Box' },
  { id: 'solid', label: 'Solid Box' },
  { id: 'rounded', label: 'Rounded Box' },
  { id: 'pill', label: 'Pill Box' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'glow', label: 'Glow Effect' },
  { id: 'hexagon', label: 'Hexagon' }
];
const QR_BG_SHAPES = [
  { id: 'full', label: 'Full Canvas' },
  { id: 'rounded', label: 'Rounded Box' },
  { id: 'squircle', label: 'Squircle Box' },
  { id: 'cut', label: 'Cut/Beveled' },
  { id: 'leaf', label: 'Leaf Shape' },
  { id: 'circle', label: 'Circle Box' },
  { id: 'shield', label: 'Shield' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'octagon', label: 'Octagon' },
  { id: 'diamond', label: 'Diamond' }
];
const QR_CARD_SHAPES = [
  { id: 'rounded', label: 'Rounded Box' },
  { id: 'squircle', label: 'Squircle Box' },
  { id: 'cut', label: 'Cut/Beveled' },
  { id: 'leaf', label: 'Leaf Shape' },
  { id: 'circle', label: 'Circle Box' }
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
const TRENDING_GRADIENT_PRESETS = GRADIENT_PRESETS.map(p => {
  let bg = '#FFFFFF';
  const nameLower = p.name.toLowerCase();
  if (nameLower.includes('midnight') || nameLower.includes('coal') || nameLower.includes('galaxy') || nameLower.includes('space') || nameLower.includes('steel') || nameLower.includes('frost')) {
    bg = '#111111';
  }
  const id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return {
    id,
    name: p.name,
    qr: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
    bg: bg
  };
});
const LOGO_BG_GRADIENT_PRESETS = [
  'linear-gradient(135deg, #FF3B30, #FF9500)',
  'linear-gradient(135deg, #007AFF, #00F0FF)',
  'linear-gradient(135deg, #AF52DE, #FF2D55)',
  'linear-gradient(135deg, #34C759, #00F0FF)',
  'linear-gradient(135deg, #7000FF, #FF007F)',
  'linear-gradient(135deg, #FFCC00, #FF9500)',
  'linear-gradient(135deg, #00C5FF, #25D366)',
  'linear-gradient(135deg, #111111, #444444)'
];
const SWATCH_PRESETS = [
  '#000000', '#FFFFFF', '#FF3B30', '#34C759',
  '#007AFF', '#FFCC00', '#AF52DE', '#FF9500',
  '#5856D6', '#FF2D55', '#00F0FF', '#7000FF',
  '#FF007F', '#00D1FF', '#FFD700', '#8E8E93'
];
const SOCIAL_TEXTURES = [
  { slug: 'facebook', name: 'Facebook', url: '/textures/facebook_texture.webp' },
  { slug: 'whatsapp', name: 'WhatsApp', url: '/textures/whatsapp_texture.webp' },
  { slug: 'instagram', name: 'Instagram', url: '/textures/instagram_texture.webp' },
  { slug: 'youtube', name: 'YouTube', url: '/textures/youtube_texture.webp' },
  { slug: 'tiktok', name: 'TikTok', url: '/textures/tiktok_texture.webp' },
  { slug: 'snapchat', name: 'Snapchat', url: '/textures/snapchat_texture.webp' },
  { slug: 'twitter', name: 'Twitter / X', url: '/textures/twitter_texture.webp' },
  { slug: 'telegram', name: 'Telegram', url: '/textures/telegram_texture.webp' },
  { slug: 'spotify', name: 'Spotify', url: '/textures/spotify_texture.webp' }
];
const renderShapeThumbnail = (shapeId, color = 'currentColor') => {
  switch (shapeId) {
    case 'circle':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <circle cx="27" cy="27" r="22" fill={color} />
        </svg>
      );
    case 'solid':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <rect x="5" y="5" width="44" height="44" fill={color} />
        </svg>
      );
    case 'rounded':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <rect x="5" y="5" width="44" height="44" rx="10" fill={color} />
        </svg>
      );
    case 'pill':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <rect x="4" y="12" width="46" height="30" rx="15" fill={color} />
        </svg>
      );
    case 'ribbon':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <path d="M5,10 L49,10 L43,27 L49,44 L5,44 L11,27 Z" fill={color} />
        </svg>
      );
    case 'glow':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <filter id="glow-thumb" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect x="8" y="8" width="38" height="38" rx="8" fill={color} filter="url(#glow-thumb)" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
          <polygon points="14,6 40,6 50,27 40,48 14,48 4,27" fill={color} />
        </svg>
      );
    default:
      return null;
  }
};
function MiniQRCanvasBg({ qrParams, shapeId, isActive }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !qrParams) return;
    // Generate a clean "Hello User" matrix for maximum shape readability
    const demoMatrixInfo = generateQRMatrix("Hello User", qrParams.errorLevel || 'H');
    if (!demoMatrixInfo) return;
    const options = {
      ...qrParams,
      ...demoMatrixInfo,
      bgTransparent: qrParams.bgTransparent,
      bgColor: qrParams.bgColor || '#ffffff',
      qrColor: qrParams.qrColor || '#000000',
      logo: null,
      textCenterEnabled: false,
      textCenter: null,
      frameStyle: 'none',
      quietZone: 1,
      size: 128,
      qrBgShape: shapeId
    };
    renderQR(canvasRef.current, options);
  }, [qrParams, shapeId, isActive]);
  return (
    <canvas 
      ref={canvasRef} 
      width="128" 
      height="128" 
      style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '8px',
        objectFit: 'contain',
        display: 'block',
        border: '1px solid var(--border-light)',
        background: qrParams.bgTransparent ? 'transparent' : 'var(--bg-primary)'
      }} 
    />
  );
}
function parseGradientString(gradStr, defaultColor1 = '#FF3B30', defaultColor2 = '#FF9500') {
  if (gradStr && gradStr.startsWith('linear-gradient(')) {
    const match = gradStr.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/i);
    if (match) {
      return {
        color1: match[2].trim(),
        color2: match[3].trim()
      };
    }
  }
  return {
    color1: gradStr || defaultColor1,
    color2: defaultColor2
  };
}
const renderColorOrGradientPicker = (label, value, onChange, handleOpenAdv) => {
  const isGradient = value && value.startsWith('linear-gradient(');
  const { color1, color2 } = parseGradientString(value);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px' }}>
          <button 
            onClick={() => onChange(color1)}
            style={{ border: 'none', background: !isGradient ? 'var(--accent-primary)' : 'transparent', color: !isGradient ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            Solid
          </button>
          <button 
            onClick={() => onChange(`linear-gradient(135deg, ${color1}, ${color2 || '#a78bfa'})`)}
            style={{ border: 'none', background: isGradient ? 'var(--accent-primary)' : 'transparent', color: isGradient ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            Gradient
          </button>
        </div>
      </div>
      {!isGradient ? (
        <div className="swatch-grid-mini">
          <ColorPicker isSwatch={true} icon={Pipette} value={value} onChange={onChange} onOpenAdvanced={handleOpenAdv} />
          {SWATCH_PRESETS.map(color => (
            <div key={color} className={`swatch-item${value === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => onChange(color)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="fade-in">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            background: 'var(--bg-secondary)', 
            padding: '16px', 
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            position: 'relative',
            justifyContent: 'space-between'
          }}>
            {/* Start Color Picker */}
            <ColorPicker isSwatch={true} icon={Pipette} value={color1} onChange={(c) => onChange(`linear-gradient(135deg, ${c}, ${color2})`)} onOpenAdvanced={handleOpenAdv} />
            {/* Photoshop style connecting track & swap button */}
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              margin: '0 8px',
              height: '40px'
            }}>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                borderRadius: '4px', 
                background: `linear-gradient(90deg, ${color1}, ${color2})`,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
              }} />
              <button 
                onClick={() => onChange(`linear-gradient(135deg, ${color2}, ${color1})`)}
                title="Swap Colors"
                className="swap-btn-premium"
                style={{ 
                  position: 'absolute', 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 3 4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="m8 21-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
              </button>
            </div>
            {/* End Color Picker */}
            <ColorPicker isSwatch={true} icon={Pipette} value={color2} onChange={(c) => onChange(`linear-gradient(135deg, ${color1}, ${c})`)} onOpenAdvanced={handleOpenAdv} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '-4px' }}>Gradient Presets</div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {GRADIENT_PRESETS.map(p => {
              const gradStr = `linear-gradient(135deg, ${p.c1}, ${p.c2})`;
              const isActive = value === gradStr;
              return (
                <button 
                  key={p.name}
                  onClick={() => onChange(gradStr)}
                  title={p.name}
                  style={{
                    flex: '0 0 auto',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: gradStr,
                    border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    boxShadow: isActive ? '0 0 8px var(--accent-primary)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '0'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
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
function parseRawQRText(text) {
  if (!text) return { type: 'text', data: { text: '' } };
  const t = text.trim();
  // 1. WiFi
  // Example: WIFI:T:WPA;S:MySSID;P:password;H:false;;
  if (/^WIFI:/i.test(t)) {
    const ssidMatch = t.match(/S:(.*?)(?:[;]|$)/i);
    const passwordMatch = t.match(/P:(.*?)(?:[;]|$)/i);
    const encryptionMatch = t.match(/T:(.*?)(?:[;]|$)/i);
    const hiddenMatch = t.match(/H:(.*?)(?:[;]|$)/i);
    return {
      type: 'wifi',
      data: {
        ssid: ssidMatch ? ssidMatch[1] : '',
        password: passwordMatch ? passwordMatch[1] : '',
        encryption: encryptionMatch ? encryptionMatch[1] : 'WPA',
        hidden: hiddenMatch ? hiddenMatch[1] === 'true' : false
      }
    };
  }
  // 2. Email
  // Example: mailto:test@example.com?subject=Hello&body=World
  if (/^mailto:/i.test(t)) {
    const email = t.substring(7).split('?')[0];
    const query = t.includes('?') ? t.split('?')[1] : '';
    let subject = '';
    let body = '';
    if (query) {
      const subjectMatch = query.match(/subject=(.*?)(?:[&]|$)/i);
      const bodyMatch = query.match(/body=(.*?)(?:[&]|$)/i);
      if (subjectMatch) subject = decodeURIComponent(subjectMatch[1]);
      if (bodyMatch) body = decodeURIComponent(bodyMatch[1]);
    }
    return {
      type: 'email',
      data: { email, subject, body }
    };
  }
  // 3. Phone
  // Example: tel:+123456789
  if (/^tel:/i.test(t)) {
    return {
      type: 'phone',
      data: { phone: t.substring(4) }
    };
  }
  // 4. SMS
  // Example: smsto:+123456789:Hello World
  if (/^smsto:/i.test(t)) {
    const parts = t.substring(6).split(':');
    const phone = parts[0] || '';
    const message = parts.slice(1).join(':') || '';
    return {
      type: 'sms',
      data: { phone, message }
    };
  }
  // 5. vCard / Contact Card
  if (/^BEGIN:VCARD/i.test(t)) {
    // Parse standard vCard fields
    const firstNameMatch = t.match(/N:(.*?);(.*?)(?:[\r\n]|$)/i);
    const fnMatch = t.match(/FN:(.*?)(?:[\r\n]|$)/i);
    const phoneMatch = t.match(/TEL.*?:(.*?)(?:[\r\n]|$)/i);
    const emailMatch = t.match(/EMAIL.*?:(.*?)(?:[\r\n]|$)/i);
    const orgMatch = t.match(/ORG:(.*?)(?:[\r\n]|$)/i);
    const titleMatch = t.match(/TITLE:(.*?)(?:[\r\n]|$)/i);
    const urlMatch = t.match(/URL.*?:(.*?)(?:[\r\n]|$)/i);
    let firstName = '';
    let lastName = '';
    if (firstNameMatch) {
      lastName = firstNameMatch[1] || '';
      firstName = firstNameMatch[2] || '';
    } else if (fnMatch) {
      const names = fnMatch[1].split(' ');
      firstName = names[0] || '';
      lastName = names.slice(1).join(' ') || '';
    }
    return {
      type: 'vcard',
      data: {
        firstName,
        lastName,
        org: orgMatch ? orgMatch[1] : '',
        title: titleMatch ? titleMatch[1] : '',
        phone: phoneMatch ? phoneMatch[1] : '',
        email: emailMatch ? emailMatch[1] : '',
        url: urlMatch ? urlMatch[1] : ''
      }
    };
  }
  // 6. Location / Geo coordinates
  // Example: geo:37.7749,-122.4194
  if (/^geo:/i.test(t)) {
    const coords = t.substring(4).split(',');
    return {
      type: 'location',
      data: {
        latitude: coords[0] || '',
        longitude: coords[1] || ''
      }
    };
  }
  // 7. WhatsApp
  // Example: https://wa.me/123456789 or https://api.whatsapp.com/send?phone=123456789
  if (/wa\.me/i.test(t) || /whatsapp\.com/i.test(t)) {
    const phoneMatch = t.match(/(?:phone=|wa\.me\/)([0-9+]+)/i);
    const textMatch = t.match(/text=(.*?)(?:[&]|$)/i);
    return {
      type: 'whatsapp',
      data: {
        phone: phoneMatch ? phoneMatch[1] : '',
        message: textMatch ? decodeURIComponent(textMatch[1]) : ''
      }
    };
  }
  // 8. Instagram
  if (/instagram\.com/i.test(t)) {
    const usernameMatch = t.match(/instagram\.com\/([^/?#\s]+)/i);
    return {
      type: 'instagram',
      data: { username: usernameMatch ? usernameMatch[1] : '' }
    };
  }
  // 9. Facebook
  if (/facebook\.com/i.test(t)) {
    const usernameMatch = t.match(/facebook\.com\/([^/?#\s]+)/i);
    return {
      type: 'facebook',
      data: { username: usernameMatch ? usernameMatch[1] : '' }
    };
  }
  // 10. Twitter/X
  if (/twitter\.com/i.test(t) || /x\.com/i.test(t)) {
    const usernameMatch = t.match(/(?:twitter\.com|x\.com)\/([^/?#\s]+)/i);
    return {
      type: 'x',
      data: { username: usernameMatch ? usernameMatch[1] : '' }
    };
  }
  // 11. LinkedIn
  if (/linkedin\.com/i.test(t)) {
    const usernameMatch = t.match(/linkedin\.com\/(?:in|company)\/([^/?#\s]+)/i);
    return {
      type: 'linkedin',
      data: { username: usernameMatch ? usernameMatch[1] : t }
    };
  }
  // 12. YouTube
  if (/youtube\.com|youtu\.be/i.test(t)) {
    return {
      type: 'youtube',
      data: { url: t }
    };
  }
  // 13. URL (falls back to URL if it looks like one)
  if (/^https?:\/\//i.test(t) || /^www\./i.test(t) || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}(\/.*)?$/i.test(t)) {
    return {
      type: 'url',
      data: { url: t.startsWith('http') ? t : 'https://' + t }
    };
  }
  // 14. Fallback to Text
  return {
    type: 'text',
    data: { text: t }
  };
}
export default function App() {
  const [isBlocked, setIsBlocked] = useState(false);
  const { showPaywall } = usePremium();
  // ── Tab & Theme ──
  const location = useLocation();
  const navigate = useNavigate();
  const getPageFromPath = (path) => {
    if (path === '/onboarding') return 'onboarding';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/generator') return 'generator';
    if (path === '/settings') return 'settings';
    if (path === '/you') return 'you';
    if (path === '/saved') return 'saved';
    if (path === '/history') return 'history';
    if (path === '/scanner') return 'scanner';
    if (path === '/batch') return 'batch';
    if (path === '/barcode') return 'barcode';
    if (path === '/scanner-gun') return 'scanner-gun';
    return 'home';
  };
  const [activeTab, setActiveTab] = useState('content');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [editProfileNameText, setEditProfileNameText] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [cloudSyncTab, setCloudSyncTab] = useState('sync'); // 'sync' | 'restore' | 'clear'
  const [cloudCounts, setCloudCounts] = useState({ cloudSavedCount: 0, cloudHistoryCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    itemTitle: null,
    confirmText: 'Delete',
    iconType: 'trash',
    isDangerous: false,
    onConfirm: null
  });

  useEffect(() => {
    if (isCloudSyncModalOpen && currentUser) {
      getUserCloudCounts().then(counts => setCloudCounts(counts));
    }
  }, [isCloudSyncModalOpen, currentUser]);
  const [newProfilePicUrl, setNewProfilePicUrl] = useState('');
  const [profileNameInput, setProfileNameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isHomeScrolled, setIsHomeScrolled] = useState(false);
  const authDropdownRef = useRef(null);
  // Close auth dropdown on outside click
  useEffect(() => {
    if (!authDropdownOpen) return;
    const handler = (e) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target)) {
        setAuthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [authDropdownOpen]);
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const res = await getRedirectResult(auth);
        if (res && res.user) {
          setCurrentUser(res.user);
        }
      } catch (err) {
        console.error('Error getting redirect result:', err);
      }
    };
    checkRedirect();
    let unsubProfile = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) unsubProfile(); // cleanup previous listener
      if (user) {
        setCurrentUser(user);

        // 1. Reload user from Google / Auth provider to get latest Gmail profile picture
        try {
          await user.reload();
          if (auth.currentUser) {
            setCurrentUser({ ...auth.currentUser });
            user = auth.currentUser;
          }
        } catch (reloadErr) {
          console.warn('[Auth] User profile reload error:', reloadErr);
        }

        try {
          const { isSuperAdmin: isSA } = await checkIsSuperAdmin(user);
          setIsSuperAdmin(isSA);
        } catch (e) {
          setIsSuperAdmin(false);
        }

        // Track user profile for admin panel visibility with fresh info
        trackUserProfile(user);
        linkVisitorToUser(user.uid);
        
        // Listen to Firestore profile updates (status, photoURL, displayName)
        unsubProfile = onSnapshot(doc(db, 'app_users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'blocked') {
              signOut(auth);
              setIsBlocked(true);
            }
            // If user has updated photo or name in Firestore, reflect it immediately
            if (data.photoURL && data.photoURL !== user.photoURL) {
              setCurrentUser(prev => prev ? { ...prev, photoURL: data.photoURL } : prev);
            }
          }
        });
      } else {
        setCurrentUser(null);
        setIsSuperAdmin(false);
      }
    });
    // Track every app open as a visitor (even if not signed in)
    trackAnonymousVisitor();
    
    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);
  // Pre-create organized folder structure on startup
  useEffect(() => {
    const createDefaultDirectories = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const targetDir = Capacitor.getPlatform() === 'android' ? Directory.ExternalStorage : Directory.Documents;
          const prefs = getPreferences() || {};
          const rootFolder = prefs.saveLocation || 'Pictures/Mushi QR Pro';
          
          const dirs = [
            `${rootFolder}/QR Codes`,
            `${rootFolder}/Barcodes`,
          ];
          
          for (const dir of dirs) {
            try {
              await Filesystem.mkdir({
                path: dir,
                directory: targetDir,
                recursive: true
              });
            } catch (err) {
              console.warn(`Failed to pre-create dir: ${dir}`, err);
            }
          }
        } catch (e) {
          console.warn('Directory pre-creation failed', e);
        }
      }
    };
    createDefaultDirectories();
  }, []);
  const [tabHistory, setTabHistory] = useState([]);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [activePage, setActivePage] = useState(() => {
    if (location.state?.activePage) return location.state.activePage;
    const pathPage = getPageFromPath(location.pathname);
    const onboardingCompleted = localStorage.getItem('mushi_onboarding_completed') === 'true';
    if (!onboardingCompleted) {
      return 'onboarding';
    }
    return pathPage;
  });
  const [previousPage, setPreviousPage] = useState('home');
  const [isFirstLaunchLogin, setIsFirstLaunchLogin] = useState(false);
  const [theme, setTheme] = useState('auto');
  const [effectiveTheme, setEffectiveTheme] = useState('dark');
  const [historyFilter, setHistoryFilter] = useState('All');
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('mushi_onboarding_completed') === 'true';
    let page = location.state?.activePage || getPageFromPath(location.pathname);
    
    // If not completed onboarding and on root or onboarding, force onboarding
    if (!onboardingCompleted && (location.pathname === '/' || location.pathname === '/onboarding')) {
      page = 'onboarding';
    }

    if (page !== activePage) {
      setActivePage(page);
      
      if (page !== 'generator') {
        setIsDataModalOpen(false);
        setAdvPicker(prev => ({ ...prev, open: false }));
        setFormatDropdownOpen(false);
        setActiveBatchItemIndex(null);
      }
    }
    if (location.state) {
      if (location.state.qrType) setQrType(location.state.qrType);
      if (location.state.qrData) setQrData(location.state.qrData);
      if (location.state.isDataModalOpen !== undefined) setIsDataModalOpen(location.state.isDataModalOpen);
      if (location.state.loadedBarcodeItem) setLoadedBarcodeItem(location.state.loadedBarcodeItem);
    }
  }, [location.pathname, location.state]);
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
    if (isTemplateTextModalOpen) {
      setIsTemplateTextModalOpen(false);
      return;
    }
    // 2. Navigation logic
    if (activePage === 'scanner') {
      // From Scan to Home or Exit if launched from widget
      if (launchedDirectlyToScanner) {
        CapApp.exitApp();
      } else {
        navigateTo('home');
      }
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
      navigateTo(previousPage || 'home');
    } else if (activePage === 'history') {
      // From History/Recent/Menu to previous tab
      navigateTo(previousPage || 'home');
    } else if (activePage !== 'home') {
      navigateTo('home');
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
  // ── Admin Settings (read from Super Admin Panel) ──────────────────────────
  const [adminSettings, setAdminSettings]   = useState(null);
  const [adminAnnouncement, setAdminAnnouncement] = useState(null);
  const [featureFlags, setFeatureFlags]     = useState(null);
  const [customTemplates, setCustomTemplates] = useState(() => getUserTemplates());
  useEffect(() => {
    // Set local storage fallback/defaults initially
    const _read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
    const settings = _read('qrgen_app_settings');
    const announce = _read('qrgen_announcement');
    const flags = _read('qrgen_feature_flags');
    const cacheTemplates = _read('qrgen_cloud_templates');
    if (settings) {
      setAdminSettings(settings);
      if (settings.appName) document.title = settings.appName;
    }
    if (announce) setAdminAnnouncement(announce);
    if (flags) setFeatureFlags(flags);
    if (cacheTemplates) setCustomTemplates(cacheTemplates);
    // Setup real-time subscribers from Firestore
    const unsubSettings = onSnapshot(doc(db, 'global_config', 'appSettings'), (snap) => {
      if (snap.exists()) {
        const val = snap.data();
        setAdminSettings(val);
        localStorage.setItem('qrgen_app_settings', JSON.stringify(val));
        if (val.appName) document.title = val.appName;
      }
    });
    const unsubAnnounce = onSnapshot(doc(db, 'global_config', 'announcement'), (snap) => {
      if (snap.exists()) {
        const val = snap.data();
        setAdminAnnouncement(val);
        localStorage.setItem('qrgen_announcement', JSON.stringify(val));
      }
    });
    const unsubFlags = onSnapshot(doc(db, 'global_config', 'featureFlags'), (snap) => {
      if (snap.exists()) {
        const val = snap.data();
        setFeatureFlags(val);
        localStorage.setItem('qrgen_feature_flags', JSON.stringify(val));
      }
    });
    const unsubTemplates = onSnapshot(collection(db, 'global_templates'), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ ...d.data(), id: d.id }));
      setCustomTemplates(list);
      localStorage.setItem('qrgen_cloud_templates', JSON.stringify(list));
    });
    const unsubFAM = FeatureAccessManager.subscribe(() => {
      // Force instant re-render across App whenever FeatureAccessManager flags update
      setFeatureFlags({ ...FeatureAccessManager.globalFlags });
    });
    return () => {
      unsubSettings();
      unsubAnnounce();
      unsubFlags();
      unsubTemplates();
      if (unsubFAM) unsubFAM();
    };
  }, []);
  // Maintenance mode flag (used in render)
  const isMaintenanceMode = !!adminSettings?.maintenanceMode;
  // ─── All templates (built-in + custom) ─────────────────────────────────────
  const ALL_TEMPLATES = [...QR_TEMPLATES, ...customTemplates];
  // ── QR Content ──
  const [qrType, setQrType] = useState(() => location.state?.qrType || QR_TYPES.URL);
  const [qrData, setQrData] = useState(() => location.state?.qrData || { url: 'https://example.com' });
  const [errorLevel, setErrorLevel] = useState('M');
  const [loadedItemId, setLoadedItemId] = useState(null);
  const [loadedBarcodeItem, setLoadedBarcodeItem] = useState(() => location.state?.loadedBarcodeItem || null);
  const [launchedDirectlyToScanner, setLaunchedDirectlyToScanner] = useState(false);
  // Tracks whether the user has meaningfully changed the QR generator since it was last reset/loaded
  const generatorIsDirtyRef = useRef(false);
  const ignoreDirtyRef = useRef(false);
  // ── Batch QR ──
  const [batchItems, setBatchItems] = useState([]);
  const [activeBatchItemIndex, setActiveBatchItemIndex] = useState(null);
  // ── Colors ──
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [eyeColor, setEyeColor] = useState('');
  const [eyeOuterColor, setEyeOuterColor] = useState('');
  const [syncEyes, setSyncEyes] = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  const [presetTab, setPresetTab] = useState('solid');
  const [eyeColorTab, setEyeColorTab] = useState('inner');
  const [syncInnerOuterEyes, setSyncInnerOuterEyes] = useState(true);
  const [isPipetteActive, setIsPipetteActive] = useState(false);
  const [pipetteTarget, setPipetteTarget] = useState(null); // { setter }
  const [hoverColor, setHoverColor] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [canvasSelection, setCanvasSelection] = useState(null); // 'logo' | 'text' | null
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateHeadlineText, setTemplateHeadlineText] = useState('');
  const [templateHandleText, setTemplateHandleText] = useState('');
  const [templateFont, setTemplateFont] = useState('Outfit');
  const [isEditingTemplateText, setIsEditingTemplateText] = useState(false);
  const [isTemplateTextModalOpen, setIsTemplateTextModalOpen] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('All');
  const [isFullScreenPreviewOpen, setIsFullScreenPreviewOpen] = useState(false);
  const [cropModalConfig, setCropModalConfig] = useState(null);
  const applyLogoBySlug = (slug) => {
    const found = LOGO_PRESETS.find(item => item.slug === slug);
    if (found) {
      const img = new Image();
      img.onload = () => {
        setLogo({
          image: img,
          width: 0.18,
          height: 0.18,
          slug: found.slug,
          name: found.name,
          color: found.color,
          url: found.url
        });
      };
      img.src = found.url;
    } else {
      setLogo(null);
    }
  };
  const applyTemplate = (tpl) => {
    if (!tpl) {
      setSelectedTemplate(null);
      setTemplateHeadlineText('');
      setTemplateHandleText('');
      return;
    }
    const templateFeatId = `qr_template_${tpl.id}`;
    const access = FeatureAccessManager.canUseFeature(templateFeatId);
    if (!access.allowed) {
      showPaywall(templateFeatId);
      return;
    }
    setSelectedTemplate(tpl);
    setTemplateHeadlineText(tpl.headline || tpl.defaultHeadline || tpl.labelText || '');
    setTemplateHandleText(tpl.subtitle || tpl.defaultHandle || tpl.handle || '');
    setQrBgImage(null);
    setQrBgImageEnabled(false);
    setQrTexture(null);
    setQrTextureEnabled(false);
    
    // Switch QR type if template specifically maps to a native type
    if (tpl.qrType && tpl.qrType !== qrType) {
      setQrType(tpl.qrType);
    }

    if (tpl.preset) {
      if (tpl.preset.qrColor) setQrColor(tpl.preset.qrColor);
      if (tpl.preset.bgColor) setBgColor(tpl.preset.bgColor);
      if (tpl.preset.dotStyle) setDotStyle(tpl.preset.dotStyle);
      if (tpl.preset.eyeStyle) setEyeStyle(tpl.preset.eyeStyle);
      if (tpl.preset.eyeColor) setEyeColor(tpl.preset.eyeColor);
      if (tpl.preset.eyeOuterColor) setEyeOuterColor(tpl.preset.eyeOuterColor);
      if (tpl.preset.logoBgColor !== undefined) {
        if (tpl.preset.logoBgColor) {
          setLogoBackground(true);
          setLogoBgColor(tpl.preset.logoBgColor);
        } else {
          setLogoBackground(false);
        }
      }
      if (tpl.preset.logoBgShape) setLogoBgShape(tpl.preset.logoBgShape);
      if (tpl.preset.logo) {
        applyLogoBySlug(tpl.preset.logo);
      } else {
        setLogo(null);
      }
    }
  };
  // ── Gradient ──
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#6c5ce7');
  const [gradientColor2, setGradientColor2] = useState('#a78bfa');
  const [gradientType, setGradientType] = useState('linear');
  
  // ── QR Texture ──
  const [qrTextureEnabled, setQrTextureEnabled] = useState(false);
  const [qrTexture, setQrTexture] = useState(null); // { src, image, name }
  const [qrTextureSyncEyes, setQrTextureSyncEyes] = useState(true);
  // ── QR Background Image ──
  const [qrBgImageEnabled, setQrBgImageEnabled] = useState(false);
  const [qrBgImage, setQrBgImage] = useState(null); // { src, image, name }
  const [qrBgImageOpacity, setQrBgImageOpacity] = useState(1.0);
  const [qrBgImageBlur, setQrBgImageBlur] = useState(0);
  const [qrBgImageOverlayOpacity, setQrBgImageOverlayOpacity] = useState(0.0);
  const [qrBgCardEnabled, setQrBgCardEnabled] = useState(false);
  const [qrBgCardOpacity, setQrBgCardOpacity] = useState(0.6);
  const [aiArtQrEnabled, setAiArtQrEnabled] = useState(false);
  const [aiArtBlend, setAiArtBlend] = useState(0.72);
  const [aiArtStyle, setAiArtStyle] = useState('illustration');
  const [qrBgShape, setQrBgShape] = useState('full'); // 'full' | 'rounded' | 'squircle' | 'cut' | 'leaf' | 'circle'
  const [qrBgCardShape, setQrBgCardShape] = useState('rounded'); // 'rounded' | 'squircle' | 'cut' | 'leaf' | 'circle'
  const [qrSizeScale, setQrSizeScale] = useState(1.0);
  const [qrPosX, setQrPosX] = useState(0.5);
  const [qrPosY, setQrPosY] = useState(0.5);
  // ── Shapes ──
  const [dotStyle, setDotStyle] = useState(DOT_STYLES.DENSO);
  const [eyeStyle, setEyeStyle] = useState(EYE_STYLES.SQUARE);
  const [dotPadding, setDotPadding] = useState(12);
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
  const [logoEraseMode, setLogoEraseMode] = useState('none'); // 'none' | 'white' | 'black' | 'custom'
  const [logoEraseTolerance, setLogoEraseTolerance] = useState(50);
  const [logoEraseSmoothing, setLogoEraseSmoothing] = useState(10);
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
  const [framePosition, setFramePosition] = useState('bottom'); // 'top' | 'bottom'
  const [frameRotation, setFrameRotation] = useState(0); // 0-360
  const [textCenterEnabled, setTextCenterEnabled] = useState(false);
  const [textPopup, setTextPopup] = useState(null);
  const [logoPopup, setLogoPopup] = useState(null);
  const [textEditMode, setTextEditMode] = useState('center');
  const [textCenterText, setTextCenterText] = useState('');
  const [textCenterSize, setTextCenterSize] = useState(0.08);
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
  const [textCenterWidth, setTextCenterWidth] = useState(null); // null means auto
  const [textCenterHeight, setTextCenterHeight] = useState(null); // null means auto
  // ── Multiple Custom Text Layers ──
  const [customTexts, setCustomTexts] = useState([]);

  const addCustomText = (initialProps = {}) => {
    generatorIsDirtyRef.current = true;
    const newId = 'txt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newText = {
      id: newId,
      text: 'Double click to edit',
      posX: 0.5,
      posY: 0.5,
      size: 0.08,
      font: 'Outfit',
      color: '#000000',
      rotation: 0,
      strokeEnabled: false,
      strokeWidth: 5,
      strokeColor: '#ffffff',
      shadowEnabled: false,
      shadowBlur: 10,
      shadowColor: 'rgba(0,0,0,0.5)',
      width: null,
      height: null,
      ...initialProps
    };
    setCustomTexts(prev => [...prev, newText]);
    setCanvasSelection('custom-text-' + newId);
    setTextEditMode('custom-' + newId);
    setActiveTab('text');
    setTextPopup('input');
    return newId;
  };

  const updateCustomText = (id, updates) => {
    generatorIsDirtyRef.current = true;
    setCustomTexts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeCustomText = (id) => {
    generatorIsDirtyRef.current = true;
    setCustomTexts(prev => prev.filter(item => item.id !== id));
    if (canvasSelection === 'custom-text-' + id) {
      setCanvasSelection(null);
      setTextEditMode('center');
    }
  };

  const selectedCustomTextId = canvasSelection && canvasSelection.startsWith('custom-text-') 
    ? canvasSelection.replace('custom-text-', '') 
    : (textEditMode.startsWith('custom-') ? textEditMode.replace('custom-', '') : null);
  const activeCustomText = customTexts.find(t => t.id === selectedCustomTextId) || null;

  const [colorPopup, setColorPopup] = useState(null);
  const [shapePopup, setShapePopup] = useState(null);
  // ── References ──
  const canvasRef = useRef(null);
  const latestThumbnailRef = useRef(null);
  const loupeCanvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const tempCanvas = useRef(document.createElement('canvas'));
  const tempCtx = useRef(tempCanvas.current.getContext('2d'));
  const [qrMatrixInfo, setQrMatrixInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [exportSuccessInfo, setExportSuccessInfo] = useState(null);

  const galleryQrOptions = useMemo(() => ({
    qrColor, bgColor, bgTransparent, dotStyle, eyeStyle,
    eyeColor, eyeOuterColor, syncEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType,
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    qrBgShape, qrSizeScale, qrPosX, qrPosY,
    logo: logo?.image, logoWidth, logoHeight, logoPadding,
    logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity
  }), [
    qrColor, bgColor, bgTransparent, dotStyle, eyeStyle,
    eyeColor, eyeOuterColor, syncEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType,
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    qrBgShape, qrSizeScale, qrPosX, qrPosY,
    logo?.image, logoWidth, logoHeight, logoPadding,
    logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity
  ]);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  // ── Advanced Picker State ──
  const [advPicker, setAdvPicker] = useState({ open: false, color: '#000000', setter: null });
  const handleOpenAdv = (color, setter) => setAdvPicker({ open: true, color, setter });
  const [selectedFormat, setSelectedFormat] = useState('PNG');
  const [exportQuality, setExportQuality] = useState('Medium'); // Default to Medium (1024px)
  const [isDataModalOpen, setIsDataModalOpen] = useState(() => location.state?.isDataModalOpen || false);
  const [unsavedChangesModal, setUnsavedChangesModal] = useState({ isOpen: false, nextPage: null });
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
  useEffect(() => {
    if (qrBgImage || qrTexture) {
      setSelectedTemplate(null);
    }
  }, [qrBgImage, qrTexture]);
  const startEditing = (type, val) => {
    if (!preEditSnapshot.current) {
      preEditSnapshot.current = getSnapshot();
    }
    if (type === 'logo') {
      setLogoPopup(val);
      setCanvasSelection('logo');
    } else if (type === 'text') {
      setTextPopup(val);
      if (canvasSelection !== 'text' && canvasSelection !== 'frame-text') {
        setCanvasSelection('text');
        setTextEditMode('center');
      }
    } else if (type === 'color') {
      setColorPopup(val);
      setCanvasSelection(null);
    } else if (type === 'shapes') {
      setShapePopup(val);
      setCanvasSelection(null);
    }
  };
  const cancelEditing = () => {
    if (preEditSnapshot.current) {
      applySnapshot(preEditSnapshot.current);
    }
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapePopup(null);
    setCanvasSelection(null);
    preEditSnapshot.current = null;
  };
  const applyEditing = () => {
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapePopup(null);
    setCanvasSelection(null);
    preEditSnapshot.current = null;
    saveSnapshot(); // Save the final result to history
  };
  const handleTabChange = (tabId) => {
    const tabObj = ALL_TABS.find(t => t.id === tabId);
    if (tabObj && tabObj.featId) {
      const access = FeatureAccessManager.canUseFeature(tabObj.featId);
      if (!access.allowed) {
        showPaywall(tabObj.featId);
        return;
      }
    }
    if (tabId !== activeTab) {
      if (logoPopup || textPopup || colorPopup || shapePopup) {
        applyEditing();
      }
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(tabId);
      // Manage canvas selections for interactive outlines/handles
      if (tabId === 'text') {
        if (canvasSelection !== 'text' && canvasSelection !== 'frame-text') {
          setCanvasSelection('text');
          setTextEditMode('center');
        }
      } else if (tabId === 'logo') {
        setCanvasSelection('logo');
      } else {
        setCanvasSelection(null);
      }
    }
  };
  const [batchPageDefaultType, setBatchPageDefaultType] = useState('QR');
  // Custom navigation wrapper to track history
  const navigateTo = (page, type = 'QR') => {
    if (page === 'batch') {
      setBatchPageDefaultType(type);
    }
    if (page === 'history') {
      setHistoryFilter(type === 'Scanned' ? 'Scanned' : type === 'Created' ? 'Created' : 'All');
    }
    if (page !== activePage) {
      if (activePage === 'generator' && generatorIsDirtyRef.current) {
        setUnsavedChangesModal({ isOpen: true, nextPage: page });
        return;
      }
      performNavigation(page);
    }
  };
  const performNavigation = (page) => {
    if (page !== 'scanner') {
      setLaunchedDirectlyToScanner(false);
    }
    if (logoPopup || textPopup || colorPopup || shapePopup) {
      applyEditing();
    }
    setCanvasSelection(null);
    setPreviousPage(activePage);
    if (page !== 'generator') {
      setIsDataModalOpen(false);
      setAdvPicker(prev => ({ ...prev, open: false }));
      setFormatDropdownOpen(false);
      setActiveBatchItemIndex(null);
    }
    let path = '/';
    if (page === 'onboarding') path = '/onboarding';
    else if (page === 'login') path = '/login';
    else if (page === 'signup') path = '/signup';
    else if (page === 'forgot-password') path = '/forgot-password';
    else if (page === 'generator') path = '/generator';
    else if (page === 'settings') path = '/settings';
    else if (page === 'you') path = '/you';
    else if (page === 'saved') path = '/saved';
    else if (page === 'history') path = '/history';
    else if (page === 'scanner') path = '/scanner';
    else if (page === 'batch') path = '/batch';
    else if (page === 'barcode') path = '/barcode';
    else if (page === 'scanner-gun') path = '/scanner-gun';
    if (location.pathname !== path) {
      navigate(path);
    }
    setActivePage(page);
    // Clear tab history when starting a new session or returning home
    if (page === 'generator' || page === 'home') {
      setTabHistory([]);
      if (page === 'generator') {
        setActiveTab('content');
        setCanvasSelection(null);
      }
    }
  };
  // ── Native App Actions / Deep Links (from Widget or quick settings tile) ──
  useEffect(() => {
    // 1. Check cold boot action via Android Javascript Interface or stored initial action
    try {
      let action = window.INITIAL_ACTION;
      if (!action && window.NativeAndroidApp && typeof window.NativeAndroidApp.getPendingAction === 'function') {
        action = window.NativeAndroidApp.getPendingAction();
      }
      if (action === 'scan') {
        setLaunchedDirectlyToScanner(true);
        navigateTo('scanner');
      }
    } catch (e) {
      console.warn('Native JS interface check failed:', e);
    }
    // 2. Listen for hot start action event dispatched from MainActivity
    const handleAppAction = (e) => {
      if (e.detail === 'scan') {
        setLaunchedDirectlyToScanner(true);
        navigateTo('scanner');
      }
    };
    window.addEventListener('appAction', handleAppAction);
    return () => window.removeEventListener('appAction', handleAppAction);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const getSnapshot = useCallback(() => {
    return {
      qrType, qrData, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes, syncInnerOuterEyes,
      gradientEnabled, gradientColor1, gradientColor2, gradientType,
      qrTextureEnabled, qrTexture: qrTexture ? { src: qrTexture.src, name: qrTexture.name } : null,
      qrTextureSyncEyes,
      qrBgImageEnabled, qrBgImage: qrBgImage ? { src: qrBgImage.src, name: qrBgImage.name } : null,
      qrBgImageOpacity, qrBgImageBlur, qrBgImageOverlayOpacity,
      qrBgCardEnabled, qrBgCardOpacity, qrBgShape, qrBgCardShape,
      aiArtQrEnabled, aiArtBlend, aiArtStyle,
      qrSizeScale, qrPosX, qrPosY,
      dotStyle, eyeStyle, dotPadding, eyePadding,
      logo: logo ? { src: logo.src, name: logo.name, shape: logo.shape } : null,
      logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
      logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity, logoPosX, logoPosY,
      logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
      logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop, logoAspectRatioLocked,
      frameStyle, frameText, frameColor, frameFont, frameSize,
      frameStrokeEnabled, frameStrokeWidth, frameStrokeColor,
      frameShadowEnabled, frameShadowBlur, frameShadowColor,
      framePosition, frameRotation,
      textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
      textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
      textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
      textCenterPosX, textCenterPosY, textCenterRotation,
      textCenterWidth, textCenterHeight,
      customTexts,
      selectedTemplateId: selectedTemplate?.id || null,
      selectedTemplate: selectedTemplate ? { id: selectedTemplate.id, name: selectedTemplate.name } : null,
      templateHeadlineText,
      templateHandleText,
      templateFont,
      errorLevel
    };
  }, [
    qrType, qrData, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes, syncInnerOuterEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType,
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    qrBgImageEnabled, qrBgImage, qrBgImageOpacity, qrBgImageBlur, qrBgImageOverlayOpacity,
    qrBgCardEnabled, qrBgCardOpacity, qrBgShape, qrBgCardShape,
    aiArtQrEnabled, aiArtBlend, aiArtStyle,
    qrSizeScale, qrPosX, qrPosY,
    dotStyle, eyeStyle, dotPadding, eyePadding,
    logo, logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity, logoPosX, logoPosY,
    logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
    logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop, logoAspectRatioLocked,
    frameStyle, frameText, frameColor, frameFont, frameSize,
    frameStrokeEnabled, frameStrokeWidth, frameStrokeColor,
    frameShadowEnabled, frameShadowBlur, frameShadowColor,
    framePosition, frameRotation,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY, textCenterRotation, textCenterWidth, textCenterHeight,
    customTexts,
    selectedTemplate, templateHeadlineText, templateHandleText, templateFont,
    errorLevel
  ]);

  const saveSnapshot = useCallback(() => {
    if (isInternalUpdate.current) return;
    if (!ignoreDirtyRef.current) {
      generatorIsDirtyRef.current = true;
    }
    const current = getSnapshot();
    const currStr = JSON.stringify(current);
    
    // Avoid saving duplicate snapshot
    const prevIdx = historyIndexRef.current;
    if (prevIdx >= 0 && historyRef.current[prevIdx]) {
      if (JSON.stringify(historyRef.current[prevIdx]) === currStr) return;
    }

    const newHistory = historyRef.current.slice(0, prevIdx + 1);
    newHistory.push(current);
    if (newHistory.length > 50) newHistory.shift();

    const newIndex = newHistory.length - 1;
    historyRef.current = newHistory;
    historyIndexRef.current = newIndex;
    setHistory(newHistory);
    setHistoryIndex(newIndex);
  }, [getSnapshot]);

  const undo = useCallback(() => {
    const currIdx = historyIndexRef.current;
    if (currIdx <= 0) return;
    const prevIndex = currIdx - 1;
    const snapshot = historyRef.current[prevIndex];
    if (!snapshot) return;

    isInternalUpdate.current = true;
    applySnapshot(snapshot);
    historyIndexRef.current = prevIndex;
    setHistoryIndex(prevIndex);
    setTimeout(() => { isInternalUpdate.current = false; }, 200);
  }, []);

  const redo = useCallback(() => {
    const currIdx = historyIndexRef.current;
    if (currIdx >= historyRef.current.length - 1) return;
    const nextIndex = currIdx + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;

    isInternalUpdate.current = true;
    applySnapshot(snapshot);
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setTimeout(() => { isInternalUpdate.current = false; }, 200);
  }, []);

  const applySnapshot = (s) => {
    isInternalUpdate.current = true;
    if (s.qrType !== undefined) setQrType(s.qrType);
    if (s.qrData !== undefined) setQrData(s.qrData);
    if (s.qrColor !== undefined) setQrColor(s.qrColor);
    if (s.bgColor !== undefined) setBgColor(s.bgColor);
    if (s.bgTransparent !== undefined) setBgTransparent(s.bgTransparent);
    if (s.eyeColor !== undefined) setEyeColor(s.eyeColor);
    if (s.eyeOuterColor !== undefined) setEyeOuterColor(s.eyeOuterColor);
    if (s.syncEyes !== undefined) setSyncEyes(s.syncEyes);
    if (s.syncInnerOuterEyes !== undefined) setSyncInnerOuterEyes(s.syncInnerOuterEyes);

    // Gradients
    if (s.gradientEnabled !== undefined) setGradientEnabled(s.gradientEnabled);
    if (s.gradientColor1 !== undefined) setGradientColor1(s.gradientColor1);
    if (s.gradientColor2 !== undefined) setGradientColor2(s.gradientColor2);
    if (s.gradientType !== undefined) setGradientType(s.gradientType);

    // Textures
    if (s.qrTextureEnabled !== undefined) setQrTextureEnabled(s.qrTextureEnabled);
    if (s.qrTextureSyncEyes !== undefined) setQrTextureSyncEyes(s.qrTextureSyncEyes);
    if (s.qrTexture && s.qrTexture.src) {
      const img = new Image();
      img.onload = () => setQrTexture({ ...s.qrTexture, image: img });
      img.src = s.qrTexture.src;
    } else if (s.qrTexture === null) {
      setQrTexture(null);
    }

    // Background Image & Studio
    if (s.qrBgImageEnabled !== undefined) setQrBgImageEnabled(s.qrBgImageEnabled);
    if (s.qrBgImage && s.qrBgImage.src) {
      const img = new Image();
      img.onload = () => setQrBgImage({ ...s.qrBgImage, image: img });
      img.src = s.qrBgImage.src;
    } else if (s.qrBgImage === null) {
      setQrBgImage(null);
    }
    if (s.qrBgImageOpacity !== undefined) setQrBgImageOpacity(s.qrBgImageOpacity);
    if (s.qrBgImageBlur !== undefined) setQrBgImageBlur(s.qrBgImageBlur);
    if (s.qrBgImageOverlayOpacity !== undefined) setQrBgImageOverlayOpacity(s.qrBgImageOverlayOpacity);
    if (s.qrBgCardEnabled !== undefined) setQrBgCardEnabled(s.qrBgCardEnabled);
    if (s.qrBgCardOpacity !== undefined) setQrBgCardOpacity(s.qrBgCardOpacity);
    if (s.qrBgShape !== undefined) setQrBgShape(s.qrBgShape);
    if (s.qrBgCardShape !== undefined) setQrBgCardShape(s.qrBgCardShape);
    if (s.aiArtQrEnabled !== undefined) setAiArtQrEnabled(s.aiArtQrEnabled);
    if (s.aiArtBlend !== undefined) setAiArtBlend(s.aiArtBlend);
    if (s.aiArtStyle !== undefined) setAiArtStyle(s.aiArtStyle);
    if (s.qrSizeScale !== undefined) setQrSizeScale(s.qrSizeScale);
    if (s.qrPosX !== undefined) setQrPosX(s.qrPosX);
    if (s.qrPosY !== undefined) setQrPosY(s.qrPosY);

    // Shapes & Eyes
    if (s.dotStyle !== undefined) setDotStyle(s.dotStyle);
    if (s.eyeStyle !== undefined) setEyeStyle(s.eyeStyle);
    if (s.dotPadding !== undefined) setDotPadding(s.dotPadding);
    if (s.eyePadding !== undefined) setEyePadding(s.eyePadding);
    
    // Logo
    const logoData = s.logo || (s.logoSrc ? { src: s.logoSrc, name: s.logoName } : null);
    if (logoData && logoData.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setLogo({ src: logoData.src, name: logoData.name || 'Logo', shape: logoData.shape || 'rounded', image: img });
      img.src = logoData.src;
    } else if (s.logo === null) {
      setLogo(null);
    }
    if (s.logoWidth !== undefined) setLogoWidth(s.logoWidth);
    if (s.logoHeight !== undefined) setLogoHeight(s.logoHeight);
    if (s.logoAspectRatioLocked !== undefined) setLogoAspectRatioLocked(s.logoAspectRatioLocked);
    if (s.logoPadding !== undefined) setLogoPadding(s.logoPadding);
    if (s.logoBackground !== undefined) setLogoBackground(s.logoBackground);
    if (s.logoBgColor !== undefined) setLogoBgColor(s.logoBgColor);
    if (s.logoBgShape !== undefined) setLogoBgShape(s.logoBgShape);
    if (s.logoCrop !== undefined) setLogoCrop(s.logoCrop);
    if (s.logoOutline !== undefined) setLogoOutline(s.logoOutline);
    if (s.logoOutlineColor !== undefined) setLogoOutlineColor(s.logoOutlineColor);
    if (s.logoOutlineWidth !== undefined) setLogoOutlineWidth(s.logoOutlineWidth);
    if (s.logoOutlineOpacity !== undefined) setLogoOutlineOpacity(s.logoOutlineOpacity);
    if (s.logoPosX !== undefined) setLogoPosX(s.logoPosX);
    if (s.logoPosY !== undefined) setLogoPosY(s.logoPosY);
    if (s.logoOpacity !== undefined) setLogoOpacity(s.logoOpacity);
    if (s.logoRotation !== undefined) setLogoRotation(s.logoRotation);
    if (s.logoShadowEnabled !== undefined) setLogoShadowEnabled(s.logoShadowEnabled);
    if (s.logoShadowColor !== undefined) setLogoShadowColor(s.logoShadowColor);
    if (s.logoShadowBlur !== undefined) setLogoShadowBlur(s.logoShadowBlur);
    if (s.logoShadowOffsetX !== undefined) setLogoShadowOffsetX(s.logoShadowOffsetX);
    if (s.logoShadowOffsetY !== undefined) setLogoShadowOffsetY(s.logoShadowOffsetY);
    if (s.logoInnerShadowEnabled !== undefined) setLogoInnerShadowEnabled(s.logoInnerShadowEnabled);
    if (s.logoTexture !== undefined) setLogoTexture(s.logoTexture);

    if (s.logoEraseColorEnabled !== undefined) {
      setLogoEraseColorEnabled(s.logoEraseColorEnabled);
      if (!s.logoEraseColorEnabled) {
        setLogoEraseMode('none');
      }
    }
    if (s.logoEraseColor !== undefined) {
      setLogoEraseColor(s.logoEraseColor);
      if (s.logoEraseColorEnabled) {
        const c = s.logoEraseColor.toLowerCase();
        if (c === '#ffffff') setLogoEraseMode('white');
        else if (c === '#000000') setLogoEraseMode('black');
        else setLogoEraseMode('custom');
      }
    }
    if (s.logoEraseTolerance !== undefined) setLogoEraseTolerance(s.logoEraseTolerance);
    if (s.logoEraseSmoothing !== undefined) setLogoEraseSmoothing(s.logoEraseSmoothing);

    // Frame
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
    if (s.framePosition !== undefined) setFramePosition(s.framePosition);
    if (s.frameRotation !== undefined) setFrameRotation(s.frameRotation);

    // Center Text
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
    if (s.textCenterWidth !== undefined) setTextCenterWidth(s.textCenterWidth);
    if (s.textCenterHeight !== undefined) setTextCenterHeight(s.textCenterHeight);

    // Template & Headline / Handle
    if (s.selectedTemplateId !== undefined || s.selectedTemplate !== undefined) {
      const tplId = s.selectedTemplateId !== undefined 
        ? s.selectedTemplateId 
        : (s.selectedTemplate?.id || (typeof s.selectedTemplate === 'string' ? s.selectedTemplate : null));
      if (tplId) {
        const fullTpl = getAppTemplateById(tplId);
        setSelectedTemplate(fullTpl);
      } else {
        setSelectedTemplate(null);
      }
    }
    if (s.customTexts !== undefined) setCustomTexts(s.customTexts || []);
    if (s.templateHeadlineText !== undefined) setTemplateHeadlineText(s.templateHeadlineText);
    if (s.templateHandleText !== undefined) setTemplateHandleText(s.templateHandleText);
    if (s.templateFont !== undefined) setTemplateFont(s.templateFont);
    if (s.errorLevel !== undefined) setErrorLevel(s.errorLevel);
    
    setTimeout(() => { isInternalUpdate.current = false; }, 100);
  };

  const resetGenerator = useCallback(() => {
    isInternalUpdate.current = true;
    ignoreDirtyRef.current = true;
    generatorIsDirtyRef.current = false;
    setLoadedItemId(null);
    
    // Content
    setQrType(QR_TYPES.URL);
    setQrData({ url: 'https://example.com' });
    setErrorLevel('M');
    
    // Colors & Appearance
    setQrColor('#000000');
    setBgColor('#ffffff');
    setBgTransparent(false);
    setSyncEyes(true);
    setSyncInnerOuterEyes(true);
    setEyeColor('');
    setEyeOuterColor('');
    setActivePreset(null);
    
    // Gradient
    setGradientEnabled(false);
    setGradientColor1('#6c5ce7');
    setGradientColor2('#a78bfa');
    setGradientType('linear');
    
    // Textures
    setQrTexture(null);
    setQrTextureEnabled(false);
    setQrTextureSyncEyes(true);
    
    // Background Image & AI Art QR
    setQrBgImage(null);
    setQrBgImageEnabled(false);
    setQrBgImageOpacity(1);
    setQrBgImageBlur(0);
    setQrBgImageOverlayOpacity(0);
    setQrBgCardEnabled(false);
    setQrBgCardOpacity(1);
    setQrBgShape('full');
    setQrBgCardShape('rounded');
    setAiArtQrEnabled(false);
    setAiArtBlend(0.85);
    setAiArtStyle('illustration');
    setQrSizeScale(1);
    setQrPosX(0.5);
    setQrPosY(0.5);
    
    // Shapes
    setDotStyle(DOT_STYLES.DENSO);
    setEyeStyle(EYE_STYLES.SQUARE);
    setDotPadding(0);
    setEyePadding(0);
    
    // Logo
    setLogo(null);
    setLogoWidth(0.18);
    setLogoHeight(0.18);
    setLogoAspectRatioLocked(true);
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
    setLogoOpacity(1);
    setLogoRotation(0);
    setLogoShadowEnabled(false);
    setLogoShadowColor('#000000');
    setLogoShadowBlur(10);
    setLogoShadowOffsetX(0);
    setLogoShadowOffsetY(4);
    setLogoInnerShadowEnabled(false);
    setLogoEraseColorEnabled(false);
    setLogoEraseMode('none');
    setLogoTexture('none');
    setLogoCrop('none');
    
    // Frame
    setFrameStyle('none');
    setFrameText('SCAN ME');
    setFrameColor('');
    setFrameFont('Outfit');
    setFrameSize(1);
    setFrameStrokeEnabled(false);
    setFrameShadowEnabled(false);
    setFramePosition('bottom');
    setFrameRotation(0);
    
    // Center Text
    setTextCenterEnabled(false);
    setTextCenterText('SCAN ME');
    setTextCenterSize(0.08);
    setTextCenterColor('#000000');
    setTextCenterFont('Outfit');
    setTextCenterStrokeEnabled(false);
    setTextCenterShadowEnabled(false);
    setTextCenterPosX(0.5);
    setTextCenterPosY(0.5);
    setTextCenterRotation(0);
    setTextCenterWidth(null);
    setTextCenterHeight(null);
    
    // Template & Custom Texts
    setSelectedTemplate(null);
    setTemplateHeadlineText('');
    setTemplateHandleText('');
    setTemplateFont('Outfit');
    setCustomTexts([]);
    
    // Popups & Active Tabs
    setLogoPopup(null);
    setTextPopup(null);
    setColorPopup(null);
    setShapePopup(null);
    setCanvasSelection(null);
    setActiveTab('content');
    setTabHistory([]);
    
    // Clear history stack and re-seed with fresh baseline
    const freshSnapshot = {
      qrData: { url: 'https://example.com' },
      qrColor: '#000000',
      bgColor: '#ffffff',
      bgTransparent: false,
      eyeColor: '',
      eyeOuterColor: '',
      syncEyes: true,
      syncInnerOuterEyes: true,
      gradientEnabled: false,
      gradientColor1: '#6c5ce7',
      gradientColor2: '#a78bfa',
      gradientType: 'linear',
      qrTextureEnabled: false,
      qrTexture: null,
      qrTextureSyncEyes: true,
      qrBgImageEnabled: false,
      qrBgImage: null,
      qrBgImageOpacity: 1,
      qrBgImageBlur: 0,
      qrBgImageOverlayOpacity: 0,
      qrBgCardEnabled: false,
      qrBgCardOpacity: 1,
      qrBgShape: 'full',
      qrBgCardShape: 'rounded',
      aiArtQrEnabled: false,
      aiArtBlend: 0.85,
      aiArtStyle: 'illustration',
      qrSizeScale: 1,
      qrPosX: 0.5,
      qrPosY: 0.5,
      dotStyle: DOT_STYLES.DENSO,
      eyeStyle: EYE_STYLES.SQUARE,
      dotPadding: 0,
      eyePadding: 0,
      logo: null,
      logoWidth: 0.18,
      logoHeight: 0.18,
      logoAspectRatioLocked: true,
      logoPadding: 10,
      logoBackground: false,
      logoBgColor: '#ffffff',
      logoBgShape: 'circle',
      logoOutline: false,
      logoOutlineColor: '#ffffff',
      logoOutlineWidth: 3,
      logoOutlineOpacity: 1,
      logoPosX: 0.5,
      logoPosY: 0.5,
      logoOpacity: 1,
      logoRotation: 0,
      logoShadowEnabled: false,
      logoInnerShadowEnabled: false,
      logoEraseColorEnabled: false,
      logoTexture: 'none',
      logoCrop: 'none',
      frameStyle: 'none',
      frameText: 'SCAN ME',
      frameColor: '',
      frameFont: 'Outfit',
      frameSize: 1,
      frameStrokeEnabled: false,
      frameShadowEnabled: false,
      framePosition: 'bottom',
      frameRotation: 0,
      textCenterEnabled: false,
      textCenterText: 'SCAN ME',
      textCenterSize: 0.08,
      textCenterColor: '#000000',
      textCenterFont: 'Outfit',
      textCenterStrokeEnabled: false,
      textCenterShadowEnabled: false,
      textCenterPosX: 0.5,
      textCenterPosY: 0.5,
      textCenterRotation: 0,
      textCenterWidth: null,
      textCenterHeight: null,
      customTexts: [],
      selectedTemplateId: null,
      selectedTemplate: null,
      templateHeadlineText: '',
      templateHandleText: '',
      templateFont: 'Outfit',
      errorLevel: 'M'
    };
    historyRef.current = [freshSnapshot];
    historyIndexRef.current = 0;
    setHistory([freshSnapshot]);
    setHistoryIndex(0);
    
    setTimeout(() => {
      isInternalUpdate.current = false;
      ignoreDirtyRef.current = false;
      generatorIsDirtyRef.current = false;
    }, 200);
  }, []);

  // Initial snapshot on mount
  useEffect(() => {
    if (historyRef.current.length === 0) {
      const initial = getSnapshot();
      historyRef.current = [initial];
      historyIndexRef.current = 0;
      setHistory([initial]);
      setHistoryIndex(0);
    }
  }, []);

  // Debounced auto-save for all parameter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSnapshot();
    }, 600);
    return () => clearTimeout(timer);
  }, [
    qrData, qrColor, bgColor, bgTransparent, eyeColor, eyeOuterColor, syncEyes, syncInnerOuterEyes,
    gradientEnabled, gradientColor1, gradientColor2, gradientType,
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    qrBgImageEnabled, qrBgImage, qrBgImageOpacity, qrBgImageBlur, qrBgImageOverlayOpacity,
    qrBgCardEnabled, qrBgCardOpacity, qrBgShape, qrBgCardShape,
    aiArtQrEnabled, aiArtBlend, aiArtStyle,
    qrSizeScale, qrPosX, qrPosY,
    dotStyle, eyeStyle, dotPadding, eyePadding,
    logo, logoWidth, logoHeight, logoPadding, logoBackground, logoBgColor, logoBgShape,
    logoOutline, logoOutlineColor, logoOutlineWidth, logoOutlineOpacity, logoPosX, logoPosY,
    logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
    logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop, logoAspectRatioLocked,
    frameStyle, frameText, frameColor, frameFont, frameSize,
    frameStrokeEnabled, frameStrokeWidth, frameStrokeColor,
    frameShadowEnabled, frameShadowBlur, frameShadowColor,
    framePosition, frameRotation,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY, textCenterRotation, textCenterWidth, textCenterHeight,
    selectedTemplate, templateHandleText,
    errorLevel
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
      // 1. Native Capacitor StatusBar
      try {
        await StatusBar.show();
        // Set overlaysWebView to TRUE and add padding in CSS for the 24dp status bar
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Initial state at the top of Home (over the #F01A4E red hero banner): White text/icons
        if (activePage === 'home' && !isHomeScrolled) {
          await StatusBar.setStyle({ style: 'DARK' }); // White icons on red hero banner
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        } else {
          // When scrolled down or navigating to other pages: transition according to active theme
          if (effectiveTheme === 'dark') {
            await StatusBar.setStyle({ style: 'DARK' }); // Light/white text & icons for dark theme
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          } else {
            await StatusBar.setStyle({ style: 'LIGHT' }); // Dark text & icons for light theme
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          }
        }
      } catch (e) {
        // Fallback on web/PWA
      }

      // 2. PWA Browser Top Bar & Safe Area Theme-Color Synchronization
      try {
        let targetColor = '#F01A4E';
        if (activePage === 'home' && !isHomeScrolled) {
          targetColor = '#F01A4E';
        } else {
          targetColor = effectiveTheme === 'light' ? '#FFFFFF' : '#0B0F19';
        }

        let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.setAttribute('name', 'theme-color');
          document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', targetColor);

        const mediaThemeColors = document.querySelectorAll('meta[name="theme-color"][media]');
        mediaThemeColors.forEach(tag => tag.setAttribute('content', targetColor));
      } catch (pwaErr) {
        console.warn('PWA theme-color synchronization failed:', pwaErr);
      }
    };
    updateStatusBar();
  }, [effectiveTheme, activePage, isHomeScrolled]);
  // ── Sync Eyes color with dots color when syncEyes is ON ──
  useEffect(() => {
    if (syncEyes) {
      setEyeColor(qrColor);
      setEyeOuterColor(qrColor);
    }
  }, [syncEyes, qrColor]);
  // ── Auto Theme Logic ──
  useEffect(() => {
    const applyTheme = () => {
      const prefs = getPreferences();
      if (prefs.theme) {
        setTheme(prefs.theme);
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemDark ? 'dark' : 'light');
      }
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const currentPrefs = getPreferences();
      if (!currentPrefs.theme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('preferences-sync', applyTheme);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('preferences-sync', applyTheme);
    };
  }, []);
  // ── Helper: build a human-readable display name from qrType + qrData ──
  const getQRDisplayName = (type, data) => {
    const subtitle = getQRItemSubtitle({ qrType: type, qrData: data });
    const title = getQRItemTitle({ qrType: type, qrData: data });
    return subtitle || title || 'QR Code';
  };
  // ── Unsaved Changes Modal Actions ──
  const handleSaveAndExit = () => {
    const dataString = formatQRData(qrType, qrData);
    if (dataString) {
      const displayText = getQRDisplayName(qrType, qrData);
      
      if (loadedItemId && loadedItemId.startsWith('saved_')) {
        saveToSaved({
          id: loadedItemId,
          source: 'create',
          qrType, qrData, displayText: displayText.substring(0, 80), errorLevel,
          ...getSnapshot(),
          thumbnail: latestThumbnailRef.current || canvasRef.current?.toDataURL('image/jpeg', 0.8) || null
        });
      } else {
        const savedEntry = saveToHistory({
          id: loadedItemId,
          source: 'create',
          qrType, qrData, displayText: displayText.substring(0, 80), errorLevel,
          ...getSnapshot(),
          thumbnail: latestThumbnailRef.current || canvasRef.current?.toDataURL('image/jpeg', 0.8) || null
        });
        if (savedEntry && savedEntry.id) {
          setLoadedItemId(savedEntry.id);
        }
      }
    }
    const nextPage = unsavedChangesModal.nextPage;
    setUnsavedChangesModal({ isOpen: false, nextPage: null });
    resetGenerator();
    performNavigation(nextPage);
  };
  const handleDiscardAndExit = () => {
    const nextPage = unsavedChangesModal.nextPage;
    setUnsavedChangesModal({ isOpen: false, nextPage: null });
    resetGenerator();
    performNavigation(nextPage);
  };
  const handleCancelExit = () => {
    setUnsavedChangesModal({ isOpen: false, nextPage: null });
  };
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
    if (isFullScreenPreviewOpen) {
      setIsFullScreenPreviewOpen(false);
      return;
    }
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
        if (Capacitor.isNativePlatform()) {
          try { await Filesystem.requestPermissions(); } catch {}
          const base64Data = canvasRef.current.toDataURL('image/png').split(',')[1];
          const filename = `qrcode_${Date.now()}.png`;
          const savedFile = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache
          });
          await Share.share({
            title: 'Mushi Qr Pro',
            url: savedFile.uri,
            dialogTitle: 'Share your QR Code'
          });
          showToast('Shared successfully!');
        } else {
          const file = new File([blob], 'qrcode.png', { type: 'image/png' });
          await navigator.share({ files: [file], title: 'My QR Code' });
          showToast('Shared successfully!');
        }
      } catch (err) {
        if (err.name !== 'AbortError') showToast('Share failed', 'error');
      }
    });
  };
  // ── Download ──
  const FORMAT_MAP = { PNG: downloadPNG, SVG: downloadSVG, PDF: downloadPDF, JPG: downloadJPG };
  const QUALITY_SIZES = {
    'Low': 512,
    'Medium': 1024,
    'High': 2048,
    'Ultra': 4096
  };
  const generateExportCanvas = (exportSize) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportSize;
    tempCanvas.height = exportSize;
    
    // Extract vCard fields for export
    const isVCardTpl = selectedTemplate?.styleFamily === 'vcard';
    const vcardExportFields = isVCardTpl ? {
      vcardName:     [qrData?.firstName, qrData?.lastName].filter(Boolean).join(' ') || qrData?.name || '',
      vcardJobTitle: [qrData?.title, qrData?.org].filter(Boolean).join(', ')           || qrData?.jobTitle || '',
      vcardPhone:    qrData?.phone   || '',
      vcardEmail:    qrData?.email   || '',
      vcardAddress:  qrData?.address || '',
      vcardUrl:      qrData?.url     || '',
    } : {};

    renderQR(tempCanvas, {
      ...qrMatrixInfo, 
      size: exportSize,
      template: selectedTemplate,
      templateHeadline: templateHeadlineText !== undefined ? templateHeadlineText : (selectedTemplate?.headline || selectedTemplate?.defaultHeadline || selectedTemplate?.labelText || ''),
      templateHandleText: templateHandleText !== undefined ? templateHandleText : (selectedTemplate?.subtitle || selectedTemplate?.defaultHandle || selectedTemplate?.handle || ''),
      templateFont,
      ...vcardExportFields,
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
      backgroundImageEnabled: qrBgImageEnabled,
      backgroundImage: qrBgImage?.image,
      backgroundImageOpacity: qrBgImageOpacity,
      backgroundImageBlur: qrBgImageBlur,
      backgroundImageOverlayOpacity: qrBgImageOverlayOpacity,
      aiArtQrEnabled,
      aiArtBlend,
      aiArtStyle,
      qrBackgroundCardEnabled: qrBgCardEnabled,
      qrBackgroundCardOpacity: qrBgCardOpacity,
      qrBgShape,
      qrBackgroundCardShape: qrBgCardShape,
      qrSizeScale,
      qrPosX,
      qrPosY,
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
      framePosition,
      frameRotation,
      textCenterEnabled, 
      textCenter: textCenterEnabled ? textCenterText : null,
      textCenterSize, textCenterColor, textCenterFont,
      textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
      textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
      textCenterPosX, textCenterPosY, textCenterRotation,
      textCenterWidth, textCenterHeight,
      customTexts,
      logoPosX, logoPosY,
      logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
      logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop,
      showHandle: false,
      selectedType: null
    });
    
    return tempCanvas;
  };
  const handleDownload = async (format, downloadFn) => {
    if (!canvasRef.current) return;
    setDownloadingFormat(format);
    try {
      const exportSize = QUALITY_SIZES[exportQuality] || 2048;
      const exportCanvas = generateExportCanvas(exportSize);
      
      // Generate a unique filename using timestamp to avoid overwriting previous saves
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const uniqueFilename = `qrcode_${timestamp}`;
      
      const resultObj = await downloadFn(exportCanvas, uniqueFilename, 'QR Codes');
      if (resultObj && typeof resultObj === 'object') {
        setExportSuccessInfo(resultObj);
      } else {
        const result = resultObj;
        if (result === 'gallery') {
          showToast('Saved to Gallery');
        } else if (result === 'share') {
          showToast('Save Options Opened');
        } else {
          showToast('Saved successfully');
        }
      }
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Save failed', 'error');
    } finally {
      setTimeout(() => setDownloadingFormat(null), 800);
    }
  };
  // ── Save to Saved ──
  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataString = formatQRData(qrType, qrData);
    if (!dataString) { showToast('Please enter QR data first', 'error'); return; }
    
    const displayText = getQRDisplayName(qrType, qrData);
    
    // We already save to history automatically, but user clicked "Add to Saved"
    const savedEntry = saveToSaved({
      id: loadedItemId,
      source: 'create',
      qrType, qrData, displayText: displayText.substring(0, 80), errorLevel,
      ...getSnapshot(),
      thumbnail: latestThumbnailRef.current || canvasRef.current?.toDataURL('image/jpeg', 0.8) || null
    });
    if (savedEntry && savedEntry.id) {
      setLoadedItemId(savedEntry.id);
    }
    showToast('Added to Saved QRs', 'success');
  };
  const getActiveStyle = () => {
    return getSnapshot();
  };
  // ── Edit Batch Item Style ──
  const handleEditBatchItemStyle = (item, idx, passedBatchType) => {
    ignoreDirtyRef.current = true;
    generatorIsDirtyRef.current = false;
    setTimeout(() => {
      ignoreDirtyRef.current = false;
      generatorIsDirtyRef.current = false;
    }, 800);

    setTimeout(() => {
      setActiveBatchItemIndex(idx);
    }, 100);

    // If passedBatchType is explicitly 'BARCODE', or if not specified but the item looks like a barcode
    const isBarcode = passedBatchType === 'BARCODE' || 
                     (!passedBatchType && (item.qrType === 'BARCODE' || !!item.style?.bcid));

    if (isBarcode) {
      setLoadedBarcodeItem({
        id: item.id || `batch-item-${idx}`,
        qrType: 'BARCODE',
        bcid: item.style?.bcid || 'code128',
        text: item.data || '',
        displayText: item.data || '',
        style: item.style || {}
      });
      navigateTo('barcode');
    } else {
      applySnapshot(item.style);
      
      const parsed = parseRawQRText(item.data);
      setQrType(parsed.type);
      setQrData(parsed.data);
      navigateTo('generator');
      setActiveTab('color');
    }
  };
  // ── Load QR ──
  const handleLoadQR = (item) => {
    if (!item) return;
    
    const typeUpper = (item.type || '').toUpperCase();
    const barcodeFormats = [
      'DATA_MATRIX', 'DATA MATRIX', 'PDF417', 'PDF_417', 'AZTEC', 'EAN_13', 'EAN-13', 'EAN_8', 'EAN-8', 
      'UPC_A', 'UPC-A', 'UPC_E', 'UPC-E', 'CODE_128', 'CODE-128', 'CODE_39', 'CODE-39', 'CODE_93', 'CODE-93', 
      'ITF', 'ITF / I2OF5', 'ITF (I25)', 'CODABAR', 'MAXICODE'
    ];
    const isBarcode = item.qrType === 'BARCODE' || barcodeFormats.includes(typeUpper);
    if (isBarcode) {
      const getBcid = (fmt) => {
        if (!fmt) return 'code128';
        const name = fmt.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (name === 'datamatrix') return 'datamatrix';
        if (name === 'pdf417') return 'pdf417';
        if (name === 'aztec') return 'aztec';
        if (name === 'maxicode') return 'maxicode';
        if (name === 'ean13') return 'ean13';
        if (name === 'ean8') return 'ean8';
        if (name === 'upca') return 'upca';
        if (name === 'upce') return 'upce';
        if (name === 'code128') return 'code128';
        if (name === 'code39') return 'code39';
        if (name === 'code93') return 'code93';
        if (name === 'codabar') return 'codabar';
        if (name.includes('itf') || name.includes('i25')) return 'i25';
        return 'code128';
      };
      setLoadedBarcodeItem({
        id: item.id,
        displayText: item.displayText || item.qrData?.text || '',
        qrType: 'BARCODE',
        bcid: item.style?.bcid || getBcid(item.type),
        text: item.displayText || item.qrData?.text || '',
        style: item.style || {}
      });
      navigateTo('barcode');
      return;
    }
    
    ignoreDirtyRef.current = true;
    generatorIsDirtyRef.current = false;
    setTimeout(() => {
      ignoreDirtyRef.current = false;
      generatorIsDirtyRef.current = false;
    }, 1000);
    
    // Core data
    if (item.source === 'scan' || (!item.qrType && item.qrData?.text)) {
      const rawText = item.qrData?.text || item.displayText || '';
      const parsed = parseRawQRText(rawText);
      setQrType(parsed.type);
      setQrData(parsed.data);
      
      // Reset layout options for scanned QRs to clear the designer
      setLogo(null);
      setQrColor('#000000');
      setBgColor('#ffffff');
      setBgTransparent(false);
      setGradientEnabled(false);
      setDotStyle('square');
      setEyeStyle('square');
      setFrameStyle('none');
      setTextCenterEnabled(false);
    } else {
      // Generated QR template: apply all saved snapshot settings
      applySnapshot(item);
    }
    setLoadedItemId(item.id || null);
    // Reset tab history when loading a template
    setTabHistory([]);
    navigateTo('generator');
    showToast('Template loaded');
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
    
    const executeRender = () => {
      if (!canvasRef.current) return;
      
      // If fonts are still loading in the background, schedule a redraw once ready without blocking instant render
      if (document.fonts && document.fonts.status !== 'loaded') {
        document.fonts.ready.then(() => {
          if (canvasRef.current) executeRender();
        }).catch(() => {});
      }
      
      // Extract vCard content fields so template preview reflects live user input
      const isVCardTemplate = selectedTemplate?.styleFamily === 'vcard';
      const vcardFields = isVCardTemplate ? {
        vcardName:     [qrData?.firstName, qrData?.lastName].filter(Boolean).join(' ') || qrData?.name || '',
        vcardJobTitle: [qrData?.title, qrData?.org].filter(Boolean).join(', ')           || qrData?.jobTitle || '',
        vcardPhone:    qrData?.phone   || '',
        vcardEmail:    qrData?.email   || '',
        vcardAddress:  qrData?.address || '',
        vcardUrl:      qrData?.url     || '',
      } : {};

      renderQR(canvasRef.current, {
        ...qrMatrixInfo, size: 1024,
        template: selectedTemplate,
        templateHeadline: templateHeadlineText !== undefined ? templateHeadlineText : (selectedTemplate?.headline || selectedTemplate?.defaultHeadline || selectedTemplate?.labelText || ''),
        templateHandleText: templateHandleText !== undefined ? templateHandleText : (selectedTemplate?.subtitle || selectedTemplate?.defaultHandle || selectedTemplate?.handle || ''),
        templateFont,
        ...vcardFields,
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
        backgroundImageEnabled: qrBgImageEnabled,
        backgroundImage: qrBgImage?.image,
        backgroundImageOpacity: qrBgImageOpacity,
        backgroundImageBlur: qrBgImageBlur,
        backgroundImageOverlayOpacity: qrBgImageOverlayOpacity,
        aiArtQrEnabled,
        aiArtBlend,
        aiArtStyle,
        qrBackgroundCardEnabled: qrBgCardEnabled,
        qrBackgroundCardOpacity: qrBgCardOpacity,
        qrBgShape,
        qrBackgroundCardShape: qrBgCardShape,
        qrSizeScale,
        qrPosX,
        qrPosY,
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
        framePosition,
        frameRotation,
        textCenterEnabled, 
        textCenter: textCenterEnabled ? textCenterText : null,
        textCenterSize, textCenterColor, textCenterFont,
        textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
        textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
        textCenterPosX, textCenterPosY, textCenterRotation,
        textCenterWidth, textCenterHeight,
        customTexts,
        logoPosX, logoPosY,
        logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
        logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop,
        showHandle: !!canvasSelection && !isPipetteActive,
        selectedType: canvasSelection === 'text' ? 'text' : (canvasSelection === 'frame-text' ? 'frame-text' : canvasSelection)
      });
      // Cache latest thumbnail base64 data url for saving to history later
      try {
        latestThumbnailRef.current = canvasRef.current.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        console.warn('Failed to cache thumbnail:', e);
      }
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
        framePosition,
        frameRotation,
    textCenterEnabled, textCenterText, textCenterSize, textCenterColor, textCenterFont,
    textCenterStrokeEnabled, textCenterStrokeWidth, textCenterStrokeColor,
    textCenterShadowEnabled, textCenterShadowBlur, textCenterShadowColor,
    textCenterPosX, textCenterPosY, textCenterRotation, textCenterWidth, textCenterHeight, logoPosX, logoPosY,
    logoOpacity, logoRotation, logoShadowEnabled, logoShadowColor, logoShadowBlur, logoShadowOffsetX, logoShadowOffsetY,
    logoInnerShadowEnabled, logoEraseColorEnabled, logoEraseColor, logoEraseTolerance, logoEraseSmoothing, logoTexture, logoCrop, 
    qrTextureEnabled, qrTexture, qrTextureSyncEyes,
    qrBgImageEnabled, qrBgImage, qrBgImageOpacity, qrBgImageBlur, qrBgImageOverlayOpacity, qrBgCardEnabled, qrBgCardOpacity,
    qrBgShape, qrBgCardShape, qrSizeScale, qrPosX, qrPosY,
    aiArtQrEnabled, aiArtBlend, aiArtStyle,
    activeTab, canvasSelection,
    selectedTemplate, templateHeadlineText, templateHandleText, templateFont,
    customTexts,
    qrData, qrType
  ]);
  useEffect(() => {
    renderCanvas();
    if (logo?.image && !logo.image.complete) {
      logo.image.onload = renderCanvas;
      logo.image.onerror = () => showToast('Logo failed to load', 'error');
    }
    if (qrBgImage?.image && !qrBgImage.image.complete) {
      qrBgImage.image.onload = renderCanvas;
    }
    if (qrTexture?.image && !qrTexture.image.complete) {
      qrTexture.image.onload = renderCanvas;
      qrTexture.image.onerror = () => showToast('Texture failed to load', 'error');
    }
  }, [renderCanvas, logo, qrBgImage, qrTexture, activePage, selectedTemplate, templateHeadlineText, templateHandleText, templateFont, customTexts]);
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
  // ── Pipette Handling ──
  // ── Pipette Handling ──
  const sampleCanvasColor = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return null;

    // Check if within bounds (or within margin when dragging)
    const isNearby = (
      clientX >= canvasRect.left - 50 &&
      clientX <= canvasRect.right + 50 &&
      clientY >= canvasRect.top - 50 &&
      clientY <= canvasRect.bottom + 50
    );
    if (!isNearby) return null;

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const x = Math.max(0, Math.min(Math.floor((clientX - canvasRect.left) * scaleX), canvas.width - 1));
    const y = Math.max(0, Math.min(Math.floor((clientY - canvasRect.top) * scaleY), canvas.height - 1));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      return { hex, x, y };
    } catch (err) {
      console.warn("Failed to sample pixel:", err);
      return null;
    }
  }, []);

  const updateLoupe = useCallback((clientX, clientY) => {
    if (!canvasRef.current || !loupeCanvasRef.current) return;
    const mainCanvas = canvasRef.current;
    const loupeCanvas = loupeCanvasRef.current;
    const canvasRect = mainCanvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return;

    const scaleX = mainCanvas.width / canvasRect.width;
    const scaleY = mainCanvas.height / canvasRect.height;
    const x = Math.max(0, Math.min(Math.floor((clientX - canvasRect.left) * scaleX), mainCanvas.width - 1));
    const y = Math.max(0, Math.min(Math.floor((clientY - canvasRect.top) * scaleY), mainCanvas.height - 1));

    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 80, 80);

    // Dynamic magnification window based on canvas resolution
    const srcSize = Math.max(9, Math.round(13 * (mainCanvas.width / 512)));
    const sx = Math.floor(x - srcSize / 2);
    const sy = Math.floor(y - srcSize / 2);

    try {
      ctx.drawImage(mainCanvas, sx, sy, srcSize, srcSize, 0, 0, 80, 80);
    } catch (err) {
      console.error("Loupe draw error:", err);
    }

    // Crosshair target box
    const pixelSize = 80 / srcSize;
    const cx = Math.floor(srcSize / 2) * pixelSize;
    const cy = Math.floor(srcSize / 2) * pixelSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, pixelSize, pixelSize);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 0.5, cy - 0.5, pixelSize + 1, pixelSize + 1);
  }, []);

  const handlePipettePointerDown = useCallback((e) => {
    if (!canvasRef.current) return;
    try {
      if (e.target.setPointerCapture && e.pointerId !== undefined) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const sample = sampleCanvasColor(clientX, clientY);

    if (sample) {
      setHoverColor(sample.hex);
      setHoverPos({ x: clientX, y: clientY });
      setTimeout(() => updateLoupe(clientX, clientY), 0);

      // On desktop click style (pointerType === 'mouse') picks color immediately on click
      if (e.pointerType === 'mouse') {
        if (pipetteTarget?.setter) {
          pipetteTarget.setter(sample.hex);
        }
        setIsPipetteActive(false);
        setHoverColor(null);
        setAdvPicker(prev => ({ ...prev, open: true, color: sample.hex }));
      }
    }
    if (e.cancelable) e.preventDefault();
  }, [pipetteTarget, sampleCanvasColor, updateLoupe]);

  const handlePipettePointerMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const sample = sampleCanvasColor(clientX, clientY);

    if (sample) {
      setHoverColor(sample.hex);
      setHoverPos({ x: clientX, y: clientY });
      updateLoupe(clientX, clientY);
    }
    if (e.cancelable) e.preventDefault();
  }, [sampleCanvasColor, updateLoupe]);

  const handlePipettePointerUp = useCallback((e) => {
    try {
      if (e.target.releasePointerCapture && e.pointerId !== undefined) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    // On touch screen or mouse release with selected color, complete selection
    if (hoverColor) {
      if (pipetteTarget?.setter) {
        pipetteTarget.setter(hoverColor);
      }
      setIsPipetteActive(false);
      setHoverColor(null);
      setAdvPicker(prev => ({ ...prev, open: true, color: hoverColor }));
    }
    if (e.cancelable) e.preventDefault();
  }, [hoverColor, pipetteTarget]);
  // ── Canvas Interaction (Drag to Position) ──
  const handleCanvasInteraction = useCallback((e) => {
    if (!canvasRef.current || !qrMatrixInfo) return;
    const canvas = canvasRef.current;
    
    // Save snapshot before dragging/resizing starts if not already set
    if (!preEditSnapshot.current) {
      preEditSnapshot.current = getSnapshot();
    }
    
    // Selection will be cleared at the end of this function if no hit is registered
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
      const pad = 25; 
      return px >= rx - pad && px <= rx + rw + pad && py >= ry - pad && py <= ry + rh + pad;
    };
    // 1. Check Logo
    if (logo?.image) {
      const lw = contentSize * logoWidth;
      const lh = contentSize * logoHeight;
      const rawLx = contentX + (contentSize - lw) * logoPosX;
      const rawLy = contentY + (contentSize - lh) * logoPosY;
      const moduleCount = qrMatrixInfo?.width || 21;
      const safePos = constrainToSafeZone(rawLx, rawLy, lw, lh, contentX, contentY, contentSize, moduleCount, 2);
      const lx = safePos.x;
      const ly = safePos.y;
      
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
        const checkRotateLogo = (hx, hy) => {
          const rotHSize = 24;
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

        // 1. Check Top-Center Rotate Stalk Handle (ly - 26)
        if (checkRotateLogo(centerX, ly - 26)) return;
        // 2. Check Bottom-Left Rotate Bracket Handle (lx - 20, ly + lh + 20)
        if (checkRotateLogo(lx - 20, ly + lh + 20)) return;

        // 3. Check Delete Button (Top-Right: lx + lw, ly)
        if (checkH(lx + lw, ly, 'delete-logo')) {
          setLogo(null);
          setCanvasSelection(null);
          setIsDraggingCanvas(false);
          dragType.current = null;
          showToast('Logo removed');
          e.preventDefault();
          return;
        }

        // 4. Check Proportional Resize (Bottom-Right: lx + lw, ly + lh)
        if (checkH(lx + lw, ly + lh, 'resize-logo-br')) return;

        // 5. Check Stretch Handles (Right & Bottom)
        if (checkH(lx + lw, ly + lh / 2, 'resize-logo-r')) return;
        if (checkH(lx + lw / 2, ly + lh, 'resize-logo-b')) return;
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
      const tw = textCenterWidth ? (textCenterWidth * contentSize) : (metrics.width + (logoPadding || 10) * 2);
      const th = textCenterHeight ? (textCenterHeight * contentSize) : ((fontSize * 0.8) + (logoPadding || 10) * 2);
      
      const rawTx = contentX + (contentSize - tw) * textCenterPosX;
      const rawTy = contentY + (contentSize - th) * textCenterPosY;
      const moduleCount = qrMatrixInfo?.width || 21;
      const safePos = constrainToSafeZone(rawTx, rawTy, tw, th, contentX, contentY, contentSize, moduleCount, 2);
      const tx = safePos.x;
      const ty = safePos.y;
      
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
        const checkRotateText = (hx, hy) => {
          const rotHSize = 24;
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

        // 1. Check Top-Center Rotate Stalk Handle (ty - 26)
        if (checkRotateText(centerX, ty - 26)) return;
        // 2. Check Bottom-Left Rotate Bracket Handle (tx - 20, ty + th + 20)
        if (checkRotateText(tx - 20, ty + th + 20)) return;

        // 3. Check Delete Button (Top-Right: tx + tw, ty)
        if (checkH(tx + tw, ty, 'delete-text')) {
          setTextCenterEnabled(false);
          setCanvasSelection(null);
          setIsDraggingCanvas(false);
          dragType.current = null;
          showToast('Text removed');
          e.preventDefault();
          return;
        }

        // 4. Check Proportional Resize (Bottom-Right: tx + tw, ty + th)
        if (checkH(tx + tw, ty + th, 'resize-text-br')) return;

        // 5. Check Stretch Handles (Right & Bottom)
        if (checkH(tx + tw, ty + th / 2, 'resize-text-r')) return;
        if (checkH(tx + tw / 2, ty + th, 'resize-text-b')) return;
      }
      // Clicking inside the body region always triggers dragging/selection
      if (inRect(localX, localY, tx, ty, tw, th)) {
        setCanvasSelection('text');
        setTextEditMode('center');
        setIsDraggingCanvas(true);
        dragType.current = 'text';
        dragStartOffset.current = { x: x - tx, y: y - ty };
        e.preventDefault();
        return;
      }
    }
    // 3. Check Frame Text
    if (frameStyle !== 'none' && frameText) {
      const framePadding = 512 * 0.03;
      const labelHeight = 512 * 0.14;
      const textY = framePosition === 'top' ? (framePadding + labelHeight / 2) : (512 - framePadding - labelHeight / 2);
      
      tempCtx.current.font = `bold ${512 * frameSize}px '${frameFont}', Outfit, sans-serif`;
      const metrics = tempCtx.current.measureText(frameText);
      const tw = metrics.width + 512 * 0.04;
      const th = (512 * frameSize) * 1.2;
      const tx = 256 - tw / 2;
      const ty = textY - th / 2;
      
      const centerX = 256;
      const centerY = textY;
      const dx_raw = x - centerX;
      const dy_raw = y - centerY;
      const ang = (-(frameRotation || 0) * Math.PI) / 180;
      const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
      const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
      const hSize = 24;
      const checkH = (hx, hy, type) => {
          if (localX >= hx - hSize && localX <= hx + hSize && localY >= hy - hSize && localY <= hy + hSize) {
              setIsDraggingCanvas(true);
              dragType.current = type;
              dragStartOffset.current = { 
                  startX: x,
                  startY: y,
                  startSize: frameSize,
                  startRotation: frameRotation || 0,
                  startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
              };
              e.preventDefault();
              return true;
          }
          return false;
      };
      if (canvasSelection === 'frame-text') {
        const checkRotateFrame = (hx, hy) => {
            if (localX >= hx - hSize && localX <= hx + hSize && localY >= hy - hSize && localY <= hy + hSize) {
                setIsDraggingCanvas(true);
                dragType.current = 'rotate-frame';
                dragStartOffset.current = { 
                    startRotation: frameRotation || 0,
                    startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
                };
                e.preventDefault();
                return true;
            }
            return false;
        };
        // Rotate handle at bottom-left
        if (checkRotateFrame(tx - 20, ty + th + 20)) return;
        // Resize handle at bottom-right
        if (checkH(tx + tw, ty + th, 'resize-frame-br')) return;
        // Delete handle at top-right
        if (checkH(tx + tw, ty, 'delete-frame')) {
          setFrameText('');
          setFrameStyle('none');
          setCanvasSelection(null);
          setIsDraggingCanvas(false);
          dragType.current = null;
          e.preventDefault();
          return;
        }
      }
      if (inRect(localX, localY, tx, ty, tw, th)) {
        setCanvasSelection('frame-text');
        setTextEditMode('frame');
        e.preventDefault();
        return;
      }
    }
    // 3. Check Custom Text Layers
    if (customTexts && customTexts.length > 0) {
      for (let i = customTexts.length - 1; i >= 0; i--) {
        const item = customTexts[i];
        if (!item || !item.text) continue;
        const fontSize = contentSize * (item.size || 0.08);
        tempCtx.current.font = `bold ${fontSize}px '${item.font || 'Outfit'}', sans-serif`;
        const metrics = tempCtx.current.measureText(item.text);
        const tw = item.width ? (item.width * contentSize) : (metrics.width + 20);
        const th = item.height ? (item.height * contentSize) : ((fontSize * 0.8) + 20);

        const tx = contentX + (contentSize - tw) * (item.posX ?? 0.5);
        const ty = contentY + (contentSize - th) * (item.posY ?? 0.5);
        const centerX = tx + tw / 2;
        const centerY = ty + th / 2;
        const dx_raw = x - centerX;
        const dy_raw = y - centerY;
        const ang = (-(item.rotation || 0) * Math.PI) / 180;
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
              startSize: item.size || 0.08,
              startPosX: item.posX ?? 0.5,
              startPosY: item.posY ?? 0.5,
              startRotation: item.rotation || 0,
              startW: tw / contentSize,
              startH: th / contentSize,
              startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI,
              customTextId: item.id
            };
            e.preventDefault();
            return true;
          }
          return false;
        };

        if (canvasSelection === 'custom-text-' + item.id) {
          const checkRotate = (hx, hy) => {
            const rotHSize = 24;
            if (localX >= hx - rotHSize && localX <= hx + rotHSize && localY >= hy - rotHSize && localY <= hy + rotHSize) {
              setIsDraggingCanvas(true);
              dragType.current = 'rotate-custom-text-' + item.id;
              dragStartOffset.current = {
                x: localX,
                y: localY,
                startSize: item.size || 0.08,
                startPosX: item.posX ?? 0.5,
                startPosY: item.posY ?? 0.5,
                startRotation: item.rotation || 0,
                startW: tw / contentSize,
                startH: th / contentSize,
                startMouseAngle: Math.atan2(y - centerY, x - centerX) * 180 / Math.PI,
                customTextId: item.id
              };
              e.preventDefault();
              return true;
            }
            return false;
          };

          // 1. Top rotate stalk
          if (checkRotate(centerX, ty - 26)) return;
          // 2. Bottom-left rotate bracket
          if (checkRotate(tx - 20, ty + th + 20)) return;
          // 3. Delete button
          if (checkH(tx + tw, ty, 'delete-custom-text-' + item.id)) {
            removeCustomText(item.id);
            setCanvasSelection(null);
            setIsDraggingCanvas(false);
            dragType.current = null;
            showToast('Text layer removed');
            e.preventDefault();
            return;
          }
          // 4. Resize bottom-right
          if (checkH(tx + tw, ty + th, 'resize-custom-text-br-' + item.id)) return;
          // 5. Side stretch
          if (checkH(tx + tw, ty + th / 2, 'resize-custom-text-r-' + item.id)) return;
          if (checkH(tx + tw / 2, ty + th, 'resize-custom-text-b-' + item.id)) return;
        }

        // Body hit test
        if (inRect(localX, localY, tx, ty, tw, th)) {
          setCanvasSelection('custom-text-' + item.id);
          setTextEditMode('custom-' + item.id);
          setActiveTab('text');
          setTextPopup('input');
          setIsDraggingCanvas(true);
          dragType.current = 'custom-text-' + item.id;
          dragStartOffset.current = { x: x - tx, y: y - ty, customTextId: item.id };
          e.preventDefault();
          return;
        }
      }
    }

    // 4. Check Template Text Direct Click
    if (selectedTemplate) {
      if (selectedTemplate.styleFamily === 'vcard') {
        if (x <= 360) {
          setIsTemplateTextModalOpen(true);
          e.preventDefault();
          return;
        }
      } else {
        // Top Headline / Label
        if (y <= 170) {
          setCanvasSelection('template-headline');
          setTextEditMode('template-top');
          setActiveTab('text');
          setTextPopup('input');
          e.preventDefault();
          return;
        }
        // Bottom Subtitle / Handle (non-frame templates)
        if (y >= 350 && selectedTemplate.styleFamily !== 'frame') {
          setCanvasSelection('template-handle');
          setTextEditMode('template-bottom');
          setActiveTab('text');
          setTextPopup('input');
          e.preventDefault();
          return;
        }
      }
    }

    // Clear selection if we clicked outside any active elements
    if (!isPipetteActive) {
      setCanvasSelection(null);
    }
  }, [qrMatrixInfo, logo, logoWidth, logoHeight, logoPosX, logoPosY, logoRotation, textCenterEnabled, textCenterText, textCenterSize, textCenterWidth, textCenterHeight, textCenterPosX, textCenterPosY, textCenterRotation, customTexts, logoPadding, getQRContentArea, canvasSelection, getSnapshot, frameStyle, frameText, frameSize, frameFont, framePosition, frameRotation, selectedTemplate]);
  const handleCanvasDoubleClick = useCallback((e) => {
    if (!canvasRef.current || !qrMatrixInfo) return;
    if (selectedTemplate) {
      setIsTemplateTextModalOpen(true);
      return;
    }

    // 1. Check Center Text
    if (textCenterEnabled && textCenterText) {
      const fontSize = contentSize * textCenterSize;
      tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
      const metrics = tempCtx.current.measureText(textCenterText);
      const tw = textCenterWidth ? (textCenterWidth * contentSize) : (metrics.width + (logoPadding || 10) * 2);
      const th = textCenterHeight ? (textCenterHeight * contentSize) : ((fontSize * 0.8) + (logoPadding || 10) * 2);
      
      const rawTx = contentX + (contentSize - tw) * textCenterPosX;
      const rawTy = contentY + (contentSize - th) * textCenterPosY;
      const moduleCount = qrMatrixInfo?.width || 21;
      const safePos = constrainToSafeZone(rawTx, rawTy, tw, th, contentX, contentY, contentSize, moduleCount, 2);
      const tx = safePos.x;
      const ty = safePos.y;
      
      const centerX = tx + tw / 2;
      const centerY = ty + th / 2;
      const dx_raw = x - centerX;
      const dy_raw = y - centerY;
      const ang = (-textCenterRotation * Math.PI) / 180;
      const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
      const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
      if (inRect(localX, localY, tx, ty, tw, th)) {
        handleTabChange('text');
        setTextPopup('input');
        setTextEditMode('center');
        setCanvasSelection('text');
        setTimeout(() => {
          const input = document.getElementById('center-text-input');
          if (input) {
            input.focus();
            input.select();
          }
        }, 100);
        e.preventDefault();
        return;
      }
    }
    // 2. Check Frame Text
    if (frameStyle !== 'none' && frameText) {
      const framePadding = 512 * 0.03;
      const labelHeight = 512 * 0.14;
      const textY = framePosition === 'top' ? (framePadding + labelHeight / 2) : (512 - framePadding - labelHeight / 2);
      
      tempCtx.current.font = `bold ${512 * frameSize}px '${frameFont}', Outfit, sans-serif`;
      const metrics = tempCtx.current.measureText(frameText);
      const tw = metrics.width + 512 * 0.04;
      const th = (512 * frameSize) * 1.2;
      const tx = 256 - tw / 2;
      const ty = textY - th / 2;
      
      const centerX = 256;
      const centerY = textY;
      const dx_raw = x - centerX;
      const dy_raw = y - centerY;
      const ang = (-(frameRotation || 0) * Math.PI) / 180;
      const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
      const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
      if (inRect(localX, localY, tx, ty, tw, th)) {
        handleTabChange('text');
        setTextPopup('input');
        setTextEditMode('frame');
        setCanvasSelection('frame-text');
        setTimeout(() => {
          const input = document.getElementById('frame-text-input');
          if (input) {
            input.focus();
            input.select();
          }
        }, 100);
        e.preventDefault();
        return;
      }
    }
  }, [textCenterEnabled, textCenterText, textCenterSize, textCenterFont, textCenterWidth, textCenterHeight, textCenterPosX, textCenterPosY, textCenterRotation, logoPadding, getQRContentArea, qrMatrixInfo, frameStyle, frameText, frameSize, frameFont, framePosition, frameRotation, handleTabChange]);
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
        const rawLx = contentX + (contentSize - lw) * logoPosX;
        const rawLy = contentY + (contentSize - lh) * logoPosY;
        const moduleCount = qrMatrixInfo?.width || 21;
        const safePos = constrainToSafeZone(rawLx, rawLy, lw, lh, contentX, contentY, contentSize, moduleCount, 2);
        const lx = safePos.x;
        const ly = safePos.y;
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
        const tw = textCenterWidth ? (textCenterWidth * contentSize) : (metrics.width + (logoPadding || 10) * 2);
        const th = textCenterHeight ? (textCenterHeight * contentSize) : ((fontSize * 0.8) + (logoPadding || 10) * 2);
        
        const rawTx = contentX + (contentSize - tw) * textCenterPosX;
        const rawTy = contentY + (contentSize - th) * textCenterPosY;
        const moduleCount = qrMatrixInfo?.width || 21;
        const safePos = constrainToSafeZone(rawTx, rawTy, tw, th, contentX, contentY, contentSize, moduleCount, 2);
        const tx = safePos.x;
        const ty = safePos.y;
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
    } else if (dragType.current === 'rotate-frame') {
        const framePadding = 512 * 0.03;
        const labelHeight = 512 * 0.14;
        const textY = framePosition === 'top' ? (framePadding + labelHeight / 2) : (512 - framePadding - labelHeight / 2);
        const centerX = 256;
        const centerY = textY;
        
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
        setFrameRotation(Math.round(normalizedRot));
    } else if (dragType.current === 'resize-frame-br') {
        const framePadding = 512 * 0.03;
        const labelHeight = 512 * 0.14;
        const textY = framePosition === 'top' ? (framePadding + labelHeight / 2) : (512 - framePadding - labelHeight / 2);
        const centerX = 256;
        const centerY = textY;
        
        const currentDist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const startDist = Math.sqrt((dragStartOffset.current.startX - centerX) ** 2 + (dragStartOffset.current.startY - centerY) ** 2);
        
        const scale = startDist > 0 ? (currentDist / startDist) : 1;
        const newSize = Math.max(0.04, Math.min(0.24, dragStartOffset.current.startSize * scale));
        setFrameSize(Math.round(newSize * 100) / 100);
    } else if (dragType.current && dragType.current.startsWith('resize-logo')) {
        const lw = contentSize * logoWidth;
        const lh = contentSize * logoHeight;
        const rawLx = contentX + (contentSize - lw) * logoPosX;
        const rawLy = contentY + (contentSize - lh) * logoPosY;
        const moduleCount = qrMatrixInfo?.width || 21;
        const safePos = constrainToSafeZone(rawLx, rawLy, lw, lh, contentX, contentY, contentSize, moduleCount, 2);
        const lx = safePos.x;
        const ly = safePos.y;
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
        const fontSize = contentSize * textCenterSize;
        tempCtx.current.font = `bold ${fontSize}px '${textCenterFont}', sans-serif`;
        const metrics = tempCtx.current.measureText(textCenterText);
        const tw = textCenterWidth ? (textCenterWidth * contentSize) : (metrics.width + (logoPadding || 10) * 2);
        const th = textCenterHeight ? (textCenterHeight * contentSize) : ((fontSize * 0.8) + (logoPadding || 10) * 2);
        
        const rawTx = contentX + (contentSize - tw) * textCenterPosX;
        const rawTy = contentY + (contentSize - th) * textCenterPosY;
        const moduleCount = qrMatrixInfo?.width || 21;
        const safePos = constrainToSafeZone(rawTx, rawTy, tw, th, contentX, contentY, contentSize, moduleCount, 2);
        const tx = safePos.x;
        const ty = safePos.y;
        
        const centerX = tx + tw / 2;
        const centerY = ty + th / 2;
        const dx_raw = x - centerX;
        const dy_raw = y - centerY;
        const ang = (-textCenterRotation * Math.PI) / 180;
        const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
        const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
        const diffX = (localX - dragStartOffset.current.x) / contentSize;
        const diffY = (localY - dragStartOffset.current.y) / contentSize;
        
        const startW_px = contentSize * dragStartOffset.current.startW;
        const startH_px = contentSize * dragStartOffset.current.startH;
        const tx_start = contentX + (contentSize - startW_px) * dragStartOffset.current.startPosX;
        const ty_start = contentY + (contentSize - startH_px) * dragStartOffset.current.startPosY;
        
        let newW = dragStartOffset.current.startW;
        let newH = dragStartOffset.current.startH;
        let newSize = dragStartOffset.current.startSize;
        
        if (dragType.current === 'resize-text-br') {
            const scale = Math.max(0.1, (dragStartOffset.current.startW + diffX) / dragStartOffset.current.startW);
            newW = Math.max(0.05, Math.min(0.35, dragStartOffset.current.startW * scale));
            newH = Math.max(0.05, Math.min(0.35, dragStartOffset.current.startH * scale));
            newSize = Math.max(0.02, Math.min(0.35, dragStartOffset.current.startSize * scale));
            
            // Adjust dragStartOffset.current.x for boundary constraints
            const maxScale = 0.35 / dragStartOffset.current.startW;
            const minScale = 0.05 / dragStartOffset.current.startW;
            const currentScale = (dragStartOffset.current.startW + diffX) / dragStartOffset.current.startW;
            if (currentScale > maxScale) {
                const maxDiffX = (maxScale - 1) * dragStartOffset.current.startW;
                dragStartOffset.current.x = localX - maxDiffX * contentSize;
            } else if (currentScale < minScale) {
                const minDiffX = (minScale - 1) * dragStartOffset.current.startW;
                dragStartOffset.current.x = localX - minDiffX * contentSize;
            }
        } else if (dragType.current === 'resize-text-r') {
            newW = Math.max(0.05, Math.min(0.35, dragStartOffset.current.startW + diffX));
            
            const maxDiffX = 0.35 - dragStartOffset.current.startW;
            const minDiffX = 0.05 - dragStartOffset.current.startW;
            if (diffX > maxDiffX) {
                dragStartOffset.current.x = localX - maxDiffX * contentSize;
            } else if (diffX < minDiffX) {
                dragStartOffset.current.x = localX - minDiffX * contentSize;
            }
        } else if (dragType.current === 'resize-text-b') {
            newH = Math.max(0.05, Math.min(0.35, dragStartOffset.current.startH + diffY));
            
            const maxDiffY = 0.35 - dragStartOffset.current.startH;
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
        
        if (dragStartOffset.current.startPosX === 0.5) {
            newPosX = 0.5;
        } else if (contentSize - newW_px > 0) {
            newPosX = Math.max(0, Math.min(1, (tx_start - contentX) / (contentSize - newW_px)));
        }
        
        if (dragStartOffset.current.startPosY === 0.5) {
            newPosY = 0.5;
        } else if (contentSize - newH_px > 0) {
            newPosY = Math.max(0, Math.min(1, (ty_start - contentY) / (contentSize - newH_px)));
        }
        
        setTextCenterSize(Math.round(newSize * 100) / 100);
        setTextCenterWidth(Math.round(newW * 100) / 100);
        setTextCenterHeight(Math.round(newH * 100) / 100);
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
      const tw = textCenterWidth ? (textCenterWidth * contentSize) : (metrics.width + (logoPadding || 10) * 2);
      const th = textCenterHeight ? (textCenterHeight * contentSize) : ((fontSize * 0.8) + (logoPadding || 10) * 2);
      
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
    } else if (dragType.current && dragType.current.startsWith('rotate-custom-text-')) {
      const id = dragStartOffset.current.customTextId;
      const item = customTexts.find(t => t.id === id);
      if (item) {
        const fontSize = contentSize * (item.size || 0.08);
        tempCtx.current.font = `bold ${fontSize}px '${item.font || 'Outfit'}', sans-serif`;
        const metrics = tempCtx.current.measureText(item.text);
        const tw = item.width ? (item.width * contentSize) : (metrics.width + 20);
        const th = item.height ? (item.height * contentSize) : ((fontSize * 0.8) + 20);
        const tx = contentX + (contentSize - tw) * (item.posX ?? 0.5);
        const ty = contentY + (contentSize - th) * (item.posY ?? 0.5);
        const centerX = tx + tw / 2;
        const centerY = ty + th / 2;
        const currentMouseAngle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        const angleDelta = currentMouseAngle - dragStartOffset.current.startMouseAngle;
        let newRotation = dragStartOffset.current.startRotation + angleDelta;
        let normalizedRot = (newRotation % 360 + 360) % 360;
        const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const target of snapTargets) {
          if (Math.abs(normalizedRot - target) <= 4) {
            normalizedRot = target === 360 ? 0 : target;
            break;
          }
        }
        updateCustomText(id, { rotation: Math.round(normalizedRot) });
      }
    } else if (dragType.current && dragType.current.startsWith('resize-custom-text-')) {
      const id = dragStartOffset.current.customTextId;
      const item = customTexts.find(t => t.id === id);
      if (item) {
        const fontSize = contentSize * (item.size || 0.08);
        tempCtx.current.font = `bold ${fontSize}px '${item.font || 'Outfit'}', sans-serif`;
        const metrics = tempCtx.current.measureText(item.text);
        const tw = item.width ? (item.width * contentSize) : (metrics.width + 20);
        const th = item.height ? (item.height * contentSize) : ((fontSize * 0.8) + 20);
        const tx = contentX + (contentSize - tw) * (item.posX ?? 0.5);
        const ty = contentY + (contentSize - th) * (item.posY ?? 0.5);
        const centerX = tx + tw / 2;
        const centerY = ty + th / 2;
        const dx_raw = x - centerX;
        const dy_raw = y - centerY;
        const ang = (-(item.rotation || 0) * Math.PI) / 180;
        const localX = centerX + dx_raw * Math.cos(ang) - dy_raw * Math.sin(ang);
        const localY = centerY + dx_raw * Math.sin(ang) + dy_raw * Math.cos(ang);
        const diffX = (localX - dragStartOffset.current.x) / contentSize;
        const diffY = (localY - dragStartOffset.current.y) / contentSize;

        let newW = dragStartOffset.current.startW;
        let newH = dragStartOffset.current.startH;
        let newSize = dragStartOffset.current.startSize;

        if (dragType.current.includes('-br-')) {
          const scale = Math.max(0.1, (dragStartOffset.current.startW + diffX) / dragStartOffset.current.startW);
          newW = Math.max(0.05, Math.min(0.8, dragStartOffset.current.startW * scale));
          newH = Math.max(0.05, Math.min(0.8, dragStartOffset.current.startH * scale));
          newSize = Math.max(0.02, Math.min(0.4, dragStartOffset.current.startSize * scale));
        } else if (dragType.current.includes('-r-')) {
          newW = Math.max(0.05, Math.min(0.8, dragStartOffset.current.startW + diffX));
        } else if (dragType.current.includes('-b-')) {
          newH = Math.max(0.05, Math.min(0.8, dragStartOffset.current.startH + diffY));
        }

        updateCustomText(id, {
          size: Math.round(newSize * 1000) / 1000,
          width: Math.round(newW * 100) / 100,
          height: Math.round(newH * 100) / 100
        });
      }
    } else if (dragType.current && dragType.current.startsWith('custom-text-')) {
      const id = dragStartOffset.current.customTextId;
      const item = customTexts.find(t => t.id === id);
      if (item) {
        const fontSize = contentSize * (item.size || 0.08);
        tempCtx.current.font = `bold ${fontSize}px '${item.font || 'Outfit'}', sans-serif`;
        const metrics = tempCtx.current.measureText(item.text);
        const tw = item.width ? (item.width * contentSize) : (metrics.width + 20);
        const th = item.height ? (item.height * contentSize) : ((fontSize * 0.8) + 20);

        const newTx = x - dragStartOffset.current.x;
        const newTy = y - dragStartOffset.current.y;
        let valX = Math.max(0, Math.min(1, (newTx - contentX) / Math.max(1, contentSize - tw)));
        let valY = Math.max(0, Math.min(1, (newTy - contentY) / Math.max(1, contentSize - th)));

        if (Math.abs(valX - 0.5) <= 0.02) valX = 0.5;
        if (Math.abs(valY - 0.5) <= 0.02) valY = 0.5;

        updateCustomText(id, {
          posX: Math.round(valX * 1000) / 1000,
          posY: Math.round(valY * 1000) / 1000
        });
      }
    }
  }, [isDraggingCanvas, qrMatrixInfo, logo, logoWidth, logoHeight, logoRotation, textCenterEnabled, textCenterText, textCenterSize, textCenterWidth, textCenterHeight, textCenterPosX, textCenterPosY, textCenterRotation, textCenterFont, customTexts, logoPadding, getQRContentArea, framePosition, frameRotation, frameSize, setFrameRotation, setFrameSize]);
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
  // ── Tab definitions (Dynamically filtered by FeatureAccessManager) ──
  const ALL_TABS = [
    { id: 'content',  label: 'Content',  icon: Pencil,      featId: 'qr_tab_content' },
    { id: 'color',    label: 'Color',    icon: Palette,     featId: 'qr_tab_color' },
    { id: 'shapes',   label: 'Style',    icon: QRStyleIcon, featId: 'qr_tab_style' },
    { id: 'logo',     label: 'Logo',     icon: ImageIcon,   featId: 'qr_tab_logo' },
    { id: 'template', label: 'Template', icon: Sparkles,    featId: 'qr_tab_template' },
    // { id: 'frame',   label: 'Frame',   icon: LayoutGrid },
    { id: 'text',     label: 'Text',     icon: Type,        featId: 'qr_tab_text' },
  ];
  const TABS = ALL_TABS.filter(tab => FeatureAccessManager.isQRTabVisible(tab.id));

  // Automatically fall back to first visible tab if activeTab is disabled globally
  useEffect(() => {
    if (TABS.length > 0 && !TABS.some(t => t.id === activeTab)) {
      setActiveTab(TABS[0].id);
    }
  }, [TABS, activeTab]);

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
  const qrParams = {
    qrMatrixInfo,
    qrColor,
    bgColor,
    bgTransparent,
    dotStyle,
    eyeStyle,
    eyeColor,
    eyeOuterColor,
    syncEyes,
    dotPadding,
    eyePadding,
    gradientEnabled,
    gradientColor1,
    gradientColor2,
    gradientType,
    qrTextureEnabled,
    qrTexture,
    qrTextureSyncEyes,
    logo: logo?.image,
    logoWidth,
    logoHeight,
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
    frameFont,
    frameSize,
    frameStrokeEnabled,
    frameStrokeWidth,
    frameStrokeColor,
    frameShadowEnabled,
    frameShadowBlur,
    frameShadowColor,
    framePosition,
    frameRotation,
    textCenterEnabled,
    textCenter: textCenterEnabled ? textCenterText : null,
    textCenterSize,
    textCenterColor,
    textCenterFont,
    textCenterStrokeEnabled,
    textCenterStrokeWidth,
    textCenterStrokeColor,
    textCenterShadowEnabled,
    textCenterShadowBlur,
    textCenterShadowColor,
    textCenterPosX,
    textCenterPosY,
    textCenterRotation,
    textCenterWidth,
    textCenterHeight,
    logoPosX,
    logoPosY,
    logoOpacity,
    logoRotation,
    logoShadowEnabled,
    logoShadowColor,
    logoShadowBlur,
    logoShadowOffsetX,
    logoShadowOffsetY,
    logoInnerShadowEnabled,
    logoEraseColorEnabled,
    logoEraseColor,
    logoEraseTolerance,
    logoEraseSmoothing,
    logoTexture,
    logoCrop
  };
  return (
    <div className="app redesigned">
      {/* ── Blocked User Overlay ── */}
      {isBlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
          fontFamily: "'Outfit','Inter',sans-serif", color: '#fff', textAlign: 'center', padding: 32,
        }}>
          <div style={{
            background: '#1A1A1F', border: '1px solid #333', borderRadius: '24px',
            padding: '40px', maxWidth: '400px', width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={32} color="#FF3B30" />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, marginTop: 0 }}>Mushi QR Pro Says</h2>
              <p style={{ fontSize: 15, color: '#A0A0A5', lineHeight: 1.5, margin: 0 }}>
                Your account has been blocked by an administrator. You can no longer access this application.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '12px',
                padding: '14px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
                marginTop: 8, fontFamily: 'inherit'
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      )}
      {/* ── Maintenance Mode Overlay ── */}
      {isMaintenanceMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'linear-gradient(135deg, #0a0a0f 0%, #0C0C14 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
          fontFamily: "'Outfit','Inter',sans-serif", color: '#fff', textAlign: 'center', padding: 32,
        }}>
          <div style={{ fontSize: 56 }}>🔧</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Under Maintenance</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 380, lineHeight: 1.7 }}>
            {adminSettings?.maintenanceMessage || 'We are performing scheduled maintenance. Please check back soon.'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Mushi QR Pro</div>
        </div>
      )}
      {/* ── Premium Paywall Modal ── */}
      <PremiumModal />
      {/* ── Admin Announcement Banner ── */}
      {adminAnnouncement?.active && adminAnnouncement?.message && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
          background: adminAnnouncement.type === 'error' ? '#D60036' :
                      adminAnnouncement.type === 'warning' ? '#f59e0b' :
                      adminAnnouncement.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#fff', padding: 'calc(10px + env(safe-area-inset-top)) 20px 10px', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          fontFamily: "'Outfit','Inter',sans-serif",
        }}>
          <span>{adminAnnouncement.title && <strong>{adminAnnouncement.title}: </strong>}{adminAnnouncement.message}</span>
          <button onClick={() => setAdminAnnouncement(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>
      )}
      {/* ── Header ── */}
      <header 
        className={`app-header ${['home', 'saved', 'history', 'you', 'settings'].includes(activePage) ? 'header-home' : ''} ${activePage === 'home' && !isHomeScrolled ? 'header-home-banner' : ''}`}
        style={{ display: ['barcode', 'onboarding', 'login', 'signup', 'forgot-password'].includes(activePage) ? 'none' : 'flex' }}
      >
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
          <AppIcon size={46} noBackground />
          {activePage === 'generator' ? (
            <div className="header-undo-redo" style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
              <button 
                onClick={undo} 
                disabled={historyIndex <= 0}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: 'var(--bg-hover)', 
                  border: '1px solid var(--border-color)', 
                  color: historyIndex <= 0 ? 'var(--text-tertiary)' : 'var(--text-secondary, #636366)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: historyIndex <= 0 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: historyIndex <= 0 ? 0.5 : 1
                }}
                title="Undo"
              >
                <Undo2 size={16} strokeWidth={2.5} />
              </button>
              <button 
                onClick={redo} 
                disabled={historyIndex >= history.length - 1}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: 'var(--bg-hover)', 
                  border: '1px solid var(--border-color)', 
                  color: historyIndex >= history.length - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary, #636366)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1
                }}
                title="Redo"
              >
                <Redo2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="app-logo-text" style={{ whiteSpace: 'nowrap' }}>Mushi QR <span>Pro</span></div>
          )}
        </div>
        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activePage === 'generator' && (
            <>
              {activeBatchItemIndex !== null ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      const currentStyle = getSnapshot();
                      const updated = batchItems.map(item => ({
                        ...item,
                        style: currentStyle
                      }));
                      setBatchItems(updated);
                      generatorIsDirtyRef.current = false;
                      setActiveBatchItemIndex(null);
                      navigateTo('batch');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #D6003D 0%, #FF2E63 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Apply to All
                  </button>
                  <button 
                    onClick={() => {
                      const updated = [...batchItems];
                      updated[activeBatchItemIndex] = {
                        ...updated[activeBatchItemIndex],
                        style: getSnapshot()
                      };
                      setBatchItems(updated);
                      generatorIsDirtyRef.current = false;
                      setActiveBatchItemIndex(null);
                      navigateTo('batch', 'QR');
                    }}
                    style={{
                      background: 'var(--bg-hover, #F2F2F7)',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                      color: 'var(--text-primary, #1C1C1E)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    This Only
                  </button>
                  <button 
                    onClick={() => {
                      generatorIsDirtyRef.current = false;
                      setActiveBatchItemIndex(null);
                      navigateTo('batch', 'QR');
                    }}
                    style={{
                      background: 'var(--bg-hover, rgba(0,0,0,0.04))',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                      color: 'var(--text-secondary, #8E8E93)',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                    title="Cancel"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="header-save-container" ref={downloadBtnRef} style={{ position: 'relative' }}>
                  <div
                    className={`save-split-header-btn ${!qrMatrixInfo ? 'disabled' : ''} ${formatDropdownOpen ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--accent-gradient)',
                      borderRadius: '12px',
                      padding: '2px',
                      boxShadow: '0 4px 14px rgba(214, 0, 54, 0.25)',
                      height: '38px',
                      opacity: !qrMatrixInfo ? 0.5 : 1,
                      pointerEvents: !qrMatrixInfo ? 'none' : 'auto'
                    }}
                  >
                    {/* Main Button: Save using selected format and quality */}
                    <button
                      onClick={() => {
                        const format = selectedFormat || 'PNG';
                        handleDownload(format, FORMAT_MAP[format]);
                      }}
                      disabled={!qrMatrixInfo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        height: '100%'
                      }}
                      title={`Save as ${selectedFormat || 'PNG'} (${exportQuality || 'Normal'} Quality)`}
                    >
                      <Save size={16} color="#FFFFFF" />
                      <span>Save</span>
                    </button>
                    {/* Vertical Separation Line */}
                    <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.35)', flexShrink: 0 }} />
                    {/* Chevron Dropdown Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormatDropdownOpen(!formatDropdownOpen);
                      }}
                      disabled={!qrMatrixInfo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0 8px',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                      title="Export Options"
                    >
                      <ChevronDown size={14} style={{ transform: formatDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  </div>
                {formatDropdownOpen && (
                  <div className="app-dropdown-menu save-as-dropdown fade-in" style={{ top: 'calc(100% + 12px)', right: 0, width: '280px' }}>
                    
                    <div className="dropdown-section" style={{ padding: '12px' }}>
                      <div className="dropdown-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Export Format</div>
                      <div className="format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'PNG', featId: 'export_png', Icon: FileImage },
                          { label: 'SVG', featId: 'export_svg', Icon: FileCode },
                          { label: 'PDF', featId: 'export_pdf', Icon: FileText },
                          { label: 'JPG', featId: 'export_jpg', Icon: FileImage },
                        ].filter(item => FeatureAccessManager.isFeatureEnabled(item.featId)).map(({ label, featId, Icon }) => (
                          <button
                            key={label}
                            className={`format-option ${selectedFormat === label ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const access = FeatureAccessManager.canUseFeature(featId);
                              if (!access.allowed) {
                                showPaywall(featId);
                                return;
                              }
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
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}
                          >
                            <PaidCrownBadge featureId={featId} position="floating" size={8} />
                            <Icon size={24} />
                            <span style={{ fontSize: '10px', fontWeight: 700 }}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="dropdown-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />
                    <div className="dropdown-section" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div className="dropdown-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Export Quality</div>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 800, 
                          color: 'var(--accent-primary)',
                          background: 'var(--accent-soft)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(214, 0, 54, 0.15)',
                          letterSpacing: '0.5px'
                        }}>
                          {exportQuality === 'Low' && '512px'}
                          {exportQuality === 'Medium' && '1024px'}
                          {exportQuality === 'High' && '2048px'}
                          {exportQuality === 'Ultra' && '4096px'}
                        </span>
                      </div>
                      <div style={{ padding: '0 8px', marginTop: '12px', marginBottom: '8px' }}>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={['Low', 'Medium', 'High', 'Ultra'].indexOf(exportQuality)}
                          onChange={(e) => {
                            const steps = ['Low', 'Medium', 'High', 'Ultra'];
                            const featMap = {
                              'Low': 'export_quality_low',
                              'Medium': 'export_quality_medium',
                              'High': 'export_quality_hd',
                              'Ultra': 'export_quality_ultra'
                            };
                            const selected = steps[parseInt(e.target.value)] || 'High';
                            const targetFeat = featMap[selected];
                            if (targetFeat) {
                              const access = FeatureAccessManager.canUseFeature(targetFeat);
                              if (!access.allowed) {
                                showPaywall(targetFeat);
                                return;
                              }
                            }
                            setExportQuality(selected);
                          }}
                          className="export-quality-slider"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          <span style={{ position: 'relative' }}>
                            Low <PaidCrownBadge featureId="export_quality_low" position="floating" size={7} />
                          </span>
                          <span style={{ position: 'relative' }}>
                            Normal <PaidCrownBadge featureId="export_quality_medium" position="floating" size={7} />
                          </span>
                          <span style={{ position: 'relative' }}>
                            HD <PaidCrownBadge featureId="export_quality_hd" position="floating" size={7} />
                          </span>
                          <span style={{ position: 'relative' }}>
                            4K <PaidCrownBadge featureId="export_quality_ultra" position="floating" size={7} />
                          </span>
                        </div>
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
                        {((typeof navigator !== 'undefined' && navigator.canShare) || Capacitor.isNativePlatform()) && (
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
              )}
              <div className="menu-container" ref={menuRef} style={{ position: 'relative' }}>
                {!(activeBatchItemIndex !== null && activeBatchItemIndex !== undefined) && (
                  <button
                    className={`btn-menu-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    <Menu size={20} />
                  </button>
                )}
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
                      <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
                      <button
                        className="menu-link-btn"
                        onClick={() => {
                          setIsFolderModalOpen(true);
                          setIsMenuOpen(false);
                          setAuthDropdownOpen(false);
                        }}
                      >
                        <Folder size={16} /> Save Location
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* ── Auth Avatar / Sign-In Button (always visible in header) ── */}
          {!['generator'].includes(activePage) && (
            <div style={{ position: 'relative' }} ref={authDropdownRef}>
              {currentUser ? (
                <button
                  onClick={() => setAuthDropdownOpen(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '0',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  aria-label="Account"
                >
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <UserAvatar user={currentUser} size={36} border="2px solid var(--accent-primary)" />
                    {isSuperAdmin && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        zIndex: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GoldenAdminBadge size={13} />
                      </div>
                    )}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('login')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(214,0,54,0.35)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                  aria-label="Sign In / Create Account"
                >
                  <User size={15} color="#fff" />
                  <span>Sign In</span>
                </button>
              )}
              {authDropdownOpen && currentUser && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: 'var(--bg-elevated, #0C0C14)', border: '1px solid var(--border-color)',
                    borderRadius: '28px', width: '335px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)', zIndex: 999,
                    overflow: 'hidden',
                    animation: 'dropdownFadeIn 0.18s ease',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                    {/* Profile Header */}
                    <div style={{ padding: '24px 20px 18px', background: 'var(--bg-elevated, #0C0C14)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                          <UserAvatar user={currentUser} size={56} border="2px solid var(--border-color)" />
                          {isSuperAdmin && (
                            <div style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              zIndex: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <GoldenAdminBadge size={24} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          {isEditingProfileName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                autoFocus
                                value={editProfileNameText}
                                onChange={e => setEditProfileNameText(e.target.value)}
                                onKeyDown={async e => {
                                  if (e.key === 'Enter') {
                                    if (editProfileNameText.trim() !== '') {
                                      try {
                                        const { updateProfile: fbUpdateProfile } = await import('firebase/auth');
                                        await fbUpdateProfile(auth.currentUser, { displayName: editProfileNameText.trim() });
                                        setIsEditingProfileName(false);
                                        showToast('Profile name updated successfully!');
                                      } catch (err) {
                                        console.error('Failed to update profile name', err);
                                        showToast('Failed to update profile name.');
                                      }
                                    }
                                  } else if (e.key === 'Escape') {
                                    setIsEditingProfileName(false);
                                  }
                                }}
                                style={{
                                  flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                  borderRadius: '8px', color: 'var(--text-primary)', padding: '4px 8px',
                                  fontSize: '13px', outline: 'none', minWidth: 0
                                }}
                              />
                              <button
                                onClick={async e => {
                                  e.stopPropagation();
                                  if (editProfileNameText.trim() !== '') {
                                    try {
                                      const { updateProfile: fbUpdateProfile } = await import('firebase/auth');
                                      await fbUpdateProfile(auth.currentUser, { displayName: editProfileNameText.trim() });
                                      setIsEditingProfileName(false);
                                      showToast('Profile name updated successfully!');
                                    } catch (err) {
                                      console.error('Failed to update profile name', err);
                                      showToast('Failed to update profile name.');
                                    }
                                  }
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                title="Save Name"
                              >
                                <Check size={16} color="#10B981" />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser.displayName || 'Mushi User'}
                              </span>
                              {isSuperAdmin && (
                                <GoldenAdminBadge size={15} />
                              )}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '3px' }}>
                            {currentUser.email || currentUser.providerData?.[0]?.email || 'User Account'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Menu Options */}
                    <div style={{ padding: '10px' }}>
                      {/* My Profile */}
                      <button 
                        onClick={() => { setProfileNameInput(currentUser.displayName || ''); setNewProfilePicUrl(currentUser.photoURL || ''); setIsProfileModalOpen(true); setAuthDropdownOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                          background: 'transparent', border: 'none', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={24} color="#EC4899" />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>View and edit your profile</div>
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </button>
                      {/* Cloud Sync */}
                      <button 
                        onClick={() => {
                          setIsCloudSyncModalOpen(true);
                          setAuthDropdownOpen(false);
                        }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                          background: 'transparent', border: 'none', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Cloud size={24} color="#3B82F6" />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>Cloud Sync</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Sync saved &amp; history data</div>
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </button>
                      {/* Security & Login */}
                      <button 
                        onClick={() => { setNewPassword(''); setConfirmPassword(''); setIsSecurityModalOpen(true); setAuthDropdownOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                          background: 'transparent', border: 'none', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Lock size={24} color="#8B5CF6" />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>Security &amp; Login</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Manage login, password &amp; 2FA</div>
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </button>
                      {/* Sign Out */}
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 12px' }} />
                      <button
                        onClick={async () => {
                          setAuthDropdownOpen(false);
                          const { signOut: fbSignOut } = await import('firebase/auth');
                          await fbSignOut(auth);
                          try {
                            const { Capacitor } = await import('@capacitor/core');
                            if (Capacitor.isNativePlatform()) {
                              const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                              await FirebaseAuthentication.signOut();
                            }
                          } catch (e) {
                            console.warn('Native sign out error:', e);
                          }
                          navigateTo('login');
                        }}
                        style={{
                           width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                           background: 'transparent', border: 'none', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                           transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LogOut size={24} color="#EF4444" />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#EF4444' }}>Sign Out</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Sign out from your account</div>
                        </div>
                      </button>
                    </div>
                  </div>
              )}
            </div>
          )}
        </div>
      </header>
      {/* ── Main Content Area ── */}
      <main className="app-main-redesigned">
        {activePage === 'generator' ? (
          <>
            {/* ── QR Preview Card (always visible) ── */}
            <ErrorBoundary>
              <section className="qr-preview-card" style={{ position: 'relative' }}>
                {qrMatrixInfo && (
                  <button
                    type="button"
                    onClick={() => setIsFullScreenPreviewOpen(true)}
                    title="Full Screen Preview (Pinch to Zoom)"
                    aria-label="Full Screen Preview"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 20,
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--bg-elevated, rgba(15, 23, 42, 0.85))',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                      color: 'var(--text-primary, #FFFFFF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary, #FF2A55)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))';
                    }}
                  >
                    <Maximize2 size={18} />
                  </button>
                )}
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
                      onDoubleClick={handleCanvasDoubleClick}
                      style={{ 
                        willChange: 'transform',
                        cursor: isDraggingCanvas ? 'grabbing' : (logo?.image || textCenterEnabled ? 'move' : (selectedTemplate ? 'pointer' : 'default')),
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
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '16px 20px 100px 20px', display: 'flex', flexDirection: 'column' }}>
                    <QRTypeSelector
                      activeType={qrType}
                      onTypeChange={(type) => {
                        const access = FeatureAccessManager.canUseFeature(`qr_${type.toLowerCase()}`);
                        if (!access.allowed) {
                          showPaywall(`qr_${type.toLowerCase()}`);
                          return;
                        }
                        setQrType(type);
                        setQrData(prev => (prev?.url === 'https://example.com' || prev?.url === 'http://example.com') ? {} : prev);
                        generatorIsDirtyRef.current = true;
                        setIsDataModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              )}
              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="tab-panel fade-in" id="panel-logo">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '16px 20px 100px 20px' }}>
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
                        // Keep background box disabled so logo sits cleanly on the QR code without a background box
                        setLogoBackground(false);
                        setLogoPadding(0);
                        startEditing('logo', 'size'); 
                      }} 
                      onLogoRemove={() => { 
                        setLogo(null); 
                        setLogoWidth(0.18);
                        setLogoHeight(0.18);
                        setLogoRotation(0);
                        setLogoBackground(false);
                        if (logoPopup) cancelEditing(); 
                      }} 
                    />
                  </div>
                </div>
              )}
              {/* Template Tab */}
              {activeTab === 'template' && (
                <div className="tab-panel fade-in" id="panel-template">
                  <div className="panel-scroll-area" style={{ flex: '1', overflowY: 'auto', padding: '16px 20px 100px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Template Gallery */}
                    <TemplateGallery
                      templates={ALL_TEMPLATES}
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={applyTemplate}
                      qrMatrixInfo={qrMatrixInfo}
                      currentQrOptions={galleryQrOptions}
                      headlineText={templateHeadlineText}
                      handleText={templateHandleText}
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
                               {renderColorOrGradientPicker("Stroke Color", logoOutlineColor, setLogoOutlineColor, handleOpenAdv)}
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
                                {LOGO_BG_SHAPES.map(shape => {
                                  const isActive = logoBgShape === shape.id;
                                  return (
                                                                    <button 
                                      key={shape.id} 
                                      onClick={() => setLogoBgShape(shape.id)}
                                      className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                      style={{ 
                                        flex: '0 0 auto', 
                                        padding: '4px', 
                                        borderRadius: '14px', 
                                        background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)', 
                                        color: isActive ? '#fff' : 'var(--text-primary)', 
                                        border: '2px solid', 
                                        borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.2s ease', 
                                        boxShadow: isActive ? '0 4px 12px rgba(255,59,48,0.3)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '64px',
                                        height: '64px'
                                      }}
                                      title={shape.label}
                                    >
                                      {renderShapeThumbnail(shape.id, isActive ? '#ffffff' : 'var(--text-primary)')}
                                    </button>
                                  );
                                })}
                              </div>
                               {renderColorOrGradientPicker("Background Color", logoBgColor, setLogoBgColor, handleOpenAdv)}
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
                               <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>Shadow Color</div>
                                 <div className="swatch-grid-mini">
                                   <ColorPicker isSwatch={true} icon={Pipette} value={logoShadowColor} onChange={setLogoShadowColor} onOpenAdvanced={handleOpenAdv} />
                                   {SWATCH_PRESETS.map(color => (
                                     <div key={color} className={`swatch-item${logoShadowColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setLogoShadowColor(color)} />
                                   ))}
                                 </div>
                               </div>
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
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Method</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => {
                                  setLogoEraseColorEnabled(false);
                                  setLogoEraseMode('none');
                                }}
                                className={`seg-btn ${logoEraseMode === 'none' || !logoEraseColorEnabled ? 'active' : ''}`}
                                style={{ flex: '1', padding: '10px', fontSize: '12px' }}
                              >
                                Keep BG
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoEraseColorEnabled(true);
                                  setLogoEraseColor('#ffffff');
                                  setLogoEraseMode('white');
                                }}
                                className={`seg-btn ${logoEraseColorEnabled && logoEraseMode === 'white' ? 'active' : ''}`}
                                style={{ flex: '1', padding: '10px', fontSize: '12px' }}
                              >
                                Remove White
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoEraseColorEnabled(true);
                                  setLogoEraseColor('#000000');
                                  setLogoEraseMode('black');
                                }}
                                className={`seg-btn ${logoEraseColorEnabled && logoEraseMode === 'black' ? 'active' : ''}`}
                                style={{ flex: '1', padding: '10px', fontSize: '12px' }}
                              >
                                Remove Black
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoEraseColorEnabled(true);
                                  setLogoEraseMode('custom');
                                  // Default to red if color is white or black to show custom picker
                                  if (logoEraseColor.toLowerCase() === '#ffffff' || logoEraseColor.toLowerCase() === '#000000') {
                                    setLogoEraseColor('#ff0000');
                                  }
                                }}
                                className={`seg-btn ${logoEraseColorEnabled && logoEraseMode === 'custom' ? 'active' : ''}`}
                                style={{ flex: '1', padding: '10px', fontSize: '12px' }}
                              >
                                Custom Color
                              </button>
                            </div>
                          </div>
                          {logoEraseColorEnabled && (
                            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {logoEraseMode === 'custom' && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>Select Target Color</div>
                                  <div className="swatch-grid-mini">
                                    <ColorPicker isSwatch={true} icon={Pipette} value={logoEraseColor} onChange={setLogoEraseColor} onOpenAdvanced={handleOpenAdv} />
                                    {SWATCH_PRESETS.map(color => (
                                      <div key={color} className={`swatch-item${logoEraseColor === color ? ' active' : ''}`} style={{ backgroundColor: color }} onClick={() => setLogoEraseColor(color)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <Slider 
                                label="Sensitivity (Tolerance)" 
                                value={logoEraseTolerance} 
                                min={5} 
                                max={150} 
                                step={1} 
                                onChange={logoEraseTolerance => setLogoEraseTolerance(logoEraseTolerance)} 
                              />
                              <Slider 
                                label="Edge Smoothing (Feather)" 
                                value={logoEraseSmoothing} 
                                min={0} 
                                max={80} 
                                step={1} 
                                onChange={logoEraseSmoothing => setLogoEraseSmoothing(logoEraseSmoothing)} 
                              />
                              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                                Drag sliders to adjust how cleanly the background color is removed.
                              </p>
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
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>Logo Shape Mask</span>
                             {logo?.src && (
                               <button
                                 onClick={() => {
                                   setCropModalConfig({
                                     isOpen: true,
                                     imageSrc: logo.src,
                                     imageName: logo.name || 'logo.png',
                                     title: 'Interactive 1:1 Logo Cropper',
                                     initialShape: logoCrop !== 'none' ? logoCrop : 'rounded',
                                     onConfirm: ({ image, src, name, shape }) => {
                                       setLogo(prev => ({ ...prev, image, src, name }));
                                       setLogoCrop(shape);
                                       setCropModalConfig(null);
                                     }
                                   });
                                 }}
                                 style={{
                                   background: 'var(--accent-soft, rgba(214, 0, 54, 0.15))',
                                   border: '1px solid var(--accent-primary)',
                                   borderRadius: '10px',
                                   padding: '4px 10px',
                                   color: 'var(--accent-primary)',
                                   fontSize: '12px',
                                   fontWeight: 700,
                                   cursor: 'pointer',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '4px'
                                 }}
                               >
                                 <Crop size={13} />
                                 <span>Custom 1:1 Crop</span>
                               </button>
                             )}
                           </div>
                           <div style={{
                             display: 'flex',
                             gap: '8px',
                             overflowX: 'auto',
                             padding: '4px 0 8px 0',
                             scrollbarWidth: 'none',
                             msOverflowStyle: 'none',
                             WebkitOverflowScrolling: 'touch'
                           }}>
                             <button 
                               className={`seg-btn ${logoCrop === 'none' ? 'active' : ''}`} 
                               onClick={() => setLogoCrop('none')}
                               style={{ flex: '0 0 auto', padding: '8px 14px', borderRadius: '12px' }}
                             >
                               None
                             </button>
                             {SHAPE_OPTIONS.map(s => {
                               const isActive = logoCrop === s.id;
                               const ShapeIcon = s.icon;
                               return (
                                 <button
                                   key={s.id}
                                   onClick={() => setLogoCrop(s.id)}
                                   style={{
                                     flex: '0 0 auto',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '6px',
                                     padding: '8px 14px',
                                     borderRadius: '12px',
                                     background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                     color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                                     border: '1px solid',
                                     borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)',
                                     cursor: 'pointer',
                                     fontSize: '13px',
                                     fontWeight: isActive ? 700 : 500,
                                     transition: 'all 0.18s ease'
                                   }}
                                 >
                                   <ShapeIcon size={16} />
                                   <span>{s.label}</span>
                                 </button>
                               );
                             })}
                           </div>
                        </div>
                      )}
                      {/* TEXT PROPERTIES */}
                      {textPopup === 'input' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Add Text Layer Action Header */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const newId = addCustomText({
                                  text: 'SCAN ME',
                                  posX: 0.5,
                                  posY: 0.5,
                                  size: 0.08,
                                  font: 'Outfit',
                                  color: '#000000'
                                });
                                setCanvasSelection('custom-text-' + newId);
                                setTextEditMode('custom-' + newId);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '14px',
                                background: 'var(--accent-primary)',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(214, 0, 54, 0.25)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Plus size={18} />
                              <span>+ Add Text Layer</span>
                            </button>
                          </div>

                          {/* Text Layer Switcher Chips */}
                          {(customTexts.length > 0 || selectedTemplate || textCenterEnabled || frameStyle !== 'none') && (
                            <div style={{
                              display: 'flex',
                              gap: '6px',
                              overflowX: 'auto',
                              padding: '2px 0 6px 0',
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                              WebkitOverflowScrolling: 'touch'
                            }}>
                              {customTexts.map((ct, idx) => {
                                const isSel = canvasSelection === 'custom-text-' + ct.id;
                                return (
                                  <button
                                    key={ct.id}
                                    type="button"
                                    onClick={() => {
                                      setCanvasSelection('custom-text-' + ct.id);
                                      setTextEditMode('custom-' + ct.id);
                                    }}
                                    style={{
                                      flex: '0 0 auto',
                                      padding: '6px 12px',
                                      borderRadius: '10px',
                                      border: '1px solid',
                                      borderColor: isSel ? 'var(--accent-primary)' : 'var(--border-color)',
                                      background: isSel ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                      color: isSel ? '#FFFFFF' : 'var(--text-primary)',
                                      fontSize: '12px',
                                      fontWeight: isSel ? 700 : 500,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <span>{ct.text ? `"${ct.text.slice(0, 10)}"` : `Text ${idx + 1}`}</span>
                                  </button>
                                );
                              })}
                              {selectedTemplate && selectedTemplate.styleFamily !== 'vcard' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCanvasSelection('template-headline');
                                      setTextEditMode('template-top');
                                    }}
                                    style={{
                                      flex: '0 0 auto',
                                      padding: '6px 12px',
                                      borderRadius: '10px',
                                      border: '1px solid',
                                      borderColor: textEditMode === 'template-top' ? 'var(--accent-primary)' : 'var(--border-color)',
                                      background: textEditMode === 'template-top' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                      color: textEditMode === 'template-top' ? '#FFFFFF' : 'var(--text-primary)',
                                      fontSize: '12px',
                                      fontWeight: textEditMode === 'template-top' ? 700 : 500,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Top Headline
                                  </button>
                                  {selectedTemplate.styleFamily !== 'frame' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCanvasSelection('template-handle');
                                        setTextEditMode('template-bottom');
                                      }}
                                      style={{
                                        flex: '0 0 auto',
                                        padding: '6px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid',
                                        borderColor: textEditMode === 'template-bottom' ? 'var(--accent-primary)' : 'var(--border-color)',
                                        background: textEditMode === 'template-bottom' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                        color: textEditMode === 'template-bottom' ? '#FFFFFF' : 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: textEditMode === 'template-bottom' ? 700 : 500,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Bottom Handle
                                    </button>
                                  )}
                                </>
                              )}
                              {textCenterEnabled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCanvasSelection('text');
                                    setTextEditMode('center');
                                  }}
                                  style={{
                                    flex: '0 0 auto',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: textEditMode === 'center' ? 'var(--accent-primary)' : 'var(--border-color)',
                                    background: textEditMode === 'center' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                    color: textEditMode === 'center' ? '#FFFFFF' : 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: textEditMode === 'center' ? 700 : 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Center Text
                                </button>
                              )}
                              {frameStyle !== 'none' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCanvasSelection('frame-text');
                                    setTextEditMode('frame');
                                  }}
                                  style={{
                                    flex: '0 0 auto',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: textEditMode === 'frame' ? 'var(--accent-primary)' : 'var(--border-color)',
                                    background: textEditMode === 'frame' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                    color: textEditMode === 'frame' ? '#FFFFFF' : 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: textEditMode === 'frame' ? 700 : 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Frame Text
                                </button>
                              )}
                            </div>
                          )}

                          {/* ACTIVE CUSTOM TEXT EDITOR */}
                          {activeCustomText && (
                            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
                                  Custom Text Layer
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addCustomText({
                                        ...activeCustomText,
                                        id: undefined,
                                        posX: Math.min(0.9, (activeCustomText.posX || 0.5) + 0.05),
                                        posY: Math.min(0.9, (activeCustomText.posY || 0.5) + 0.05)
                                      });
                                    }}
                                    style={{
                                      background: 'var(--bg-primary)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      padding: '4px 8px',
                                      color: 'var(--text-secondary)',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeCustomText(activeCustomText.id);
                                      setCanvasSelection(null);
                                    }}
                                    style={{
                                      background: 'rgba(255, 59, 48, 0.1)',
                                      border: '1px solid rgba(255, 59, 48, 0.3)',
                                      borderRadius: '8px',
                                      padding: '4px 8px',
                                      color: '#ff3b30',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                              <input 
                                type="text" 
                                maxLength={60} 
                                value={activeCustomText.text || ''} 
                                onChange={(e) => updateCustomText(activeCustomText.id, { text: e.target.value, width: null, height: null })} 
                                placeholder="Type your text..." 
                                className="text-input-premium" 
                                style={{ width: '100%', borderColor: 'var(--accent-primary)' }} 
                              />
                            </div>
                          )}

                          {/* TEMPLATE HEADLINE (TOP TEXT) */}
                          {selectedTemplate && (textEditMode === 'template-top' || (!activeCustomText && textEditMode !== 'center' && textEditMode !== 'frame' && textEditMode !== 'template-bottom')) && selectedTemplate.styleFamily !== 'vcard' && (
                            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Top Headline Text ({selectedTemplate.name})
                                </span>
                                {(templateHeadlineText !== (selectedTemplate.headline || selectedTemplate.defaultHeadline || selectedTemplate.labelText || '')) && (
                                  <button
                                    type="button"
                                    onClick={() => setTemplateHeadlineText(selectedTemplate.headline || selectedTemplate.defaultHeadline || selectedTemplate.labelText || '')}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                maxLength={40}
                                value={templateHeadlineText}
                                onChange={(e) => setTemplateHeadlineText(e.target.value)}
                                placeholder={selectedTemplate.headline || selectedTemplate.defaultHeadline || selectedTemplate.labelText || 'Type top headline...'}
                                className="text-input-premium"
                                style={{ width: '100%', textTransform: 'uppercase' }}
                              />
                            </div>
                          )}

                          {/* TEMPLATE SUBTITLE / HANDLE (BOTTOM TEXT) */}
                          {selectedTemplate && (textEditMode === 'template-bottom' || (!activeCustomText && textEditMode !== 'center' && textEditMode !== 'frame' && textEditMode === 'template-bottom')) && selectedTemplate.styleFamily !== 'frame' && selectedTemplate.styleFamily !== 'vcard' && (
                            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Bottom Subtitle / Handle ({selectedTemplate.name})
                                </span>
                                {(templateHandleText !== (selectedTemplate.subtitle || selectedTemplate.defaultHandle || selectedTemplate.handle || '')) && (
                                  <button
                                    type="button"
                                    onClick={() => setTemplateHandleText(selectedTemplate.subtitle || selectedTemplate.defaultHandle || selectedTemplate.handle || '')}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                maxLength={40}
                                value={templateHandleText}
                                onChange={(e) => setTemplateHandleText(e.target.value)}
                                placeholder={selectedTemplate.subtitle || selectedTemplate.defaultHandle || selectedTemplate.handle || 'Type bottom subtitle/handle...'}
                                className="text-input-premium"
                                style={{ width: '100%' }}
                              />
                            </div>
                          )}

                          {/* CENTER TEXT */}
                          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Toggle
                              label={
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: textEditMode === 'center' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--border-color)', display: 'inline-block', flexShrink: 0 }} />
                                  Center Text
                                </span>
                              }
                              checked={textCenterEnabled}
                              onChange={(val) => {
                                setTextCenterEnabled(val);
                                if (val) {
                                  setLogo(null);
                                  setLogoWidth(0.18);
                                  setLogoHeight(0.18);
                                  setLogoRotation(0);
                                  setTextCenterWidth(null);
                                  setTextCenterHeight(null);
                                  setTextEditMode('center');
                                  setCanvasSelection('text');
                                } else {
                                  if (canvasSelection === 'text') setCanvasSelection(null);
                                }
                              }}
                            />
                            {textCenterEnabled && (
                              <input 
                                id="center-text-input"
                                type="text" 
                                maxLength={18} 
                                value={textCenterText} 
                                onChange={(e) => {
                                  setTextCenterText(e.target.value);
                                  setTextCenterWidth(null);
                                  setTextCenterHeight(null);
                                }} 
                                onFocus={() => {
                                  setTextEditMode('center');
                                  setCanvasSelection('text');
                                }}
                                placeholder="Type center text..." 
                                className="text-input-premium" 
                                style={{ width: '100%', borderColor: textEditMode === 'center' ? 'var(--accent-primary)' : 'var(--border-color)' }} 
                              />
                            )}
                          </div>

                          {/* FRAME TEXT */}
                          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Toggle
                              label={
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: textEditMode === 'frame' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--border-color)', display: 'inline-block', flexShrink: 0 }} />
                                  Frame Text
                                </span>
                              }
                              checked={frameStyle !== 'none'}
                              onChange={(val) => {
                                setFrameStyle(val ? (frameStyle === 'none' ? 'text' : frameStyle) : 'none');
                                if (val) {
                                  setTextEditMode('frame');
                                  setCanvasSelection('frame-text');
                                } else {
                                  if (canvasSelection === 'frame-text') setCanvasSelection(null);
                                }
                              }}
                            />
                            {frameStyle !== 'none' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input 
                                  id="frame-text-input"
                                  type="text" 
                                  maxLength={50} 
                                  value={frameText} 
                                  onChange={(e) => setFrameText(e.target.value)} 
                                  onFocus={() => {
                                    setTextEditMode('frame');
                                    setCanvasSelection('frame-text');
                                  }}
                                  placeholder="Type frame text..." 
                                  className="text-input-premium" 
                                  style={{ width: '100%', borderColor: textEditMode === 'frame' ? 'var(--accent-primary)' : 'var(--border-color)' }} 
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Position</span>
                                  <div className="seg-control" style={{ width: '150px', height: '32px', display: 'flex' }}>
                                    <button 
                                      type="button"
                                      className={`seg-btn ${framePosition === 'top' ? 'active' : ''}`} 
                                      onClick={() => setFramePosition('top')}
                                      style={{ flex: 1, padding: '2px 8px', fontSize: '11px' }}
                                    >
                                      Top
                                    </button>
                                    <button 
                                      type="button"
                                      className={`seg-btn ${framePosition === 'bottom' ? 'active' : ''}`} 
                                      onClick={() => setFramePosition('bottom')}
                                      style={{ flex: 1, padding: '2px 8px', fontSize: '11px' }}
                                    >
                                      Bottom
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {textPopup === 'fonts' && (
                        <div className="fade-in">
                          <button onClick={() => fontInputRef.current?.click()} className="font-scroll-btn-wide"><Plus size={14} /> Add Font</button>
                          <input type="file" ref={fontInputRef} style={{ display: 'none' }} accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} />
                          <div className="fonts-grid">
                            {customFonts.map(font => {
                              const isFontActive = activeCustomText 
                                ? activeCustomText.font === font.id 
                                : (textEditMode === 'template-top' || textEditMode === 'template-bottom' || selectedTemplate)
                                  ? templateFont === font.id
                                  : (textEditMode === 'center' ? textCenterFont === font.id : frameFont === font.id);
                              return (
                                <button 
                                  key={font.id} 
                                  onClick={() => {
                                    if (activeCustomText) {
                                      updateCustomText(activeCustomText.id, { font: font.id });
                                    } else if (textEditMode === 'template-top' || textEditMode === 'template-bottom' || selectedTemplate) {
                                      setTemplateFont(font.id);
                                    } else if (textEditMode === 'center') {
                                      setTextCenterFont(font.id);
                                    } else {
                                      setFrameFont(font.id);
                                      if (frameStyle === 'none') setFrameStyle('text');
                                    }
                                  }} 
                                  className={`font-btn ${isFontActive ? 'active' : ''}`} 
                                  style={{ fontFamily: font.id }}
                                >
                                  {font.label} ★
                                </button>
                              );
                            })}
                            {FONT_OPTIONS
                              .filter(font => FeatureAccessManager.isFeatureEnabled(`qr_font_${font.id}`))
                              .map(font => {
                                const featId = `qr_font_${font.id}`;
                                const isFontActive = activeCustomText 
                                  ? activeCustomText.font === font.id 
                                  : (textEditMode === 'template-top' || textEditMode === 'template-bottom' || selectedTemplate)
                                    ? templateFont === font.id
                                    : (textEditMode === 'center' ? textCenterFont === font.id : frameFont === font.id);
                                return (
                                  <button 
                                    key={font.id} 
                                    onClick={() => {
                                      const access = FeatureAccessManager.canUseFeature(featId);
                                      if (!access.allowed) {
                                        showPaywall(featId);
                                        return;
                                      }
                                      if (activeCustomText) {
                                        updateCustomText(activeCustomText.id, { font: font.id });
                                      } else if (textEditMode === 'template-top' || textEditMode === 'template-bottom' || selectedTemplate) {
                                        setTemplateFont(font.id);
                                      } else if (textEditMode === 'center') {
                                        setTextCenterFont(font.id);
                                      } else {
                                        setFrameFont(font.id);
                                        if (frameStyle === 'none') setFrameStyle('text');
                                      }
                                    }} 
                                    className={`font-btn ${isFontActive ? 'active' : ''}`} 
                                    style={{ fontFamily: font.id, position: 'relative' }}
                                  >
                                    <PaidCrownBadge featureId={featId} fallbackFeatureId="qr_text_fonts" position="corner" size={9} />
                                    {font.label}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {textPopup === 'size' && (
                        <div className="fade-in">
                          {activeCustomText ? (
                            <Slider 
                              label="Text Size" 
                              min={2} 
                              max={100} 
                              step={1} 
                              value={Math.round((((activeCustomText.size || 0.08) - 0.02) / 0.33) * 98 + 2)} 
                              onChange={(val) => {
                                const newSize = 0.02 + ((val - 2) / 98) * 0.33;
                                updateCustomText(activeCustomText.id, {
                                  size: Math.round(newSize * 1000) / 1000,
                                  width: null,
                                  height: null
                                });
                              }} 
                            />
                          ) : textEditMode === 'center' ? (
                            <Slider 
                              label="Size" 
                              min={2} 
                              max={100} 
                              step={1} 
                              value={Math.round(((textCenterSize - 0.02) / 0.33) * 98 + 2)} 
                              onChange={(val) => {
                                const newSize = 0.02 + ((val - 2) / 98) * 0.33;
                                setTextCenterSize(Math.round(newSize * 1000) / 1000);
                                setTextCenterWidth(null);
                                setTextCenterHeight(null);
                              }} 
                            />
                          ) : (
                            <Slider 
                              label="Size" 
                              min={0.02} 
                              max={0.18} 
                              step={0.01} 
                              value={frameSize} 
                              onChange={(val) => setFrameSize(val)} 
                            />
                          )}
                        </div>
                      )}

                      {textPopup === 'color' && (
                        <div className="fade-in">
                          {activeCustomText ? (
                            renderColorOrGradientPicker("Text Color", activeCustomText.color || '#000000', (col) => updateCustomText(activeCustomText.id, { color: col }), handleOpenAdv)
                          ) : textEditMode === 'center' ? (
                            renderColorOrGradientPicker("Text Color", textCenterColor, setTextCenterColor, handleOpenAdv)
                          ) : (
                            renderColorOrGradientPicker("Frame Color", frameColor, setFrameColor, handleOpenAdv)
                          )}
                        </div>
                      )}

                      {textPopup === 'stroke' && (
                        <div className="fade-in">
                          <Toggle 
                            label="Enable Stroke" 
                            checked={activeCustomText ? (activeCustomText.strokeEnabled || false) : (textEditMode === 'center' ? textCenterStrokeEnabled : frameStrokeEnabled)} 
                            onChange={(val) => {
                              if (activeCustomText) {
                                updateCustomText(activeCustomText.id, { strokeEnabled: val });
                              } else if (textEditMode === 'center') {
                                setTextCenterStrokeEnabled(val);
                              } else {
                                setFrameStrokeEnabled(val);
                              }
                            }} 
                          />
                          {(activeCustomText ? activeCustomText.strokeEnabled : (textEditMode === 'center' ? textCenterStrokeEnabled : frameStrokeEnabled)) && (
                            <div className="fade-in" style={{ marginTop: '14px' }}>
                              {activeCustomText ? (
                                renderColorOrGradientPicker("Stroke Color", activeCustomText.strokeColor || '#ffffff', (col) => updateCustomText(activeCustomText.id, { strokeColor: col }), handleOpenAdv)
                              ) : textEditMode === 'center' ? (
                                renderColorOrGradientPicker("Stroke Color", textCenterStrokeColor, setTextCenterStrokeColor, handleOpenAdv)
                              ) : (
                                renderColorOrGradientPicker("Stroke Color", frameStrokeColor, setFrameStrokeColor, handleOpenAdv)
                              )}
                              <div style={{ marginTop: '14px' }}>
                                <Slider 
                                  label="Stroke Width" 
                                  min={1} 
                                  max={100} 
                                  value={activeCustomText ? (activeCustomText.strokeWidth || 4) : (textEditMode === 'center' ? textCenterStrokeWidth : frameStrokeWidth)} 
                                  onChange={(val) => {
                                    if (activeCustomText) {
                                      updateCustomText(activeCustomText.id, { strokeWidth: val });
                                    } else if (textEditMode === 'center') {
                                      setTextCenterStrokeWidth(val);
                                    } else {
                                      setFrameStrokeWidth(val);
                                    }
                                  }} 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {textPopup === 'shadow' && (
                        <div className="fade-in">
                          <Toggle 
                            label="Enable Shadow" 
                            checked={activeCustomText ? (activeCustomText.shadowEnabled || false) : (textEditMode === 'center' ? textCenterShadowEnabled : frameShadowEnabled)} 
                            onChange={(val) => {
                              if (activeCustomText) {
                                updateCustomText(activeCustomText.id, { shadowEnabled: val });
                              } else if (textEditMode === 'center') {
                                setTextCenterShadowEnabled(val);
                              } else {
                                setFrameShadowEnabled(val);
                              }
                            }} 
                          />
                          {(activeCustomText ? activeCustomText.shadowEnabled : (textEditMode === 'center' ? textCenterShadowEnabled : frameShadowEnabled)) && (
                            <div className="fade-in" style={{ marginTop: '14px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Shadow Color</div>
                              <div className="swatch-grid-mini" style={{ marginBottom: '12px' }}>
                                <ColorPicker 
                                  isSwatch={true} 
                                  icon={Pipette} 
                                  iconSize={14} 
                                  value={activeCustomText ? (activeCustomText.shadowColor || '#000000') : (textEditMode === 'center' ? textCenterShadowColor : frameShadowColor)} 
                                  onChange={(col) => {
                                    if (activeCustomText) {
                                      updateCustomText(activeCustomText.id, { shadowColor: col });
                                    } else if (textEditMode === 'center') {
                                      setTextCenterShadowColor(col);
                                    } else {
                                      setFrameShadowColor(col);
                                    }
                                  }} 
                                  onOpenAdvanced={handleOpenAdv} 
                                />
                                {SWATCH_PRESETS.map(color => (
                                  <div 
                                    key={color} 
                                    className={`swatch-item${(activeCustomText ? activeCustomText.shadowColor : (textEditMode === 'center' ? textCenterShadowColor : frameShadowColor)) === color ? ' active' : ''}`} 
                                    style={{ backgroundColor: color }} 
                                    onClick={() => {
                                      if (activeCustomText) {
                                        updateCustomText(activeCustomText.id, { shadowColor: color });
                                      } else if (textEditMode === 'center') {
                                        setTextCenterShadowColor(color);
                                      } else {
                                        setFrameShadowColor(color);
                                      }
                                    }} 
                                  />
                                ))}
                              </div>
                              <Slider 
                                label="Shadow Blur" 
                                min={0} 
                                max={30} 
                                value={activeCustomText ? (activeCustomText.shadowBlur || 8) : (textEditMode === 'center' ? textCenterShadowBlur : frameShadowBlur)} 
                                onChange={(val) => {
                                  if (activeCustomText) {
                                    updateCustomText(activeCustomText.id, { shadowBlur: val });
                                  } else if (textEditMode === 'center') {
                                    setTextCenterShadowBlur(val);
                                  } else {
                                    setFrameShadowBlur(val);
                                  }
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {textPopup === 'bg' && (
                        <div className="fade-in">
                          {textEditMode === 'center' && (
                            <Toggle label="Enable Background" checked={logoBackground} onChange={setLogoBackground} />
                          )}
                          {(textEditMode === 'frame' || logoBackground) && (
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
                                  <button 
                                    key={`${x}-${y}`} 
                                    onClick={() => { 
                                      if (activeCustomText) {
                                        updateCustomText(activeCustomText.id, { posX: x, posY: y });
                                      } else {
                                        setTextCenterPosX(x); 
                                        setTextCenterPosY(y); 
                                      }
                                    }} 
                                    style={{ 
                                      width: '36px', 
                                      height: '36px', 
                                      borderRadius: '8px', 
                                      border: '1px solid var(--border-color)', 
                                      background: (activeCustomText ? (activeCustomText.posX === x && activeCustomText.posY === y) : (textCenterPosX === x && textCenterPosY === y)) ? 'var(--accent-primary)' : 'var(--bg-primary)', 
                                      cursor: 'pointer', 
                                      transition: 'all 0.2s ease' 
                                    }} 
                                  />
                                )))}
                              </div>
                            </div>
                            <Slider 
                              label="Horizontal" 
                              value={activeCustomText ? (activeCustomText.posX ?? 0.5) : textCenterPosX} 
                              min={0} 
                              max={1} 
                              step={0.01} 
                              onChange={(val) => {
                                if (activeCustomText) {
                                  updateCustomText(activeCustomText.id, { posX: val });
                                } else {
                                  setTextCenterPosX(val);
                                }
                              }} 
                            />
                            <Slider 
                              label="Vertical" 
                              value={activeCustomText ? (activeCustomText.posY ?? 0.5) : textCenterPosY} 
                              min={0} 
                              max={1} 
                              step={0.01} 
                              onChange={(val) => {
                                if (activeCustomText) {
                                  updateCustomText(activeCustomText.id, { posY: val });
                                } else {
                                  setTextCenterPosY(val);
                                }
                              }} 
                            />
                          </div>
                        </div>
                      )}

                      {textPopup === 'rotate' && (
                        <div className="fade-in">
                          <Slider 
                            label="Rotation" 
                            value={activeCustomText ? (activeCustomText.rotation || 0) : (textEditMode === 'center' ? textCenterRotation : frameRotation)} 
                            min={0} 
                            max={360} 
                            step={1} 
                            onChange={(val) => {
                              if (activeCustomText) {
                                updateCustomText(activeCustomText.id, { rotation: val });
                              } else if (textEditMode === 'center') {
                                setTextCenterRotation(val);
                              } else {
                                setFrameRotation(val);
                              }
                            }} 
                          />
                        </div>
                      )}
                      {colorPopup === 'presets' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Presets Style</div>
                            <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px' }}>
                              <button 
                                onClick={() => setPresetTab('solid')}
                                style={{ border: 'none', background: presetTab === 'solid' ? 'var(--accent-primary)' : 'transparent', color: presetTab === 'solid' ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              >
                                Solid
                              </button>
                              <button 
                                onClick={() => setPresetTab('gradient')}
                                style={{ border: 'none', background: presetTab === 'gradient' ? 'var(--accent-primary)' : 'transparent', color: presetTab === 'gradient' ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              >
                                Gradient
                              </button>
                            </div>
                          </div>
                          {presetTab === 'solid' ? (
                            <div className="fade-in">
                              <div className="swatch-grid-mini" style={{ padding: '4px 0 8px 0', gap: '10px' }}>
                                {COLOR_PRESETS
                                  .filter(p => {
                                    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                                    return FeatureAccessManager.isFeatureEnabled(`qr_color_preset_${slug}`);
                                  })
                                  .map(p => {
                                    const isSelected = qrColor === p.qr && bgColor === p.bg;
                                    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                                    const featId = `qr_color_preset_${slug}`;
                                    return (
                                      <button 
                                        key={p.name} 
                                        onClick={() => { 
                                          const access = FeatureAccessManager.canUseFeature(featId);
                                          if (!access.allowed) {
                                            showPaywall(featId);
                                            return;
                                          }
                                          setQrColor(p.qr); 
                                          setBgColor(p.bg); 
                                          if (syncEyes) { setEyeColor(p.qr); setEyeOuterColor(p.qr); } 
                                          setBgTransparent(false);
                                          setQrBgImage(null);
                                          setQrBgImageEnabled(false);
                                          setQrTexture(null);
                                          setQrTextureEnabled(false);
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
                                          width: '60px',
                                          position: 'relative'
                                        }}
                                      >
                                        <PaidCrownBadge featureId={featId} fallbackFeatureId="qr_color_presets" position="corner" size={8} />
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
                          ) : (
                            <div className="fade-in">
                              <div className="swatch-grid-mini" style={{ padding: '4px 0 8px 0', gap: '10px' }}>
                                {TRENDING_GRADIENT_PRESETS
                                  .filter(p => FeatureAccessManager.isFeatureEnabled(`qr_gradient_${p.id}`))
                                  .map(p => {
                                    const isSelected = qrColor === p.qr && bgColor === p.bg;
                                    const featId = `qr_gradient_${p.id}`;
                                    return (
                                      <button 
                                        key={p.name} 
                                        onClick={() => { 
                                          const access = FeatureAccessManager.canUseFeature(featId);
                                          if (!access.allowed) {
                                            showPaywall(featId);
                                            return;
                                          }
                                          setQrColor(p.qr); 
                                          setBgColor(p.bg); 
                                          if (syncEyes) { setEyeColor(p.qr); setEyeOuterColor(p.qr); } 
                                          setBgTransparent(false);
                                          setQrBgImage(null);
                                          setQrBgImageEnabled(false);
                                          setQrTexture(null);
                                          setQrTextureEnabled(false);
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
                                          width: '60px',
                                          position: 'relative'
                                        }}
                                      >
                                        <PaidCrownBadge featureId={featId} fallbackFeatureId="custom_colors_gradient" position="corner" size={9} />
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
                        </div>
                      )}
                      {colorPopup === 'dots' && (
                        <div className="fade-in">
                          {renderColorOrGradientPicker("Dots Color", qrColor, (c) => {
                            setQrColor(c);
                            setQrTexture(null);
                            setQrTextureEnabled(false);
                          }, handleOpenAdv)}
                        </div>
                      )}
                      {colorPopup === 'bg' && (
                        <div className="fade-in">
                          {renderColorOrGradientPicker("Background Color", bgColor, (c) => { 
                            setBgColor(c); 
                            setLogoBgColor(c); 
                            setBgTransparent(false); 
                            setQrBgImage(null);
                            setQrBgImageEnabled(false);
                          }, handleOpenAdv)}
                        </div>
                      )}
                      {colorPopup === 'eyes' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <Toggle label="Sync Eyes with Dots" checked={syncEyes} onChange={setSyncEyes} />
                          {!syncEyes && (
                            <>
                              <Toggle label="Sync Inner & Outer Eye Colors" checked={syncInnerOuterEyes} onChange={(val) => {
                                setSyncInnerOuterEyes(val);
                                if (val) {
                                  setEyeOuterColor(eyeColor || qrColor);
                                }
                              }} />
                              
                              {syncInnerOuterEyes ? (
                                <div className="fade-in">
                                  {renderColorOrGradientPicker("Eyes Color", eyeColor || qrColor, (c) => { setEyeColor(c); setEyeOuterColor(c); }, handleOpenAdv)}
                                </div>
                              ) : (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Eyes Section</div>
                                    <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px' }}>
                                      <button 
                                        onClick={() => setEyeColorTab('inner')}
                                        style={{ border: 'none', background: eyeColorTab === 'inner' ? 'var(--accent-primary)' : 'transparent', color: eyeColorTab === 'inner' ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                      >
                                        Inner
                                      </button>
                                      <button 
                                        onClick={() => setEyeColorTab('outer')}
                                        style={{ border: 'none', background: eyeColorTab === 'outer' ? 'var(--accent-primary)' : 'transparent', color: eyeColorTab === 'outer' ? '#fff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                      >
                                        Outer
                                      </button>
                                    </div>
                                  </div>
                                  {eyeColorTab === 'inner' ? (
                                    <div className="fade-in">
                                      {renderColorOrGradientPicker("Inner Eyes Color", eyeColor || qrColor, setEyeColor, handleOpenAdv)}
                                    </div>
                                  ) : (
                                    <div className="fade-in">
                                      {renderColorOrGradientPicker("Outer Eyes Color", eyeOuterColor || qrColor, setEyeOuterColor, handleOpenAdv)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {colorPopup === 'bg-image' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="fade-in" style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                            <div className="logo-presets-grid">
                              {/* Upload Button */}
                              {FeatureAccessManager.isFeatureEnabled('qr_color_bg_image') && (
                                <button
                                  className={`logo-preset-btn upload-tile ${qrBgImage && !SOCIAL_TEXTURES.some(p => p.url === qrBgImage.src) ? 'active' : ''}`}
                                  onClick={() => {
                                    if (qrBgImage && !SOCIAL_TEXTURES.some(p => p.url === qrBgImage.src)) {
                                      setQrBgImage(null);
                                      setQrBgImageEnabled(false);
                                    } else {
                                      const access = FeatureAccessManager.canUseFeature('qr_color_bg_image');
                                      if (!access.allowed) {
                                        showPaywall('qr_color_bg_image');
                                        return;
                                      }
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (re) => {
                                            setCropModalConfig({
                                              isOpen: true,
                                              imageSrc: re.target.result,
                                              imageName: file.name,
                                              title: 'Crop & Shape Background Photo',
                                              initialShape: 'square',
                                              onConfirm: ({ image, src, name }) => {
                                                setQrBgImage({ src, image, name });
                                                setQrBgImageEnabled(true);
                                                setEyeStyle('square');
                                                setDotStyle('rounded');
                                                setQrBgCardEnabled(false);
                                                setErrorLevel('H'); // Auto set high error correction for reliability
                                                setCropModalConfig(null);
                                              }
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }
                                  }}
                                  title="Upload Custom Background"
                                  style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-light)', position: 'relative' }}
                                >
                                  <PaidCrownBadge featureId="qr_color_bg_image" fallbackFeatureId="qr_bg_image_texture" position="corner" size={9} />
                                  {qrBgImage && !SOCIAL_TEXTURES.some(p => p.url === qrBgImage.src) ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                      <img src={qrBgImage.src} alt="Custom" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                                      <X size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--error)' }} />
                                    </div>
                                  ) : (
                                    <UploadCloud size={24} color="var(--accent-primary)" />
                                  )}
                                </button>
                              )}
                              {/* Social App Texture Presets */}
                              {SOCIAL_TEXTURES.map((p) => {
                                const isActive = qrBgImage?.src === p.url;
                                return (
                                  <button
                                    key={p.slug}
                                    className={`logo-preset-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                      if (isActive) {
                                        setQrBgImage(null);
                                        setQrBgImageEnabled(false);
                                      } else {
                                        const img = new Image();
                                        img.onload = () => {
                                          setQrBgImage({ src: p.url, image: img, name: p.name });
                                          setQrBgImageEnabled(true);
                                          setEyeStyle('square');
                                          setDotStyle('rounded');
                                          setQrBgCardEnabled(false);
                                          setErrorLevel('H'); // Auto set high error correction for reliability
                                        };
                                        img.src = p.url;
                                      }
                                    }}
                                    title={p.name}
                                  >
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                      <img 
                                        src={p.url} 
                                        alt={p.name} 
                                        loading="lazy" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isActive ? 0.3 : 1, transition: 'opacity 0.2s' }} 
                                      />
                                      {isActive && (
                                        <X size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--accent-primary)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {qrBgImage && (
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
                                Active: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{qrBgImage.name}</span>
                              </div>
                            )}
                          </div>
                          {qrBgImage && qrBgImageEnabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }} className="fade-in">
                              
                              {/* ── AI ILLUSTRATION ART QR SYNTHESIS CARD ── */}
                              <div style={{
                                background: aiArtQrEnabled 
                                  ? 'linear-gradient(135deg, rgba(214,0,54,0.12) 0%, rgba(139,92,246,0.12) 100%)' 
                                  : 'var(--bg-elevated)',
                                border: aiArtQrEnabled 
                                  ? '1.5px solid var(--accent-primary)' 
                                  : '1px solid var(--border-color)',
                                borderRadius: '18px',
                                padding: '14px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                boxShadow: aiArtQrEnabled ? '0 8px 24px rgba(214,0,54,0.15)' : 'none',
                                transition: 'all 0.25s ease',
                                boxSizing: 'border-box',
                                width: '100%'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                    <div style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '12px',
                                      background: aiArtQrEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#FFFFFF',
                                      flexShrink: 0,
                                      boxShadow: aiArtQrEnabled ? '0 4px 12px rgba(214,0,54,0.3)' : 'none',
                                      transition: 'all 0.2s ease'
                                    }}>
                                      <Sparkles size={18} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span>AI Illustration QR</span>
                                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '6px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 800, letterSpacing: '0.5px' }}>PRO</span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                                        Fuses QR pixels directly into the artwork
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ flexShrink: 0 }}>
                                    <Toggle checked={aiArtQrEnabled} onChange={setAiArtQrEnabled} />
                                  </div>
                                </div>

                                {aiArtQrEnabled && (
                                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '2px' }}>
                                    {/* Style Selection Grid */}
                                    <div>
                                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                                        Illustration Art Style
                                      </div>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                        gap: '8px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                      }}>
                                        {AI_ART_STYLES.map(s => {
                                          const isSelected = aiArtStyle === s.id;
                                          return (
                                            <button
                                              key={s.id}
                                              onClick={() => setAiArtStyle(s.id)}
                                              style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-primary)',
                                                border: '1.5px solid',
                                                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                                color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '3px',
                                                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: isSelected ? '0 4px 14px rgba(214, 0, 54, 0.22)' : 'none',
                                                boxSizing: 'border-box',
                                                minHeight: '52px',
                                                justifyContent: 'center'
                                              }}
                                            >
                                              <div style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <span>{s.name}</span>
                                                <span style={{ 
                                                  width: '6px', 
                                                  height: '6px', 
                                                  borderRadius: '50%', 
                                                  background: isSelected ? '#FFFFFF' : 'var(--border-color)', 
                                                  display: 'inline-block' 
                                                }} />
                                              </div>
                                              <div style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.desc}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Blend Slider */}
                                    <div style={{ width: '100%' }}>
                                      <Slider
                                        label="AI Artistic Synthesis Blend"
                                        min={0.40}
                                        max={1.0}
                                        step={0.02}
                                        value={aiArtBlend}
                                        onChange={setAiArtBlend}
                                        formatValue={(v) => `${Math.round(v * 100)}%`}
                                      />
                                    </div>

                                    {/* Live Scannability Badge */}
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '8px',
                                      background: aiArtBlend >= 0.75 ? 'rgba(16, 185, 129, 0.12)' : (aiArtBlend >= 0.5 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(139, 92, 246, 0.12)'),
                                      border: aiArtBlend >= 0.75 ? '1px solid rgba(16, 185, 129, 0.3)' : (aiArtBlend >= 0.5 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)'),
                                      borderRadius: '12px',
                                      padding: '9px 12px',
                                      boxSizing: 'border-box',
                                      width: '100%'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldCheck size={16} color={aiArtBlend >= 0.75 ? '#10B981' : (aiArtBlend >= 0.5 ? '#06B6D4' : '#8B5CF6')} />
                                        <span style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: 700 }}>
                                          {aiArtBlend >= 0.75 ? '100% Optical Scan Ready' : (aiArtBlend >= 0.5 ? 'High Reliability Scan' : 'Subtle Halftone Mode')}
                                        </span>
                                      </div>
                                      <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: 800, 
                                        color: aiArtBlend >= 0.75 ? '#10B981' : (aiArtBlend >= 0.5 ? '#06B6D4' : '#8B5CF6'),
                                        background: aiArtBlend >= 0.75 ? 'rgba(16, 185, 129, 0.2)' : (aiArtBlend >= 0.5 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)'),
                                        padding: '2px 7px',
                                        borderRadius: '6px'
                                      }}>
                                        {aiArtBlend >= 0.75 ? 'OPTIMAL' : (aiArtBlend >= 0.5 ? 'BALANCED' : 'ARTISTIC')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Opacity Slider */}
                              <Slider 
                                label="Image Opacity" 
                                min={0.1} 
                                max={1.0} 
                                step={0.05} 
                                value={qrBgImageOpacity} 
                                onChange={setQrBgImageOpacity} 
                                formatValue={(v) => `${Math.round(v * 100)}%`}
                              />
                              
                              {/* Blur Slider */}
                              <Slider 
                                label="Image Blur" 
                                min={0} 
                                max={20} 
                                step={1} 
                                value={qrBgImageBlur} 
                                onChange={setQrBgImageBlur} 
                                formatValue={(v) => `${v}px`}
                              />
                              
                              {/* Overlay/Dimming Slider */}
                              <Slider 
                                label="Overlay Dimming (White)" 
                                min={0} 
                                max={0.9} 
                                step={0.05} 
                                value={qrBgImageOverlayOpacity} 
                                onChange={setQrBgImageOverlayOpacity} 
                                formatValue={(v) => `${Math.round(v * 100)}%`}
                              />
                              
                              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                              
                              {/* High-Contrast Container Card Settings */}
                              <Toggle label="Scannability Container Card" checked={qrBgCardEnabled} onChange={setQrBgCardEnabled} />
                              
                              {qrBgCardEnabled && (
                                <Slider 
                                  label="Container Card Opacity" 
                                  min={0.5} 
                                  max={1.0} 
                                  step={0.05} 
                                  value={qrBgCardOpacity} 
                                  onChange={setQrBgCardOpacity} 
                                  formatValue={(v) => `${Math.round(v * 100)}%`}
                                />
                              )}
                              
                              <div style={{ display: 'flex', gap: '8px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)', borderRadius: '12px', padding: '10px 12px' }}>
                                <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '1px' }} />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                  <strong>Scan Protection Active:</strong> High error correction level (30%) and container card options ensure perfect scannability.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {colorPopup === 'texture' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <Toggle label="Sync Eyes with Dots" checked={qrTextureSyncEyes} onChange={setQrTextureSyncEyes} />
                            </div>
                          </div>
                          
                          <div className="fade-in">
                            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                              <div className="logo-presets-grid">
                                {/* Upload Button */}
                                <button
                                  className={`logo-preset-btn upload-tile ${qrTexture && !SOCIAL_TEXTURES.some(p => p.url === qrTexture.src) ? 'active' : ''}`}
                                  onClick={() => {
                                    if (qrTexture && !SOCIAL_TEXTURES.some(p => p.url === qrTexture.src)) {
                                      setQrTexture(null);
                                      setQrTextureEnabled(false);
                                    } else {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (re) => {
                                            const img = new Image();
                                            img.onload = () => {
                                              setQrTexture({ src: re.target.result, image: img, name: file.name });
                                              setQrTextureEnabled(true);
                                            };
                                            img.src = re.target.result;
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }
                                  }}
                                  title="Upload Custom Texture"
                                  style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-light)' }}
                                >
                                  {qrTexture && !SOCIAL_TEXTURES.some(p => p.url === qrTexture.src) ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                      <img src={qrTexture.src} alt="Custom" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                                      <X size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--error)' }} />
                                    </div>
                                  ) : (
                                    <UploadCloud size={24} color="var(--accent-primary)" />
                                  )}
                                </button>
                                {/* Social App Texture Presets */}
                                {SOCIAL_TEXTURES
                                  .filter(p => FeatureAccessManager.isFeatureEnabled(`qr_texture_${p.slug}`))
                                  .map((p) => {
                                    const isActive = qrTexture?.src === p.url;
                                    return (
                                      <button
                                        key={p.slug}
                                        className={`logo-preset-btn ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                          if (isActive) {
                                            setQrTexture(null);
                                            setQrTextureEnabled(false);
                                          } else {
                                            const featId = `qr_texture_${p.slug}`;
                                            const access = FeatureAccessManager.canUseFeature(featId);
                                            if (!access.allowed) {
                                              showPaywall(featId);
                                              return;
                                            }
                                            const img = new Image();
                                            img.onload = () => {
                                              setQrTexture({ src: p.url, image: img, name: p.name });
                                              setQrTextureEnabled(true);
                                            };
                                            img.src = p.url;
                                          }
                                        }}
                                        title={p.name}
                                        style={{ position: 'relative' }}
                                      >
                                        <PaidCrownBadge featureId={`qr_texture_${p.slug}`} fallbackFeatureId="qr_bg_image_texture" position="corner" size={9} />
                                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                          <img 
                                            src={p.url} 
                                            alt={p.name} 
                                            loading="lazy" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isActive ? 0.3 : 1, transition: 'opacity 0.2s' }} 
                                          />
                                          {isActive && (
                                            <X size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--accent-primary)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                              </div>
                              {qrTexture && (
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
                                  Active: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{qrTexture.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                       {shapePopup === 'dots' && (
                         <div className="fade-in">
                           <DotStyleSelector value={dotStyle} onChange={setDotStyle} qrParams={qrParams} />
                         </div>
                       )}
                       {shapePopup === 'eyes' && (
                         <div className="fade-in">
                           <EyeStyleSelector value={eyeStyle} onChange={setEyeStyle} qrParams={qrParams} />
                         </div>
                       )}
                        {shapePopup === 'background' && (
                          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Toggle label="Transparent Background" checked={bgTransparent} onChange={setBgTransparent} />
                            <div style={{ opacity: bgTransparent ? 0.4 : 1, pointerEvents: bgTransparent ? 'none' : 'auto', transition: 'all 0.2s ease' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Background Shape</div>
                                {bgTransparent && (
                                  <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: '600' }}>Disabled (Transparent BG)</span>
                                )}
                              </div>
                              <div className="font-scroll-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 8px 0', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', marginBottom: '4px' }}>
                                {QR_BG_SHAPES
                                  .filter(shape => FeatureAccessManager.isFeatureEnabled(`qr_bg_${shape.id}`))
                                  .map(shape => {
                                    const isActive = qrBgShape === shape.id;
                                    const featId = `qr_bg_${shape.id}`;
                                    return (
                                      <button 
                                        key={shape.id} 
                                        onClick={() => {
                                          const access = FeatureAccessManager.canUseFeature(featId);
                                          if (!access.allowed) {
                                            showPaywall(featId);
                                            return;
                                          }
                                          setQrBgShape(shape.id);
                                        }}
                                        className={`font-scroll-btn ${isActive ? 'active' : ''}`} 
                                        style={{ 
                                          flex: '0 0 auto', 
                                          padding: '4px', 
                                          borderRadius: '12px',
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          background: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                          color: isActive ? '#fff' : 'var(--text-primary)',
                                          border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '6px',
                                          width: '74px',
                                          height: '94px',
                                          boxShadow: isActive ? '0 6px 14px rgba(214,0,54,0.2)' : 'none',
                                          transition: 'all 0.2s ease',
                                          overflow: 'hidden',
                                          position: 'relative'
                                        }}
                                      >
                                        <PaidCrownBadge featureId={featId} position="corner" size={9} />
                                        <MiniQRCanvasBg 
                                          qrParams={{
                                            dotStyle,
                                            eyeStyle,
                                            syncEyes,
                                          gradientEnabled,
                                          gradientColor1,
                                          gradientColor2,
                                          gradientType,
                                          qrColor,
                                          bgColor,
                                          bgTransparent,
                                          errorLevel: 'H'
                                        }}
                                        shapeId={shape.id}
                                        isActive={isActive}
                                      />
                                      <span style={{ fontSize: '9px', whiteSpace: 'nowrap', opacity: isActive ? 1.0 : 0.8, marginTop: '2px' }}>
                                        {shape.label.split(' ')[0]}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                       {shapePopup === 'size' && (
                         <div className="fade-in">
                           <Slider 
                             label="QR Code Size" 
                              value={Math.round(qrSizeScale * 100)} 
                              min={20} 
                              max={100} 
                              step={1} 
                              unit="%"
                              onChange={(v) => setQrSizeScale(v / 100)} 
                            />
                           <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                             <button 
                               onClick={() => setQrSizeScale(1.0)} 
                               style={{ 
                                 padding: '8px 16px', 
                                 borderRadius: '10px', 
                                 border: 'none', 
                                 background: 'var(--bg-elevated)', 
                                 color: 'var(--text-primary)', 
                                 fontSize: '12px', 
                                 fontWeight: 600, 
                                 cursor: 'pointer', 
                                 transition: 'all 0.2s ease' 
                               }}
                             >
                               Reset Size
                             </button>
                           </div>
                         </div>
                       )}
                       {shapePopup === 'pos' && (
                         <div className="fade-in">
                           <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                             <div style={{ display: 'flex', justifyContent: 'center' }}>
                               <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                                 {[0, 0.5, 1].map(y => [0, 0.5, 1].map(x => (
                                   <button 
                                     key={`${x}-${y}`} 
                                     onClick={() => { setQrPosX(x); setQrPosY(y); }} 
                                     style={{ 
                                       width: '36px', 
                                       height: '36px', 
                                       borderRadius: '8px', 
                                       border: '1px solid var(--border-color)', 
                                       background: qrPosX === x && qrPosY === y ? 'var(--accent-primary)' : 'var(--bg-primary)', 
                                       cursor: 'pointer', 
                                       transition: 'all 0.2s ease' 
                                     }} 
                                   />
                                 )))}
                               </div>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'center' }}>
                               <button 
                                 onClick={() => { setQrPosX(0.5); setQrPosY(0.5); }} 
                                 style={{ 
                                   padding: '8px 16px', 
                                   borderRadius: '10px', 
                                   border: 'none', 
                                   background: 'var(--bg-elevated)', 
                                   color: 'var(--text-primary)', 
                                   fontSize: '12px', 
                                   fontWeight: 600, 
                                   cursor: 'pointer', 
                                   transition: 'all 0.2s ease' 
                                 }}
                               >
                                 Reset Position
                               </button>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 ) : (
                     <div className="toolbar-tabs-row fade-in">
                       {activeTab === 'color' && (
                         <>
                           {FeatureAccessManager.isFeatureEnabled('qr_color_presets') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'presets' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_presets');
                                 if (!access.allowed) { showPaywall('qr_color_presets'); return; }
                                 startEditing('color', 'presets');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_presets" position="floating" size={8} />
                               <Bookmark size={24} />
                               <span>Presets</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_dots') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'dots' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_dots');
                                 if (!access.allowed) { showPaywall('qr_color_dots'); return; }
                                 startEditing('color', 'dots');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_dots" fallbackFeatureId="custom_colors_solid" position="floating" size={8} />
                               <QRDotsIcon />
                               <span>Dots</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_eyes') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'eyes' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_eyes');
                                 if (!access.allowed) { showPaywall('qr_color_eyes'); return; }
                                 startEditing('color', 'eyes');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_eyes" fallbackFeatureId="qr_color_eyes_custom" position="floating" size={8} />
                               <QREyesIcon />
                               <span>Eyes</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_bg') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'bg' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_bg');
                                 if (!access.allowed) { showPaywall('qr_color_bg'); return; }
                                 startEditing('color', 'bg');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_bg" position="floating" size={8} />
                               <Paintbrush size={24} />
                               <span>BG Color</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_bg_image') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'bg-image' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_bg_image');
                                 if (!access.allowed) { showPaywall('qr_color_bg_image'); return; }
                                 startEditing('color', 'bg-image');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_bg_image" fallbackFeatureId="qr_bg_image_texture" position="floating" size={8} />
                               <ImageIcon size={24} />
                               <span>BG Image</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_texture') && (
                             <button 
                               className={`text-toolbar-btn${colorPopup === 'texture' ? ' active' : ''}`} 
                               onClick={() => {
                                 const access = FeatureAccessManager.canUseFeature('qr_color_texture');
                                 if (!access.allowed) { showPaywall('qr_color_texture'); return; }
                                 startEditing('color', 'texture');
                               }}
                               style={{ position: 'relative' }}
                             >
                               <PaidCrownBadge featureId="qr_color_texture" fallbackFeatureId="qr_bg_image_texture" position="floating" size={8} />
                               <Layers size={24} />
                               <span>Texture</span>
                             </button>
                           )}
                         </>
                       )}
                       {activeTab === 'shapes' && (
                         <>
                           {FeatureAccessManager.isFeatureEnabled('custom_dot_styles') && (
                             <button className={`text-toolbar-btn${shapePopup === 'dots' ? ' active' : ''}`} onClick={() => startEditing('shapes', 'dots')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="custom_dot_styles" position="floating" size={8} />
                               <QRDotsIcon /><span>Dots</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('custom_eye_styles') && (
                             <button className={`text-toolbar-btn${shapePopup === 'eyes' ? ' active' : ''}`} onClick={() => startEditing('shapes', 'eyes')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="custom_eye_styles" position="floating" size={8} />
                               <QREyesIcon /><span>Eyes</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('custom_background_shapes') && (
                             <button className={`text-toolbar-btn${shapePopup === 'background' ? ' active' : ''}`} onClick={() => startEditing('shapes', 'background')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="custom_background_shapes" position="floating" size={8} />
                               <QRBgIcon size={24} /><span>Background</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_size_custom') && (
                             <button className={`text-toolbar-btn${shapePopup === 'size' ? ' active' : ''}`} onClick={() => startEditing('shapes', 'size')}>
                               <QRSizeIcon size={24} /><span>Size</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_canvas_positioning') && (
                             <button className={`text-toolbar-btn${shapePopup === 'pos' ? ' active' : ''}`} onClick={() => startEditing('shapes', 'pos')}>
                               <Maximize size={24} /><span>Position</span>
                             </button>
                           )}
                         </>
                       )}
                       {activeTab === 'logo' && (
                         <>
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_transforms') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'size')}><QRSizeIcon size={24} /><span>Size</span></button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_canvas_positioning') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'pos')}><Maximize size={24} /><span>Position</span></button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_stroke_shadow') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'stroke')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="qr_logo_stroke_shadow" position="floating" size={8} />
                               <Paintbrush size={24} /><span>Stroke</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_stroke_shadow') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'bg')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="qr_logo_stroke_shadow" position="floating" size={8} />
                               <Hexagon size={24} /><span>Background</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_transforms') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'rotate')}><RotateCw size={24} /><span>Rotate</span></button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_transforms') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'opacity')}><Sun size={24} /><span>Opacity</span></button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_stroke_shadow') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'shadow')}><Moon size={24} /><span>Shadow</span></button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_bg_remover') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'filter')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="qr_logo_bg_remover" position="floating" size={8} />
                               <Eraser size={24} /><span>Remove BG</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_color_texture') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'texture')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="qr_color_texture" fallbackFeatureId="qr_bg_image_texture" position="floating" size={8} />
                               <Layers size={24} /><span>Texture</span>
                             </button>
                           )}
                           {FeatureAccessManager.isFeatureEnabled('qr_logo_bg_remover') && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('logo', 'crop')}><Crop size={24} /><span>Crop</span></button>
                           )}
                         </>
                       )}
                       {activeTab === 'text' && (
                         <>
                           {(FeatureAccessManager.isFeatureEnabled('qr_center_text') || FeatureAccessManager.isFeatureEnabled('qr_text_frame')) && (
                             <button className="text-toolbar-btn" onClick={() => startEditing('text', 'input')} style={{ position: 'relative' }}>
                               <PaidCrownBadge featureId="qr_center_text" position="floating" size={8} />
                               <Type size={24} /><span>Add Text</span>
                             </button>
                           )}
                           {(() => {
                             const isTextEnabled = textCenterEnabled || frameStyle !== 'none' || customTexts.length > 0 || !!selectedTemplate;
                             const handleTextToolClick = (tool) => {
                               if (!isTextEnabled) {
                                 showToast('Please enable Center Text or Frame Text first', 'info');
                                 return;
                               }
                               startEditing('text', tool);
                             };
                             return (
                               <>
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_transforms') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('pos')}><Maximize size={24} /><span>Position</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_fonts') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('fonts')}><ALargeSmall size={24} /><span>Fonts</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_transforms') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('size')}><QRSizeIcon size={24} /><span>Size</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_styling') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('color')}><Palette size={24} /><span>Color</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_styling') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('stroke')}><Paintbrush size={24} /><span>Stroke</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_styling') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('shadow')}><Moon size={24} /><span>Shadow</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_transforms') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('rotate')}><RotateCw size={24} /><span>Rotate</span></button>
                                 )}
                                 {FeatureAccessManager.isFeatureEnabled('qr_text_styling') && (
                                   <button className="text-toolbar-btn" style={!isTextEnabled ? { opacity: 0.4 } : {}} onClick={() => handleTextToolClick('bg')}><Hexagon size={24} /><span>Shape</span></button>
                                 )}
                               </>
                             );
                           })()}
                         </>
                       )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : activePage === 'scanner' ? (
          <QRScanner
            onBack={() => {
              if (launchedDirectlyToScanner) {
                CapApp.exitApp();
              } else {
                setActivePage('home');
              }
            }}
            navigateTo={navigateTo}
            onLoadQR={handleLoadQR}
            currentUser={currentUser}
            onOpenProfile={() => {
              if (currentUser) {
                setProfileNameInput(currentUser.displayName || '');
                setNewProfilePicUrl(currentUser.photoURL || '');
                setIsProfileModalOpen(true);
                setAuthDropdownOpen(false);
              } else {
                navigateTo('login');
              }
            }}
          />
        ) : activePage === 'home' ? (
          <HomePage 
            currentUser={currentUser}
            onScrollChange={(scrolled) => setIsHomeScrolled(scrolled)}
            onNavigate={(page, subType) => {
              if (page === 'generator') resetGenerator();
              if (page === 'batch') {
                const access = FeatureAccessManager.canUseFeature('batch_view');
                if (!access.allowed && access.status !== 'disabled_by_admin') {
                  showPaywall('batch_view');
                  return;
                }
              }
              if (page === 'barcode') {
                const access = FeatureAccessManager.canUseFeature('barcode_generator');
                if (!access.allowed && access.status !== 'disabled_by_admin') {
                  showPaywall('barcode_generator');
                  return;
                }
              }
              if (page === 'history') {
                const access = FeatureAccessManager.canUseFeature('history_view');
                if (!access.allowed && access.status !== 'disabled_by_admin') {
                  showPaywall('history_view');
                  return;
                }
              }
              if (page === 'saved') {
                const access = FeatureAccessManager.canUseFeature('saved_view');
                if (!access.allowed && access.status !== 'disabled_by_admin') {
                  showPaywall('saved_view');
                  return;
                }
              }
              navigateTo(page);
            }}
            onQuickCreate={(type) => {
              const baseAccess = FeatureAccessManager.canUseFeature('qr_generator');
              if (!baseAccess.allowed) {
                if (baseAccess.status !== 'disabled_by_admin') {
                  showPaywall('qr_generator');
                } else {
                  showToast('QR Generator feature is disabled by administrator.', 'error');
                }
                return;
              }
              const typeAccess = FeatureAccessManager.canUseFeature(`qr_${type.toLowerCase()}`);
              if (!typeAccess.allowed) {
                showPaywall(`qr_${type.toLowerCase()}`);
                return;
              }
              resetGenerator();
              setQrType(type);
              setQrData({});
              setIsDataModalOpen(true);
              navigate('/generator', {
                state: {
                  qrType: type,
                  qrData: {},
                  isDataModalOpen: true,
                  activePage: 'generator'
                }
              });
              setActivePage('generator');
            }}
            onQuickCreateBarcode={(id) => {
              const baseAccess = FeatureAccessManager.canUseFeature('barcode_generator');
              if (!baseAccess.allowed) {
                if (baseAccess.status !== 'disabled_by_admin') {
                  showPaywall('barcode_generator');
                } else {
                  showToast('Barcode Generator feature is disabled by administrator.', 'error');
                }
                return;
              }
              const typeAccess = FeatureAccessManager.canUseFeature(`barcode_${id.toLowerCase()}`);
              if (!typeAccess.allowed) {
                showPaywall(`barcode_${id.toLowerCase()}`);
                return;
              }
              const defaults = {
                ean13: '4006381333931',
                upca: '012345678905',
                code128: 'MushiPro-128',
                code39: 'MUSHI 39',
                datamatrix: 'DataMatrix-Standard',
                itf14: '10012345678902',
                ean8: '40123455',
                gs1databar: '01234567890128',
                pdf417: 'PDF417-ID-FORMAT',
                code93: 'COMPACT-93',
                upce: '01234565',
                codabar: 'A123456B',
                code11: '123-456-789',
                msi: '1234567',
                i25: '12345678',
                postnet: '12345',
                planet: '12345678901',
                royalmail: 'SN34RD1A',
                gs1128: '(01)00012345678905(10)ABC-123',
                telepen: 'TELEPEN-ASCII',
                pharmacode: '11309',
                aztec: 'AZTEC-TICKET-DATA',
                maxicode: 'UPS-MAXICODE-DATA',
                qrcode: 'QR-INTEGRATION',
                microqrcode: 'MICRO-QR',
                hanxin: 'HANXIN-2D-CODE',
                codablockf: 'CODABLOCK-F-DATA',
                code16k: 'CODE-16K-DATA',
                code49: 'CODE-49-DATA',
                channelcode: '123456'
              };
              const defaultValue = defaults[id] || '12345678';
              const item = {
                qrType: 'BARCODE',
                displayText: defaultValue,
                style: {
                  bcid: id,
                  barColor: '#000000',
                  bgColor: '#ffffff',
                  barWidth: 2,
                  height: 90,
                  margin: 16,
                  displayValue: true
                }
              };
              navigate('/barcode', {
                state: {
                  loadedBarcodeItem: item,
                  activePage: 'barcode'
                }
              });
              setActivePage('barcode');
            }}
            onLoadQR={handleLoadQR}
            theme={theme}
            setTheme={(next) => {
              setTheme(next);
              savePreferences({ ...getPreferences(), theme: next });
            }}
            activePage={activePage}
            onMenuClick={() => navigateTo('settings')}
            onOpenProfile={() => {
              if (currentUser) {
                setProfileNameInput(currentUser.displayName || '');
                setNewProfilePicUrl(currentUser.photoURL || '');
                setIsProfileModalOpen(true);
                setAuthDropdownOpen(false);
              } else {
                navigateTo('login');
              }
            }}
            onOpenAuth={() => setAuthDropdownOpen(prev => !prev)}
          />
        ) : activePage === 'saved' ? (
          <SavedPage onLoadQR={handleLoadQR} onNavigate={navigateTo} showToast={showToast} />
        ) : activePage === 'batch' ? (
          <BatchPage
            onNavigate={navigateTo}
            activeGeneratorStyle={getActiveStyle()}
            setBatchItems={setBatchItems}
            batchItems={batchItems}
            onEditBatchItemStyle={handleEditBatchItemStyle}
            initialBatchType={batchPageDefaultType}
          />
        ) : activePage === 'barcode' ? (
          <BarcodePage 
            onNavigate={navigateTo} 
            showToast={showToast} 
            loadedBarcodeItem={loadedBarcodeItem}
            setLoadedBarcodeItem={setLoadedBarcodeItem}
            theme={theme}
            setTheme={setTheme}
            effectiveTheme={effectiveTheme}
            activeBatchItemIndex={activeBatchItemIndex}
            batchItems={batchItems}
            setBatchItems={setBatchItems}
            setActiveBatchItemIndex={setActiveBatchItemIndex}
          />
        ) : activePage === 'settings' ? (
          <SettingsPage 
            theme={theme} 
            setTheme={setTheme} 
            effectiveTheme={effectiveTheme} 
            onNavigate={navigateTo}
            currentUser={currentUser}
            showToast={showToast}
          />
        ) : activePage === 'you' ? (
          <YouPage 
            onNavigate={navigateTo} 
            theme={theme} 
            setTheme={setTheme} 
            effectiveTheme={effectiveTheme} 
            currentUser={currentUser}
            showToast={showToast}
          />
        ) : activePage === 'onboarding' ? (
          <OnboardingFlow
            theme={theme}
            effectiveTheme={effectiveTheme}
            onComplete={() => {
              if (currentUser) {
                navigateTo('home');
              } else {
                setIsFirstLaunchLogin(true);
                navigateTo('login');
              }
            }}
          />
        ) : activePage === 'login' ? (
          <LoginPage
            theme={theme}
            effectiveTheme={effectiveTheme}
            onNavigate={(p) => {
              setIsFirstLaunchLogin(false);
              navigateTo(p);
            }}
            onSuccess={() => {
              setIsFirstLaunchLogin(false);
              navigateTo('home');
            }}
            isFirstLaunch={isFirstLaunchLogin}
          />
        ) : activePage === 'signup' ? (
          <SignUpPage
            theme={theme}
            effectiveTheme={effectiveTheme}
            onNavigate={(p) => navigateTo(p)}
            onSuccess={() => {
              setIsFirstLaunchLogin(false);
              navigateTo('home');
            }}
          />
        ) : activePage === 'forgot-password' ? (
          <ForgotPasswordPage
            theme={theme}
            effectiveTheme={effectiveTheme}
            onNavigate={(p) => navigateTo(p)}
          />
        ) : (
          <HistoryPage onLoadQR={handleLoadQR} onNavigate={navigateTo} initialFilter={historyFilter} showToast={showToast} />
        )}
      </main>

      {/* ── Bottom Navigation Bar (Only for Generator) ── */}
      {activePage === 'generator' && (
        <nav className="bottom-nav">
          {TABS.filter(tab => activeBatchItemIndex === null || tab.id !== 'content').map(tab => (
            <button
              key={tab.id}
              className={`bottom-nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{ position: 'relative' }}
            >
              <PaidCrownBadge featureId={tab.featId} position="floating" size={9} />
              <div className="bottom-nav-highlight" />
              <span className="bottom-nav-icon">
                <tab.icon size={24} strokeWidth={2} />
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
      {/* ── Main App Navigation ── */}
      {(['home', 'saved', 'history', 'you', 'settings'].includes(activePage)) && (
        <nav className="bottom-nav">
          <button 
            className={`bottom-nav-tab${activePage === 'home' ? ' active' : ''}`}
            onClick={() => navigateTo('home')}
          >
            <span className="bottom-nav-icon"><Home size={24} /></span>
            <span className="bottom-nav-label">Home</span>
          </button>
          
          <button 
            className={`bottom-nav-tab${activePage === 'saved' ? ' active' : ''}`}
            onClick={() => navigateTo('saved')}
          >
            <span className="bottom-nav-icon"><Bookmark size={24} /></span>
            <span className="bottom-nav-label">Saved</span>
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
              className="floating-scan-btn glow-scan-btn"
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
            <span className="bottom-nav-icon"><History size={24} /></span>
            <span className="bottom-nav-label">History</span>
          </button>
          
          <button 
            className={`bottom-nav-tab${(activePage === 'you' || activePage === 'settings') ? ' active' : ''}`}
            onClick={() => navigateTo('you')}
          >
            <span className="bottom-nav-icon">
              <Settings size={24} />
            </span>
            <span className="bottom-nav-label">Settings</span>
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
              <QRDataInput type={qrType} data={qrData} onChange={(newData) => { generatorIsDirtyRef.current = true; setQrData(newData); }} />
            </div>
            <button className="modal-done-btn" onClick={() => setIsDataModalOpen(false)}>
              Update QR Code
            </button>
          </div>
        </div>
      )}
      {/* ── Template Text Modal (Popup style matching QR Data Modal) ── */}
      {isTemplateTextModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTemplateTextModalOpen(false)}>
          <div className="modal-container glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <h3>{selectedTemplate?.styleFamily === 'vcard' ? 'Edit vCard Details' : (selectedTemplate ? `${selectedTemplate.name} Text` : 'Template Text')}</h3>
                <p>Customize the text displayed on this template</p>
              </div>
              <button className="modal-close" onClick={() => setIsTemplateTextModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
              {selectedTemplate?.styleFamily === 'vcard' ? (
                /* vCard template text inputs */
                <QRDataInput 
                  type={QR_TYPES.VCARD} 
                  data={qrData} 
                  onChange={(newData) => { 
                    generatorIsDirtyRef.current = true; 
                    setQrData(newData); 
                  }} 
                />
              ) : (
                /* Standard & Frame headline & subtitle inputs */
                <>
                  {/* Top Headline / Frame Banner Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {selectedTemplate?.styleFamily === 'frame' ? 'Frame Banner / Text' : 'Top Headline Banner'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={templateHeadlineText}
                      onChange={(e) => {
                        generatorIsDirtyRef.current = true;
                        setTemplateHeadlineText(e.target.value);
                      }}
                      placeholder={selectedTemplate?.labelText || selectedTemplate?.headline || selectedTemplate?.defaultHeadline || 'Enter text...'}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  {/* Bottom Handle / Subtitle Input (Only for templates that support subtitle/handle, hidden for frame templates) */}
                  {selectedTemplate?.styleFamily !== 'frame' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Bottom Handle / Subtitle
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={templateHandleText}
                        onChange={(e) => {
                          generatorIsDirtyRef.current = true;
                          setTemplateHandleText(e.target.value);
                        }}
                        placeholder={selectedTemplate?.subtitle || selectedTemplate?.defaultHandle || selectedTemplate?.handle || 'Enter handle / username...'}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Typography & Font Family Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Font Family
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(214,0,54,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        {templateFont}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                      gap: '8px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      paddingRight: '2px'
                    }}>
                      {FONT_OPTIONS.map(font => {
                        const isSelected = templateFont === font.id;
                        return (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => {
                              generatorIsDirtyRef.current = true;
                              setTemplateFont(font.id);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              background: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                              fontFamily: font.id,
                              fontSize: '13px',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {font.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedTemplate && (
                    <button
                      onClick={() => {
                        setTemplateHeadlineText(selectedTemplate.headline || selectedTemplate.defaultHeadline || selectedTemplate.labelText || '');
                        setTemplateHandleText(selectedTemplate.subtitle || selectedTemplate.defaultHandle || selectedTemplate.handle || '');
                        setTemplateFont('Outfit');
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                        marginTop: '4px'
                      }}
                    >
                      <RotateCcw size={13} /> Reset text &amp; font to default
                    </button>
                  )}
                </>
              )}
            </div>
            <button className="modal-done-btn" onClick={() => setIsTemplateTextModalOpen(false)}>
              Save &amp; Update
            </button>
          </div>
        </div>
      )}
      {/* Floating Island Toast Notification */}
      {toast && (
        <div 
          className={`app-toast app-toast-${toast.type || 'success'}`}
          onClick={() => setToast(null)}
          role="status"
          aria-live="polite"
        >
          <div className="app-toast-icon">
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} strokeWidth={2.5} />
            ) : toast.type === 'info' ? (
              <Info size={16} strokeWidth={2.5} />
            ) : (
              <AlertCircle size={16} strokeWidth={2.5} />
            )}
          </div>
          <span className="app-toast-msg">{toast.message}</span>
          <button 
            className="app-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Export Success Modal */}
      {exportSuccessInfo && (
        <div 
          onClick={() => setExportSuccessInfo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(9, 9, 15, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated, #0C0C14)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '24px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Export Complete! 🎉
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {exportSuccessInfo.isNative
                ? `Your QR code has been saved to your device's Documents folder:`
                : `Your QR code has been generated and downloaded:`
              }
            </p>

            <div style={{
              width: '100%',
              background: 'var(--bg-hover, rgba(255,255,255,0.05))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
              boxSizing: 'border-box'
            }}>
              <FileImage size={20} color="var(--accent-primary, #D60036)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                {exportSuccessInfo.filename}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setExportSuccessInfo(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
              {exportSuccessInfo.isNative && exportSuccessInfo.fileUri && (
                <button
                  onClick={async () => {
                    try {
                      await Share.share({
                        title: 'Mushi QR Pro',
                        text: `Check out this QR code I made!`,
                        url: exportSuccessInfo.fileUri,
                        dialogTitle: 'Share your QR Code',
                      });
                    } catch (e) {}
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'var(--accent-primary, #D60036)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Share2 size={16} /> Share
                </button>
              )}
            </div>
          </div>
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
          onPointerDown={handlePipettePointerDown}
          onPointerMove={handlePipettePointerMove}
          onPointerUp={handlePipettePointerUp}
          onTouchStart={handlePipettePointerDown}
          onTouchMove={handlePipettePointerMove}
          onTouchEnd={handlePipettePointerUp}
          onTouchCancel={handlePipettePointerUp}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            pointerEvents: 'all',
            touchAction: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '40px',
            background: 'rgba(0,0,0,0.08)',
            cursor: 'crosshair'
          }}
        >
          <div 
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            style={{ 
              background: 'var(--bg-primary)', 
              padding: '6px 12px', 
              borderRadius: '30px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--accent-primary)',
              pointerEvents: 'all',
              cursor: 'default'
            }}
          >
            <Pipette size={14} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', userSelect: 'none' }}>Pick Color</span>
            <div style={{ width: '1px', height: '12px', background: 'var(--border-color)', margin: '0 2px' }} />
            <button 
              onClick={() => { setIsPipetteActive(false); setHoverColor(null); setAdvPicker(prev => ({ ...prev, open: true })); }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {isPipetteActive && (
        <div 
          style={{
            position: 'fixed',
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y - 70}px`,
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '110px',
            pointerEvents: 'none',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            visibility: hoverColor ? 'visible' : 'hidden',
            opacity: hoverColor ? 1 : 0,
            transition: 'opacity 0.15s ease, visibility 0.15s ease'
          }}
        >
          {/* Circular bubble */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '4px solid white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hoverColor || 'transparent'
          }}>
            <canvas 
              ref={loupeCanvasRef} 
              width={80} 
              height={80} 
              style={{ 
                width: '80px', 
                height: '80px',
                display: 'block'
              }} 
            />
            {/* Inner ring for visual contrast */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.2)',
              pointerEvents: 'none'
            }} />
          </div>
          {/* Color Code Label under the bubble */}
          <div style={{
            marginTop: '8px',
            backgroundColor: 'rgba(0,0,0,0.85)',
            
            color: 'white',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}>
            {hoverColor ? hoverColor.toUpperCase() : ''}
          </div>
        </div>
      )}
      {/* ── Unsaved Changes Modal ── */}
      {unsavedChangesModal.isOpen && (
        <div className="modal-overlay" onClick={handleCancelExit}>
          <div className="modal-container glass-panel" style={{ position: 'relative', maxWidth: '360px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(214, 0, 54, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Unsaved Changes</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                You have modified this QR code. Do you want to update your changes before leaving?
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={handleSaveAndExit}
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(214, 0, 54, 0.2)'
                }}
              >
                Update Changes
              </button>
              
              <button 
                onClick={handleDiscardAndExit}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#D60036',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(214, 0, 54, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── My Profile Modal ── */}
      {isProfileModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-container" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '24px', color: '#0F172A', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>My Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <UserAvatar user={{ ...currentUser, photoURL: newProfilePicUrl }} size={80} border="3px solid #E2E8F0" />
                </div>
                {currentUser?.providerData?.some(p => p.providerId === 'google.com') && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        showToast('Syncing with Google...');
                        await auth.currentUser?.reload();
                        if (auth.currentUser) {
                          setCurrentUser({ ...auth.currentUser });
                          const freshPhoto = auth.currentUser.photoURL || auth.currentUser.providerData?.[0]?.photoURL || '';
                          setNewProfilePicUrl(freshPhoto);
                          showToast('Google photo updated!');
                        }
                      } catch (e) {
                        showToast('Could not sync with Google.');
                      }
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0070F3',
                      background: 'rgba(0, 112, 243, 0.08)',
                      border: '1px solid rgba(0, 112, 243, 0.2)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} /> Sync Google Photo
                  </button>
                )}
              </div>
              
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>PROFILE IMAGE URL</label>
                <input 
                  type="text" 
                  value={newProfilePicUrl} 
                  onChange={e => setNewProfilePicUrl(e.target.value)} 
                  placeholder="https://example.com/avatar.jpg"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>DISPLAY NAME</label>
                <input 
                  type="text" 
                  value={profileNameInput} 
                  onChange={e => setProfileNameInput(e.target.value)} 
                  placeholder="Your Name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                <input 
                  type="text" 
                  value={currentUser.email} 
                  disabled
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#64748B', fontSize: '14px', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #CBD5E1', background: 'transparent', borderRadius: '12px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const { updateProfile: fbUpdateProfile } = await import('firebase/auth');
                    await fbUpdateProfile(auth.currentUser, { 
                      displayName: profileNameInput.trim(),
                      photoURL: newProfilePicUrl.trim()
                    });
                    showToast('Profile updated successfully!');
                    setIsProfileModalOpen(false);
                  } catch (err) {
                    console.error(err);
                    showToast('Failed to update profile.');
                  }
                }}
                style={{ flex: 1, padding: '12px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(214,0,54,0.2)' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Security & Login Modal ── */}
      {isSecurityModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setIsSecurityModalOpen(false)}>
          <div className="modal-container" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '24px', color: '#0F172A', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>Security &amp; Login</h3>
              <button onClick={() => setIsSecurityModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            {currentUser.providerData[0]?.providerId === 'google.com' ? (
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Shield size={24} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>Google Auth Secure Connection</h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4, margin: '0 0 20px' }}>
                  Your account is secured via Google Authentication. Password updates and Two-Factor settings are safely managed by your Google Account.
                </p>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  style={{ width: '100%', padding: '12px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close Settings
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  Update your account password. Must be at least 6 characters long.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>NEW PASSWORD</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>CONFIRM PASSWORD</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button 
                    onClick={() => setIsSecurityModalOpen(false)}
                    style={{ flex: 1, padding: '12px', border: '1px solid #CBD5E1', background: 'transparent', borderRadius: '12px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (newPassword.length < 6) {
                        showToast('Password must be at least 6 characters long.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        showToast('Passwords do not match.');
                        return;
                      }
                      setIsChangingPassword(true);
                      try {
                        const { updatePassword: fbUpdatePassword } = await import('firebase/auth');
                        await fbUpdatePassword(auth.currentUser, newPassword);
                        showToast('Password updated successfully!');
                        setIsSecurityModalOpen(false);
                      } catch (err) {
                        console.error(err);
                        showToast('Failed to update password. Try logging in again.');
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    disabled={isChangingPassword}
                    style={{ flex: 1, padding: '12px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: isChangingPassword ? 0.7 : 1 }}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Complete Cloud Sync, Restore & Data Management Modal ── */}
      {isCloudSyncModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => !isSyncing && setIsCloudSyncModalOpen(false)}>
          <div 
            className="modal-container" 
            style={{ 
              background: 'var(--bg-elevated, #0F172A)', 
              border: '1px solid var(--border-color, #334155)', 
              borderRadius: '24px', 
              width: '94%', 
              maxWidth: '520px', 
              padding: '24px', 
              color: 'var(--text-primary, #FFFFFF)', 
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              fontFamily: 'var(--font-sans)',
              boxSizing: 'border-box'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                  <Cloud size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #FFFFFF)' }}>Cloud Data Manager</h3>
                </div>
              </div>
              <button 
                onClick={() => !isSyncing && setIsCloudSyncModalOpen(false)} 
                disabled={isSyncing}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary, #94A3B8)', cursor: 'pointer', fontSize: '24px', lineHeight: 1, padding: '4px' }}
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs (Sync / Restore / Clear) */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-primary, #0B0F19)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '18px',
              border: '1px solid var(--border-color, #1E293B)'
            }}>
              <button
                onClick={() => setCloudSyncTab('sync')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '9px',
                  border: 'none',
                  background: cloudSyncTab === 'sync' ? 'var(--accent-primary, #D60036)' : 'transparent',
                  color: cloudSyncTab === 'sync' ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.2s'
                }}
              >
                <Cloud size={14} />
                <span>Backup</span>
              </button>
              <button
                onClick={() => setCloudSyncTab('restore')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '9px',
                  border: 'none',
                  background: cloudSyncTab === 'restore' ? 'var(--accent-primary, #D60036)' : 'transparent',
                  color: cloudSyncTab === 'restore' ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.2s'
                }}
              >
                <Download size={14} />
                <span>Restore</span>
              </button>
              <button
                onClick={() => setCloudSyncTab('clear')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '9px',
                  border: 'none',
                  background: cloudSyncTab === 'clear' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: cloudSyncTab === 'clear' ? '#EF4444' : 'var(--text-secondary, #94A3B8)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </div>

            {/* ── TAB 1: BACKUP / SYNC ── */}
            {cloudSyncTab === 'sync' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {/* Sync Saved */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899', flexShrink: 0 }}>
                        <Bookmark size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>Saved</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{getSaved().length} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing}
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          const res = await syncUserSavedData();
                          if (res.success) {
                            showToast(`Saved synced! (${res.savedCount || getSaved().length} in cloud)`);
                            const counts = await getUserCloudCounts();
                            setCloudCounts(counts);
                          } else {
                            showToast(res.error || 'Failed to sync saved.');
                          }
                        } catch (e) {
                          showToast('Sync error.');
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(236, 72, 153, 0.15)',
                        color: '#EC4899',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: isSyncing ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isSyncing ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                      <span>Sync</span>
                    </button>
                  </div>

                  {/* Sync History */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <History size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>History</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{getHistory().length} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing}
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          const res = await syncUserHistoryData();
                          if (res.success) {
                            showToast(`History synced! (${res.historyCount || getHistory().length} in cloud)`);
                            const counts = await getUserCloudCounts();
                            setCloudCounts(counts);
                          } else {
                            showToast(res.error || 'Failed to sync history.');
                          }
                        } catch (e) {
                          showToast('Sync error.');
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: isSyncing ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isSyncing ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                      <span>Sync</span>
                    </button>
                  </div>
                </div>

                <button
                  disabled={isSyncing}
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      const res = await syncUserAllData();
                      if (res.success) {
                        showToast('All saved and history records synced to cloud!');
                        const counts = await getUserCloudCounts();
                        setCloudCounts(counts);
                        setIsCloudSyncModalOpen(false);
                      } else {
                        showToast(res.error || 'Sync failed.');
                      }
                    } catch (e) {
                      showToast('Sync error.');
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: isSyncing ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(214, 0, 54, 0.25)',
                    opacity: isSyncing ? 0.7 : 1
                  }}
                >
                  {isSyncing ? <Loader2 size={16} className="spin" /> : <Cloud size={16} />}
                  <span>{isSyncing ? 'Syncing...' : 'Sync All (Saved + History)'}</span>
                </button>
              </div>
            )}

            {/* ── TAB 2: RESTORE FROM CLOUD ── */}
            {cloudSyncTab === 'restore' && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', margin: '0 0 12px', lineHeight: 1.4 }}>
                  Restore your cloud backups onto this device without losing existing local records:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {/* Restore Saved */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0 }}>
                        <Bookmark size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>Saved</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{cloudCounts.cloudSavedCount} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing || cloudCounts.cloudSavedCount === 0}
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          const res = await restoreUserSavedData();
                          if (res.success) {
                            showToast(`Restored ${res.restoredSavedCount} saved from cloud!`);
                          } else {
                            showToast(res.error || 'Restore failed.');
                          }
                        } catch (e) {
                          showToast('Restore error.');
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3B82F6',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: (isSyncing || cloudCounts.cloudSavedCount === 0) ? 'default' : 'pointer',
                        opacity: cloudCounts.cloudSavedCount === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isSyncing ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                      <span>Restore</span>
                    </button>
                  </div>

                  {/* Restore History */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <History size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>History</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{cloudCounts.cloudHistoryCount} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing || cloudCounts.cloudHistoryCount === 0}
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          const res = await restoreUserHistoryData();
                          if (res.success) {
                            showToast(`Restored ${res.restoredHistoryCount} history from cloud!`);
                          } else {
                            showToast(res.error || 'Restore failed.');
                          }
                        } catch (e) {
                          showToast('Restore error.');
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: (isSyncing || cloudCounts.cloudHistoryCount === 0) ? 'default' : 'pointer',
                        opacity: cloudCounts.cloudHistoryCount === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isSyncing ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                      <span>Restore</span>
                    </button>
                  </div>
                </div>

                <button
                  disabled={isSyncing || (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0)}
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      const res = await restoreUserAllData();
                      if (res.success) {
                        showToast(`Restored all cloud data successfully!`);
                        setIsCloudSyncModalOpen(false);
                      } else {
                        showToast(res.error || 'Restore failed.');
                      }
                    } catch (e) {
                      showToast('Restore error.');
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: (isSyncing || (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0)) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(214, 0, 54, 0.25)',
                    opacity: (isSyncing || (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0)) ? 0.5 : 1
                  }}
                >
                  {isSyncing ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                  <span>{isSyncing ? 'Restoring...' : 'Restore Everything from Cloud'}</span>
                </button>
              </div>
            )}

            {/* ── TAB 3: CLEAR CLOUD DATA ── */}
            {cloudSyncTab === 'clear' && (
              <div>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  fontSize: '11.5px',
                  color: '#EF4444',
                  lineHeight: 1.4
                }}>
                  ⚠️ <strong>Notice:</strong> This deletes backup data from the cloud server. Your local items on this device will NOT be affected.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {/* Clear Saved */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899', flexShrink: 0 }}>
                        <Bookmark size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>Saved</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{cloudCounts.cloudSavedCount} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing || cloudCounts.cloudSavedCount === 0}
                      onClick={() => {
                        setDeleteModalConfig({
                          isOpen: true,
                          title: 'Clear Saved?',
                          description: 'This will delete all saved QR codes and templates stored on the cloud server. Your local items on this device will NOT be deleted.',
                          itemTitle: `${cloudCounts.cloudSavedCount} cloud saved`,
                          confirmText: 'Clear Saved',
                          iconType: 'trash',
                          isDangerous: false,
                          onConfirm: async () => {
                            setIsSyncing(true);
                            try {
                              const res = await clearUserCloudSavedData();
                              if (res.success) {
                                showToast('Saved cloud backups cleared!');
                                setCloudCounts(prev => ({ ...prev, cloudSavedCount: 0 }));
                                const counts = await getUserCloudCounts();
                                setCloudCounts(counts);
                              } else {
                                showToast(res.error || 'Failed to clear cloud saved.');
                              }
                            } catch (e) {
                              showToast('Clear error.');
                            } finally {
                              setIsSyncing(false);
                            }
                          }
                        });
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'transparent',
                        color: '#EF4444',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: (isSyncing || cloudCounts.cloudSavedCount === 0) ? 'default' : 'pointer',
                        opacity: cloudCounts.cloudSavedCount === 0 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* Clear History */}
                  <div style={{
                    background: 'var(--bg-primary, #0B0F19)',
                    border: '1px solid var(--border-color, #1E293B)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <History size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)' }}>History</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>{cloudCounts.cloudHistoryCount} items</div>
                      </div>
                    </div>
                    <button
                      disabled={isSyncing || cloudCounts.cloudHistoryCount === 0}
                      onClick={() => {
                        setDeleteModalConfig({
                          isOpen: true,
                          title: 'Clear History?',
                          description: 'This will delete all history and scan backups from the cloud server. Your local history on this device will NOT be deleted.',
                          itemTitle: `${cloudCounts.cloudHistoryCount} cloud history`,
                          confirmText: 'Clear History',
                          iconType: 'trash',
                          isDangerous: false,
                          onConfirm: async () => {
                            setIsSyncing(true);
                            try {
                              const res = await clearUserCloudHistoryData();
                              if (res.success) {
                                showToast('History cloud backups cleared!');
                                setCloudCounts(prev => ({ ...prev, cloudHistoryCount: 0 }));
                                const counts = await getUserCloudCounts();
                                setCloudCounts(counts);
                              } else {
                                showToast(res.error || 'Failed to clear cloud history.');
                              }
                            } catch (e) {
                              showToast('Clear error.');
                            } finally {
                              setIsSyncing(false);
                            }
                          }
                        });
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'transparent',
                        color: '#EF4444',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: (isSyncing || cloudCounts.cloudHistoryCount === 0) ? 'default' : 'pointer',
                        opacity: cloudCounts.cloudHistoryCount === 0 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <button
                  disabled={isSyncing || (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0)}
                  onClick={() => {
                    setDeleteModalConfig({
                      isOpen: true,
                      title: 'Delete All Backups?',
                      description: 'Are you sure you want to permanently erase ALL saved codes and history records from the cloud server? (Your local device data is completely safe and will remain untouched).',
                      itemTitle: `${cloudCounts.cloudSavedCount + cloudCounts.cloudHistoryCount} total cloud records`,
                      confirmText: 'Delete All Backups',
                      iconType: 'alert',
                      isDangerous: true,
                      onConfirm: async () => {
                        setIsSyncing(true);
                        try {
                          const res = await clearUserCloudAllData();
                          if (res.success) {
                            showToast('All cloud backups deleted successfully!');
                            setCloudCounts({ cloudSavedCount: 0, cloudHistoryCount: 0 });
                            const counts = await getUserCloudCounts();
                            setCloudCounts(counts);
                          } else {
                            showToast(res.error || 'Clear all failed.');
                          }
                        } catch (e) {
                          showToast('Clear error.');
                        } finally {
                          setIsSyncing(false);
                        }
                      }
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: (isSyncing || (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0)) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
                    opacity: (cloudCounts.cloudSavedCount === 0 && cloudCounts.cloudHistoryCount === 0) ? 0.4 : 1
                  }}
                >
                  {isSyncing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                  <span>{isSyncing ? 'Deleting...' : 'Delete All Backups'}</span>
                </button>
              </div>
            )}

            {/* Privacy Guarantee Footer */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary, #94A3B8)',
              textAlign: 'center',
              lineHeight: 1.4,
              marginTop: '16px',
              borderTop: '1px solid var(--border-color, #1E293B)',
              paddingTop: '12px'
            }}>
              🔒 Settings, Theme &amp; Device preferences are 100% private to this device and are never uploaded or altered.
            </div>
          </div>
        </div>
      )}
      <SaveLocationModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        showToast={showToast}
      />
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        itemTitle={deleteModalConfig.itemTitle}
        confirmText={deleteModalConfig.confirmText}
        iconType={deleteModalConfig.iconType}
        isDangerous={deleteModalConfig.isDangerous}
      />
      <FullScreenPreviewModal
        isOpen={isFullScreenPreviewOpen}
        onClose={() => setIsFullScreenPreviewOpen(false)}
        sourceCanvasRef={canvasRef}
        template={selectedTemplate}
        headlineText={templateHeadlineText}
        handleText={templateHandleText}
      />
      {cropModalConfig && (
        <ImageCropShapeModal
          isOpen={Boolean(cropModalConfig?.isOpen)}
          imageSrc={cropModalConfig?.imageSrc}
          imageName={cropModalConfig?.imageName}
          title={cropModalConfig?.title || 'Crop & Shape Photo'}
          initialShape={cropModalConfig?.initialShape || 'rounded'}
          allowShapeSelect={cropModalConfig?.allowShapeSelect !== false}
          onConfirm={cropModalConfig?.onConfirm}
          onCancel={() => setCropModalConfig(null)}
        />
      )}
    </div>
  );
}
function TemplatePreviewCanvas({ template, theme, qrMatrixInfo, currentQrOptions }) {
  const ref = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const w = 640; // High-res preview base width
    const h = template.heightRatio ? Math.round(w * template.heightRatio) : w;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, w, h);

    const onAssetLoaded = () => setTick(t => t + 1);

    // 1. Draw template background
    if (template.drawBackground) {
      template.drawBackground(ctx, w, h, { onAssetLoaded });
    }

    // 2. Draw real QR code inside placeholder slot
    ctx.save();
    const tplQrSize = w * template.qrSize;
    const tplQrX = w * template.qrX - tplQrSize / 2;
    const tplQrY = h * template.qrY - tplQrSize / 2;

    // Use current active QR matrix, or fallback to standard 21x21 matrix if none
    const activeMatrixInfo = qrMatrixInfo || generateQRMatrix('https://mushiqr.pro');

    if (activeMatrixInfo) {
      // Create temporary canvas to render real QR with exact shape/colors/styles
      const qrTempCanvas = document.createElement('canvas');
      qrTempCanvas.width = 512;
      qrTempCanvas.height = 512;

      // Combine current user QR styling options with template preset overrides
      const optionsForQR = {
        ...activeMatrixInfo,
        size: 512,
        qrColor: template.preset?.qrColor || currentQrOptions?.qrColor || '#000000',
        bgColor: template.preset?.bgColor || currentQrOptions?.bgColor || '#FFFFFF',
        bgTransparent: template.preset?.bgTransparent ?? (currentQrOptions?.bgTransparent || false),
        qrBgShape: currentQrOptions?.qrBgShape || 'full',
        dotStyle: template.preset?.dotStyle || currentQrOptions?.dotStyle || DOT_STYLES.DENSO,
        eyeStyle: template.preset?.eyeStyle || currentQrOptions?.eyeStyle || EYE_STYLES.SQUARE,
        eyeColor: template.preset?.eyeColor || currentQrOptions?.eyeColor || '',
        eyeOuterColor: template.preset?.eyeOuterColor || currentQrOptions?.eyeOuterColor || '',
        syncEyes: currentQrOptions?.syncEyes ?? true,
        gradientEnabled: currentQrOptions?.gradientEnabled || false,
        gradientColor1: currentQrOptions?.gradientColor1 || '#000000',
        gradientColor2: currentQrOptions?.gradientColor2 || '#0066ff',
        gradientType: currentQrOptions?.gradientType || 'linear',
        qrTextureEnabled: currentQrOptions?.qrTextureEnabled || false,
        qrTexture: currentQrOptions?.qrTexture || null,
        qrTextureSyncEyes: currentQrOptions?.qrTextureSyncEyes || false,
        qrSizeScale: currentQrOptions?.qrSizeScale || 1,
        qrPosX: currentQrOptions?.qrPosX || 0.5,
        qrPosY: currentQrOptions?.qrPosY || 0.5,
        logo: currentQrOptions?.logo || null,
        logoWidth: currentQrOptions?.logoWidth || 0.18,
        logoHeight: currentQrOptions?.logoHeight || 0.18,
        logoPadding: currentQrOptions?.logoPadding || 10,
        logoBackground: currentQrOptions?.logoBackground || false,
        logoBgColor: currentQrOptions?.logoBgColor || '#ffffff',
        logoBgShape: currentQrOptions?.logoBgShape || 'circle',
        logoOutline: currentQrOptions?.logoOutline || false,
        logoOutlineColor: currentQrOptions?.logoOutlineColor || '#000000',
        logoOutlineWidth: currentQrOptions?.logoOutlineWidth || 3,
        logoOutlineOpacity: currentQrOptions?.logoOutlineOpacity || 1,
        quietZone: 2,
      };

      renderQR(qrTempCanvas, optionsForQR);
      ctx.drawImage(qrTempCanvas, tplQrX, tplQrY, tplQrSize, tplQrSize);
    }
    ctx.restore();

    // 3. Draw template foreground overlay
    if (template.drawForeground) template.drawForeground(ctx, w, h);
  }, [template, theme, tick, qrMatrixInfo, currentQrOptions]);

  return <canvas ref={ref} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px', display: 'block' }} />;
}
