import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
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

  const isURL = useCallback((text) => {
    try {
      const u = new URL(text);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }, []);

  const handleScanResult = useCallback((decodedText) => {
    if (!mountedRef.current) return;
    if (isURL(decodedText)) {
      stopScanner();
      if (Capacitor.isNativePlatform()) {
        window.open(decodedText, '_system');
      } else {
        window.open(decodedText, '_blank');
      }
      if (onBack) onBack();
      return;
    }
    setResult(decodedText);
    setStatus('RESULT');
    stopScanner();
  }, [isURL, stopScanner, onBack]);

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
        fps: 10,
        qrbox: (vw, vh) => {
          const s = Math.floor(Math.min(vw, vh) * 0.7);
          return { width: s, height: s };
        },
        aspectRatio: 0.75, // 3:4 aspect ratio (taller)
        disableFlip: false,
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

              {/* Animated scan line only (no corner boxes) */}
              {status === 'SCANNING' && (
                <div className="scanner-overlay-guide">
                  <div className="scanner-laser-line" />
                </div>
              )}

              {/* LOADING overlay */}
              {status === 'LOADING' && (
                <div className="scanner-state-overlay">
                  <div className="scanner-loading-state">
                    <Loader2 size={48} className="spinning" color="var(--accent-primary)" />
                    <p>Starting Camera...</p>
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

          {/* CONTROLS BAR — below camera preview */}
          {status === 'SCANNING' && (
            <div className="scanner-controls-bar">
              <button className="scanner-ctrl-btn" onClick={() => fileInputRef.current?.click()} title="Upload from Gallery">
                <ImagePlus size={22} />
                <span>Gallery</span>
              </button>
              <button className="scanner-ctrl-btn primary" onClick={switchCamera} title="Switch Camera">
                <RefreshCcw size={22} />
                <span>Flip</span>
              </button>
              <button className="scanner-ctrl-btn danger" onClick={closeScanner} title="Close Scanner">
                <X size={22} />
                <span>Close</span>
              </button>
              <input type="file" ref={fileInputRef} accept="image/*"
                     onChange={e => handleFileUpload(e.target.files?.[0])}
                     style={{ display: 'none' }} />
            </div>
          )}

          {/* Controls for error/loading states */}
          {(status === 'LOADING' || status === 'ERROR') && (
            <div className="scanner-controls-bar">
              <button className="scanner-ctrl-btn" onClick={() => fileInputRef.current?.click()} title="Upload from Gallery">
                <ImagePlus size={22} />
                <span>Gallery</span>
              </button>
              <div style={{ flex: 1 }} />
              <button className="scanner-ctrl-btn danger" onClick={closeScanner} title="Close Scanner">
                <X size={22} />
                <span>Close</span>
              </button>
              <input type="file" ref={fileInputRef} accept="image/*"
                     onChange={e => handleFileUpload(e.target.files?.[0])}
                     style={{ display: 'none' }} />
            </div>
          )}
        </div>

        <footer className="scanner-footer-info">
          <ShieldCheck size={14} /><span>Local Scanning • Secure & Private</span>
        </footer>
      </div>

      <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
    </div>
  );
}
