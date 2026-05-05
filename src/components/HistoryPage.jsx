import { useState, useEffect, useRef } from 'react';
import { getHistory, deleteFromHistory, clearHistory, saveToSaved, getSaved, clearHistoryByRange } from '../utils/storage';
import { History as HistoryIcon, SearchX, Trash2, QrCode, Star, Clock, MoreVertical, Link2, Wifi, User, Mail, Phone, MessageSquare, MapPin, FileCode, Image } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';

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

export default function HistoryPage({ onLoadQR, onNavigate }) {
  const [history, setHistory] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
   const [swipedItemId, setSwipedItemId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const menuRef = useRef(null);
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
    setHistory(getHistory());
    setSavedIds(new Set(getSaved().map(s => s.id)));
  }, []);

  const handleDelete = (id) => {
    const updated = deleteFromHistory(id);
    setHistory(updated);
    setSwipedItemId(null);
    setSwipeOffset(0);
  };

  const handleSave = (item) => {
    saveToSaved(item);
    setSavedIds(new Set([...savedIds, item.id]));
    setSwipedItemId(null);
    setSwipeOffset(0);
    showLocalToast('Added to Saved QRs');
  };

  const handleClear = (hours) => {
    let msg = 'Are you sure?';
    if (hours === 1) msg = 'Clear history from the last hour?';
    if (hours === 24) msg = 'Clear history from the last 24 hours?';
    if (hours === 168) msg = 'Clear history from the last 7 days?';
    if (hours === -1) msg = 'Clear ALL history?';

    if (window.confirm(msg)) {
      const updated = clearHistoryByRange(hours);
      setHistory(updated);
      setShowRangeMenu(false);
    }
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
      // Swiped right -> Save
      const item = history.find(i => i.id === id);
      if (item) handleSave(item);
    } else if (swipeOffset < -60) {
      // Swiped left -> Delete
      handleDelete(id);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(214, 0, 54, 0.1)', color: '#D60036',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <HistoryIcon size={24} color="#D60036" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>History</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Your scan and creation history
            </p>
          </div>
          {history.length > 0 && (
             <div style={{ position: 'relative' }} ref={menuRef}>
               <button 
                 onClick={() => setShowRangeMenu(!showRangeMenu)}
                 style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px' }}
               >
                 <MoreVertical size={24} />
               </button>
               
               {showRangeMenu && (
                 <div style={{
                   position: 'absolute', top: '100%', right: 0,
                   background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                   borderRadius: '12px', padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
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

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
          {['All', 'Scanned', 'Created'].map(tab => {
            const count = tab === 'All' ? history.length : history.filter(i => (tab === 'Scanned' ? i.source === 'scan' : i.source !== 'scan')).length;
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #D60036' : '1px solid var(--border-color)',
                  background: isActive ? '#D60036' : 'var(--bg-elevated)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {tab} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px var(--main-padding-x) 100px' }}>
        {history.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            gap: '20px', color: 'var(--text-muted)'
          }}>
             <div style={{
              width: '120px', height: '120px', borderRadius: '40px',
              background: 'var(--bg-elevated)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
            }}>
              <HistoryIcon size={60} strokeWidth={1} color="var(--text-tertiary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No history yet</h3>
              <p style={{ fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                Your scans and created QR codes will appear here.
              </p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No matching items found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Today', 'Yesterday', 'Older'].map(group => {
              const items = groupedHistory[group];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={group}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{group}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{items.length} items</span>
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
                              backgroundColor: 'var(--bg-elevated)', // Ensure solid background
                              border: '1px solid var(--border-color)',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              position: 'relative',
                              zIndex: 2,
                              transform: `translateX(${currentOffset}px)`,
                              transition: isSwiped ? 'none' : 'transform 0.2s',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '12px',
                              background: '#fff', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', flexShrink: 0,
                              border: '1px solid var(--border-color)', overflow: 'hidden'
                            }}>
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt="QR" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                              ) : (
                                <QrCode size={24} color="var(--accent-primary)" />
                              )}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ 
                                  margin: 0, fontSize: '15px', fontWeight: 700, 
                                  color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                  overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                  {item.displayText || 'Unnamed QR Code'}
                                </h4>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {getTypeLabel(typeStr)}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.qrData?.url || item.qrData?.text || item.qrData?.ssid || 'Data'}
                                </span>
                              </div>
                              
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                                  background: isScanned ? 'rgba(0, 112, 243, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  color: isScanned ? '#0070F3' : '#10B981', display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                  {isScanned ? <QrCode size={10} /> : <FileCode size={10} />}
                                  {isScanned ? 'Scanned' : 'Created'}
                                </span>
                              </div>
                            </div>
                            
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleSave(item);
                               }}
                               style={{ 
                                 background: 'transparent', border: 'none', 
                                 color: 'var(--text-tertiary)', cursor: 'pointer',
                                 padding: '8px', borderRadius: '50%',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center'
                               }}
                               onMouseEnter={(e) => e.currentTarget.style.color = '#F39C12'}
                               onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                             >
                               <Star 
                                 size={18} 
                                 fill={savedIds.has(item.id) ? '#F39C12' : 'none'}
                                 style={{ 
                                   transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                   transform: savedIds.has(item.id) ? 'scale(1.2)' : 'scale(1)',
                                   color: savedIds.has(item.id) ? '#F39C12' : 'var(--text-tertiary)'
                                 }}
                               />
                             </button>
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

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 24px', borderRadius: '30px',
          fontSize: '14px', fontWeight: 600, zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideUpFade 0.3s ease-out'
        }}>
          <Star size={16} fill="#F39C12" strokeWidth={0} /> {toast}
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
