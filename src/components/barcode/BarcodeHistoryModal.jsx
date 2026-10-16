import React, { useState, useMemo } from 'react';
import { X, Search, Star, Trash2, Copy, Edit2, Clock, Check, Barcode } from 'lucide-react';
import { getHistory, deleteFromHistory, saveToHistory } from '../../utils/storage';

export default function BarcodeHistoryModal({
  isOpen,
  onClose,
  onSelectHistoryItem,
  showToast
}) {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'favorites' | 'recent'
  const [items, setItems] = useState(() => {
    return getHistory().filter(item => item.qrType === 'BARCODE' || item.style?.bcid);
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.trim().toLowerCase();
      const text = (item.displayText || item.qrData?.text || '').toLowerCase();
      const bcid = (item.style?.bcid || '').toLowerCase();
      const matchSearch = !q || text.includes(q) || bcid.includes(q);
      const matchFilter = filter === 'all' ? true : filter === 'favorites' ? item.favorite : true;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteFromHistory(id);
    setItems(getHistory().filter(item => item.qrType === 'BARCODE' || item.style?.bcid));
    showToast('Deleted from history', 'info');
  };

  const handleToggleFavorite = (item, e) => {
    e.stopPropagation();
    const updated = { ...item, favorite: !item.favorite };
    saveToHistory(updated);
    setItems(getHistory().filter(i => i.qrType === 'BARCODE' || i.style?.bcid));
  };

  const handleCopyText = (text, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    showToast('Copied barcode text', 'success');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderRadius: 24,
        padding: '24px',
        maxWidth: 440,
        width: '100%',
        maxHeight: '85vh',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary, #FF7C00)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              SAVED ARCHIVE
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary, #1C1C1E)' }}>
              Barcode History
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-hover, rgba(0,0,0,0.06))',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #636366)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input, #F2F2F7)',
          borderRadius: 12,
          padding: '0 12px',
          height: 38
        }}>
          <Search size={16} color="#8E8E93" style={{ marginRight: 8 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary, #1C1C1E)'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'recent', label: 'Recent' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: 'none',
                background: filter === f.id ? 'var(--accent-primary, #FF7C00)' : 'var(--bg-hover, #F2F2F7)',
                color: filter === f.id ? '#FFFFFF' : 'var(--text-secondary, #636366)',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 220,
          paddingRight: 4
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: 'var(--text-muted, #8E8E93)',
              gap: 8
            }}>
              <Barcode size={36} strokeWidth={1.5} opacity={0.4} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>No barcode history found</span>
            </div>
          ) : (
            filteredItems.map(item => {
              const textVal = item.displayText || item.qrData?.text || '';
              const bcid = (item.style?.bcid || 'ean13').toUpperCase();
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'var(--bg-elevated, #F9F9FB)',
                    border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt="Preview"
                        style={{ width: 44, height: 32, objectFit: 'contain', background: '#FFFFFF', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 32, borderRadius: 6, background: 'var(--bg-hover, #E5E5EA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Barcode size={18} color="#8E8E93" />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-primary, #FF7C00)' }}>
                          {bcid}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted, #8E8E93)' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--text-primary, #1C1C1E)',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {textVal}
                      </span>
                    </div>
                  </div>

                  {/* Quick Item Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={(e) => handleToggleFavorite(item, e)}
                      title="Favorite"
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: item.favorite ? '#FF9500' : '#8E8E93' }}
                    >
                      <Star size={16} fill={item.favorite ? '#FF9500' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleCopyText(textVal, e)}
                      title="Copy"
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#8E8E93' }}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#FF3B30' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
