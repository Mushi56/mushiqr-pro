import React, { useState, useEffect, useRef } from 'react';
import { DOT_STYLES, EYE_STYLES, renderQR, generateQRMatrix, drawDotModule, drawEye } from '../utils/qrEngine';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import PaidCrownBadge from './PaidCrownBadge';
import { usePremium } from '../services/premiumContext';

// Cache for demo matrix to avoid redundant generations
const matrixCache = {};
function getCachedDemoMatrix(errorLevel) {
  if (!matrixCache[errorLevel]) {
    matrixCache[errorLevel] = generateQRMatrix("Hello User", errorLevel);
  }
  return matrixCache[errorLevel];
}

function MiniQRCanvas({ qrParams, overrideParams }) {
  const canvasRef = useRef(null);

  const errorLevel = qrParams?.errorLevel || 'H';
  const dotStyle = overrideParams?.dotStyle;
  const eyeStyle = overrideParams?.eyeStyle;
  const hideEyes = overrideParams?.hideEyes;
  const hideDots = overrideParams?.hideDots;
  const fgColor = qrParams?.fgColor;
  const fgType = qrParams?.fgType;
  const fgColor1 = qrParams?.fgColor1;
  const fgColor2 = qrParams?.fgColor2;
  const fgAngle = qrParams?.fgAngle;

  useEffect(() => {
    if (!canvasRef.current) return;

    const demoMatrixInfo = getCachedDemoMatrix(errorLevel);
    if (!demoMatrixInfo) return;

    const options = {
      ...qrParams,
      ...demoMatrixInfo,
      bgColor: '#FFFFFF',          // Force solid white background
      bgTransparent: false,        // Disable transparency
      logo: null,                  // Remove logo to avoid blocking center dots
      textCenterEnabled: false,    // Remove center text
      textCenter: null,
      frameStyle: 'none',          // Remove outer frames
      quietZone: 1,                // Add a very small quiet zone to maximize visual size
      size: 120,                   // Render size (reduced from 384 to 120 for extreme speedup)
      dotStyle,
      eyeStyle,
      hideEyes,
      hideDots
    };

    renderQR(canvasRef.current, options);
  }, [errorLevel, dotStyle, eyeStyle, hideEyes, hideDots, fgColor, fgType, fgColor1, fgColor2, fgAngle]);

  return (
    <canvas 
      ref={canvasRef} 
      width="120" 
      height="120" 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '10px',
        objectFit: 'cover',
        display: 'block'
      }} 
    />
  );
}

function MiniDotPreviewCanvas({ dotStyle, qrParams }) {
  const canvasRef = useRef(null);

  const fgColor = qrParams?.fgColor || '#000000';

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 120;
    ctx.clearRect(0, 0, size, size);

    // 1. Draw solid background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // 2. Grid Dimensions (6x6 mini matrix for extra LARGE dots)
    const gridCount = 6;
    const padding = 2;
    const availableSize = size - padding * 2;
    const cellSize = availableSize / gridCount;

    // 3. 6x6 Matrix with a small 3x3 Secret Eye made of dots (rows 2..4, cols 1..3)
    // Placed slightly down from center with maximum dot module size (18px wide per dot!)
    const matrix = [
      [1, 0, 1, 1, 0, 1], // Row 0
      [0, 1, 1, 0, 1, 0], // Row 1
      [1, 1, 1, 1, 0, 1], // Row 2: Secret Eye Top (c=1..3)
      [0, 1, 0, 1, 1, 0], // Row 3: Secret Eye Middle (c=1..3, center gap at c=2)
      [1, 1, 1, 1, 0, 1], // Row 4: Secret Eye Bottom (c=1..3)
      [0, 1, 0, 1, 1, 1]  // Row 5
    ];

    ctx.fillStyle = fgColor;

    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        if (!matrix[r][c]) continue;

        const x = padding + c * cellSize;
        const y = padding + r * cellSize;

        const neighbors = {
          top: r > 0 && !!matrix[r - 1][c],
          bottom: r < gridCount - 1 && !!matrix[r + 1][c],
          left: c > 0 && !!matrix[r][c - 1],
          right: c < gridCount - 1 && !!matrix[r][c + 1]
        };

        drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, qrParams || {}, r, c);
      }
    }
  }, [dotStyle, fgColor, qrParams?.dotPadding]);

  return (
    <canvas 
      ref={canvasRef} 
      width="120" 
      height="120" 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '10px',
        objectFit: 'cover',
        display: 'block'
      }} 
    />
  );
}

