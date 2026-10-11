import { db, auth } from '../services/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import { FeatureAccessManager } from '../services/FeatureAccessManager';

const HISTORY_KEY = 'qrgen_history';
const DRAFTS_KEY = 'qrgen_drafts';
const PREFS_KEY = 'qrgen_preferences';
const MAX_HISTORY = 50;
const MAX_DRAFTS = 10;

export function saveToHistory(entry) {
  const access = FeatureAccessManager.canUseFeature('history');
  if (!access.allowed) {
    console.warn('[Storage] saveToHistory blocked: feature is disabled or restricted.');
    return null;
  }

  const history = getHistory();
  const existingIndex = entry.id ? history.findIndex(item => item.id === entry.id) : -1;
  
  const newEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
    id: entry.id || (Date.now().toString(36) + Math.random().toString(36).substr(2)),
  };
  
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }
  
  history.unshift(newEntry);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // Firestore mirror sync
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'history', newEntry.id);
      setDoc(docRef, newEntry).catch(e => console.error('Firestore saveToHistory error:', e));
    }
  } catch (e) {
    console.error('Firestore saveToHistory error:', e);
  }

  return newEntry;
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteFromHistory(id) {
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // Mirror deletion to Firestore
  try {
    const user = auth.currentUser;
    if (user && id) {
      deleteDoc(doc(db, 'users', user.uid, 'history', id)).catch(e => console.error('Firestore deleteFromHistory error:', e));
    }
  } catch (e) {
    console.error('Firestore deleteFromHistory error:', e);
  }

  return history;
}

export function clearHistory() {
  const current = getHistory();
  localStorage.removeItem(HISTORY_KEY);

  // Mirror purge to Firestore
  try {
    const user = auth.currentUser;
    if (user && current.length > 0) {
      const batch = writeBatch(db);
      current.forEach(item => {
        if (item.id) {
          batch.delete(doc(db, 'users', user.uid, 'history', item.id));
        }
      });
      batch.commit().catch(e => console.error('Firestore clearHistory error:', e));
    }
  } catch (e) {
    console.error('Firestore clearHistory error:', e);
  }
}

export function clearHistoryByRange(hours) {
  if (hours === -1) {
    clearHistory();
    return [];
  }
  const history = getHistory();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  const toDelete = [];
  const updated = history.filter(item => {
    const time = new Date(item.timestamp).getTime();
    if (time >= cutoff) {
      toDelete.push(item);
      return false;
    }
    return true;
  });

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

  // Mirror range purge to Firestore
  try {
    const user = auth.currentUser;
    if (user && toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach(item => {
        if (item.id) {
          batch.delete(doc(db, 'users', user.uid, 'history', item.id));
        }
      });
      batch.commit().catch(e => console.error('Firestore clearHistoryByRange error:', e));
    }
  } catch (e) {
    console.error('Firestore clearHistoryByRange error:', e);
  }

  return updated;
}

const SAVED_KEY = 'qrgen_saved';
const MAX_SAVED = 100;

export function saveToSaved(entry) {
  const access = FeatureAccessManager.canUseFeature('saved');
  if (!access.allowed) {
    console.warn('[Storage] saveToSaved blocked: feature is disabled or restricted.');
    return null;
  }

  const saved = getSaved();
  
  const entryToSave = {
    ...entry,
    id: entry.id || ('saved_' + Date.now().toString(36) + Math.random().toString(36).substr(2)),
    savedAt: new Date().toISOString()
  };

  const existingIndex = saved.findIndex(item => item.id === entryToSave.id);
  if (existingIndex !== -1) {
    saved.splice(existingIndex, 1);
  }
  
  saved.unshift(entryToSave);
  if (saved.length > MAX_SAVED) saved.pop();
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  window.dispatchEvent(new Event('storage-sync'));

  // Firestore mirror sync
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'saved', entryToSave.id);
      setDoc(docRef, entryToSave).catch(e => console.error('Firestore saveToSaved error:', e));
    }
  } catch (e) {
    console.error('Firestore saveToSaved error:', e);
  }

  return entryToSave;
}

export function isItemSaved(itemOrId) {
  if (!itemOrId) return false;
  const saved = getSaved();
  if (typeof itemOrId === 'string') {
    return saved.some(s => s.id === itemOrId);
  }
  const id = itemOrId.id;
  const displayText = itemOrId.displayText || itemOrId.data;
  const text = itemOrId.qrData?.text || itemOrId.qrData?.url;
  return saved.some(s => {
    if (id && s.id === id) return true;
    if (displayText && s.displayText === displayText) return true;
    if (text && (s.qrData?.text === text || s.qrData?.url === text)) return true;
    return false;
  });
}

