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
          <div className="qr-box-decorative">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="3" height="3" rx="0.5" fill="white" />
              <rect x="14" y="7" width="3" height="3" rx="0.5" fill="white" />
              <rect x="7" y="14" width="3" height="3" rx="0.5" fill="white" />
              <path d="M14 14h1v1h-1zM15 15h1v1h-1zM16 14h1v1h-1zM14 16h1v1h-1zM16 16h1v1h-1z" fill="white" />
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
