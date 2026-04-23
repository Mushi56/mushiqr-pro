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
  ShieldCheck
} from 'lucide-react';

export default function QRScanner({ onBack }) {
  const [status, setStatus] = useState('LOADING');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [facingBack, setFacingBack] = useState(true);

  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

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
  }, []);

  const safeBack = useCallback(() => {
    stopScanner();
    if (onBack) onBack();
  }, [stopScanner, onBack]);

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

      const startPromise = html5Qr.start(
        cameraId,
        config,
        (decodedText) => handleScanResult(decodedText),
        () => {}
      );

      const timeoutPromise = new Promise((_, rej) =>
        setTimeout(() => rej(new Error(
          'Camera took too long to start. Please close other camera apps and try again.'
        )), 15000)
      );

      await Promise.race([startPromise, timeoutPromise]);

      if (!mountedRef.current) { busyRef.current = false; return; }
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

  const showViewport = status !== 'RESULT';

  return (
    <div className="scanner-page fade-in">
      <div className="scanner-container">

        {/* Header */}
        <header className="scanner-nav-header">
          <button className="scanner-back-btn" onClick={safeBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="scanner-nav-title"><h3>QR Scanner</h3></div>
          <div style={{ width: 42 }} />
        </header>

        <div className="scanner-main-content">

          {/* RESULT CARD */}
          {status === 'RESULT' && (
            <div className="scanner-result-overlay fade-in">
              <div className="scanner-result-card">
                <div className="res-icon"><CheckCircle2 size={48} color="var(--success)" /></div>
                <h4>QR Code Detected</h4>
                <div className="res-data-box"><p>{result}</p></div>
                <div className="res-actions">
                  <button className="res-btn copy" onClick={handleCopy}>
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button className="res-retry-btn" onClick={() => startScanner()}
                        style={{ marginTop: 16, background: 'transparent', border: 'none',
                                 color: 'var(--text-secondary)', cursor: 'pointer',
                                 display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={14} /> Scan Another
                </button>
              </div>
            </div>
          )}

          {/* SCANNER AREA */}
          {showViewport && (
            <div className="scanner-viewport-wrapper">

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

              {/* RESULT CARD - Glassmorphism style */}
              {status === 'RESULT' && (
                <div className="scanner-result-overlay fade-in">
                  <div className="scanner-result-card glass-panel">
                    <div className="res-icon-wrapper">
                      <div className="res-icon-circle">
                        <ShieldCheck size={42} color="var(--accent-primary)" />
                      </div>
                    </div>
                    <h4>Success!</h4>
                    <p className="res-subtitle">QR Code Decoded Successfully</p>
                    
                    <div className="res-data-box">
                      <p>{result}</p>
                    </div>

                    <div className="res-actions">
                      <button className="res-btn copy-btn" onClick={handleCopy}>
                        {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                        <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <button className="res-retry-link" onClick={() => startScanner()}>
                      <RefreshCw size={16} />
                      <span>Scan Another Code</span>
                    </button>
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

          {/* CONTROLS BAR — redesigned with compact buttons matching type-tab style */}
          {(status === 'SCANNING' || status === 'LOADING' || status === 'ERROR') && (
            <div className="scanner-controls-bar">
              {/* Gallery button redesigned to match .type-tab style */}
              <button className="type-tab" onClick={() => fileInputRef.current?.click()} style={{ flex: 'none', width: '64px', height: '64px' }}>
                <span className="type-tab-icon">
                  <ImagePlus size={20} strokeWidth={1.5} />
                </span>
                Gallery
              </button>
              
              {/* Close button redesigned to be more compact */}
              <button className="type-tab active" onClick={closeScanner} style={{ flex: 'none', width: '64px', height: '64px' }}>
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
      </div>

      <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
    </div>
  );
}