export function toggleSaved(item) {
  if (!item) return false;
  const saved = getSaved();
  const id = item.id;
  const displayText = item.displayText || item.data;
  const text = item.qrData?.text || item.qrData?.url;

  const match = saved.find(s => {
    if (id && s.id === id) return true;
    if (displayText && s.displayText === displayText) return true;
    if (text && (s.qrData?.text === text || s.qrData?.url === text)) return true;
    return false;
  });

  if (match) {
    deleteFromSaved(match.id);
    return false; // Removed
  } else {
    saveToSaved(item);
    return true; // Added
  }
}

export function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteFromSaved(idOrItem) {
  const saved = getSaved();
  let toDeleteIds = [];
  if (typeof idOrItem === 'string') {
    toDeleteIds.push(idOrItem);
  } else if (idOrItem && typeof idOrItem === 'object') {
    const id = idOrItem.id;
    const displayText = idOrItem.displayText || idOrItem.data;
    const text = idOrItem.qrData?.text || idOrItem.qrData?.url;
    saved.forEach(s => {
      if ((id && s.id === id) || (displayText && s.displayText === displayText) || (text && (s.qrData?.text === text || s.qrData?.url === text))) {
        toDeleteIds.push(s.id);
      }
    });
    if (toDeleteIds.length === 0 && id) toDeleteIds.push(id);
  }

  const remaining = saved.filter(item => !toDeleteIds.includes(item.id));
  localStorage.setItem(SAVED_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new Event('storage-sync'));

  // Mirror deletion to Firestore
  try {
    const user = auth.currentUser;
    if (user && toDeleteIds.length > 0) {
      const batch = writeBatch(db);
      toDeleteIds.forEach(id => {
        batch.delete(doc(db, 'users', user.uid, 'saved', id));
      });
      batch.commit().catch(e => console.error('Firestore deleteFromSaved error:', e));
    }
  } catch (e) {
    console.error('Firestore deleteFromSaved error:', e);
  }

  return remaining;
}

export function clearSaved() {
  const current = getSaved();
  localStorage.removeItem(SAVED_KEY);
  window.dispatchEvent(new Event('storage-sync'));

  // Mirror purge to Firestore
  try {
    const user = auth.currentUser;
    if (user && current.length > 0) {
      const batch = writeBatch(db);
      current.forEach(item => {
        if (item.id) {
          batch.delete(doc(db, 'users', user.uid, 'saved', item.id));
        }
      });
      batch.commit().catch(e => console.error('Firestore clearSaved error:', e));
    }
  } catch (e) {
    console.error('Firestore clearSaved error:', e);
  }
}

export function clearSavedByRange(hours) {
  if (hours === -1) {
    clearSaved();
    return [];
  }
  const saved = getSaved();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  const updated = saved.filter(item => {
    const time = new Date(item.savedAt || item.timestamp).getTime();
    return time < cutoff;
  });

  localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-sync'));
  return updated;
}

export function saveToDrafts(entry) {
  const drafts = getDrafts();
  const contentHash = JSON.stringify({ type: entry.qrType, data: entry.qrData });
  const filteredDrafts = drafts.filter(d => JSON.stringify({ type: d.qrType, data: d.qrData }) !== contentHash);
  
  const newEntry = {
    id: 'draft_' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    ...entry,
    isDraft: true
  };
  
  filteredDrafts.unshift(newEntry);
  if (filteredDrafts.length > MAX_DRAFTS) filteredDrafts.pop();
  
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(filteredDrafts));
  return newEntry;
}

export function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteFromDrafts(id) {
  const drafts = getDrafts().filter(item => item.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return drafts;
}

export function clearDrafts() {
  localStorage.removeItem(DRAFTS_KEY);
}

export function savePreferences(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    if (!prefs.saveLocation || prefs.saveLocation === 'Mushi QR Pro') {
      prefs.saveLocation = 'Pictures/Mushi QR Pro';
    }
    if (prefs.scanSound === undefined) {
      const legacySound = localStorage.getItem('qrgen_scan_sound');
      prefs.scanSound = legacySound !== 'false';
    }
    if (prefs.autoOpenUrl === undefined) {
      const legacyAutoOpen = localStorage.getItem('qrgen_auto_open_url');
      prefs.autoOpenUrl = legacyAutoOpen === 'true';
    }
    return prefs;
  } catch {
    return { 
      saveLocation: 'Pictures/Mushi QR Pro',
      scanSound: true,
      autoOpenUrl: false
    };
  }
}

