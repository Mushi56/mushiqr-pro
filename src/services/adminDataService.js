// src/services/adminDataService.js
// ─── Firebase-Ready Data Abstraction Layer ─────────────────────────────────
// All global config is stored in Firestore. Privileged operations require custom claim role: "super_admin".

import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import {
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, addDoc,
  query, orderBy, limit as firestoreLimit,
  increment,
} from 'firebase/firestore';

// ── Helper: format Firestore errors into readable messages ─────────────────
function friendlyError(e) {
  const code = e?.code || '';
  if (code === 'permission-denied') return 'Permission denied — make sure Firestore rules allow superadmin writes.';
  if (code === 'unavailable')       return 'Firebase is unavailable. Check your internet connection.';
  if (code === 'not-found')         return 'Document not found in Firestore.';
  if (code.includes('network'))     return 'Network error — please check your connection.';
  return e?.message || 'Unknown Firestore error';
}

// Helper to audit actions (Client-side logging only; authoritative audit records are written by backend Cloud Functions)
async function _audit(action, meta = {}) {
  // Client-side direct writes to global_audit_logs are disabled by Security Rules.
  // Trusted audit logs are created server-side by backend Cloud Functions.
  console.log(`[audit] Action: ${action}`, meta);
}

// ═══════════════════════════════════════════════════════════════════════════
// APP STATS (from localStorage — local per-device stats)
// ═══════════════════════════════════════════════════════════════════════════
export async function getAppStats() {
  const _read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const history = _read('qrgen_history') || [];
  const saved   = _read('qrgen_saved')   || [];
  const cloud   = await getCloudTemplates();

  return {
    historyCount:   history.length,
    savedCount:     saved.length,
    cloudTemplates: cloud.length,
    qrCount:        history.filter(h => !h.barcodeType && !h.isBatch).length,
    barcodeCount:   history.filter(h =>  h.barcodeType).length,
    batchCount:     history.filter(h =>  h.isBatch).length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY CHART (last N days)
// ═══════════════════════════════════════════════════════════════════════════
export async function getActivityChartData(days = 7) {
  const _read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const history = _read('qrgen_history') || [];
  const result  = [];
  for (let i = days - 1; i >= 0; i--) {
    const d  = new Date();
    d.setDate(d.getDate() - i);
    const ds    = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const qr      = history.filter(h => h.timestamp?.startsWith(ds) && !h.barcodeType).length;
    const barcode = history.filter(h => h.timestamp?.startsWith(ds) &&  h.barcodeType).length;
    result.push({ label, ds, qr, barcode, total: qr + barcode });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════
export async function getHistory(limitVal = 100) {
  const _read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  return (_read('qrgen_history') || []).slice(0, limitVal);
}

// ═══════════════════════════════════════════════════════════════════════════
// APP SETTINGS  —  global_config/appSettings
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_APP_SETTINGS = {
  appName:            'Mushi QR Pro',
  brandColor:         '#EF1E34',
  welcomeText:        'Create and scan QR codes instantly!',
  maintenanceMode:    false,
  maintenanceMessage: 'We are performing scheduled maintenance. Please check back soon.',
  showWelcomeBanner:  true,
};

export async function getAppSettings() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'appSettings'));
    if (snap.exists()) return { ...DEFAULT_APP_SETTINGS, ...snap.data() };
  } catch (e) {
    console.error('[DS] getAppSettings:', e?.code, e?.message);
  }
  return { ...DEFAULT_APP_SETTINGS };
}

