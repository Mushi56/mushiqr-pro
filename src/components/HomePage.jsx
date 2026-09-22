import React, { useState, useEffect, useRef } from 'react';
import { Menu, Crown, Plus, Link2, Type, Wifi, User, Mail, MapPin, History, Moon, Sun, Info, Shield, FileText, Home, Bookmark, Settings, QrCode, ChevronLeft, ChevronRight, ScanLine, Phone, MessageSquare, FileCode, Image, Trash2, Star, FileSpreadsheet, Barcode, Link, Contact, File, Music, Coins, MessageCircle, Play, Calendar, Layers, Zap, Target } from 'lucide-react';
import { FaInstagram, FaFacebookF, FaXTwitter, FaLinkedinIn } from 'react-icons/fa6';
import { QR_TYPES, renderQR, generateQRMatrix, getQRItemTitle, getQRItemSubtitle } from '../utils/qrEngine';
import { renderBarcode } from '../utils/barcodeEngine';
import { getHistory, deleteFromHistory, clearHistory, getSaved, saveToSaved, deleteFromSaved, isItemSaved, toggleSaved } from '../utils/storage';
import AppIcon from './AppIcon';
import GoldenAdminBadge from './GoldenAdminBadge';
import PaidCrownBadge from './PaidCrownBadge';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useUserRole } from '../services/roleService';

function HeroQRCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate a clean "Hello User" matrix
    const demoMatrixInfo = generateQRMatrix("Hello User", 'H');
    if (!demoMatrixInfo) return;

    const options = {
      ...demoMatrixInfo,
      bgColor: 'transparent',
      bgTransparent: true,
      qrColor: '#FFFFFF',          // Consistent white color
      eyeColor: '#FFFFFF',
      eyeOuterColor: '#FFFFFF',
      logo: null,
      textCenterEnabled: false,
      textCenter: null,
      frameStyle: 'none',
      quietZone: 0,                // No quiet zone for maximum size
      size: 360,                   // High-res render size
      dotStyle: 'rounded',         // Rounded dot style
      eyeStyle: 'rounded'          // Rounded eye style
    };

    renderQR(canvasRef.current, options);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width="360"
      height="360"
      style={{
        width: '80px',
        height: '80px',
        display: 'block'
      }}
    />
  );
}

function HeroQRCanvasBatch() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate a clean batch matrix
    const demoMatrixInfo = generateQRMatrix("Batch QR", 'H');
    if (!demoMatrixInfo) return;

    const options = {
      ...demoMatrixInfo,
      bgColor: 'transparent',
      bgTransparent: true,
      qrColor: '#FFFFFF',
      eyeColor: '#FFFFFF',
      eyeOuterColor: '#FFFFFF',
      logo: null,
      textCenterEnabled: false,
      textCenter: null,
      frameStyle: 'none',
      quietZone: 0,
      size: 360,
      dotStyle: 'dots',         // Different dot style for visual distinction
      eyeStyle: 'circle'        // Different eye style for visual distinction
    };

    renderQR(canvasRef.current, options);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width="360"
      height="360"
      style={{
        width: '80px',
        height: '80px',
        display: 'block'
      }}
    />
  );
}

function HeroBarcodeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderBarcode(canvasRef.current, "BARCODE-PRO", {
      barColor: '#FFFFFF',
      bgColor: 'transparent',
      barWidth: 2,
      height: 60,
      margin: 10,
      displayValue: false
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '80px',
        height: '60px',
        display: 'block'
      }}
    />
  );
}

