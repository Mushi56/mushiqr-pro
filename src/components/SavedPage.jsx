import { useState, useEffect, useRef } from 'react';
import { getSaved, deleteFromSaved, clearSaved, clearSavedByRange } from '../utils/storage';
import { Search, SearchX, Trash2, MoreVertical, Star, Link2, Wifi, User, Mail, Phone, MessageSquare, MapPin, FileCode, Image, QrCode } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';

const TYPE_ICONS = {
  [QR_TYPES.URL]: <Link2 size={16} />,
  [QR_TYPES.WIFI]: <Wifi size={16} />,
  [QR_TYPES.VCARD]: <User size={16} />,
  [QR_TYPES.EMAIL]: <Mail size={16} />,
  [QR_TYPES.PHONE]: <Phone size={16} />,
  [QR_TYPES.SMS]: <MessageSquare size={16} />,
  [QR_TYPES.LOCATION]: <MapPin size={16} />,
  [QR_TYPES.PDF]: <FileCode size={16} />,
  [QR_TYPES.IMAGE]: <Image size={16} />,
  [QR_TYPES.TEXT]: <FileCode size={16} />
};

export default function SavedPage({ onLoadQR }) {
  const [saved, setSaved] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const menuRef = useRef(null);

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
    setSaved(getSaved());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const updated = deleteFromSaved(id);
    setSaved(updated);
    setOpenMenuId(null);
  };

  const handleClear = (hours) => {
    let msg = 'Are you sure?';
    if (hours === 1) msg = 'Clear saved items from the last hour?';
    if (hours === 24) msg = 'Clear saved items from the last 24 hours?';
    if (hours === 168) msg = 'Clear saved items from the last 7 days?';
    if (hours === -1) msg = 'Clear ALL saved items?';

    if (window.confirm(msg)) {
      const updated = clearSavedByRange(hours);
      setSaved(updated);
      setShowRangeMenu(false);
    }
  };

  const getQRTitle = (item) => {
    return item.displayText || 'Unnamed QR Code';
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
    return 'QR Code';
  };

  // Group types for filters based on current data
  const availableTypes = ['All', ...new Set(saved.map(item => getTypeLabel(item.qrType || item.type)))];

  const filteredItems = saved.filter(item => {
    const matchesSearch = getQRTitle(item).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || getTypeLabel(item.qrType || item.type) === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="saved-page fade-in" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top)'
    }}>
      {/* Header */}
      <div style={{ padding: '24px var(--main-padding-x) 16px', background: 'var(--bg-primary)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(214, 0, 54, 0.1)', color: '#D60036',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Star size={24} fill="#D60036" strokeWidth={0} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Saved</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Your saved QR codes
            </p>
          </div>
          {saved.length > 0 && (
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
                   <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', padding: '4px 8px', textTransform: 'uppercase' }}>Clear Saved</div>
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

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)',
          borderRadius: '16px', padding: '0 16px', border: '1px solid var(--border-color)',
          marginBottom: '16px'
        }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search saved QR codes" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', padding: '16px',
              color: 'var(--text-primary)', fontSize: '15px', outline: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {availableTypes.map(type => {
            const count = type === 'All' ? saved.length : saved.filter(i => getTypeLabel(i.qrType || i.type) === type).length;
            const isActive = activeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '8px 16px',
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
                  gap: '6px'
                }}
              >
                {type} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px' }}>
        {saved.length === 0 ? (
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
              <Star size={60} strokeWidth={1} color="var(--text-tertiary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No saved items yet</h3>
              <p style={{ fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                Save QR codes to access them anytime.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No matching saved QR codes found.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
            gap: '12px',
            width: '100%'
          }}>
            {filteredItems.map((item) => {
              const typeStr = item.qrType || item.type;
              return (
              <div 
                key={item.id} 
                onClick={() => onLoadQR(item)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  minWidth: 0 // Prevent expansion
                }}
              >
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
                  <Star size={16} fill="#D60036" strokeWidth={0} />
                </div>
                
                <div style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '8px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="QR" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                  ) : (
                    <QrCode size={40} color="var(--accent-primary)" />
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: 'rgba(214, 0, 54, 0.1)', color: '#D60036',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {TYPE_ICONS[typeStr] || <QrCode size={14} />}
                  </div>
                  <h4 style={{ 
                    margin: 0, fontSize: '12px', fontWeight: 700, 
                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
                  }}>
                    {getQRTitle(item)}
                  </h4>
                  
                  <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === item.id && (
                      <div style={{
                        position: 'absolute', bottom: '100%', right: 0,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        zIndex: 10, minWidth: '120px'
                      }}>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '10px 12px', background: 'none', border: 'none',
                            borderRadius: '8px', color: '#D60036', fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {getTypeLabel(typeStr)}
                </p>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
