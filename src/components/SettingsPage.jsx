import { Moon, Sun, Info, Shield, FileText, ChevronRight } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/storage';
import AppIcon from './AppIcon';

export default function SettingsPage({ theme, setTheme, effectiveTheme }) {
  const handleThemeChange = () => {
    let next;
    if (theme === 'dark') next = 'light';
    else if (theme === 'light') next = 'auto';
    else next = 'dark';
    
    setTheme(next);
    savePreferences({ ...getPreferences(), theme: next });
  };

  const menuItems = [
    {
      id: 'theme',
      label: 'Theme',
      icon: theme === 'dark' ? <Moon size={20} /> : theme === 'light' ? <Sun size={20} /> : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      value: <span style={{
        textTransform: 'capitalize',
        color: theme === 'dark' ? '#00F0FF' : theme === 'light' ? '#FF007F' : (effectiveTheme === 'dark' ? '#00F0FF' : '#FF007F'),
        fontWeight: 'bold'
      }}>{theme}</span>,
      onClick: handleThemeChange
    },
    {
      id: 'about',
      label: 'About MushiQR Pro',
      icon: <Info size={20} />,
      onClick: () => window.location.hash = '#/about'
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: <Shield size={20} />,
      onClick: () => window.location.hash = '#/privacy-policy'
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      icon: <FileText size={20} />,
      onClick: () => window.location.hash = '#/terms'
    }
  ];

  return (
    <div className="settings-page fade-in" style={{
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
      <div style={{
        padding: '24px var(--main-padding-x) 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        zIndex: 10
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Settings</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          App preferences and information
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px var(--main-padding-x) 100px' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          {menuItems.map((item, index) => (
            <div key={item.id}>
              <div 
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(214, 0, 54, 0.08)', color: '#D60036',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, fontSize: '15px', fontWeight: 600 }}>
                  {item.label}
                </div>
                {item.value && (
                  <div style={{ marginRight: '12px', fontSize: '14px' }}>
                    {item.value}
                  </div>
                )}
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
              {index < menuItems.length - 1 && (
                <div style={{ height: '1px', background: 'var(--border-color)', marginLeft: '72px' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <AppIcon size={56} shadow />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>MushiQR Pro</p>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Version 1.1.0</p>
        </div>
      </div>
    </div>
  );
}