function MiniEyeCanvas({ eyeStyle, qrParams }) {
  const canvasRef = useRef(null);
  const fgColor = qrParams?.eyeColor || qrParams?.fgColor || '#000000';
  const outerColor = qrParams?.eyeOuterColor || fgColor;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 120;
    ctx.clearRect(0, 0, size, size);

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw single eye centered in canvas using exact QR engine drawEye
    const padding = 2;
    const eyeSize = size - padding * 2;
    drawEye(ctx, padding, padding, eyeSize, eyeStyle, outerColor, fgColor);
  }, [eyeStyle, fgColor, outerColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width="120" 
      height="120" 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '10px',
        objectFit: 'cover',
        display: 'block'
      }} 
    />
  );
}

export const DOT_PREVIEWS = {
  [DOT_STYLES.DENSO]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="0" y="0" width="28" height="28" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DOTS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.SPARKLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2 Q14 14 26 14 Q14 14 14 26 Q14 14 2 14 Q14 14 14 2 Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.FLUID]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M4 14 a10 10 0 0 1 10 -10 v20 a10 10 0 0 1 -10 -10 M14 4 h4 a10 10 0 0 1 0 20 h-4 Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.CAPSULE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="5" y="2" width="18" height="24" rx="9" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.HEXAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 24.4,8 24.4,20 14,26 3.6,20 3.6,8" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.SQUARE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.ROUNDED]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="2" y="2" width="24" height="24" rx="6" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.LEAF]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2 H26 V14 Q26 26 14 26 H2 V14 Q2 2 14 2 Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DIAMOND]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 26,14 14,26 2,14" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.PIXEL]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M2 2 h24 v24 h-24 Z M10 10 h8 v8 h-8 Z" fillRule="evenodd" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.SHIELD]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M4 2 h20 v12 q0 12 -10 14 q-10 -2 -10 -14 Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.STAR]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 18,10 26,10 20,16 22,25 14,20 6,25 8,16 2,10 10,10" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.HEART]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 26s-12-7.5-12-14.5a6.5 6.5 0 0 1 12-3.5 6.5 6.5 0 0 1 12 3.5c0 7-12 14.5-12 14.5z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.TRIANGLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="14,2 26,26 2,26" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.OCTAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="9,2 19,2 26,9 26,19 19,26 9,26 2,19 2,9" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.PLUS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="11" y="2" width="6" height="24" fill="currentColor" />
      <rect x="2" y="11" width="24" height="6" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.CROSS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="11" y="2" width="6" height="24" fill="currentColor" transform="rotate(45 14 14)" />
      <rect x="2" y="11" width="24" height="6" fill="currentColor" transform="rotate(45 14 14)" />
    </svg>
  ),
  [DOT_STYLES.CHERRY_BLOSSOM]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="5.5" r="4.2" fill="currentColor" />
      <circle cx="6" cy="11" r="4.2" fill="currentColor" />
      <circle cx="22" cy="11" r="4.2" fill="currentColor" />
      <circle cx="8.5" cy="20" r="4.2" fill="currentColor" />
      <circle cx="19.5" cy="20" r="4.2" fill="currentColor" />
      <circle cx="14" cy="14" r="2.2" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.VIOLET_FLOWER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="5" r="5" fill="currentColor" />
      <circle cx="5.5" cy="11.5" r="5" fill="currentColor" />
      <circle cx="22.5" cy="11.5" r="5" fill="currentColor" />
      <circle cx="8" cy="21" r="5" fill="currentColor" />
      <circle cx="20" cy="21" r="5" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.SUNFLOWER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2L16 8 14 6 12 8Z M22 5L19 10 19 8 16 9Z M26 14L20 12 22 14 20 16Z M22 23L19 18 16 19 19 20Z M14 26L12 20 14 22 16 20Z M6 23L9 18 12 19 9 20Z M2 14L8 16 6 14 8 12Z M6 5L9 10 12 9 9 8Z" fill="currentColor" />
      <circle cx="14" cy="14" r="4" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.ROSE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="7" r="5.5" fill="currentColor" />
      <circle cx="7" cy="15" r="5.5" fill="currentColor" />
      <circle cx="21" cy="15" r="5.5" fill="currentColor" />
      <circle cx="10" cy="22" r="5" fill="currentColor" />
      <circle cx="18" cy="22" r="5" fill="currentColor" />
      <circle cx="14" cy="14" r="3.5" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DAISY]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 2Q16 8 14 10Q12 8 14 2Z" fill="currentColor" />
      <path d="M22 6Q18 10 16 10Q17 8 22 6Z" fill="currentColor" />
      <path d="M26 14Q20 16 18 14Q20 12 26 14Z" fill="currentColor" />
      <path d="M22 22Q18 18 18 16Q20 17 22 22Z" fill="currentColor" />
      <path d="M14 26Q12 20 14 18Q16 20 14 26Z" fill="currentColor" />
      <path d="M6 22Q10 18 12 18Q10 20 6 22Z" fill="currentColor" />
      <path d="M2 14Q8 12 10 14Q8 16 2 14Z" fill="currentColor" />
      <path d="M6 6Q10 10 10 12Q8 10 6 6Z" fill="currentColor" />
      <circle cx="14" cy="14" r="3" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.TULIP]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 14 Q6 8 9 2 Q14 6 14 14Z" fill="currentColor" />
      <path d="M14 14 Q22 8 19 2 Q14 6 14 14Z" fill="currentColor" />
      <path d="M12 2 Q14 -1 16 2 Q14 6 12 2Z" fill="currentColor" />
      <rect x="13" y="14" width="2" height="12" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.LOTUS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 20 Q6 14 8 6 Q14 12 14 20Z" fill="currentColor" />
      <path d="M14 20 Q22 14 20 6 Q14 12 14 20Z" fill="currentColor" />
      <path d="M14 18 Q2 16 4 10 Q14 14 14 18Z" fill="currentColor" />
      <path d="M14 18 Q26 16 24 10 Q14 14 14 18Z" fill="currentColor" />
      <path d="M11 4 Q14 0 17 4 Q14 10 11 4Z" fill="currentColor" />
      <ellipse cx="14" cy="22" rx="6" ry="2" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.FORGET_ME_NOT]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="5.5" r="4.5" fill="currentColor" />
      <circle cx="5.8" cy="11.5" r="4.5" fill="currentColor" />
      <circle cx="22.2" cy="11.5" r="4.5" fill="currentColor" />
      <circle cx="8.5" cy="20.5" r="4.5" fill="currentColor" />
      <circle cx="19.5" cy="20.5" r="4.5" fill="currentColor" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.PANSY]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="9" cy="7" r="5.5" fill="currentColor" />
      <circle cx="19" cy="7" r="5.5" fill="currentColor" />
      <circle cx="6" cy="18" r="5" fill="currentColor" />
      <circle cx="14" cy="21" r="5" fill="currentColor" />
      <circle cx="22" cy="18" r="5" fill="currentColor" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.DOLLAR_COIN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
      <text x="14" y="15" fontSize="12" fontWeight="bold" textAnchor="middle" fill="currentColor" dominantBaseline="middle">$</text>
    </svg>
  ),
  [DOT_STYLES.CUTE_EMOTICON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="11" fill="currentColor" />
      <circle cx="10" cy="11" r="1.5" fill="#000" />
      <circle cx="18" cy="11" r="1.5" fill="#000" />
      <path d="M10 17 Q14 20 18 17" stroke="#000" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  [DOT_STYLES.LAVENDER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <line x1="14" y1="24" x2="14" y2="8" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="10" cy="10" rx="3" ry="2" fill="currentColor" transform="rotate(-30 10 10)" />
      <ellipse cx="18" cy="10" rx="3" ry="2" fill="currentColor" transform="rotate(30 18 10)" />
      <ellipse cx="10" cy="16" rx="3" ry="2" fill="currentColor" transform="rotate(-30 10 16)" />
      <ellipse cx="18" cy="16" rx="3" ry="2" fill="currentColor" transform="rotate(30 18 16)" />
      <circle cx="14" cy="6" r="2.5" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.MONSTERA]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 24 C6 20 6 10 14 4 C22 10 22 20 14 24 Z" fill="currentColor" />
      <line x1="14" y1="6" x2="14" y2="22" stroke="#fff" strokeWidth="1.5" />
      <line x1="14" y1="10" x2="8" y2="12" stroke="#fff" strokeWidth="1" />
      <line x1="14" y1="10" x2="20" y2="12" stroke="#fff" strokeWidth="1" />
      <line x1="14" y1="15" x2="8" y2="18" stroke="#fff" strokeWidth="1" />
      <line x1="14" y1="15" x2="20" y2="18" stroke="#fff" strokeWidth="1" />
    </svg>
  ),
  [DOT_STYLES.COFFEE_BEAN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <ellipse cx="14" cy="14" rx="8" ry="12" fill="currentColor" />
      <line x1="14" y1="4" x2="14" y2="24" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
    </svg>
  ),
  [DOT_STYLES.RAINDROP]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 3 Q7 10 7 17 A7 7 0 0 0 21 17 Q21 10 14 3Z" fill="currentColor" />
    </svg>
  ),
  [DOT_STYLES.CACTUS_PLANT]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="12" y="4" width="4" height="20" rx="2" fill="currentColor" />
      <rect x="5" y="11" width="7" height="3" rx="1.5" fill="currentColor" />
      <rect x="5" y="8" width="3" height="6" rx="1.5" fill="currentColor" />
      <rect x="16" y="13" width="7" height="3" rx="1.5" fill="currentColor" />
      <rect x="20" y="10" width="3" height="6" rx="1.5" fill="currentColor" />
    </svg>
  ),

  [DOT_STYLES.BASKETBALL_DOT]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="currentColor" />
      <path d="M2 14 Q8 8 14 14 Q20 20 26 14" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <path d="M2 14 Q8 20 14 14 Q20 8 26 14" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <line x1="14" y1="2" x2="14" y2="26" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
    </svg>
  ),
  [DOT_STYLES.CHESS_PAWN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="7" r="5" fill="currentColor" />
      <rect x="11" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="8" y="18" width="12" height="5" rx="2" fill="currentColor" />
    </svg>
  ),

  [DOT_STYLES.BOW_RIBBON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M14 14 C12 10 4 8 4 14 C4 20 12 18 14 14Z" fill="currentColor" />
      <path d="M14 14 C16 10 24 8 24 14 C24 20 16 18 14 14Z" fill="currentColor" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    </svg>
  ),
};

