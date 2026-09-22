// admin/src/components/VisualBarcodeControlStudio.jsx
// ─── Visual Barcode Generator Feature Access Studio ─────────────────────────
// Visual representation of the main app's Barcode Generator. Enables Super Admins to
// visually inspect every 1D and 2D barcode format, standard, and styling engine, and toggle
// active state (Enable / Disable / Hide) and monetization tier (Free vs Paid Pro) via
// category navbar tabs and organized subcategory catalogs with 1-click batch actions.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Barcode, QrCode, Sparkles, Shield, Crown, Power, XCircle, Search, Check,
  Palette, Sliders, RefreshCw, Box, SlidersHorizontal, Layers, CheckCircle2,
  Download, FileUp, Type, Eye, Image, LayoutGrid, Printer, Share2,
  Bookmark, Grid, AlignCenter, RotateCcw, CheckSquare, Hash, Tag, FileText
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { setFeatureFlagCloud, setFeatureFlagsBatchCloud, setFeaturesTierBatchCloud } from '../services/adminDataService';
import { FEATURE_REGISTRY } from '../services/FeatureAccessManager';
import { renderBarcode, BARCODE_STANDARDS } from '../utils/barcodeEngine';

// ─── 1. RAW CATALOG DATA & METADATA ─────────────────────────────────────────

export const ALL_1D_RETAIL_STANDARDS = [
  { id: 'ean13', name: 'EAN-13 Retail', desc: '13-digit global standard for supermarkets & point-of-sale retail', defaultPlan: 'free', tag: 'Global Retail' },
  { id: 'ean8', name: 'EAN-8 Compact', desc: '8-digit condensed barcode for small packages & confectionery', defaultPlan: 'free', tag: 'Compact Retail' },
  { id: 'upca', name: 'UPC-A Retail (US)', desc: '12-digit standard universal product code for North American retail', defaultPlan: 'free', tag: 'US & Canada' },
  { id: 'upce', name: 'UPC-E Condensed', desc: '8-digit zero-suppressed condensed format for small retail merchandise', defaultPlan: 'free', tag: 'Zero-Suppressed' },
  { id: 'isbn', name: 'ISBN Book Standard', desc: 'International standard book numbering barcode with price add-on', defaultPlan: 'free', tag: 'Books & Publishing' },
  { id: 'issn', name: 'ISSN Serial Standard', desc: 'International standard serial number for magazines & periodicals', defaultPlan: 'free', tag: 'Periodicals' },
  { id: 'ismn', name: 'ISMN Music Standard', desc: 'International standard music numbering for printed musical scores', defaultPlan: 'weekly', tag: 'Sheet Music' }
];

export const ALL_1D_INDUSTRIAL_STANDARDS = [
  { id: 'code128', name: 'Code 128 Standard', desc: 'High-density alphanumeric barcode supporting all 128 ASCII chars', defaultPlan: 'free', tag: 'Logistics & Tech' },
  { id: 'code39', name: 'Code 39 Industrial', desc: 'Classic industrial alphanumeric standard used by defense & inventory', defaultPlan: 'free', tag: 'Military & Defense' },
  { id: 'code93', name: 'Code 93 Compact', desc: 'High-density alphanumeric barcode with dual checksum verification', defaultPlan: 'free', tag: 'Postal & Inventory' },
  { id: 'itf14', name: 'ITF-14 Shipping Carton', desc: '14-digit shipping container symbol printed on corrugated cardboard', defaultPlan: 'weekly', tag: 'Shipping Master' },
  { id: 'i25', name: 'Interleaved 2 of 5', desc: 'High-density numeric-only barcode for warehouse distribution & tickets', defaultPlan: 'weekly', tag: 'Distribution' },
  { id: 'codabar', name: 'Codabar Library / Blood', desc: 'Self-checking legacy barcode used in libraries, blood banks & airbills', defaultPlan: 'free', tag: 'Healthcare / Library' },
  { id: 'gs1128', name: 'GS1-128 Logistics AI', desc: 'GS1 standard using Application Identifiers (AI) for supply chain tracking', defaultPlan: 'weekly', tag: 'Supply Chain' },
  { id: 'code11', name: 'Code 11 Telecom', desc: 'High-density numeric code with 1-2 check digits for telecom equipment', defaultPlan: 'weekly', tag: 'Telecommunications' },
  { id: 'msi', name: 'MSI Plessey Shelf', desc: 'Pulse-width modulated barcode widely used for supermarket shelf tagging', defaultPlan: 'weekly', tag: 'Shelf Tagging' },
  { id: 'channelcode', name: 'Channel Code', desc: 'Ultra-condensed variable channel numeric symbology (channels 2 to 7)', defaultPlan: 'monthly', tag: 'Ultra-Compact' }
];

