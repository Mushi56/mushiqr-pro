import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  ShieldCheck
} from 'lucide-react';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const state = html5QrRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrRef.current.stop();
        }
      } catch (e) {
        // ignore
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
      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: cameraFacing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setResult(decodedText);
          stopScanner();
        },
        () => {} // ignore scan failures
      );

      setScanning(true);
    } catch (err) {
      setError('Camera access denied or not available. Please allow camera permissions or try uploading an image.');
      setScanning(false);
    }
  }, [cameraFacing, stopScanner]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setResult(null);
    setError(null);

    try {
      const html5Qr = new Html5Qrcode('qr-scanner-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      setResult(decodedText);
      html5Qr.clear();
    } catch (err) {
      setError('No QR code found in this image. Please try another image with a clear QR code.');
    }
  }, []);

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
      // Fallback
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
      new URL(text);
      return true;
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
        <div className="scanner-header">
          <div className="scanner-header-icon">
            <ScanLine size={24} />
          </div>
          <div>
            <h2 className="scanner-title">QR Code Scanner</h2>
            <p className="scanner-subtitle">Scan with camera or upload an image</p>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="scanner-result">
            <div className="scanner-result-badge">
              <CheckCircle2 size={18} />
              <span>QR Code Detected</span>
            </div>
            <div className="scanner-result-content">
              <p className="scanner-result-text">{result}</p>
            </div>
            <div className="scanner-result-actions">
              <button className="scanner-action-btn primary" onClick={handleCopy}>
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {isURL(result) && (
                <a
                  className="scanner-action-btn accent"
                  href={result}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              )}
              <button className="scanner-action-btn ghost" onClick={handleReset}>
                <RefreshCw size={16} />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="scanner-error">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Scanner Area */}
        {!result && (
          <>
            {/* Camera Scanner */}
            <div className="scanner-viewport-wrapper">
              <div
                id="qr-scanner-viewport"
                ref={scannerRef}
                className={`scanner-viewport ${scanning ? 'active' : ''}`}
              >
                {!scanning && (
                  <div className="scanner-viewport-placeholder">
                    <Camera size={48} strokeWidth={1} />
                    <span>Camera preview will appear here</span>
                  </div>
                )}
              </div>

              {scanning && (
                <div className="scanner-overlay">
                  <div className="scanner-crosshair">
                    <div className="crosshair-corner tl" />
                    <div className="crosshair-corner tr" />
                    <div className="crosshair-corner bl" />
                    <div className="crosshair-corner br" />
                    <div className="scanner-line" />
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="scanner-controls">
              {!scanning ? (
                <button className="scanner-btn-start" onClick={startScanner}>
                  <Camera size={20} />
                  Start Camera Scan
                </button>
              ) : (
                <button className="scanner-btn-stop" onClick={stopScanner}>
                  <X size={20} />
                  Stop Camera
                </button>
              )}

              <button
                className="scanner-btn-flip"
                onClick={() => {
                  setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
                  if (scanning) {
                    stopScanner().then(() => setTimeout(startScanner, 300));
                  }
                }}
                title="Switch Camera"
              >
                <RefreshCcw size={18} />
              </button>
            </div>

            {/* Divider */}
            <div className="scanner-divider">
              <div className="scanner-divider-line" />
              <span className="scanner-divider-text">or</span>
              <div className="scanner-divider-line" />
            </div>

            {/* File Upload Area */}
            <div
              className={`scanner-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={32} strokeWidth={1.5} />
              <span className="scanner-upload-text">
                Drop an image here or <strong>click to upload</strong>
              </span>
              <span className="scanner-upload-hint">Supports PNG, JPG, WEBP</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </div>
          </>
        )}

        {/* Hidden temp element for file scanning */}
        <div id="qr-scanner-file-temp" style={{ display: 'none' }} />

        {/* Info */}
        <div className="scanner-info">
          <ShieldCheck size={14} />
          <span>Scans are processed locally — your data never leaves your device.</span>
        </div>
      </div>
    </div>
  );
}
