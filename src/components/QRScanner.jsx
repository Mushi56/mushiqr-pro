import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { App } from '@capacitor/app';
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
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck
} from 'lucide-react';

export default function QRScanner({ onBack }) {
  const [status, setStatus] = useState('IDLE'); // 'IDLE', 'REQUESTING', 'LOADING', 'SCANNING', 'ERROR', 'RESULT'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Handle Android System Back Button
  useEffect(() => {
    let isMounted = true;
    const backListener = App.addListener('backButton', () => {
      if (!isMounted) return;
      handleBack();
    });

    return () => {
      isMounted = false;
      backListener.then(l => l.remove());
    };
  }, []);

  // 2. Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
      } catch (e) {
        console.warn("Scanner stop error:", e);
      }
      html5QrRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (status === 'LOADING') return;
    
    setResult(null);
    setError(null);
    setStatus('REQUESTING');

    try {
      // Step 1: Explicitly request camera permission via Capacitor
      const perm = await CapCamera.requestPermissions();
      if (perm.camera !== 'granted') {
        setStatus('ERROR');
        setError('Camera permission is required. Please enable it in your device settings.');
        return;
      }

      setStatus('LOADING');

      // Step 2: Initialize html5-qrcode
      await stopScanner();
      
      const html5Qr = new Html5Qrcode('qr-scanner-viewport');
      html5QrRef.current = html5Qr;

      // Step 3: Fetch cameras to find the best back camera
      const cameras = await Html5Qrcode.getCameras().catch(() => []);
      let targetCamera = { facingMode: cameraFacing };
      
      if (cameras && cameras.length > 0) {
        const backCam = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('environment') ||
          c.label.toLowerCase().includes('rear')
        );
        if (backCam && cameraFacing === 'environment') {
          targetCamera = backCam.id;
        } else if (cameraFacing === 'user') {
          const frontCam = cameras.find(c => c.label.toLowerCase().includes('front') || c.label.toLowerCase().includes('user'));
          if (frontCam) targetCamera = frontCam.id;
        }
      }

      const config = {
        fps: 10,
        qrbox: (viewWidth, viewHeight) => {
          const size = Math.min(viewWidth, viewHeight) * 0.7;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      // Step 4: Start scanning with a safety timeout
      const startPromise = html5Qr.start(
        targetCamera,
        config,
        (decodedText) => {
          setResult(decodedText);
          setStatus('RESULT');
          stopScanner();
        },
        () => {} // silent scan failures
      );

      // 10 second timeout for camera start
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera initialization timed out. Please try again.')), 10000)
      );

      await Promise.race([startPromise, timeoutPromise]);
      setStatus('SCANNING');

    } catch (err) {
      console.error("Scanner error:", err);
      setError(err.message || 'Failed to start camera. Ensure it is not being used by another app.');
      setStatus('ERROR');
      await stopScanner();
    }
  }, [cameraFacing, stopScanner, status]);

  const handleBack = () => {
    stopScanner();
    if (onBack) onBack();
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setStatus('LOADING');
    setResult(null);
    setError(null);

    try {
      const html5Qr = new Html5Qrcode('qr-scanner-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      setResult(decodedText);
      setStatus('RESULT');
    } catch (err) {
      setError('No QR code found in this image. Try a clearer photo.');
      setStatus('ERROR');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isURL = (text) => {
    try {
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <div className="scanner-page fade-in">
      <div className="scanner-container">
        {/* Persistent Header */}
        <header className="scanner-nav-header">
          <button className="scanner-back-btn" onClick={handleBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="scanner-nav-title">
            <h3>QR Scanner</h3>
          </div>
          <div style={{ width: 42 }} />
        </header>

        <div className="scanner-main-content">
          {/* Result View */}
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
                    <a className="res-btn open" href={result} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'var(--accent-primary)', color: '#000' }}>
                      <ExternalLink size={18} /> Open
                    </a>
                  )}
                </div>
                <button className="res-retry-btn" onClick={() => setStatus('IDLE')} style={{ marginTop: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <RefreshCw size={14} style={{ marginRight: '4px' }} /> Scan Another
                </button>
              </div>
            </div>
          )}

          {/* Scanner Viewport Area */}
          {(status !== 'RESULT') && (
            <div className="scanner-viewport-wrapper">
              <div 
                id="qr-scanner-viewport" 
                className={`scanner-view-box ${status === 'SCANNING' ? 'active' : ''}`}
              >
                {status === 'IDLE' && (
                  <div className="scanner-placeholder">
                    <div className="placeholder-icon">
                      <ScanLine size={64} className="pulse-anim" />
                    </div>
                    <p>Point your camera at a QR code</p>
                    <button className="scanner-start-trigger" onClick={startScanner}>
                      <Camera size={18} style={{ marginRight: '8px' }} />
                      Open Camera
                    </button>
                  </div>
                )}

                {(status === 'LOADING' || status === 'REQUESTING') && (
                  <div className="scanner-loading-state">
                    <Loader2 size={48} className="spinning" color="var(--accent-primary)" />
                    <p>{status === 'REQUESTING' ? 'Requesting Permissions...' : 'Starting Camera...'}</p>
                  </div>
                )}

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
                    <button className="overlay-icon-btn" onClick={() => {
                      setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
                      setTimeout(startScanner, 100);
                    }} title="Switch Camera">
                      <RefreshCcw size={20} />
                    </button>
                    <button className="overlay-icon-btn close" onClick={() => setStatus('IDLE')}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Alternative */}
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
      
      {/* Hidden temp div for file scanning */}
      <div id="qr-scanner-file-temp" style={{ display: 'none' }} />
    </div>
  );
}