/**
 * Selective cloud sync: Syncs ONLY Saved items and/or History items.
 * Settings/Preferences/Theme are NEVER synced and remain 100% device-local.
 */
export async function syncUserFirestoreData({ syncSaved = true, syncHistory = true } = {}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not signed in' };

  const access = FeatureAccessManager.canUseFeature('cloud_sync');
  if (!access.allowed) {
    console.warn('[Storage] syncUserFirestoreData blocked: cloud_sync feature is disabled or restricted.');
    return { success: false, error: 'Feature disabled' };
  }

  try {
    const result = { success: true, savedCount: 0, historyCount: 0 };
    const batch = writeBatch(db);
    let hasBatchWrites = false;

    // ── 1. Sync History / Recent (if requested) ──
    if (syncHistory) {
      const historyColRef = collection(db, 'users', user.uid, 'history');
      const historySnapshot = await getDocs(historyColRef);
      const dbHistory = [];
      historySnapshot.forEach(d => dbHistory.push(d.data()));

      const localHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const historyMap = new Map();
      dbHistory.forEach(item => historyMap.set(item.id, item));
      localHistory.forEach(item => {
        const existing = historyMap.get(item.id);
        if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
          historyMap.set(item.id, item);
        }
      });
      const mergedHistory = Array.from(historyMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, MAX_HISTORY);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
      mergedHistory.forEach(item => {
        const docRef = doc(db, 'users', user.uid, 'history', item.id);
        batch.set(docRef, item);
        hasBatchWrites = true;
      });
      result.historyCount = mergedHistory.length;
    }

    // ── 2. Sync Saved Templates & Codes (if requested) ──
    if (syncSaved) {
      const savedColRef = collection(db, 'users', user.uid, 'saved');
      const savedSnapshot = await getDocs(savedColRef);
      const dbSaved = [];
      savedSnapshot.forEach(d => dbSaved.push(d.data()));

      const localSaved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      const savedMap = new Map();
      dbSaved.forEach(item => savedMap.set(item.id, item));
      localSaved.forEach(item => {
        const existing = savedMap.get(item.id);
        const timeLocal = new Date(item.savedAt || item.timestamp).getTime();
        const timeExisting = existing ? new Date(existing.savedAt || existing.timestamp).getTime() : 0;
        if (!existing || timeLocal > timeExisting) {
          savedMap.set(item.id, item);
        }
      });
      const mergedSaved = Array.from(savedMap.values())
        .sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp))
        .slice(0, MAX_SAVED);

      localStorage.setItem(SAVED_KEY, JSON.stringify(mergedSaved));
      mergedSaved.forEach(item => {
        const docRef = doc(db, 'users', user.uid, 'saved', item.id);
        batch.set(docRef, item);
        hasBatchWrites = true;
      });
      result.savedCount = mergedSaved.length;
    }

    // Commit batch writes if any
    if (hasBatchWrites) {
      await batch.commit();
    }

    // Trigger UI update
    window.dispatchEvent(new Event('storage-sync'));
    return result;
  } catch (err) {
    console.error('Failed to sync Firestore data:', err);
    return { success: false, error: err.message || 'Sync failed' };
  }
}

export async function syncUserSavedData() {
  return syncUserFirestoreData({ syncSaved: true, syncHistory: false });
}

export async function syncUserHistoryData() {
  return syncUserFirestoreData({ syncSaved: false, syncHistory: true });
}

export async function syncUserAllData() {
  return syncUserFirestoreData({ syncSaved: true, syncHistory: true });
}

/**
 * Fetch counts of items currently stored in Firestore cloud for this user
 */
export async function getUserCloudCounts() {
  const user = auth.currentUser;
  if (!user) return { cloudSavedCount: 0, cloudHistoryCount: 0 };
  try {
    const historyColRef = collection(db, 'users', user.uid, 'history');
    const savedColRef = collection(db, 'users', user.uid, 'saved');
    const [hSnap, sSnap] = await Promise.all([getDocs(historyColRef), getDocs(savedColRef)]);
    return { cloudSavedCount: sSnap.size, cloudHistoryCount: hSnap.size };
  } catch (e) {
    console.error('Failed to get cloud counts:', e);
    return { cloudSavedCount: 0, cloudHistoryCount: 0 };
  }
}

