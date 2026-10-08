import { useState, useEffect, useRef } from 'react';
import { getHistory, deleteFromHistory, clearHistory, saveToSaved, getSaved, clearHistoryByRange, deleteFromSaved, isItemSaved, toggleSaved } from '../utils/storage';
import { History as HistoryIcon, SearchX, Trash2, QrCode, Star, Clock, Link2, Wifi, User, Mail, Phone, MessageSquare, MapPin, FileCode, Image, Crown, AlertCircle } from 'lucide-react';
import { QR_TYPES, getQRItemTitle, getQRItemSubtitle } from '../utils/qrEngine';

import { FeatureAccessManager } from '../services/FeatureAccessManager';
import { usePremium } from '../services/premiumContext';
import DeleteConfirmModal from './DeleteConfirmModal';

const TYPE_ICONS = {
  [QR_TYPES.URL]: <Link2 size={14} />,
  [QR_TYPES.WIFI]: <Wifi size={14} />,
  [QR_TYPES.VCARD]: <User size={14} />,
  [QR_TYPES.EMAIL]: <Mail size={14} />,
  [QR_TYPES.PHONE]: <Phone size={14} />,
  [QR_TYPES.SMS]: <MessageSquare size={14} />,
  [QR_TYPES.LOCATION]: <MapPin size={14} />,
  [QR_TYPES.PDF]: <FileCode size={14} />,
  [QR_TYPES.IMAGE]: <Image size={14} />,
  [QR_TYPES.TEXT]: <FileCode size={14} />
};

