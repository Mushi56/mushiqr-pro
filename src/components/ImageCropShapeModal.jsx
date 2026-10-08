// src/components/ImageCropShapeModal.jsx
// Minimalist Icon-Driven 1:1 Photo Crop & Multi-Shape Masking Modal
// Features: Flip H/V, Rotate L/R, Zoom, Pan, 10 Shape Masks, Live Illuminated SVG Cutout, and Icon Actions

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Check, RotateCcw, RotateCw, ZoomIn, ZoomOut,
  Square, Circle, Triangle, Hexagon, Octagon, Heart, Star, Diamond, Shield
} from 'lucide-react';

const FlipHIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 5 3 12 8 19" />
    <polyline points="16 5 21 12 16 19" />
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" />
  </svg>
);

const FlipVIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 8 12 3 19 8" />
    <polyline points="5 16 12 21 19 16" />
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 3" />
  </svg>
);

export const SHAPE_OPTIONS = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'rounded', label: 'Rounded', icon: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="6" />
    </svg>
  )},
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { id: 'octagon', label: 'Octagon', icon: Octagon },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'diamond', label: 'Diamond', icon: Diamond },
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'shield', label: 'Shield', icon: Shield }
];

export const getSvgPathData = (shape, size = 260) => {
  const half = size / 2;
  const p = 4; // padding

  switch (shape) {
    case 'circle': {
      const r = half - p;
      return `M ${half},${p} A ${r} ${r} 0 1 0 ${half},${size - p} A ${r} ${r} 0 1 0 ${half},${p} Z`;
    }

    case 'rounded': {
      const radius = size * 0.22;
      const s = size - p * 2;
      return `M ${p + radius},${p} h ${s - 2 * radius} a ${radius},${radius} 0 0 1 ${radius},${radius} v ${s - 2 * radius} a ${radius},${radius} 0 0 1 -${radius},${radius} h -${s - 2 * radius} a ${radius},${radius} 0 0 1 -${radius},-${radius} v -${s - 2 * radius} a ${radius},${radius} 0 0 1 ${radius},-${radius} Z`;
    }

    case 'hexagon': {
      const r = half - p;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = (half + r * Math.cos(angle)).toFixed(1);
        const y = (half + r * Math.sin(angle)).toFixed(1);
        pts.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`);
      }
      return `${pts.join(' ')} Z`;
    }

    case 'octagon': {
      const r = half - p;
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 8;
        const x = (half + r * Math.cos(angle)).toFixed(1);
        const y = (half + r * Math.sin(angle)).toFixed(1);
        pts.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`);
      }
      return `${pts.join(' ')} Z`;
    }

    case 'triangle': {
      return `M ${half},${p + 4} L ${size - p - 4},${size - p} L ${p + 4},${size - p} Z`;
    }

    case 'diamond': {
      return `M ${half},${p} L ${size - p},${half} L ${half},${size - p} L ${p},${half} Z`;
    }

    case 'heart': {
      const s = size;
      return `M ${half},${s * 0.25} C ${half},${s * 0.05} ${p},${s * 0.05} ${p},${s * 0.3} C ${p},${s * 0.55} ${half * 0.6},${s * 0.75} ${half},${s * 0.95} C ${s - half * 0.6},${s * 0.75} ${s - p},${s * 0.55} ${s - p},${s * 0.3} C ${s - p},${s * 0.05} ${half},${s * 0.05} ${half},${s * 0.25} Z`;
    }

    case 'star': {
      const outerR = half - p;
      const innerR = outerR * 0.42;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const x = (half + r * Math.cos(angle)).toFixed(1);
        const y = (half + r * Math.sin(angle)).toFixed(1);
        pts.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`);
      }
      return `${pts.join(' ')} Z`;
    }

    case 'shield': {
      const s = size - p * 2;
      return `M ${p},${p} L ${p + s},${p} L ${p + s},${p + s * 0.55} C ${p + s},${p + s * 0.82} ${half},${p + s * 0.95} ${half},${p + s} C ${half},${p + s * 0.95} ${p},${p + s * 0.82} ${p},${p + s * 0.55} Z`;
    }

    case 'square':
    default:
      return `M ${p},${p} L ${size - p},${p} L ${size - p},${size - p} L ${p},${size - p} Z`;
  }
};

export function ImageCropShapeModal({
  isOpen,
  imageSrc,
  imageName = 'photo.png',
  initialShape = 'rounded',
  allowShapeSelect = true,
  onConfirm,
  onCancel
}) {
  const [selectedShape, setSelectedShape] = useState(initialShape || 'rounded');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [loadedImage, setLoadedImage] = useState(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const initialZoomRef = useRef(1);

  // Sync initial shape when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedShape(initialShape || 'rounded');
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
  }, [isOpen, initialShape]);

  // Load the target image
  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
        setImgNaturalSize({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      };
      img.onerror = () => {
        console.error('Failed to load image for cropping:', imageSrc);
      };
      img.src = imageSrc;
    } else {
      setLoadedImage(null);
    }
  }, [isOpen, imageSrc]);

  // ── Touch and Mouse Drag / Zoom Handlers ──
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialZoomRef.current = zoom;
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / touchDistRef.current;
      setZoom(Math.min(Math.max(initialZoomRef.current * scale, 0.3), 4.0));
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.3), 4.0));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // ── Helper to draw shape clipping paths on export canvas ──
  const drawShapePath = (ctx, shape, size) => {
    const half = size / 2;
    ctx.beginPath();

    switch (shape) {
      case 'circle':
        ctx.arc(half, half, half - 2, 0, Math.PI * 2);
        break;

      case 'rounded': {
        const r = size * 0.22;
        const p = 2;
        const s = size - p * 2;
        ctx.roundRect ? ctx.roundRect(p, p, s, s, r) : ctx.rect(p, p, s, s);
        break;
      }

      case 'hexagon': {
        const r = half - 3;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = half + r * Math.cos(angle);
          const y = half + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }

      case 'octagon': {
        const r = half - 3;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          const x = half + r * Math.cos(angle);
          const y = half + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }

      case 'triangle': {
        const p = 4;
        ctx.moveTo(half, p);
        ctx.lineTo(size - p, size - p);
        ctx.lineTo(p, size - p);
        ctx.closePath();
        break;
      }

      case 'diamond': {
        const p = 4;
        ctx.moveTo(half, p);
        ctx.lineTo(size - p, half);
        ctx.lineTo(half, size - p);
        ctx.lineTo(p, half);
        ctx.closePath();
        break;
      }

      case 'heart': {
        const topCurveHeight = size * 0.3;
        ctx.moveTo(half, size * 0.25);
        ctx.bezierCurveTo(half, size * 0.05, 0, size * 0.05, 0, topCurveHeight);
        ctx.bezierCurveTo(0, size * 0.55, half * 0.6, size * 0.75, half, size * 0.95);
        ctx.bezierCurveTo(size - half * 0.6, size * 0.75, size, size * 0.55, size, topCurveHeight);
        ctx.bezierCurveTo(size, size * 0.05, half, size * 0.05, half, size * 0.25);
        ctx.closePath();
        break;
      }

      case 'star': {
        const outerR = half - 4;
        const innerR = outerR * 0.42;
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI / points) * i - Math.PI / 2;
          const x = half + r * Math.cos(angle);
          const y = half + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }

      case 'shield': {
        const p = 4;
        ctx.moveTo(p, p);
        ctx.lineTo(size - p, p);
        ctx.lineTo(size - p, size * 0.55);
        ctx.bezierCurveTo(size - p, size * 0.82, half, size * 0.95, half, size - p);
        ctx.bezierCurveTo(half, size * 0.95, p, size * 0.82, p, size * 0.55);
        ctx.closePath();
        break;
      }

      case 'square':
      default:
        ctx.rect(0, 0, size, size);
        break;
    }
  };

  // ── Generate Final High-Res Cropped Canvas & Export ──
  const handleConfirm = () => {
    if (!loadedImage) return;

    const exportSize = 512; // High-res 1:1 master size
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const previewBoxSize = 260; // preview viewport size in px
    const scaleFactor = exportSize / previewBoxSize;

    const imgAspect = imgNaturalSize.width / imgNaturalSize.height;
    let drawW, drawH;
    if (imgAspect >= 1) {
      drawH = previewBoxSize * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = previewBoxSize * zoom;
      drawH = drawW / imgAspect;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportSize;
    tempCanvas.height = exportSize;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Apply Pan, Zoom, Rotation, and Flips around center
    tempCtx.save();
    tempCtx.translate(exportSize / 2, exportSize / 2);
    tempCtx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const finalDrawW = drawW * scaleFactor;
    const finalDrawH = drawH * scaleFactor;
    tempCtx.drawImage(loadedImage, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH);
    tempCtx.restore();

    if (selectedShape !== 'square') {
      ctx.save();
      drawShapePath(ctx, selectedShape, exportSize);
      ctx.clip();
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(tempCanvas, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const outputImg = new Image();
    outputImg.onload = () => {
      onConfirm({
        image: outputImg,
        src: dataUrl,
        name: imageName,
        shape: selectedShape,
        cropData: { zoom, pan, rotation, flipH, flipV, shape: selectedShape }
      });
    };
    outputImg.src = dataUrl;
  };

  if (!isOpen) return null;

  const currentShapePath = getSvgPathData(selectedShape, 260);

  const modalContent = (
    <div 
      className="crop-modal-overlay" 
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        backgroundColor: 'rgba(5, 7, 13, 0.90)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div 
        className="crop-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--bg-elevated, #111625)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #FFFFFF)',
          animation: 'modalSlideUp 0.22s cubic-bezier(0.2, 0, 0, 1)',
          position: 'relative',
          zIndex: 10000000
        }}
      >
        {/* Viewport Area (260x260 1:1 Canvas) */}
        <div style={{
          padding: '24px 20px 14px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0B0F19)',
          position: 'relative'
        }}>
          <div 
            ref={containerRef}
            onContextMenu={e => e.preventDefault()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{
              width: '260px',
              height: '260px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
              cursor: 'grab',
              touchAction: 'none',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 16px 16px, #000000'
            }}
          >
            {/* Underlying Scaled, Rotated, & Flipped Image */}
            {loadedImage ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                  pointerEvents: 'none'
                }}
              >
                <img 
                  src={loadedImage.src}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    width: imgNaturalSize.width >= imgNaturalSize.height ? `${260 * (imgNaturalSize.width / imgNaturalSize.height) * zoom}px` : `${260 * zoom}px`,
                    height: imgNaturalSize.width >= imgNaturalSize.height ? `${260 * zoom}px` : `${260 * (imgNaturalSize.height / imgNaturalSize.width) * zoom}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                ...
              </div>
            )}

            {/* LIVE ILLUMINATED CUTOUT SHAPE MASK OVERLAY */}
            <svg 
              width="260" 
              height="260" 
              viewBox="0 0 260 260" 
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                width: '100%',
                height: '100%'
              }}
            >
              <defs>
                <mask id="shape-cutout-mask">
                  <rect x="0" y="0" width="260" height="260" fill="#FFFFFF" />
                  <path d={currentShapePath} fill="#000000" />
                </mask>
              </defs>

              {/* Dark Shroud covering exterior of shape */}
              <rect 
                x="0" 
                y="0" 
                width="260" 
                height="260" 
                fill="rgba(5, 8, 16, 0.75)" 
                mask="url(#shape-cutout-mask)" 
              />

              {/* Glowing Shape Outline & Dashed Guide */}
              <path 
                d={currentShapePath} 
                fill="none" 
                stroke="var(--accent-primary, #D60036)" 
                strokeWidth="2.5" 
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: 'none' }}
              />
              <path 
                d={currentShapePath} 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.85)" 
                strokeWidth="1.2" 
                strokeDasharray="6,4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Zoom Slider Bar */}
          <div style={{
            marginTop: '14px',
            width: '100%',
            maxWidth: '260px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button 
              onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <ZoomOut size={16} />
            </button>
            <input 
              type="range"
              min="0.3"
              max="4.0"
              step="0.02"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-primary, #D60036)', cursor: 'pointer' }}
            />
            <button 
              onClick={() => setZoom(z => Math.min(4.0, z + 0.15))}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Minimalist Shape Icons Carousel (No Text Labels) */}
        {allowShapeSelect && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {SHAPE_OPTIONS.map(s => {
              const isSelected = selectedShape === s.id;
              const IconComponent = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedShape(s.id)}
                  title={s.label}
                  style={{
                    flex: '0 0 auto',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--accent-primary, #D60036)' : 'var(--bg-primary, #0B0F19)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-primary, #D60036)' : 'var(--border-color, rgba(255, 255, 255, 0.1))',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComponent size={20} />
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Action Row: Cancel Icon, Transform Tools (Flip H/V, Rotate L/R, Reset), Apply Icon */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elevated, #111625)'
        }}>
          {/* Cancel Icon Button */}
          <button
            onClick={onCancel}
            title="Cancel"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={22} strokeWidth={2.4} />
          </button>

          {/* Transformation Tools (Rotate CCW, Rotate CW, Flip H, Flip V, Reset) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Rotate Left (CCW) */}
            <button
              onClick={() => setRotation(r => (r - 90 + 360) % 360)}
              title="Rotate Left 90°"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-primary, #0B0F19)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-primary, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCcw size={18} />
            </button>

            {/* Rotate Right (CW) */}
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              title="Rotate Right 90°"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-primary, #0B0F19)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-primary, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCw size={18} />
            </button>

            {/* Flip Horizontal */}
            <button
              onClick={() => setFlipH(f => !f)}
              title="Flip Horizontal"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: flipH ? 'var(--accent-primary, #D60036)' : 'var(--bg-primary, #0B0F19)',
                border: '1px solid',
                borderColor: flipH ? 'var(--accent-primary, #D60036)' : 'var(--border-color, rgba(255, 255, 255, 0.1))',
                color: flipH ? '#FFFFFF' : 'var(--text-primary, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FlipHIcon size={18} />
            </button>

            {/* Flip Vertical */}
            <button
              onClick={() => setFlipV(f => !f)}
              title="Flip Vertical"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: flipV ? 'var(--accent-primary, #D60036)' : 'var(--bg-primary, #0B0F19)',
                border: '1px solid',
                borderColor: flipV ? 'var(--accent-primary, #D60036)' : 'var(--border-color, rgba(255, 255, 255, 0.1))',
                color: flipV ? '#FFFFFF' : 'var(--text-primary, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FlipVIcon size={18} />
            </button>
          </div>

          {/* Apply Icon Button */}
          <button
            onClick={handleConfirm}
            title="Apply"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--accent-primary, #D60036)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(214, 0, 54, 0.4)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(214, 0, 54, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(214, 0, 54, 0.4)';
            }}
          >
            <Check size={22} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? ReactDOM.createPortal(modalContent, document.body) 
    : modalContent;
}
export default ImageCropShapeModal;


