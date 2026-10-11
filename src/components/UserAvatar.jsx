import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * UserAvatar — Resilient avatar component for user profile pictures.
 * Handles Google/Firebase photoURL loading with `referrerPolicy="no-referrer"`
 * and gracefully falls back to a styled initial or User icon if the image fails.
 */
export default function UserAvatar({
  user,
  size = 36,
  border = '2px solid var(--accent-primary)',
  style = {},
  className = '',
  alt = 'Profile'
}) {
  const [imgError, setImgError] = useState(false);
  const photoURL = user?.photoURL?.trim();

  // Extract user initial
  const initial = (
    user?.displayName?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    'U'
  ).toUpperCase();

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    border: border || 'none',
    boxSizing: 'border-box',
    ...style
  };

  if (photoURL && !imgError) {
    return (
      <div style={containerStyle} className={`user-avatar ${className}`}>
        <img
          src={photoURL}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block'
          }}
        />
      </div>
    );
  }

  // Graceful fallback to initial/icon
  return (
    <div
      style={{
        ...containerStyle,
        background: 'var(--accent-gradient, linear-gradient(135deg, #EF1E34 0%, #FF5FD2 100%))',
        color: '#FFFFFF',
        fontWeight: 800,
        fontSize: `${Math.max(11, Math.round(size * 0.4))}px`,
        userSelect: 'none'
      }}
      className={`user-avatar user-avatar-fallback ${className}`}
    >
      {initial || <User size={Math.round(size * 0.5)} color="#FFFFFF" />}
    </div>
  );
}
