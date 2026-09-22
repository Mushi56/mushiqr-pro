import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, Edit3, Trash2, X, RefreshCw, FileImage, FileCode, FileText, Layers, Sparkles, CheckCircle, FileArchive, Share2, QrCode, Barcode, AlertCircle, Table, Plus, Play, Trash, Crown } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { generateQRMatrix, renderQR } from '../utils/qrEngine';
import { renderBarcode, BARCODE_STANDARDS } from '../utils/barcodeEngine';
import { jsPDF } from 'jspdf';
import { getOrganizedFilePath } from '../utils/exportUtils';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import { usePremium } from '../services/premiumContext';
import PaidCrownBadge from './PaidCrownBadge';
import DeleteConfirmModal from './DeleteConfirmModal';

// Helper for mobile ZIP saving
async function saveZipNative(base64Data, filename, category = 'QR Codes') {
  try {
    await Filesystem.requestPermissions();
  } catch (e) {
    console.warn('Filesystem permissions warning:', e);
  }

  const organizedPath = getOrganizedFilePath(filename, category);
  let savedFileUri = null;
  let savedToDocuments = false;
  const targetDir = Capacitor.getPlatform() === 'android' ? Directory.ExternalStorage : Directory.Documents;

  // 1. Primary: Save to device target directory
  if (Capacitor.isNativePlatform()) {
    try {
      const docFile = await Filesystem.writeFile({
        path: organizedPath,
        data: base64Data,
        directory: targetDir,
        recursive: true,
      });
      savedFileUri = docFile.uri;
      savedToDocuments = true;
    } catch (fallbackErr) {}
  }

  // 2. Fallback to Cache if Documents write failed
  if (!savedFileUri) {
    try {
      const cacheFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
      savedFileUri = cacheFile.uri;
    } catch (cacheErr) {
      console.error('Failed to write ZIP to cache:', cacheErr);
    }
  }

  // 3. Return the URI so we can share it manually from the modal
  return savedFileUri;
}

