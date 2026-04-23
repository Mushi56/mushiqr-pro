import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
 * Production QR Scanner for Capacitor + Web.
 *
 * Key design decisions to avoid Android black-screen:
 *
 * 1. The html5-qrcode container (#qr-scanner-viewport) is NEVER managed by
 *    React's virtual DOM. It lives as an empty div that html5-qrcode owns
 *    entirely. React overlays (loading, error, idle) sit ON TOP via absolute
 *    positioning, not INSIDE the same element. This prevents React and
 *    html5-qrcode from fighting over DOM ownership.
 *
 * 2. No preflight getUserMedia() test. On Android, grabbing and releasing the
 *    camera then immediately re-grabbing it causes the hardware to hang.
 *    We let html5-qrcode handle the single getUserMedia call.
 *
 * 3. Capacitor's BridgeWebChromeClient already handles onPermissionRequest.
 *    MainActivity.java pre-requests the Android CAMERA permission at launch
 *    so the WebView permission auto-grants without a dialog.
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
  const busyRef = useRef(false);

  // Track mount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Android hardware back button
  useEffect(() => {
    const lp = App.addListener('backButton', () => safeBack());
    return () => { lp.then(l => l.remove()).catch(() => {}); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hard cleanup on unmount
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

  // ─── Stop scanner safely ───
  const stopScanner = useCallback(async () => {
    busyRef.current = false;
    const qr = html5QrRef.current;
    if (!qr) return;
    try { if (qr.isScanning) await qr.stop(); } catch {}
    try { qr.clear(); } catch {}
    html5QrRef.current = null;
  }, []);

  // ─── Back navigation ───
  const safeBack = useCallback(() => {
    stopScanner();
    if (onBack) onBack();
  }, [stopScanner, onBack]);

  // ─── Start scanning ───
  const startScanner = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (!mountedRef.current) return;
    setResult(null);
    setError(null);
    setStatus('LOADING');

    try {
      // 1. Clean up any previous instance
      await stopScanner();

      // 2. Small delay to let Android release camera hardware
      await new Promise(r => setTimeout(r, 300));
      if (!mountedRef.current) { busyRef.current = false; return; }

      // 3. Verify the container div exists
      const el = document.getElementById('qr-scanner-viewport');
      if (!el) {
        throw new Error('Scanner viewport element not found.');
      }
      // Clear any leftover content from a previous session
      el.innerHTML = '';

      // 4. Create html5-qrcode instance
      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      // 5. Scanner config
      const config = {
        fps: 10,
        qrbox: (vw, vh) => {
          const s = Math.floor(Math.min(vw, vh) * 0.65);
          return { width: s, height: s };
        },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      // 6. Start with facingMode constraint (most reliable)
      const cameraId = { facingMode: facingBack ? 'environment' : 'user' };

      // 7. Race against a generous timeout (15s for slow Android devices)
      const startPromise = html5Qr.start(
        cameraId,
        config,
        (decodedText) => {
          if (!mountedRef.current) return;
          setResult(decodedText);
          setStatus('RESULT');
          stopScanner();
        },
        () => {} // ignore per-frame failures
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
        msg = 'Camera permission denied. Please allow camera access in your device Settings → Apps → MushiQR Pro → Permissions.';
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
  }, [facingBack, stopScanner]);

  // ─── Switch camera ───
  const switchCamera = useCallback(async () => {
    await stopScanner();
    setFacingBack(p => !p);
    setTimeout(() => { if (mountedRef.current) startScanner(); }, 400);
  }, [stopScanner, startScanner]);

  // ─── Close live scanner, return to idle ───
  const closeScanner = useCallback(async () => {
    await stopScanner();
    if (mountedRef.current) setStatus('IDLE');
  }, [stopScanner]);

  // ─── Scan from file ───
  const handleFileUpload = async (file) => {
    if (!file) return;
    setStatus('LOADING');
    setResult(null);
    setError(null);
    try {
      const qr = new Html5Qrcode('qr-scanner-file-temp');
      const text = await qr.scanFile(file, true);
      if (mountedRef.current) { setResult(text); setStatus('RESULT'); }
    } catch {
      if (mountedRef.current) {
        setError('No QR code found in this image. Try a clearer photo.');
        setStatus('ERROR');
      }
    }
  };

  // ─── Copy ───
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

  const isURL = (t) => {
    try { const u = new URL(t); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
  };

  // ─── Render ───
  const showViewport = status !== 'RESULT';

  return (
    <div className="scanner-page fade-in">
      <div className="scanner-container">

        {/* ── HEADER: always visible, always has back button ── */}
        <header className="scanner-nav-header">
          <button className="scanner-back-btn" onClick={safeBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="scanner-nav-title"><h3>QR Scanner</h3></div>
          <div style={{ width: 42 }} />
        </header>

        <div className="scanner-main-content">

          {/* ── RESULT CARD ── */}
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
                  {isURL(result) && (
                    <a className="res-btn open" href={result} target="_blank" rel="noopener noreferrer"
                       style={{ textDecoration: 'none', background: 'var(--accent-primary)', color: '#000' }}>
                      <ExternalLink size={18} /> Open
                    </a>
                  )}
                </div>
                <button className="res-retry-btn" onClick={() => setStatus('IDLE')}
                        style={{ marginTop: 16, background: 'transparent', border: 'none',
                                 color: 'var(--text-secondary)', cursor: 'pointer',
                                 display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={14} /> Scan Another
                </button>
              </div>
            </div>
          )}

          {/* ── SCANNER AREA ── */}
          {showViewport && (
            <div className="scanner-viewport-wrapper">

              {/*
                CRITICAL: This div is ONLY for html5-qrcode.
                React never puts children inside it.
                It's always in the DOM so html5-qrcode can find it.
                Visibility is controlled via CSS, not conditional rendering.
              */}
              <div
                id="qr-scanner-viewport"
                className="scanner-view-box"
                style={{
                  visibility: status === 'SCANNING' ? 'visible' : 'hidden',
                  position: status === 'SCANNING' ? 'relative' : 'absolute',
                }}
              />

              {/* Overlays sit ON TOP of (not inside) the viewport */}
              {status === 'IDLE' && (
                <div className="scanner-state-overlay">
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
                </div>
              )}

              {status === 'LOADING' && (
                <div className="scanner-state-overlay">
                  <div className="scanner-loading-state">
                    <Loader2 size={48} className="spinning" color="var(--accent-primary)" />
                    <p>Starting Camera...</p>
                  </div>
                </div>
              )}

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

              {/* Corner guides + controls while scanning */}
              {status === 'SCANNING' && (
                <div className="scanner-overlay-guide">
                  <div className="guide-box">
                    <div className="corner tl" /><div className="corner tr" />
                    <div className="corner bl" /><div className="corner br" />
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
                <ImagePlus size={20} /><span>Scan from Gallery</span>
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
