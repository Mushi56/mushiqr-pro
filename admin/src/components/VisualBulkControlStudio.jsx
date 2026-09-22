// admin/src/components/VisualBulkControlStudio.jsx
// ─── Visual Bulk Creation Feature Access Studio ─────────────────────────────
// Visual representation of the main app's Bulk / Batch Creation Screen. Enables Super Admins
// to visually inspect spreadsheet imports, grid editors, batch styling engines & ZIP exports,
// and toggle active state (Enable / Disable / Hide) and monetization tier (Free vs Paid Pro)
// via category navbar tabs and organized subcategory catalogs with 1-click batch actions.

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, FileSpreadsheet, Download, Sparkles, Shield, Crown, Power,
  XCircle, Search, Check, FileText, RefreshCw, UploadCloud, Table,
  Archive, CheckCircle2, Sliders, ArrowRight, QrCode, Barcode, Palette,
  Grid, Share2, Printer, SlidersHorizontal, Image, FileUp, FileCheck,
  Tag, Hash, Zap, Cpu, FolderArchive, Layers2, FileArchive, CheckSquare
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { setFeatureFlagCloud, setFeatureFlagsBatchCloud, setFeaturesTierBatchCloud } from '../services/adminDataService';
import { FEATURE_REGISTRY } from '../services/FeatureAccessManager';

// ─── 1. RAW CATALOG DATA & METADATA ─────────────────────────────────────────

export const ALL_BULK_IMPORT_TOOLS = [
  { id: 'batch_csv_import', name: 'CSV & Excel Data File Import', desc: 'Drag-and-drop / upload CSV, XLSX and XLS spreadsheet datasets', icon: FileSpreadsheet, defaultPlan: 'weekly', tag: 'Spreadsheets' },
  { id: 'batch_manual_input', name: 'Quick-Sheet Grid Data Editor', desc: 'Interactive spreadsheet table to add, edit, sort and delete code rows', icon: Table, defaultPlan: 'weekly', tag: 'Grid Editor' },
  { id: 'batch_paste_data', name: 'Multiline Textarea Quick Paste', desc: 'Paste multiline raw text lists (one code per line) for instant parsing', icon: FileText, defaultPlan: 'free', tag: 'Quick Paste' },
  { id: 'batch_template_download', name: 'Sample CSV / Excel Downloader', desc: 'Download pre-formatted sample spreadsheet templates with column headers', icon: Download, defaultPlan: 'free', tag: 'Sample Files' }
];

export const ALL_BULK_VALIDATION_TOOLS = [
  { id: 'batch_data_cleaning', name: 'Auto Data Sanitizer & Trim', desc: 'Filter empty rows, strip trailing whitespace & validate URL/EAN formats', icon: FileCheck, defaultPlan: 'free', tag: 'Data Integrity' },
  { id: 'batch_limit_scale', name: 'High-Capacity Batch Engine (1,000+ Items)', desc: 'Multi-threaded worker to process 50, 100, 500 up to 1,000+ items seamlessly', icon: Zap, defaultPlan: 'weekly', tag: 'Scale Engine' },
  { id: 'batch_view', name: 'Bulk Generator Master Screen', desc: 'Master UI access to the entire Bulk Batch Generation module in the app', icon: Layers, defaultPlan: 'weekly', tag: 'Master View' }
];

export const ALL_BULK_FORMAT_GENERATORS = [
  { id: 'batch_type_qr', name: 'Bulk QR Code Generation Engine', desc: 'Batch generate URLs, vCards, Wi-Fi networks, SMS, Email and Geo coordinates', icon: QrCode, defaultPlan: 'weekly', tag: 'QR Engine' },
  { id: 'batch_type_barcode', name: 'Bulk 1D / 2D Barcode Generator', desc: 'Batch generate EAN-13, UPC-A, Code 128, Code 39, ITF-14 and DataMatrix barcodes', icon: Barcode, defaultPlan: 'weekly', tag: 'Barcode Engine' },
  { id: 'batch_type_mixed', name: 'Multi-Format Mixed Batching', desc: 'Generate both QR codes and barcodes within a single combined export job', icon: Layers2, defaultPlan: 'monthly', tag: 'Mixed Formats' }
];

