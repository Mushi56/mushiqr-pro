import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Save, Palette, Sliders, Undo2, Redo2, ChevronDown,
  FileImage, FileCode, FileText, Copy, Bookmark, Share2,
  Menu, Home, History as HistoryIcon, Moon, Sun, Info, Shield,
  FileText as FileIcon, AlertCircle, Layers, Pencil, Barcode, Pipette,
  Check, X, Crown, Scan, CheckCircle2, Printer, Sparkles, FolderDown
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { renderBarcode, renderBarcodeSVG, BARCODE_STANDARDS } from '../utils/barcodeEngine';
import { BARCODE_SPECS, validateBarcodeChecksum, calculateEAN13CheckDigit, calculateUPCACheckDigit } from '../utils/barcodeStandardsExtended';
import { saveToSaved, saveToHistory } from '../utils/storage';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { downloadPNG, downloadSVG, downloadPDF, downloadJPG } from '../utils/exportUtils';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import AppIcon from './AppIcon';
import AdvancedColorPicker from './AdvancedColorPicker';
import BarcodeDataModal from './BarcodeDataModal';
import PaidCrownBadge from './PaidCrownBadge';
import { usePremium } from '../services/premiumContext';

// Modular Subcomponents
import BarcodeFormatSelector from './barcode/BarcodeFormatSelector';
import BarcodePreviewCard from './barcode/BarcodePreviewCard';
import BarcodeColorsTab from './barcode/BarcodeColorsTab';
import BarcodeDimensionsTab from './barcode/BarcodeDimensionsTab';
import BarcodeStyleTab from './barcode/BarcodeStyleTab';
import BarcodeQualityModal from './barcode/BarcodeQualityModal';
import BarcodeInfoModal from './barcode/BarcodeInfoModal';
import BarcodeLabelModal from './barcode/BarcodeLabelModal';
import BarcodeTestScanModal from './barcode/BarcodeTestScanModal';
import BarcodeHistoryModal from './barcode/BarcodeHistoryModal';

// ─── Helpers for Barcode Data Modal ─────────────────────────────────────────
function parseValueToFields(val, type) {
  const digits = (val || '').replace(/\D/g, '');
  switch (type) {
    case 'ean13': return { countryPrefix: digits.slice(0, 3), manufacturer: digits.slice(3, 8), productCode: digits.slice(8, 12) };
    case 'upca': return { numberSystem: digits.slice(0, 1) || '0', manufacturer: digits.slice(1, 6), productCode: digits.slice(6, 11) };
    case 'ean8': return { countryPrefix: digits.slice(0, 3), productCode: digits.slice(3, 7) };
    case 'itf14': return { indicator: digits.slice(0, 1) || '1', gs1Prefix: digits.slice(1, 7), itemRef: digits.slice(7, 13) };
    case 'upce': return { numberSystem: digits.slice(0, 1) || '0', body: digits.slice(1, 7) };
    case 'codabar': {
      const hasStart = /^[A-D]/i.test(val || '');
      const hasStop = /[A-D]$/i.test(val || '');
      return {
        start: hasStart ? (val || '').slice(0, 1).toUpperCase() : 'A',
        body: (val || '').slice(hasStart ? 1 : 0, hasStop ? -1 : undefined) || '',
        stop: hasStop ? (val || '').slice(-1).toUpperCase() : 'B'
      };
    }
    case 'postnet': return { format: digits.length <= 5 ? '5' : digits.length <= 9 ? '9' : '11', data: digits };
    case 'planet': return { format: digits.length <= 11 ? '11' : digits.length <= 12 ? '12' : digits.length <= 13 ? '13' : '14', data: digits };
    default: return { data: val || '' };
  }
}