export const EYE_PREVIEWS = {
  [EYE_STYLES.SQUARE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="9" y="9" width="10" height="10" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.ROUNDED]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="9" y="9" width="10" height="10" rx="3" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.CIRCLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.LEAF]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M3 3 L20 3 Q25 3 25 8 L25 25 L8 25 Q3 25 3 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="9" y="9" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.MODERN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="7" y="7" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.FLOWER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="28,14 25.8,19 24,23 19,25.8 14,28 9,25.8 4,23 2.2,19 0,14 2.2,9 4,5 9,2.2 14,0 19,2.2 24,5 25.8,9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.SHIELD]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <path d="M2 3 h24 v10 q0 10 -12 13 q-12 -3 -12 -13 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.DIAMOND]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <polygon points="14,8 20,14 14,20 8,14" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.GEOMETRIC]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="12" y="8" width="4" height="12" fill="currentColor" />
      <rect x="8" y="12" width="12" height="4" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.OCTAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <polygon points="9,1 19,1 27,9 27,19 19,27 9,27 1,19 1,9" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.HEXAGON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <polygon points="14,8 20,11 20,17 14,20 8,17 8,11" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.LCD]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.STAR]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="0" y="0" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.HEART]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="14" cy="14" r="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.TRIANGLE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="12" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.DOLLAR_COIN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="8" fill="currentColor" />
      <text x="14" y="15" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#fff" dominantBaseline="middle">$</text>
    </svg>
  ),
  [EYE_STYLES.CUTE_EMOTICON]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="14" cy="14" r="8" fill="currentColor" />
      <circle cx="11" cy="12" r="1" fill="#fff" />
      <circle cx="17" cy="12" r="1" fill="#fff" />
      <path d="M12 16 Q14 18 16 16" stroke="#fff" strokeWidth="1" fill="none" />
    </svg>
  ),
  [EYE_STYLES.CHERRY_BLOSSOM]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="14" cy="9.5" r="2.2" fill="currentColor" />
      <circle cx="9.5" cy="12.5" r="2.2" fill="currentColor" />
      <circle cx="18.5" cy="12.5" r="2.2" fill="currentColor" />
      <circle cx="11.5" cy="17.5" r="2.2" fill="currentColor" />
      <circle cx="16.5" cy="17.5" r="2.2" fill="currentColor" />
      <circle cx="14" cy="14" r="1.2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.LOTUS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M14 18 Q9 14 10 9 Q14 13 14 18Z" fill="currentColor" />
      <path d="M14 18 Q19 14 18 9 Q14 13 14 18Z" fill="currentColor" />
      <ellipse cx="14" cy="19.5" rx="3.5" ry="1.2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.SUNFLOWER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill="currentColor" />
      <path d="M14 7L15 10 14 9 13 10Z M19 9L17 11 17 10 16 11Z M21 14L18 13 19 14 18 15Z M19 19L17 16 16 17 17 17Z M14 21L13 18 14 19 15 18Z M9 19L11 16 12 17 11 17Z M7 14L10 15 9 14 10 13Z M9 9L11 11 12 10 11 11Z" fill="#fff" />
      <circle cx="14" cy="14" r="2.2" fill="#fff" />
    </svg>
  ),
  [EYE_STYLES.LAVENDER]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <line x1="14" y1="20" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.5" cy="11.5" r="1.8" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.8" fill="currentColor" />
      <circle cx="11.5" cy="15.5" r="1.8" fill="currentColor" />
      <circle cx="16.5" cy="15.5" r="1.8" fill="currentColor" />
      <circle cx="14" cy="8.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.ROSE]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="14" cy="10" r="3.2" fill="currentColor" />
      <circle cx="10" cy="15" r="3.2" fill="currentColor" />
      <circle cx="18" cy="15" r="3.2" fill="currentColor" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.MONSTERA]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M14 20 C9 18 9 12 14 8 C19 12 19 18 14 20 Z" fill="currentColor" />
      <line x1="14" y1="9" x2="14" y2="19" stroke="#fff" strokeWidth="0.8" />
    </svg>
  ),
  [EYE_STYLES.DAISY]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M14 7Q15 10 14 11Q13 10 14 7Z" fill="currentColor" />
      <path d="M19 9Q17 11 16 11Q17 10 19 9Z" fill="currentColor" />
      <path d="M21 14Q18 15 17 14Q18 13 21 14Z" fill="currentColor" />
      <path d="M19 19Q17 17 17 16Q18 17 19 19Z" fill="currentColor" />
      <path d="M14 21Q13 18 14 17Q15 18 14 21Z" fill="currentColor" />
      <path d="M9 19Q11 17 12 17Q11 18 9 19Z" fill="currentColor" />
      <path d="M7 14Q10 13 11 14Q10 15 7 14Z" fill="currentColor" />
      <path d="M9 9Q11 11 11 12Q10 11 9 9Z" fill="currentColor" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
    </svg>
  ),
  [EYE_STYLES.COFFEE_BEAN]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill="currentColor" />
      <ellipse cx="14" cy="14" rx="3.8" ry="5.5" fill="#fff" />
      <line x1="14" y1="9" x2="14" y2="19" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
    </svg>
  ),
  [EYE_STYLES.RAINDROP]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill="currentColor" />
      <path d="M14 9.2 Q10.5 12.5 11 15.5 A3.5 3.5 0 0 0 17 15.5 Q17.5 12.5 14 9.2Z" fill="#fff" />
    </svg>
  ),
  [EYE_STYLES.CACTUS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="12.5" y="8" width="3" height="12" rx="1.5" fill="currentColor" />
      <rect x="8" y="13" width="5" height="2" rx="1" fill="currentColor" />
      <rect x="8" y="11" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="15" y="14" width="5" height="2" rx="1" fill="currentColor" />
      <rect x="18" y="12" width="2" height="4" rx="1" fill="currentColor" />
    </svg>
  ),

  [EYE_STYLES.BASKETBALL]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="14" cy="14" r="5.5" fill="currentColor" />
      <path d="M8.5 14 Q11 11 14 14 Q17 17 19.5 14" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      <line x1="14" y1="8.5" x2="14" y2="19.5" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
    </svg>
  ),
  [EYE_STYLES.CHESS]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill="currentColor" />
      <circle cx="14" cy="11.5" r="2.2" fill="#fff" />
      <rect x="12.5" y="13.7" width="3" height="2.3" rx="0.4" fill="#fff" />
      <rect x="10.5" y="16.5" width="7" height="2.5" rx="0.8" fill="#fff" />
    </svg>
  ),

  [EYE_STYLES.BOW]: (
    <svg viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="8" y="8" width="12" height="12" rx="3.5" fill="currentColor" />
      <path d="M14 14 C12 11 8.5 10.5 8.5 14 C8.5 17.5 12 17 14 14Z" fill="#fff" />
      <path d="M14 14 C16 11 19.5 10.5 19.5 14 C19.5 17.5 16 17 14 14Z" fill="#fff" />
      <circle cx="14" cy="14" r="1.5" fill="#fff" />
    </svg>
  ),
};