export const ALL_BULK_CHECKSUM_TOOLS = [
  { id: 'batch_error_tolerance', name: 'Dynamic Error Correction Level Sync', desc: 'Synchronize L/M/Q/H Reed-Solomon error correction across all batch QRs', icon: Shield, defaultPlan: 'free', tag: 'QR Tolerance' },
  { id: 'batch_checksum_calc', name: 'Auto Modulo Checksum Calculation', desc: 'Automatically compute valid check digits for EAN-13, UPC-A, ITF-14 & MSI', icon: Hash, defaultPlan: 'free', tag: 'Barcode Checksum' }
];

export const ALL_BULK_STYLING_TOOLS = [
  { id: 'batch_custom_style', name: 'Inherit Active Studio Design', desc: 'Synchronize active QR/Barcode colors, dot shapes & eyes to all batch items', icon: Sparkles, defaultPlan: 'weekly', tag: 'Studio Sync' },
  { id: 'batch_color_sync', name: 'Batch Color & Gradient Fills', desc: 'Apply custom hex palettes and dual-tone gradients uniformly across the list', icon: Palette, defaultPlan: 'weekly', tag: 'Color Fills' },
  { id: 'batch_logo_embed', name: 'Bulk Brand Logo Embedding', desc: 'Embed custom uploaded brand logos or social icons in the center of all batch codes', icon: Image, defaultPlan: 'weekly', tag: 'Logo Branding' },
  { id: 'batch_dot_shapes', name: 'Dot & Eye Module Shapes Sync', desc: 'Apply 35+ dot styles (dots, sparkle, leaf) and eye finder shapes to all items', icon: Grid, defaultPlan: 'weekly', tag: 'Shape Modules' }
];

export const ALL_BULK_PREVIEW_TOOLS = [
  { id: 'batch_individual_override', name: 'Per-Item Individual Style Override', desc: 'Customize colors or format for specific individual rows in the batch list', icon: SlidersHorizontal, defaultPlan: 'weekly', tag: 'Row Customization' },
  { id: 'batch_live_preview', name: 'Real-Time Interactive Batch Grid', desc: 'Live visual grid rendering all rendered codes before committing to export', icon: Table, defaultPlan: 'free', tag: 'Live Preview' }
];

export const ALL_BULK_ZIP_TOOLS = [
  { id: 'batch_zip_export', name: 'Download Compressed ZIP Archive', desc: 'Export all batch items packaged inside a compressed .ZIP file archive', icon: FolderArchive, defaultPlan: 'weekly', tag: 'ZIP Engine' },
  { id: 'bulk_export_png', name: 'Bulk PNG Images inside ZIP', desc: 'Generate individual high-resolution PNG image files inside the ZIP package', icon: FileImage, defaultPlan: 'free', tag: 'PNG Images' },
  { id: 'bulk_export_svg', name: 'Bulk SVG Vectors inside ZIP', desc: 'Generate scalable vector SVG files for every item inside the ZIP package', icon: FileCode, defaultPlan: 'weekly', tag: 'SVG Vectors' },
  { id: 'bulk_export_pdf', name: 'Multi-Page A4 PDF Catalog Sheet', desc: 'Compile all batch items into a structured multi-page printable A4 PDF catalog', icon: FileText, defaultPlan: 'weekly', tag: 'PDF Catalog' }
];

