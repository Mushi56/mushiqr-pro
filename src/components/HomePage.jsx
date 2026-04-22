import React from 'react';
import { 
  Plus, 
  Link as LinkIcon, 
  Type, 
  Wifi, 
  User, 
  Mail, 
  MapPin, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';

const HomePage = ({ onQuickCreate, onNavigate, history = [] }) => {
  const quickOptions = [
    { id: 'url', label: 'URL / Link', icon: LinkIcon, color: '#6c5ce7', bgColor: '#eeebff' },
    { id: 'text', label: 'Text', icon: Type, color: '#00d1b2', bgColor: '#e6fffb' },
    { id: 'wifi', label: 'WiFi', icon: Wifi, color: '#3498db', bgColor: '#e1f5fe' },
    { id: 'vcard', label: 'Contact', icon: User, color: '#f39c12', bgColor: '#fff9e6' },
    { id: 'email', label: 'Email', icon: Mail, color: '#e74c3c', bgColor: '#ffebee' },
    { id: 'location', label: 'Location', icon: MapPin, color: '#9b59b6', bgColor: '#f3e5f5' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="home-hero-card">
        <div className="hero-content">
          <h1 className="hero-title">Create QR Code</h1>
          <p className="hero-subtitle">Fast, Simple & Beautiful</p>
          <button className="hero-btn" onClick={() => onQuickCreate('url')}>
            <Plus size={18} />
            <span>Create New</span>
          </button>
        </div>
        <div className="hero-qr-preview">
          <div className="qr-box-decorative" style={{ color: 'white' }}>
            <svg width="64" height="64" viewBox="0 0 21 21" fill="none">
              <rect x="0" y="0" width="7" height="7" fill="currentColor" />
              <rect x="1" y="1" width="5" height="5" fill="none" stroke="var(--accent-primary)" strokeWidth="1" />
              <rect x="2" y="2" width="3" height="3" fill="currentColor" />
              
              <rect x="14" y="0" width="7" height="7" fill="currentColor" />
              <rect x="15" y="1" width="5" height="5" fill="none" stroke="var(--accent-primary)" strokeWidth="1" />
              <rect x="16" y="2" width="3" height="3" fill="currentColor" />
              
              <rect x="0" y="14" width="7" height="7" fill="currentColor" />
              <rect x="1" y="15" width="5" height="5" fill="none" stroke="var(--accent-primary)" strokeWidth="1" />
              <rect x="2" y="16" width="3" height="3" fill="currentColor" />
              
              <rect x="14" y="14" width="3" height="3" fill="currentColor" />
              <rect x="18" y="14" width="3" height="3" fill="currentColor" />
              <rect x="14" y="18" width="3" height="3" fill="currentColor" />
              <rect x="18" y="18" width="3" height="3" fill="currentColor" />
            </svg>
          </div>
        </div>
      </section>

      {/* Quick Create Section */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">Quick Create</h2>
          <button className="section-see-all" onClick={() => onNavigate('generator')}>
            See All <ChevronRight size={14} />
          </button>
        </div>
        <div className="quick-create-grid">
          {quickOptions.map(opt => (
            <button 
              key={opt.id} 
              className="quick-opt-card" 
              onClick={() => onQuickCreate(opt.id)}
            >
              <div className="quick-opt-icon" style={{ backgroundColor: opt.bgColor, color: opt.color }}>
                <opt.icon size={22} />
              </div>
              <span className="quick-opt-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent QR Codes Section */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">Recent QR Codes</h2>
          <button className="section-see-all" onClick={() => onNavigate('history')}>
            See All <ChevronRight size={14} />
          </button>
        </div>
        <div className="recent-list">
          {history.length > 0 ? (
            history.slice(0, 3).map((item, idx) => (
              <div key={idx} className="recent-item-card">
                <div className="recent-thumb">
                  <img src={item.thumbnail} alt="QR Thumbnail" />
                </div>
                <div className="recent-info">
                  <h3 className="recent-name">{item.displayText || 'Untitled QR'}</h3>
                  <p className="recent-meta">{item.qrType.toUpperCase()} • {new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
                <button className="recent-more">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-recent">
              <p>No recent QR codes yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
