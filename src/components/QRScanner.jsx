import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import {
  Camera,
  Copy,
  ExternalLink,
  X,
  ScanLine,
  CheckCircle2,
  RefreshCw,
  ImagePlus,
  RefreshCcw,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Search,
  Minus,
  Plus
} from 'lucide-react';

export default function QRScanner({ onBack }) {
  const [status, setStatus] = useState('LOADING');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [facingBack, setFacingBack] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState(null);

  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const touchStateRef = useRef({ distance: 0, initialZoom: 1 });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const lp = App.addListener('backButton', () => safeBack());
    return () => { lp.then(l => l.remove()).catch(() => {}); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      const qr = html5QrRef.current;
      if (qr) {
        try { if (qr.isScanning) qr.stop().catch(() => {}); } catch {}
        try { qr.clear(); } catch {}
        html5QrRef.current = null;
      }
    };
  }, []);

  const stopScanner = useCallback(async () => {
    busyRef.current = false;
    const qr = html5QrRef.current;
    if (!qr) return;
    try { if (qr.isScanning) await qr.stop(); } catch {}
    try { qr.clear(); } catch {}
    html5QrRef.current = null;
    setZoomCapabilities(null);
  }, []);

  const safeBack = useCallback(() => {
    stopScanner();
    if (onBack) onBack();
  }, [stopScanner, onBack]);

  // Apply zoom to the running video track
  const applyZoom = useCallback(async (value) => {
    const qr = html5QrRef.current;
    if (!qr || !qr.isScanning) return;
    
    try {
      const track = qr.getRunningTrack();
      if (track && typeof track.applyConstraints === 'function') {
        const capabilities = track.getCapabilities();
        if (capabilities.zoom) {
          const val = Math.min(Math.max(value, capabilities.zoom.min), capabilities.zoom.max);
          await track.applyConstraints({ advanced: [{ zoom: val }] });
          setZoom(val);
        }
      }
    } catch (err) {
      console.warn('Failed to apply zoom:', err);
    }
  }, []);

  // Broader URL detection — catches http://, https://, and www. prefixed strings
  const isURL = useCallback((text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    // Direct protocol check
    try {
      const u = new URL(trimmed);
      if (u.protocol === 'http:' || u.protocol === 'https:') return true;
    } catch { /* not a full URL, try other patterns */ }
    // Check for www. prefix (without protocol)
    if (/^www\./i.test(trimmed)) return true;
    // Check for common domain patterns like example.com, sub.example.org etc.
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return true;
    return false;
  }, []);

  // Normalize URL — ensure it has a protocol prefix
  const normalizeURL = useCallback((text) => {
    const trimmed = text.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }, []);

  // Open URL in the device's default external browser (Chrome, etc.)
  const openInBrowser = useCallback(async (url) => {
    const fullUrl = normalizeURL(url);
    if (Capacitor.isNativePlatform()) {
      try {
        // Browser.open launches the system default browser (Chrome, etc.)
        await Browser.open({ url: fullUrl, windowName: '_system' });
      } catch {
        // Fallback if Browser plugin fails
        window.open(fullUrl, '_system');
      }
    } else {
      window.open(fullUrl, '_blank');
    }
  }, [normalizeURL]);

  const handleScanResult = useCallback((decodedText) => {
    if (!mountedRef.current) return;
    if (isURL(decodedText)) {
      // URL detected → stop scanner, open in external browser, go back
      stopScanner();
      openInBrowser(decodedText);
      if (onBack) onBack();
      return;
    }
    // Non-URL content → show result card
    setResult(decodedText);
    setStatus('RESULT');
    stopScanner();
  }, [isURL, stopScanner, openInBrowser, onBack]);

  const startScanner = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (!mountedRef.current) return;
    setResult(null);
    setError(null);
    setStatus('LOADING');
    setZoom(1);

    try {
      await stopScanner();
      await new Promise(r => setTimeout(r, 300));
      if (!mountedRef.current) { busyRef.current = false; return; }

      const el = document.getElementById('qr-scanner-viewport');
      if (!el) throw new Error('Scanner viewport element not found.');
      el.innerHTML = '';

      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      const config = {
        fps: 30, // Max standard FPS for smooth video
        qrbox: (vw, vh) => {
          const s = Math.floor(Math.min(vw, vh) * 0.8);
          return { width: s, height: s };
        },
        aspectRatio: 0.75, 
        disableFlip: false,
        // Request maximum possible resolution and high frame rate
        videoConstraints: {
          facingMode: facingBack ? 'environment' : 'user',
          width: { min: 640, ideal: 1920, max: 3840 },
          height: { min: 480, ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 }
        }
      };

      const cameraId = { facingMode: facingBack ? 'environment' : 'user' };

      await html5Qr.start(
        cameraId,
        config,
        (decodedText) => handleScanResult(decodedText),
        () => {}
      );

      if (!mountedRef.current) { busyRef.current = false; return; }
      
      // Detect zoom capabilities after start
      try {
        const track = html5Qr.getRunningTrack();
        if (track) {
          const capabilities = track.getCapabilities();
          if (capabilities.zoom) {
            setZoomCapabilities({
              min: capabilities.zoom.min || 1,
              max: Math.min(capabilities.zoom.max || 10, 10), // Limit to 10x as requested
              step: capabilities.zoom.step || 0.1
            });
            setZoom(capabilities.zoom.min || 1);
          }
        }
      } catch (e) {
        console.warn('Zoom detection failed:', e);
      }

      busyRef.current = false;
      setStatus('SCANNING');

    } catch (err) {
      busyRef.current = false;
      if (!mountedRef.current) return;
      console.error('Scanner error:', err);

      let msg = 'Failed to start camera.';
      const m = typeof err?.message === 'string' ? err.message : '';
      if (m.includes('NotAllowed') || m.includes('Permission'))
        msg = 'Camera permission denied. Please allow camera access in Settings → Apps → MushiQR Pro → Permissions.';
      else if (m.includes('NotReadable') || m.includes('Could not start') || m.includes('in use'))
        msg = 'Camera is in use by another app. Close all camera apps, then try again.';
      else if (m.includes('NotFound') || m.includes('Requested device not found'))
        msg = 'No camera found on this device.';
      else if (m.includes('AbortError'))
        msg = 'Camera was interrupted. Please try again.';
      else if (m) msg = m;

      setError(msg);
      setStatus('ERROR');
      await stopScanner();
    }
  }, [facingBack, stopScanner, handleScanResult]);

  // Auto-start camera on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current) startScanner();
    }, 200);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchCamera = useCallback(async () => {
    await stopScanner();
    setFacingBack(p => !p);
    setTimeout(() => { if (mountedRef.current) startScanner(); }, 400);
  }, [stopScanner, startScanner]);

  const closeScanner = useCallback(async () => {
    await stopScanner();
    if (mountedRef.current) safeBack();
  }, [stopScanner, safeBack]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    await stopScanner();
    setStatus('LOADING');
    setResult(null);
    setError(null);
    try {
      const qr = new Html5Qrcode('qr-scanner-file-temp');
      const text = await qr.scanFile(file, true);
      if (mountedRef.current) handleScanResult(text);
    } catch {
      if (mountedRef.current) {
        setError('No QR code found in this image. Try a clearer photo.');
        setStatus('ERROR');
      }
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); } catch {
      const t = document.createElement('textarea');
      t.value = result; t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select();
      document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pinch to Zoom Logic
  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && zoomCapabilities) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchStateRef.current = { distance: dist, initialZoom: zoom };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && zoomCapabilities) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const scale = dist / touchStateRef.current.distance;
      const newZoom = touchStateRef.current.initialZoom * scale;
      applyZoom(newZoom);
    }
  };

  const showViewport = status !== 'RESULT';

  return (
    <div className="scanner-page scanner-page-enter">
        {/* Header */}
        {/* Header — Aligned with camera sides */}
        <header className="scanner-nav-header">
          <div className="scanner-header-inner">
            <button className="scanner-back-btn" onClick={safeBack} aria-label="Go back">
              <ArrowLeft size={22} />
            </button>
            <div className="scanner-nav-title"></div>
            <div style={{ width: 44 }} />
          </div>
        </header>

        <div className="scanner-main-content">


          {/* LOADING STATE — Rich premium camera init screen */}
          {status === 'LOADING' && (
            <div className="scanner-loading-overlay">
              <div className="scanner-loading-inner">
                <div className="scanner-loading-icon-wrap">
                  <Camera size={40} strokeWidth={1.5} color="var(--accent-primary)" />
                </div>
                <p className="scanner-loading-title">Starting Camera</p>
                <p className="scanner-loading-sub">Please allow camera access when prompted</p>
              </div>
            </div>
          )}

          {/* SCANNER AREA */}
          {showViewport && (
            <div 
              className="scanner-viewport-wrapper"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >

              {/* Camera viewport — html5-qrcode owns this */}
              <div
                id="qr-scanner-viewport"
                className="scanner-view-box"
                style={{
                  visibility: status === 'SCANNING' ? 'visible' : 'hidden',
                  position: status === 'SCANNING' ? 'relative' : 'absolute',
                }}
              />

              {/* Animated scan line only */}
              {status === 'SCANNING' && (
                <div className="scanner-overlay-guide">
                  <div className="scanner-laser-line" />
                </div>
              )}

              {/* ZOOM SLIDER - Premium Camera Style */}
              {status === 'SCANNING' && zoomCapabilities && (
                <div className="scanner-zoom-container fade-in">
                  <div className="zoom-slider-wrapper glass-panel">
                    <button className="zoom-btn" onClick={() => applyZoom(zoom - 0.5)}>
                      <Minus size={16} />
                    </button>
                    <div className="slider-track-container">
                      <input
                        type="range"
                        min={zoomCapabilities.min}
                        max={zoomCapabilities.max}
                        step={zoomCapabilities.step}
                        value={zoom}
                        onChange={(e) => applyZoom(parseFloat(e.target.value))}
                        className="premium-zoom-slider"
                      />
                    </div>
                    <button className="zoom-btn" onClick={() => applyZoom(zoom + 0.5)}>
                      <Plus size={16} />
                    </button>
                    <div className="zoom-indicator">
                      {zoom.toFixed(1)}x
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR overlay */}
              {status === 'ERROR' && (
                <div className="scanner-state-overlay">
                  <div className="scanner-error-state">
                    <AlertCircle size={48} color="var(--error)" />
                    <p className="err-msg">{error}</p>
                    <button className="error-retry-btn" onClick={startScanner}>
                      <RefreshCcw size={16} /> Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RESULT CARD - Matches app modal style */}
          {status === 'RESULT' && (
            <div className="modal-overlay">
              <div className="modal-container glass-panel" style={{ margin: 'auto' }}>
                <div className="modal-header">
                  <div className="modal-header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={22} color="var(--accent-primary)" />
                      <h3>QR Code Detected</h3>
                    </div>
                    <p>Decoded successfully</p>
                  </div>
                  <button className="modal-close" onClick={() => startScanner()}>
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-content">
                  <div className="res-data-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '15px' }}>
                    <p style={{ margin: 0 }}>{result}</p>
                  </div>
                </div>

                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '12px' }}>
                  <button className="modal-done-btn" onClick={handleCopy} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button className="modal-done-btn" onClick={() => startScanner()} style={{ flex: 1, background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={18} />
                    Scan Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTROLS BAR — Square separate buttons */}
          {(status === 'SCANNING' || status === 'LOADING' || status === 'ERROR') && (
            <div className="scanner-controls-bar">
              <button className="type-tab" onClick={() => fileInputRef.current?.click()}>
                <span className="type-tab-icon">
                  <ImagePlus size={20} strokeWidth={1.5} />
                </span>
                Gallery
              </button>
              
              <div className="scanner-bar-title">Scan</div>

              <button className="type-tab active" onClick={closeScanner} style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                <span className="type-tab-icon">
                  <X size={20} strokeWidth={1.5} />
                </span>
                Close
              </button>

              <input type="file" ref={fileInputRef} accept="image/*"
                     onChange={e => handleFileUpload(e.target.files?.[0])}
                     style={{ display: 'none' }} />
            </div>
          )}
        </div>

        <footer className="scanner-footer-info">
          <ShieldCheck size={14} /><span>Secure Local Processing</span>
        </footer>

      <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
    </div>
  );
}
