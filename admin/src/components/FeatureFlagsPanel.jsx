// src/components/admin/FeatureFlagsPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Mobile-First Feature Flags & App Capabilities Management System
// Controls all 140+ granular features across the 8 pure core categories & subcategories
// plus production rollout flags in the exact same sleek, modern mobile-first UI/UX.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flag, Plus, Search, Filter, ChevronRight, ArrowLeft, MoreVertical,
  CheckCircle2, XCircle, AlertCircle, Clock, Copy, Check, Trash2, Edit3,
  Sliders, Globe, Users, Shield, Crown, BarChart2, Layers, Palette,
  Sparkles, Cpu, Download, Cloud, ScanLine, MapPin, FlaskConical,
  TrendingUp, RefreshCw, X, Radio, QrCode, Barcode, LayoutDashboard,
  Bookmark, ClipboardList, Settings, Package, Zap, Save, CheckSquare, Square,
  MinusSquare, CheckCheck, Power, RotateCcw, ToggleLeft, ToggleRight, ListFilter,
  Pencil, Image as ImageIcon, Type, Camera, Scan, Heart, History, HardDrive,
  FileSpreadsheet, FileCheck
} from 'lucide-react';
import {
  FEATURE_REGISTRY,
  FEATURE_CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  CANONICAL_PLANS,
  DEFAULT_FREE_FEATURES,
  DEFAULT_PAID_FEATURES
} from '../services/FeatureAccessManager';
import {
  subscribeFeatureFlags,
  toggleFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  FLAG_CATEGORIES,
  ENVIRONMENTS,
  TARGETING_OPTIONS,
  getTargetingLabel,
  INITIAL_FEATURE_FLAGS
} from '../services/featureFlagsService';
import { setFeatureFlagCloud, setPlanFeaturesCloud, saveFeatureFlags, setFeaturesTierBatchCloud } from '../services/adminDataService';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { useAdminTheme } from './AdminUIKit';

// ── Core Categories Metadata (Excludes QR, Barcode & Bulk studios which have dedicated visual studios) ──
const CATEGORY_META = {
  ALL:               { id: 'ALL',               name: 'All Features',       icon: Sliders,          color: '#FF4D9D' },
  SCANNER:           { id: 'SCANNER',           name: 'Scanner',            icon: ScanLine,         color: '#10B981' },
  HOME:              { id: 'HOME',              name: 'Home Screen',        icon: LayoutDashboard,  color: '#F59E0B' },
  SAVED:             { id: 'SAVED',             name: 'Saved',              icon: Bookmark,         color: '#EC4899' },
  HISTORY:           { id: 'HISTORY',           name: 'History',            icon: ClipboardList,    color: '#06B6D4' },
  SETTINGS:          { id: 'SETTINGS',          name: 'Settings',           icon: Settings,         color: '#64748B' },
  ROLLOUT:           { id: 'ROLLOUT',           name: 'Rollout Flags',      icon: Flag,             color: '#7B61FF' },
};

// ── Subcategory Metadata (Exact Icons Matching Main App Toolbar & Tabs) ──
const SUBCATEGORY_META = {
  // Scanner Subcategories
  'Camera Lens':        { icon: Camera,          color: '#10B981', label: 'Camera Lens' },
  'Detection':          { icon: Scan,            color: '#3B82F6', label: 'Detection' },
  'Scan Results':       { icon: FileCheck,       color: '#8B5CF6', label: 'Scan Results' },

  // Home Screen Subcategories
  'Dashboard':          { icon: LayoutDashboard, color: '#F59E0B', label: 'Dashboard' },
  'Quick Actions':      { icon: Zap,             color: '#D60036', label: 'Quick Actions' },

  // Saved Subcategories
  'Collection':         { icon: Bookmark,        color: '#EC4899', label: 'Collection' },
  'Save / Remove':      { icon: Heart,           color: '#D60036', label: 'Save / Remove' },
  'Search & Filter':    { icon: Search,          color: '#3B82F6', label: 'Search & Filter' },

  // History Subcategories
  'History View':       { icon: History,         color: '#06B6D4', label: 'History View' },
  'Automatic History':  { icon: Clock,           color: '#8B5CF6', label: 'Auto History' },
  'History Management': { icon: Trash2,          color: '#EF4444', label: 'Management' },

  // Settings Subcategories
  'General & Theme':    { icon: Palette,         color: '#64748B', label: 'Theme & UI' },
  'Storage':            { icon: HardDrive,       color: '#3B82F6', label: 'Storage' },
  'Cloud & Sync':       { icon: Cloud,           color: '#06B6D4', label: 'Cloud Sync' },
  'Account & Security': { icon: Shield,          color: '#10B981', label: 'Security' },
};

const PLAN_COLORS = {
  free:    '#8B8FA8',
  weekly:  '#8B5CF6',
  monthly: '#F59E0B',
  yearly:  '#D60036'
};

const PLAN_LABELS = {
  free:    'Free Tier',
  weekly:  'Weekly Pro',
  monthly: 'Monthly Pro',
  yearly:  'Yearly Pro'
};

