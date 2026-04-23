import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { App } from '@capacitor/app';
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

/**
 * Production-grade QR Scanner for Capacitor Android + Web.
 * 
 * Root cause of black screen: Android WebView blocks getUserMedia() by default.
 * Fix applied in MainActivity.java (onPermissionRequest auto-grant).
 * 
 * This component uses html5-qrcode (free, open-source, no API keys).
 * It uses navigator.mediaDevices.getUserMedia() under the hood.
 * 
 * State machine: IDLE → LOADING → SCANNING → RESULT
 *                            ↘ ERROR ↙
 */
export default function QRScanner({ onBack }) {
  const [status, setStatus] = useState('IDLE');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [facingBack, setFacingBack] = useState(true);

  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  // Track mount state to prevent setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Android hardware back button → always exit scanner
  useEffect(() => {
    const listenerPromise = App.addListener('backButton', () => {
      safeBack();
    });
    return () => {
      listenerPromise.then(l => l.remove()).catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup camera on unmount (hard stop)
  useEffect(() => {
    return () => {
      const qr = html5QrRef.current;
      if (qr) {
        try {
          if (qr.isScanning) qr.stop().catch(() => {});
          qr.clear();
        } catch { /* ignore */ }
        html5QrRef.current = null;
      }
    };
  }, []);

  // ─── Safe stop: always cleans up the scanner instance ───
  const stopScanner = useCallback(async () => {
    startingRef.current = false;
    const qr = html5QrRef.current;
    if (!qr) return;
    try {
      if (qr.isScanning) await qr.stop();
      qr.clear();
    } catch {
      /* swallow – scanner may already be stopped */
    }
    html5QrRef.current = null;
  }, []);

  // ─── Navigate back: stop scanner first, then call parent ───
  const safeBack = useCallback(() => {
    stopScanner();
    if (onBack) onBack();
  }, [stopScanner, onBack]);

  // ─── Start scanning ───
  const startScanner = useCallback(async () => {
    // Prevent double-start
    if (startingRef.current) return;
    startingRef.current = true;

    if (!mountedRef.current) return;
    setResult(null);
    setError(null);
    setStatus('LOADING');

    try {
      // Step 1: Request camera permission via browser API (works in WebView)
      // This is the REAL permission gate – not the Capacitor Camera plugin.
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingBack ? 'environment' : 'user' }
        });
        // Immediately release the test stream
        testStream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        if (!mountedRef.current) return;
        startingRef.current = false;
        const msg = permErr.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your device settings.'
          : permErr.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Camera error: ${permErr.message}`;
        setError(msg);
        setStatus('ERROR');
        return;
      }

      // Step 2: Ensure any previous instance is fully stopped
      await stopScanner();

      // Step 3: Wait a tick for the DOM element to be ready
      await new Promise(r => setTimeout(r, 100));

      if (!mountedRef.current) return;

      const viewportEl = document.getElementById('qr-scanner-viewport');
      if (!viewportEl) {
        startingRef.current = false;
        setError('Scanner viewport not found. Please try again.');
        setStatus('ERROR');
        return;
      }

      // Step 4: Create and start html5-qrcode
      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      const config = {
        fps: 10,
        qrbox: (vw, vh) => {
          const size = Math.floor(Math.min(vw, vh) * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      // Use facingMode constraint – most reliable across devices
      const cameraConfig = { facingMode: facingBack ? 'environment' : 'user' };

      // Race between scanner start and a 12-second timeout
      await Promise.race([
        html5Qr.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (!mountedRef.current) return;
            setResult(decodedText);
            setStatus('RESULT');
            stopScanner();
          },
          () => {} // ignore per-frame scan misses
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Camera took too long to start. Please try again.')), 12000)
        ),
      ]);

      if (!mountedRef.current) return;
      startingRef.current = false;
      setStatus('SCANNING');

    } catch (err) {
      if (!mountedRef.current) return;
      startingRef.current = false;
      console.error('Scanner start error:', err);

      let userMsg = 'Failed to start camera.';
      if (typeof err?.message === 'string') {
        if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
          userMsg = 'Camera permission denied. Please allow camera access in your device settings.';
        } else if (err.message.includes('NotReadableError') || err.message.includes('in use')) {
          userMsg = 'Camera is in use by another app. Please close other camera apps and try again.';
        } else if (err.message.includes('NotFoundError')) {
          userMsg = 'No camera found on this device.';
        } else {
          userMsg = err.message;
        }
      }

      setError(userMsg);
      setStatus('ERROR');
      await stopScanner();
    }
  }, [facingBack, stopScanner]);

  // ─── Switch camera facing ───
  const switchCamera = useCallback(async () => {
    await stopScanner();
    setFacingBack(prev => !prev);
    // Small delay then restart
    setTimeout(() => {
      if (mountedRef.current) startScanner();
    }, 200);
  }, [stopScanner, startScanner]);

  // ─── Close active scanning (return to IDLE) ───
  const closeScanner = useCallback(async () => {
    await stopScanner();
    if (mountedRef.current) setStatus('IDLE');
  }, [stopScanner]);

  // ─── File upload scanning ───
  const handleFileUpload = async (file) => {
    if (!file) return;
    setStatus('LOADING');
    setResult(null);
    setError(null);

    try {
      const html5Qr = new Html5Qrcode('qr-scanner-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      if (mountedRef.current) {
        setResult(decodedText);
        setStatus('RESULT');
      }
    } catch {
      if (mountedRef.current) {
        setError('No QR code found in this image. Try a clearer photo.');
        setStatus('ERROR');
      }
    }
  };

  // ─── Copy result to clipboard ───
  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // Fallback for WebView
      const ta = document.createElement('textarea');
      ta.value = result;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Check if result is a URL ───
  const isURL = (text) => {
    try {
      const u = new URL(text);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // ─── Render ───
  return (
    <div className="scanner-page fade-in">
      <div className="scanner-container">
        {/* ── Header: ALWAYS visible, ALWAYS has back button ── */}
        <header className="scanner-nav-header">
          <button className="scanner-back-btn" onClick={safeBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="scanner-nav-title">
            <h3>QR Scanner</h3>
          </div>
          <div style={{ width: 42 }} />
        </header>

        <div className="scanner-main-content">
          {/* ── RESULT VIEW ── */}
          {status === 'RESULT' && (
            <div className="scanner-result-overlay fade-in">
              <div className="scanner-result-card">
                <div className="res-icon">
                  <CheckCircle2 size={48} color="var(--success)" />
                </div>
                <h4>QR Code Detected</h4>
                <div className="res-data-box">
                  <p>{result}</p>
                </div>
                <div className="res-actions">
                  <button className="res-btn copy" onClick={handleCopy}>
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  {isURL(result) && (
                    <a
                      className="res-btn open"
                      href={result}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', background: 'var(--accent-primary)', color: '#000' }}
                    >
                      <ExternalLink size={18} /> Open
                    </a>
                  )}
                </div>
                <button
                  className="res-retry-btn"
                  onClick={() => setStatus('IDLE')}
                  style={{ marginTop: 16, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RefreshCw size={14} /> Scan Another
                </button>
              </div>
            </div>
          )}

          {/* ── SCANNER VIEWPORT ── */}
          {status !== 'RESULT' && (
            <div className="scanner-viewport-wrapper">
              <div
                id="qr-scanner-viewport"
                className={`scanner-view-box ${status === 'SCANNING' ? 'active' : ''}`}
              >
                {/* IDLE: show start button */}
                {status === 'IDLE' && (
                  <div className="scanner-placeholder">
                    <div className="placeholder-icon">
                      <ScanLine size={64} className="pulse-anim" />
                    </div>
                    <p>Point your camera at a QR code</p>
                    <button className="scanner-start-trigger" onClick={startScanner}>
                      <Camera size={18} style={{ marginRight: 8 }} />
                      Open Camera
                    </button>
                  </div>
                )}

                {/* LOADING: spinner */}
                {status === 'LOADING' && (
                  <div className="scanner-loading-state">
                    <Loader2 size={48} className="spinning" color="var(--accent-primary)" />
                    <p>Starting Camera...</p>
                  </div>
                )}

                {/* ERROR: message + retry */}
                {status === 'ERROR' && (
                  <div className="scanner-error-state">
                    <AlertCircle size={48} color="var(--error)" />
                    <p className="err-msg">{error}</p>
                    <button className="error-retry-btn" onClick={startScanner}>
                      <RefreshCcw size={16} /> Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Scanning overlay with corners + controls */}
              {status === 'SCANNING' && (
                <div className="scanner-overlay-guide">
                  <div className="guide-box">
                    <div className="corner tl" />
                    <div className="corner tr" />
                    <div className="corner bl" />
                    <div className="corner br" />
                    <div className="laser-line" />
                  </div>
                  <div className="scanner-controls-overlay">
                    <button className="overlay-icon-btn" onClick={switchCamera} title="Switch Camera">
                      <RefreshCcw size={20} />
                    </button>
                    <button className="overlay-icon-btn close" onClick={closeScanner}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── UPLOAD FROM GALLERY ── */}
          {status === 'IDLE' && (
            <div className="scanner-alt-actions">
              <button className="alt-upload-btn" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={20} />
                <span>Scan from Gallery</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        <footer className="scanner-footer-info">
          <ShieldCheck size={14} />
          <span>Local Scanning • Secure & Private</span>
        </footer>
      </div>

      {/* Hidden temp element for file-based scanning */}
      <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
    </div>
  );
}
