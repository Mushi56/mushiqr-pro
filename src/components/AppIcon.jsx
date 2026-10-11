/**
 * AppIcon — The unified MushiQR Pro app icon component.
 * Renders the logo with iPhone-style squircle (super-ellipse) corners everywhere.
 * Usage: <AppIcon size={42} /> or <AppIcon size={96} shadow />
 */
export default function AppIcon({ size = 42, shadow = false, noBackground = false, className = '', style = {} }) {
  const borderRadius = noBackground ? 0 : size * 0.22; // iPhone squircle ratio (~22%)
  const imgSrc = noBackground ? '/logo-transparent.webp' : '/logo.webp';
  
  return (
    <div
      className={`app-icon-squircle ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: (shadow && !noBackground) ? `0 ${size * 0.08}px ${size * 0.2}px rgba(239, 30, 52,0.3)` : 'none',
        ...style
      }}
    >
      <img
        src={imgSrc}
        alt="Mushi QR Pro Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
