import { useState, useEffect } from 'react';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/storage';
import { SearchX, Trash2, ArrowDownToLine, ChevronLeft, QrCode, Clock, ExternalLink } from 'lucide-react';

export default function HistoryPage({ onLoadQR, onNavigate }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
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
    }) + ' • ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page fade-in" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px var(--main-padding-x) 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        zIndex: 10
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>History</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {history.length} saved QR codes
          </p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={handleClear}
            style={{
              background: 'rgba(214, 0, 54, 0.1)',
              border: 'none',
              color: '#D60036',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(214, 0, 54, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(214, 0, 54, 0.1)'}
          >
            <Trash2 size={16} /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px var(--main-padding-x)', paddingBottom: '100px' }}>
        {history.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '40px',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
            }}>
              <SearchX size={60} strokeWidth={1} color="var(--text-tertiary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No history found</h3>
              <p style={{ fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                Your generated and saved QR codes will appear here for quick access.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onLoadQR(item)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--border-color)'
                }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <QrCode size={32} color="var(--accent-primary)" />
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      background: 'rgba(214, 0, 54, 0.1)', 
                      color: '#D60036',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px'
                    }}>
                      {item.qrType || item.type}
                    </span>
                  </div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.displayText || 'Unnamed QR Code'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span style={{ fontSize: '12px' }}>{formatDate(item.timestamp)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    style={{
                      background: 'var(--bg-hover)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#D60036';
                      e.currentTarget.style.background = 'rgba(214, 0, 54, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
