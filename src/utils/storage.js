/**
 * History & storage utilities
 */

const HISTORY_KEY = 'qrgen_history';
const DRAFTS_KEY = 'qrgen_drafts';
const PREFS_KEY = 'qrgen_preferences';
const MAX_HISTORY = 50;
const MAX_DRAFTS = 10;

export function saveToHistory(entry) {
  const history = getHistory();
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  history.unshift(newEntry);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function clearHistoryByRange(hours) {
  if (hours === -1) {
    clearHistory();
    return [];
  }
  const history = getHistory();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  const updated = history.filter(item => {
    const time = new Date(item.timestamp).getTime();
    return time < cutoff;
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

const SAVED_KEY = 'qrgen_saved';
const MAX_SAVED = 100;

export function saveToSaved(entry) {
  const saved = getSaved();
  
  // Ensure the entry has an ID
  const entryToSave = {
    ...entry,
    id: entry.id || ('saved_' + Date.now().toString(36) + Math.random().toString(36).substr(2)),
    savedAt: new Date().toISOString()
  };

  // Check if already exists to avoid duplicates
  if (saved.find(item => item.id === entryToSave.id)) return entryToSave;
  
  saved.unshift(entryToSave);
  if (saved.length > MAX_SAVED) saved.pop();
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return entryToSave;
}

export function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteFromSaved(id) {
  const saved = getSaved().filter(item => item.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return saved;
}

export function clearSaved() {
  localStorage.removeItem(SAVED_KEY);
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
  return updated;
}

export function saveToDrafts(entry) {
  const drafts = getDrafts();
  
  // Create a unique hash/identifier based on the core content to avoid duplicates
  const contentHash = JSON.stringify({ type: entry.qrType, data: entry.qrData });
  
  // Filter out any existing draft with the same content to move it to the top
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
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}