export default function HistoryPage({ onLoadQR, onNavigate, initialFilter = 'All', showToast }) {
  const { showPaywall } = usePremium();
  const access = FeatureAccessManager.canUseFeature('history_view');

  useEffect(() => {
    if (!access.allowed && access.status !== 'disabled_by_admin') {
      showPaywall('history_view');
    }
  }, [access.allowed, access.status, showPaywall]);

  if (!access.allowed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#09090f', color: '#f0f0f8', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {access.status === 'disabled_by_admin' ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>History Log Unavailable</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 440, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              History tracking has been disabled globally by the Administrator.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('home')}
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))', border: '1px solid rgba(255, 215, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', boxShadow: '0 8px 24px rgba(255, 170, 0, 0.25)' }}>
              <Crown size={36} strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>Unlock Mushi QR Pro</h2>
            <p style={{ color: '#8b8fa8', maxWidth: 420, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              History tracking is a Pro feature. Upgrade your subscription plan to access your generation and scan activity log.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => showPaywall('history_view')}
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(255, 170, 0, 0.4)' }}
              >
                <Crown size={16} fill="#000" color="#000" strokeWidth={2.5} />
                <span>Buy Pro</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('home')}
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  const [history, setHistory] = useState([]);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
   const [swipedItemId, setSwipedItemId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    itemTitle: null,
    confirmText: 'Delete',
    iconType: 'trash',
    isDangerous: false,
    onConfirm: null
  });
  const menuRef = useRef(null);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);
  const [toast, setToast] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  const showLocalToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowRangeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = () => {
      setHistory(getHistory());
      setSavedIds(new Set(getSaved().map(s => s.id)));
    };

    loadData();

    window.addEventListener('storage-sync', loadData);
    return () => window.removeEventListener('storage-sync', loadData);
  }, []);

  const handleDelete = (item) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete History Item?',
      description: 'Are you sure you want to remove this record from your history log?',
      itemTitle: item.data || item.displayText || 'QR Code',
      confirmText: 'Delete',
      iconType: 'trash',
      isDangerous: false,
      onConfirm: () => {
        const updated = deleteFromHistory(item.id);
        setHistory(updated);
        setSwipedItemId(null);
        setSwipeOffset(0);
      }
    });
  };

  const handleToggleSave = (item) => {
    const isNowSaved = toggleSaved(item);
    const updatedSaved = getSaved();
    setSavedIds(new Set(updatedSaved.map(s => s.id)));
    if (isNowSaved) {
      if (showToast) showToast('Saved to your collection!', 'success');
      else showLocalToast('Saved to your collection!');
    } else {
      if (showToast) showToast('Removed from saved items', 'info');
      else showLocalToast('Removed from saved items');
    }
    setSwipedItemId(null);
    setSwipeOffset(0);
  };

  const handleClear = (hours) => {
    setShowRangeMenu(false);
    let title = 'Clear History?';
    let desc = 'Are you sure you want to clear your history records?';
    let isDang = false;

    if (hours === 1) {
      title = 'Clear Recent History?';
      desc = 'Remove history records from the last 1 hour?';
    } else if (hours === 24) {
      title = 'Clear 24h History?';
      desc = 'Remove history records from the last 24 hours?';
    } else if (hours === 168) {
      title = 'Clear 7-Day History?';
      desc = 'Remove history records from the last 7 days?';
    } else if (hours === -1) {
      title = 'Clear ALL History?';
      desc = 'Permanently delete ALL scan and creation history from this device? This action cannot be undone.';
      isDang = true;
    }

    setDeleteModalConfig({
      isOpen: true,
      title,
      description: desc,
      itemTitle: hours === -1 ? `All ${history.length} history records` : null,
      confirmText: hours === -1 ? 'Clear All' : 'Clear',
      iconType: hours === -1 ? 'alert' : 'trash',
      isDangerous: isDang,
      onConfirm: () => {
        const updated = clearHistoryByRange(hours);
        setHistory(updated);
      }
    });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayGroup = (iso) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return 'Older';
  };

  const getTypeLabel = (type) => {
    if (type === QR_TYPES.URL) return 'Website';
    if (type === QR_TYPES.WIFI) return 'WiFi';
    if (type === QR_TYPES.VCARD) return 'Contact';
    if (type === QR_TYPES.EMAIL) return 'Email';
    if (type === QR_TYPES.PHONE) return 'Phone';
    if (type === QR_TYPES.SMS) return 'SMS';
    if (type === QR_TYPES.LOCATION) return 'Location';
    if (type === QR_TYPES.PDF) return 'PDF';
    if (type === QR_TYPES.IMAGE) return 'Image';
    if (type === QR_TYPES.TEXT) return 'Text';
    return type ? type.replace('_', ' ') : 'QR Code';
  };

  const filteredHistory = history.filter(item => {
    if (activeFilter === 'Scanned') return item.source === 'scan';
    if (activeFilter === 'Created') return item.source !== 'scan';
    return true;
  });

  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const group = getDayGroup(item.timestamp);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});

  // Swipe logic
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setSwipedItemId(id);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!swipedItemId) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Limit swipe offset to between -100 and 100
    const boundedDiff = Math.max(-100, Math.min(100, diff));
    setSwipeOffset(boundedDiff);
  };

  const handleTouchEnd = (id) => {
    if (!swipedItemId || swipedItemId !== id) return;
    
    if (swipeOffset > 60) {
      // Swiped right -> Toggle Save
      const item = history.find(i => i.id === id);
      if (item) handleToggleSave(item);
    } else if (swipeOffset < -60) {
      // Swiped left -> Delete
      const item = history.find(i => i.id === id);
      if (item) handleDelete(item);
    } else {
      // Snap back
      setSwipedItemId(null);
      setSwipeOffset(0);
    }
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
      <div style={{ padding: '24px var(--main-padding-x) 16px', background: 'var(--bg-primary)', zIndex: 10 }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
          {['All', 'Scanned', 'Created'].map(tab => {
            const count = tab === 'All' ? history.length : history.filter(i => (tab === 'Scanned' ? i.source === 'scan' : i.source !== 'scan')).length;
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`tab-pill-premium ${isActive ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {tab} {count > 0 && <span style={{ opacity: 0.8, fontSize: '11px', fontWeight: 700 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px var(--main-padding-x) 100px' }} className="fade-in-up">
        {history.length === 0 ? (
          <div style={{
            background: 'var(--bg-elevated)',
            border: 'none',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Back document sheet */}
                <rect x="22" y="4" width="28" height="34" rx="3" fill="#FFF2F5" stroke="#FFE0E6" strokeWidth="1.5" />
                <line x1="28" y1="12" x2="44" y2="12" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="28" y1="18" x2="40" y2="18" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="28" y1="24" x2="36" y2="24" stroke="#FFCCD5" strokeWidth="1.5" strokeLinecap="round" />

                {/* Front document sheet */}
                <rect x="14" y="10" width="28" height="34" rx="3" fill="#FFFFFF" stroke="#FFE0E6" strokeWidth="1.5" />
                <line x1="20" y1="18" x2="36" y2="18" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="24" x2="32" y2="24" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="30" x2="28" y2="30" stroke="#FFA3B1" strokeWidth="1.5" strokeLinecap="round" />

                {/* Main Pink Folder Back */}
                <path d="M4 14C4 11.7909 5.79086 10 8 10H18.5858C19.6467 10 20.6641 10.4214 21.4142 11.1716L24.5858 14.3431C25.3359 15.0933 26.3533 15.5147 27.4142 15.5147H56C58.2091 15.5147 60 17.3239 60 19.533V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V14Z" fill="#FFAEC9" />
                {/* Main Pink Folder Front flap */}
                <path d="M4 18.533C4 16.3239 5.79086 14.5147 8 14.5147H56C58.2091 14.5147 60 16.3239 60 18.533V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V18.533Z" fill="#FFC2D6" />

                {/* Glow/Heart circle icon at bottom right */}
                <circle cx="52" cy="40" r="11" fill="#FFFFFF" filter=")" />
                <circle cx="52" cy="40" r="9" fill="#FFF0F3" stroke="#FF85A1" strokeWidth="1" />
                {/* Heart path */}
                <path d="M52 43C52 43 48.5 41.2 48.5 39.2C48.5 38 49.3 37.2 50.3 37.2C51.1 37.2 51.7 37.7 52 38.3C52.3 37.7 52.9 37.2 53.7 37.2C54.7 37.2 55.5 38 55.5 39.2C55.5 41.2 52 43 52 43Z" fill="#FF4D6D" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                No history yet
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>
                Generated and scanned QR codes will appear here automatically.
              </p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="premium-empty-state" style={{ padding: '40px 0' }}>
            No matching items found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Today', 'Yesterday', 'Older'].map((group, groupIndex) => {
              const items = groupedHistory[group];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={group}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0, color: 'var(--text-secondary)' }}>{group}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{items.length} items</span>
                      {groupIndex === 0 && history.length > 0 && (
                        <div style={{ position: 'relative' }} ref={menuRef}>
                          <button 
                            onClick={() => setShowRangeMenu(!showRangeMenu)}
                            style={{ 
                              background: 'rgba(214, 0, 54, 0.08)', 
                              border: 'none', 
                              color: '#D60036', 
                              cursor: 'pointer', 
                              padding: '4px 10px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: 700,
                              transition: 'all 0.2s'
                            }}
                            title="Clear History Records"
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(214, 0, 54, 0.16)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(214, 0, 54, 0.08)'}
                          >
                            <Trash2 size={13} />
                            <span>Clear</span>
                          </button>
                          
                          {showRangeMenu && (
                            <div style={{
                              position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                              borderRadius: '12px', padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                              zIndex: 100, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', padding: '4px 8px', textTransform: 'uppercase' }}>Clear History</div>
                              {[
                                { label: 'Last Hour', val: 1 },
                                { label: 'Last 24 Hours', val: 24 },
                                { label: 'Last 7 Days', val: 168 },
                                { label: 'All Time', val: -1, color: '#D60036' }
                              ].map(opt => (
                                <button
                                  key={opt.label}
                                  onClick={() => handleClear(opt.val)}
                                  style={{
                                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                                    background: 'transparent', color: opt.color || 'var(--text-primary)',
                                    fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Trash2 size={16} /> {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(item => {
                      const isSwiped = swipedItemId === item.id;
                      const currentOffset = isSwiped ? swipeOffset : 0;
                      const typeStr = item.qrType || item.type;
                      const isScanned = item.source === 'scan';
                      
                      return (
                        <div 
                          key={item.id}
                          style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}
                        >
                          {/* Swipe Action Backgrounds */}
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', justifyContent: 'space-between',
                            background: currentOffset > 0 ? '#F39C12' : '#D60036',
                            borderRadius: '16px', padding: '0 20px', alignItems: 'center',
                            opacity: currentOffset === 0 ? 0 : 1,
                            transition: 'opacity 0.2s'
                          }}>
                            {currentOffset > 0 ? (
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff' }}>
                                 <Star size={20} />
                                 <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Save</span>
                               </div>
                            ) : (
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', marginLeft: 'auto' }}>
                                 <Trash2 size={20} />
                                 <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Delete</span>
                               </div>
                            )}
                          </div>
                          
                          {/* Foreground Item Card */}
                          <div 
                            onTouchStart={(e) => handleTouchStart(e, item.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={() => handleTouchEnd(item.id)}
                            onClick={() => {
                              if (currentOffset === 0) onLoadQR(item);
                            }}
                            style={{
                              background: 'var(--bg-elevated)',
                              backgroundColor: 'var(--bg-elevated)',
                              border: 'none',
                              borderRadius: '14px',
                              padding: '9px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              position: 'relative',
                              zIndex: 2,
                              transform: `translateX(${currentOffset}px)`,
                              transition: isSwiped ? 'none' : 'transform 0.2s',
                              boxShadow: '0 3px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '10px',
                              background: '#fff', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', flexShrink: 0,
                              border: 'none', overflow: 'hidden'
                            }}>
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt="QR" style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
                              ) : (
                                <QrCode size={22} color="var(--accent-primary)" />
                              )}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {/* Top / Star Row: Title + Tag (Left) & Time + Star (Right) */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                                  <h4 style={{ 
                                    margin: 0, fontSize: '13.5px', fontWeight: 700, 
                                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                    overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>
                                    {getQRItemTitle(item)}
                                  </h4>
                                  <span style={{
                                    fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                                    background: isScanned ? 'rgba(0, 112, 243, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    color: isScanned ? '#0070F3' : '#10B981', display: 'inline-flex', alignItems: 'center', gap: '3px',
                                    flexShrink: 0
                                  }}>
                                    {isScanned ? 'Scan' : 'Create'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                  <span style={{ 
                                    fontSize: '10.5px', 
                                    color: 'var(--text-muted)', 
                                    whiteSpace: 'nowrap', 
                                    fontWeight: 500
                                  }}>
                                    {formatDate(item.timestamp)}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSave(item);
                                    }}
                                    title={savedIds.has(item.id) ? "Remove from Saved" : "Add to Saved"}
                                    style={{ 
                                      background: 'transparent', border: 'none', 
                                      color: savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)', cursor: 'pointer',
                                      padding: '2px', borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      lineHeight: 1,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#F39C12'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)'}
                                  >
                                    <Star 
                                      size={15} 
                                      fill={savedIds.has(item.id) ? '#F39C12' : 'none'}
                                      style={{ 
                                        transition: 'all 0.2s ease',
                                        transform: savedIds.has(item.id) ? 'scale(1.1)' : 'scale(1)',
                                        color: savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)'
                                      }}
                                    />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Bottom Row: Subtitle (Left) & Delete Button (Right) */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <p style={{ 
                                  margin: 0, 
                                  fontSize: '11.5px', 
                                  color: 'var(--text-secondary)', 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  flex: 1,
                                  minWidth: 0,
                                  lineHeight: 1.3
                                }}>
                                  {getQRItemSubtitle(item) || item.displayText || 'QR Code Data'}
                                </p>

                                <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item);
                                    }}
                                    title="Delete from History"
                                    style={{ 
                                      background: 'transparent', border: 'none', 
                                      color: 'var(--text-tertiary)', cursor: 'pointer',
                                      padding: '2px', borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      lineHeight: 1,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#EF4444';
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = 'var(--text-tertiary)';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification (Fallback) */}
      {!showToast && toast && (
        <div className="app-toast app-toast-success" onClick={() => setToast(null)}>
          <div className="app-toast-icon">
            <Star size={14} fill="#F39C12" strokeWidth={0} />
          </div>
          <span className="app-toast-msg">{toast}</span>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        itemTitle={deleteModalConfig.itemTitle}
        confirmText={deleteModalConfig.confirmText}
        iconType={deleteModalConfig.iconType}
        isDangerous={deleteModalConfig.isDangerous}
      />

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

