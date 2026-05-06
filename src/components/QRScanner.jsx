import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import {
  ArrowLeft, Zap, ZapOff, Image, X, CheckCircle2,
  Copy, ExternalLink, Share2, Star, Wifi, Mail,
  Phone, User, Globe, FileText, Link2, ScanLine,
  ShieldCheck, Minus, Plus, AlertCircle, RefreshCcw, Bookmark
} from 'lucide-react';

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

export default function QRScanner({ onBack }) {
  const [status, setStatus] = useState('LOADING');
  const [result, setResult] = useState(null);
  const [qrTypeData, setQrTypeData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [facingBack, setFacingBack] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState(null);

  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const touchStateRef = useRef({ distance: 0, initialZoom: 1 });

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    return () => {
      const qr = html5QrRef.current;
      if (qr) { try { if (qr.isScanning) qr.stop().catch(() => {}); } catch {} try { qr.clear(); } catch {} html5QrRef.current = null; }
    };
  }, []);

  const stopScanner = useCallback(async () => {
    busyRef.current = false;
    const qr = html5QrRef.current;
    if (!qr) return;
    try { if (qr._controlsObserver) qr._controlsObserver.disconnect(); } catch {}
    try { if (qr.isScanning) await qr.stop(); } catch {}
    try { qr.clear(); } catch {}
    html5QrRef.current = null;
    setZoomCapabilities(null);
    setFlashOn(false);
    setFlashSupported(false);
  }, []);

  const safeBack = useCallback(() => { stopScanner(); if (onBack) onBack(); }, [stopScanner, onBack]);

  const applyZoom = useCallback(async (value) => {
    const qr = html5QrRef.current;
    if (!qr || !qr.isScanning) return;
    try {
      const track = qr.getRunningTrack();
      if (track) {
        const caps = track.getCapabilities();
        if (caps.zoom) {
          const val = Math.min(Math.max(value, caps.zoom.min), caps.zoom.max);
          await track.applyConstraints({ advanced: [{ zoom: val }] });
          setZoom(val);
        }
      }
    } catch {}
  }, []);

  const toggleFlash = useCallback(async () => {
    const qr = html5QrRef.current;
    if (!qr || !qr.isScanning) return;
    try {
      const track = qr.getRunningTrack();
      if (track) {
        const caps = track.getCapabilities();
        if (caps.torch) {
          const next = !flashOn;
          await track.applyConstraints({ advanced: [{ torch: next }] });
          setFlashOn(next);
        }
      }
    } catch {}
  }, [flashOn]);

  const handleScanResult = useCallback((decodedText) => {
    if (!mountedRef.current || busyRef.current) return;
    setStatus(prev => {
      if (prev === 'DETECTED') return prev;
      if (Capacitor.isNativePlatform()) { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); }
      else if (navigator.vibrate) { navigator.vibrate(200); }
      const qr = html5QrRef.current;
      if (qr && qr.isScanning) { try { qr.pause(true); } catch {} }
      const parsed = parseQRData(decodedText);
      setQrTypeData(parsed);
      setResult(decodedText);
      import('../utils/storage').then(({ saveToHistory }) => {
        saveToHistory({ source: 'scan', qrData: { text: decodedText }, type: parsed.type.toUpperCase(), displayText: decodedText });
      });
      return 'DETECTED';
    });
  }, []);

  const startScanner = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (!mountedRef.current) return;
    setResult(null); setQrTypeData(null); setError(null); setStatus('LOADING'); setZoom(1);
    try {
      await stopScanner();
      await new Promise(r => setTimeout(r, 300));
      if (!mountedRef.current) { busyRef.current = false; return; }
      const el = document.getElementById('qr-scanner-viewport');
      if (!el) throw new Error('Scanner viewport not found.');
      el.innerHTML = '';
      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;
      const config = {
        fps: 30,
        qrbox: (vw, vh) => { const s = Math.floor(Math.min(vw, vh) * 0.82); return { width: s, height: s }; },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: facingBack ? 'environment' : 'user',
          width: { min: 640, ideal: 1920, max: 3840 },
          height: { min: 480, ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 }
        }
      };
      await html5Qr.start({ facingMode: facingBack ? 'environment' : 'user' }, config, (t) => handleScanResult(t), () => {});
      if (!mountedRef.current) { busyRef.current = false; return; }
      try {
        const track = html5Qr.getRunningTrack();
        if (track) {
          const caps = track.getCapabilities();
          if (caps.zoom) { setZoomCapabilities({ min: caps.zoom.min || 1, max: Math.min(caps.zoom.max || 10, 10), step: caps.zoom.step || 0.1 }); setZoom(caps.zoom.min || 1); }
          if (caps.torch) setFlashSupported(true);
        }
      } catch {}
      try {
        const vp = document.getElementById('qr-scanner-viewport');
        if (vp) {
          const strip = (c) => { c.querySelectorAll('video').forEach(v => { v.removeAttribute('controls'); v.controls = false; v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.style.pointerEvents = 'none'; }); };
          strip(vp);
          const obs = new MutationObserver(() => strip(vp));
          obs.observe(vp, { childList: true, subtree: true, attributes: true, attributeFilter: ['controls'] });
          html5Qr._controlsObserver = obs;
        }
      } catch {}
      busyRef.current = false;
      setStatus('SCANNING');
    } catch (err) {
      busyRef.current = false;
      if (!mountedRef.current) return;
      let msg = 'Failed to start camera.';
      const m = typeof err?.message === 'string' ? err.message : '';
      if (m.includes('NotAllowed') || m.includes('Permission')) msg = 'Camera permission denied. Please allow camera access in Settings.';
      else if (m.includes('NotReadable') || m.includes('in use')) msg = 'Camera is in use by another app.';
      else if (m.includes('NotFound')) msg = 'No camera found on this device.';
      else if (m) msg = m;
      setError(msg); setStatus('ERROR'); await stopScanner();
    }
  }, [facingBack, stopScanner, handleScanResult]);

  useEffect(() => { const t = setTimeout(() => { if (mountedRef.current) startScanner(); }, 200); return () => clearTimeout(t); }, []); // eslint-disable-line

  const handleFileUpload = async (file) => {
    if (!file) return;
    await stopScanner(); setStatus('LOADING'); setResult(null); setQrTypeData(null); setError(null);
    try { const qr = new Html5Qrcode('qr-scanner-file-temp'); const text = await qr.scanFile(file, true); if (mountedRef.current) handleScanResult(text); }
    catch { if (mountedRef.current) { setError('No QR code found in this image.'); setStatus('ERROR'); } }
  };

  const handleCopy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result); } catch { const t = document.createElement('textarea'); t.value = result; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result) return;
    try { await Share.share({ title: 'Scanned QR Code', text: result, dialogTitle: 'Share QR Content' }); }
    catch { if (navigator.share) navigator.share({ title: 'Scanned QR Code', text: result }).catch(() => {}); }
  };

  const handleSave = async () => {
    if (!result || !qrTypeData) return;
    import('../utils/storage').then(({ saveToSaved }) => { saveToSaved({ qrData: { text: result }, type: qrTypeData.type.toUpperCase(), displayText: result }); });
    alert('Saved to favorites!');
  };

  const handlePrimaryAction = async () => {
    if (!result || !qrTypeData) return;
    const t = result.trim();
    try {
      if (qrTypeData.type === 'Website') {
        const url = /^https?:\/\//i.test(t) ? t : 'https://' + t;
        if (Capacitor.isNativePlatform()) { await Browser.open({ url, windowName: '_system' }); } else { window.open(url, '_blank'); }
      } else if (qrTypeData.type === 'WiFi') {
        const p = t.match(/P:(.*?);/); await navigator.clipboard.writeText(p ? p[1] : t); alert(p ? 'WiFi Password Copied!' : 'WiFi details copied.');
      } else if (qrTypeData.type === 'Email' || qrTypeData.type === 'Phone') { window.location.href = t; }
      else if (qrTypeData.type === 'Contact') { const b = new Blob([t], { type: 'text/vcard' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'contact.vcf'; a.click(); }
      else { await handleCopy(); }
    } catch (err) { console.error('Action failed:', err); }
  };

  const resumeScanning = () => {
    const qr = html5QrRef.current;
    if (qr && qr.isPaused) { try { qr.resume(); } catch {} } else { startScanner(); }
    setResult(null); setQrTypeData(null); setStatus('SCANNING');
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && zoomCapabilities) {
      const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      touchStateRef.current = { distance: d, initialZoom: zoom };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && zoomCapabilities) {
      const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      applyZoom(touchStateRef.current.initialZoom * (d / touchStateRef.current.distance));
    }
  };

  const ActionIcon = qrTypeData?.actionIcon || ExternalLink;
  const TypeIcon = qrTypeData?.icon || FileText;

  return (
    <div className="scanner-page scanner-page-enter">
      <div className="qrs">
        {/* Header */}
        <header className="qrs-header">
          <button className="qrs-icon-btn" onClick={safeBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="qrs-header-center">
            <h1 className="qrs-title">Scan QR Code</h1>
            <p className="qrs-subtitle">Align QR code within the frame</p>
          </div>
          <button className={`qrs-icon-btn qrs-flash ${flashOn ? 'on' : ''}`} onClick={toggleFlash} aria-label="Toggle flash">
            {flashOn ? <Zap size={18} /> : <ZapOff size={18} />}
            <span className="qrs-flash-lbl">Flash</span>
          </button>
        </header>

        {/* Body */}
        <div className="qrs-body" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
          {/* Loading */}
          {status === 'LOADING' && (
            <div className="qrs-center-msg">
              <div className="qrs-spinner" />
              <p>Starting Camera...</p>
              <p className="qrs-hint">Allow camera access when prompted</p>
            </div>
          )}

          {/* Error */}
          {status === 'ERROR' && (
            <div className="qrs-center-msg">
              <AlertCircle size={44} color="#ef4444" />
              <p>{error}</p>
              <button className="qrs-retry-btn" onClick={startScanner}><RefreshCcw size={16} /> Try Again</button>
            </div>
          )}

          {/* Scanner Frame */}
          <div className={`qrs-frame ${status === 'DETECTED' ? 'detected' : ''}`}>
            {/* Status Pill */}
            {status === 'SCANNING' && (
              <div className="qrs-pill"><ScanLine size={14} /><span>Scanning...</span></div>
            )}
            {status === 'DETECTED' && (
              <div className="qrs-pill detected"><CheckCircle2 size={14} /><span>Detected!</span></div>
            )}

            {/* Camera */}
            <div id="qr-scanner-viewport" className={`qrs-viewport ${status === 'DETECTED' ? 'blur' : ''}`} />

            {/* Corner Brackets */}
            <div className="qrs-corners">
              <div className="qrs-corner tl" /><div className="qrs-corner tr" />
              <div className="qrs-corner bl" /><div className="qrs-corner br" />
            </div>

            {/* Laser */}
            {status === 'SCANNING' && <div className="qrs-laser" />}
            {status === 'DETECTED' && <div className="qrs-laser frozen" />}
          </div>

          {/* Info */}
          <div className="qrs-info-line">
            <ShieldCheck size={14} /><span>Scanning happens automatically</span>
          </div>

          {/* Zoom */}
          {status === 'SCANNING' && zoomCapabilities && (
            <div className="qrs-zoom">
              <button onClick={() => applyZoom(zoom - 0.5)}><Minus size={14} /></button>
              <input type="range" min={zoomCapabilities.min} max={zoomCapabilities.max} step={zoomCapabilities.step} value={zoom} onChange={e => applyZoom(parseFloat(e.target.value))} />
              <button onClick={() => applyZoom(zoom + 0.5)}><Plus size={14} /></button>
              <span>{zoom.toFixed(1)}x</span>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="qrs-controls">
          <button className="qrs-ctrl-btn" onClick={() => fileInputRef.current?.click()}>
            <div className="qrs-ctrl-icon"><Image size={20} /></div>
            <span>Gallery</span>
          </button>
          <button className="qrs-ctrl-btn" onClick={safeBack}>
            <div className="qrs-ctrl-icon"><X size={20} /></div>
            <span>Close</span>
          </button>
        </div>

        {/* Detection Bottom Sheet */}
        {status === 'DETECTED' && qrTypeData && (
          <div className="qrs-sheet-bg" onClick={resumeScanning}>
            <div className="qrs-sheet" onClick={e => e.stopPropagation()}>
              <div className="qrs-sheet-handle" />
              <div className="qrs-sheet-head">
                <CheckCircle2 size={22} color="#4ade80" />
                <h3>QR Detected</h3>
              </div>
              <div className="qrs-sheet-type">
                <TypeIcon size={14} />
                <span>{qrTypeData.title}</span>
              </div>
              <div className="qrs-sheet-preview" onClick={handlePrimaryAction}>
                <div className="qrs-sheet-link-icon"><Link2 size={20} /></div>
                <div className="qrs-sheet-link-text">
                  <p className="qrs-sheet-url">{result}</p>
                  <p className="qrs-sheet-tap">Tap to view</p>
                </div>
              </div>
              <div className="qrs-sheet-actions">
                <button className="qrs-sheet-act primary" onClick={handlePrimaryAction}>
                  <ActionIcon size={20} />
                  <span>{qrTypeData.action}</span>
                </button>
                <button className="qrs-sheet-act" onClick={handleCopy}>
                  {copied ? <CheckCircle2 size={20} color="#4ade80" /> : <Copy size={20} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button className="qrs-sheet-act" onClick={handleShare}>
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
                <button className="qrs-sheet-act" onClick={handleSave}>
                  <Star size={20} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} accept="image/*" onChange={e => handleFileUpload(e.target.files?.[0])} style={{ display: 'none' }} />
        <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
      </div>
    </div>
  );
}