export function DotStyleSelector({ value, onChange, qrParams }) {
  const { showPaywall } = usePremium();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => setTick(t => t + 1));
    return () => unsub?.();
  }, []);

  const handleDotChange = (style) => {
    const featId = `qr_dot_${style}`;
    const access = FeatureAccessManager.canUseFeature(featId);
    if (!access.allowed) {
      showPaywall(featId);
      return;
    }
    onChange(style);
  };

  const visibleDotEntries = Object.entries(DOT_PREVIEWS).filter(([style]) => {
    return FeatureAccessManager.isFeatureEnabled(`qr_dot_${style}`);
  });

  return (
    <div className="style-grid">
      {visibleDotEntries.map(([style, preview]) => (
        <button
          key={style}
          className={`style-option ${value === style ? 'active' : ''}`}
          onClick={() => handleDotChange(style)}
          title={style}
          style={{ position: 'relative' }}
        >
          <PaidCrownBadge featureId={`qr_dot_${style}`} fallbackFeatureId="custom_dot_styles" position="corner" size={9} />
          <div className="style-option-preview">
            <MiniDotPreviewCanvas dotStyle={style} qrParams={qrParams} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function EyeStyleSelector({ value, onChange, qrParams }) {
  const { showPaywall } = usePremium();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => setTick(t => t + 1));
    return () => unsub?.();
  }, []);

  const handleEyeChange = (style) => {
    const featId = `qr_eye_${style}`;
    const access = FeatureAccessManager.canUseFeature(featId);
    if (!access.allowed) {
      showPaywall(featId);
      return;
    }
    onChange(style);
  };

  const visibleEyeStyles = Object.keys(EYE_STYLES).filter((styleKey) => {
    const style = EYE_STYLES[styleKey];
    return FeatureAccessManager.isFeatureEnabled(`qr_eye_${style}`);
  });

  return (
    <div className="style-grid eye-style-grid">
      {visibleEyeStyles.map((styleKey) => {
        const style = EYE_STYLES[styleKey];
        return (
          <button
            key={style}
            className={`style-option ${value === style ? 'active' : ''}`}
            onClick={() => handleEyeChange(style)}
            title={style}
            style={{ position: 'relative' }}
          >
            <PaidCrownBadge featureId={`qr_eye_${style}`} fallbackFeatureId="custom_eye_styles" position="corner" size={9} />
            <div className="style-option-preview">
              <MiniEyeCanvas eyeStyle={style} qrParams={qrParams} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