export default function FeatureFlagsPanel({ 
  currentUser, 
  isDark: propIsDark,
  fixedCategory,
  titleOverride,
  subtitleOverride
}) {
  const theme = useAdminTheme();
  const isDark = propIsDark !== undefined ? propIsDark : (theme?.isDark ?? false);

  // ── States ─────────────────────────────────────────────────────────────
  const [liveFlagsMap, setLiveFlagsMap] = useState({});
  const [customFlags, setCustomFlags] = useState([]);
  const [livePlans, setLivePlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('list'); // 'list' | 'details' | 'create' | 'edit'
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Filters, Selection & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'enabled' | 'disabled'
  const [selectedCategory, setSelectedCategory] = useState(fixedCategory || 'ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'free' | 'paid' | 'weekly' | 'monthly' | 'yearly'
  const [envFilter, setEnvFilter] = useState('all');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [viewLayout, setViewLayout] = useState('cards'); // 'cards' | 'table'

  useEffect(() => {
    if (fixedCategory) {
      setSelectedCategory(fixedCategory);
      setSelectedSubcategory('ALL');
    }
  }, [fixedCategory]);

  // Create / Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    category: 'QR_GENERATOR',
    subcategory: 'General',
    environment: 'Production',
    enabled: true,
    targeting: 'all',
    rolloutPercentage: 100,
    icon: 'Flag',
    iconColor: '#FF4D9D',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [savingPlanId, setSavingPlanId] = useState(null);

  // ── Real-time Firestore Subscriptions ──────────────────────────────────
  useEffect(() => {
    setLoading(true);

    // 1. Listen to global_config/featureFlags map
    const unsubGlobal = onSnapshot(doc(db, 'global_config', 'featureFlags'), snap => {
      if (snap.exists()) {
        setLiveFlagsMap(snap.data() || {});
      }
      setLoading(false);
    }, () => setLoading(false));

    // 2. Listen to standalone featureFlags collection (custom flags & rollouts)
    const unsubCollection = subscribeFeatureFlags(data => {
      setCustomFlags(data || []);
      setLoading(false);
    }, () => setLoading(false));

    // 3. Listen to subscription_plans to observe active plan entitlements
    const unsubPlans = onSnapshot(collection(db, 'subscription_plans'), colSnap => {
      const plans = {};
      colSnap.forEach(d => { plans[d.id] = d.data(); });
      setLivePlans(plans);
    }, () => {});

    return () => {
      unsubGlobal?.();
      unsubCollection?.();
      unsubPlans?.();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Helper: Check if feature is in any paid plan (Free tier features are never PRO) ──
  const checkIsPaidFeature = (featureKey, defaultPlan) => {
    // 1. If feature is included in the Free tier, it is FREE for all users -> Never show PRO badge
    const freeFeatures = livePlans['free']?.features || DEFAULT_FREE_FEATURES;
    if (freeFeatures.includes(featureKey)) {
      return false;
    }

    // 2. Check if included in any paid tier (weekly, monthly, yearly)
    const paidTiers = ['weekly', 'monthly', 'yearly'];
    const isInLivePaid = paidTiers.some(pId => {
      const feats = livePlans[pId]?.features || DEFAULT_PAID_FEATURES;
      return feats.includes(featureKey);
    });

    if (isInLivePaid) return true;
    return Boolean(defaultPlan && defaultPlan !== 'free');
  };

  // ── Filtered Features List (QR, Barcode & Bulk features managed in dedicated studios) ──
  const allFeatures = useMemo(() => {
    // 1. Canonical registry features excluding QR, Barcode, and Bulk studios
    const filteredRegistry = FEATURE_REGISTRY.filter(
      f => f.category !== 'QR_GENERATOR' && f.category !== 'BARCODE_GENERATOR' && f.category !== 'BULK_GENERATOR'
    );
    const registryItems = filteredRegistry.map(f => {
      const isEnabled = liveFlagsMap[f.featureId] !== undefined 
        ? Boolean(liveFlagsMap[f.featureId]) 
        : Boolean(f.defaultEnabled);

      const catMeta = CATEGORY_META[f.category] || CATEGORY_META.SETTINGS;
      const subMeta = SUBCATEGORY_META[f.subcategory];
      const isPaid = checkIsPaidFeature(f.featureId, f.defaultPlan);

      // Distinct Subcategory Icon & Color for granular visual recognition
      const featureIcon = subMeta?.icon || catMeta.icon || Flag;
      const featureColor = subMeta?.color || catMeta.color || '#FF4D9D';

      return {
        id: f.featureId,
        key: f.featureId,
        name: f.displayName,
        description: f.description || '',
        category: f.category,
        categoryName: catMeta?.name || f.category,
        subcategory: f.subcategory || 'General',
        environment: 'Production',
        enabled: isEnabled,
        icon: featureIcon,
        iconColor: featureColor,
        iconBg: `${featureColor}18`,
        categoryIcon: catMeta?.icon || Flag,
        categoryColor: catMeta?.color || '#FF4D9D',
        defaultPlan: f.defaultPlan || 'free',
        isPaid: isPaid,
        isCanonical: true,
        targeting: 'all',
        rolloutPercentage: 100,
        requiresAuthentication: f.requiresAuthentication,
        updatedAt: liveFlagsMap._updatedAt || null,
      };
    });

    // 2. Additional custom & rollout flags from collection
    const rolloutItems = customFlags
      .filter(cf => !FEATURE_REGISTRY.some(r => r.featureId === (cf.key || cf.id)))
      .map(cf => {
        const isEnabled = cf.enabled !== undefined 
          ? Boolean(cf.enabled) 
          : (liveFlagsMap[cf.key] !== undefined ? Boolean(liveFlagsMap[cf.key]) : true);

        return {
          id: cf.id,
          key: cf.key || cf.id,
          name: cf.name || cf.id,
          description: cf.description || '',
          category: 'ROLLOUT',
          categoryName: 'Rollout Flags',
          subcategory: cf.category || 'Production',
          environment: cf.environment || 'Production',
          enabled: isEnabled,
          icon: Flag,
          iconColor: '#7B61FF',
          iconBg: 'rgba(123, 97, 255, 0.14)',
          defaultPlan: 'all',
          isPaid: false,
          isCanonical: false,
          targeting: cf.targeting || 'all',
          rolloutPercentage: cf.rolloutPercentage ?? 100,
          updatedAt: cf.updatedAt || cf.createdAt,
        };
      });

    return [...registryItems, ...rolloutItems];
  }, [liveFlagsMap, customFlags, livePlans]);

  // ── Filtered Features ──────────────────────────────────────────────────
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter(f => {
      // 1. Search filter (name, key, description, category, subcategory)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (f.name || '').toLowerCase().includes(q);
        const matchKey = (f.key || '').toLowerCase().includes(q);
        const matchDesc = (f.description || '').toLowerCase().includes(q);
        const matchCat = (f.categoryName || '').toLowerCase().includes(q);
        const matchSub = (f.subcategory || '').toLowerCase().includes(q);
        if (!matchName && !matchKey && !matchDesc && !matchCat && !matchSub) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;

      // 3. Subcategory filter
      if (selectedSubcategory !== 'ALL' && f.subcategory !== selectedSubcategory) return false;

      // 4. Status filter
      if (statusFilter === 'enabled' && !f.enabled) return false;
      if (statusFilter === 'disabled' && f.enabled) return false;

      // 5. Environment filter
      if (envFilter !== 'all' && f.environment !== envFilter) return false;

      // 6. Plan Filter
      if (planFilter === 'paid') {
        if (!f.isPaid) return false;
      } else if (planFilter === 'free') {
        const freeFeats = livePlans.free?.features || DEFAULT_FREE_FEATURES;
        if (!freeFeats.includes(f.key)) return false;
      } else if (planFilter !== 'all') {
        const planFeats = livePlans[planFilter]?.features || (planFilter === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
        if (!planFeats.includes(f.key)) return false;
      }

      return true;
    });
  }, [allFeatures, searchQuery, selectedCategory, selectedSubcategory, statusFilter, envFilter, planFilter, livePlans]);

  // ── Overall Statistics ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allFeatures.length;
    const enabled = allFeatures.filter(f => f.enabled).length;
    const disabled = total - enabled;
    const paidCount = allFeatures.filter(f => f.isPaid).length;
    const enabledPct = total > 0 ? ((enabled / total) * 100).toFixed(0) : '0';
    const disabledPct = total > 0 ? ((disabled / total) * 100).toFixed(0) : '0';

    return { total, enabled, disabled, paidCount, enabledPct, disabledPct };
  }, [allFeatures]);

  // ── Category Counts ────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts = { ALL: allFeatures.length };
    Object.keys(CATEGORY_META).forEach(k => {
      if (k === 'ALL') return;
      counts[k] = allFeatures.filter(f => f.category === k).length;
    });
    return counts;
  }, [allFeatures]);

  // ── Available Subcategories for Active Category ────────────────────────
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'ALL' || selectedCategory === 'ROLLOUT') return [];
    return CATEGORY_SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  // ── Toggle Switch Handler ──────────────────────────────────────────────
  const handleToggle = async (feature, e) => {
    if (e) e.stopPropagation();
    const nextState = !feature.enabled;

    // 1. Optimistic UI update
    setLiveFlagsMap(prev => ({ ...prev, [feature.key]: nextState }));

    try {
      // 2. Persist to Firestore global config
      await setFeatureFlagCloud(feature.key, nextState);

      // 3. If it is also a standalone collection doc, update it too
      if (!feature.isCanonical) {
        await toggleFeatureFlag(feature.id, nextState, currentUser);
      }

      showToast(`"${feature.name}" is now ${nextState ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      // Revert optimistic update on failure
      setLiveFlagsMap(prev => ({ ...prev, [feature.key]: feature.enabled }));
      showToast(`Failed to update ${feature.name}: ${err?.message}`);
    }
  };

  // ── Toggle Plan Entitlement Handler ────────────────────────────────────
  const handleTogglePlan = async (planId, featureId) => {
    setSavingPlanId(planId);
    try {
      const currentFeatures = livePlans[planId]?.features || (planId === 'free' ? [...DEFAULT_FREE_FEATURES] : [...DEFAULT_PAID_FEATURES]);
      const hasFeature = currentFeatures.includes(featureId);
      const nextFeatures = hasFeature 
        ? currentFeatures.filter(id => id !== featureId)
        : [...new Set([...currentFeatures, featureId])];

      await setPlanFeaturesCloud(planId, nextFeatures);
      showToast(`${hasFeature ? 'Removed from' : 'Added to'} ${PLAN_LABELS[planId] || planId}`);
    } catch (err) {
      showToast(`Error updating plan: ${err?.message}`);
    } finally {
      setSavingPlanId(null);
    }
  };

  // ── 1-Click Instant Tier (Free vs Pro) Batch & Single Setter ────────────
  const [tierUpdatingKey, setTierUpdatingKey] = useState(null);

  const handleSetFeatureTier = async (keys, targetTier) => {
    if (!Array.isArray(keys) || keys.length === 0) return;
    setBulkProcessing(true);
    if (keys.length === 1) setTierUpdatingKey(keys[0]);
    try {
      await setFeaturesTierBatchCloud(keys, targetTier);
      showToast(
        keys.length === 1
          ? `Feature switched to ${targetTier === 'free' ? 'FREE Tier 🛡️' : 'PRO Tier 👑'}`
          : `${keys.length} features switched to ${targetTier === 'free' ? 'FREE Tier 🛡️' : 'PRO Tier 👑'}`
      );
    } catch (err) {
      showToast(`Error updating tier: ${err?.message}`);
    } finally {
      setBulkProcessing(false);
      setTierUpdatingKey(null);
    }
  };

  // ── Open Details Drawer ────────────────────────────────────────────────
  const openDetails = (feat) => {
    setSelectedFeature(feat);
    setActiveMode('details');
  };

  // ── Open Create / Edit Modal ───────────────────────────────────────────
  const openCreateModal = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      category: selectedCategory !== 'ALL' ? selectedCategory : 'QR_GENERATOR',
      subcategory: selectedSubcategory !== 'ALL' ? selectedSubcategory : 'General',
      environment: 'Production',
      enabled: true,
      targeting: 'all',
      rolloutPercentage: 100,
      icon: 'Flag',
      iconColor: '#FF4D9D',
    });
    setFormErrors({});
    setActiveMode('create');
  };

  const openEditModal = (feat) => {
    setSelectedFeature(feat);
    setFormData({
      name: feat.name || '',
      key: feat.key || feat.id,
      description: feat.description || '',
      category: feat.category || 'QR_GENERATOR',
      subcategory: feat.subcategory || 'General',
      environment: feat.environment || 'Production',
      enabled: Boolean(feat.enabled),
      targeting: feat.targeting || 'all',
      rolloutPercentage: Number(feat.rolloutPercentage ?? 100),
      icon: 'Flag',
      iconColor: feat.iconColor || '#FF4D9D',
    });
    setFormErrors({});
    setActiveMode('edit');
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    showToast(`Copied "${key}" to clipboard!`);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Flag name is required.';
    if (activeMode === 'create') {
      const cleanKey = formData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!cleanKey) errors.key = 'Valid flag key is required.';
      else if (cleanKey.length < 2) errors.key = 'Key must be at least 2 characters.';
      formData.key = cleanKey;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (activeMode === 'create') {
        await createFeatureFlag(formData, currentUser);
        await setFeatureFlagCloud(formData.key, formData.enabled);
        showToast(`Feature flag "${formData.name}" created successfully!`);
      } else {
        await updateFeatureFlag(selectedFeature.id, formData, currentUser);
        await setFeatureFlagCloud(formData.key, formData.enabled);
        showToast(`Feature flag "${formData.name}" updated!`);
      }
      setActiveMode('list');
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to save feature flag.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;
    try {
      await deleteFeatureFlag(selectedFeature.id, currentUser);
      await setFeatureFlagCloud(selectedFeature.key, false);
      showToast(`Flag "${selectedFeature.name}" deleted.`);
      setActiveMode('list');
      setDeleteConfirm(false);
    } catch (err) {
      showToast(`Failed to delete: ${err?.message}`);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedCategory('ALL');
    setSelectedSubcategory('ALL');
    setPlanFilter('all');
    setEnvFilter('all');
    setFilterOpen(false);
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedSubcategory !== 'ALL' ? 1 : 0) +
    (planFilter !== 'all' ? 1 : 0) +
    (envFilter !== 'all' ? 1 : 0);

  // ── Multi-Select Helpers ───────────────────────────────────────────────
  const isAllVisibleSelected = useMemo(() => {
    if (filteredFeatures.length === 0) return false;
    return filteredFeatures.every(f => selectedKeys.has(f.key));
  }, [filteredFeatures, selectedKeys]);

  const isSomeVisibleSelected = useMemo(() => {
    if (filteredFeatures.length === 0) return false;
    const count = filteredFeatures.filter(f => selectedKeys.has(f.key)).length;
    return count > 0 && count < filteredFeatures.length;
  }, [filteredFeatures, selectedKeys]);

  const handleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        filteredFeatures.forEach(f => next.delete(f.key));
        return next;
      });
    } else {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        filteredFeatures.forEach(f => next.add(f.key));
        return next;
      });
    }
  };

  const handleSelectAllOverall = () => {
    setSelectedKeys(new Set(allFeatures.map(f => f.key)));
    showToast(`Selected all ${allFeatures.length} features`);
  };

  const handleClearSelection = () => {
    setSelectedKeys(new Set());
  };

  const handleToggleSelectOne = (key, e) => {
    if (e) e.stopPropagation();
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Bulk Actions Handler (Turn ON / Turn OFF / Plan Updates) ───────────
  const handleBulkToggle = async (enableState, customKeys = null) => {
    const targetKeys = customKeys || Array.from(selectedKeys);
    if (targetKeys.length === 0) return;

    setBulkProcessing(true);
    const updatedMap = { ...liveFlagsMap };
    targetKeys.forEach(k => {
      updatedMap[k] = enableState;
    });

    // 1. Optimistic local update
    setLiveFlagsMap(updatedMap);

    try {
      // 2. Persist to Firestore global config in single atomic write
      await saveFeatureFlags(updatedMap);
      showToast(`${targetKeys.length} features ${enableState ? 'ENABLED (Turned ON)' : 'DISABLED (Turned OFF)'}`);
      if (!customKeys) {
        setSelectedKeys(new Set());
      }
    } catch (err) {
      showToast(`Batch update failed: ${err?.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleTurnAllVisibleOn = () => {
    const visibleKeys = filteredFeatures.map(f => f.key);
    handleBulkToggle(true, visibleKeys);
  };

  const handleTurnAllVisibleOff = () => {
    const visibleKeys = filteredFeatures.map(f => f.key);
    handleBulkToggle(false, visibleKeys);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: 1. DETAILS DRAWER / VIEW
  // ═════════════════════════════════════════════════════════════════════════
  if (activeMode === 'details' && selectedFeature) {
    const IconComponent = selectedFeature.icon || Flag;
    const subMeta = SUBCATEGORY_META[selectedFeature.subcategory];
    const SubIcon = subMeta?.icon || Sliders;

    return (
      <div style={{ maxWidth: 840, margin: '0 auto', animation: 'adSlideIn 0.2s ease', padding: '0 4px' }}>
        {toastMessage && <Toast message={toastMessage} />}

        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveMode('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', color: 'var(--ad-text)',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: 0
            }}
          >
            <ArrowLeft size={18} />
            <span>Feature Details</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => openEditModal(selectedFeature)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10,
                background: 'rgba(255, 77, 157, 0.12)', color: '#FF4D9D',
                border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Edit3 size={13} /> Edit
            </button>
            {!selectedFeature.isCanonical && (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
              Are you sure you want to permanently delete this feature flag?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(false)} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--ad-input)', border: 'none', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{ padding: '6px 12px', borderRadius: 8, background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* Main Details Card (Mobile First) */}
        <div style={{
          background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
          borderRadius: 18, padding: '16px', boxShadow: 'var(--ad-card-shadow)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {/* Header Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: selectedFeature.iconBg, color: selectedFeature.iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <IconComponent size={22} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ad-text)', margin: 0, wordBreak: 'break-word' }}>
                  {selectedFeature.name}
                </h2>
                {selectedFeature.isPaid ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 7px', borderRadius: 100,
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(214, 0, 54, 0.15))',
                    color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: 10, fontWeight: 800
                  }}>
                    <Crown size={10} color="#F59E0B" strokeWidth={2.5} /> PRO
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 7px', borderRadius: 100,
                    background: 'rgba(139, 143, 168, 0.15)',
                    color: '#8B8FA8', fontSize: 10, fontWeight: 700
                  }}>
                    FREE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', marginTop: 4, lineHeight: 1.4 }}>
                {selectedFeature.description || 'Controls runtime capability in Mushi QR Pro application.'}
              </div>
            </div>
          </div>

          {/* Global Status Banner / Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12, background: 'var(--ad-input)',
            border: '1px solid var(--ad-border)'
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ad-text-sec)' }}>Global Runtime Flag</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: selectedFeature.enabled ? '#22C55E' : '#EF4444', marginTop: 1 }}>
                {selectedFeature.enabled ? 'Enabled Everywhere' : 'Turned OFF'}
              </div>
            </div>
            <button
              onClick={() => handleToggle(selectedFeature)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100, border: 'none',
                background: selectedFeature.enabled ? 'rgba(34, 197, 94, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                color: selectedFeature.enabled ? '#22C55E' : '#EF4444',
                fontSize: 12, fontWeight: 800, cursor: 'pointer'
              }}
            >
              {selectedFeature.enabled ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <span>{selectedFeature.enabled ? 'Active' : 'Disabled'}</span>
            </button>
          </div>

          {/* 2-Column Metadata Grid (Mobile First) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {/* Feature Key */}
            <div style={{ background: 'var(--ad-input)', borderRadius: 12, padding: '10px 12px', overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ad-text-sec)', marginBottom: 2 }}>Key</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <code style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFeature.key}
                </code>
                <button onClick={() => handleCopyKey(selectedFeature.key)} style={{ background: 'none', border: 'none', color: copiedKey ? '#22C55E' : 'var(--ad-text-sec)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                  {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* Environment */}
            <div style={{ background: 'var(--ad-input)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ad-text-sec)', marginBottom: 2 }}>Scope</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#22C55E' }}>Production</div>
            </div>

            {/* Category & Subcategory */}
            <div style={{ background: 'var(--ad-input)', borderRadius: 12, padding: '10px 12px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ad-text-sec)', marginBottom: 2 }}>Category &amp; Subcategory</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: selectedFeature.iconColor, flexWrap: 'wrap' }}>
                <SubIcon size={13} />
                <span>{selectedFeature.categoryName}</span>
                <span style={{ color: 'var(--ad-text-sec)', fontWeight: 500 }}>›</span>
                <span>{selectedFeature.subcategory}</span>
              </div>
            </div>
          </div>

          {/* Plan Entitlements Matrix (2 Cards Per Row Grid on Mobile) */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ad-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Crown size={15} color="#FF4D9D" />
              <span>Plan Entitlements (Access Tiers)</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {CANONICAL_PLANS.map(pId => {
                const planFeatures = livePlans[pId]?.features || (pId === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
                const hasFeature = planFeatures.includes(selectedFeature.key);
                const color = PLAN_COLORS[pId] || '#FF4D9D';

                return (
                  <button
                    key={pId}
                    onClick={() => handleTogglePlan(pId, selectedFeature.key)}
                    disabled={savingPlanId === pId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: hasFeature ? `${color}15` : 'var(--ad-input)',
                      border: `1.5px solid ${hasFeature ? color : 'var(--ad-border)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      minHeight: 68
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: hasFeature ? color : 'var(--ad-text)', lineHeight: 1.2 }}>
                        {PLAN_LABELS[pId]}
                      </span>
                      <div style={{ flexShrink: 0 }}>
                        {hasFeature ? <CheckSquare size={16} color={color} /> : <Square size={16} color="var(--ad-text-sec)" />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: hasFeature ? color : 'var(--ad-text-sec)' }}>
                        {hasFeature ? 'Included' : 'Locked'}
                      </span>
                      {pId !== 'free' && (
                        <Crown size={11} color={hasFeature ? color : 'var(--ad-text-sec)'} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: 2. CREATE / EDIT MODAL VIEW
  // ═════════════════════════════════════════════════════════════════════════
  if (activeMode === 'create' || activeMode === 'edit') {
    const isEdit = activeMode === 'edit';
    return (
      <div style={{ maxWidth: 620, margin: '0 auto', animation: 'adSlideIn 0.2s ease' }}>
        {toastMessage && <Toast message={toastMessage} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => setActiveMode(isEdit ? 'details' : 'list')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: 'var(--ad-text)',
              fontSize: 16, fontWeight: 800, cursor: 'pointer', padding: 0
            }}
          >
            <ArrowLeft size={20} />
            <span>{isEdit ? 'Edit Feature Flag' : 'Create Custom Feature Flag'}</span>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} style={{
          background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
          borderRadius: 20, padding: 24, boxShadow: 'var(--ad-card-shadow)',
          display: 'flex', flexDirection: 'column', gap: 18
        }}>
          {formErrors.submit && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
              {formErrors.submit}
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', display: 'block', marginBottom: 6 }}>
              Feature Name <span style={{ color: '#FF4D9D' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AI QR Enhancer"
              value={formData.name}
              onChange={e => {
                const val = e.target.value;
                setFormData(p => ({
                  ...p,
                  name: val,
                  key: isEdit ? p.key : (p.key === '' || p.key === p.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') ? val.toLowerCase().replace(/[^a-z0-9_]/g, '_') : p.key)
                }));
              }}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
                border: `1px solid ${formErrors.name ? '#EF4444' : 'var(--ad-border)'}`,
                borderRadius: 10, padding: '11px 14px', color: 'var(--ad-text)',
                fontSize: 14, fontWeight: 600, outline: 'none'
              }}
            />
            {formErrors.name && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{formErrors.name}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', display: 'block', marginBottom: 6 }}>
              Feature Key <span style={{ color: '#FF4D9D' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ai_qr_enhancer"
              value={formData.key}
              disabled={isEdit}
              onChange={e => setFormData(p => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
                border: `1px solid ${formErrors.key ? '#EF4444' : 'var(--ad-border)'}`,
                borderRadius: 10, padding: '11px 14px', color: 'var(--ad-text)',
                fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'monospace',
                opacity: isEdit ? 0.6 : 1
              }}
            />
            {formErrors.key && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{formErrors.key}</div>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', display: 'block', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain what this feature controls in the user application..."
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
                border: '1px solid var(--ad-border)', borderRadius: 10, padding: '11px 14px',
                color: 'var(--ad-text)', fontSize: 13, fontWeight: 500, outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                style={{
                  width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
                  borderRadius: 10, padding: '11px 12px', color: 'var(--ad-text)', fontSize: 13, fontWeight: 600, outline: 'none'
                }}
              >
                {Object.entries(CATEGORY_META).filter(([k]) => k !== 'ALL').map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', display: 'block', marginBottom: 6 }}>
                Initial Status
              </label>
              <div style={{ display: 'flex', alignItems: 'center', height: 42 }}>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, enabled: !p.enabled }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: formData.enabled ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                    color: formData.enabled ? '#22C55E' : '#EF4444', fontWeight: 800, fontSize: 13
                  }}
                >
                  {formData.enabled ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{formData.enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 10, background: '#D60036',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)'
            }}
          >
            {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Feature Flag')}
          </button>
        </form>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: 3. MAIN UNIFIED OVERVIEW (Matching Exact Mobile-First Reference)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'adSlideIn 0.2s ease' }}>
      {toastMessage && <Toast message={toastMessage} />}

      {/* Title & Top Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 900,
            color: 'var(--ad-text)',
            margin: 0,
            letterSpacing: '-0.4px'
          }}>
            {titleOverride || (fixedCategory ? `${CATEGORY_META[fixedCategory]?.name || fixedCategory} Access & Features` : 'Feature Flags & App Capabilities')}
          </h1>
          <p style={{
            fontSize: 12,
            color: 'var(--ad-text-sec)',
            margin: '4px 0 0',
            fontWeight: 500
          }}>
            {subtitleOverride || (fixedCategory ? `Control which ${CATEGORY_META[fixedCategory]?.name || ''} capabilities are active, hidden, or locked to Pro.` : 'Control 140+ granular features across 8 categories with live paid plan badges')}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            background: '#D60036',
            border: 'none',
            borderRadius: 12,
            color: '#FFFFFF',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)',
            flexShrink: 0
          }}
        >
          <Plus size={18} strokeWidth={2.6} />
          <span>Create Flag</span>
        </button>
      </div>

      {/* 4 Top Stat Cards (2x2 on Mobile, 4-col on Desktop) */}
      <div className="ad-stat-grid" style={{ marginBottom: 20 }}>
        <StatMiniCard
          icon={Flag}
          iconColor="#FF4D9D"
          iconBg="rgba(255, 77, 157, 0.12)"
          title="Total Features"
          value={fixedCategory ? (categoryCounts[fixedCategory] || 0) : stats.total}
          subtitle={fixedCategory ? `${CATEGORY_META[fixedCategory]?.name || ''} capabilities` : "All app capabilities"}
          subColor="var(--ad-text-sec)"
        />
        <StatMiniCard
          icon={CheckCircle2}
          iconColor="#22C55E"
          iconBg="rgba(34, 197, 94, 0.12)"
          title="Enabled"
          value={stats.enabled}
          subtitle={`${stats.enabledPct}% active`}
          subColor="#22C55E"
        />
        <StatMiniCard
          icon={Crown}
          iconColor="#F59E0B"
          iconBg="rgba(245, 158, 11, 0.12)"
          title="Paid Pro Features"
          value={stats.paidCount}
          subtitle="Monetized capabilities"
          subColor="#F59E0B"
        />
        <StatMiniCard
          icon={Sliders}
          iconColor="#8B5CF6"
          iconBg="rgba(139, 92, 246, 0.12)"
          title="Subcategories"
          value={fixedCategory ? `${availableSubcategories.length} Sections` : "8 Categories"}
          subtitle={fixedCategory ? "Granular subsections" : "Full Mushi QR ecosystem"}
          subColor="#8B5CF6"
        />
      </div>

      {/* 8 Categories Filter Carousel Bar (Only when fixedCategory is not set) */}
      {!fixedCategory && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 16,
          scrollbarWidth: 'none'
        }}>
          {Object.entries(CATEGORY_META).map(([key, cat]) => {
            const isActive = selectedCategory === key;
            const IconComp = cat.icon;
            const count = categoryCounts[key] || 0;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  setSelectedSubcategory('ALL');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: `1px solid ${isActive ? cat.color : 'var(--ad-border)'}`,
                  background: isActive ? `${cat.color}18` : 'var(--ad-card)',
                  color: isActive ? cat.color : 'var(--ad-text-sec)',
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 2px 10px ${cat.color}25` : 'none'
                }}
              >
                <IconComp size={15} strokeWidth={isActive ? 2.5 : 1.9} />
                <span>{cat.name}</span>
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 10,
                  background: isActive ? cat.color : 'var(--ad-input)',
                  color: isActive ? '#fff' : 'var(--ad-text-sec)',
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Subcategory Filter Pills with Dedicated Main App Toolbar Icons */}
      {availableSubcategories.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 16,
          scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => setSelectedSubcategory('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${selectedSubcategory === 'ALL' ? '#FF4D9D' : 'var(--ad-border)'}`,
              background: selectedSubcategory === 'ALL' ? 'rgba(255, 77, 157, 0.14)' : 'transparent',
              color: selectedSubcategory === 'ALL' ? '#FF4D9D' : 'var(--ad-text-sec)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Sliders size={12} />
            <span>All Subcategories</span>
          </button>
          {availableSubcategories.map(sub => {
            const isSubActive = selectedSubcategory === sub;
            const subMeta = SUBCATEGORY_META[sub];
            const SubIcon = subMeta?.icon || Sliders;
            const subColor = subMeta?.color || '#FF4D9D';

            return (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${isSubActive ? subColor : 'var(--ad-border)'}`,
                  background: isSubActive ? `${subColor}18` : 'transparent',
                  color: isSubActive ? subColor : 'var(--ad-text-sec)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <SubIcon size={12} strokeWidth={isSubActive ? 2.4 : 1.9} />
                <span>{sub}</span>
              </button>
            );
          })}
        </div>
      )}



      {/* Search & Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12
      }}>
        {/* Search Input */}
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--ad-text-sec)' }} />
          <input
            type="text"
            placeholder="Search 140+ features by name, key, description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--ad-card)',
              border: '1px solid var(--ad-border)',
              borderRadius: 12,
              padding: '11px 36px 11px 38px',
              color: 'var(--ad-text)',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              boxShadow: 'var(--ad-card-shadow)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 12, background: 'none', border: 'none',
                color: 'var(--ad-text-sec)', cursor: 'pointer', padding: 2
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Button with Active Badge */}
        <button
          type="button"
          onClick={() => setFilterOpen(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: filterOpen
              ? '#FF4D9D'
              : (activeFiltersCount > 0 ? 'rgba(255, 77, 157, 0.12)' : 'var(--ad-card)'),
            border: `1.5px solid ${filterOpen || activeFiltersCount > 0 ? '#FF4D9D' : 'var(--ad-border)'}`,
            borderRadius: 12,
            padding: '11px 16px',
            color: filterOpen ? '#FFFFFF' : (activeFiltersCount > 0 ? '#FF4D9D' : 'var(--ad-text)'),
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: filterOpen ? '0 3px 12px rgba(255, 77, 157, 0.35)' : 'var(--ad-card-shadow)',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title={filterOpen ? "Hide Filter Options" : "Show Filter Options"}
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: filterOpen ? '#FFFFFF' : '#FF4D9D',
              color: filterOpen ? '#FF4D9D' : '#FFFFFF',
              fontSize: 10, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Expandable Inline Filter Drawer Tray ─────────────────────────── */}
      {filterOpen && (
        <div style={{
          background: 'var(--ad-card)',
          border: '1.5px solid rgba(255, 77, 157, 0.4)',
          borderRadius: 18,
          padding: '18px 16px',
          marginBottom: 14,
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'adSlideIn 0.2s ease'
        }}>
          {/* Drawer Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ad-text)' }}>
                Filter Feature Catalog
              </div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-sec)', fontWeight: 600 }}>
                Showing {filteredFeatures.length} of {allFeatures.length} capabilities
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
                borderRadius: 8, padding: '4px 8px', color: 'var(--ad-text-sec)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <X size={13} />
              <span>Close</span>
            </button>
          </div>

          {/* Quick 5 Filter Presets: All, Active, Disabled, Free, Paid Pro */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text-sec)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Capability & Plan Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {[
                { id: 'all', label: 'All Capabilities', count: stats.total, icon: Sliders, color: '#FF4D9D' },
                { id: 'enabled', label: '🟢 Active Only', count: stats.enabled, icon: CheckCircle2, color: '#22C55E' },
                { id: 'disabled', label: '🔴 Disabled Only', count: stats.disabled, icon: XCircle, color: '#EF4444' },
                { id: 'free', label: '🛡️ Free Tier', count: stats.total - stats.paidCount, icon: Shield, color: '#8B8FA8' },
                { id: 'paid', label: '👑 Paid Pro Only', count: stats.paidCount, icon: Crown, color: '#F59E0B' },
              ].map(item => {
                const isSelected = (item.id === 'all' && statusFilter === 'all' && planFilter === 'all') ||
                  (item.id === 'enabled' && statusFilter === 'enabled') ||
                  (item.id === 'disabled' && statusFilter === 'disabled') ||
                  (item.id === 'free' && planFilter === 'free') ||
                  (item.id === 'paid' && planFilter === 'paid');

                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'all') {
                        setStatusFilter('all');
                        setPlanFilter('all');
                      } else if (item.id === 'enabled' || item.id === 'disabled') {
                        setStatusFilter(item.id);
                        setPlanFilter('all');
                      } else if (item.id === 'free' || item.id === 'paid') {
                        setPlanFilter(item.id);
                        setStatusFilter('all');
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? item.color : 'var(--ad-border)'}`,
                      background: isSelected ? `${item.color}18` : 'var(--ad-input)',
                      color: isSelected ? item.color : 'var(--ad-text)',
                      fontSize: 12,
                      fontWeight: isSelected ? 800 : 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 2px 10px ${item.color}25` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ItemIcon size={14} strokeWidth={isSelected ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 8,
                      background: isSelected ? item.color : 'var(--ad-card)',
                      color: isSelected ? '#FFFFFF' : 'var(--ad-text-sec)'
                    }}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Category & Plan Dropdowns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>
                Category Filter
              </label>
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('ALL');
                }}
                style={{
                  width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
                  borderRadius: 10, padding: '9px 11px', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                }}
              >
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.name} ({categoryCounts[k] || 0})</option>
                ))}
              </select>
            </div>

            {/* Subcategory Selector */}
            {availableSubcategories.length > 0 && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>
                  Subcategory Filter
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={e => setSelectedSubcategory(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
                    borderRadius: 10, padding: '9px 11px', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                  }}
                >
                  <option value="ALL">All Subcategories in {CATEGORY_META[selectedCategory]?.name}</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Specific Plan Tier Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>
                Specific Plan Tier Filter
              </label>
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                style={{
                  width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
                  borderRadius: 10, padding: '9px 11px', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                }}
              >
                <option value="all">All Plans (Free + Pro)</option>
                <option value="paid">👑 Paid Pro Only (Weekly/Monthly/Yearly)</option>
                <option value="free">🛡️ Free Tier Included</option>
                <option value="weekly">Weekly Pro Plan</option>
                <option value="monthly">Monthly Pro Plan</option>
                <option value="yearly">Yearly Pro Plan</option>
              </select>
            </div>
          </div>

          {/* Drawer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid var(--ad-border)' }}>
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 10, background: 'var(--ad-input)',
                border: '1px solid var(--ad-border)', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset All Filters</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              style={{
                padding: '8px 18px', borderRadius: 10, background: '#D60036',
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(214, 0, 54, 0.3)'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Pills Bar */}
      {activeFiltersCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ad-text-sec)' }}>Active:</span>
          {selectedCategory !== 'ALL' && (
            <FilterPill label={CATEGORY_META[selectedCategory]?.name || selectedCategory} onRemove={() => setSelectedCategory('ALL')} />
          )}
          {selectedSubcategory !== 'ALL' && (
            <FilterPill label={selectedSubcategory} onRemove={() => setSelectedSubcategory('ALL')} />
          )}
          {statusFilter !== 'all' && (
            <FilterPill label={statusFilter === 'enabled' ? 'Enabled Only' : 'Disabled Only'} onRemove={() => setStatusFilter('all')} />
          )}
          {planFilter !== 'all' && (
            <FilterPill label={planFilter === 'paid' ? 'Paid Pro Only' : (PLAN_LABELS[planFilter] || planFilter)} onRemove={() => setPlanFilter('all')} />
          )}
          <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#FF4D9D', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Master Batch Action Bar (Select All, Clear All, Turn ON/OFF) ──── */}
      <div style={{
        background: selectedKeys.size > 0
          ? 'linear-gradient(135deg, rgba(255, 77, 157, 0.14) 0%, rgba(123, 97, 255, 0.12) 100%)'
          : 'var(--ad-card)',
        border: `1.5px solid ${selectedKeys.size > 0 ? '#FF4D9D' : 'var(--ad-border)'}`,
        borderRadius: 14,
        padding: '10px 14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        boxShadow: selectedKeys.size > 0 ? '0 4px 20px rgba(255, 77, 157, 0.18)' : 'var(--ad-card-shadow)',
        transition: 'all 0.2s ease'
      }}>
        {/* Left: Master Checkbox & Selection / Count Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleSelectAllVisible}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              color: selectedKeys.size > 0 ? '#FF4D9D' : 'var(--ad-text-sec)',
              transition: 'transform 0.1s ease'
            }}
            title={isAllVisibleSelected ? "Deselect All Visible" : "Select All Visible"}
          >
            {isAllVisibleSelected ? (
              <CheckSquare size={20} color="#FF4D9D" strokeWidth={2.4} />
            ) : isSomeVisibleSelected ? (
              <MinusSquare size={20} color="#FF4D9D" strokeWidth={2.4} />
            ) : (
              <Square size={20} color="var(--ad-text-sec)" strokeWidth={2} />
            )}
          </button>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ad-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {selectedKeys.size > 0 ? (
                <>
                  <span style={{ color: '#FF4D9D' }}>{selectedKeys.size} Selected</span>
                  <span style={{ color: 'var(--ad-text-sec)', fontWeight: 600, fontSize: 12 }}>
                    (of {filteredFeatures.length} visible)
                  </span>
                </>
              ) : (
                <>
                  <span>Select All Visible</span>
                  <span style={{ color: 'var(--ad-text-sec)', fontWeight: 600, fontSize: 12 }}>
                    ({filteredFeatures.length} features)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Meaningful Batch Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {selectedKeys.size > 0 ? (
            <>
              {/* 1-Click Batch FREE */}
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleSetFeatureTier(Array.from(selectedKeys), 'free')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#10B981', fontSize: 12, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Make all selected features 100% Free"
              >
                <Shield size={13} strokeWidth={2.5} />
                <span>Make FREE ({selectedKeys.size})</span>
              </button>

              {/* 1-Click Batch PRO */}
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleSetFeatureTier(Array.from(selectedKeys), 'paid')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 10,
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  background: 'rgba(245, 158, 11, 0.16)',
                  color: '#F59E0B', fontSize: 12, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Make all selected features Paid Pro"
              >
                <Crown size={13} strokeWidth={2.5} />
                <span>Make PRO ({selectedKeys.size})</span>
              </button>

              {/* Turn ON Selected */}
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkToggle(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 10,
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  background: 'rgba(34, 197, 94, 0.16)',
                  color: '#22C55E', fontSize: 12, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Enable all selected features"
              >
                <Power size={13} strokeWidth={2.5} />
                <span>Turn ON ({selectedKeys.size})</span>
              </button>

              {/* Turn OFF Selected */}
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkToggle(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.16)',
                  color: '#EF4444', fontSize: 12, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Disable all selected features"
              >
                <XCircle size={13} strokeWidth={2.5} />
                <span>Turn OFF ({selectedKeys.size})</span>
              </button>

              {/* Clear Selection */}
              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 10px', borderRadius: 10,
                  border: '1px solid var(--ad-border)',
                  background: 'var(--ad-input)',
                  color: 'var(--ad-text-sec)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Clear selection"
              >
                <X size={13} />
                <span>Clear Selection</span>
              </button>
            </>
          ) : (
            <>
              {/* Select All Overall button */}
              <button
                type="button"
                onClick={handleSelectAllOverall}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 10,
                  border: '1px solid var(--ad-border)',
                  background: 'var(--ad-input)',
                  color: 'var(--ad-text)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Select all features across the entire catalog"
              >
                <CheckCheck size={13} strokeWidth={2} />
                <span>Select All (140)</span>
              </button>

              {/* Quick Visible Batch Controls */}
              <button
                type="button"
                disabled={bulkProcessing || filteredFeatures.length === 0}
                onClick={handleTurnAllVisibleOn}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 10,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22C55E', fontSize: 11, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Turn ON all currently filtered features"
              >
                <Power size={13} strokeWidth={2.4} />
                <span>Turn All ON</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing || filteredFeatures.length === 0}
                onClick={handleTurnAllVisibleOff}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444', fontSize: 11, fontWeight: 800,
                  cursor: bulkProcessing ? 'not-allowed' : 'pointer'
                }}
                title="Turn OFF all currently filtered features"
              >
                <XCircle size={13} strokeWidth={2.4} />
                <span>Turn All OFF</span>
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 10px', borderRadius: 10,
                    border: '1px solid var(--ad-border)',
                    background: 'var(--ad-input)',
                    color: '#FF4D9D', fontSize: 11, fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Reset all search and filters"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filters</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Feature Flags Card List ──────────────────────────────────────── */}
      {filteredFeatures.length === 0 ? (
        <div style={{
          background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
          borderRadius: 20, padding: '48px 24px', textAlign: 'center',
          boxShadow: 'var(--ad-card-shadow)'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(255, 77, 157, 0.1)',
            color: '#FF4D9D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
          }}>
            <Search size={26} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ad-text)', margin: '0 0 6px' }}>
            No matching features found
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ad-text-sec)', margin: '0 0 16px' }}>
            Try adjusting your search query or removing active filters.
          </p>
          <button
            onClick={clearAllFilters}
            style={{
              padding: '8px 16px', borderRadius: 10, background: 'var(--ad-input)',
              border: '1px solid var(--ad-border)', color: 'var(--ad-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredFeatures.map(feature => {
            const isSelected = selectedKeys.has(feature.key);
            const IconComp = feature.icon || Flag;
            const subMeta = SUBCATEGORY_META[feature.subcategory];
            const SubIcon = subMeta?.icon || Sliders;

            return (
              <div
                key={feature.key}
                onClick={() => openDetails(feature)}
                style={{
                  background: isSelected ? 'rgba(255, 77, 157, 0.05)' : 'var(--ad-card)',
                  border: `1.5px solid ${isSelected ? 'rgba(255, 77, 157, 0.6)' : 'var(--ad-border)'}`,
                  borderRadius: 16,
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 16px rgba(255, 77, 157, 0.12)' : 'var(--ad-card-shadow)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 77, 157, 0.35)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--ad-border)';
                }}
              >
                {/* Left Selection Checkbox */}
                <div
                  onClick={(e) => handleToggleSelectOne(feature.key, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '4px',
                    color: isSelected ? '#FF4D9D' : 'var(--ad-text-sec)',
                    flexShrink: 0
                  }}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected ? (
                    <CheckSquare size={20} color="#FF4D9D" strokeWidth={2.4} />
                  ) : (
                    <Square size={20} color="var(--ad-text-sec)" strokeWidth={1.8} />
                  )}
                </div>

                {/* Center Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ad-text)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: feature.iconBg,
                        color: feature.iconColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconComp size={12} strokeWidth={2.5} />
                      </span>
                      <span>{feature.name}</span>
                    </span>
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: 'var(--ad-text-sec)',
                    marginTop: 3,
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {feature.description}
                  </div>

                  {/* Subcategory & Category Tags with Live Icons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: `${feature.iconColor}18`,
                      color: feature.iconColor
                    }}>
                      <IconComp size={10} />
                      <span>{feature.categoryName}</span>
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: 'var(--ad-input)',
                      color: 'var(--ad-text-sec)'
                    }}>
                      <SubIcon size={10} />
                      <span>{feature.subcategory}</span>
                    </span>
                  </div>
                </div>

                {/* Right Controls: Tier Toggle Pill on top (aligned with first line), Enable/Disable Switch underneath */}
                <div 
                  onClick={e => e.stopPropagation()} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 12,
                    flexShrink: 0
                  }}
                >
                  {/* Top: Modern Interactive Tier Toggle Pill (aligned with feature title line) */}
                  <TierTogglePill
                    isPaid={feature.isPaid}
                    updating={tierUpdatingKey === feature.key}
                    disabled={bulkProcessing}
                    onToggle={() => handleSetFeatureTier([feature.key], feature.isPaid ? 'free' : 'paid')}
                  />

                  {/* Bottom: Enable/Disable Switch */}
                  <IOSSwitch
                    checked={feature.enabled}
                    onChange={() => handleToggle(feature)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// MICRO SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════

function StatMiniCard({ icon: Icon, iconColor, iconBg, title, value, subtitle, subColor }) {
  return (
    <div style={{
      background: 'var(--ad-card)',
      border: '1px solid var(--ad-border)',
      borderRadius: 16,
      padding: '14px',
      boxShadow: 'var(--ad-card-shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} strokeWidth={2.4} />
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ad-text)', letterSpacing: '-0.3px', marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, fontWeight: 600, color: subColor || 'var(--ad-text-sec)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function IOSSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 100,
        border: 'none',
        background: checked ? '#D60036' : 'rgba(148, 163, 184, 0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        outline: 'none'
      }}
    >
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        position: 'absolute',
        top: 3,
        left: checked ? 21 : 3,
        transition: 'left 0.2s ease'
      }} />
    </button>
  );
}

function TierTogglePill({ isPaid, onToggle, disabled, updating }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      type="button"
      disabled={disabled || updating}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 11px',
        borderRadius: 100,
        border: `1.5px solid ${isPaid ? '#F59E0B' : '#10B981'}`,
        background: isPaid 
          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#FFFFFF',
        boxShadow: isPressed
          ? '0 1px 3px rgba(0,0,0,0.3) inset'
          : isHovered
            ? (isPaid ? '0 4px 14px rgba(245, 158, 11, 0.5)' : '0 4px 14px rgba(16, 185, 129, 0.5)')
            : (isPaid ? '0 2px 8px rgba(245, 158, 11, 0.35)' : '0 2px 8px rgba(16, 185, 129, 0.35)'),
        transform: isPressed ? 'scale(0.95)' : isHovered ? 'translateY(-1px)' : 'none',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        outline: 'none',
        lineHeight: 1
      }}
      title={isPaid ? "Plan: PRO (Click to switch to 100% Free)" : "Plan: FREE (Click to switch to Pro)"}
    >
      {updating ? (
        <RefreshCw size={11} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
      ) : isPaid ? (
        <Crown size={12} fill="#FFFFFF" color="#FFFFFF" strokeWidth={2.4} />
      ) : (
        <Shield size={11} color="#FFFFFF" strokeWidth={2.6} />
      )}
      <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        {isPaid ? 'PRO' : 'FREE'}
      </span>
      <span style={{
        fontSize: 9,
        opacity: 0.8,
        marginLeft: 1,
        fontWeight: 700
      }}>
        ⇄
      </span>
    </button>
  );
}

function FilterPill({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 100,
      background: 'rgba(255, 77, 157, 0.12)', color: '#FF4D9D', fontSize: 11, fontWeight: 700
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#FF4D9D', cursor: 'pointer', padding: 0 }}>
        <X size={11} />
      </button>
    </span>
  );
}

function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999999,
      maxWidth: 'calc(100vw - 32px)',
      width: 'max-content',
      background: 'rgba(15, 18, 33, 0.96)',
      color: '#FFFFFF',
      border: '1.5px solid rgba(255, 77, 157, 0.75)',
      borderRadius: 100,
      padding: '11px 20px',
      fontSize: 13,
      fontWeight: 800,
      boxShadow: '0 12px 36px rgba(0,0,0,0.6), 0 0 24px rgba(255, 77, 157, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      animation: 'adSlideUpSnackbar 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'none',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      textAlign: 'center'
    }}>
      <Sparkles size={16} color="#FF4D9D" style={{ flexShrink: 0 }} />
      <span style={{ wordBreak: 'break-word', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {message}
      </span>
    </div>
  );
}