const getBarcodeIcon = (id) => {
  switch (id) {
    // 1D Retail Barcodes (EAN-13, EAN-8, UPC-A, UPC-E)
    case 'ean13':
    case 'ean8':
    case 'upca':
    case 'upce':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="5" x2="3" y2="19" />
          <line x1="6" y1="5" x2="6" y2="19" strokeWidth="2.5" />
          <line x1="10" y1="5" x2="10" y2="19" />
          <line x1="13" y1="5" x2="13" y2="19" strokeWidth="3" />
          <line x1="17" y1="5" x2="17" y2="19" />
          <line x1="21" y1="5" x2="21" y2="19" strokeWidth="1.5" />
          <rect x="2" y="15" width="8" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.15" />
          <path d="M4 18h4" strokeWidth="1" />
        </svg>
      );

    // 1D General / Industrial Barcodes (Code 128, Code 39, Code 93, Code 11, Codabar, GS1-128)
    case 'code128':
    case 'code39':
    case 'code93':
    case 'code11':
    case 'codabar':
    case 'gs1128':
    case 'i25':
    case 'telepen':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.3" />
          <line x1="5" y1="7" x2="5" y2="17" strokeWidth="2" />
          <line x1="9" y1="7" x2="9" y2="17" strokeWidth="1" />
          <line x1="12" y1="7" x2="12" y2="17" strokeWidth="3" />
          <line x1="15" y1="7" x2="15" y2="17" strokeWidth="1" />
          <line x1="19" y1="7" x2="19" y2="17" strokeWidth="2" />
        </svg>
      );

    // 2D Square Matrix Barcodes (Data Matrix)
    case 'datamatrix':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 3v18h18" strokeWidth="2.5" />
          <line x1="7" y1="3" x2="7" y2="5" strokeWidth="1.5" />
          <line x1="11" y1="3" x2="11" y2="5" strokeWidth="1.5" />
          <line x1="15" y1="3" x2="15" y2="5" strokeWidth="1.5" />
          <line x1="19" y1="3" x2="19" y2="5" strokeWidth="1.5" />
          <line x1="21" y1="7" x2="19" y2="7" strokeWidth="1.5" />
          <line x1="21" y1="11" x2="19" y2="11" strokeWidth="1.5" />
          <line x1="21" y1="15" x2="19" y2="15" strokeWidth="1.5" />
          <rect x="7" y="7" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="13" y="7" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="7" y="13" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="13" y="13" width="2" height="2" fill="currentColor" stroke="none" />
        </svg>
      );

    // ITF-14 (Heavy border box standard)
    case 'itf14':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <rect x="2" y="5" width="20" height="14" strokeWidth="2.5" />
          <line x1="6" y1="8" x2="6" y2="16" strokeWidth="1.5" />
          <line x1="9" y1="8" x2="9" y2="16" strokeWidth="2.5" />
          <line x1="12" y1="8" x2="12" y2="16" strokeWidth="1.5" />
          <line x1="15" y1="8" x2="15" y2="16" strokeWidth="3" />
          <line x1="18" y1="8" x2="18" y2="16" strokeWidth="1.5" />
        </svg>
      );

    // GS1 DataBar (Multiple grouped elements, omnidirectional)
    case 'gs1databar':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="4" x2="3" y2="14" strokeWidth="2.5" />
          <line x1="6" y1="4" x2="6" y2="14" />
          <line x1="10" y1="4" x2="10" y2="14" strokeWidth="2.5" />
          <line x1="14" y1="4" x2="14" y2="14" />
          <line x1="17" y1="4" x2="17" y2="14" strokeWidth="2" />
          <line x1="21" y1="4" x2="21" y2="14" />
          <path d="M3 17h18" strokeWidth="2" />
          <line x1="6" y1="20" x2="18" y2="20" />
        </svg>
      );

    // PDF 417 / Stacked Linear Codes (Codablock F, Code 16K, Code 49)
    case 'pdf417':
    case 'codablockf':
    case 'code16k':
    case 'code49':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="5" rx="1" />
          <rect x="2" y="10" width="20" height="5" rx="1" />
          <rect x="2" y="16" width="20" height="5" rx="1" />

          <line x1="5" y1="6" x2="5" y2="8" strokeWidth="1.5" />
          <line x1="12" y1="6" x2="12" y2="8" strokeWidth="2" />
          <line x1="18" y1="6" x2="18" y2="8" />

          <line x1="7" y1="12" x2="7" y2="14" strokeWidth="2" />
          <line x1="14" y1="12" x2="14" y2="14" />

          <line x1="9" y1="18" x2="9" y2="20" />
          <line x1="16" y1="18" x2="16" y2="20" strokeWidth="2" />
        </svg>
      );

    // Postal Barcodes (Postnet, Planet, Royal Mail)
    case 'postnet':
    case 'planet':
    case 'royalmail':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="5" x2="3" y2="19" strokeWidth="2" />
          <line x1="6" y1="12" x2="6" y2="19" strokeWidth="2" />
          <line x1="9" y1="5" x2="9" y2="19" strokeWidth="2" />
          <line x1="12" y1="12" x2="12" y2="19" strokeWidth="2" />
          <line x1="15" y1="5" x2="15" y2="19" strokeWidth="2" />
          <line x1="18" y1="12" x2="18" y2="19" strokeWidth="2" />
          <line x1="21" y1="5" x2="21" y2="19" strokeWidth="2" />
        </svg>
      );

    // MSI Plessey / Pharmacode (Varying thick bars with color logic)
    case 'msi':
    case 'pharmacode':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="5" x2="3" y2="19" strokeWidth="3" />
          <line x1="8" y1="5" x2="8" y2="19" strokeWidth="1.5" />
          <line x1="13" y1="5" x2="13" y2="19" strokeWidth="4" />
          <line x1="18" y1="5" x2="18" y2="19" strokeWidth="2.5" />
        </svg>
      );

    // Aztec Code (2D Concentric Square Finder)
    case 'aztec':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="9" y="9" width="6" height="6" strokeWidth="2" />
          <rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none" />
          <line x1="6" y1="6" x2="6" y2="8" />
          <line x1="18" y1="16" x2="18" y2="18" />
          <line x1="6" y1="16" x2="8" y2="16" />
          <line x1="16" y1="6" x2="16" y2="8" />
        </svg>
      );

    // MaxiCode (2D Honeycomb with circular bullseye)
    case 'maxicode':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="12" cy="12" r="3" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="6" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      );

    // 2D QR Code / Micro QR / Han Xin
    case 'qrcode':
    case 'microqrcode':
    case 'hanxin':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="6" height="6" rx="1" strokeWidth="2" />
          <rect x="3" y="15" width="6" height="6" rx="1" strokeWidth="2" />
          <rect x="15" y="3" width="6" height="6" rx="1" strokeWidth="2" />

          <rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="5" y="17" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="17" y="5" width="2" height="2" fill="currentColor" stroke="none" />

          <rect x="14" y="14" width="3" height="3" rx="0.5" />
          <line x1="11" y1="3" x2="11" y2="21" strokeDasharray="2 2" opacity="0.5" />
          <line x1="3" y1="11" x2="21" y2="11" strokeDasharray="2 2" opacity="0.5" />
        </svg>
      );

    // Channel Code (Industrial sequential bars)
    case 'channelcode':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="5" x2="4" y2="19" strokeWidth="1.5" />
          <line x1="8" y1="5" x2="8" y2="19" strokeWidth="1.5" />
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="1.5" />
          <line x1="16" y1="5" x2="16" y2="19" strokeWidth="1.5" />
          <line x1="20" y1="5" x2="20" y2="19" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="5" x2="3" y2="19" />
          <line x1="8" y1="5" x2="8" y2="19" strokeWidth="2.5" />
          <line x1="13" y1="5" x2="13" y2="19" strokeWidth="1" />
          <line x1="17" y1="5" x2="17" y2="19" strokeWidth="3" />
          <line x1="21" y1="5" x2="21" y2="19" />
        </svg>
      );
  }
};