export const ALL_1D_POSTAL_MEDICAL_STANDARDS = [
  { id: 'postnet', name: 'Postnet USPS Zip Code', desc: 'US Postal Service routing barcode encoding 5, 9, or 11-digit zip routing', defaultPlan: 'weekly', tag: 'US Postal' },
  { id: 'planet', name: 'Planet USPS Mail Tracking', desc: 'US Postal Service 11-14 digit mail piece confirmation and tracking', defaultPlan: 'weekly', tag: 'US Postal' },
  { id: 'royalmail', name: 'Royal Mail Customer Code', desc: 'UK Royal Mail 4-State Customer Code (RM4SCC) for automated sorting', defaultPlan: 'weekly', tag: 'UK Royal Mail' },
  { id: 'telepen', name: 'Telepen Full-ASCII', desc: 'High-security British standard encoding all 128 ASCII chars with no shifts', defaultPlan: 'weekly', tag: 'British Rail / Academic' },
  { id: 'pharmacode', name: 'Pharmacode Packaging', desc: 'One-track/two-track code ensuring pharmaceutical packaging integrity', defaultPlan: 'weekly', tag: 'Pharmaceutical' }
];

export const ALL_2D_MATRIX_STANDARDS = [
  { id: 'datamatrix', name: 'Data Matrix 2D', desc: 'High-density 2D matrix code for direct part marking & electronics', defaultPlan: 'weekly', tag: 'Industrial 2D' },
  { id: 'aztec', name: 'Aztec Code 2D', desc: '2D matrix code with central bullseye finder for aviation boarding & rail', defaultPlan: 'weekly', tag: 'Transit & Ticketing' },
  { id: 'gs1databar', name: 'GS1 DataBar Omni', desc: 'Omnidirectional stacked/expanded retail barcode for fresh produce (GTIN)', defaultPlan: 'weekly', tag: 'Fresh Produce' },
  { id: 'maxicode', name: 'MaxiCode UPS Parcel', desc: 'Honeycomb 2D matrix with central bullseye used on UPS shipping labels', defaultPlan: 'monthly', tag: 'UPS Logistics' },
  { id: 'qrcode', name: 'Barcode Engine QR 2D', desc: 'Standard 2D QR matrix rendered through the high-speed barcode engine', defaultPlan: 'free', tag: 'Universal 2D' },
  { id: 'microqrcode', name: 'Micro QR Compact', desc: 'Miniaturized QR code format with a single finder pattern for small items', defaultPlan: 'weekly', tag: 'Micro 2D' },
  { id: 'hanxin', name: 'Han Xin Code 2D', desc: 'Chinese national standard 2D matrix optimized for Chinese character sets', defaultPlan: 'monthly', tag: 'National Standard' }
];

export const ALL_2D_STACKED_STANDARDS = [
  { id: 'pdf417', name: 'PDF417 2D Stacked', desc: 'High-capacity stacked 2D format for driver licenses, ID cards & airline passes', defaultPlan: 'weekly', tag: 'Government IDs' },
  { id: 'codablockf', name: 'Codablock F Stacked', desc: 'Multi-row stacked version of Code 128 with automated row height & checksum', defaultPlan: 'monthly', tag: 'Medical Lab' },
  { id: 'code16k', name: 'Code 16K Stacked', desc: 'Multi-row stacked format based on Code 128 supporting up to 16 rows', defaultPlan: 'monthly', tag: 'Automotive' },
  { id: 'code49', name: 'Code 49 Stacked', desc: 'Multi-row 2 to 8-row stacked barcode packing up to 81 alphanumeric chars', defaultPlan: 'monthly', tag: 'Inventory' }
];

export const ALL_BARCODE_COLOR_TOOLS = [
  { id: 'barcode_custom_colors', name: 'Custom Bar & Canvas Colors', desc: 'Full-spectrum RGB/Hex color pickers for foreground bars and background', icon: Palette, defaultPlan: 'free' },
  { id: 'barcode_color_bars', name: 'Foreground Bar Color Engine', desc: 'Independent color picker for primary barcode lines and modules', icon: Sliders, defaultPlan: 'free' },
  { id: 'barcode_color_bg', name: 'Background Canvas Color', desc: 'Custom canvas backing background color palette and opacity controls', icon: Palette, defaultPlan: 'free' },
  { id: 'barcode_bg_transparent', name: 'Transparent Background Canvas', desc: 'Export transparent PNG/SVG barcodes with no white bounding container', icon: Shield, defaultPlan: 'free' },
  { id: 'barcode_gradient_bars', name: 'Gradient Barcode Fills', desc: 'Dual-tone horizontal & vertical gradient fills across barcode bars', icon: Sparkles, defaultPlan: 'weekly' }
];

