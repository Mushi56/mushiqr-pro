import { useState } from 'react';

const LOGO_PRESETS = [
  { slug: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: 'https://img.icons8.com/color/144/whatsapp.png' },
  { slug: 'instagram', name: 'Instagram', color: '#E4405F', url: 'https://img.icons8.com/color/144/instagram-new.png' },
  { slug: 'facebook', name: 'Facebook', color: '#1877F2', url: 'https://img.icons8.com/color/144/facebook-new.png' },
  { slug: 'x', name: 'X', color: '#000000', url: 'https://img.icons8.com/color/144/twitterx.png' },
  { slug: 'youtube', name: 'YouTube', color: '#FF0000', url: 'https://img.icons8.com/color/144/youtube-play.png' },
  { slug: 'linkedin', name: 'LinkedIn', color: '#0A66C2', url: 'https://img.icons8.com/color/144/linkedin.png' },
  { slug: 'tiktok', name: 'TikTok', color: '#000000', url: 'https://img.icons8.com/color/144/tiktok.png' },
  { slug: 'telegram', name: 'Telegram', color: '#26A5E4', url: 'https://img.icons8.com/color/144/telegram-app.png' },
  { slug: 'snapchat', name: 'Snapchat', color: '#FFFC00', url: 'https://img.icons8.com/color/144/snapchat.png' },
  { slug: 'discord', name: 'Discord', color: '#5865F2', url: 'https://img.icons8.com/color/144/discord-new.png' },
  { slug: 'pinterest', name: 'Pinterest', color: '#BD081C', url: 'https://img.icons8.com/color/144/pinterest.png' },
  { slug: 'reddit', name: 'Reddit', color: '#FF4500', url: 'https://img.icons8.com/color/144/reddit.png' },
  { slug: 'slack', name: 'Slack', color: '#4A154B', url: 'https://img.icons8.com/color/144/slack-new.png' },
  { slug: 'spotify', name: 'Spotify', color: '#1DB954', url: 'https://img.icons8.com/color/144/spotify.png' },
];

export default function LogoPresets({ onLogoChange }) {
  const [loading, setLoading] = useState(null);

  const handleSelect = (slug, name, url) => {
    setLoading(slug);
    const src = url;
    
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
            onClick={() => handleSelect(logo.slug, logo.name, logo.url)}
            title={logo.name}
            style={{ '--brand-color': logo.color }}
          >
            <img 
              src={logo.url} 
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
