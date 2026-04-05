import { useState, useEffect } from 'react';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/storage';
import { SearchX, Trash2, ArrowDownToLine, RefreshCw } from 'lucide-react';

export default function HistoryPage({ onLoadQR }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (id) => {
    const updated = deleteFromHistory(id);
    setHistory(updated);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (history.length === 0) {
    return (
      <div className="history-page fade-in">
        <div className="history-header">
          <h2 className="history-title">History</h2>
        </div>
        <div className="history-empty">
          <span className="history-empty-icon text-muted">
            <SearchX size={64} strokeWidth={1} color="var(--text-tertiary)" />
          </span>
          <p style={{ fontWeight: 500, fontSize: '18px' }}>No QR codes generated yet</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Your generated QR codes and templates will automatically appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="history-title">History ({history.length})</h2>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>
          <Trash2 size={14} /> Clear All
        </button>
      </div>
      <div className="history-grid">
        {history.map((item) => (
          <div key={item.id} className="history-card scale-in">
            <div className="history-card-preview">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="QR code" />
              ) : (
                <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No Preview</div>
              )}
            </div>
            <div className="history-card-info">
              <span className="history-card-type">{item.qrType || item.type}</span>
              <span className="history-card-data">{item.displayText}</span>
              <span className="history-card-date">{formatDate(item.timestamp)}</span>
            </div>
            <div className="history-card-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onLoadQR(item)}
                style={{ flex: 1 }}
              >
                <ArrowDownToLine size={14} /> Load Template
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDelete(item.id)}
                style={{ color: 'var(--error)' }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