export const ALL_BARCODE_THEME_PRESETS = [
  { id: 'classic', name: 'Classic Monochrome', bar: '#000000', bg: '#FFFFFF', desc: 'Standard high-contrast black & white' },
  { id: 'ocean', name: 'Ocean Blue', bar: '#0055FF', bg: '#EEF4FF', desc: 'Electric blue bars on soft ice backing' },
  { id: 'forest', name: 'Forest Green', bar: '#008844', bg: '#F0FFF4', desc: 'Deep emerald bars on light mint canvas' },
  { id: 'sunset', name: 'Sunset Crimson', bar: '#FF4400', bg: '#FFF5F0', desc: 'Vibrant sunset orange on peach backing' },
  { id: 'purple', name: 'Royal Purple', bar: '#8800CC', bg: '#FAF0FF', desc: 'Majesty purple bars on lavender canvas' },
  { id: 'dark', name: 'Dark Neon Cyan', bar: '#00FFFF', bg: '#111122', desc: 'Cyan neon bars on dark navy container' },
  { id: 'monochrome', name: 'Monochrome Inverted', bar: '#FFFFFF', bg: '#000000', desc: 'Clean white bars on deep midnight black' },
  { id: 'cyberpunk', name: 'Cyberpunk Gold', bar: '#FFFF00', bg: '#110022', desc: 'Neon yellow bars on dark cyberpunk violet' }
];

export const ALL_BARCODE_TEXT_TOOLS = [
  { id: 'barcode_text_display', name: 'Human-Readable Text Label', desc: 'Toggle human-readable numeric/alphanumeric digits rendered below bars', icon: Type, defaultPlan: 'free' },
  { id: 'barcode_font_family', name: 'Label Font Typography (Inter/Mono)', desc: 'Select monospace, Outfit, Roboto & clean OCR font families for text digits', icon: LayoutGrid, defaultPlan: 'free' },
  { id: 'barcode_custom_font', name: 'Custom TTF / OTF Font Upload', desc: 'Upload proprietary brand font files for barcode label typography', icon: FileUp, defaultPlan: 'weekly' },
  { id: 'barcode_text_margin', name: 'Text Padding & Offset Spacing', desc: 'Adjust vertical clearance distance between barcode bottom and text digits', icon: AlignCenter, defaultPlan: 'free' },
  { id: 'barcode_caption_text', name: 'Custom Product Title & Header', desc: 'Add top header label (e.g. SKU, product name, price) above barcode bars', icon: Tag, defaultPlan: 'weekly' },
  { id: 'barcode_checksum_display', name: 'Checksum Digit Verification Highlight', desc: 'Highlight calculated modulo check digit in label with distinct color', icon: Hash, defaultPlan: 'free' }
];

export const ALL_BARCODE_SIZING_TOOLS = [
  { id: 'barcode_dimension_controls', name: 'Bar Width & Height Multiplier', desc: 'Master scale sliders for bar width density and vertical bar height', icon: Sliders, defaultPlan: 'free' },
  { id: 'barcode_bar_width', name: 'Fine Bar Module Width (X-Dimension)', desc: 'Calibrate narrow bar width in fractional increments (0.5x to 4.0x)', icon: SlidersHorizontal, defaultPlan: 'free' },
  { id: 'barcode_bar_height', name: 'Bar Vertical Height Scaler', desc: 'Adjust vertical bar height independently (15px to 120px)', icon: Box, defaultPlan: 'free' },
  { id: 'barcode_quiet_zone', name: 'Quiet Zone Margin Margin Slider', desc: 'Set left/right/top/bottom quiet zone margin padding for scan compliance', icon: Shield, defaultPlan: 'free' },
  { id: 'barcode_rotation', name: 'Barcode Rotation (90° / 180° / 270°)', desc: 'Rotate barcode canvas clockwise for vertical packaging alignment', icon: RotateCcw, defaultPlan: 'weekly' },
  { id: 'barcode_guard_bars', name: 'Extended Guard Bars (EAN / UPC)', desc: 'Extend start, center and end guard pattern bars below the standard baseline', icon: CheckSquare, defaultPlan: 'free' }
];

export const ALL_BARCODE_EXPORT_FORMATS = [
  { id: 'barcode_export_png', name: 'PNG Image Export', desc: 'Download high-res PNG image with optional transparent canvas', defaultPlan: 'free' },
  { id: 'barcode_export_jpg', name: 'JPG Image Export', desc: 'Download compressed JPG raster image for web and catalogs', defaultPlan: 'free' },
  { id: 'barcode_export_svg', name: 'SVG Vector Export', desc: 'Download infinite resolution crisp SVG vector barcode file', defaultPlan: 'weekly' },
  { id: 'barcode_export_pdf', name: 'PDF Print Sheet Document', desc: 'Download print-ready A4 barcode label document with crop marks', defaultPlan: 'weekly' },
  { id: 'barcode_export_print', name: 'Direct Thermal Printer Output', desc: 'Send ESC/POS raw barcode directly to thermal receipt & label printer', defaultPlan: 'weekly' }
];

