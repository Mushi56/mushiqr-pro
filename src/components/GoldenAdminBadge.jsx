import React from 'react';

export default function GoldenAdminBadge({ size = 16, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: 'none',
        ...style
      }}
    >
      {/* Golden Hexagon Starburst Verified Shield */}
      <path
        d="M12 1.5L14.8 3.3L18.1 3.5L19.6 6.4L22.3 8.3L21.7 11.6L23.1 14.5L20.9 17L20.8 20.3L17.5 20.8L15.3 23.2L12 22.2L8.7 23.2L6.5 20.8L3.2 20.3L3.1 17L0.9 14.5L2.3 11.6L1.7 8.3L4.4 6.4L5.9 3.5L9.2 3.3L12 1.5Z"
        fill="url(#goldAdminGradient)"
        stroke="#E69900"
        strokeWidth="0.5"
      />
      {/* Inner Checkmark: Crisp White, no black strokes */}
      <path
        d="M8.8 12.2L11 14.4L15.4 9.4"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="goldAdminGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF38A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}