export default function BarcodePage({
  onNavigate,
  showToast,
  loadedBarcodeItem,
  setLoadedBarcodeItem,
  theme,
  setTheme,
  effectiveTheme,
  activeBatchItemIndex,
  batchItems,
  setBatchItems,
  setActiveBatchItemIndex
}) {
  const { showPaywall } = usePremium();
  const [, setFamTick] = useState(0);

  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => setFamTick(t => t + 1));
    return () => unsub?.();
  }, []);

  const access = FeatureAccessManager.canUseFeature('barcode_generator');

  useEffect(() => {
    if (!access.allowed && access.status !== 'disabled_by_admin') {
      showPaywall('barcode_generator');
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
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Barcode Generator Unavailable</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 440, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Barcode Generator has been disabled globally by the Administrator.
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
              Barcode Generator is a Pro feature. Upgrade your subscription plan to create and customize all industrial and retail barcode standards.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => showPaywall('barcode_generator')}
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

  // ─── Core Barcode State ───────────────────────────────────────────────────
  const [bcid, setBcid] = useState(() => {
    if (loadedBarcodeItem) return loadedBarcodeItem.style?.bcid || 'ean13';
    return 'ean13';
  });
  const initialStandard = BARCODE_STANDARDS[loadedBarcodeItem?.style?.bcid || 'ean13'] || BARCODE_STANDARDS.ean13;

  const [text, setText] = useState(() => {
    if (loadedBarcodeItem) return loadedBarcodeItem.displayText || loadedBarcodeItem.qrData?.text || initialStandard.defaultValue;
    return initialStandard.defaultValue;
  });
  const [barColor, setBarColor] = useState(() => {
    if (loadedBarcodeItem) return loadedBarcodeItem.style?.barColor || '#000000';
    return '#000000';
  });
  const [bgColor, setBgColor] = useState(() => {
    if (loadedBarcodeItem) return loadedBarcodeItem.style?.bgColor || '#FFFFFF';
    return '#FFFFFF';
  });
  const [isTransparentBg, setIsTransparentBg] = useState(() => {
    return loadedBarcodeItem?.style?.bgColor === 'transparent';
  });

  const [barWidth, setBarWidth] = useState(() => {
    if (loadedBarcodeItem?.style?.barWidth !== undefined) return loadedBarcodeItem.style.barWidth;
    return initialStandard.defaultBarWidth !== undefined ? initialStandard.defaultBarWidth : 2;
  });
  const [height, setHeight] = useState(() => {
    if (loadedBarcodeItem?.style?.height !== undefined) return loadedBarcodeItem.style.height;
    return initialStandard.defaultHeight !== undefined ? initialStandard.defaultHeight : 85;
  });
  const [margin, setMargin] = useState(() => {
    if (loadedBarcodeItem?.style?.margin !== undefined) return loadedBarcodeItem.style.margin;
    return initialStandard.defaultMargin !== undefined ? initialStandard.defaultMargin : 16;
  });
  const [displayValue, setDisplayValue] = useState(() => {
    if (loadedBarcodeItem?.style?.displayValue !== undefined) return loadedBarcodeItem.style.displayValue;
    return initialStandard.defaultDisplayValue !== undefined ? initialStandard.defaultDisplayValue : true;
  });

  // Style properties
  const [textPosition, setTextPosition] = useState(() => loadedBarcodeItem?.style?.textPosition || 'below');
  const [textAlign, setTextAlign] = useState(() => loadedBarcodeItem?.style?.textAlign || 'center');
  const [textFont, setTextFont] = useState(() => loadedBarcodeItem?.style?.textFont || 'ocrb');
  const [hasBorder, setHasBorder] = useState(() => !!loadedBarcodeItem?.style?.hasBorder);
  const [borderWidth, setBorderWidth] = useState(() => loadedBarcodeItem?.style?.borderWidth || 2);
  const [autoCheckDigit, setAutoCheckDigit] = useState(true);

  // Active Bottom Tab: 'content' (BARCODE) | 'color' (COLORS) | 'size' (DIMENSIONS) | 'style' (STYLE)
  const [activeTab, setActiveTab] = useState('content');

  // UI Modals
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isTestScanOpen, setIsTestScanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [advPicker, setAdvPicker] = useState({ open: false, color: '#000000', type: 'bar' });
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [modalInitialFields, setModalInitialFields] = useState({});
  const [pendingBcid, setPendingBcid] = useState(null);

  // Header menus
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('PNG');
  const [exportQuality, setExportQuality] = useState('Medium');

  // Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoActionRef = useRef(false);

  const canvasRef = useRef(null);

  const currentStandard = BARCODE_STANDARDS[bcid] || BARCODE_STANDARDS.code128;
  const spec = BARCODE_SPECS[bcid] || {};
  const isDataValid = currentStandard.validate(text);

  // Click outside handling for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isMenuOpen && !e.target.closest('.btn-menu-toggle') && !e.target.closest('.app-dropdown-menu')) {
        setIsMenuOpen(false);
      }
      if (formatDropdownOpen && !e.target.closest('.save-split-header-btn') && !e.target.closest('.save-as-dropdown')) {
        setFormatDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMenuOpen, formatDropdownOpen]);

  // Init history
  useEffect(() => {
    const initial = {
      text, bcid, barColor, bgColor, isTransparentBg, barWidth, height, margin,
      displayValue, textPosition, textAlign, textFont, hasBorder, borderWidth
    };
    historyRef.current = [initial];
    historyIndexRef.current = 0;
    setHistory([initial]);
    setHistoryIndex(0);
  }, []);

  const getSnapshot = () => ({
    text, bcid, barColor, bgColor, isTransparentBg, barWidth, height, margin,
    displayValue, textPosition, textAlign, textFont, hasBorder, borderWidth
  });

  const updateStateAndHistory = (updates) => {
    const cur = {
      text, bcid, barColor, bgColor, isTransparentBg, barWidth, height, margin,
      displayValue, textPosition, textAlign, textFont, hasBorder, borderWidth
    };
    const newState = { ...cur, ...updates };

    if (updates.text !== undefined) setText(updates.text);
    if (updates.bcid !== undefined) setBcid(updates.bcid);
    if (updates.barColor !== undefined) setBarColor(updates.barColor);
    if (updates.bgColor !== undefined) setBgColor(updates.bgColor);
    if (updates.isTransparentBg !== undefined) setIsTransparentBg(updates.isTransparentBg);
    if (updates.barWidth !== undefined) setBarWidth(updates.barWidth);
    if (updates.height !== undefined) setHeight(updates.height);
    if (updates.margin !== undefined) setMargin(updates.margin);
    if (updates.displayValue !== undefined) setDisplayValue(updates.displayValue);
    if (updates.textPosition !== undefined) setTextPosition(updates.textPosition);
    if (updates.textAlign !== undefined) setTextAlign(updates.textAlign);
    if (updates.textFont !== undefined) setTextFont(updates.textFont);
    if (updates.hasBorder !== undefined) setHasBorder(updates.hasBorder);
    if (updates.borderWidth !== undefined) setBorderWidth(updates.borderWidth);

    if (isUndoRedoActionRef.current) return;

    const prevIdx = historyIndexRef.current;
    if (prevIdx >= 0 && historyRef.current[prevIdx]) {
      if (JSON.stringify(historyRef.current[prevIdx]) === JSON.stringify(newState)) return;
    }

    const cleaned = historyRef.current.slice(0, prevIdx + 1);
    cleaned.push(newState);
    if (cleaned.length > 50) cleaned.shift();

    const newIdx = cleaned.length - 1;
    historyRef.current = cleaned;
    historyIndexRef.current = newIdx;
    setHistory(cleaned);
    setHistoryIndex(newIdx);
  };

  const undo = () => {
    const currIdx = historyIndexRef.current;
    if (currIdx > 0) {
      isUndoRedoActionRef.current = true;
      const idx = currIdx - 1;
      const s = historyRef.current[idx];
      if (!s) return;
      historyIndexRef.current = idx;
      setHistoryIndex(idx);
      setText(s.text); setBcid(s.bcid || 'ean13'); setBarColor(s.barColor);
      setBgColor(s.bgColor); setIsTransparentBg(s.isTransparentBg || false);
      setBarWidth(s.barWidth); setHeight(s.height); setMargin(s.margin);
      setDisplayValue(s.displayValue); setTextPosition(s.textPosition || 'below');
      setTextAlign(s.textAlign || 'center'); setTextFont(s.textFont || 'ocrb');
      setHasBorder(s.hasBorder || false); setBorderWidth(s.borderWidth || 2);
      setTimeout(() => { isUndoRedoActionRef.current = false; }, 150);
    }
  };

  const redo = () => {
    const currIdx = historyIndexRef.current;
    if (currIdx < historyRef.current.length - 1) {
      isUndoRedoActionRef.current = true;
      const idx = currIdx + 1;
      const s = historyRef.current[idx];
      if (!s) return;
      historyIndexRef.current = idx;
      setHistoryIndex(idx);
      setText(s.text); setBcid(s.bcid || 'ean13'); setBarColor(s.barColor);
      setBgColor(s.bgColor); setIsTransparentBg(s.isTransparentBg || false);
      setBarWidth(s.barWidth); setHeight(s.height); setMargin(s.margin);
      setDisplayValue(s.displayValue); setTextPosition(s.textPosition || 'below');
      setTextAlign(s.textAlign || 'center'); setTextFont(s.textFont || 'ocrb');
      setHasBorder(s.hasBorder || false); setBorderWidth(s.borderWidth || 2);
      setTimeout(() => { isUndoRedoActionRef.current = false; }, 150);
    }
  };

  // Render barcode whenever attributes change
  useEffect(() => {
    if (!canvasRef.current) return;
    renderBarcode(canvasRef.current, text, {
      bcid,
      barColor,
      bgColor: isTransparentBg ? 'transparent' : bgColor,
      barWidth,
      height,
      margin,
      displayValue,
      textPosition,
      textAlign,
      textFont
    });
  }, [text, bcid, barColor, bgColor, isTransparentBg, barWidth, height, margin, displayValue, textPosition, textAlign, textFont]);

  // Load from external navigation (History or Home)
  useEffect(() => {
    if (loadedBarcodeItem) {
      const val = loadedBarcodeItem.displayText || loadedBarcodeItem.qrData?.text || '';
      const s = loadedBarcodeItem.style || {};
      const targetBcid = s.bcid || 'ean13';
      const std = BARCODE_STANDARDS[targetBcid] || BARCODE_STANDARDS.ean13;

      if (val) setText(val);
      if (s.bcid) setBcid(s.bcid);
      if (s.barColor) setBarColor(s.barColor);
      if (s.bgColor) {
        setBgColor(s.bgColor);
        setIsTransparentBg(s.bgColor === 'transparent');
      }
      setBarWidth(s.barWidth !== undefined ? s.barWidth : (std.defaultBarWidth || 2));
      setHeight(s.height !== undefined ? s.height : (std.defaultHeight || 85));
      setMargin(s.margin !== undefined ? s.margin : (std.defaultMargin || 16));
      setDisplayValue(s.displayValue !== undefined ? s.displayValue : true);
      if (s.textPosition) setTextPosition(s.textPosition);
      if (s.textAlign) setTextAlign(s.textAlign);
      if (s.textFont) setTextFont(s.textFont);

      setLoadedBarcodeItem(null);
    }
  }, [loadedBarcodeItem, setLoadedBarcodeItem]);

  // Format selection handler
  const handleSelectFormat = (newBcid) => {
    const std = BARCODE_STANDARDS[newBcid] || BARCODE_STANDARDS.code128;
    updateStateAndHistory({
      bcid: newBcid,
      text: std.defaultValue,
      barWidth: std.defaultBarWidth !== undefined ? std.defaultBarWidth : 2,
      height: std.defaultHeight !== undefined ? std.defaultHeight : 85,
      margin: std.defaultMargin !== undefined ? std.defaultMargin : 16,
      displayValue: std.defaultDisplayValue !== undefined ? std.defaultDisplayValue : true
    });
  };

  // Duplicate & Edit action
  const handleDuplicateAndEdit = () => {
    const duplicateText = text ? `${text}` : currentStandard.defaultValue;
    // Open structured fields modal so user can edit right away
    const fields = parseValueToFields(duplicateText, bcid);
    setModalInitialFields(fields);
    setPendingBcid(bcid);
    setIsDataModalOpen(true);
    showToast('Duplicating configuration for edit', 'info');
  };

  // Save to Saved & History
  const handleSaveToArchive = () => {
    if (!isDataValid) {
      showToast(currentStandard.errorMsg, 'error');
      return;
    }
    try {
      const entry = {
        qrType: 'BARCODE',
        qrData: { text },
        displayText: text,
        thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.8),
        style: {
          bcid, barColor, bgColor: isTransparentBg ? 'transparent' : bgColor,
          barWidth, height, margin, displayValue, textPosition, textAlign, textFont, hasBorder, borderWidth
        }
      };
      saveToSaved(entry);
      saveToHistory(entry);
      showToast('Added to Saved Barcodes', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save barcode', 'error');
    }
  };

  // Export handlers
  const handleDownload = async (format) => {
    if (!canvasRef.current || !isDataValid) return;
    try {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `barcode_${bcid}_${text.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      const scaleMap = { 'Low': 1, 'Medium': 2, 'High': 3, 'Ultra': 4 };
      const scale = scaleMap[exportQuality] || 3;

      let result;
      if (format === 'SVG') {
        // True vector barcode export via bwipjs.toSVG
        const svgString = renderBarcodeSVG(text, {
          bcid,
          barColor,
          bgColor: isTransparentBg ? 'transparent' : bgColor,
          barWidth,
          height,
          margin,
          displayValue,
          textPosition,
          textAlign,
          textFont
        });
        result = await downloadSVG(svgString, filename, 'Barcodes');
      } else {
        const tempCanvas = document.createElement('canvas');
        renderBarcode(tempCanvas, text, {
          bcid,
          barColor,
          bgColor: isTransparentBg ? 'transparent' : bgColor,
          barWidth: barWidth * scale,
          height,
          margin: margin * scale,
          displayValue,
          textPosition,
          textAlign,
          textFont
        });

        if (format === 'PNG') result = await downloadPNG(tempCanvas, filename, 'Barcodes');
        else if (format === 'JPG') result = await downloadJPG(tempCanvas, filename, 'Barcodes');
        else if (format === 'PDF') result = await downloadPDF(tempCanvas, filename, 'Barcodes');
      }

      if (result === 'gallery') showToast('Saved to Gallery', 'success');
      else if (result === 'share') showToast('Share Sheet Opened', 'success');
      else showToast('Saved successfully', 'success');

      // Also record in history
      saveToHistory({
        qrType: 'BARCODE',
        qrData: { text },
        displayText: text,
        thumbnail: canvasRef.current.toDataURL('image/jpeg', 0.8),
        style: { bcid, barColor, bgColor, barWidth, height, margin, displayValue }
      });
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current || !isDataValid) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Copied barcode image to clipboard!', 'success');
      } catch {
        showToast('Failed to copy', 'error');
      }
    }, 'image/png');
  };

  const handleShare = async () => {
    if (!canvasRef.current || !isDataValid) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const fileName = `barcode_${Date.now()}.png`;
      const saved = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
      await Share.share({ title: `Barcode (${bcid.toUpperCase()})`, url: saved.uri, dialogTitle: 'Share Barcode' });
    } catch {
      handleDownload('PNG');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary, #FAFAFC)',
      position: 'relative'
    }}>
      {/* ── TOP APP BAR ── */}
      <header className="app-header" style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))',
        padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'var(--header-height, calc(56px + env(safe-area-inset-top, 0px)))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Left: App Logo & Undo/Redo Controls */}
        <div className="app-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <div onClick={() => onNavigate && onNavigate('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <AppIcon size={46} noBackground />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
            <button onClick={undo} disabled={historyIndex <= 0} title="Undo" style={undoRedoStyle(historyIndex <= 0)}>
              <Undo2 size={16} strokeWidth={2.5} />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" style={undoRedoStyle(historyIndex >= history.length - 1)}>
              <Redo2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Right Header Actions: Save/Export Split Button & Info/Menu */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          
          {activeBatchItemIndex !== null && activeBatchItemIndex !== undefined ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  const currentStyle = getSnapshot();
                  const updated = batchItems.map(item => ({
                    ...item,
                    style: currentStyle
                  }));
                  if (setBatchItems) setBatchItems(updated);
                  if (setActiveBatchItemIndex) setActiveBatchItemIndex(null);
                  if (onNavigate) onNavigate('batch', 'BARCODE');
                }}
                style={{
                  background: 'linear-gradient(135deg, #D6003D 0%, #FF2E63 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Apply to All
              </button>
              <button 
                onClick={() => {
                  if (batchItems && setBatchItems) {
                    const updated = [...batchItems];
                    updated[activeBatchItemIndex] = {
                      ...updated[activeBatchItemIndex],
                      style: getSnapshot()
                    };
                    setBatchItems(updated);
                  }
                  if (setActiveBatchItemIndex) setActiveBatchItemIndex(null);
                  if (onNavigate) onNavigate('batch', 'BARCODE');
                }}
                style={{
                  background: 'var(--bg-hover, #F2F2F7)',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                  color: 'var(--text-primary, #1C1C1E)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                This Only
              </button>
              <button 
                onClick={() => {
                  if (setActiveBatchItemIndex) setActiveBatchItemIndex(null);
                  if (onNavigate) onNavigate('batch', 'BARCODE');
                }}
                style={{
                  background: 'var(--bg-hover, rgba(0,0,0,0.04))',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                  color: 'var(--text-secondary, #8E8E93)',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
                title="Cancel"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
            <div
              className={`save-split-header-btn ${!isDataValid ? 'disabled' : ''} ${formatDropdownOpen ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #D6003D 0%, #FF2E63 100%)',
                borderRadius: 12,
                padding: '2px',
                boxShadow: '0 4px 14px rgba(214, 0, 61, 0.25)',
                height: 36,
                opacity: !isDataValid ? 0.5 : 1,
                pointerEvents: !isDataValid ? 'none' : 'auto'
              }}
            >
              <button
                onClick={() => handleDownload('PNG')}
                disabled={!isDataValid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0 10px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <Save size={15} color="#FFFFFF" />
                <span>Save</span>
              </button>

              <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.35)', flexShrink: 0 }} />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFormatDropdownOpen(!formatDropdownOpen);
                }}
                disabled={!isDataValid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0 8px',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <ChevronDown size={14} style={{ transform: formatDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>

            {/* Save & Export Dropdown Menu */}
            {formatDropdownOpen && isDataValid && (
              <div className="app-dropdown-menu save-as-dropdown fade-in" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 280,
                background: 'var(--bg-card, #FFFFFF)',
                borderRadius: 18,
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                zIndex: 200,
                padding: 12
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #8E8E93)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                  Export Format
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'PNG', featId: 'export_png', Icon: FileImage },
                    { label: 'SVG', featId: 'export_svg', Icon: FileCode },
                    { label: 'PDF', featId: 'export_pdf', Icon: FileText },
                    { label: 'JPG', featId: 'export_jpg', Icon: FileImage }
                  ].map(({ label, featId, Icon }) => (
                    <button
                      key={label}
                      onClick={(e) => {
                        e.stopPropagation();
                        const check = FeatureAccessManager.canUseFeature(featId);
                        if (!check.allowed) {
                          showPaywall(featId);
                          return;
                        }
                        setSelectedFormat(label);
                        setFormatDropdownOpen(false);
                        handleDownload(label);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        aspectRatio: '1 / 1',
                        padding: 0,
                        background: selectedFormat === label ? 'rgba(214, 0, 61, 0.08)' : 'var(--bg-hover, #F2F2F7)',
                        border: selectedFormat === label ? '1.5px solid var(--accent-primary, #D6003D)' : '1px solid transparent',
                        borderRadius: 12,
                        color: selectedFormat === label ? 'var(--accent-primary, #D6003D)' : 'var(--text-primary, #1C1C1E)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <PaidCrownBadge featureId={featId} position="floating" size={8} />
                      <Icon size={18} />
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.06))', margin: '12px 0' }} />

                {/* Transparent Background Option */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '2px 0'
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #8E8E93)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Transparent Background
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted, #8E8E93)', display: 'block', marginTop: 1 }}>
                      {isTransparentBg ? 'Exporting without white background' : 'White background included'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !isTransparentBg;
                      updateStateAndHistory({
                        isTransparentBg: next,
                        bgColor: next ? 'transparent' : '#FFFFFF'
                      });
                    }}
                    style={{
                      width: 44,
                      height: 26,
                      borderRadius: 16,
                      background: isTransparentBg ? 'var(--accent-primary, #D6003D)' : 'var(--bg-hover, #E5E5EA)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      padding: 2,
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transform: isTransparentBg ? 'translateX(18px)' : 'translateX(0px)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                <div style={{ height: 1, background: 'var(--border-color, rgba(0,0,0,0.06))', margin: '12px 0' }} />

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #8E8E93)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                  Quick Actions
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(); setFormatDropdownOpen(false); }}
                    style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer' }}
                    title="Copy Image"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveToArchive(); setFormatDropdownOpen(false); }}
                    style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer' }}
                    title="Bookmark to Saved"
                  >
                    <Bookmark size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(); setFormatDropdownOpen(false); }}
                    style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--border-color, rgba(0,0,0,0.08))', background: 'var(--bg-hover, #F2F2F7)', cursor: 'pointer' }}
                    title="Share Barcode"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Navigation Menu Toggle */}
          {!(activeBatchItemIndex !== null && activeBatchItemIndex !== undefined) && (
            <div style={{ position: 'relative' }}>
              <button
              className={`btn-menu-toggle ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                background: 'var(--bg-hover, rgba(0,0,0,0.04))',
                color: 'var(--text-secondary, #636366)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Menu size={18} />
            </button>
            {isMenuOpen && (
              <div className="app-dropdown-menu fade-in" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 180,
                background: 'var(--bg-card, #FFFFFF)',
                borderRadius: 16,
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                zIndex: 200,
                padding: 6
              }}>
                <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); onNavigate('home'); }}>
                  <Home size={15} /> Home
                </button>
                <button className="menu-link-btn" onClick={() => { setIsMenuOpen(false); setIsHistoryOpen(true); }}>
                  <HistoryIcon size={15} /> History
                </button>
                <button className="menu-link-btn" onClick={() => {
                  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark';
                  setTheme(next);
                }}>
                  {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                  Theme ({theme})
                </button>
              </div>
            )}
            </div>
          )}
        </div>
      </header>

      {/* ── HERO PREVIEW CARD ── */}
      <BarcodePreviewCard
        canvasRef={canvasRef}
        bcid={bcid}
        text={text}
        barColor={barColor}
        bgColor={bgColor}
        isDataValid={isDataValid}
        currentStandard={currentStandard}
        spec={spec}
        hasBorder={hasBorder}
        borderWidth={borderWidth}
      />

      {/* ── SECONDARY ACTION TOOLBAR CHIPS ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '10px 16px',
        overflowX: 'auto',
        background: 'var(--bg-primary, #FAFAFC)',
        borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.05))',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        flexShrink: 0
      }}>
        {/* Test Scan */}
        <button
          onClick={() => setIsTestScanOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            background: 'var(--bg-card, #FFFFFF)',
            color: 'var(--text-primary, #1C1C1E)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <Scan size={14} color="var(--accent-primary, #D6003D)" />
          <span>Test Scan</span>
        </button>

        {/* Barcode Quality */}
        <button
          onClick={() => setIsQualityModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            background: 'var(--bg-card, #FFFFFF)',
            color: 'var(--text-primary, #1C1C1E)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <Sparkles size={14} color="#FF9500" />
          <span>Quality Check</span>
        </button>

        {/* Print / Label Mode */}
        <button
          onClick={() => setIsLabelModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            background: 'var(--bg-card, #FFFFFF)',
            color: 'var(--text-primary, #1C1C1E)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <Printer size={14} color="var(--accent-primary, #D6003D)" />
          <span>Label Sheet</span>
        </button>




      </div>

      {/* ── SCROLLABLE BODY CONTENT ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 90px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* TAB 1: FORMAT SELECTION & CONTENT */}
          {activeTab === 'content' && (
            <BarcodeFormatSelector
              selectedBcid={bcid}
              onSelectFormat={handleSelectFormat}
              onOpenInfo={(targetId) => {
                setPendingBcid(targetId);
                setIsInfoModalOpen(true);
              }}
              onOpenDataModal={(targetId) => {
                const targetText = targetId === bcid ? text : '';
                const fields = parseValueToFields(targetText, targetId);
                setModalInitialFields(fields);
                setPendingBcid(targetId);
                setIsDataModalOpen(true);
              }}
              showPaywall={showPaywall}
            />
          )}

          {/* TAB 2: COLORS */}
          {activeTab === 'color' && (
            <BarcodeColorsTab
              barColor={barColor}
              bgColor={bgColor}
              isTransparentBg={isTransparentBg}
              onChangeColors={(updates) => updateStateAndHistory(updates)}
              onOpenAdvancedPicker={(type, c) => setAdvPicker({ open: true, color: c, type })}
            />
          )}

          {/* TAB 3: DIMENSIONS */}
          {activeTab === 'size' && (
            <BarcodeDimensionsTab
              bcid={bcid}
              currentStandard={currentStandard}
              spec={spec}
              barWidth={barWidth}
              height={height}
              margin={margin}
              onChangeDimensions={(updates) => updateStateAndHistory(updates)}
            />
          )}

          {/* TAB 4: STYLE */}
          {activeTab === 'style' && (
            <BarcodeStyleTab
              bcid={bcid}
              displayValue={displayValue}
              textPosition={textPosition}
              textAlign={textAlign}
              textFont={textFont}
              hasBorder={hasBorder}
              borderWidth={borderWidth}
              decorativeMargin={margin}
              onChangeStyle={(updates) => updateStateAndHistory(updates)}
            />
          )}
        </div>
      </div>

      {/* ── BOTTOM NAVIGATION (BARCODE, COLORS, DIMENSIONS, STYLE) ── */}
      <nav className="bottom-nav" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-card, #FFFFFF)',
        borderTop: '1px solid var(--border-color, rgba(0,0,0,0.06))',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.03)'
      }}>
        {[
          { id: 'content', label: 'BARCODE', Icon: Barcode },
          { id: 'color', label: 'COLORS', Icon: Palette },
          { id: 'size', label: 'DIMENSIONS', Icon: Sliders },
          { id: 'style', label: 'STYLE', Icon: Layers }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                height: '100%',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-primary, #D6003D)' : 'var(--text-secondary, #636366)',
                transition: 'color 0.2s',
                position: 'relative'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  width: 32,
                  height: 3,
                  background: 'var(--accent-primary, #D6003D)',
                  borderRadius: '0 0 4px 4px'
                }} />
              )}
              <tab.Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600, letterSpacing: '0.3px' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── MODALS ── */}

      {/* Quality Audit Modal */}
      <BarcodeQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        bcid={bcid}
        text={text}
        barColor={barColor}
        bgColor={isTransparentBg ? 'transparent' : bgColor}
        isDataValid={isDataValid}
        currentStandard={currentStandard}
        spec={spec}
        barWidth={barWidth}
        margin={margin}
      />

      {/* Technical Info Modal */}
      <BarcodeInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setPendingBcid(null);
        }}
        bcid={pendingBcid || bcid}
        standard={BARCODE_STANDARDS[pendingBcid || bcid] || currentStandard}
        spec={BARCODE_SPECS[pendingBcid || bcid] || spec}
      />

      {/* Print / Label Mode Modal */}
      <BarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        canvasRef={canvasRef}
        bcid={bcid}
        text={text}
        showToast={showToast}
      />

      {/* Test Scan Verification Modal */}
      <BarcodeTestScanModal
        isOpen={isTestScanOpen}
        onClose={() => setIsTestScanOpen(false)}
        targetBcid={bcid}
        targetText={text}
      />

      {/* Barcode History Modal */}
      <BarcodeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={(item) => {
          const val = item.displayText || item.qrData?.text || '';
          const s = item.style || {};
          const targetBcid = s.bcid || 'ean13';
          const std = BARCODE_STANDARDS[targetBcid] || BARCODE_STANDARDS.ean13;

          updateStateAndHistory({
            text: val,
            bcid: targetBcid,
            barColor: s.barColor || '#000000',
            bgColor: s.bgColor || '#FFFFFF',
            isTransparentBg: s.bgColor === 'transparent',
            barWidth: s.barWidth !== undefined ? s.barWidth : (std.defaultBarWidth || 2),
            height: s.height !== undefined ? s.height : (std.defaultHeight || 85),
            margin: s.margin !== undefined ? s.margin : (std.defaultMargin || 16),
            displayValue: s.displayValue !== undefined ? s.displayValue : true,
            textPosition: s.textPosition || 'below',
            textAlign: s.textAlign || 'center',
            textFont: s.textFont || 'ocrb'
          });
          showToast('Loaded barcode from history', 'success');
        }}
        showToast={showToast}
      />

      {/* Advanced Color Picker */}
      <AdvancedColorPicker
        isOpen={advPicker.open}
        initialColor={advPicker.color}
        onChange={(c) => {
          if (advPicker.type === 'bar') setBarColor(c);
          else setBgColor(c);
        }}
        onConfirm={(c) => {
          if (advPicker.type === 'bar') updateStateAndHistory({ barColor: c });
          else updateStateAndHistory({ bgColor: c, isTransparentBg: false });
          setAdvPicker(p => ({ ...p, open: false }));
        }}
        onCancel={() => {
          if (advPicker.type === 'bar') setBarColor(advPicker.color);
          else setBgColor(advPicker.color);
          setAdvPicker(p => ({ ...p, open: false }));
        }}
      />

      {/* Structured Barcode Fields Modal */}
      <BarcodeDataModal
        isOpen={isDataModalOpen}
        bcid={pendingBcid || bcid}
        standard={BARCODE_STANDARDS[pendingBcid || bcid] || currentStandard}
        initialFields={modalInitialFields}
        onApply={(compiledValue) => {
          const updates = { text: compiledValue };
          if (pendingBcid && pendingBcid !== bcid) {
            updates.bcid = pendingBcid;
          }
          updateStateAndHistory(updates);
          setIsDataModalOpen(false);
          setPendingBcid(null);
        }}
        onClose={() => {
          setIsDataModalOpen(false);
          setPendingBcid(null);
        }}
      />
    </div>
  );
}

function undoRedoStyle(disabled) {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--bg-hover, rgba(0,0,0,0.04))',
    border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
    color: disabled ? 'var(--text-muted, #C7C7CC)' : 'var(--accent-primary, #D6003D)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.2s ease'
  };
}