export const ALL_BARCODE_EXPORT_QUALITIES = [
  { id: 'barcode_export_quality_low', name: 'Resolution: Low (512px)', desc: 'Standard low-density preview export (512px)', defaultPlan: 'free' },
  { id: 'barcode_export_quality_medium', name: 'Resolution: Normal (1024px)', desc: 'Sharp standard export (1024px)', defaultPlan: 'free' },
  { id: 'barcode_export_quality_hd', name: 'Resolution: HD (2048px)', desc: 'Crisp high-definition print resolution (2048px)', defaultPlan: 'weekly' },
  { id: 'barcode_export_quality_ultra', name: 'Resolution: 4K Ultra (4096px)', desc: 'Ultra 4K master vector-grade export (4096px)', defaultPlan: 'weekly' },
  { id: 'barcode_export_quality', name: 'HD & Vector Quality Scaler Engine', desc: 'Master quality scaler toggle in the export dropdown', defaultPlan: 'weekly' },
  { id: 'barcode_export_share', name: 'Native OS Share Sheet', desc: 'Share generated barcode directly to WhatsApp, Slack, Gmail & AirDrop', defaultPlan: 'free' }
];

// ─── 2. MAIN COMPONENT ───────────────────────────────────────────────────────

export default function VisualBarcodeControlStudio({ currentUser, isDark = false }) {
  const [liveFlagsMap, setLiveFlagsMap] = useState({});
  const [livePlans, setLivePlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('formats_1d');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [updatingKey, setUpdatingKey] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // 1. Real-time Firestore sync
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
  const handleToggleEnable = async (key, name, subcategory = 'Barcode Standard') => {
    setUpdatingKey(key);
    const current = getItemState(key).enabled;
    const nextState = !current;
    try {
      await setFeatureFlagCloud(key, nextState, { name, category: 'BARCODE_GENERATOR', subcategory });
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
      const keysToUpdate = [key];
      if (nextTier === 'free') {
        keysToUpdate.push('barcode_generator', 'home_quick_barcode');
      }
      await setFeaturesTierBatchCloud(keysToUpdate, nextTier);
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
      const allKeys = targetTier === 'free' ? [...new Set([...keysList, 'barcode_generator', 'home_quick_barcode'])] : keysList;
      await setFeaturesTierBatchCloud(allKeys, targetTier);
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
      await setFeatureFlagsBatchCloud(updates, { category: 'BARCODE_GENERATOR', subcategory });
      setLiveFlagsMap(prev => ({ ...prev, ...updates }));
      showToast(`✨ ${itemsList.length} items ${enable ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      showToast('❌ Batch update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // 4. Barcode features stats
  const totalBarcodeCount = useMemo(() => {
    return (
      ALL_1D_RETAIL_STANDARDS.length +
      ALL_1D_INDUSTRIAL_STANDARDS.length +
      ALL_1D_POSTAL_MEDICAL_STANDARDS.length +
      ALL_2D_MATRIX_STANDARDS.length +
      ALL_2D_STACKED_STANDARDS.length +
      ALL_BARCODE_COLOR_TOOLS.length +
      ALL_BARCODE_THEME_PRESETS.length +
      ALL_BARCODE_TEXT_TOOLS.length +
      ALL_BARCODE_SIZING_TOOLS.length +
      ALL_BARCODE_EXPORT_FORMATS.length +
      ALL_BARCODE_EXPORT_QUALITIES.length
    );
  }, []);

  // 5. 6 Main Navbar Category Tabs
  const TABS = [
    { id: 'formats_1d', label: '1. 1D Formats', count: ALL_1D_RETAIL_STANDARDS.length + ALL_1D_INDUSTRIAL_STANDARDS.length + ALL_1D_POSTAL_MEDICAL_STANDARDS.length, icon: Barcode },
    { id: 'formats_2d', label: '2. 2D Matrix', count: ALL_2D_MATRIX_STANDARDS.length + ALL_2D_STACKED_STANDARDS.length, icon: QrCode },
    { id: 'colors_styling', label: '3. Colors & Fills', count: ALL_BARCODE_COLOR_TOOLS.length + ALL_BARCODE_THEME_PRESETS.length, icon: Palette },
    { id: 'text_labels', label: '4. Text & Labels', count: ALL_BARCODE_TEXT_TOOLS.length, icon: Type },
    { id: 'sizing_geometry', label: '5. Dimensions & Sizing', count: ALL_BARCODE_SIZING_TOOLS.length, icon: Sliders },
    { id: 'export_quality', label: '6. Save & Export', count: ALL_BARCODE_EXPORT_FORMATS.length + ALL_BARCODE_EXPORT_QUALITIES.length, icon: Download }
  ];

  // Subcategory Tabs for each Main Category
  const SUB_TABS = useMemo(() => ({
    formats_1d: [
      { id: 'all', label: 'All 1D', count: ALL_1D_RETAIL_STANDARDS.length + ALL_1D_INDUSTRIAL_STANDARDS.length + ALL_1D_POSTAL_MEDICAL_STANDARDS.length, icon: Layers },
      { id: 'retail', label: 'Retail Formats', count: ALL_1D_RETAIL_STANDARDS.length, icon: Barcode },
      { id: 'industrial', label: 'Industrial Formats', count: ALL_1D_INDUSTRIAL_STANDARDS.length, icon: Box },
      { id: 'postal', label: 'Postal & Medical', count: ALL_1D_POSTAL_MEDICAL_STANDARDS.length, icon: Shield }
    ],
    formats_2d: [
      { id: 'all', label: 'All 2D', count: ALL_2D_MATRIX_STANDARDS.length + ALL_2D_STACKED_STANDARDS.length, icon: Layers },
      { id: 'matrix', label: 'Matrix Formats', count: ALL_2D_MATRIX_STANDARDS.length, icon: QrCode },
      { id: 'stacked', label: 'Stacked Formats', count: ALL_2D_STACKED_STANDARDS.length, icon: Layers }
    ],
    colors_styling: [
      { id: 'all', label: 'All Colors', count: ALL_BARCODE_COLOR_TOOLS.length + ALL_BARCODE_THEME_PRESETS.length, icon: Layers },
      { id: 'colors', label: 'Colors', count: ALL_BARCODE_COLOR_TOOLS.length, icon: Palette },
      { id: 'presets', label: 'Presets', count: ALL_BARCODE_THEME_PRESETS.length, icon: Bookmark }
    ],
    text_labels: [
      { id: 'all', label: 'All Text', count: ALL_BARCODE_TEXT_TOOLS.length, icon: Layers },
      { id: 'text', label: 'Text Controls', count: ALL_BARCODE_TEXT_TOOLS.length, icon: Type }
    ],
    sizing_geometry: [
      { id: 'all', label: 'All Dimensions', count: ALL_BARCODE_SIZING_TOOLS.length, icon: Layers },
      { id: 'sizing', label: 'Sizing', count: ALL_BARCODE_SIZING_TOOLS.length, icon: Sliders }
    ],
    export_quality: [
      { id: 'all', label: 'All Exports', count: ALL_BARCODE_EXPORT_FORMATS.length + ALL_BARCODE_EXPORT_QUALITIES.length, icon: Layers },
      { id: 'formats', label: 'Formats', count: ALL_BARCODE_EXPORT_FORMATS.length, icon: Download },
      { id: 'quality', label: 'Quality', count: ALL_BARCODE_EXPORT_QUALITIES.length, icon: Sparkles }
    ]
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Feedback Toast */}
      {feedbackToast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 18, 33, 0.96)', border: '1.5px solid #3B82F6',
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.15) 100%)',
            border: '1.5px solid rgba(59, 130, 246, 0.4)', color: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
          }}>
            <Barcode size={22} strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ad-text)', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Barcode Generator Studio
              </h1>
              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                {totalBarcodeCount} Standards &amp; Controls
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ad-text-sec)', margin: '3px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
              Granular Free/Pro controls for 1D retail, industrial, 2D matrix, stacked codes, color themes, fonts, dimensions &amp; export options.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--ad-text-sec)' }} />
          <input
            type="text"
            placeholder="Search EAN, UPC, Code 128, DataMatrix, fonts, sizing, colors..."
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
                  background: isActive ? '#3B82F6' : 'var(--ad-input)',
                  color: isActive ? '#FFFFFF' : 'var(--ad-text)',
                  fontSize: 11.5, fontWeight: isActive ? 800 : 600, whiteSpace: 'nowrap', cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.35)' : 'none'
                }}
              >
                <IconC size={13} strokeWidth={2.4} />
                <span>{t.label}</span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 10,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(150, 150, 150, 0.15)',
                  color: isActive ? '#FFFFFF' : 'var(--ad-text-sec)', fontWeight: 800
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
                    background: isSubActive ? 'rgba(59, 130, 246, 0.2)' : 'var(--ad-input)',
                    color: isSubActive ? '#3B82F6' : 'var(--ad-text-sec)',
                    fontSize: 11, fontWeight: isSubActive ? 800 : 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSubActive ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                >
                  {SubIcon && <SubIcon size={12} />}
                  <span>{st.label}</span>
                  {st.count !== undefined && (
                    <span style={{
                      fontSize: 8.5, padding: '1px 6px', borderRadius: 10,
                      background: isSubActive ? '#3B82F6' : 'var(--ad-card)',
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

      {/* ── Tab 1: 1D Formats (Retail, Industrial & Postal) ──────────────────── */}
      {activeTab === 'formats_1d' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Retail & Point-of-Sale */}
          {(activeSubTab === 'all' || activeSubTab === 'retail') && (
            <SectionCatalog
              title="Retail Formats"
              subtitle="Standard consumer packaging standards: EAN-13, EAN-8, UPC-A, UPC-E, ISBN, ISSN, ISMN"
              icon={Barcode}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_1D_RETAIL_STANDARDS.map(s => `barcode_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_1D_RETAIL_STANDARDS.map(s => `barcode_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_1D_RETAIL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_1D_RETAIL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_1D_RETAIL_STANDARDS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(std => {
                    const key = `barcode_${std.id}`;
                    const state = getItemState(key, true, std.defaultPlan);
                    return (
                      <BarcodeFormatControlTile
                        key={key}
                        standardKey={std.id}
                        name={std.name}
                        desc={std.desc}
                        tag={std.tag}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, std.name, '1D Standards')}
                        onToggleTier={() => handleToggleTier(key, std.name)}
                        isDark={isDark}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Logistics & Industrial */}
          {(activeSubTab === 'all' || activeSubTab === 'industrial') && (
            <SectionCatalog
              title="Industrial Formats"
              subtitle="High-density logistics, warehouse master cartons, inventory & telecom symbologies"
              icon={Box}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_1D_INDUSTRIAL_STANDARDS.map(s => `barcode_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_1D_INDUSTRIAL_STANDARDS.map(s => `barcode_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_1D_INDUSTRIAL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_1D_INDUSTRIAL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_1D_INDUSTRIAL_STANDARDS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(std => {
                    const key = `barcode_${std.id}`;
                    const state = getItemState(key, true, std.defaultPlan);
                    return (
                      <BarcodeFormatControlTile
                        key={key}
                        standardKey={std.id}
                        name={std.name}
                        desc={std.desc}
                        tag={std.tag}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, std.name, '1D Standards')}
                        onToggleTier={() => handleToggleTier(key, std.name)}
                        isDark={isDark}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 3: Postal & Medical */}
          {(activeSubTab === 'all' || activeSubTab === 'postal') && (
            <SectionCatalog
              title="Postal & Medical Formats"
              subtitle="USPS Postnet/Planet, UK Royal Mail RM4SCC, Telepen full-ASCII and pharmaceutical packaging controls"
              icon={Shield}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_1D_POSTAL_MEDICAL_STANDARDS.map(s => `barcode_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_1D_POSTAL_MEDICAL_STANDARDS.map(s => `barcode_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_1D_POSTAL_MEDICAL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_1D_POSTAL_MEDICAL_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '1D Standards')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_1D_POSTAL_MEDICAL_STANDARDS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(std => {
                    const key = `barcode_${std.id}`;
                    const state = getItemState(key, true, std.defaultPlan);
                    return (
                      <BarcodeFormatControlTile
                        key={key}
                        standardKey={std.id}
                        name={std.name}
                        desc={std.desc}
                        tag={std.tag}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, std.name, '1D Standards')}
                        onToggleTier={() => handleToggleTier(key, std.name)}
                        isDark={isDark}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 2: 2D Matrix & Stacked Formats ──────────────────────────────── */}
      {activeTab === 'formats_2d' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: 2D Matrix Formats */}
          {(activeSubTab === 'all' || activeSubTab === 'matrix') && (
            <SectionCatalog
              title="Matrix Formats"
              subtitle="Data Matrix, Aztec Transit Code, GS1 DataBar Omni, MaxiCode, Micro QR and Han Xin Code"
              icon={QrCode}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_2D_MATRIX_STANDARDS.map(s => `barcode_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_2D_MATRIX_STANDARDS.map(s => `barcode_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_2D_MATRIX_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '2D Standards')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_2D_MATRIX_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '2D Standards')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_2D_MATRIX_STANDARDS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(std => {
                    const key = `barcode_${std.id}`;
                    const state = getItemState(key, true, std.defaultPlan);
                    return (
                      <BarcodeFormatControlTile
                        key={key}
                        standardKey={std.id}
                        name={std.name}
                        desc={std.desc}
                        tag={std.tag}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, std.name, '2D Standards')}
                        onToggleTier={() => handleToggleTier(key, std.name)}
                        isDark={isDark}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: 2D Multi-Row Stacked Formats */}
          {(activeSubTab === 'all' || activeSubTab === 'stacked') && (
            <SectionCatalog
              title="Stacked Formats"
              subtitle="High-capacity stacked formats: PDF417 for government IDs, Codablock F, Code 16K & Code 49"
              icon={Layers}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_2D_STACKED_STANDARDS.map(s => `barcode_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_2D_STACKED_STANDARDS.map(s => `barcode_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_2D_STACKED_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '2D Standards')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_2D_STACKED_STANDARDS.map(s => ({ key: `barcode_${s.id}`, name: s.name })), '2D Standards')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_2D_STACKED_STANDARDS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(std => {
                    const key = `barcode_${std.id}`;
                    const state = getItemState(key, true, std.defaultPlan);
                    return (
                      <BarcodeFormatControlTile
                        key={key}
                        standardKey={std.id}
                        name={std.name}
                        desc={std.desc}
                        tag={std.tag}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, std.name, '2D Standards')}
                        onToggleTier={() => handleToggleTier(key, std.name)}
                        isDark={isDark}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 3: Colors & Styling ─────────────────────────────────────────── */}
      {activeTab === 'colors_styling' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: Color Controls */}
          {(activeSubTab === 'all' || activeSubTab === 'colors') && (
            <SectionCatalog
              title="Colors"
              subtitle="Pick custom foreground bar colors, canvas background colors, transparency & gradient fills"
              icon={Palette}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_COLOR_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_COLOR_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_COLOR_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_COLOR_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_COLOR_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BarcodeToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Barcode Appearance')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Color Theme Presets */}
          {(activeSubTab === 'all' || activeSubTab === 'presets') && (
            <SectionCatalog
              title="Presets"
              subtitle="Pre-styled multi-color swatch themes for instant 1-click styling in the mobile app"
              icon={Bookmark}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_THEME_PRESETS.map(p => `barcode_theme_${p.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_THEME_PRESETS.map(p => `barcode_theme_${p.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_THEME_PRESETS.map(p => ({ key: `barcode_theme_${p.id}`, name: p.name })), 'Barcode Appearance')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_THEME_PRESETS.map(p => ({ key: `barcode_theme_${p.id}`, name: p.name })), 'Barcode Appearance')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_THEME_PRESETS
                  .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(preset => {
                    const key = `barcode_theme_${preset.id}`;
                    const state = getItemState(key, true, 'free');
                    return (
                      <BarcodeThemePresetTile
                        key={key}
                        preset={preset}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, preset.name, 'Barcode Appearance')}
                        onToggleTier={() => handleToggleTier(key, preset.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 4: Text & Typography ────────────────────────────────────────── */}
      {activeTab === 'text_labels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(activeSubTab === 'all' || activeSubTab === 'text') && (
            <SectionCatalog
              title="Text Controls"
              subtitle="Toggle digits under bars, font selection, custom font file uploads, top title captions & checksum highlights"
              icon={Type}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_TEXT_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_TEXT_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_TEXT_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_TEXT_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_TEXT_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BarcodeToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Barcode Appearance')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 5: Dimensions & Sizing ───────────────────────────────────────── */}
      {activeTab === 'sizing_geometry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(activeSubTab === 'all' || activeSubTab === 'sizing') && (
            <SectionCatalog
              title="Sizing"
              subtitle="Bar width multiplier, vertical height scaler, quiet zone margins, 90°/180° rotation & guard bars"
              icon={Sliders}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_SIZING_TOOLS.map(t => t.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_SIZING_TOOLS.map(t => t.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_SIZING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_SIZING_TOOLS.map(t => ({ key: t.id, name: t.name })), 'Barcode Appearance')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_SIZING_TOOLS
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tool => {
                    const state = getItemState(tool.id, true, tool.defaultPlan);
                    const ToolIcon = tool.icon;
                    return (
                      <BarcodeToolControlTile
                        key={tool.id}
                        name={tool.name}
                        desc={tool.desc}
                        icon={ToolIcon}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === tool.id}
                        onToggleEnable={() => handleToggleEnable(tool.id, tool.name, 'Barcode Appearance')}
                        onToggleTier={() => handleToggleTier(tool.id, tool.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── Tab 6: Save & Export ────────────────────────────────────────────── */}
      {activeTab === 'export_quality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subcategory 1: File Formats */}
          {(activeSubTab === 'all' || activeSubTab === 'formats') && (
            <SectionCatalog
              title="Formats"
              subtitle="High-res PNG, compressed JPG, scalable SVG vectors, printable A4 PDF documents & thermal printer output"
              icon={Download}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_EXPORT_FORMATS.map(f => f.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_EXPORT_FORMATS.map(f => f.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_EXPORT_FORMATS.map(f => ({ key: f.id, name: f.name })), 'Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_EXPORT_FORMATS.map(f => ({ key: f.id, name: f.name })), 'Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_EXPORT_FORMATS
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(fmt => {
                    const state = getItemState(fmt.id, true, fmt.defaultPlan);
                    return (
                      <BarcodeToolControlTile
                        key={fmt.id}
                        name={fmt.name}
                        desc={fmt.desc}
                        icon={fmt.id.includes('print') ? Printer : (fmt.id.includes('pdf') ? FileText : Download)}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === fmt.id}
                        onToggleEnable={() => handleToggleEnable(fmt.id, fmt.name, 'Export')}
                        onToggleTier={() => handleToggleTier(fmt.id, fmt.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Quality & Sharing */}
          {(activeSubTab === 'all' || activeSubTab === 'quality') && (
            <SectionCatalog
              title="Quality"
              subtitle="Control Low (512px), Normal (1024px), HD (2048px), 4K Ultra (4096px) resolution & native sharing"
              icon={Sparkles}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_BARCODE_EXPORT_QUALITIES.map(q => q.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_BARCODE_EXPORT_QUALITIES.map(q => q.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_BARCODE_EXPORT_QUALITIES.map(q => ({ key: q.id, name: q.name })), 'Export')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_BARCODE_EXPORT_QUALITIES.map(q => ({ key: q.id, name: q.name })), 'Export')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {ALL_BARCODE_EXPORT_QUALITIES
                  .filter(q => !searchQuery || q.name.toLowerCase().includes(searchQuery.toLowerCase()) || q.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(qual => {
                    const state = getItemState(qual.id, true, qual.defaultPlan);
                    return (
                      <BarcodeToolControlTile
                        key={qual.id}
                        name={qual.name}
                        desc={qual.desc}
                        icon={qual.id.includes('share') ? Share2 : Sparkles}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === qual.id}
                        onToggleEnable={() => handleToggleEnable(qual.id, qual.name, 'Export')}
                        onToggleTier={() => handleToggleTier(qual.id, qual.name)}
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
// 3. REUSABLE ITEM CONTROL TILES
// ═════════════════════════════════════════════════════════════════════════

function BarcodeFormatControlTile({ standardKey, name, desc, tag, enabled, isPaid, updating, onToggleEnable, onToggleTier, isDark }) {
  const isOff = !enabled;

  return (
    <div style={{
      background: isOff ? (isDark ? 'rgba(15, 18, 33, 0.4)' : '#F8FAFC') : (isPaid ? (isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB') : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF')),
      border: 'none',
      borderRadius: 14, padding: '10px 10px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      gap: 8, opacity: isOff ? 0.65 : 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isPaid ? '0 4px 14px rgba(245, 158, 11, 0.08)' : (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)')
    }}>
      {/* Live Barcode Canvas Preview */}
      <MiniBarcodeCanvas standardKey={standardKey} name={name} isDark={isDark} />

      {/* Details */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span style={{
            fontSize: 11.5, fontWeight: 900, color: 'var(--ad-text)', lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {name}
          </span>
          {tag && (
            <span style={{
              fontSize: 8.5, fontWeight: 800, padding: '1px 5px', borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', whiteSpace: 'nowrap', flexShrink: 0
            }}>
              {tag}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 9.5, color: 'var(--ad-text-sec)', marginTop: 3,
          lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
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

function BarcodeToolControlTile({ name, desc, icon: Icon, enabled, isPaid, updating, onToggleEnable, onToggleTier }) {
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
      {/* Tool Icon Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(59, 130, 246, 0.12)', borderRadius: 10, padding: '6px 8px'
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={14} strokeWidth={2.4} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: 9.5, color: 'var(--ad-text-sec)',
        lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 25
      }}>
        {desc}
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

function BarcodeThemePresetTile({ preset, enabled, isPaid, updating, onToggleEnable, onToggleTier }) {
  const isOff = !enabled;

  return (
    <div style={{
      background: isOff ? 'rgba(15, 18, 33, 0.4)' : (isPaid ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.04)'),
      border: 'none',
      borderRadius: 12, padding: '8px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      gap: 6, opacity: isOff ? 0.65 : 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Color Preview Swatch Pill */}
      <div style={{
        height: 32, borderRadius: 8, background: preset.bg,
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 8px', gap: 3
      }}>
        {/* Simulated Barcode Stripes */}
        <div style={{ width: 3, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 1.5, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 4, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 2, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 3.5, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 1.5, height: 20, background: preset.bar, borderRadius: 1 }} />
        <div style={{ width: 3, height: 20, background: preset.bar, borderRadius: 1 }} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ad-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preset.name}
        </div>
        <div style={{ fontSize: 8.5, color: 'var(--ad-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preset.desc}
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 4, borderTop: '1px solid var(--ad-border)', gap: 3
      }}>
        <button
          type="button"
          disabled={updating}
          onClick={onToggleEnable}
          style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '3px 6px',
            borderRadius: 6, border: 'none',
            background: enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: enabled ? '#22C55E' : '#EF4444', fontSize: 8.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer'
          }}
        >
          <span>{enabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          disabled={updating}
          onClick={onToggleTier}
          style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '3px 8px',
            borderRadius: 100, border: 'none',
            background: isPaid ? '#F59E0B' : '#10B981',
            color: '#FFFFFF', fontSize: 8.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer'
          }}
        >
          {isPaid ? <Crown size={8} fill="#fff" color="#fff" /> : <Shield size={8} />}
          <span>{isPaid ? 'PRO' : 'FREE'}</span>
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 4. MINI CANVAS RENDERER FOR LIVE BARCODES
// ═════════════════════════════════════════════════════════════════════════

function MiniBarcodeCanvas({ standardKey, name, defaultValue, isDark = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    try {
      const std = BARCODE_STANDARDS[standardKey];
      const val = defaultValue || std?.defaultValue || '12345678';
      renderBarcode(canvas, val, {
        bcid: standardKey,
        barColor: isDark ? '#F1F5F9' : '#0F172A',
        bgColor: isDark ? '#151928' : '#FFFFFF',
        barWidth: 1.2,
        height: 26,
        margin: 2,
        displayValue: false
      });
    } catch {
      // Fallback safe simulation
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDark ? '#151928' : '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDark ? '#94A3B8' : '#334155';
      for (let x = 6; x < canvas.width - 6; x += 4) {
        if ((x % 3) !== 0) {
          ctx.fillRect(x, 4, 2, canvas.height - 8);
        }
      }
    }
  }, [standardKey, defaultValue, isDark]);

  return (
    <div style={{
      width: '100%',
      height: 44,
      borderRadius: 8,
      background: isDark ? '#151928' : '#FFFFFF',
      border: '1px solid var(--ad-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '2px'
    }}>
      <canvas ref={canvasRef} width={120} height={36} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 5. REUSABLE SUB-CONTAINER CATALOG CARD (Mobile-First UX)
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
            color: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
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