export const ALL_BULK_PRINT_NAMING_TOOLS = [
  { id: 'bulk_export_pdf_labels', name: 'Sticky Label Sheet Grid Layout', desc: 'Export print-ready sticky label layouts (Avery 5160 / 24-per-sheet / 30-per-sheet)', icon: Printer, defaultPlan: 'weekly', tag: 'Avery Labels' },
  { id: 'batch_file_naming', name: 'Custom File Naming Rule Pattern', desc: 'Customize output file naming convention e.g. {index}_{sku}_{content}.png', icon: Tag, defaultPlan: 'weekly', tag: 'Naming Rules' },
  { id: 'batch_zip_compression', name: 'Multi-Core ZIP Compression Levels', desc: 'Calibrate compression ratio (Fast Store vs Ultra Deflate compression)', icon: Cpu, defaultPlan: 'free', tag: 'Compression' }
];

export const ALL_BULK_RESOLUTION_TOOLS = [
  { id: 'bulk_export_quality_low', name: 'Resolution: Low (512px)', desc: 'Standard low resolution (512px) for quick validation testing', icon: Sparkles, defaultPlan: 'free', tag: '512px' },
  { id: 'bulk_export_quality_medium', name: 'Resolution: Normal (1024px)', desc: 'Sharp standard resolution (1024px) for regular use', icon: Sparkles, defaultPlan: 'free', tag: '1024px' },
  { id: 'bulk_export_quality_hd', name: 'Resolution: HD (2048px)', desc: 'Crisp high-definition print resolution (2048px)', icon: Sparkles, defaultPlan: 'weekly', tag: '2048px HD' },
  { id: 'bulk_export_quality_ultra', name: 'Resolution: 4K Ultra (4096px)', desc: 'Ultra 4K master resolution (4096px) for large banners and billboards', icon: Sparkles, defaultPlan: 'weekly', tag: '4096px 4K' },
  { id: 'bulk_export_quality', name: 'Master HD Quality Scaler Engine', desc: 'Master quality selector dropdown inside the Bulk export modal', icon: Sliders, defaultPlan: 'weekly', tag: 'Quality Selector' }
];

export const ALL_BULK_DISTRIBUTION_TOOLS = [
  { id: 'batch_native_share', name: 'Native OS Share Sheet for ZIP', desc: 'Share generated ZIP archive directly to WhatsApp, Drive, AirDrop & Email', icon: Share2, defaultPlan: 'free', tag: 'Share Sheet' },
  { id: 'batch_save_documents', name: 'Save to Local Documents Directory', desc: 'Save ZIP file directly to organized device storage Documents folder', icon: Download, defaultPlan: 'free', tag: 'Local Files' }
];

// Helper icon placeholder for FileImage & FileCode
function FileImage(props) {
  return <Image {...props} />;
}
function FileCode(props) {
  return <FileText {...props} />;
}

// ─── 2. MAIN COMPONENT ───────────────────────────────────────────────────────