export default function HomePage({ currentUser, onScrollChange, onNavigate, onQuickCreate, onQuickCreateBarcode, onLoadQR, theme, setTheme, effectiveTheme, activePage, onMenuClick, onOpenProfile, onOpenAuth }) {
  const isDark = effectiveTheme === 'dark';
  const { isSuperAdmin } = useUserRole();
  const [recentItems, setRecentItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAllBarcodes, setShowAllBarcodes] = useState(false);
  const [showAllQR, setShowAllQR] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
  const slideCount = 3;

  const handleScroll = (e) => {
    const scrolled = e.currentTarget.scrollTop > 20;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
      if (onScrollChange) onScrollChange(scrolled);
    }
  };

  useEffect(() => {
    if (activePage === 'home' && onScrollChange) {
      onScrollChange(false);
    }
  }, [activePage]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      setActiveSlide(prev => (prev + 1) % slideCount);
    } else if (diff < -50) {
      setActiveSlide(prev => (prev - 1 + slideCount) % slideCount);
    }
  };

  useEffect(() => {
    if (activePage !== 'home' || isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slideCount);
    }, 5500);
    return () => clearInterval(interval);
  }, [activePage, isPaused, activeSlide]);

  useEffect(() => {
    const refreshData = () => {
      const history = getHistory().filter(item => item.source !== 'scan');
      setRecentItems(history.slice(0, 10));
      setSavedIds(new Set(getSaved().map(s => s.id)));
    };

    if (activePage === 'home') {
      refreshData();
    }

    window.addEventListener('storage-sync', refreshData);
    return () => window.removeEventListener('storage-sync', refreshData);
  }, [activePage]);

  const handleToggleSave = (item) => {
    toggleSaved(item);
    const updated = getSaved();
    setSavedIds(new Set(updated.map(s => s.id)));
  };

  const quickOptions = [
    { id: QR_TYPES.URL, label: 'Website', icon: <Link size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.TEXT, label: 'Text', icon: <Type size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.WIFI, label: 'WiFi', icon: <Wifi size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.VCARD, label: 'vCard', icon: <Contact size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.EMAIL, label: 'Email', icon: <Mail size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.PHONE, label: 'Phone', icon: <Phone size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.SMS, label: 'SMS', icon: <MessageSquare size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.LOCATION, label: 'Location', icon: <MapPin size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.PDF, label: 'PDF', icon: <FileCode size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.IMAGE, label: 'Image', icon: <Image size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.INSTAGRAM, label: 'Instagram', icon: <FaInstagram size={20} /> },
    { id: QR_TYPES.FACEBOOK, label: 'Facebook', icon: <FaFacebookF size={20} /> },
    { id: QR_TYPES.X, label: 'X (Twitter)', icon: <FaXTwitter size={20} /> },
    { id: QR_TYPES.LINKEDIN, label: 'LinkedIn', icon: <FaLinkedinIn size={20} /> },
    { id: QR_TYPES.WHATSAPP, label: 'WhatsApp', icon: <MessageCircle size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.YOUTUBE, label: 'YouTube', icon: <Play size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.EVENT, label: 'Event', icon: <Calendar size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.CRYPTO, label: 'Crypto', icon: <Coins size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.AUDIO, label: 'Audio', icon: <Music size={20} strokeWidth={1.8} /> },
    { id: QR_TYPES.DOCUMENT, label: 'Document', icon: <File size={20} strokeWidth={1.8} /> },
  ];

  const barcodeOptions = [
    { id: 'ean13', label: 'EAN-13' },
    { id: 'upca', label: 'UPC-A' },
    { id: 'code128', label: 'Code 128' },
    { id: 'code39', label: 'Code 39' },
    { id: 'datamatrix', label: 'Data Matrix' },
    { id: 'itf14', label: 'ITF-14' },
    { id: 'ean8', label: 'EAN-8' },
    { id: 'gs1databar', label: 'GS1 DataBar' },
    { id: 'pdf417', label: 'PDF 417' },
    { id: 'code93', label: 'Code 93' },
    { id: 'upce', label: 'UPC-E' },
    { id: 'codabar', label: 'Codabar' },
    { id: 'code11', label: 'Code 11' },
    { id: 'msi', label: 'MSI Plessey' },
    { id: 'i25', label: 'Interleaved 2 of 5' },
    { id: 'postnet', label: 'Postnet' },
    { id: 'planet', label: 'Planet' },
    { id: 'royalmail', label: 'Royal Mail' },
    { id: 'gs1128', label: 'GS1-128' },
    { id: 'telepen', label: 'Telepen' },
    { id: 'pharmacode', label: 'Pharmacode' },
    { id: 'aztec', label: 'Aztec Code' },
    { id: 'maxicode', label: 'MaxiCode' },
    { id: 'qrcode', label: 'QR Code (2D)' },
    { id: 'microqrcode', label: 'Micro QR' },
    { id: 'hanxin', label: 'Han Xin Code' },
    { id: 'codablockf', label: 'Codablock F' },
    { id: 'code16k', label: 'Code 16K' },
    { id: 'code49', label: 'Code 49' },
    { id: 'channelcode', label: 'Channel Code' }
  ];

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getQRTitle = (item) => {
    return getQRItemTitle(item);
  };

  const getQRSubtitle = (item) => {
    return getQRItemSubtitle(item) || 'QR Code Data';
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }} className="fade-in-up" onScroll={handleScroll}>
        {/* Static Hero Section with Smooth Subtle Top-to-Bottom Ruby Gradient */}
        <div style={{
          width: '100%',
          backgroundColor: '#F01A4E',
          backgroundImage: `
            radial-gradient(ellipse 65% 50% at 0% 100%, rgba(185, 10, 50, 0.45) 0%, transparent 70%),
            radial-gradient(ellipse 65% 50% at 100% 100%, rgba(185, 10, 50, 0.45) 0%, transparent 70%),
            linear-gradient(180deg, #F01A4E 0%, #F01A4E 35%, #E21345 68%, #C60835 100%)
          `,
          borderRadius: '0 0 28px 28px',
          marginTop: '-64px',
          padding: '74px var(--main-padding-x) 48px var(--main-padding-x)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          color: '#FFFFFF',
          boxShadow: '0 18px 40px rgba(198, 8, 53, 0.35), inset 0 -1px 2px rgba(255, 255, 255, 0.22)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Frosted Glass Horizon Sheen along the bottom curved edge */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.12) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '0 0 28px 28px',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          {/* Welcome Message / Admin Dashboard Header Block */}
          <div 
            onClick={() => onOpenProfile && onOpenProfile()}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2,
              paddingTop: '2px',
              paddingBottom: '2px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div>
              {currentUser ? (
                <>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color: '#FFE2E8',
                    marginBottom: '0'
                  }}>
                    WELCOME BACK 👋
                  </div>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    lineHeight: 1.2
                  }}>
                    <span>{currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}</span>
                    {isSuperAdmin && (
                      <GoldenAdminBadge size={20} />
                    )}
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  padding: '2px 0'
                }}>
                  Welcome to Mushi QR Pro
                </div>
              )}
            </div>
          </div>

          {/* Top Row: Create QR Code & Create Barcode 50-50 side-by-side in 1 line */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', position: 'relative', zIndex: 2 }}>
            <div 
              onClick={() => onNavigate('generator')}
              role="button"
              tabIndex={0}
              style={{
                borderRadius: '18px',
                color: isDark ? '#FFFFFF' : '#0F172A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                padding: '12px',
                boxSizing: 'border-box',
                minHeight: '135px',
                backgroundColor: isDark ? 'rgba(26, 36, 56, 0.78)' : 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: 'none',
                boxShadow: isDark 
                  ? '0 16px 38px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                  : '0 12px 30px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <PaidCrownBadge featureId="qr_generator" position="floating" size={10} />
              
              {/* Onboarding Style Ambient Ruby Nebula Background */}
              <div style={{
                position: 'absolute', top: '-30%', right: '-15%',
                width: '150px', height: '150px',
                background: isDark 
                  ? 'radial-gradient(circle, rgba(255, 30, 86, 0.35) 0%, rgba(184, 0, 38, 0.15) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(255, 42, 85, 0.2) 0%, transparent 70%)',
                filter: 'blur(22px)', pointerEvents: 'none', zIndex: 1
              }} />

              {/* Onboarding Style Sparkle Stars */}
              <span className="sparkle-star" style={{ top: '15%', right: '48%', color: '#FF4D80', fontSize: '9px', zIndex: 2 }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '26%', right: '12%', color: '#FF2A6D', fontSize: '11px', animationDelay: '1.2s', zIndex: 2 }}>✦</span>

              {/* Card Image with 3D Drop-Shadow and Ruby Neon Glow */}
              <img 
                src="/Qr Code.webp" 
                alt="QR Code" 
                style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '4px',
                  width: '115px',
                  height: '115px',
                  objectFit: 'contain',
                  zIndex: 3,
                  pointerEvents: 'none',
                  opacity: 0.98,
                  filter: isDark 
                    ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 16px rgba(255, 30, 86, 0.5))'
                    : 'drop-shadow(0 8px 16px rgba(214, 0, 54, 0.25))'
                }} 
              />

              {/* Top Title & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', zIndex: 4, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FF2A55 0%, #B3002D 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(255, 42, 85, 0.25)',
                    flexShrink: 0
                  }}>
                    <QrCode size={16} color="#FFFFFF" />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      margin: 0,
                      lineHeight: 1.1
                    }}>
                      QR Codes
                    </h2>
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: isDark ? '#FF4D79' : '#D60036',
                      marginTop: '2px',
                      lineHeight: 1
                    }}>
                      Design Without Limits
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '8.5px', margin: '0 0 8px 0', color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#334155', fontWeight: 500, lineHeight: 1.3, maxWidth: '85px' }}>
                  Create beautiful, custom QR codes with logos, colors, and unique frames.
                </p>
              </div>

              {/* Bottom Action Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : '#F8FAFC',
                borderRadius: '12px',
                border: 'none',
                width: 'calc(100% + 24px)',
                boxSizing: 'border-box',
                margin: 'auto -12px -12px -12px',
                zIndex: 4,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '6px',
                    background: 'rgba(214, 0, 54, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Image size={10} color="#FF4D79" />
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>Make it Yours</span>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF2A55 0%, #B3002D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(255, 42, 85, 0.3)'
                }}>
                  <ChevronRight size={12} color="#FFFFFF" />
                </div>
              </div>
            </div>

            {/* Card 2: Create Barcode */}
            <div 
              onClick={() => onNavigate('barcode')}
              role="button"
              tabIndex={0}
              style={{
                borderRadius: '18px',
                color: isDark ? '#FFFFFF' : '#0F172A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                padding: '12px',
                boxSizing: 'border-box',
                minHeight: '135px',
                backgroundColor: isDark ? 'rgba(26, 36, 56, 0.78)' : 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: 'none',
                boxShadow: isDark 
                  ? '0 16px 38px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                  : '0 12px 30px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <PaidCrownBadge featureId="barcode_generator" position="floating" size={10} />
              
              {/* Onboarding Style Ambient Golden Amber Nebula Background */}
              <div style={{
                position: 'absolute', top: '-30%', right: '-15%',
                width: '150px', height: '150px',
                background: isDark 
                  ? 'radial-gradient(circle, rgba(255, 124, 0, 0.35) 0%, rgba(217, 101, 0, 0.15) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(255, 124, 0, 0.2) 0%, transparent 70%)',
                filter: 'blur(22px)', pointerEvents: 'none', zIndex: 1
              }} />

              {/* Onboarding Style Sparkle Stars */}
              <span className="sparkle-star" style={{ top: '15%', right: '48%', color: '#FFB74D', fontSize: '9px', zIndex: 2 }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '26%', right: '12%', color: '#FFA000', fontSize: '11px', animationDelay: '1.2s', zIndex: 2 }}>✦</span>

              {/* Card Image with 3D Drop-Shadow and Golden Neon Glow */}
              <img 
                src="/Barcode.webp" 
                alt="Barcode" 
                style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '4px',
                  width: '115px',
                  height: '115px',
                  objectFit: 'contain',
                  zIndex: 3,
                  pointerEvents: 'none',
                  opacity: 0.98,
                  filter: isDark 
                    ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 16px rgba(255, 124, 0, 0.5))'
                    : 'drop-shadow(0 8px 16px rgba(255, 124, 0, 0.25))'
                }} 
              />

              {/* Top Title & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', zIndex: 4, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FF7C00 0%, #994A00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(255, 124, 0, 0.25)',
                    flexShrink: 0
                  }}>
                    <Barcode size={16} color="#FFFFFF" />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      margin: 0,
                      lineHeight: 1.1
                    }}>
                      Barcodes
                    </h2>
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: isDark ? '#FF9D33' : '#D96500',
                      marginTop: '2px',
                      lineHeight: 1
                    }}>
                      Professional &amp; Reliable
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '8.5px', margin: '0 0 8px 0', color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#334155', fontWeight: 500, lineHeight: 1.3, maxWidth: '85px' }}>
                  Generate reliable 1D &amp; 2D barcodes for over 30 industrial standards.
                </p>
              </div>

              {/* Bottom Action Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : '#F8FAFC',
                borderRadius: '12px',
                border: 'none',
                width: 'calc(100% + 24px)',
                boxSizing: 'border-box',
                margin: 'auto -12px -12px -12px',
                zIndex: 4,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '6px',
                    background: 'rgba(255, 124, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Barcode size={10} color="#FF9D33" />
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>30+ Formats</span>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF7C00 0%, #994A00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(255, 124, 0, 0.3)'
                }}>
                  <ChevronRight size={12} color="#FFFFFF" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Full-Width Card: Batch Creator */}
        <div style={{ padding: '0 var(--main-padding-x)', marginTop: '-36px', position: 'relative', zIndex: 10, marginBottom: '10px' }}>
          <div
            onClick={() => onNavigate('batch', 'QR')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('batch', 'QR')}
            style={{
              borderRadius: '18px',
              color: isDark ? '#FFFFFF' : '#0F172A',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              padding: '12px',
              boxSizing: 'border-box',
              backgroundColor: isDark ? 'rgba(26, 36, 56, 0.78)' : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: 'none',
              boxShadow: isDark 
                ? '0 16px 38px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                : '0 12px 30px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
              width: '100%',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <PaidCrownBadge featureId="batch_view" position="floating" size={10} />
            
            {/* Onboarding Style Ambient Emerald Nebula Background */}
            <div style={{
              position: 'absolute', top: '-40%', right: '8%',
              width: '200px', height: '180px',
              background: isDark 
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.15) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              filter: 'blur(24px)', pointerEvents: 'none', zIndex: 1
            }} />

            {/* Onboarding Style Sparkle Stars */}
            <span className="sparkle-star" style={{ top: '16%', right: '124px', color: '#00E676', fontSize: '10px', zIndex: 2 }}>✦</span>
            <span className="sparkle-star" style={{ bottom: '18%', right: '16px', color: '#34D399', fontSize: '11px', animationDelay: '1.4s', zIndex: 2 }}>✦</span>

            {/* Card Image with 3D Drop-Shadow and Emerald Neon Glow */}
            <img 
              src="/Bulk Ganaration.webp" 
              alt="Bulk Generation" 
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '115px',
                height: '115px',
                objectFit: 'contain',
                zIndex: 3,
                pointerEvents: 'none',
                opacity: 0.98,
                filter: isDark 
                  ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 18px rgba(16, 185, 129, 0.5))'
                  : 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.25))'
              }} 
            />

            {/* Top Title & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 4, flex: 1, minWidth: 0, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}>
                  <Layers size={16} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    margin: 0,
                    lineHeight: 1.1
                  }}>
                    Bulk Generation
                  </h3>
                  <div style={{
                    fontSize: '8.5px',
                    fontWeight: 700,
                    color: isDark ? '#34D399' : '#059669',
                    marginTop: '2px',
                    lineHeight: 1
                  }}>
                    Powerful • Fast • Efficient
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '8.5px', margin: '6px 110px 0 0', color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#334155', fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Create 10K+ codes from your spreadsheets.
              </p>
            </div>
          </div>
        </div>

        {/* Create QR Grid */}
        <div style={{ padding: '16px var(--main-padding-x) 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Create QR Code</h3>
            <button
              onClick={() => setShowAllQR(!showAllQR)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent-primary)', 
                fontSize: '13px', 
                fontWeight: 600, 
                cursor: 'pointer', 
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {showAllQR ? 'See Less' : 'Explore'} <ChevronRight size={14} />
            </button>
          </div>
          <div className="quick-options-grid">
            {(showAllQR ? quickOptions : quickOptions.slice(0, 5)).map(option => (
              <button
                key={option.id}
                onClick={() => onQuickCreate(option.id)}
                className="quick-option-card"
                style={{ width: '100%', position: 'relative' }}
              >
                <PaidCrownBadge featureId={`qr_${option.id}`} position="floating" size={10} />
                <div className="quick-option-icon-wrapper" style={{ background: 'rgba(214, 0, 54, 0.08)', color: '#D60036' }}>
                  {React.cloneElement(option.icon, { size: 20 })}
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2px',
                  marginTop: '2px',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Create Barcode Grid */}
        <div style={{ padding: '12px var(--main-padding-x) 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Create Barcode</h3>
            <button
              onClick={() => setShowAllBarcodes(!showAllBarcodes)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent-primary)', 
                fontSize: '13px', 
                fontWeight: 600, 
                cursor: 'pointer', 
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {showAllBarcodes ? 'See Less' : 'Explore'} <ChevronRight size={14} />
            </button>
          </div>
          <div className="quick-options-grid">
            {(showAllBarcodes ? barcodeOptions : barcodeOptions.slice(0, 5)).map(option => (
              <button
                key={option.id}
                onClick={() => onQuickCreateBarcode(option.id)}
                className="quick-option-card"
                style={{ width: '100%', position: 'relative' }}
              >
                <PaidCrownBadge featureId={`barcode_${option.id}`} position="floating" size={10} />
                <div className="quick-option-icon-wrapper" style={{ background: 'rgba(214, 0, 54, 0.08)', color: '#D60036' }}>
                  {getBarcodeIcon(option.id)}
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2px',
                  marginTop: '2px',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 var(--main-padding-x) 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent Projects</h3>
            {recentItems.length > 0 && (
              <button
                onClick={() => {
                  clearHistory();
                  setRecentItems([]);
                }}
                style={{
                  background: 'rgba(214, 0, 54, 0.1)', border: 'none',
                  color: '#D60036', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  cursor: 'pointer', borderRadius: '8px', padding: '6px 12px'
                }}
              >
                <Trash2 size={14} /> Delete All
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.id} style={{
                background: 'var(--bg-elevated)',
                border: 'none',
                borderRadius: '14px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease'
              }}
                onClick={() => onLoadQR(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                  border: 'none', overflow: 'hidden'
                }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="QR" style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
                  ) : (
                    <QrCode size={22} color="var(--accent-primary)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {/* Top / Star Row: Title (Left) & Time + Star (Right) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h4 style={{ 
                      margin: 0, fontSize: '13.5px', fontWeight: 700, 
                      color: 'var(--text-primary)', whiteSpace: 'nowrap', 
                      overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                      {getQRTitle(item)}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ 
                        fontSize: '10.5px', 
                        color: 'var(--text-muted)', 
                        whiteSpace: 'nowrap', 
                        fontWeight: 500 
                      }}>
                        {formatDate(item.timestamp)}
                      </span>

                      {/* Save/Favorite Star */}
                      <button
                        onClick={() => handleToggleSave(item)}
                        title={savedIds.has(item.id) ? "Remove from Saved" : "Add to Saved"}
                        style={{
                          background: 'transparent', border: 'none',
                          color: savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)', cursor: 'pointer',
                          padding: '2px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#F39C12'}
                        onMouseLeave={(e) => e.currentTarget.style.color = savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)'}
                      >
                        <Star
                          size={15}
                          fill={savedIds.has(item.id) ? '#F39C12' : 'none'}
                          style={{
                            transition: 'all 0.2s ease',
                            transform: savedIds.has(item.id) ? 'scale(1.1)' : 'scale(1)',
                            color: savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)'
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Subtitle (Left) & Delete (Right) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '11.5px', 
                      color: 'var(--text-secondary)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      flex: 1,
                      minWidth: 0,
                      lineHeight: 1.3
                    }}>
                      {getQRSubtitle(item)}
                    </p>

                    {/* Delete Item */}
                    <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setDeleteModalConfig({
                            isOpen: true,
                            title: 'Delete Recent Item?',
                            description: 'Are you sure you want to remove this item from your recent list?',
                            itemTitle: item.data || item.displayText || 'QR Code',
                            confirmText: 'Delete',
                            iconType: 'trash',
                            isDangerous: false,
                            onConfirm: () => {
                              const updated = deleteFromHistory(item.id);
                              setRecentItems(updated.filter(i => i.source !== 'scan').slice(0, 10));
                            }
                          });
                        }}
                        style={{
                          background: 'transparent', border: 'none',
                          color: 'var(--text-tertiary)', cursor: 'pointer',
                          padding: '2px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{
                background: 'var(--bg-elevated)',
                border: 'none',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back document sheet */}
                    <rect x="22" y="4" width="28" height="34" rx="3" fill="#FFF2F5" stroke="#FFE0E6" strokeWidth="1.5" />
                    <line x1="28" y1="12" x2="44" y2="12" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="28" y1="18" x2="40" y2="18" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="28" y1="24" x2="36" y2="24" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Front document sheet */}
                    <rect x="14" y="10" width="28" height="34" rx="3" fill="#FFFFFF" stroke="#FFE0E6" strokeWidth="1.5" />
                    <line x1="20" y1="18" x2="36" y2="18" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="20" y1="24" x2="32" y2="24" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="20" y1="30" x2="28" y2="30" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Main Pink Folder Back */}
                    <path d="M4 14C4 11.7909 5.79086 10 8 10H18.5858C19.6467 10 20.6641 10.4214 21.4142 11.1716L24.5858 14.3431C25.3359 15.0933 26.3533 15.5147 27.4142 15.5147H56C58.2091 15.5147 60 17.3239 60 19.533V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V14Z" fill="#FFAEC9" />
                    {/* Main Pink Folder Front flap */}
                    <path d="M4 18.533C4 16.3239 5.79086 14.5147 8 14.5147H56C58.2091 14.5147 60 16.3239 60 18.533V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V18.533Z" fill="#FFC2D6" />

                    {/* Glow/Heart circle icon at bottom right */}
                    <circle cx="52" cy="40" r="11" fill="#FFFFFF" filter="drop-shadow(0px 2px 4px rgba(255, 77, 109, 0.2))" />
                    <circle cx="52" cy="40" r="9" fill="#FFF0F3" stroke="#FF85A1" strokeWidth="1" />
                    {/* Heart path */}
                    <path d="M52 43C52 43 48.5 41.2 48.5 39.2C48.5 38 49.3 37.2 50.3 37.2C51.1 37.2 51.7 37.7 52 38.3C52.3 37.7 52.9 37.2 53.7 37.2C54.7 37.2 55.5 38 55.5 39.2C55.5 41.2 52 43 52 43Z" fill="#FF4D6D" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    No recent projects found.
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>
                    Create your first QR code or barcode to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>

  );
}
