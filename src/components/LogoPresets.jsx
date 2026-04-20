import { useState } from 'react';

const LOGO_PRESETS = [
  { slug: 'whatsapp', name: 'WhatsApp', color: '#25D366' },
  { slug: 'instagram', name: 'Instagram', color: '#E4405F' },
  { slug: 'facebook', name: 'Facebook', color: '#1877F2' },
  { slug: 'x', name: 'X', color: '#000000' },
  { slug: 'youtube', name: 'YouTube', color: '#FF0000' },
  { slug: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
  { slug: 'tiktok', name: 'TikTok', color: '#000000' },
  { slug: 'telegram', name: 'Telegram', color: '#26A5E4' },
  { slug: 'snapchat', name: 'Snapchat', color: '#FFFC00' },
  { slug: 'discord', name: 'Discord', color: '#5865F2' },
];

export default function LogoPresets({ onLogoChange }) {
  const [loading, setLoading] = useState(null);

  const handleSelect = (slug, name) => {
    setLoading(slug);
    const src = `https://cdn.simpleicons.org/${slug}`;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      onLogoChange({
        image: img,
        name: name,
        size: 0,
        src: src,
      });
      setLoading(null);
    };
    img.onerror = () => {
      console.error(`Failed to load logo: ${name}`);
      setLoading(null);
    };
    img.src = src;
  };

  return (
    <div className="logo-presets-container">
      <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Quick Social Logos</label>
      <div className="logo-presets-grid">
        {LOGO_PRESETS.map((logo) => (
          <button
            key={logo.slug}
            className={`logo-preset-btn ${loading === logo.slug ? 'loading' : ''}`}
            onClick={() => handleSelect(logo.slug, logo.name)}
            title={logo.name}
            style={{ '--brand-color': logo.color }}
          >
            <img 
              src={`https://cdn.simpleicons.org/${logo.slug}/${logo.color.replace('#', '')}`} 
              alt={logo.name} 
              loading="lazy"
              crossOrigin="anonymous"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