/**
 * Restore data from Firestore cloud to local storage on demand
 */
export async function restoreUserCloudData({ restoreSaved = true, restoreHistory = true } = {}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not signed in' };

  try {
    let restoredSavedCount = 0;
    let restoredHistoryCount = 0;

    if (restoreHistory) {
      const historyColRef = collection(db, 'users', user.uid, 'history');
      const historySnapshot = await getDocs(historyColRef);
      const dbHistory = [];
      historySnapshot.forEach(d => dbHistory.push(d.data()));

      const localHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const historyMap = new Map();
      localHistory.forEach(item => historyMap.set(item.id, item));
      dbHistory.forEach(item => historyMap.set(item.id, item)); // Cloud items restored

      const mergedHistory = Array.from(historyMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, MAX_HISTORY);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
      restoredHistoryCount = dbHistory.length;
    }

    if (restoreSaved) {
      const savedColRef = collection(db, 'users', user.uid, 'saved');
      const savedSnapshot = await getDocs(savedColRef);
      const dbSaved = [];
      savedSnapshot.forEach(d => dbSaved.push(d.data()));

      const localSaved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      const savedMap = new Map();
      localSaved.forEach(item => savedMap.set(item.id, item));
      dbSaved.forEach(item => savedMap.set(item.id, item)); // Cloud items restored

      const mergedSaved = Array.from(savedMap.values())
        .sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp))
        .slice(0, MAX_SAVED);

      localStorage.setItem(SAVED_KEY, JSON.stringify(mergedSaved));
      restoredSavedCount = dbSaved.length;
    }

    window.dispatchEvent(new Event('storage-sync'));
    return { success: true, restoredSavedCount, restoredHistoryCount };
  } catch (err) {
    console.error('Failed to restore Firestore data:', err);
    return { success: false, error: err.message || 'Restore failed' };
  }
}

export async function restoreUserSavedData() {
  return restoreUserCloudData({ restoreSaved: true, restoreHistory: false });
}

export async function restoreUserHistoryData() {
  return restoreUserCloudData({ restoreSaved: false, restoreHistory: true });
}

export async function restoreUserAllData() {
  return restoreUserCloudData({ restoreSaved: true, restoreHistory: true });
}

/**
 * Delete / Clear cloud backup data from Firestore
 */
export async function clearUserCloudData({ clearSaved = true, clearHistory = true } = {}) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not signed in' };

  try {
    if (clearHistory) {
      const historyColRef = collection(db, 'users', user.uid, 'history');
      const historySnapshot = await getDocs(historyColRef);
      const docs = historySnapshot.docs;
      if (docs.length > 0) {
        try {
          const chunkSize = 400;
          for (let i = 0; i < docs.length; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (batchErr) {
          console.warn('Batch delete history failed, falling back to individual deletes:', batchErr);
          await Promise.all(docs.map(d => deleteDoc(d.ref).catch(e => console.error('Individual doc delete error:', e))));
        }
      }
    }

    if (clearSaved) {
      const savedColRef = collection(db, 'users', user.uid, 'saved');
      const savedSnapshot = await getDocs(savedColRef);
      const docs = savedSnapshot.docs;
      if (docs.length > 0) {
        try {
          const chunkSize = 400;
          for (let i = 0; i < docs.length; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (batchErr) {
          console.warn('Batch delete saved failed, falling back to individual deletes:', batchErr);
          await Promise.all(docs.map(d => deleteDoc(d.ref).catch(e => console.error('Individual doc delete error:', e))));
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to clear cloud data:', err);
    return { success: false, error: err.message || 'Clear cloud data failed' };
  }
}

export async function clearUserCloudSavedData() {
  return clearUserCloudData({ clearSaved: true, clearHistory: false });
}

export async function clearUserCloudHistoryData() {
  return clearUserCloudData({ clearSaved: false, clearHistory: true });
}

export async function clearUserCloudAllData() {
  return clearUserCloudData({ clearSaved: true, clearHistory: true });
}

export function handleLogoutClear() {
  // Preserve local device history, saved items, and theme preferences across logouts
  // so user data is never deleted when signing out or switching accounts.
}