export default function BatchPage({ 
  onNavigate, 
  activeGeneratorStyle, 
  setBatchItems, 
  batchItems,
  onEditBatchItemStyle,
  initialBatchType
}) {
  const { showPaywall } = usePremium();
  const [, setFamTick] = useState(0);

  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => setFamTick(t => t + 1));
    return () => unsub?.();
  }, []);

  const access = FeatureAccessManager.canUseFeature('batch_view');

  useEffect(() => {
    if (!access.allowed && access.status !== 'disabled_by_admin') {
      showPaywall('batch_view');
    }
  }, [access.allowed, access.status, showPaywall]);

  if (!access.allowed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#09090f', color: '#f0f0f8', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {access.status === 'disabled_by_admin' ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Bulk Batch Generation Unavailable</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 440, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Bulk Batch Generation has been disabled globally by the Administrator.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('home')}
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))', border: '1px solid rgba(255, 215, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', boxShadow: '0 8px 24px rgba(255, 170, 0, 0.25)' }}>
              <Crown size={36} strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>Unlock Mushi QR Pro</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 420, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Bulk Batch Generation is a Pro feature. Upgrade your subscription plan to generate and export hundreds of codes instantly.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => showPaywall('batch_view')}
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(255, 170, 0, 0.4)' }}
              >
                <Crown size={16} fill="#000" color="#000" strokeWidth={2.5} />
                <span>Buy Pro</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('home')}
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  const [batchType, setBatchType] = useState(initialBatchType || 'QR'); // 'QR' | 'BARCODE'
  const [barcodeType, setBarcodeType] = useState('ean13');
  const [fileData, setFileData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [dataCol, setDataCol] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('PNG');
  const [exportQuality, setExportQuality] = useState('Normal');
  const [customZipFileName, setCustomZipFileName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    itemTitle: null,
    confirmText: 'Delete',
    iconType: 'trash',
    isDangerous: false,
    onConfirm: null
  });
  const [exportSuccessInfo, setExportSuccessInfo] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  const [previewLimit, setPreviewLimit] = useState(50);
  const [activeImportMode, setActiveImportMode] = useState('upload'); // 'upload' | 'spreadsheet'
  const [sheetRows, setSheetRows] = useState([
    { id: '1', data: 'https://example.com', filename: 'Item-001' }
  ]);

  const isCancelledRef = useRef(false);


  useEffect(() => {
    if (initialBatchType) {
      setBatchType(initialBatchType);
    }
  }, [initialBatchType]);

  const fileInputRef = useRef(null);

  const QUALITY_SIZES = {
    'Low': 512,
    'Normal': 1024,
    'HD': 2048,
    'HQ': 4096
  };

  const handleModeSwitch = async (newType) => {
    if (batchType === newType || isProcessing) return;

    if (batchItems.length > 50) {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingMessage(`Switching to Bulk ${newType === 'QR' ? 'QR Codes' : 'Barcodes'}...`);
      await new Promise(r => setTimeout(r, 10));

      const total = batchItems.length;
      const chunkSize = 200;
      
      for (let i = 0; i < total; i += chunkSize) {
        const percent = Math.min(100, Math.round(((i + chunkSize) / total) * 100));
        setProcessingProgress(percent);
        // Allow UI to render progress bar smoothly
        await new Promise(r => setTimeout(r, 16));
      }

      setBatchType(newType);
      setProcessingProgress(100);
      await new Promise(r => setTimeout(r, 60));
      setIsProcessing(false);
    } else {
      setBatchType(newType);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set default output ZIP filename to uploaded XLS/CSV file name without extension
    const baseFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, '_');
    if (baseFileName) {
      setCustomZipFileName(baseFileName);
    }

    setIsProcessing(true);
    setProcessingMessage('Reading uploaded file...');
    setProcessingProgress(15);

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 50);
        setProcessingProgress(percent);
      }
    };

    reader.onload = async (e) => {
      try {
        setProcessingMessage('Parsing file rows...');
        setProcessingProgress(65);
        await new Promise(r => setTimeout(r, 50));

        let rows = [];
        if (isExcel) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } else {
          const text = e.target.result;
          rows = parseCSV(text);
        }

        setProcessingProgress(90);

        if (rows.length === 0) {
          alert('The file appears to be empty.');
          setIsProcessing(false);
          return;
        }

        const firstRow = rows[0] || [];
        const colList = firstRow.map((val, idx) => ({
          index: idx,
          label: val ? val.toString().trim() : `Column ${idx + 1}`
        }));

        setColumns(colList);
        setFileData(rows);

        if (colList.length > 0) {
          setDataCol(colList[0].index.toString());
          if (colList.length > 1) {
            setNameCol(colList[1].index.toString());
          } else {
            setNameCol('none');
          }
        }
        setProcessingProgress(100);
      } catch (err) {
        console.error(err);
        alert('Failed to parse file. Please verify the format.');
      } finally {
        setTimeout(() => setIsProcessing(false), 200);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleImport = async () => {
    if (!fileData || dataCol === '') return;

    setIsProcessing(true);
    setProcessingMessage('Generating batch entries...');
    setProcessingProgress(5);
    await new Promise(r => setTimeout(r, 60));

    const startIndex = hasHeader ? 1 : 0;
    const imported = [];
    const totalRows = fileData.length - startIndex;
    const nameCountMap = new Map();

    // Base default style configurations depending on QR vs BARCODE
    const defaultStyle = batchType === 'BARCODE' ? {
      bcid: barcodeType,
      barColor: '#000000',
      bgColor: '#ffffff',
      barWidth: 2,
      height: 90,
      margin: 16,
      displayValue: true
    } : { ...activeGeneratorStyle };

    const stepSize = Math.max(1, Math.floor(totalRows / 25));
    for (let i = startIndex; i < fileData.length; i++) {
      const row = fileData[i];
      if (row && row.length > 0) {
        const codeData = row[parseInt(dataCol)];
        if (codeData && codeData.toString().trim() !== '') {
          const fileNameVal = nameCol !== 'none' && nameCol !== '' ? row[parseInt(nameCol)] : null;
          let rawName = fileNameVal ? fileNameVal.toString().trim().replace(/[^a-zA-Z0-9-_]/g, '_') : '';
          if (!rawName) {
            rawName = `${batchType.toLowerCase()}_code_${i - startIndex + 1}`;
          }

          // Guarantee unique filename across imported items
          let cleanFileName = rawName;
          if (nameCountMap.has(rawName.toLowerCase())) {
            const count = nameCountMap.get(rawName.toLowerCase()) + 1;
            nameCountMap.set(rawName.toLowerCase(), count);
            cleanFileName = `${rawName}_${count}`;
          } else {
            nameCountMap.set(rawName.toLowerCase(), 1);
          }

          imported.push({
            id: `batch-${Date.now()}-${i}`,
            data: codeData.toString().trim(),
            filename: cleanFileName,
            type: batchType,
            style: defaultStyle
          });
        }
      }

      if ((i - startIndex) % stepSize === 0 || i === fileData.length - 1) {
        const pct = Math.round(((i - startIndex + 1) / totalRows) * 100);
        setProcessingProgress(pct);
        setProcessingMessage(`Imported ${imported.length} items (${pct}%)...`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    setBatchItems(imported);
    setFileData(null);
    setIsProcessing(false);
  };

  const applyGlobalStyle = () => {
    if (batchItems.length === 0) return;
    const updated = batchItems.map(item => ({
      ...item,
      style: { ...activeGeneratorStyle }
    }));
    setBatchItems(updated);
  };

  const handleRemoveItem = (id) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const handleClearBatch = () => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Clear Entire Batch?',
      description: 'Are you sure you want to remove all imported and generated items from this batch? This action cannot be undone.',
      itemTitle: `${batchItems.length} batch items`,
      confirmText: 'Clear Batch',
      iconType: 'alert',
      isDangerous: true,
      onConfirm: () => {
        setBatchItems([]);
      }
    });
  };

  const downloadSampleCSV = () => {
    const csvContent = batchType === 'BARCODE' 
      ? "data:text/csv;charset=utf-8,Barcode Data,Filename\n7501031311309,product_barcode_1\n9780201379624,book_barcode_2\nCODE128-TEST,generic_barcode"
      : "data:text/csv;charset=utf-8,QR Data,Filename\nhttps://google.com,google_qr\nhttps://youtube.com,youtube_qr\nConnect to Free WiFi,wifi_qr";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mushi_${batchType.toLowerCase()}_batch_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateZip = async () => {
    if (batchItems.length === 0) return;
    const accessCheck = FeatureAccessManager.canUseFeature('bulk_generation');
    if (!accessCheck.allowed) {
      alert('Bulk batch generation requires a plan with bulk_generation enabled. Please upgrade your subscription.');
      return;
    }
    isCancelledRef.current = false;
    setIsExporting(true);
    setExportProgress(0);

    // Preload logos only for QR codes
    const logoCache = {};
    const logoPromises = [];
    if (batchType === 'QR') {
      batchItems.forEach(item => {
        const src = item.style?.logo?.src;
        if (src && !logoCache[src]) {
          logoCache[src] = null;
          logoPromises.push(
            new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                logoCache[src] = img;
                resolve();
              };
              img.onerror = () => resolve();
              img.src = src;
            })
          );
        }
      });
    }

    if (logoPromises.length > 0) {
      await Promise.all(logoPromises);
    }

    const zip = new JSZip();
    const exportSize = QUALITY_SIZES[exportQuality] || 1024;
    const zipFilenameMap = new Map();

    // ── Chunked processing to prevent memory exhaustion on large batches ──
    const CHUNK_SIZE = 50; // items per chunk before GC yield
    const total = batchItems.length;

    for (let idx = 0; idx < total; idx++) {
      if (isCancelledRef.current) {
        setIsExporting(false);
        setExportProgress(0);
        return;
      }
      const item = batchItems[idx];

      // Ensure item has a unique filename in the ZIP output
      let rawName = (item.filename || '').toString().trim().replace(/[^a-zA-Z0-9-_]/g, '_');
      if (!rawName) {
        rawName = `${batchType.toLowerCase()}_code_${idx + 1}`;
      }
      let safeItemName = rawName;
      if (zipFilenameMap.has(rawName.toLowerCase())) {
        const count = zipFilenameMap.get(rawName.toLowerCase()) + 1;
        zipFilenameMap.set(rawName.toLowerCase(), count);
        safeItemName = `${rawName}_${count}`;
      } else {
        zipFilenameMap.set(rawName.toLowerCase(), 1);
      }

      // Create canvas, render, then IMMEDIATELY extract data and destroy canvas
      let pngDataUrl;
      let pngBase64;

      {
        // Scoped block so tempCanvas goes out of scope as soon as possible
        const tempCanvas = document.createElement('canvas');

        if (batchType === 'BARCODE') {
          const scale = exportQuality === 'Low' ? 1 : exportQuality === 'Normal' ? 2 : exportQuality === 'HD' ? 3 : 4;
          tempCanvas.width = 400 * scale;
          tempCanvas.height = 150 * scale;

          renderBarcode(tempCanvas, item.data, {
            bcid: item.style?.bcid || 'code128',
            barColor: item.style?.barColor || '#000000',
            bgColor: item.style?.bgColor || '#ffffff',
            barWidth: (item.style?.barWidth || 2) * scale,
            height: (item.style?.height || 90) * scale,
            margin: (item.style?.margin || 16) * scale,
            displayValue: item.style?.displayValue !== undefined ? item.style.displayValue : true,
            font: `${12 * scale}px Inter, sans-serif`
          });
        } else {
          tempCanvas.width = exportSize;
          tempCanvas.height = exportSize;

          const matrixInfo = generateQRMatrix(item.data, item.style.errorCorrection || 'H');
          const logoImgElement = item.style?.logo?.src ? logoCache[item.style.logo.src] : null;

          renderQR(tempCanvas, {
            ...matrixInfo,
            size: exportSize,
            ...item.style,
            logo: logoImgElement,
            textCenter: item.style.textCenterEnabled ? item.style.textCenterText : null,
            showHandle: false,
            selectedType: null
          });
        }

        pngDataUrl = tempCanvas.toDataURL('image/png');
        pngBase64 = pngDataUrl.split(',')[1];

        // 2. JPG — generate while tempCanvas still exists in scope
        if (selectedFormat === 'ALL' || selectedFormat === 'JPG') {
          const jpgCanvas = document.createElement('canvas');
          jpgCanvas.width = tempCanvas.width;
          jpgCanvas.height = tempCanvas.height;
          const ctx = jpgCanvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
          const jpgBase64 = jpgCanvas.toDataURL('image/jpeg', 0.9).split(',')[1];
          zip.file(`jpg/${safeItemName}.jpg`, jpgBase64, { base64: true });
          // Explicitly release JPG canvas GPU memory
          jpgCanvas.width = 0;
          jpgCanvas.height = 0;
        }

        // Explicitly release main canvas GPU memory before leaving the block
        tempCanvas.width = 0;
        tempCanvas.height = 0;
      }

      // 1. PNG
      if (selectedFormat === 'ALL' || selectedFormat === 'PNG') {
        zip.file(`png/${safeItemName}.png`, pngBase64, { base64: true });
      }

      // 3. SVG (wraps the PNG)
      if (selectedFormat === 'ALL' || selectedFormat === 'SVG') {
        const sw = exportSize;
        const sh = batchType === 'BARCODE' ? Math.round(150 * (exportQuality === 'Low' ? 1 : exportQuality === 'Normal' ? 2 : exportQuality === 'HD' ? 3 : 4)) : exportSize;
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${sw}" height="${sh}"
     viewBox="0 0 ${sw} ${sh}">
  <image width="${sw}" height="${sh}" xlink:href="data:image/png;base64,${pngBase64}"/>
</svg>`;
        zip.file(`svg/${safeItemName}.svg`, svgContent);
      }

      // 4. PDF
      if (selectedFormat === 'ALL' || selectedFormat === 'PDF') {
        const pdf = new jsPDF({
          orientation: batchType === 'BARCODE' ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        if (batchType === 'BARCODE') {
          pdf.addImage(pngDataUrl, 'PNG', 15, 30, 260, 100);
        } else {
          pdf.addImage(pngDataUrl, 'PNG', 20, 20, 170, 170);
        }

        zip.file(`pdf/${safeItemName}.pdf`, pdf.output('arraybuffer'));
      }

      // Release large string references
      pngDataUrl = null;
      pngBase64 = null;

      // 0-90% for item rendering
      setExportProgress(Math.round(((idx + 1) / total) * 90));

      // Yield to the browser every CHUNK_SIZE items so GC can reclaim memory.
      if ((idx + 1) % CHUNK_SIZE === 0) {
        await new Promise(resolve => setTimeout(resolve, 16));
      } else {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    try {
      // 90-100% for zip packaging
      const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, (metadata) => {
        setExportProgress(90 + Math.round((metadata.percent / 100) * 10));
      });
      const defaultName = `mushi-${batchType.toLowerCase()}-batch`;
      const cleanBaseName = customZipFileName.trim().replace(/[^a-zA-Z0-9-_]/g, '_') || defaultName;
      const archiveName = `${cleanBaseName}.zip`;
      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          const zipCategory = batchType === 'BARCODE' ? 'Barcodes' : 'QR Codes';
          const uri = await saveZipNative(base64Data, archiveName, zipCategory);
          setIsExporting(false);
          setExportSuccessInfo({
            filename: archiveName,
            count: total,
            isNative: true,
            fileUri: uri
          });
        };
        reader.readAsDataURL(content);
      } else {
        saveAs(content, archiveName);
        setIsExporting(false);
        setExportSuccessInfo({
          filename: archiveName,
          count: total,
          isNative: false
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to package ZIP archive.');
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, padding: '16px var(--main-padding-x) 140px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        
        {/* Toggle Selector for Batch Mode (Always Accessible) */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          padding: '6px',
          borderRadius: '16px',
          marginBottom: '20px',
          position: 'relative',
          gap: '6px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <button 
            onClick={() => handleModeSwitch('QR')}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: batchType === 'QR' ? 'var(--accent-primary)' : 'transparent',
              color: batchType === 'QR' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isProcessing ? 'default' : 'pointer',
              boxShadow: batchType === 'QR' ? '0 4px 14px rgba(214, 0, 54, 0.35)' : 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (batchType !== 'QR' && !isProcessing) {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (batchType !== 'QR' && !isProcessing) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {isProcessing && batchType !== 'QR' ? (
              <>
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${processingProgress}%`,
                  background: 'var(--accent-gradient)',
                  transition: 'width 0.1s ease-out',
                  zIndex: 0
                }} />
                <RefreshCw size={15} className="animate-spin" style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  Switching... {processingProgress}%
                </span>
              </>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '8px',
                  background: batchType === 'QR' ? 'rgba(255,255,255,0.2)' : 'rgba(214, 0, 54, 0.1)',
                  color: batchType === 'QR' ? '#ffffff' : 'var(--accent-primary)',
                  transition: 'all 0.2s ease'
                }}>
                  <QrCode size={16} />
                </div>
                Bulk QR
              </>
            )}
          </button>
          <button 
            onClick={() => handleModeSwitch('BARCODE')}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: batchType === 'BARCODE' ? 'var(--accent-primary)' : 'transparent',
              color: batchType === 'BARCODE' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isProcessing ? 'default' : 'pointer',
              boxShadow: batchType === 'BARCODE' ? '0 4px 14px rgba(214, 0, 54, 0.35)' : 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (batchType !== 'BARCODE' && !isProcessing) {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (batchType !== 'BARCODE' && !isProcessing) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {isProcessing && batchType !== 'BARCODE' ? (
              <>
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${processingProgress}%`,
                  background: 'var(--accent-gradient)',
                  transition: 'width 0.1s ease-out',
                  zIndex: 0
                }} />
                <RefreshCw size={15} className="animate-spin" style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  Switching... {processingProgress}%
                </span>
              </>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '8px',
                  background: batchType === 'BARCODE' ? 'rgba(255,255,255,0.2)' : 'rgba(214, 0, 54, 0.1)',
                  color: batchType === 'BARCODE' ? '#ffffff' : 'var(--accent-primary)',
                  transition: 'all 0.2s ease'
                }}>
                  <Barcode size={16} />
                </div>
                Bulk Barcode
              </>
            )}
          </button>
        </div>

        {/* Step 1: Upload or SpreadSheet Grid */}
        {!fileData && batchItems.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Mode Tabs: Upload vs Quick Sheet */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button
                onClick={() => {
                  const access = FeatureAccessManager.canUseFeature('batch_csv_import');
                  if (!access.allowed) {
                    showPaywall('batch_csv_import');
                    return;
                  }
                  setActiveImportMode('upload');
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeImportMode === 'upload' ? 'var(--bg-hover)' : 'transparent',
                  color: activeImportMode === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <PaidCrownBadge featureId="batch_csv_import" position="floating" size={8} />
                <Upload size={16} /> Upload File
              </button>
              <button
                onClick={() => {
                  const access = FeatureAccessManager.canUseFeature('batch_manual_input');
                  if (!access.allowed) {
                    showPaywall('batch_manual_input');
                    return;
                  }
                  setActiveImportMode('spreadsheet');
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeImportMode === 'spreadsheet' ? 'var(--accent-primary)' : 'transparent',
                  color: activeImportMode === 'spreadsheet' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  position: 'relative',
                  boxShadow: activeImportMode === 'spreadsheet' ? '0 4px 12px rgba(214,0,54,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <PaidCrownBadge featureId="batch_manual_input" position="floating" size={8} />
                <Table size={16} /> Quick Sheet
              </button>
            </div>

            {/* Sub-View A: Upload Mode */}
            {activeImportMode === 'upload' ? (
              <>
                <div 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className="glass-panel"
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '24px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: isProcessing ? 'default' : 'pointer',
                    transition: 'border-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  {isProcessing ? (
                    <>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(214, 0, 54, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                      }}>
                        <RefreshCw size={28} className="animate-spin text-accent" />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Reading & Parsing File...</h3>
                      <div style={{ width: '80%', height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden', margin: '8px 0', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: `${processingProgress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.15s ease-out' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>{processingProgress}%</span>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'rgba(214, 0, 54, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                      }}>
                        <Upload size={32} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Upload CSV or Excel</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 max(20px, 10%)', lineHeight: '1.4' }}>
                        Select a `.csv`, `.xlsx`, or `.xls` file containing your {batchType === 'BARCODE' ? 'barcode' : 'QR code'} values.
                      </p>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".csv, .xlsx, .xls" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={downloadSampleCSV}
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <FileSpreadsheet size={24} className="text-accent" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px' }}>Download Sample Template</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>Get a template showing correctly structured data</div>
                    </div>
                    <Download size={18} style={{ opacity: 0.6 }} />
                  </button>
                </div>
              </>
            ) : (
              /* Sub-View B: Interactive Spreadsheet Grid */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '160px' }}>
                {/* Information / Instruction Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(214, 0, 54, 0.08)',
                  border: '1px solid rgba(214, 0, 54, 0.2)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                    <Sparkles size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Copy & Paste:</strong> Paste columns from Excel, Google Sheets, or text to auto-generate rows. Press <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>Enter</kbd> to jump between fields or add new rows!
                    </span>
                  </div>
                </div>

                {/* Top Action Row: Fully Attached Flush to Upper Navbar (0px gap on scroll) */}
                <div style={{
                  position: 'sticky',
                  top: '-16px',
                  zIndex: 35,
                  background: 'var(--bg-primary, #0f172a)',
                  padding: '12px 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  boxShadow: '0 6px 14px -6px rgba(0,0,0,0.12)'
                }}>
                  {/* Button 1: Add Row */}
                  <button
                    onClick={() => {
                      const newIndex = sheetRows.length;
                      const nextId = String(newIndex + 1);
                      setSheetRows(prev => [
                        ...prev,
                        { id: `${Date.now()}_${nextId}`, data: '', filename: `Item-${nextId.padStart(3, '0')}` }
                      ]);
                      setTimeout(() => {
                        const nextDataInput = document.querySelector(`input[data-row-data="${newIndex}"]`);
                        if (nextDataInput) nextDataInput.focus();
                      }, 50);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '11px 10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Plus size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} /> <span>Add Row</span>
                  </button>

                  {/* Button 2: Clear Table */}
                  <button
                    onClick={() => {
                      setSheetRows([
                        { id: '1', data: '', filename: 'Item-001' }
                      ]);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '11px 10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Trash2 size={14} color="#EF4444" style={{ flexShrink: 0 }} /> <span>Clear Table</span>
                  </button>

                  {/* Button 3: Import Entries */}
                  <button
                    onClick={() => {
                      const validRows = sheetRows.filter(r => r.data && r.data.trim().length > 0);
                      if (validRows.length === 0) {
                        alert('Please fill at least one row with data.');
                        return;
                      }

                      const defaultStyle = batchType === 'BARCODE' ? {
                        bcid: barcodeType || 'code128',
                        barColor: '#000000',
                        bgColor: '#ffffff',
                        barWidth: 2,
                        height: 90,
                        margin: 16,
                        displayValue: true
                      } : { ...activeGeneratorStyle };

                      const newItems = validRows.map((r, i) => ({
                        id: `sheet_${Date.now()}_${i}`,
                        type: batchType,
                        data: r.data.trim(),
                        filename: r.filename.trim() || `item_${i + 1}`,
                        style: defaultStyle
                      }));

                      setBatchItems(newItems);
                    }}
                    style={{
                      flex: 1.3,
                      minWidth: 0,
                      padding: '11px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'var(--accent-gradient, linear-gradient(135deg, #D60036, #FF3B62))',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Play size={14} style={{ flexShrink: 0 }} /> <span>Import ({sheetRows.filter(r => r.data && r.data.trim().length > 0).length})</span>
                  </button>
                </div>

                {/* Spreadsheet Table */}
                <div 
                  onPaste={(e) => {
                    const clipboardText = e.clipboardData.getData('text');
                    if (!clipboardText || (!clipboardText.includes('\n') && !clipboardText.includes('\t') && !clipboardText.includes(','))) {
                      return;
                    }
                    e.preventDefault();
                    
                    const lines = clipboardText.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
                    if (lines.length === 0) return;

                    const newRows = lines.map((line, idx) => {
                      let col1 = '';
                      let col2 = '';
                      if (line.includes('\t')) {
                        const parts = line.split('\t');
                        col1 = parts[0]?.trim() || '';
                        col2 = parts[1]?.trim() || '';
                      } else if (line.includes(',')) {
                        const parts = line.split(',');
                        col1 = parts[0]?.trim() || '';
                        col2 = parts[1]?.trim() || '';
                      } else {
                        col1 = line.trim();
                      }

                      const rowNum = sheetRows.length + idx + 1;
                      return {
                        id: `paste_${Date.now()}_${idx}`,
                        data: col1,
                        filename: col2 || `Item-${String(rowNum).padStart(3, '0')}`
                      };
                    });

                    // Replace if all current rows are empty, else append
                    const isAllEmpty = sheetRows.every(r => !r.data || r.data.trim().length === 0);
                    if (isAllEmpty) {
                      setSheetRows(newRows);
                    } else {
                      setSheetRows(prev => [...prev, ...newRows]);
                    }
                  }}
                  style={{ 
                    overflowX: 'auto', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '14px', 
                    background: 'var(--bg-elevated)',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', tableLayout: 'auto' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px 8px', width: '38px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>No</th>
                        <th style={{ padding: '10px 10px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px' }}>Data</th>
                        <th style={{ padding: '10px 10px', color: 'var(--text-primary)', fontWeight: 700, width: '130px', fontSize: '13px' }}>Filename</th>
                        <th style={{ padding: '10px 6px', width: '38px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetRows.map((row, index) => (
                        <tr key={row.id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 6px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', fontSize: '12px' }}>{index + 1}</td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="text"
                              data-row-data={index}
                              value={row.data}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSheetRows(prev => prev.map((r, i) => i === index ? { ...r, data: val } : r));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextFilenameInput = document.querySelector(`input[data-row-filename="${index}"]`);
                                  if (nextFilenameInput) nextFilenameInput.focus();
                                }
                              }}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text');
                                if (pasted && (pasted.includes('\n') || pasted.includes('\t') || (pasted.includes(',') && pasted.includes('\n')))) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const lines = pasted.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
                                  if (lines.length > 0) {
                                    const parsedRows = lines.map((l, i) => {
                                      const parts = l.includes('\t') ? l.split('\t') : l.split(',');
                                      return {
                                        id: `paste_inp_${Date.now()}_${i}`,
                                        data: parts[0]?.trim() || l.trim(),
                                        filename: parts[1]?.trim() || `Item-${String(index + i + 1).padStart(3, '0')}`
                                      };
                                    });

                                    setSheetRows(prev => {
                                      const before = prev.slice(0, index);
                                      const after = prev.slice(index + 1);
                                      return [...before, ...parsedRows, ...after];
                                    });
                                  }
                                }
                              }}
                              placeholder={batchType === 'BARCODE' ? '7501031311309' : 'https://example.com'}
                              style={{
                                width: '100%',
                                background: 'var(--bg-primary, rgba(255,255,255,0.03))',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '13px',
                                minHeight: '38px',
                                fontWeight: 500,
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent-primary)';
                                e.target.style.background = 'var(--bg-elevated)';
                                e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-color)';
                                e.target.style.background = 'var(--bg-primary, rgba(255,255,255,0.03))';
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input
                              type="text"
                              data-row-filename={index}
                              value={row.filename}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSheetRows(prev => prev.map((r, i) => i === index ? { ...r, filename: val } : r));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (index < sheetRows.length - 1) {
                                    const nextDataInput = document.querySelector(`input[data-row-data="${index + 1}"]`);
                                    if (nextDataInput) nextDataInput.focus();
                                  } else {
                                    // Add a new row and focus its data input
                                    const newIndex = sheetRows.length;
                                    const nextId = String(newIndex + 1);
                                    setSheetRows(prev => [
                                      ...prev,
                                      { id: `${Date.now()}_${nextId}`, data: '', filename: `Item-${nextId.padStart(3, '0')}` }
                                    ]);
                                    setTimeout(() => {
                                      const nextDataInput = document.querySelector(`input[data-row-data="${newIndex}"]`);
                                      if (nextDataInput) nextDataInput.focus();
                                    }, 50);
                                  }
                                }
                              }}
                              placeholder={`Item-${index + 1}`}
                              style={{
                                width: '100%',
                                background: 'var(--bg-primary, rgba(255,255,255,0.03))',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '13px',
                                minHeight: '38px',
                                fontWeight: 500,
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent-primary)';
                                e.target.style.background = 'var(--bg-elevated)';
                                e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-color)';
                                e.target.style.background = 'var(--bg-primary, rgba(255,255,255,0.03))';
                              }}
                            />
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (sheetRows.length > 1) {
                                  setSheetRows(prev => prev.filter((_, i) => i !== index));
                                }
                              }}
                              disabled={sheetRows.length <= 1}
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: 'none',
                                color: sheetRows.length <= 1 ? 'var(--text-muted)' : '#EF4444',
                                cursor: sheetRows.length <= 1 ? 'default' : 'pointer',
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              title="Delete row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Columns Mapping */}
        {fileData && (
          <div className="glass-panel" style={{ borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} className="text-accent" /> Column Mapping
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="hasHeader" 
                checked={hasHeader} 
                onChange={(e) => setHasHeader(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="hasHeader" style={{ fontSize: '14px', fontWeight: 500 }}>First row contains headers</label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  Select {batchType === 'BARCODE' ? 'Barcode' : 'QR'} Data Column
                </label>
                <select 
                  className="form-select" 
                  value={dataCol} 
                  onChange={(e) => setDataCol(e.target.value)}
                >
                  {columns.map(col => (
                    <option key={col.index} value={col.index}>{col.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Filename Column (Optional)</label>
                <select 
                  className="form-select" 
                  value={nameCol} 
                  onChange={(e) => setNameCol(e.target.value)}
                >
                  <option value="none">-- Autogenerate Filenames --</option>
                  {columns.map(col => (
                    <option key={col.index} value={col.index}>{col.label}</option>
                  ))}
                </select>
              </div>

              {batchType === 'BARCODE' && (
                <div className="form-group">
                  <label className="form-label">Select Barcode Type</label>
                  <select 
                    className="form-select" 
                    value={barcodeType} 
                    onChange={(e) => setBarcodeType(e.target.value)}
                  >
                    {Object.entries(BARCODE_STANDARDS).map(([key, std]) => (
                      <option key={key} value={key}>{std.name} ({std.desc})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              {isProcessing ? (
                <div style={{
                  flex: 1,
                  height: '48px',
                  background: 'var(--bg-hover)',
                  borderRadius: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${processingProgress}%`,
                    background: 'var(--accent-gradient)',
                    transition: 'width 0.1s ease-out'
                  }} />
                  <span style={{
                    position: 'relative',
                    zIndex: 1,
                    fontWeight: 700,
                    fontSize: '13px',
                    color: processingProgress > 50 ? '#FFFFFF' : 'var(--text-primary)'
                  }}>
                    Importing Entries... {processingProgress}%
                  </span>
                </div>
              ) : (
                <button 
                  onClick={handleImport}
                  style={{
                    flex: 1,
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Import Entries
                </button>
              )}
              <button 
                onClick={() => setFileData(null)}
                disabled={isProcessing}
                style={{
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Batch List and Export */}
        {batchItems.length > 0 && !fileData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Batch Summary</span>
                <span style={{ fontSize: '13px', background: 'rgba(214, 0, 54, 0.1)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {batchItems.length} {batchType === 'BARCODE' ? 'Barcodes' : 'QR Codes'}
                </span>
              </div>

              {/* Design Style Preview Card */}
              {batchType === 'QR' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '12px 16px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    <BatchThumbnail type="QR" data={batchItems[0]?.data || "Preview"} style={batchItems[0]?.style || activeGeneratorStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Bulk QR Style Template</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click edit to customize the style of all QRs</div>
                  </div>
                  <button
                    onClick={() => onEditBatchItemStyle(batchItems[0], 0, batchType)}
                    title="Customize batch design"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(214, 0, 54, 0.2)'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}

              {batchType === 'BARCODE' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '12px 16px'
                }}>
                  <div style={{
                    width: '70px',
                    height: '44px',
                    borderRadius: '8px',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    <BatchThumbnail type="BARCODE" data={batchItems[0]?.data || "12345678"} style={batchItems[0]?.style} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Bulk Barcode Format</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Using standard: {BARCODE_STANDARDS[batchItems[0]?.style?.bcid || 'code128']?.name || 'Code 128'}
                    </div>
                  </div>
                  <button
                    onClick={() => onEditBatchItemStyle(batchItems[0], 0, batchType)}
                    title="Customize barcode format"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(214, 0, 54, 0.2)'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {batchType === 'QR' && (
                  <button 
                    onClick={applyGlobalStyle}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <RefreshCw size={16} /> Apply Active Editor Style
                  </button>
                )}
                
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    flex: batchType === 'BARCODE' ? 1 : '0 0 auto',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    color: '#EF4444'
                  }}
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Export Format Section */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Export Format</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { label: 'PNG', featId: 'bulk_export_png', Icon: FileImage },
                      { label: 'SVG', featId: 'bulk_export_svg', Icon: FileCode },
                      { label: 'PDF', featId: 'bulk_export_pdf', Icon: FileText },
                      { label: 'JPG', featId: 'bulk_export_png', Icon: FileImage },
                    ].map(({ label, featId, Icon }) => (
                      <button
                        key={label}
                        onClick={(e) => {
                          e.stopPropagation();
                          const access = FeatureAccessManager.canUseFeature(featId);
                          if (!access.allowed) {
                            showPaywall(featId);
                            return;
                          }
                          setSelectedFormat(label);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          aspectRatio: '1 / 1',
                          padding: '0',
                          background: selectedFormat === label ? 'var(--accent-soft)' : 'var(--bg-hover)',
                          border: '1px solid',
                          borderColor: selectedFormat === label ? 'var(--accent-primary)' : 'transparent',
                          borderRadius: '12px',
                          color: selectedFormat === label ? 'var(--accent-primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s'
                        }}
                      >
                        <PaidCrownBadge featureId={featId} position="floating" size={8} />
                        <Icon size={18} />
                        <span style={{ fontSize: '10px', fontWeight: 700 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Quality */}
                {batchType === 'QR' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Export Quality</div>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        color: 'var(--accent-primary)',
                        background: 'var(--accent-soft)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(214, 0, 54, 0.15)',
                        letterSpacing: '0.5px'
                      }}>
                        {exportQuality === 'Low' ? '512px' : exportQuality === 'Normal' ? '1024px' : exportQuality === 'HD' ? '2048px' : '4096px'}
                      </span>
                    </div>
                    <div style={{ padding: '0 8px', marginTop: '12px', marginBottom: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={['Low', 'Normal', 'HD', 'HQ'].indexOf(exportQuality)}
                        onChange={(e) => {
                          const steps = ['Low', 'Normal', 'HD', 'HQ'];
                          const selected = steps[parseInt(e.target.value)] || 'Normal';
                          if (selected === 'HD' || selected === 'HQ') {
                            const access = FeatureAccessManager.canUseFeature('bulk_export_quality');
                            if (!access.allowed) {
                              showPaywall('bulk_export_quality');
                              return;
                            }
                          }
                          setExportQuality(selected);
                        }}
                        className="export-quality-slider"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        <span>Low</span>
                        <span>Normal</span>
                        <span style={{ position: 'relative' }}>
                          HD <PaidCrownBadge featureId="bulk_export_quality" position="floating" size={7} />
                        </span>
                        <span style={{ position: 'relative' }}>
                          4K <PaidCrownBadge featureId="bulk_export_quality" position="floating" size={7} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ZIP Filename Input */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Custom Archive Name (Optional)</div>
                  <input
                    type="text"
                    placeholder={`mushi-${batchType.toLowerCase()}-batch`}
                    value={customZipFileName}
                    onChange={(e) => setCustomZipFileName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color, rgba(0,0,0,0.12))',
                      background: 'var(--bg-hover, rgba(0,0,0,0.03))',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                {isExporting ? (
                  <div style={{
                    width: '100%',
                    height: '48px',
                    background: 'var(--bg-hover)',
                    borderRadius: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    marginTop: '10px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${exportProgress}%`,
                      background: 'var(--accent-gradient)',
                      transition: 'width 0.1s ease-out'
                    }} />
                    <span style={{
                      position: 'relative',
                      zIndex: 1,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: exportProgress > 50 ? '#FFFFFF' : 'var(--text-primary)'
                    }}>
                      Exporting Batch... {exportProgress}%
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      const access = FeatureAccessManager.canUseFeature('batch_zip_export');
                      if (!access.allowed) {
                        showPaywall('batch_zip_export');
                        return;
                      }
                      generateZip();
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '14px',
                      color: 'white',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(214, 0, 54, 0.25)',
                      marginTop: '10px',
                      position: 'relative'
                    }}
                  >
                    <PaidCrownBadge featureId="batch_zip_export" position="floating" size={10} />
                    <Download size={20} />
                    Generate & Download {selectedFormat} ZIP
                  </button>
                )}
              </div>
            </div>

            {/* Batch List Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 4px 0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                  Item Preview List ({batchItems.length})
                </h4>
                {batchItems.length > 50 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Showing first {Math.min(previewLimit, batchItems.length)} items
                  </span>
                )}
              </div>

              {batchItems.slice(0, previewLimit).map((item, idx) => (
                <div 
                  key={item.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{
                    width: batchType === 'BARCODE' ? '80px' : '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                    padding: '4px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    <BatchThumbnail type={batchType} data={item.data} style={item.style} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.filename}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.data}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {batchType === 'QR' && (
                      <button 
                        onClick={() => onEditBatchItemStyle(item, idx)}
                        title="Edit QR style in generator"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove item"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border-color)',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {batchItems.length > previewLimit && (
                <button
                  onClick={() => setPreviewLimit(prev => prev + 50)}
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Load Next 50 Previews (Remaining: {batchItems.length - previewLimit})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 1. Clear All Confirmation Modal ── */}
      {showClearConfirm && (
        <div 
          onClick={() => setShowClearConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(9, 9, 15, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated, #0C0C14)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '24px',
              padding: '28px 24px',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Clear Batch Entries?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove all <strong style={{ color: 'var(--text-primary)' }}>{batchItems.length}</strong> items from this batch? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBatchItems([]);
                  setShowClearConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 0. Active Batch Export Progress Modal ── */}
      {isExporting && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(9, 9, 15, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              background: 'var(--bg-elevated, #0C0C14)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: '24px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(214, 0, 54, 0.12)',
              color: 'var(--accent-primary, #D60036)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              border: '1px solid rgba(214, 0, 54, 0.25)'
            }}>
              <RefreshCw size={28} className="animate-spin" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Generating Bulk Package
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Rendering {batchItems.length} codes & packaging files into ZIP archive...
            </p>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '10px',
              borderRadius: '999px',
              background: 'var(--bg-hover, rgba(255,255,255,0.08))',
              overflow: 'hidden',
              marginBottom: '12px',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${exportProgress}%`,
                background: 'var(--accent-gradient, linear-gradient(135deg, #D60036, #FF3B62))',
                borderRadius: '999px',
                transition: 'width 0.15s ease-out'
              }} />
            </div>

            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary, #D60036)', fontFamily: 'monospace' }}>
              {exportProgress}% Completed
            </span>

            {/* Cancel Button */}
            <button
              onClick={() => {
                isCancelledRef.current = true;
                setIsExporting(false);
                setExportProgress(0);
              }}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={16} /> Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Export Success Modal Box ── */}
      {exportSuccessInfo && (
        <div 
          onClick={() => setExportSuccessInfo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(9, 9, 15, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated, #0C0C14)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '24px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Export Complete! 🎉
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {exportSuccessInfo.isNative
                ? `Your batch ZIP file containing ${exportSuccessInfo.count} items has been saved to your device's Documents folder:`
                : `Your batch ZIP file containing ${exportSuccessInfo.count} items has been generated and downloaded:`
              }
            </p>

            <div style={{
              width: '100%',
              background: 'var(--bg-hover, rgba(255,255,255,0.05))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
              boxSizing: 'border-box'
            }}>
              <FileArchive size={20} color="var(--accent-primary, #D60036)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                {exportSuccessInfo.filename}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setExportSuccessInfo(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
              {exportSuccessInfo.isNative && exportSuccessInfo.fileUri && (
                <button
                  onClick={async () => {
                    try {
                      await Share.share({
                        title: 'Mushi QR Pro - Bulk Export',
                        text: `Bulk exported ${exportSuccessInfo.filename}`,
                        url: exportSuccessInfo.fileUri,
                        dialogTitle: 'Save or Share your Bulk ZIP File',
                      });
                    } catch (e) {}
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'var(--accent-gradient, linear-gradient(135deg, #D60036, #FF3B62))',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(214, 0, 54, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Share2 size={18} /> Share
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        itemTitle={deleteModalConfig.itemTitle}
        confirmText={deleteModalConfig.confirmText}
        iconType={deleteModalConfig.iconType}
        isDangerous={deleteModalConfig.isDangerous}
      />
    </div>
  );
}

function BatchThumbnail({ type, data, style }) {
  const canvasRef = useRef(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState(null);
  const safeStyle = style || {};

  useEffect(() => {
    if (type !== 'BARCODE' && safeStyle.logo && safeStyle.logo.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLoadedLogoImg(img);
      };
      img.src = safeStyle.logo.src;
    } else {
      setLoadedLogoImg(null);
    }
  }, [safeStyle.logo?.src, type]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (type === 'BARCODE') {
      // Clear canvas before drawing
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      renderBarcode(canvasRef.current, data, {
        bcid: safeStyle.bcid || 'code128',
        barColor: safeStyle.barColor || '#000000',
        bgColor: safeStyle.bgColor || '#ffffff',
        barWidth: 1.5,
        height: 40,
        margin: 8,
        displayValue: false
      });
    } else {
      const matrixInfo = generateQRMatrix(data, safeStyle.errorCorrection || 'H');
      renderQR(canvasRef.current, {
        ...matrixInfo,
        size: 100,
        ...safeStyle,
        logo: safeStyle.logo && safeStyle.logo.src ? loadedLogoImg : null,
        textCenter: safeStyle.textCenterEnabled ? safeStyle.textCenterText : null,
        showHandle: false,
        selectedType: null
      });
    }
  }, [data, safeStyle, loadedLogoImg, type]);

  return (
    <canvas 
      ref={canvasRef} 
      width={type === 'BARCODE' ? '180' : '100'} 
      height="100" 
      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
    />
  );
}
