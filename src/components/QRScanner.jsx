import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera as CapCamera } from '@capacitor/camera';
import {
  Camera,
  Upload,
  Copy,
  ExternalLink,
  X,
  ScanLine,
  CheckCircle2,
  RefreshCw,
  ImagePlus,
  RefreshCcw,
  Zap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [hasCameras, setHasCameras] = useState(false);

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check for cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras().then(cameras => {
      if (cameras && cameras.length > 0) {
        setHasCameras(true);
      }
    }).catch(() => {
      setHasCameras(false);
    });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
      } catch (e) {
        console.error("Stop error:", e);
      }
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setResult(null);
    setError(null);

    if (!scannerRef.current) return;

    try {
      // For Capacitor/Android: Request permission explicitly
      try {
        const perm = await CapCamera.requestPermissions();
        if (perm.camera !== 'granted') {
          setError('Camera permission is required to scan codes.');
          return;
        }
      } catch (e) {
        console.warn('Capacitor Camera plugin not available, falling back to browser API');
      }

      // Ensure any existing instance is stopped
      if (html5QrRef.current) {
        await stopScanner();
      }

      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5Qr.start(
        { facingMode: cameraFacing },
        config,
        (decodedText) => {
          setResult(decodedText);
          stopScanner();
        },
        () => {} // ignore scan failures
      );

      setScanning(true);
    } catch (err) {
      console.error("Start error:", err);
      setError('Camera access denied or failed to start. Please check permissions.');
      setScanning(false);
    }
  }, [cameraFacing, stopScanner]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setResult(null);
    setError(null);
    if (scanning) await stopScanner();

    try {
      const html5Qr = new Html5Qrcode('qr-scanner-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      setResult(decodedText);
    } catch (err) {
      setError('No QR code found. Please try a clearer image.');
    }
  }, [scanning, stopScanner]);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const isURL = (text) => {
    try {
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCopied(false);
  };

  return (
    <div className="scanner-page">
      <div className="scanner-container">
        {/* Header */}
        <div className="scanner-header-simple">
          <h2 className="scanner-title">QR Scanner</h2>
          <p className="scanner-subtitle">Scan or upload to decode</p>
        </div>

        {/* Result Display */}
        {result && (
          <div className="scanner-result-card fade-in">
            <div className="scanner-result-header">
              <CheckCircle2 size={18} color="var(--success)" />
              <span>Result Detected</span>
            </div>
            <div className="scanner-result-body">
              <p className="scanner-result-text">{result}</p>
            </div>
            <div className="scanner-result-footer">
              <button className="scanner-action-btn primary" onClick={handleCopy}>
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {isURL(result) && (
                <a className="scanner-action-btn accent" href={result} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} /> Open
                </a>
              )}
              <button className="scanner-action-btn ghost" onClick={handleReset}>
                <RefreshCw size={16} /> New Scan
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="scanner-error-message fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button className="error-close" onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Scanner Area */}
        {!result && (
          <div className="scanner-main-view">
            <div 
              className={`scanner-viewport-card ${dragOver ? 'drag-over' : ''} ${scanning ? 'is-scanning' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              <div id="qr-scanner-viewport" ref={scannerRef} className="scanner-viewport">
                {!scanning && (
                  <div className="scanner-empty-state">
                    <ScanLine size={64} strokeWidth={1} className="scan-icon-anim" />
                    <p>Tap "Start Camera" or drop image here</p>
                  </div>
                )}
              </div>

              {scanning && (
                <div className="scanner-guide-overlay">
                  <div className="scanner-guide-box">
                    <div className="guide-corner tl" />
                    <div className="guide-corner tr" />
                    <div className="guide-corner bl" />
                    <div className="guide-corner br" />
                    <div className="scanner-laser-line" />
                  </div>
                </div>
              )}
            </div>

            {/* Combined Controls */}
            <div className="scanner-controls-group">
              {!scanning ? (
                <button className="scanner-main-btn start" onClick={startScanner}>
                  <Camera size={18} /> Start Camera
                </button>
              ) : (
                <button className="scanner-main-btn stop" onClick={stopScanner}>
                  <X size={18} /> Stop Camera
                </button>
              )}

              <button className="scanner-main-btn upload" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Upload Image
              </button>

              {scanning && (
                <button className="scanner-icon-btn" onClick={() => {
                  setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
                  stopScanner().then(() => setTimeout(startScanner, 300));
                }}>
                  <RefreshCcw size={18} />
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </div>
          </div>
        )}

        <div id="qr-scanner-file-temp" style={{ display: 'none' }} />

        <div className="scanner-privacy-notice">
          <ShieldCheck size={14} />
          <span>Local processing — No data is sent to servers</span>
        </div>
      </div>
    </div>
  );
}
