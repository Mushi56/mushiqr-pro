import { useState, useRef, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { App as CapApp } from '@capacitor/app';
import {
  ArrowLeft, Zap, ZapOff, Image, CheckCircle2,
  Copy, ExternalLink, Share2, Star, Wifi, Mail,
  Phone, User, Globe, FileText, Minus, Plus, AlertCircle, RefreshCcw, Clock,
  ScanLine, Info, ShieldAlert, Barcode, X,
  Pencil, MoreVertical, Tag, Hash, Calendar, ListPlus, Check, Sparkles, ShoppingCart,
  Volume2, VolumeX, Menu, Home, History, Moon, Sun, Shield
} from 'lucide-react';
import { generateQRMatrix, renderQR } from '../utils/qrEngine';
import qrNotFoundSvg from '../assets/qr-not-found.svg';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { renderBarcode } from '../utils/barcodeEngine';
import NativeScanner from '../plugins/NativeScanner';
import AppIcon from './AppIcon';
import UserAvatar from './UserAvatar';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import { usePremium } from '../services/premiumContext';
import PaidCrownBadge from './PaidCrownBadge';
import { getPreferences, savePreferences } from '../utils/storage';

// ─── Barcode format metadata ──────────────────────────────────────────────────
// Formats supported by html5-qrcode (ZXing) for live camera scanning
const SCANNABLE_FORMATS = [
  { id: Html5QrcodeSupportedFormats.QR_CODE,       name: 'QR Code',     category: '2D' },
  { id: Html5QrcodeSupportedFormats.DATA_MATRIX,   name: 'Data Matrix', category: '2D' },
  { id: Html5QrcodeSupportedFormats.PDF_417,        name: 'PDF417',      category: '2D' },
  { id: Html5QrcodeSupportedFormats.AZTEC,          name: 'Aztec',       category: '2D' },
  { id: Html5QrcodeSupportedFormats.EAN_13,         name: 'EAN-13',      category: '1D' },
  { id: Html5QrcodeSupportedFormats.EAN_8,          name: 'EAN-8',       category: '1D' },
  { id: Html5QrcodeSupportedFormats.UPC_A,          name: 'UPC-A',       category: '1D' },
  { id: Html5QrcodeSupportedFormats.UPC_E,          name: 'UPC-E',       category: '1D' },
  { id: Html5QrcodeSupportedFormats.CODE_128,       name: 'Code 128',    category: '1D' },
  { id: Html5QrcodeSupportedFormats.CODE_39,        name: 'Code 39',     category: '1D' },
  { id: Html5QrcodeSupportedFormats.CODE_93,        name: 'Code 93',     category: '1D' },
  { id: Html5QrcodeSupportedFormats.ITF,            name: 'ITF (I25)',   category: '1D' },
  { id: Html5QrcodeSupportedFormats.CODABAR,        name: 'Codabar',     category: '1D' },
  { id: Html5QrcodeSupportedFormats.MAXICODE,       name: 'MaxiCode',    category: '2D' },
];

const ALL_SCANNABLE_IDS = SCANNABLE_FORMATS.map(f => f.id);

// These are producible by bwip-js but NOT scannable by a mobile camera lens
// (require specialized hardware, printed dots/circles, or ultra-high resolution)
const CAMERA_UNSUPPORTED_FORMATS = new Set([
  'MaxiCode',    // requires specialized IR scanner
  'Han Xin',    // no ZXing support
  'Pharmacode', // 1-7 bars only - too ambiguous for ZXing
  'Channel Code',// industrial specialized
  'MSI Plessey', // not in ZXing
  'Telepen',    // UK-only, not in ZXing
  'Royal Mail', // postal-only hardware
  'POSTNET',    // postal-only hardware
  'PLANET',     // postal-only hardware
]);

const FORMAT_NAME_MAP = {
  [Html5QrcodeSupportedFormats.QR_CODE]:     'QR Code',
  [Html5QrcodeSupportedFormats.DATA_MATRIX]: 'Data Matrix',
  [Html5QrcodeSupportedFormats.PDF_417]:     'PDF417',
  [Html5QrcodeSupportedFormats.AZTEC]:       'Aztec',
  [Html5QrcodeSupportedFormats.EAN_13]:      'EAN-13',
  [Html5QrcodeSupportedFormats.EAN_8]:       'EAN-8',
  [Html5QrcodeSupportedFormats.UPC_A]:       'UPC-A',
  [Html5QrcodeSupportedFormats.UPC_E]:       'UPC-E',
  [Html5QrcodeSupportedFormats.CODE_128]:    'Code 128',
  [Html5QrcodeSupportedFormats.CODE_39]:     'Code 39',
  [Html5QrcodeSupportedFormats.CODE_93]:     'Code 93',
  [Html5QrcodeSupportedFormats.ITF]:         'ITF / I2of5',
  [Html5QrcodeSupportedFormats.CODABAR]:     'Codabar',
  [Html5QrcodeSupportedFormats.MAXICODE]:    'MaxiCode',
  256: 'QR Code',
  4096: 'Aztec',
  16: 'Data Matrix',
  2048: 'PDF417',
  1: 'Code 128',
  2: 'Code 39',
  4: 'Code 93',
  8: 'Codabar',
  32: 'EAN-13',
  64: 'EAN-8',
  128: 'ITF / I2of5',
  512: 'UPC-A',
  1024: 'UPC-E',
};

const parseQRData = (text) => {
  if (!text) return { type: 'Text', icon: FileText, title: 'Text Content', action: 'Copy Text', actionIcon: Copy };
  const t = text.trim();
  if (/^WIFI:S:.*?;/i.test(t)) return { type: 'WiFi', icon: Wifi, title: 'WiFi Network', action: 'Copy Password', actionIcon: Copy };
  if (/^mailto:/i.test(t)) return { type: 'Email', icon: Mail, title: 'Email Address', action: 'Send Email', actionIcon: Mail };
  if (/^tel:/i.test(t) || /^sms:/i.test(t)) return { type: 'Phone', icon: Phone, title: 'Phone Number', action: 'Call / SMS', actionIcon: Phone };
  if (/^BEGIN:VCARD/i.test(t)) return { type: 'Contact', icon: User, title: 'Contact Card', action: 'Save Contact', actionIcon: User };
  if (/^https?:\/\//i.test(t) || /^www\./i.test(t) || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}(\/.*)?$/i.test(t))
    return { type: 'Website', icon: Globe, title: 'Website', action: 'Open Link', actionIcon: ExternalLink };
  return { type: 'Text', icon: FileText, title: 'Text Content', action: 'Copy Text', actionIcon: Copy };
};

const detectFormatFromText = (text) => {
  if (!text) return 'QR Code';
  const t = text.trim();
  if (/^https?:\/\//i.test(t) || /^www\./i.test(t) || /^WIFI:/i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t) || /^sms:/i.test(t) || /^BEGIN:VCARD/i.test(t)) {
    return 'QR Code';
  }
  if (/^\d+$/.test(t)) {
    if (t.length === 8) return 'EAN-8';
    if (t.length === 12) return 'UPC-A';
    if (t.length === 13) return 'EAN-13';
    if (t.length === 6) return 'UPC-E';
  }
  if (t.length < 30) {
    return 'Code 128';
  }
  return 'QR Code';
};

export default function QRScanner({ onBack, navigateTo, onLoadQR, currentUser, onOpenProfile }) {
  const { showPaywall } = usePremium();
  const access = FeatureAccessManager.canUseFeature('scanner_camera_live');

  useEffect(() => {
    if (!access.allowed && access.status !== 'disabled_by_admin') {
      showPaywall('scanner_camera_live');
    }
  }, [access.allowed, access.status, showPaywall]);

  if (!access.allowed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#09090f', color: '#f0f0f8', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {access.status === 'disabled_by_admin' ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Scanner Unavailable</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 440, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              QR & Barcode Scanner has been disabled globally by the Administrator.
            </p>
            <button
              onClick={onBack}
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              Return Back
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))', border: '1px solid rgba(255, 215, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', boxShadow: '0 8px 24px rgba(255, 170, 0, 0.25)' }}>
              <Crown size={36} strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>Unlock Mushi QR Pro</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 420, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Live Scanner is a Pro feature. Upgrade your subscription plan for lightning fast instant QR & barcode detection.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => showPaywall('scanner_camera_live')}
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(255, 170, 0, 0.4)' }}
              >
                <Crown size={16} fill="#000" color="#000" strokeWidth={2.5} />
                <span>Buy Pro</span>
              </button>
              <button
                onClick={onBack}
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Return Back
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const [status, setStatus] = useState('SCANNING');
  const [result, setResult] = useState(null);
  const [qrTypeData, setQrTypeData] = useState(null);
  const [detectedFormatId, setDetectedFormatId] = useState(null);
  const [detectedFormatName, setDetectedFormatName] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [facingBack, setFacingBack] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState(null);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showFormatsInfo, setShowFormatsInfo] = useState(false);
  const [scanDate, setScanDate] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('qrgen_preferences') || '{}');
      if (prefs.scanSound !== undefined) return prefs.scanSound;
      return localStorage.getItem('qrgen_scan_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      return getPreferences().theme || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handlePrefSync = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem('qrgen_preferences') || '{}');
        if (prefs.scanSound !== undefined) {
          setSoundEnabled(prefs.scanSound);
        } else {
          setSoundEnabled(localStorage.getItem('qrgen_scan_sound') !== 'false');
        }
      } catch {}
    };
    window.addEventListener('preferences-sync', handlePrefSync);
    window.addEventListener('storage', handlePrefSync);
    return () => {
      window.removeEventListener('preferences-sync', handlePrefSync);
      window.removeEventListener('storage', handlePrefSync);
    };
  }, []);

  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const scanHandledRef = useRef(false);
  const touchStateRef = useRef({ distance: 0, initialZoom: 1 });
  const capTimersRef = useRef([]);
  const listenersRef = useRef([]);
  const zoomRafRef = useRef(null);

  const handleEditResult = () => {
    triggerHapticFeedback();
    stopScanner();
    if (onLoadQR) {
      onLoadQR({
        source: 'scan',
        type: detectedFormatName || 'QR Code',
        displayText: result,
        qrData: { text: result }
      });
    }
  };

  const mapFormatToBcid = (formatName) => {
    if (!formatName) return null;
    const name = formatName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (name === 'qrcode' || name === 'qr') return 'qrcode';
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
    return null;
  };

  useEffect(() => {
    if (status === 'DETECTED' && result && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const bcid = mapFormatToBcid(detectedFormatName);
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (bcid && bcid !== 'qrcode') {
        try {
          renderBarcode(canvas, result, {
            bcid: bcid,
            barColor: '#000000',
            bgColor: '#ffffff',
            barWidth: 2,
            height: 80,
            margin: 10,
            displayValue: false
          });
        } catch (e) {
          console.error("Failed to render preview barcode:", e);
          try {
            renderBarcode(canvas, "1234567890", {
              bcid: 'code128',
              barColor: '#000000',
              bgColor: '#ffffff',
              barWidth: 2,
              height: 80,
              margin: 10,
              displayValue: false
            });
          } catch (err) {}
        }
      } else {
        try {
          const matrixInfo = generateQRMatrix(result, 'M');
          renderQR(canvas, {
            ...matrixInfo,
            size: 200,
            bgColor: '#ffffff',
            qrColor: '#000000',
            eyeColor: '#000000',
            eyeOuterColor: '#000000',
            dotStyle: 'rounded',
            eyeStyle: 'rounded',
            quietZone: 0
          });
        } catch (e) {
          console.error("Failed to render preview QR:", e);
        }
      }
    }
  }, [status, result, detectedFormatName]);

  const triggerHapticFeedback = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Note 1: Quick initial chirp
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(950, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.06);

      // Note 2: Higher frequency chime following Note 1
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1300, audioCtx.currentTime + 0.05);
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.setValueAtTime(0.05, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc2.start(audioCtx.currentTime + 0.05);
      osc2.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      console.warn("Failed to play scan sound:", e);
    }
  }, []);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const stopScanner = useCallback(async () => {
    busyRef.current = false;
    
    if (Capacitor.isNativePlatform()) {
      try { await NativeScanner.stopScanner(); } catch (e) { console.warn(e); }
      if (listenersRef.current) {
        listenersRef.current.forEach(l => l.remove());
        listenersRef.current = [];
      }
    } else {
      const scanner = qrScannerRef.current;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (e) {
          console.warn('Error stopping scanner:', e);
        }
        qrScannerRef.current = null;
      }
      const container = document.getElementById("qr-scanner-viewport");
      if (container) {
        container.innerHTML = "";
      }
    }
    
    setZoomCapabilities(null);
    setFlashOn(false);
    setFlashSupported(false);
    capTimersRef.current.forEach(clearTimeout);
    capTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);



  const safeBack = useCallback(async () => {
    triggerHapticFeedback();
    await stopScanner();
    if (onBack) onBack();
  }, [stopScanner, onBack, triggerHapticFeedback]);

  const applyZoom = useCallback(async (value) => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeScanner.setZoom({ ratio: value });
          setZoom(value);
        } catch (err) {
          console.warn('Native zoom failed:', err);
        }
        return;
      }
      
      const videoElement = document.querySelector("#qr-scanner-viewport video");
      const stream = videoElement?.srcObject;
      const track = stream?.getVideoTracks()?.[0];
      if (videoElement) {
        let applied = false;
        if (track) {
          const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
          if (caps.zoom) {
            const minVal = caps.zoom.min || 1;
            const maxVal = caps.zoom.max || 8;
            const val = Math.min(Math.max(value, minVal), maxVal);
            try {
              await track.applyConstraints({ advanced: [{ zoom: val }] });
              setZoom(val);
              applied = true;
            } catch (err) {
              console.warn('Hardware zoom failed:', err);
            }
          }
        }
        
        // CSS scale zoom fallback (works everywhere, including Capacitor Android APK WebViews)
        if (!applied) {
          const val = Math.min(Math.max(value, 1), 4);
          videoElement.style.transform = `translateZ(0) scale(${val})`;
          videoElement.style.transformOrigin = 'center center';
          setZoom(val);
        }
      }
    } catch (err) {
      console.error('applyZoom error:', err);
    }
  }, []);

  const handleZoomChange = useCallback((newVal) => {
    let val = newVal;
    if (zoomCapabilities) {
      val = Math.min(Math.max(newVal, zoomCapabilities.min), zoomCapabilities.max);
    } else {
      val = Math.min(Math.max(newVal, 1), 4);
    }
    applyZoom(val);
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  }, [applyZoom, zoomCapabilities]);

  const [zoomViewMode, setZoomViewMode] = useState('presets'); // 'presets' or 'dial'
  const dialDragRef = useRef({ startX: 0, startY: 0, startZoom: 1, isDraggingDial: false, hasSwiped: false });

  const getPresets = useCallback(() => {
    const defaultPresets = [1.0, 2.0, 4.0];
    if (zoomCapabilities && zoomCapabilities.max > 1) {
      const max = zoomCapabilities.max;
      const presets = defaultPresets.filter(p => p <= max);
      if (max > presets[presets.length - 1]) {
        presets.push(parseFloat(max.toFixed(1)));
      }
      return presets;
    }
    return defaultPresets;
  }, [zoomCapabilities]);

  const handleDialTouchStart = (e) => {
    e.stopPropagation();
    if (dialDragRef.current.timeout) clearTimeout(dialDragRef.current.timeout);
    const touch = e.touches[0];
    dialDragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startZoom: zoom,
      isDraggingDial: false,
      hasSwiped: false,
      timeout: null
    };
  };

  const handleDialTouchMove = (e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const diffX = touch.clientX - dialDragRef.current.startX;
    const diffY = touch.clientY - dialDragRef.current.startY;

    let currentMode = zoomViewMode;

    if (!dialDragRef.current.hasSwiped && Math.abs(diffY) < 30) {
      if (zoomViewMode === 'presets' && Math.abs(diffX) > 30) {
        setZoomViewMode('dial');
        currentMode = 'dial';
        dialDragRef.current.hasSwiped = true;
        triggerHapticFeedback();
        dialDragRef.current.startX = touch.clientX;
      }
    }

    if (currentMode === 'dial') {
      dialDragRef.current.isDraggingDial = true;
      const min = zoomCapabilities ? zoomCapabilities.min : 1;
      const max = zoomCapabilities ? zoomCapabilities.max : 4;
      const range = max - min;
      const currentDiffX = touch.clientX - dialDragRef.current.startX;
      const deltaZoom = -(currentDiffX / 110) * range;
      const targetZoom = Math.min(Math.max(dialDragRef.current.startZoom + deltaZoom, min), max);
      handleZoomChange(targetZoom);
    }
  };

  const handleDialTouchEnd = (e) => {
    e.stopPropagation();
    dialDragRef.current.isDraggingDial = false;
    if (dialDragRef.current.timeout) clearTimeout(dialDragRef.current.timeout);
    setZoomViewMode('presets');
  };

  const toggleFlash = useCallback(async () => {
    triggerHapticFeedback();
    try {
      if (Capacitor.isNativePlatform()) {
        const next = !flashOn;
        try {
          await NativeScanner.setTorch({ enabled: next });
          setFlashOn(next);
        } catch (err) {
          console.error('Native torch toggle error:', err);
        }
        return;
      }
      
      const videoElement = document.querySelector("#qr-scanner-viewport video");
      const stream = videoElement?.srcObject;
      const track = stream?.getVideoTracks()?.[0];
      if (!track) return;
      const next = !flashOn;
      await track.applyConstraints({
        advanced: [{ torch: next }]
      });
      setFlashOn(next);
    } catch (err) {
      console.error('Torch toggle error:', err);
    }
  }, [flashOn, triggerHapticFeedback]);

  const handleScanResult = useCallback((decodedText, decodedResult) => {
    if (!mountedRef.current || busyRef.current || scanHandledRef.current) return;
    scanHandledRef.current = true; // Block subsequent scans

    playBeep();
    if (Capacitor.isNativePlatform()) { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { }); }
    else if (navigator.vibrate) { navigator.vibrate(200); }

    const scanner = qrScannerRef.current;
    if (scanner) {
      try { scanner.pause(); } catch { }
    }

    const fmtId = decodedResult?.result?.format?.format
      ?? decodedResult?.decodedResult?.result?.format?.format
      ?? null;
    let fmtName = fmtId != null ? (FORMAT_NAME_MAP[fmtId] || 'Unknown') : null;
    if (!fmtName || fmtName === 'Unknown') {
      fmtName = detectFormatFromText(decodedText);
    }
    const finalBcid = mapFormatToBcid(fmtName);
    if (fmtId != null) setDetectedFormatId(fmtId);
    setDetectedFormatName(fmtName);

    const parsed = parseQRData(decodedText);
    setQrTypeData(parsed);
    setResult(decodedText);
    
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' + 
                          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setScanDate(formattedDate);
    
    let thumbnail = null;
    try {
      const canvas = document.createElement('canvas');
      if (finalBcid && finalBcid !== 'qrcode') {
        canvas.width = 600;
        canvas.height = 300;
        renderBarcode(canvas, decodedText, {
          bcid: finalBcid,
          barColor: '#000000',
          bgColor: '#ffffff',
          barWidth: 3,
          height: 160,
          margin: 20,
          displayValue: false
        });
        thumbnail = canvas.toDataURL('image/png');
      } else {
        canvas.width = 400;
        canvas.height = 400;
        const matrixInfo = generateQRMatrix(decodedText, 'M');
        if (matrixInfo) {
          renderQR(canvas, {
            matrix: matrixInfo.matrix,
            moduleCount: matrixInfo.moduleCount,
            size: 400,
            qrColor: '#000000',
            bgColor: '#ffffff',
            bgTransparent: false
          });
          thumbnail = canvas.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.error('Failed to generate thumbnail for scanned QR:', err);
    }

    import('../utils/storage').then(({ saveToHistory }) => {
      saveToHistory({
        source: 'scan',
        qrData: { text: decodedText },
        type: (fmtName || parsed.type).toUpperCase(),
        displayText: decodedText,
        thumbnail: thumbnail
      });
    });

    // Always transition to DETECTED state so the result card stays visible on screen
    setStatus('DETECTED');
  }, [playBeep]);

  const startScanner = useCallback(async () => {
    if (busyRef.current) return;
    const scannerCheck = FeatureAccessManager.canUseFeature('scanner');
    if (!scannerCheck.allowed) {
      setError('Scanner feature is disabled by administrator or requires plan entitlement.');
      setStatus('ERROR');
      return;
    }
    busyRef.current = true;
    if (!mountedRef.current) return;
    scanHandledRef.current = false;
    setResult(null); setQrTypeData(null); setDetectedFormatId(null); setDetectedFormatName(null); setError(null); setStatus('SCANNING'); setZoom(1); setVideoPlaying(false);
    try {
      await stopScanner();
      if (!mountedRef.current) { busyRef.current = false; return; }

      if (Capacitor.isNativePlatform()) {
        const scanListener = await NativeScanner.addListener('scanResult', (res) => {
          handleScanResult(res.text, { result: { format: { format: res.format } } });
        });
        const errListener = await NativeScanner.addListener('cameraError', (res) => {
          setError(res.error || 'Camera Error'); setStatus('ERROR');
        });
        const zoomListener = await NativeScanner.addListener('zoomChanged', (res) => {
          setZoom(res.ratio);
        });
        listenersRef.current.push(scanListener, errListener, zoomListener);

        const viewport = document.getElementById('qr-scanner-viewport');
        let bounds = {};
        if (viewport) {
          const rect = viewport.getBoundingClientRect();
          bounds = {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        }

        await NativeScanner.startScanner(bounds);
        setVideoPlaying(true);
        if (!mountedRef.current) { busyRef.current = false; return; }
        
        try {
          const caps = await NativeScanner.getZoomCapabilities();
          if (caps && caps.max > 1) {
            setHasHardwareZoom(true);
            setZoomCapabilities({ min: caps.min || 1, max: caps.max, step: 0.1 });
            setZoom(caps.current || 1);
          } else {
            setHasHardwareZoom(false);
            setZoomCapabilities({ min: 1, max: 4, step: 0.1 });
          }
          setFlashSupported(true);
        } catch (e) {}

        busyRef.current = false;
        setStatus('SCANNING');
        return;
      }

      const scanner = new Html5Qrcode("qr-scanner-viewport");
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 25,
          qrbox: (width, height) => {
            return { width: Math.min(width, height) * 0.85, height: Math.min(width, height) * 0.55 };
          },
          formatsToSupport: ALL_SCANNABLE_IDS,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        (decodedText, decodedResult) => {
          handleScanResult(decodedText, decodedResult);
        },
        () => {}
      );

      setVideoPlaying(true);
      if (!mountedRef.current) { busyRef.current = false; return; }
      capTimersRef.current.forEach(clearTimeout);
      capTimersRef.current = [];

      const checkCapabilities = () => {
        try {
          const videoElement = document.querySelector("#qr-scanner-viewport video");
          const stream = videoElement?.srcObject;
          const track = stream?.getVideoTracks()?.[0];
          if (track) {
            const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
            if (caps.zoom) {
              setHasHardwareZoom(true);
              setZoomCapabilities({
                min: caps.zoom.min || 1,
                max: Math.min(caps.zoom.max || 10, 10),
                step: caps.zoom.step || 0.1
              });
              setZoom(prev => prev === 1 ? (caps.zoom.min || 1) : prev);
            } else {
              setHasHardwareZoom(false);
              setZoomCapabilities({
                min: 1,
                max: 4,
                step: 0.1
              });
            }
            if (caps.torch) {
              setFlashSupported(true);
            }
          }
        } catch (e) {
          console.warn('Failed to check capabilities:', e);
        }
      };

      checkCapabilities();
      const t1 = setTimeout(checkCapabilities, 500);
      const t2 = setTimeout(checkCapabilities, 1000);
      capTimersRef.current.push(t1, t2);

      busyRef.current = false;
      setStatus('SCANNING');
    } catch (err) {
      busyRef.current = false;
      if (!mountedRef.current) return;
      let msg = 'Failed to start camera.';
      const m = typeof err?.message === 'string' ? err.message : typeof err === 'string' ? err : '';
      if (m.includes('NotAllowed') || m.includes('Permission')) msg = 'Camera permission denied. Please allow camera access in Settings.';
      else if (m.includes('NotReadable') || m.includes('in use')) msg = 'Camera is in use by another app.';
      else if (m.includes('NotFound')) msg = 'No camera found on this device.';
      else if (m) msg = m;
      setError(msg); setStatus('ERROR'); await stopScanner();
    }
  }, [stopScanner, handleScanResult]);

  useEffect(() => { const t = setTimeout(() => { if (mountedRef.current) startScanner(); }, 50); return () => clearTimeout(t); }, []); // eslint-disable-line

  const isScanningRef = useRef(false);
  useEffect(() => {
    isScanningRef.current = (status === 'SCANNING');
  }, [status]);

  useEffect(() => {
    let appListener;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', async (state) => {
        if (!state.isActive) {
          // App went to background: stop the camera to release Android locks
          await stopScanner();
        } else {
          // App returned to foreground: restart the camera if we were scanning
          if (isScanningRef.current) {
            setTimeout(() => {
              startScanner();
            }, 300);
          }
        }
      }).then(l => {
        appListener = l;
      });
    }
    return () => {
      if (appListener) {
        appListener.remove();
      }
    };
  }, [stopScanner, startScanner]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    await stopScanner(); setStatus('LOADING'); setResult(null); setQrTypeData(null); setError(null);
    try {
      const scanner = new Html5Qrcode("qr-scanner-viewport", false);
      const scanRes = await scanner.scanFile(file, true);
      
      let text = '';
      let rawResult = null;
      if (scanRes && typeof scanRes === 'object') {
        text = scanRes.decodedText;
        rawResult = scanRes;
      } else {
        text = scanRes;
      }
      
      if (mountedRef.current) handleScanResult(text, rawResult);
    } catch (err) {
      if (mountedRef.current) { setError('No QR code or barcode found in this image.'); setStatus('ERROR'); }
    }
  };

  const handleCopy = async () => {
    triggerHapticFeedback();
    if (!result) return;
    try { await navigator.clipboard.writeText(result); } catch { const t = document.createElement('textarea'); t.value = result; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    triggerHapticFeedback();
    if (!result) return;
    try { await Share.share({ title: 'Scanned QR Code', text: result, dialogTitle: 'Share QR Content' }); }
    catch { if (navigator.share) navigator.share({ title: 'Scanned QR Code', text: result }).catch(() => { }); }
  };

  const handleSave = async () => {
    triggerHapticFeedback();
    if (!result || !qrTypeData) return;
    let thumbnail = null;
    try {
      const canvas = document.createElement('canvas');
      const bcid = mapFormatToBcid(detectedFormatName);
      if (bcid && bcid !== 'qrcode') {
        canvas.width = 600;
        canvas.height = 300;
        renderBarcode(canvas, result, {
          bcid: bcid,
          barColor: '#000000',
          bgColor: '#ffffff',
          barWidth: 3,
          height: 160,
          margin: 20,
          displayValue: false
        });
        thumbnail = canvas.toDataURL('image/png');
      } else {
        canvas.width = 400;
        canvas.height = 400;
        const matrixInfo = generateQRMatrix(result, 'M');
        if (matrixInfo) {
          renderQR(canvas, {
            matrix: matrixInfo.matrix,
            moduleCount: matrixInfo.moduleCount,
            size: 400,
            qrColor: '#000000',
            bgColor: '#ffffff',
            bgTransparent: false
          });
          thumbnail = canvas.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.error('Failed to generate thumbnail for saved scanned QR:', err);
    }

    import('../utils/storage').then(({ saveToSaved }) => {
      saveToSaved({
        source: 'scan',
        qrData: { text: result },
        type: qrTypeData.type.toUpperCase(),
        displayText: result,
        thumbnail: thumbnail
      });
    });
    alert('Saved to favorites!');
  };

  const handlePrimaryAction = async () => {
    triggerHapticFeedback();
    if (!result || !qrTypeData) return;
    const t = result.trim();
    try {
      if (qrTypeData.type === 'Website') {
        if (/^(javascript|data|vbscript):/i.test(t)) {
          alert('Security Alert: Malicious URI scheme blocked.');
          return;
        }
        const url = /^https?:\/\//i.test(t) ? t : 'https://' + t;
        if (Capacitor.isNativePlatform()) { await Browser.open({ url, windowName: '_system' }); } else { window.open(url, '_blank', 'noopener,noreferrer'); }
      } else if (qrTypeData.type === 'WiFi') {
        const p = t.match(/P:(.*?);/); await navigator.clipboard.writeText(p ? p[1] : t); alert(p ? 'WiFi Password Copied!' : 'WiFi details copied.');
      } else if (qrTypeData.type === 'Email' || qrTypeData.type === 'Phone') { window.location.href = t; }
      else if (qrTypeData.type === 'Contact') { const b = new Blob([t], { type: 'text/vcard' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'contact.vcf'; a.click(); }
      else { await handleCopy(); }
    } catch (err) { console.error('Action failed:', err); }
  };

  const resumeScanning = () => {
    triggerHapticFeedback();
    const scanner = qrScannerRef.current;
    if (scanner) {
      try {
        scanner.resume();
      } catch (err) {
        console.warn("Failed to resume scanner, restarting:", err);
        startScanner();
      }
    } else {
      startScanner();
    }
    scanHandledRef.current = false;
    setResult(null); setQrTypeData(null); setDetectedFormatId(null); setDetectedFormatName(null); setStatus('SCANNING');
  };

  const captureImage = useCallback(async () => {
    triggerHapticFeedback();
    const video = document.querySelector("#qr-scanner-viewport video");
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      await stopScanner();

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to capture image.');
          setStatus('ERROR');
          return;
        }
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        try {
          const scanner = new Html5Qrcode("qr-scanner-viewport", false);
          const decodedText = await scanner.scanFile(file, true);
          if (mountedRef.current) {
            handleScanResult(decodedText);
          }
        } catch {
          if (mountedRef.current) {
            setError('No QR code or barcode found in the captured image.');
            setStatus('ERROR');
          }
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture failed:', err);
      setError('Failed to capture camera frame.');
      setStatus('ERROR');
    }
  }, [stopScanner, handleScanResult, triggerHapticFeedback]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      touchStateRef.current = { distance: d, initialZoom: zoom };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      if (zoomRafRef.current) return;
      const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      const targetZoom = touchStateRef.current.initialZoom * (d / touchStateRef.current.distance);
      zoomRafRef.current = requestAnimationFrame(() => {
        handleZoomChange(targetZoom);
        zoomRafRef.current = null;
      });
    }
  };

  const handleViewportClick = useCallback((e) => {
    if (Capacitor.isNativePlatform() && status === 'SCANNING') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      try {
        NativeScanner.focus({ x, y });
      } catch (err) {}
    }
  }, [status]);

  const ActionIcon = qrTypeData?.actionIcon || ExternalLink;
  const TypeIcon = qrTypeData?.icon || FileText;

  useEffect(() => {
    if (Capacitor.isNativePlatform() && (status === 'SCANNING' || status === 'DETECTED')) {
      document.body.style.setProperty('background', 'transparent', 'important');
      document.documentElement.style.setProperty('background', 'transparent', 'important');
    } else {
      document.body.style.removeProperty('background');
      document.documentElement.style.removeProperty('background');
    }
    return () => {
      document.body.style.removeProperty('background');
      document.documentElement.style.removeProperty('background');
    };
  }, [status]);

  return (
    <div className="scanner-page scanner-page-enter" style={Capacitor.isNativePlatform() && (status === 'SCANNING' || status === 'DETECTED') ? { background: 'transparent' } : {}}>
      {/* Upper Navbar (#FFFFFF with 100% opacity + safe area) */}
      <header 
        className="scanner-upper-navbar" 
        style={{ 
          position: 'relative', 
          border: 'none',
          borderBottom: 'none', 
          display: 'flex', 
          width: '100%', 
          height: 'calc(64px + env(safe-area-inset-top, 0px))',
          minHeight: 'calc(64px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          boxSizing: 'border-box',
          flexShrink: 0, 
          zIndex: 100, 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#111625',
          backgroundColor: '#111625',
          opacity: 1,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          color: '#FFFFFF'
        }}
      >
        <div className="app-logo">
          <AppIcon size={46} noBackground />
          <div className="app-logo-text" style={{ whiteSpace: 'nowrap', color: '#FFFFFF' }}>Mushi QR <span style={{ color: 'var(--accent-primary)' }}>Pro</span></div>
        </div>

        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* User Profile Section */}
          {currentUser ? (
            <button
              onClick={() => onOpenProfile ? onOpenProfile() : (navigateTo && navigateTo('you'))}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-label="User Profile"
              title={currentUser.displayName || currentUser.email || 'Profile'}
            >
              <UserAvatar user={currentUser} size={34} border="2px solid var(--accent-primary)" />
            </button>
          ) : (
            <button
              onClick={() => onOpenProfile ? onOpenProfile() : (navigateTo && navigateTo('login'))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(214, 0, 54, 0.25)'
              }}
              title="Sign In"
            >
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}

          <div className="menu-container" ref={menuRef} style={{ position: 'relative' }}>
            <button
              className={`btn-menu-toggle ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              style={{
                color: '#111827',
                background: 'rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Menu size={20} />
            </button>

            {isMenuOpen && (
              <div className="app-dropdown-menu fade-in" style={{ top: 'calc(100% + 12px)', right: 0 }}>
                <div className="menu-links">
                  <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); navigateTo && navigateTo('home'); }}>
                    <Home size={16} /> Home
                  </button>
                  <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); navigateTo && navigateTo('history'); }}>
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
                      const prefs = getPreferences();
                      savePreferences({ ...prefs, theme: next });
                      const eff = next === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next;
                      document.documentElement.setAttribute('data-theme', eff);
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
                    Theme <span style={{ textTransform: 'capitalize', marginLeft: 4, fontWeight: 'bold' }}>{theme}</span>
                  </button>
                  <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
                  <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); window.location.hash = '#/about'; }}>
                    <Info size={16} /> About
                  </button>
                  <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); window.location.hash = '#/privacy-policy'; }}>
                    <Shield size={16} /> Privacy Policy
                  </button>
                  <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); window.location.hash = '#/terms'; }}>
                    <FileText size={16} /> Terms of Service
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="qrs">
        {/* Body */}
        <div className="qrs-body" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} style={{ justifyContent: 'flex-end', paddingBottom: '24px' }}>
          {/* Error - QR Not Found (illustrated) */}
          {status === 'ERROR' && error && error.toLowerCase().includes('no qr') ? (
            <div 
              className="qrs-no-qr-screen"
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
            >
              <img src={qrNotFoundSvg} alt="No QR Code Found" className="qrs-no-qr-illustration" />
              <h2 className="qrs-no-qr-title">No QR Code <span>Found</span></h2>
              <p className="qrs-no-qr-desc">We couldn't find any QR code in the image.<br />Try a clearer image or check the lighting.</p>
              <button className="qrs-no-qr-btn" onClick={startScanner}>
                <RefreshCcw size={18} /> Try Again
              </button>
              <div className="qrs-no-qr-tip">
                <div className="qrs-no-qr-tip-icon">💡</div>
                <div>
                  <div className="qrs-no-qr-tip-title">Tips for better results</div>
                  <div className="qrs-no-qr-tip-text">Ensure the QR code is within the frame, well-lit, and not blurry.</div>
                </div>
              </div>
            </div>
          ) : status === 'ERROR' ? (
            <div 
              className="qrs-center-msg"
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
            >
              <AlertCircle size={44} color="#ef4444" />
              <p>{error}</p>
              <button className="qrs-retry-btn" onClick={startScanner}><RefreshCcw size={16} /> Try Again</button>
            </div>
          ) : null}


          {/* Scanner Frame */}
          <div className={`qrs-frame ${status === 'DETECTED' ? 'detected' : ''}`}>
            <div id="qr-scanner-viewport" className={`qrs-viewport ${status === 'DETECTED' ? 'blur' : ''}`} onClick={handleViewportClick} />



            {/* Flashlight button inside camera */}
            {flashSupported && (
              <button className={`qrs-flash-viewport-btn ${flashOn ? 'on' : ''}`} onClick={toggleFlash} aria-label="Toggle flash">
                {flashOn ? <Zap size={22} /> : <ZapOff size={22} />}
              </button>
            )}

            {/* Laser Scanning Line */}
            {status === 'SCANNING' && <div className="qrs-laser" />}
            {status === 'DETECTED' && <div className="qrs-laser frozen" />}

            {/* iPhone-style Premium Zoom Dials & Jog Wheel */}
            {status === 'SCANNING' && (
              <div 
                className="qrs-zoom-ios-container" 
                onTouchStart={handleDialTouchStart} 
                onTouchMove={handleDialTouchMove} 
                onTouchEnd={handleDialTouchEnd}
              >
                {zoomViewMode === 'presets' ? (
                  getPresets().map((preset) => {
                    const presets = getPresets();
                    const idx = presets.indexOf(preset);
                    let isClosest = false;
                    if (presets.length === 1) {
                      isClosest = true;
                    } else if (idx === 0) {
                      isClosest = zoom < (presets[0] + presets[1]) / 2;
                    } else if (idx === presets.length - 1) {
                      isClosest = zoom >= (presets[idx - 1] + presets[idx]) / 2;
                    } else {
                      isClosest = zoom >= (presets[idx - 1] + presets[idx]) / 2 && zoom < (presets[idx] + presets[idx + 1]) / 2;
                    }
                    
                    let label = `${Math.round(preset)}`;
                    if (isClosest) {
                      label = `${zoom.toFixed(1)}x`;
                    }

                    return (
                      <button
                        key={preset}
                        className={`qrs-zoom-ios-dial ${isClosest ? 'active' : ''}`}
                        onClick={() => handleZoomChange(preset)}
                        aria-label={`Zoom ${preset}x`}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="qrs-zoom-wheel-layout">
                    <button className="qrs-zoom-wheel-back" onClick={() => { triggerHapticFeedback(); setZoomViewMode('presets'); }}>
                      Presets
                    </button>
                    
                    <div className="qrs-zoom-wheel-track">
                      <div className="qrs-zoom-wheel-center-line" />
                      <div 
                        className="qrs-zoom-wheel-ticks" 
                        style={{ 
                          transform: `translateX(${-((zoom - (zoomCapabilities ? zoomCapabilities.min : 1)) / ((zoomCapabilities ? zoomCapabilities.max : 4) - (zoomCapabilities ? zoomCapabilities.min : 1))) * 200}px)` 
                        }}
                      >
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div key={i} className="qrs-zoom-tick" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="qrs-zoom-wheel-val">{zoom.toFixed(1)}x</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs & Options */}
        <div className="qrs-mode-selector" style={{ position: 'relative', justifyContent: 'center' }}>
          <div className="qrs-mode-tab active" style={{ margin: 0 }}>
            Scan
            <div className="qrs-mode-dot" />
          </div>

          <button
            style={{ position: 'absolute', right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 8px' }}
            onClick={() => setShowFormatsInfo(v => !v)}
            aria-label="View Supported Formats"
          >
            <Info size={14} />
            Supported Formats
          </button>
        </div>

        {/* Supported Formats Modal Popup */}
        {showFormatsInfo && (
          <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setShowFormatsInfo(false)}>
            <div className="modal-container glass-panel" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ScanLine size={20} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div className="modal-header-title" style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>Scan Formats</h3>
                    <p style={{ margin: 0 }}>Supported barcode & matrix standards</p>
                  </div>
                  <button className="modal-close" onClick={() => setShowFormatsInfo(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Camera Scannable (1D & 2D)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SCANNABLE_FORMATS.filter(f => f.name !== 'MaxiCode').map(f => (
                      <span key={f.id} style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 10,
                        background: f.category === '2D' ? 'rgba(88,86,214,0.1)' : 'rgba(0,122,255,0.08)',
                        color: f.category === '2D' ? '#5856D6' : '#007AFF',
                        border: `1.5px solid ${f.category === '2D' ? 'rgba(88,86,214,0.2)' : 'rgba(0,122,255,0.15)'}`
                      }}>
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Hardware Required Only</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {Array.from(CAMERA_UNSUPPORTED_FORMATS).map(name => (
                      <span key={name} style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 10,
                        background: 'rgba(255,149,0,0.08)',
                        color: '#FF9500',
                        border: '1px solid rgba(255,149,0,0.15)'
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.15)', borderRadius: 12, padding: '10px 12px' }}>
                    <ShieldAlert size={14} style={{ color: '#FF9500', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: '#FF9500', fontWeight: 600, lineHeight: 1.5 }}>
                      These specialized standards cannot be scanned via a standard phone camera lens. They require high-density laser decoders or industrial camera hardware.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="qrs-controls">
          <button className="qrs-side-btn" onClick={() => { triggerHapticFeedback(); stopScanner(); if (navigateTo) navigateTo('history', 'Scanned'); else if (onBack) onBack(); }} aria-label="History">
            <Clock size={22} />
          </button>

          <button className="qrs-shutter-btn" onClick={status === 'DETECTED' ? resumeScanning : captureImage} aria-label="Shutter Button">
            <div className="qrs-shutter-btn-inner" style={{ background: status === 'DETECTED' ? '#ef4444' : '#fff' }} />
          </button>

          <button 
            className="qrs-side-btn" 
            onClick={() => {
              const access = FeatureAccessManager.canUseFeature('scanner_image_upload');
              if (!access.allowed) {
                showPaywall('scanner_image_upload');
                return;
              }
              triggerHapticFeedback(); 
              fileInputRef.current?.click(); 
            }} 
            aria-label="Gallery"
            style={{ position: 'relative' }}
          >
            <PaidCrownBadge featureId="scanner_image_upload" position="floating" size={8} />
            <Image size={22} />
          </button>
        </div>

        {/* Full-Screen Detection Result */}
        {status === 'DETECTED' && qrTypeData && (
          <div className="qrs-result-fullscreen">
            {/* Banner Header */}
            <div className="qrs-result-banner">
              <div className="qrs-result-banner-header">
                <button className="qrs-result-banner-btn" onClick={resumeScanning} aria-label="Go Back">
                  <ArrowLeft size={20} />
                </button>
                <h3 className="qrs-result-banner-title">Scan Result</h3>
                <div style={{ width: 36 }} />
              </div>

              <div className="qrs-result-success-badge-container">
                <div className="qrs-result-success-badge">
                  <CheckCircle2 size={36} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div className="qrs-result-success-stars">
                  <Sparkles size={16} style={{ position: 'absolute', left: '-5px', top: '10px', color: '#ffeb3b' }} />
                  <Sparkles size={12} style={{ position: 'absolute', right: '-8px', top: '12px', color: '#ffeb3b' }} />
                  <Sparkles size={14} style={{ position: 'absolute', left: '10px', bottom: '-8px', color: '#ffeb3b' }} />
                </div>
              </div>

            </div>

            {/* Central Card Body */}
            <div className="qrs-result-body">
              {/* Main Card */}
              <div className="qrs-result-main-card">
                <div className="qrs-result-card-header">
                  <span className="qrs-badge">{detectedFormatName || 'QR Code'}</span>
                  <span className="qrs-card-date">{scanDate}</span>
                </div>
                
                <div className="qrs-result-preview-box">
                  <canvas ref={previewCanvasRef} width="200" height="120" />
                </div>

                <div className="qrs-result-value-row">
                  <span className="qrs-result-value-text">{result}</span>
                </div>
              </div>

              {/* Camera support warning for specialty formats */}
              {detectedFormatName && CAMERA_UNSUPPORTED_FORMATS.has(detectedFormatName) && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 14px', margin: '4px 0' }}>
                  <ShieldAlert size={15} style={{ color: '#FF9500', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#FF9500', fontWeight: 600, lineHeight: 1.5 }}>⚠ This barcode type ({detectedFormatName}) is not supported by standard mobile cameras. A dedicated hardware scanner is required to decode it reliably.</span>
                </div>
              )}

              {/* Quick Action Button Grid */}
              <div className="qrs-result-actions-grid">
                <button className="qrs-action-box-btn" onClick={handleCopy}>
                  <div className="qrs-action-icon-circle">
                    <Copy size={16} />
                  </div>
                  <span>Copy</span>
                </button>

                <button className="qrs-action-box-btn" onClick={handleShare}>
                  <div className="qrs-action-icon-circle">
                    <Share2 size={16} />
                  </div>
                  <span>Share</span>
                </button>

                <button className="qrs-action-box-btn" onClick={handleSave}>
                  <div className="qrs-action-icon-circle">
                    <Star size={16} />
                  </div>
                  <span>Save</span>
                </button>

                <button className="qrs-action-box-btn" onClick={handleEditResult}>
                  <div className="qrs-action-icon-circle">
                    <Pencil size={16} />
                  </div>
                  <span>Edit</span>
                </button>
              </div>

              {/* Dynamic Product/Website Metadata Card */}
              <div className="qrs-meta-card">
                {qrTypeData.type === 'Website' ? (
                  <>
                    <div className="qrs-meta-header">
                      <Globe size={16} />
                      <span>Website Details</span>
                    </div>
                    <div className="qrs-meta-content" onClick={handlePrimaryAction}>
                      <div className="qrs-meta-icon-wrapper">
                        <ExternalLink size={20} />
                      </div>
                      <div className="qrs-meta-details">
                        <div className="qrs-meta-title">Open URL in Browser</div>
                        <div className="qrs-meta-desc">{result}</div>
                      </div>
                    </div>
                  </>
                ) : (detectedFormatName && ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'].includes(detectedFormatName)) || qrTypeData.type === 'Product' ? (
                  <>
                    <div className="qrs-meta-header">
                      <ShoppingCart size={16} />
                      <span>Product Information</span>
                    </div>
                    <div className="qrs-meta-content" onClick={() => Browser.open({ url: 'https://www.google.com/search?q=' + encodeURIComponent(result) })}>
                      <div className="qrs-meta-icon-wrapper">
                        <Barcode size={20} />
                      </div>
                      <div className="qrs-meta-details">
                        <div className="qrs-meta-title">Search product details online</div>
                        <div className="qrs-meta-desc">Lookup GTIN standard code: {result}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="qrs-meta-header">
                      <FileText size={16} />
                      <span>Quick Search Options</span>
                    </div>
                    <div className="qrs-meta-content" onClick={() => Browser.open({ url: 'https://www.google.com/search?q=' + encodeURIComponent(result) })}>
                      <div className="qrs-meta-icon-wrapper">
                        <Globe size={20} />
                      </div>
                      <div className="qrs-meta-details">
                        <div className="qrs-meta-title">Search content online</div>
                        <div className="qrs-meta-desc">Google Search lookup: {result}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>



              {/* Bottom Actions Outlined/Solid */}
              <div className="qrs-bottom-row-grid">
                <button className="qrs-outline-btn" onClick={resumeScanning}>
                  <RefreshCcw size={16} />
                  <span>Scan Again</span>
                </button>
                <button className="qrs-solid-btn" onClick={() => { stopScanner(); if (navigateTo) navigateTo('history', 'Scanned'); else if (onBack) onBack(); }}>
                  <Clock size={16} />
                  <span>View History</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} accept="image/*" onChange={e => handleFileUpload(e.target.files?.[0])} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
