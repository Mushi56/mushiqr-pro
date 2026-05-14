import React, { useState, useEffect, useRef } from 'react';
import { Menu, Crown, Plus, Link2, Type, Wifi, User, Mail, MapPin, History, Moon, Sun, Info, Shield, FileText, Home, Bookmark, Settings, QrCode, MoreVertical, ChevronRight, ScanLine, Phone, MessageSquare, FileCode, Image, Trash2 } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/storage';
import AppIcon from './AppIcon';

export default function HomePage({ onNavigate, onQuickCreate, onLoadQR, theme, setTheme, effectiveTheme, activePage, onMenuClick }) {
  const [recentItems, setRecentItems] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (activePage === 'home') {
      const history = getHistory();
      setRecentItems(history.slice(0, 10));
    }
  }, [activePage]);

  const quickOptions = [
    { id: QR_TYPES.URL, label: 'Website', icon: <Link2 size={20} /> },
    { id: QR_TYPES.TEXT, label: 'Text', icon: <Type size={20} /> },
    { id: QR_TYPES.WIFI, label: 'WiFi', icon: <Wifi size={20} /> },
    { id: QR_TYPES.EMAIL, label: 'Email', icon: <Mail size={20} /> },
    { id: QR_TYPES.PHONE, label: 'Phone', icon: <Phone size={20} /> },
    { id: QR_TYPES.SMS, label: 'SMS', icon: <MessageSquare size={20} /> },
    { id: QR_TYPES.VCARD, label: 'Contact', icon: <User size={20} /> },
    { id: QR_TYPES.LOCATION, label: 'Location', icon: <MapPin size={20} /> },
    { id: QR_TYPES.PDF, label: 'PDF', icon: <FileCode size={20} /> },
    { id: QR_TYPES.IMAGE, label: 'Image', icon: <Image size={20} /> },
  ];

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getQRTitle = (item) => {
    const type = item.qrType || item.type || '';
    if (type === QR_TYPES.URL) return 'Website Link';
    if (type === QR_TYPES.WIFI) return 'WiFi Network';
    if (type === QR_TYPES.VCARD) return 'Contact Card';
    if (type === QR_TYPES.EMAIL) return 'Email';
    if (type === QR_TYPES.PHONE) return 'Phone Call';
    if (type === QR_TYPES.SMS) return 'SMS Message';
    if (type === QR_TYPES.LOCATION) return 'Location';
    if (type === QR_TYPES.TEXT) return 'Plain Text';
    if (type === QR_TYPES.PDF) return 'PDF File';
    if (type === QR_TYPES.IMAGE) return 'Image';
    return type ? type.split('_').join(' ') : 'QR Code';
  };

  const getQRSubtitle = (item) => {
    const data = item.qrData || item.data || {};
    return data.url || data.ssid || data.text || data.email || data.phone || item.displayText || 'QR Code Data';
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      paddingTop: 'env(safe-area-inset-top)'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        {/* Hero Card */}
        <div style={{ padding: '0 var(--main-padding-x)', marginTop: '24px' }}>
          <div className="home-hero-card">
            {/* Decorative circles for depth */}
            <div className="hero-circle circle-1" />
            <div className="hero-circle circle-2" />

            <div className="hero-content">
                <h2 className="hero-title">Create QR Code</h2>
                <p className="hero-subtitle">Fast, Simple & Beautiful</p>

              <button 
                onClick={() => onNavigate('generator')}
                className="hero-cta-btn"
              >
                <Plus size={16} /> Create New
              </button>
            </div>

            <div className="hero-icon-wrapper">
              <QrCode size={60} color="#fff" />
            </div>
          </div>
        </div>

        {/* Quick Create Grid */}
        <div style={{ padding: '24px var(--main-padding-x)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Quick Create</h3>
          <div className="quick-create-grid">
            {quickOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onQuickCreate(option.id)}
                className="quick-option-btn"
              >
                <div style={{ 
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {React.cloneElement(option.icon, { size: 22, strokeWidth: 1.5 })}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 var(--main-padding-x) 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent Projects</h3>
            {recentItems.length > 0 && (
              <button 
                onClick={() => {
                  clearHistory();
                  setRecentItems([]);
                }} 
                style={{ 
                  background: 'rgba(214, 0, 54, 0.1)', border: 'none', 
                  color: '#D60036', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  cursor: 'pointer', borderRadius: '8px', padding: '6px 12px'
                }}
              >
                <Trash2 size={14} /> Delete All
              </button>
            )}
          </div>
          
          <div className="recent-projects-grid">
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.id} className="project-card" onClick={() => onLoadQR(item)}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(214, 0, 54, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={24} color="var(--accent-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getQRTitle(item)}
                  </h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getQRSubtitle(item)}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDate(item.timestamp)}
                  </p>
                </div>
                <div style={{ position: 'relative' }} ref={openMenuId === item.id ? menuRef : null}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === item.id ? null : item.id);
                    }}
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <MoreVertical size={20} />
                  </button>
                  {openMenuId === item.id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '4px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: '140px',
                      animation: 'fadeIn 0.15s ease'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = deleteFromHistory(item.id);
                          setRecentItems(updated.slice(0, 10));
                          setOpenMenuId(null);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          width: '100%', padding: '10px 12px',
                          background: 'none', border: 'none',
                          borderRadius: '8px',
                          color: '#D60036', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(214,0,54,0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(214,0,54,0.06)'}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent projects found.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>

  );
}