export async function saveAppSettings(s) {
  try {
    await setDoc(doc(db, 'global_config', 'appSettings'), {
      ...s,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('APP_SETTINGS_UPDATED', { keys: Object.keys(s) });
    return s;
  } catch (e) {
    console.error('[DS] saveAppSettings:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS  —  global_config/featureFlags
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_FLAGS = {
  qr_generator:      true,
  barcode_generator: true,
  scanner:           true,
  bulk_generation:   true,
  templates:         true,
  history:           true,
  saved:             true,
  export_png:        true,
  export_svg:        true,
  export_pdf:        true,
  dark_mode:         true,
  pwa_install:       true,
};

export async function getFeatureFlags() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'featureFlags'));
    if (snap.exists()) return { ...DEFAULT_FLAGS, ...snap.data() };
  } catch (e) {
    console.error('[DS] getFeatureFlags:', e?.code, e?.message);
  }
  return { ...DEFAULT_FLAGS };
}

export async function saveFeatureFlags(f) {
  try {
    await setDoc(doc(db, 'global_config', 'featureFlags'), {
      ...f,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('FEATURE_FLAGS_UPDATED', { flags: Object.keys(f) });
    return f;
  } catch (e) {
    console.error('[DS] saveFeatureFlags:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLOUD TEMPLATES  —  global_templates/{id}
// ═══════════════════════════════════════════════════════════════════════════
export async function getCloudTemplates() {
  try {
    const snap = await getDocs(collection(db, 'global_templates'));
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (e) {
    console.error('[DS] getCloudTemplates:', e?.code, e?.message);
    return [];
  }
}

export async function saveCloudTemplate(t) {
  try {
    await setDoc(doc(db, 'global_templates', t.id), {
      ...t,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('TEMPLATE_SAVED', { id: t.id, name: t.name });
    return t;
  } catch (e) {
    console.error('[DS] saveCloudTemplate:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

export async function deleteCloudTemplate(id) {
  try {
    await deleteDoc(doc(db, 'global_templates', id));
    await _audit('TEMPLATE_DELETED', { id });
  } catch (e) {
    console.error('[DS] deleteCloudTemplate:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENT  —  global_config/announcement
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_ANNOUNCEMENT = { title: '', message: '', active: false, type: 'info' };

export async function getAnnouncement() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'announcement'));
    if (snap.exists()) return { ...DEFAULT_ANNOUNCEMENT, ...snap.data() };
  } catch (e) {
    console.error('[DS] getAnnouncement:', e?.code, e?.message);
  }
  return { ...DEFAULT_ANNOUNCEMENT };
}

export async function saveAnnouncement(a) {
  try {
    await setDoc(doc(db, 'global_config', 'announcement'), {
      ...a,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('ANNOUNCEMENT_UPDATED', { active: a.active, title: a.title });
    return a;
  } catch (e) {
    console.error('[DS] saveAnnouncement:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REMOTE CONFIG  —  global_config/remoteConfig
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_REMOTE = {
  max_qr_size:      '2048',
  error_correction: 'H',
  support_email:    'support@mushiqr.pro',
  privacy_url:      'https://mushiqr.pro/privacy',
  terms_url:        'https://mushiqr.pro/terms',
};

export async function getRemoteConfig() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'remoteConfig'));
    if (snap.exists()) return { ...DEFAULT_REMOTE, ...snap.data() };
  } catch (e) {
    console.error('[DS] getRemoteConfig:', e?.code, e?.message);
  }
  return { ...DEFAULT_REMOTE };
}

export async function saveRemoteConfig(c) {
  try {
    await setDoc(doc(db, 'global_config', 'remoteConfig'), {
      ...c,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('REMOTE_CONFIG_UPDATED', { keys: Object.keys(c) });
    return c;
  } catch (e) {
    console.error('[DS] saveRemoteConfig:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG  —  global_audit_logs (collection)
// ═══════════════════════════════════════════════════════════════════════════
export async function getAuditLog(limitVal = 100) {
  try {
    const colRef = collection(db, 'global_audit_logs');
    const q = query(colRef, orderBy('ts', 'desc'), firestoreLimit(limitVal));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (e) {
    console.error('[DS] getAuditLog:', e?.code, e?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP & RESTORE
// ═══════════════════════════════════════════════════════════════════════════
export async function exportBackup() {
  const [appSettings, featureFlags, announcement, remoteConfig, cloudTemplates, auditLog] =
    await Promise.all([
      getAppSettings(), getFeatureFlags(), getAnnouncement(),
      getRemoteConfig(), getCloudTemplates(), getAuditLog(),
    ]);
  return {
    version:    '2.0',
    app:        'mushi-qr-pro',
    exportedAt: new Date().toISOString(),
    data:       { appSettings, featureFlags, announcement, remoteConfig, cloudTemplates, auditLog },
  };
}

export async function importBackup(backup) {
  if (!backup?.data) throw new Error('Invalid backup format — missing data key.');
  const d = backup.data;
  const errors = [];
  if (d.appSettings)  await saveAppSettings(d.appSettings).catch(e => errors.push(e.message));
  if (d.featureFlags) await saveFeatureFlags(d.featureFlags).catch(e => errors.push(e.message));
  if (d.announcement) await saveAnnouncement(d.announcement).catch(e => errors.push(e.message));
  if (d.remoteConfig) await saveRemoteConfig(d.remoteConfig).catch(e => errors.push(e.message));
  if (d.cloudTemplates && Array.isArray(d.cloudTemplates)) {
    for (const t of d.cloudTemplates) {
      await saveCloudTemplate(t).catch(e => errors.push(e.message));
    }
  }
  await _audit('BACKUP_RESTORED', { exportedAt: backup.exportedAt });
  if (errors.length > 0) throw new Error('Partial restore — some items failed: ' + errors.join('; '));
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE INFO (localStorage)
// ═══════════════════════════════════════════════════════════════════════════
export function getStorageInfo() {
  let total = 0;
  const breakdown = {};
  for (const k of Object.keys(localStorage)) {
    const size = ((localStorage.getItem(k) || '').length + k.length) * 2;
    total += size;
    breakdown[k] = size;
  }
  const kb = total / 1024;
  return {
    totalBytes: total,
    breakdown,
    used: kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(2) + ' MB',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS  —  global_config/subscriptionPlans
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_PLANS = [
  { id: 'free',    name: 'Free',    price: 0,     period: 'forever', color: '#8b8fa8', active: true,  popular: false, sortOrder: 0 },
  { id: 'daily',   name: 'Daily',   price: 0.49,  period: 'day',     color: '#3b82f6', active: true,  popular: false, sortOrder: 1 },
  { id: 'weekly',  name: 'Weekly',  price: 2.99,  period: 'week',    color: '#8b5cf6', active: true,  popular: true,  sortOrder: 2 },
  { id: 'yearly',  name: 'Yearly',  price: 29.99, period: 'year',    color: '#EF1E34', active: true,  popular: false, sortOrder: 3 },
];

export async function getSubscriptionPlans() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'subscriptionPlans'));
    if (snap.exists() && Array.isArray(snap.data().plans)) return snap.data().plans;
  } catch (e) {
    console.error('[DS] getSubscriptionPlans:', e?.code, e?.message);
  }
  return [...DEFAULT_PLANS];
}

export async function saveSubscriptionPlans(plans) {
  try {
    await setDoc(doc(db, 'global_config', 'subscriptionPlans'), {
      plans,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('SUBSCRIPTION_PLANS_UPDATED', { count: plans.length });
    return plans;
  } catch (e) {
    console.error('[DS] saveSubscriptionPlans:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM FEATURES  —  global_config/premiumFeatures
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_PREMIUM_FEATURES = [
  { id: 'export_svg',       label: 'SVG Export',            description: 'Download QR codes as vector SVG files',            plans: ['daily','weekly','yearly'] },
  { id: 'export_pdf',       label: 'PDF Export',            description: 'Download QR codes as PDF documents',               plans: ['daily','weekly','yearly'] },
  { id: 'bulk_generation',  label: 'Batch Generation',      description: 'Generate multiple QR codes at once',               plans: ['daily','weekly','yearly'] },
  { id: 'cloud_sync',       label: 'Cloud Sync & Templates',description: 'Sync QR codes across devices via cloud',          plans: ['daily','weekly','yearly'] },
  { id: 'custom_eyes',      label: 'Custom Eye Styles',     description: 'Floral, icon, and decorative eye patterns',        plans: ['daily','weekly','yearly'] },
  { id: 'background_image', label: 'Background Image',      description: 'Use custom images as QR background',              plans: ['daily','weekly','yearly'] },
  { id: 'logo_upload',      label: 'Logo Upload',           description: 'Embed custom logos inside QR codes',               plans: ['daily','weekly','yearly'] },
  { id: 'text_overlay',     label: 'Text Overlay',          description: 'Add text inside QR codes',                         plans: ['daily','weekly','yearly'] },
  { id: 'texture_effects',  label: 'Texture Effects',       description: 'Apply texture overlays to QR codes',               plans: ['daily','weekly','yearly'] },
  { id: 'gradient_colors',  label: 'Gradient Colors',       description: 'Use gradient color fills on QR codes',             plans: ['daily','weekly','yearly'] },
  { id: 'custom_frames',    label: 'Custom Frames',         description: 'Add decorative frames around QR codes',            plans: ['daily','weekly','yearly'] },
  { id: 'ad_free',          label: 'Ad-Free Experience',    description: 'Remove all advertisements from the app',           plans: ['daily','weekly','yearly'] },
];

export async function getPremiumFeatures() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'premiumFeatures'));
    if (snap.exists() && Array.isArray(snap.data().features)) return snap.data().features;
  } catch (e) {
    console.error('[DS] getPremiumFeatures:', e?.code, e?.message);
  }
  return [...DEFAULT_PREMIUM_FEATURES];
}

export async function savePremiumFeatures(features) {
  try {
    await setDoc(doc(db, 'global_config', 'premiumFeatures'), {
      features,
      _updatedAt: new Date().toISOString(),
    });
    await _audit('PREMIUM_FEATURES_UPDATED', { count: features.length });
    return features;
  } catch (e) {
    console.error('[DS] savePremiumFeatures:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USER SUBSCRIPTIONS  —  user_subscriptions/{uid}
// ═══════════════════════════════════════════════════════════════════════════
export async function getUserSubscription(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'user_subscriptions', uid));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.error('[DS] getUserSubscription:', e?.code, e?.message);
  }
  return null;
}

export async function saveUserSubscription(uid, sub) {
  try {
    const fn = httpsCallable(functions, 'updateUserSubscription');
    const res = await fn({
      targetUid: uid,
      planId: sub?.planId || 'free',
      isPro: Boolean(sub?.planId && sub?.planId !== 'free'),
      durationDays: sub?.durationDays || null,
    });
    return res.data;
  } catch (e) {
    console.error('[DS] saveUserSubscription error:', e);
    throw new Error(friendlyError(e));
  }
}

export async function setUserRole(targetUid, newRole) {
  try {
    const fn = httpsCallable(functions, 'setUserRole');
    const res = await fn({ targetUid, newRole });
    return res.data;
  } catch (e) {
    console.error('[DS] setUserRole error:', e);
    throw new Error(friendlyError(e));
  }
}

export async function getAllUserSubscriptions() {
  try {
    const snap = await getDocs(collection(db, 'user_subscriptions'));
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), uid: d.id }));
    return list;
  } catch (e) {
    console.error('[DS] getAllUserSubscriptions:', e?.code, e?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APP USER TRACKING  —  app_users/{uid}
// Tracks every authenticated user (email, Google, etc.) for admin visibility
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Called whenever a user signs in. Creates the profile on first visit,
 * updates lastActiveAt on subsequent visits.
 */
export async function trackUserProfile(user) {
  if (!user?.uid) return;
  try {
    const ref = doc(db, 'app_users', user.uid);
    const snap = await getDoc(ref);
    const now = new Date().toISOString();

    // Determine auth provider and extract user email & name safely
    const providerData = user.providerData || [];
    const userEmail = user.email || providerData[0]?.email || providerData.find(p => p.email)?.email || '';
    const userDisplayName = user.displayName || providerData[0]?.displayName || providerData.find(p => p.displayName)?.displayName || '';
    const userPhotoURL = user.photoURL || providerData[0]?.photoURL || providerData.find(p => p.photoURL)?.photoURL || '';

    const provider = providerData[0]?.providerId === 'google.com' ? 'google'
      : providerData[0]?.providerId === 'password' ? 'email'
      : providerData[0]?.providerId || 'unknown';

    // Device info
    const deviceInfo = {
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || navigator.userAgentData?.platform || '',
      language: navigator.language || '',
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
    };

    if (snap.exists()) {
      // Existing user — update last active, email, name, photo & visit count
      const existingData = snap.data();
      await updateDoc(ref, {
        lastActiveAt: now,
        email: userEmail || existingData.email || '',
        displayName: userDisplayName || existingData.displayName || '',
        photoURL: userPhotoURL || existingData.photoURL || '',
        deviceInfo,
        visitCount: increment(1),
      });
    } else {
      // New user — create full profile
      await setDoc(ref, {
        uid: user.uid,
        email: userEmail,
        displayName: userDisplayName,
        photoURL: userPhotoURL,
        provider,
        status: 'active',
        createdAt: now,
        lastActiveAt: now,
        deviceInfo,
        visitCount: 1,
      });
    }
  } catch (e) {
    // Non-fatal — don't block auth flow
    console.warn('[DS] trackUserProfile:', e?.code, e?.message);
  }
}

/**
 * Fetch all registered users for the admin panel
 */
export async function getAllAppUsers() {
  try {
    const snap = await getDocs(collection(db, 'app_users'));
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), uid: d.id }));
    return list;
  } catch (e) {
    console.error('[DS] getAllAppUsers:', e?.code, e?.message);
    return [];
  }
}

/**
 * Update a user's status (e.g. 'active', 'blocked')
 */
export async function updateUserStatus(uid, status) {
  try {
    await updateDoc(doc(db, 'app_users', uid), {
      status,
      _statusUpdatedAt: new Date().toISOString(),
    });
    await _audit('USER_STATUS_UPDATED', { uid, status });
  } catch (e) {
    console.error('[DS] updateUserStatus:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

/**
 * Delete a user's admin-visible profile (doesn't delete Firebase Auth account)
 */
export async function deleteUserProfile(uid) {
  try {
    await deleteDoc(doc(db, 'app_users', uid));
    await _audit('USER_PROFILE_DELETED', { uid });
  } catch (e) {
    console.error('[DS] deleteUserProfile:', e?.code, e?.message);
    throw new Error(friendlyError(e));
  }
}

/**
 * Get per-user stats (QR history count + saved count) from their Firestore subcollections
 */
export async function getUserActivityStats(uid) {
  try {
    const [historySnap, savedSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'history')),
      getDocs(collection(db, 'users', uid, 'saved')),
    ]);
    return {
      historyCount: historySnap.size,
      savedCount: savedSnap.size,
    };
  } catch (e) {
    console.warn('[DS] getUserActivityStats:', e?.code, e?.message);
    return { historyCount: 0, savedCount: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANONYMOUS VISITOR TRACKING  —  app_visitors/{deviceId}
// Tracks devices that open the app, even without signing in
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate or retrieve a persistent device fingerprint
 */
function getDeviceId() {
  const KEY = 'mushiqr_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Called on every app startup to count device visits.
 * If the user later registers, linkVisitorToUser() marks them as registered.
 */
export async function trackAnonymousVisitor() {
  try {
    const deviceId = getDeviceId();
    const ref = doc(db, 'app_visitors', deviceId);
    const snap = await getDoc(ref);
    const now = new Date().toISOString();

    const deviceInfo = {
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || navigator.userAgentData?.platform || '',
      language: navigator.language || '',
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
      isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
    };

    if (snap.exists()) {
      await updateDoc(ref, {
        lastSeenAt: now,
        visitCount: increment(1),
        deviceInfo,
      });
    } else {
      await setDoc(ref, {
        deviceId,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        isRegistered: false,
        registeredUid: null,
        deviceInfo,
      });
    }
  } catch (e) {
    // Non-fatal
    console.warn('[DS] trackAnonymousVisitor:', e?.code, e?.message);
  }
}

/**
 * When a user signs in, link their visitor record to their uid
 */
export async function linkVisitorToUser(uid) {
  try {
    const deviceId = getDeviceId();
    const ref = doc(db, 'app_visitors', deviceId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        isRegistered: true,
        registeredUid: uid,
      });
    }
  } catch (e) {
    console.warn('[DS] linkVisitorToUser:', e?.code, e?.message);
  }
}

/**
 * Fetch all visitor records for admin panel
 */
export async function getAllVisitors() {
  try {
    const snap = await getDocs(collection(db, 'app_visitors'));
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
  } catch (e) {
    console.error('[DS] getAllVisitors:', e?.code, e?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REVENUE & MONETIZATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute real-time Revenue & SaaS Subscription metrics from app_users and plans
 */
export async function getRevenueAnalytics() {
  try {
    const users = await getAllAppUsers();
    const plans = await getSubscriptionPlans();
    
    // Default pricing reference
    const proMonthlyPrice = parseFloat(plans.find(p => p.id === 'pro_monthly' || p.billingPeriod === 'monthly')?.price || '4.99');
    const proYearlyPrice  = parseFloat(plans.find(p => p.id === 'pro_yearly' || p.billingPeriod === 'yearly')?.price || '39.99');
    const lifetimePrice   = parseFloat(plans.find(p => p.id === 'lifetime')?.price || '99.99');

    let totalRevenue = 0;
    let mrr = 0;
    let proCount = 0;
    let yearlyCount = 0;
    let lifetimeCount = 0;
    let freeCount = 0;

    users.forEach(u => {
      const plan = u.planId || u.subscriptionTier || (u.isPro ? 'pro_monthly' : 'free');
      if (plan === 'pro_monthly') {
        proCount++;
        mrr += proMonthlyPrice;
        totalRevenue += (u.visitCount || 1) * proMonthlyPrice;
      } else if (plan === 'pro_yearly') {
        yearlyCount++;
        mrr += proYearlyPrice / 12;
        totalRevenue += proYearlyPrice;
      } else if (plan === 'lifetime') {
        lifetimeCount++;
        totalRevenue += lifetimePrice;
      } else {
        freeCount++;
      }
    });

    const arr = mrr * 12;
    const paidUsers = proCount + yearlyCount + lifetimeCount;
    const totalUsers = users.length || 1;
    const conversionRate = ((paidUsers / totalUsers) * 100).toFixed(1);
    const arpu = (totalRevenue / totalUsers).toFixed(2);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      mrr: mrr.toFixed(2),
      arr: arr.toFixed(2),
      arpu,
      conversionRate,
      paidUsers,
      freeUsers: freeCount,
      proMonthlyUsers: proCount,
      proYearlyUsers: yearlyCount,
      lifetimeUsers: lifetimeCount,
      totalUsers,
    };
  } catch (e) {
    console.error('[DS] getRevenueAnalytics error:', e);
    return {
      totalRevenue: '0.00', mrr: '0.00', arr: '0.00', arpu: '0.00',
      conversionRate: '0.0', paidUsers: 0, freeUsers: 0,
      proMonthlyUsers: 0, proYearlyUsers: 0, lifetimeUsers: 0, totalUsers: 0
    };
  }
}

/**
 * Grant Pro access directly to a user document
 */
export async function grantUserProAccess(uid, planId = 'pro_monthly') {
  try {
    const fn = httpsCallable(functions, 'updateUserSubscription');
    await fn({ targetUid: uid, planId, isPro: true });
    return { ok: true };
  } catch (e) {
    console.error('[DS] grantUserProAccess:', e);
    return { ok: false, error: friendlyError(e) };
  }
}

/**
 * Revoke Pro access from a user document
 */
export async function revokeUserProAccess(uid) {
  try {
    const fn = httpsCallable(functions, 'updateUserSubscription');
    await fn({ targetUid: uid, planId: 'free', isPro: false });
    return { ok: true };
  } catch (e) {
    console.error('[DS] revokeUserProAccess:', e);
    return { ok: false, error: friendlyError(e) };
  }
}

/**
 * Fetch Promo Codes from global_config/promo_codes
 */
export async function getPromoCodes() {
  try {
    const snap = await getDoc(doc(db, 'global_config', 'promo_codes'));
    if (snap.exists()) return snap.data().codes || [];
    return [];
  } catch (e) {
    console.warn('[DS] getPromoCodes fallback:', e?.code);
    return [];
  }
}

/**
 * Save Promo Codes array to global_config/promo_codes
 */
export async function savePromoCodes(codes) {
  try {
    await setDoc(doc(db, 'global_config', 'promo_codes'), { codes, updatedAt: new Date().toISOString() });
    await _audit('PROMO_CODES_UPDATED', { count: codes.length });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

/**
 * Update global feature flag directly in Firestore + Cloud Function attempt + Local Cache
 */
export async function setFeatureFlagCloud(featureId, enabled) {
  try {
    // 1. Immediately write directly to Firestore (global_config/featureFlags)
    const flagsRef = doc(db, 'global_config', 'featureFlags');
    await setDoc(flagsRef, {
      [featureId]: enabled,
      _updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 2. Audit log
    await _audit('FEATURE_FLAG_TOGGLED', { featureId, enabled });

    return { ok: true };
  } catch (directErr) {
    console.warn('[DS] Direct Firestore featureFlag write warning:', directErr?.message);
    
    // Fallback: try Cloud Function
    try {
      const fn = httpsCallable(functions, 'updateFeatureFlag');
      const res = await fn({ featureId, enabled });
      return { ok: true, data: res.data };
    } catch (e) {
      console.error('[DS] setFeatureFlagCloud failed:', e);
      return { ok: false, error: friendlyError(directErr || e) };
    }
  }
}

/**
 * Update plan feature assignments (free, weekly, monthly, yearly) directly in Firestore
 */
export async function setPlanFeaturesCloud(planId, features) {
  try {
    // 1. Write directly to Firestore (subscription_plans/{planId})
    const planRef = doc(db, 'subscription_plans', planId);
    await setDoc(planRef, {
      planId,
      features,
      _updatedAt: new Date().toISOString(),
    }, { merge: true });

    await _audit('PLAN_FEATURES_UPDATED', { planId, count: features.length });
    return { ok: true };
  } catch (directErr) {
    console.warn('[DS] Direct Firestore plan write warning:', directErr?.message);
    
    // Fallback: try Cloud Function
    try {
      const fn = httpsCallable(functions, 'updatePlanFeatures');
      const res = await fn({ planId, features });
      return { ok: true, data: res.data };
    } catch (e) {
      console.error('[DS] setPlanFeaturesCloud failed:', e);
      return { ok: false, error: friendlyError(directErr || e) };
    }
  }
}

/**
 * Save complete Subscription Plan with pricing, interval, discounts, active status, and custom features
 * Uses publishMembershipConfig Cloud Function (server-authorized) with fallback.
 */
export async function savePlanFullCloud(planData) {
  const planId = planData.id || planData.planId;
  if (!planId) throw new Error('Plan ID is required');

  const cleanPrice = Number(planData.price);
  const validPrice = isNaN(cleanPrice) ? 0 : cleanPrice;

  const dataToSave = {
    ...planData,
    id: planId,
    planId: planId,
    price: validPrice,
    _updatedAt: new Date().toISOString(),
  };

  // 1. Direct Firestore write (immediate UI update, authorized by Firestore Rules for super_admin & owner email)
  try {
    const planRef = doc(db, 'subscription_plans', planId);
    await setDoc(planRef, dataToSave, { merge: true });

    const membershipRef = doc(db, 'global_config', 'membership');
    const snap = await getDoc(membershipRef);
    const current = snap.exists() ? snap.data() : {};
    const currentPlans = current.plans || {};
    const nextVersion = (current.configVersion || 100) + 1;

    await setDoc(membershipRef, {
      configVersion: nextVersion,
      plans: {
        ...currentPlans,
        [planId]: dataToSave,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await _audit('PLAN_SAVED_DIRECT', { planId, name: planData.name, price: validPrice });

    // 2. Background sync to Cloud Function for authoritative server audit log
    try {
      const publishFn = httpsCallable(functions, 'publishMembershipConfig');
      publishFn({
        plans: { ...currentPlans, [planId]: dataToSave },
        featureMatrix: current.featureMatrix || {},
        featureLimits: current.featureLimits || {},
      }).catch(cfErr => console.log('[DS] Background Cloud Function audit notice:', cfErr?.message));
    } catch {}

    return { ok: true, data: dataToSave, configVersion: nextVersion };
  } catch (directErr) {
    console.warn('[DS] Direct write notice, attempting Cloud Function:', directErr?.message);
    
    // Fallback: Cloud Function attempt if direct write was restricted
    try {
      const publishFn = httpsCallable(functions, 'publishMembershipConfig');
      const membershipRef = doc(db, 'global_config', 'membership');
      const snap = await getDoc(membershipRef);
      const current = snap.exists() ? snap.data() : {};
      const currentPlans = current.plans || {};

      const res = await publishFn({
        plans: { ...currentPlans, [planId]: dataToSave },
        featureMatrix: current.featureMatrix || {},
        featureLimits: current.featureLimits || {},
      });

      return { ok: true, data: dataToSave, configVersion: res.data?.configVersion };
    } catch (cloudErr) {
      console.error('[DS] Both direct write and Cloud Function failed:', { directErr, cloudErr });
      const isUnauth = cloudErr?.code === 'functions/unauthenticated' || directErr?.code === 'permission-denied';
      if (isUnauth) {
        throw new Error('You do not have Super Admin permissions, or your admin session has expired. Please refresh or sign in again.');
      }
      throw new Error(friendlyError(directErr || cloudErr));
    }
  }
}

/**
 * Delete a custom Subscription Plan
 */
export async function deletePlanCloud(planId) {
  if (['free', 'weekly', 'monthly', 'yearly'].includes(planId)) {
    throw new Error('Default system plans cannot be deleted. You can edit their pricing and features.');
  }

  try {
    const publishFn = httpsCallable(functions, 'publishMembershipConfig');
    const membershipRef = doc(db, 'global_config', 'membership');
    const snap = await getDoc(membershipRef);
    const current = snap.exists() ? snap.data() : {};
    const nextPlans = { ...(current.plans || {}) };
    delete nextPlans[planId];

    await publishFn({
      plans: nextPlans,
      featureMatrix: current.featureMatrix || {},
      featureLimits: current.featureLimits || {},
    });

    try {
      await deleteDoc(doc(db, 'subscription_plans', planId));
    } catch {}

    await _audit('PLAN_DELETED', { planId });
    return { ok: true };
  } catch (cloudErr) {
    try {
      const planRef = doc(db, 'subscription_plans', planId);
      await deleteDoc(planRef);

      const membershipRef = doc(db, 'global_config', 'membership');
      const snap = await getDoc(membershipRef);
      if (snap.exists()) {
        const current = snap.data();
        const nextPlans = { ...(current.plans || {}) };
        delete nextPlans[planId];
        await setDoc(membershipRef, {
          configVersion: (current.configVersion || 100) + 1,
          plans: nextPlans,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      await _audit('PLAN_DELETED', { planId });
      return { ok: true };
    } catch (directErr) {
      console.error('[DS] deletePlanCloud failed:', directErr);
      throw new Error(friendlyError(directErr || cloudErr));
    }
  }
}
