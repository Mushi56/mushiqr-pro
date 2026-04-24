import React, { useState, useEffect, useRef } from 'react';
import { Menu, Crown, Plus, Link2, Type, Wifi, User, Mail, MapPin, History, Moon, Sun, Info, Shield, FileText } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';

export default function HomePage({ onNavigate, onQuickCreate, theme, setTheme, effectiveTheme, activePage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickOptions = [
    { id: QR_TYPES.URL, label: 'Website', icon: <Link2 size={24} />, color: '#4F46E5' },
    { id: QR_TYPES.TEXT, label: 'Text', icon: <Type size={24} />, color: '#059669' },
    { id: QR_TYPES.WIFI, label: 'WiFi', icon: <Wifi size={24} />, color: '#0284C7' },
    { id: QR_TYPES.VCARD, label: 'Contact', icon: <User size={24} />, color: '#D97706' },
    { id: QR_TYPES.EMAIL, label: 'Email', icon: <Mail size={24} />, color: '#E11D48' },
    { id: QR_TYPES.LOCATION, label: 'Location', icon: <MapPin size={24} />, color: '#16A34A' },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#FAFAFA',
      color: '#212427',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home
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
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Mushi QR Pro</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(214, 0, 54, 0.1)', 
          padding: '8px', 
          borderRadius: '12px',
          color: '#D60036' 
        }}>
          <Crown size={20} />
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '10px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#212427', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 12px 24px rgba(33, 36, 39, 0.15)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <rect x="14" y="14" width="3" height="3"></rect>
          </svg>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.2 }}>Create Your Next<br/>QR Code</h2>
        <p style={{ color: '#666', fontSize: '15px', margin: '0 0 32px 0', maxWidth: '280px' }}>
          Design beautiful, custom QR codes for your business or personal use.
        </p>
        <button 
          onClick={() => onNavigate('generator')}
          style={{
            backgroundColor: '#D60036',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 12px 24px rgba(214, 0, 54, 0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            width: '100%',
            maxWidth: '300px',
            justifyContent: 'center'
          }}
        >
          <Plus size={20} />
          Create New QR Code
        </button>
      </div>

      {/* Quick Create Grid */}
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Quick Create</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
          gap: '16px' 
        }}>
          {quickOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onQuickCreate(option.id)}
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '20px',
                padding: '20px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '16px', 
                backgroundColor: `${option.color}15`, 
                color: option.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {option.icon}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#212427' }}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Spacer for bottom nav */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
}
