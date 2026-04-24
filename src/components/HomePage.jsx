import React, { useState, useEffect, useRef } from 'react';
import { Menu, Crown, Plus, Link2, Type, Wifi, User, Mail, MapPin, History, Moon, Sun, Info, Shield, FileText, Home, Bookmark, Settings, QrCode, MoreVertical, ChevronRight } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';
import { getHistory } from '../utils/storage';

export default function HomePage({ onNavigate, onQuickCreate, theme, setTheme, effectiveTheme, activePage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    const history = getHistory();
    setRecentItems(history.slice(0, 3));

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickOptions = [
    { id: QR_TYPES.URL, label: 'URL / Link', icon: <Link2 size={24} />, color: '#6C5CE7', bg: '#F3F0FF' },
    { id: QR_TYPES.TEXT, label: 'Text', icon: <Type size={24} />, color: '#10B981', bg: '#ECFDF5' },
    { id: QR_TYPES.WIFI, label: 'WiFi', icon: <Wifi size={24} />, color: '#3B82F6', bg: '#EFF6FF' },
    { id: QR_TYPES.VCARD, label: 'Contact', icon: <User size={24} />, color: '#F59E0B', bg: '#FFFBEB' },
    { id: QR_TYPES.EMAIL, label: 'Email', icon: <Mail size={24} />, color: '#EF4444', bg: '#FEF2F2' },
    { id: QR_TYPES.LOCATION, label: 'Location', icon: <MapPin size={24} />, color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getQRTitle = (item) => {
    if (item.type === QR_TYPES.URL) return 'Website Link';
    if (item.type === QR_TYPES.WIFI) return 'WiFi Network';
    if (item.type === QR_TYPES.VCARD) return 'Contact Card';
    return item.type.split('_').join(' ');
  };

  const getQRSubtitle = (item) => {
    return item.data.url || item.data.ssid || item.data.text || item.data.email || 'QR Code Data';
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#FAFAFA',
      color: '#212427',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          backgroundColor: '#FAFAFA',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div className="menu-container" ref={menuRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: '#212427', cursor: 'pointer', padding: 0 }}
            >
              <Menu size={28} />
            </button>
            {isMenuOpen && (
              <div className="app-dropdown-menu fade-in" style={{ left: 0, top: '40px', right: 'auto' }}>
                <div className="menu-links">
                  <button className={`menu-link-btn ${activePage === 'home' ? 'active' : ''}`} onClick={() => { setIsMenuOpen(false); onNavigate('home'); }}>
                    <Home size={16} /> Home
                  </button>
                  <button className={`menu-link-btn ${activePage === 'history' ? 'active' : ''}`} onClick={() => { setIsMenuOpen(false); onNavigate('history'); }}>
                    <History size={16} /> History
                  </button>
                  <button
                    className="menu-link-btn"
                    onClick={() => {
                      let next;
                      if (theme === 'dark') next = 'light';
                      else if (theme === 'light') next = 'auto';
                      else next = 'dark';
                      setTheme(next);
                    }}
                  >
                    {theme === 'dark' ? (
                      <Moon size={16} />
                    ) : theme === 'light' ? (
                      <Sun size={16} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20" />
                        <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    Theme <span style={{
                      textTransform: 'capitalize',
                      marginLeft: 4,
                      color: theme === 'dark' ? '#00F0FF' : theme === 'light' ? '#FF007F' : (effectiveTheme === 'dark' ? '#00F0FF' : '#FF007F'),
                      fontWeight: 'bold'
                    }}>{theme}</span>
                  </button>
                  <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/about'}>
                    <Info size={16} /> About
                  </button>
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/privacy-policy'}>
                    <Shield size={16} /> Privacy Policy
                  </button>
                  <button className="menu-link-btn" onClick={() => window.location.hash = '#/terms'}>
                    <FileText size={16} /> Terms of Service
                  </button>
                </div>
                <div className="menu-footer">
                  <p>© 2026 MushiQR Pro</p>
                  <p>All rights reserved</p>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '0.5px', color: '#6C5CE7' }}>MUSHI</h1>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#666', letterSpacing: '0.5px' }}>QR Code Pro</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(245, 158, 11, 0.15)', 
            padding: '8px', 
            borderRadius: '12px',
            color: '#F59E0B' 
          }}>
            <Crown size={20} />
          </div>
        </header>

        {/* Hero Card */}
        <div style={{ padding: '0 24px', marginTop: '10px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)',
            borderRadius: '24px',
            padding: '24px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(108, 92, 231, 0.25)'
          }}>
            <div style={{ zIndex: 1, flex: 1 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0' }}>Create QR Code</h2>
              <p style={{ fontSize: '13px', margin: '0 0 20px 0', opacity: 0.9 }}>Fast, Simple & Beautiful</p>
              <button 
                onClick={() => onNavigate('generator')}
                style={{
                  background: '#1A1A2E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Create New
              </button>
            </div>
            <div style={{ zIndex: 1, background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <QrCode size={64} color="white" />
            </div>
          </div>
        </div>

        {/* Quick Create Grid */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Quick Create</h3>
            <button style={{ background: 'none', border: 'none', color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              See All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px' 
          }}>
            {quickOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onQuickCreate(option.id)}
                style={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '16px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  backgroundColor: option.bg, 
                  color: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {option.icon}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#212427' }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent QR Codes */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Recent QR Codes</h3>
            <button onClick={() => onNavigate('history')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              See All <ChevronRight size={14} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ width: '48px', height: '48px', background: '#F5F5F5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={24} color="#212427" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#212427', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getQRTitle(item)}
                  </h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getQRSubtitle(item)}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>
                    {formatDate(item.timestamp)}
                  </p>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '8px' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#999', fontSize: '13px' }}>
                No recent QR codes found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'white',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 10px',
        zIndex: 50,
        boxShadow: '0 -10px 20px rgba(0,0,0,0.03)'
      }}>
        <button 
          onClick={() => onNavigate('home')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'home' ? '#6C5CE7' : '#999' }}
        >
          <Home size={24} color={activePage === 'home' ? '#6C5CE7' : '#999'} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Home</span>
        </button>
        
        <button 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#999' }}
        >
          <Bookmark size={24} color="#999" />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Saved</span>
        </button>

        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
          <button 
            onClick={() => onNavigate('generator')}
            style={{ 
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)',
              border: '4px solid #FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(108, 92, 231, 0.3)',
              color: 'white'
            }}
          >
            <QrCode size={24} />
          </button>
        </div>

        <button 
          onClick={() => onNavigate('history')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'history' ? '#6C5CE7' : '#999' }}
        >
          <History size={24} color={activePage === 'history' ? '#6C5CE7' : '#999'} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>History</span>
        </button>
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#999' }}
        >
          <Settings size={24} color="#999" />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Settings</span>
        </button>
      </div>
    </div>
  );
}
