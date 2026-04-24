import React, { useState, useEffect, useRef } from 'react';
import { Menu, Crown, Plus, Link2, Type, Wifi, User, Mail, MapPin, History, Moon, Sun, Info, Shield, FileText, Home, Bookmark, Settings, QrCode, MoreVertical, ChevronRight, ScanLine } from 'lucide-react';
import { QR_TYPES } from '../utils/qrEngine';
import { getHistory } from '../utils/storage';

export default function HomePage({ onNavigate, onQuickCreate, theme, setTheme, effectiveTheme, activePage, onMenuClick }) {
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const history = getHistory();
    setRecentItems(history.slice(0, 3));
  }, []);

  const quickOptions = [
    { id: QR_TYPES.URL, label: 'Website', icon: <Link2 size={24} /> },
    { id: QR_TYPES.TEXT, label: 'Text', icon: <Type size={24} /> },
    { id: QR_TYPES.WIFI, label: 'WiFi', icon: <Wifi size={24} /> },
    { id: QR_TYPES.VCARD, label: 'Contact', icon: <User size={24} /> },
    { id: QR_TYPES.EMAIL, label: 'Email', icon: <Mail size={24} /> },
    { id: QR_TYPES.LOCATION, label: 'Location', icon: <MapPin size={24} /> },
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
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        {/* Hero Card */}
        <div style={{ padding: '0 24px', marginTop: '10px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #8B0020 0%, #D60036 45%, #FF2D5E 100%)',
            borderRadius: '24px',
            padding: '28px 24px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(214, 0, 54, 0.45)'
          }}>
            {/* Decorative circles for depth */}
            <div style={{
              position: 'absolute', top: '-24px', right: '90px',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute', bottom: '-30px', right: '20px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute', top: '10px', left: '-30px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
            }} />

            <div style={{ zIndex: 1, flex: 1 }}>
              <h2 style={{ 
                fontSize: '24px', fontWeight: 800, 
                margin: '0 0 6px 0', color: '#fff',
                lineHeight: 1.2
              }}>Create QR Code</h2>
              <p style={{ 
                fontSize: '13px', margin: '0 0 16px 0', 
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 500
              }}>Fast, Simple &amp; Beautiful</p>
              
              <button 
                onClick={() => onNavigate('generator')}
                style={{
                  backgroundColor: '#fff',
                  color: '#D60036',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={18} /> Create New
              </button>
            </div>

            <div style={{ 
              zIndex: 1,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.25)',
              flexShrink: 0
            }}>
              <QrCode size={60} color="#fff" />
            </div>
          </div>
        </div>

        {/* Quick Create Grid */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Quick Create</h3>
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
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '20px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  backgroundColor: 'rgba(214, 0, 54, 0.1)', 
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {option.icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent QR Codes */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent QR Codes</h3>
            <button onClick={() => onNavigate('history')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              See All <ChevronRight size={14} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.id} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
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
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
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
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 10px',
        zIndex: 50,
        boxShadow: '0 -10px 20px rgba(0,0,0,0.05)'
      }}>
        <button 
          onClick={() => onNavigate('home')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Home size={24} color={activePage === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Home</span>
        </button>
        
        <button 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <Bookmark size={24} color="var(--text-muted)" />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Saved</span>
        </button>

        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
          <button 
            onClick={() => onNavigate('scanner')}
            style={{ 
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              background: 'var(--accent-primary)',
              border: '4px solid var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(214, 0, 54, 0.3)',
              color: 'white'
            }}
          >
            <ScanLine size={24} />
          </button>
        </div>

        <button 
          onClick={() => onNavigate('history')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === 'history' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <History size={24} color={activePage === 'history' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>History</span>
        </button>
        
        <button 
          onClick={onMenuClick}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <Settings size={24} color="var(--text-muted)" />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Settings</span>
        </button>
      </div>
    </div>
  );
}
