import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateBarcodeChecksum } from '../../utils/barcodeStandardsExtended';

export default function BarcodeTestScanModal({
  isOpen,
  onClose,
  targetBcid,
  targetText
}) {
  if (!isOpen) return null;

  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      setScanResult(null);
      const scanner = new Html5Qrcode('barcode-test-scanner-view');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.55
        },
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText, decodedResult?.result?.format?.formatName);
          scanner.stop().catch(() => {});
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.warn('Scanner start warning:', err);
      setErrorMsg('Camera unavailable or permission denied. Try uploading an image or screenshot.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (_) {}
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (scannedData, formatName) => {
    const isMatch = scannedData.trim() === targetText.trim() ||
      scannedData.replace(/\D/g, '') === targetText.replace(/\D/g, '');

    const checksum = validateBarcodeChecksum(targetBcid, scannedData);

    setScanResult({
      data: scannedData,
      format: formatName || targetBcid.toUpperCase(),
      isMatch,
      checksumValid: checksum.isValid
    });
    stopCamera();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('barcode-test-scanner-view');
      const result = await scanner.scanFile(file, true);
      handleScanSuccess(result, 'Image File');
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not detect a barcode in the selected photo.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderRadius: 24,
        padding: '24px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary, #FF7C00)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              VERIFICATION TEST
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary, #1C1C1E)' }}>
              Test Scan Barcode
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: 'var(--bg-hover, rgba(0,0,0,0.06))',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #636366)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera View / Result Card */}
        {!scanResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              id="barcode-test-scanner-view"
              style={{
                width: '100%',
                height: 220,
                borderRadius: 18,
                background: '#000000',
                overflow: 'hidden',
                position: 'relative'
              }}
            />

            {errorMsg && (
              <div style={{
                background: 'rgba(255, 59, 48, 0.08)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 12,
                color: '#FF3B30'
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  background: 'var(--bg-elevated, #F2F2F7)',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                  borderRadius: 12,
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary, #1C1C1E)'
                }}
              >
                <Upload size={14} />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <button
                onClick={startCamera}
                style={{
                  background: 'rgba(255, 124, 0, 0.08)',
                  border: '1px solid rgba(255, 124, 0, 0.2)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--accent-primary, #FF7C00)'
                }}
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : (
          /* Successful Result Presentation */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: scanResult.isMatch ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 149, 0, 0.08)',
              border: `1px solid ${scanResult.isMatch ? '#34C75940' : '#FF950040'}`,
              borderRadius: 18,
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              {scanResult.isMatch ? (
                <CheckCircle2 size={32} color="#34C759" strokeWidth={2.5} />
              ) : (
                <AlertTriangle size={32} color="#FF9500" strokeWidth={2.5} />
              )}
              <div>
                <span style={{ fontSize: 16, fontWeight: 900, color: scanResult.isMatch ? '#34C759' : '#FF9500', display: 'block' }}>
                  {scanResult.isMatch ? '✓ Scan Successful' : '⚠ Data Mismatch'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
                  {scanResult.isMatch
                    ? 'Scanned output precisely matches generated data'
                    : 'Scanned output differs from currently configured data'}
                </span>
              </div>
            </div>

            {/* Results breakdown */}
            <div style={{
              background: 'var(--bg-elevated, #F9F9FB)',
              borderRadius: 16,
              border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Format:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>{scanResult.format}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Scanned Data:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #1C1C1E)' }}>
                  {scanResult.data}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted, #8E8E93)', fontWeight: 600 }}>Checksum:</span>
                <span style={{ fontWeight: 700, color: scanResult.checksumValid ? '#34C759' : '#FF3B30' }}>
                  {scanResult.checksumValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>

            {/* Retest button */}
            <button
              onClick={() => {
                setScanResult(null);
                startCamera();
              }}
              style={{
                background: 'var(--accent-primary, #FF7C00)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(255, 124, 0, 0.3)'
              }}
            >
              <RefreshCw size={16} />
              <span>Scan Another</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
