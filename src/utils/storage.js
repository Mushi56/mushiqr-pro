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