export default function VisualBulkControlStudio({ currentUser, isDark = false }) {
  const [liveFlagsMap, setLiveFlagsMap] = useState({});
  const [livePlans, setLivePlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('import_data');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [updatingKey, setUpdatingKey] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // 1. Real-time Firestore subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubGlobal = onSnapshot(doc(db, 'global_config', 'featureFlags'), snap => {
      if (snap.exists()) setLiveFlagsMap(snap.data() || {});
      setLoading(false);
    }, () => setLoading(false));

    const unsubPlans = onSnapshot(collection(db, 'subscription_plans'), colSnap => {
      const plans = {};
      colSnap.forEach(d => { plans[d.id] = d.data(); });
      setLivePlans(plans);
    }, () => {});

    return () => {
      unsubGlobal?.();
      unsubPlans?.();
    };
  }, []);

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const getItemState = (key, defaultEnabled = true, defaultPlan = 'free') => {
    const enabled = liveFlagsMap[key] !== undefined ? Boolean(liveFlagsMap[key]) : defaultEnabled;
    let isPaid = false;
    if (Array.isArray(livePlans.free?.features)) {
      isPaid = !livePlans.free.features.includes(key);
    } else {
      isPaid = defaultPlan !== 'free';
    }
    return { enabled, isPaid };
  };

  // 2. Individual Toggle Handlers
  const handleToggleEnable = async (key, name, subcategory = 'Bulk Generator') => {
    setUpdatingKey(key);
    const current = getItemState(key).enabled;
    const nextState = !current;
    try {
      await setFeatureFlagCloud(key, nextState, { name, category: 'BULK_GENERATOR', subcategory });
      setLiveFlagsMap(prev => ({ ...prev, [key]: nextState }));
      showToast(`${name} is now ${nextState ? '🟢 ENABLED (Visible)' : '🔴 DISABLED (Hidden)'}`);
    } catch (e) {
      showToast('❌ Update failed');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleToggleTier = async (key, name) => {
    setUpdatingKey(key);
    const currentPaid = getItemState(key).isPaid;
    const nextTier = currentPaid ? 'free' : 'paid';
    try {
      await setFeaturesTierBatchCloud([key], nextTier);
      showToast(`${name} is now ${nextTier === 'free' ? '🛡️ 100% FREE' : '👑 PAID PRO'}`);
    } catch (e) {
      showToast('❌ Tier update failed');
    } finally {
      setUpdatingKey(null);
    }
  };

  // 3. Batch Handlers
  const handleBatchActiveTabTier = async (targetTier, keysList) => {
    setBulkProcessing(true);
    try {
      await setFeaturesTierBatchCloud(keysList, targetTier);
      showToast(`✨ ${keysList.length} items set to ${targetTier === 'free' ? '100% FREE' : 'PAID PRO'}`);
    } catch (e) {
      showToast('❌ Batch tier update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBatchActiveTabEnable = async (enable, itemsList, subcategory) => {
    setBulkProcessing(true);
    try {
      const updates = {};
      for (const item of itemsList) {
        updates[item.key] = Boolean(enable);
      }
      await setFeatureFlagsBatchCloud(updates, { category: 'BULK_GENERATOR', subcategory });
      setLiveFlagsMap(prev => ({ ...prev, ...updates }));
      showToast(`✨ ${itemsList.length} items ${enable ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      showToast('❌ Batch update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // 4. Total features count
  const totalBulkCount = useMemo(() => {
    return (
      ALL_BULK_IMPORT_TOOLS.length +
      ALL_BULK_VALIDATION_TOOLS.length +
      ALL_BULK_FORMAT_GENERATORS.length +
      ALL_BULK_CHECKSUM_TOOLS.length +
      ALL_BULK_STYLING_TOOLS.length +
      ALL_BULK_PREVIEW_TOOLS.length +
      ALL_BULK_ZIP_TOOLS.length +
      ALL_BULK_PRINT_NAMING_TOOLS.length +
      ALL_BULK_RESOLUTION_TOOLS.length +
      ALL_BULK_DISTRIBUTION_TOOLS.length
    );
  }, []);

  // 5. 5 Main Navbar Category Tabs
  const TABS = [
    { id: 'import_data', label: '1. Data & Sheets', count: ALL_BULK_IMPORT_TOOLS.length + ALL_BULK_VALIDATION_TOOLS.length, icon: FileSpreadsheet },
    { id: 'code_types', label: '2. QR & Barcodes', count: ALL_BULK_FORMAT_GENERATORS.length + ALL_BULK_CHECKSUM_TOOLS.length, icon: QrCode },
    { id: 'batch_styling', label: '3. Design & Styling', count: ALL_BULK_STYLING_TOOLS.length + ALL_BULK_PREVIEW_TOOLS.length, icon: Palette },
    { id: 'zip_archive', label: '4. ZIP & PDF Sheets', count: ALL_BULK_ZIP_TOOLS.length + ALL_BULK_PRINT_NAMING_TOOLS.length, icon: Archive },
    { id: 'resolution_export', label: '5. Quality & Share', count: ALL_BULK_RESOLUTION_TOOLS.length + ALL_BULK_DISTRIBUTION_TOOLS.length, icon: Download }
  ];

  // Subcategory Tabs for each Main Category
  const SUB_TABS = useMemo(() => ({
    import_data: [
      { id: 'all', label: 'All Data', count: ALL_BULK_IMPORT_TOOLS.length + ALL_BULK_VALIDATION_TOOLS.length, icon: Layers },
      { id: 'spreadsheet', label: 'Spreadsheet Tools', count: ALL_BULK_IMPORT_TOOLS.length, icon: FileSpreadsheet },
      { id: 'sanitization', label: 'Sanitization & Capacity', count: ALL_BULK_VALIDATION_TOOLS.length, icon: Zap }
    ],
    code_types: [
      { id: 'all', label: 'All Codes', count: ALL_BULK_FORMAT_GENERATORS.length + ALL_BULK_CHECKSUM_TOOLS.length, icon: Layers },
      { id: 'engines', label: 'Engines', count: ALL_BULK_FORMAT_GENERATORS.length, icon: QrCode },
      { id: 'error', label: 'Error & Checksum', count: ALL_BULK_CHECKSUM_TOOLS.length, icon: Shield }
    ],
    batch_styling: [
      { id: 'all', label: 'All Design', count: ALL_BULK_STYLING_TOOLS.length + ALL_BULK_PREVIEW_TOOLS.length, icon: Layers },
      { id: 'presets', label: 'Design Presets', count: ALL_BULK_STYLING_TOOLS.length, icon: Palette },
      { id: 'preview', label: 'Overrides & Preview', count: ALL_BULK_PREVIEW_TOOLS.length, icon: SlidersHorizontal }
    ],
    zip_archive: [
      { id: 'all', label: 'All ZIP & PDF', count: ALL_BULK_ZIP_TOOLS.length + ALL_BULK_PRINT_NAMING_TOOLS.length, icon: Layers },
      { id: 'zip', label: 'ZIP & PDF Formats', count: ALL_BULK_ZIP_TOOLS.length, icon: Archive },
      { id: 'labels', label: 'Label Sheets', count: ALL_BULK_PRINT_NAMING_TOOLS.length, icon: Printer }
    ],
    resolution_export: [
      { id: 'all', label: 'All Quality', count: ALL_BULK_RESOLUTION_TOOLS.length + ALL_BULK_DISTRIBUTION_TOOLS.length, icon: Layers },
      { id: 'resolution', label: 'Resolution', count: ALL_BULK_RESOLUTION_TOOLS.length, icon: Sparkles },
      { id: 'distribution', label: 'Distribution', count: ALL_BULK_DISTRIBUTION_TOOLS.length, icon: Share2 }
    ]
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Feedback Toast */}
      {feedbackToast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 18, 33, 0.96)', border: '1.5px solid #10B981',
          borderRadius: 100, padding: '8px 18px', color: '#fff',
          fontSize: 12, fontWeight: 800, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 999999, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
        }}>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── Studio Header (Mobile-First UX) ──────────────────────────────────── */}
      <div style={{
        background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
        borderRadius: 16, padding: '14px', boxShadow: 'var(--ad-card-shadow)',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        {/* Top: Icon + Title + Status Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)', color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <Layers size={22} strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ad-text)', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Bulk Batch Generator Studio
              </h1>
              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                {totalBulkCount} Controls &amp; Engines
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ad-text-sec)', margin: '3px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
              Granular Free/Pro controls for spreadsheet imports, quick-sheet grid editors, style sync, ZIP packages &amp; printable PDF label sheets.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--ad-text-sec)' }} />
          <input
            type="text"
            placeholder="Search CSV, Excel, grid editor, ZIP export, Avery labels, resolution..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
              borderRadius: 9, padding: '8px 30px 8px 30px', color: 'var(--ad-text)',
              fontSize: 11.5, fontWeight: 600, outline: 'none', height: 36
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--ad-text-sec)', cursor: 'pointer', padding: 2 }}>
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Horizontal Category Navbar Tabs (Main Category Pills) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto',
          paddingBottom: 2, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
        }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            const IconC = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setActiveSubTab('all');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 12, border: 'none',
                  background: isActive ? '#10B981' : 'var(--ad-input)',
                  color: isActive ? '#FFFFFF' : 'var(--ad-text)',
                  fontSize: 11.5, fontWeight: isActive ? 800 : 600, whiteSpace: 'nowrap', cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
                }}
              >
                <IconC size={13} strokeWidth={2.4} />
                <span>{t.label}</span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 10,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(150, 150, 150, 0.15)',
                  color: isActive ? '#fff' : 'var(--ad-text-sec)', fontWeight: 800
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Navigation Tabs (Consistent borderless pill style, 12px radius) */}
        {SUB_TABS[activeTab] && SUB_TABS[activeTab].length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto',
            paddingTop: 10, borderTop: '1px solid var(--ad-border)',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
          }}>
            {SUB_TABS[activeTab].map(st => {
              const isSubActive = activeSubTab === st.id;
              const SubIcon = st.icon;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveSubTab(st.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 12, border: 'none',
                    background: isSubActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--ad-input)',
                    color: isSubActive ? '#10B981' : 'var(--ad-text-sec)',
                    fontSize: 11, fontWeight: isSubActive ? 800 : 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSubActive ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                >
                  {SubIcon && <SubIcon size={12} />}
                  <span>{st.label}</span>
                  {st.count !== undefined && (
                    <span style={{
                      fontSize: 8.5, padding: '1px 6px', borderRadius: 10,
                      background: isSubActive ? '#10B981' : 'var(--ad-card)',
                      color: isSubActive ? '#fff' : 'var(--ad-text-sec)', fontWeight: 800
                    }}>
                      {st.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab 1: Data Ingestion & Spreadsheets ─────────────────────────────── */}
      {activeTab === 'import_data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Spreadsheets & Data Entry */}
          {(activeSubTab === 'all' || activeSubTab === 'spreadsheet') && (
            <SectionCatalog
              title="Spreadsheet Tools"
              subtitle="Upload CSV, XLSX, XLS files, edit with interactive grid spreadsheet, or quick-paste multiline lists"
              icon={FileSpreadsheet}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_IMPORT_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_IMPORT_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_IMPORT_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Input & Spreadsheet')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_IMPORT_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Input & Spreadsheet')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_IMPORT_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Input & Spreadsheet')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Data Validation & Capacity */}
          {(activeSubTab === 'all' || activeSubTab === 'sanitization') && (
            <SectionCatalog
              title="Sanitization & Capacity"
              subtitle="Automated format cleaners, empty row filters, high-capacity 1,000+ item engines & master screen switch"
              icon={Zap}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_VALIDATION_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_VALIDATION_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_VALIDATION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Input & Spreadsheet')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_VALIDATION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Input & Spreadsheet')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_VALIDATION_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Input & Spreadsheet')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 2: QR & Barcode Engines ─────────────────────────────────────── */}
      {activeTab === 'code_types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Generator Engines */}
          {(activeSubTab === 'all' || activeSubTab === 'engines') && (
            <SectionCatalog
              title="Engines"
              subtitle="Bulk generate URL/vCard QR codes, 1D/2D barcodes (EAN, UPC, Code 128, DataMatrix) or combined mixed jobs"
              icon={QrCode}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_FORMAT_GENERATORS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_FORMAT_GENERATORS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_FORMAT_GENERATORS.map(t => ({ key: t.id, name: t.name })), 'Batch Engines')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_FORMAT_GENERATORS.map(t => ({ key: t.id, name: t.name })), 'Batch Engines')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_FORMAT_GENERATORS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Batch Engines')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Error Correction & Checksums */}
          {(activeSubTab === 'all' || activeSubTab === 'error') && (
            <SectionCatalog
              title="Error & Checksum"
              subtitle="Dynamic Reed-Solomon error correction and auto modulo check digit calculation across bulk lists"
              icon={Shield}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_CHECKSUM_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_CHECKSUM_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_CHECKSUM_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Engines')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_CHECKSUM_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Engines')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_CHECKSUM_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Batch Engines')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 3: Design & Batch Styling ───────────────────────────────────── */}
      {activeTab === 'batch_styling' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Synchronized Design Presets */}
          {(activeSubTab === 'all' || activeSubTab === 'presets') && (
            <SectionCatalog
              title="Design Presets"
              subtitle="Propagate colors, gradients, custom brand logos, and 35+ dot/eye module styles across the entire batch"
              icon={Palette}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_STYLING_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_STYLING_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_STYLING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Styling')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_STYLING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Styling')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_STYLING_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Batch Styling')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Previews & Row Overrides */}
          {(activeSubTab === 'all' || activeSubTab === 'preview') && (
            <SectionCatalog
              title="Overrides & Preview"
              subtitle="Permit per-row custom design overrides and interactive live canvas preview cards"
              icon={SlidersHorizontal}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_PREVIEW_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_PREVIEW_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_PREVIEW_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Styling')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_PREVIEW_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Batch Styling')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_PREVIEW_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Batch Styling')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 4: ZIP Archives & PDF Sheets ─────────────────────────────────── */}
      {activeTab === 'zip_archive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: ZIP Packaging & Formats */}
          {(activeSubTab === 'all' || activeSubTab === 'zip') && (
            <SectionCatalog
              title="ZIP & PDF Formats"
              subtitle="Download compressed ZIP archives containing individual PNGs, vector SVGs or compiled multi-page A4 PDFs"
              icon={Archive}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_ZIP_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_ZIP_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_ZIP_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_ZIP_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_ZIP_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Bulk Export')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Label Sheets & File Naming */}
          {(activeSubTab === 'all' || activeSubTab === 'labels') && (
            <SectionCatalog
              title="Label Sheets"
              subtitle="Print-ready Avery sticky label sheets, customizable file naming rules ({id}_{sku}_{text}), and ZIP compression"
              icon={Printer}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_PRINT_NAMING_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_PRINT_NAMING_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_PRINT_NAMING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_PRINT_NAMING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_PRINT_NAMING_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Bulk Export')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 5: Resolution, Speed & Distribution ──────────────────────────── */}
      {activeTab === 'resolution_export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Resolution Scaler */}
          {(activeSubTab === 'all' || activeSubTab === 'resolution') && (
            <SectionCatalog
              title="Resolution"
              subtitle="Low 512px, Normal 1024px, HD 2048px and 4K Ultra 4096px resolution multipliers for batch exports"
              icon={Sparkles}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_RESOLUTION_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_RESOLUTION_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_RESOLUTION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_RESOLUTION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_RESOLUTION_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Bulk Export')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Sharing & Storage */}
          {(activeSubTab === 'all' || activeSubTab === 'distribution') && (
            <SectionCatalog
              title="Distribution"
              subtitle="Direct OS Share Sheet integration (WhatsApp, AirDrop, Drive, Email) and local file storage"
              icon={Share2}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BULK_DISTRIBUTION_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BULK_DISTRIBUTION_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BULK_DISTRIBUTION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BULK_DISTRIBUTION_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Bulk Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BULK_DISTRIBUTION_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BulkToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        tag={tool.tag}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Bulk Export')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 3. REUSABLE BULK ITEM CONTROL TILES
// ═════════════════════════════════════════════════════════════════════════

function BulkToolControlTile({ name, desc, tag, icon: Icon, enabled, isPaid, updating, onToggleEnable, onToggleTier }) {
  const isOff = !enabled;

  return (
    <div style={{
      background: isOff ? 'rgba(15, 18, 33, 0.4)' : (isPaid ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.04)'),
      border: 'none',
      borderRadius: 14, padding: '10px 10px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      gap: 8, opacity: isOff ? 0.65 : 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isPaid ? '0 4px 14px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      {/* Tool Icon & Badge Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={16} strokeWidth={2.4} />
        </div>
        {tag && (
          <span style={{
            fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.16)', color: '#10B981', whiteSpace: 'nowrap'
          }}>
            {tag}
          </span>
        )}
      </div>

      {/* Details */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11.5, fontWeight: 900, color: 'var(--ad-text)', lineHeight: 1.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 9.5, color: 'var(--ad-text-sec)', marginTop: 3,
          lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 25
        }}>
          {desc}
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 6, borderTop: '1px solid var(--ad-border)', gap: 4
      }}>
        <button
          type="button"
          disabled={updating}
          onClick={onToggleEnable}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px',
            borderRadius: 8, border: 'none',
            background: enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: enabled ? '#22C55E' : '#EF4444', fontSize: 9, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0
          }}
        >
          <Power size={9} strokeWidth={2.5} />
          <span>{enabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          disabled={updating}
          onClick={onToggleTier}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px',
            borderRadius: 100, border: 'none',
            background: isPaid ? '#F59E0B' : '#10B981',
            color: '#FFFFFF', fontSize: 9, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0,
            boxShadow: isPaid ? '0 2px 8px rgba(245, 158, 11, 0.35)' : '0 2px 8px rgba(16, 185, 129, 0.35)'
          }}
        >
          {updating ? (
            <RefreshCw size={9} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isPaid ? (
            <Crown size={9} fill="#fff" color="#fff" strokeWidth={2.2} />
          ) : (
            <Shield size={9} strokeWidth={2.5} />
          )}
          <span>{isPaid ? 'PRO' : 'FREE'}</span>
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 4. REUSABLE SUB-CONTAINER CATALOG CARD (Mobile-First UX)
// ═════════════════════════════════════════════════════════════════════════

function SectionCatalog({ title, subtitle, icon: Icon, onMakeFree, onMakePro, onEnableAll, onDisableAll, children }) {
  return (
    <div style={{
      background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
      borderRadius: 18, padding: '14px 12px', boxShadow: 'var(--ad-card-shadow)',
      display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box'
    }}>
      {/* Header with Title and Action Toolbar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%'
      }}>
        {/* Title and Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
            color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
          }}>
            <Icon size={18} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ad-text)', margin: 0, lineHeight: 1.25, letterSpacing: '-0.2px' }}>
              {title}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--ad-text-sec)', margin: '2px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* 1-Click Batch Actions Toolbar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          width: '100%',
          paddingTop: 4,
          borderTop: '1px solid var(--ad-border)'
        }}>
          <button
            type="button"
            onClick={onMakeFree}
            style={{
              padding: '7px 6px', borderRadius: 10, border: 'none',
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#10B981', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={11} strokeWidth={2.5} />
            <span>Make Free</span>
          </button>

          <button
            type="button"
            onClick={onMakePro}
            style={{
              padding: '7px 6px', borderRadius: 10, border: 'none',
              background: 'rgba(245, 158, 11, 0.16)',
              color: '#F59E0B', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <Crown size={11} strokeWidth={2.5} />
            <span>Make Pro</span>
          </button>

          <button
            type="button"
            onClick={onEnableAll}
            style={{
              padding: '7px 6px', borderRadius: 10, border: 'none',
              background: 'rgba(59, 130, 246, 0.16)',
              color: '#3B82F6', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <Power size={11} strokeWidth={2.5} />
            <span>Enable All</span>
          </button>

          <button
            type="button"
            onClick={onDisableAll}
            style={{
              padding: '7px 6px', borderRadius: 10, border: 'none',
              background: 'rgba(239, 68, 68, 0.16)',
              color: '#EF4444', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <XCircle size={11} strokeWidth={2.5} />
            <span>Disable All</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid Content */}
      {children}
    </div>
  );
}
