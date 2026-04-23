import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, CheckCircle2 } from 'lucide-react';

const LOGO_PRESETS = [
  { slug: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/70/af/4a/70af4af2-a08e-a810-b6d5-42027416f9f1/AppIcon-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-85-220.png/512x512bb.jpg' },
  { slug: 'instagram', name: 'Instagram', color: '#E4405F', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/18/73/96/187396d0-9ea0-cd65-83f6-42550506b3f3/Prod-0-0-1x_U007epad-0-1-0-sRGB-85-220.png/512x512bb.jpg' },
  { slug: 'facebook', name: 'Facebook', color: '#1877F2', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5a/27/ac/5a27acbb-4b2a-8c6f-40e6-c9b5a1aed6b6/Icon-Production-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg' },
  { slug: 'x', name: 'X', color: '#000000', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/fe/b1/9a/feb19ad2-ed11-4322-3e9e-4b869126f7e8/ProductionAppIcon-0-0-1x_U007emarketing-0-8-0-0-0-85-220.png/512x512bb.jpg' },
  { slug: 'youtube', name: 'YouTube', color: '#FF0000', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/75/aa/76/75aa76e8-aebd-475f-6a09-346b103e19a3/logo_youtube_2024_q4_color-0-0-1x_U007emarketing-0-0-0-7-0-0-0-85-220.png/512x512bb.jpg' },
  { slug: 'linkedin', name: 'LinkedIn', color: '#0A66C2', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/38/bd/9a/38bd9af1-77ba-9f20-9159-c41d0b7589ad/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg' },
  { slug: 'tiktok', name: 'TikTok', color: '#000000', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/be/78/6e/be786e47-e6ca-510d-0214-5439aac28f37/TikTok_AppIcon26-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg' },
  { slug: 'telegram', name: 'Telegram', color: '#26A5E4', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/da/4c/f6/da4cf68b-3261-b5f2-1b2d-cf8bbce4b6d1/Telegram-0-0-1x_U007epad-0-1-0-sRGB-85-220.png/512x512bb.jpg' },
  { slug: 'snapchat', name: 'Snapchat', color: '#FFFC00', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/71/9c/83/719c8366-b2c9-f087-91b7-e1a6606b223d/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg' },
  { slug: 'discord', name: 'Discord', color: '#5865F2', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/25/85/00/25850032-a067-3439-8ec4-5417ef606dea/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg' },
  { slug: 'threads', name: 'Threads', color: '#000000', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f8/b9/3a/f8b93a6c-cfe4-17bf-d260-8a9f15739c52/Prod-0-0-1x_U007ephone-0-0-0-1-0-0-P3-85-220.png/512x512bb.jpg' },
  { slug: 'gmail', name: 'Gmail', color: '#EA4335', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/38/3b/c1/383bc1a3-ba7f-33a8-bf14-d9e697a63f7b/logo_gmail_2020q4_color-0-0-1x_U007emarketing-0-0-0-7-0-0-0-0-85-220.png/512x512bb.jpg' },
  { slug: 'google-maps', name: 'Maps', color: '#34A853', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ed/4d/b0/ed4db0a7-9f7d-ced1-8b97-08155865629b/maps_2025-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-0-85-220-0.png/512x512bb.jpg' },
  { slug: 'google-calendar', name: 'Calendar', color: '#4285F4', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/24/c5/c3/24c5c3b9-3f5f-095e-19f5-4f5760eadd0b/calendar_2020q4-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-0-85-220.png/512x512bb.jpg' },
  { slug: 'crypto', name: 'Crypto', color: '#0B1E43', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/be/93/03/be9303c9-6846-7349-1b65-9d4fcec61f6c/AppIcon-0-0-1x_U007emarketing-0-6-0-sRGB-85-220.png/512x512bb.jpg' },
  { slug: 'messenger', name: 'Messenger', color: '#006AFF', url: 'https://img.icons8.com/color/512/facebook-messenger.png' },
  { slug: 'spotify', name: 'Spotify', color: '#1DB954', url: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d2/22/32/d22232a2-e63b-1f9c-cf70-3029be26b00c/AppIcon-0-0-1x_U007epad-0-1-0-0-sRGB-85-220.png/512x512bb.jpg' },
];

export default function LogoPresets({ logo, onLogoChange, onLogoRemove }) {
  const [loading, setLoading] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onLogoChange({
          image: img,
          name: file.name,
          size: file.size,
          src: e.target.result,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [onLogoChange]);

  const handleSelect = (slug, name, url) => {
    setLoading(slug);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      onLogoChange({
        image: img,
        name: name,
        size: 0,
        src: url,
      });
      setLoading(null);
    };
    img.onerror = () => {
      console.error(`Failed to load logo: ${name}`);
      setLoading(null);
    };
    img.src = url;
  };

  return (
    <div className="logo-presets-container">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        hidden
      />
      <div className="logo-presets-grid">
        {/* Upload Tile */}
        <button
          className={`logo-preset-btn upload-tile ${logo && !LOGO_PRESETS.some(p => p.url === logo.src) ? 'active' : ''}`}
          onClick={() => logo && !LOGO_PRESETS.some(p => p.url === logo.src) ? onLogoRemove() : inputRef.current?.click()}
          title="Upload Custom Logo"
          style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-light)' }}
        >
          {logo && !LOGO_PRESETS.some(p => p.url === logo.src) ? (
            <div className="logo-preset-icon" style={{ position: 'relative' }}>
              <img src={logo.src} alt="Custom" style={{ opacity: 0.5 }} />
              <X size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--error)' }} />
            </div>
          ) : (
            <UploadCloud size={24} color="var(--accent-primary)" />
          )}
        </button>

        {LOGO_PRESETS.map((p) => (
          <button
            key={p.slug}
            className={`logo-preset-btn ${loading === p.slug ? 'loading' : ''} ${logo?.src === p.url ? 'active' : ''}`}
            onClick={() => handleSelect(p.slug, p.name, p.url)}
            title={p.name}
            style={{ '--brand-color': p.color }}
          >
            <div className="logo-preset-icon">
              <img src={p.url} alt={p.name} loading="lazy" crossOrigin="anonymous" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
