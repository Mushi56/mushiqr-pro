// src/components/FullScreenPreviewModal.jsx
// Immersive Fullscreen Preview with Two-Finger Pinch Zoom, Pan, App-Consistent Controls, and Theme Integration

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Lock } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

export function FullScreenPreviewModal({
  isOpen,
  onClose,
  sourceCanvasRef,
  template,
  headlineText,
  handleText
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const initialTouchDistRef = useRef(null);
  const initialZoomRef = useRef(1);
  const lastTapRef = useRef(0);
  const hideControlsTimerRef = useRef(null);

  // Capture ultra-high-definition preview image from the source canvas
  useEffect(() => {
    if (isOpen && sourceCanvasRef?.current) {
      try {
        const dataUrl = sourceCanvasRef.current.toDataURL('image/png', 1.0);
        setSnapshotUrl(dataUrl);
      } catch (e) {
        console.warn('Failed to snapshot canvas:', e);
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setSnapshotUrl(null);
    }
  }, [isOpen, sourceCanvasRef, template, headlineText, handleText]);

  // ── Browser History Back Navigation ──
  useEffect(() => {
    if (!isOpen) return;

    try {
      window.history.pushState({ modal: 'fullscreen-preview' }, '');
    } catch (e) {}

    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // ── Multi-Layer Screenshot & Capture Security ──
  useEffect(() => {
    if (!isOpen) return;

    // 1. Android Native FLAG_SECURE (Blocks screenshots & screen recording at OS level)
    try {
      if (window.NativeAndroidApp?.setScreenSecurity) {
        window.NativeAndroidApp.setScreenSecurity(true);
      }
    } catch (e) {
      console.warn('Native screen security call:', e);
    }

    // 2. Prevent Keyboard Screen Capture Shortcuts (PrintScreen, Snipping Tool, Print, Save)
    const handleKeyDown = (e) => {
      // Escape or Backspace to close
      if (e.key === 'Escape' || e.key === 'Backspace') {
        onClose();
        return;
      }

      // PrintScreen / Alt+PrintScreen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch (err) {}
      }

      // Windows + Shift + S or Ctrl + Shift + S or Cmd + Shift + 3/4/5
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch (err) {}
      }
    };

    // 3. Anti-Snipping Tool Protection: Blur & Blackout when window loses focus or becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      try {
        if (window.NativeAndroidApp?.setScreenSecurity) {
          window.NativeAndroidApp.setScreenSecurity(false);
        }
      } catch (e) {}

      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, onClose]);

  // ── Auto-Hide Controls on Inactivity ──
  const pokeControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    if (isOpen) pokeControls();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isOpen, pokeControls]);

  // ── Touch Gesture Controls (Pinch to Zoom, Pan, Double Tap) ──
  const handleTouchStart = (e) => {
    pokeControls();
    if (e.touches.length === 2) {
      // 2-Finger Pinch Start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchDistRef.current = dist;
      initialZoomRef.current = zoom;
    } else if (e.touches.length === 1) {
      // 1-Finger Pan & Double Tap Detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap: toggle between 1x and 2.5x
        setZoom(prev => (prev > 1.2 ? 1 : 2.5));
        setPan({ x: 0, y: 0 });
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialTouchDistRef.current) {
      // 2-Finger Pinch Zoom
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / initialTouchDistRef.current;
      const newZoom = Math.min(Math.max(initialZoomRef.current * scale, 0.7), 6.0);
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      // 1-Finger Pan (when zoomed in or moving around)
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
    initialTouchDistRef.current = null;
    isDraggingRef.current = false;
  };

  // ── Desktop Mouse Wheel & Drag Controls ──
  const handleWheel = (e) => {
    e.preventDefault();
    pokeControls();
    const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.7), 6.0));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    pokeControls();
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

  const handleZoomIn = (e) => {
    e.stopPropagation();
    pokeControls();
    setZoom(z => Math.min(z + 0.5, 6.0));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    pokeControls();
    setZoom(z => Math.max(z - 0.5, 0.7));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    pokeControls();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'var(--bg-primary, #0B0F19)',
        color: 'var(--text-primary, #FFFFFF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        cursor: zoom > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : 'default'
      }}
    >
      {/* ── Main Preview Result (Pinch / Zoom / Pan Container) ── */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDraggingRef.current || initialTouchDistRef.current ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '92vw',
          maxHeight: '92vh',
          pointerEvents: 'none',
          filter: isWindowBlurred ? 'blur(35px) brightness(0.2)' : 'none'
        }}
      >
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt="Full Preview"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              maxWidth: '88vw',
              maxHeight: '88vh',
              objectFit: 'contain',
              borderRadius: '0px',
              boxShadow: 'var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))',
              border: '1px solid var(--border-color, transparent)',
              pointerEvents: 'none'
            }}
          />
        ) : (
          <div style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '14px', fontWeight: 600 }}>
            Loading preview...
          </div>
        )}
      </div>

      {/* ── Anti-Capture / Snipping Tool Blur Screen Overlay ── */}
      {isWindowBlurred && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--bg-primary, #0B0F19)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          zIndex: 100,
          color: 'var(--text-primary, #FFFFFF)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-soft, rgba(214, 0, 54, 0.15))',
            border: '1px solid var(--border-accent, rgba(214, 0, 54, 0.35))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={28} color="var(--accent-primary, #D60036)" />
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.3px' }}>
            Protected Preview Mode
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', textAlign: 'center', maxWidth: '280px' }}>
            Screen capture & screenshotting is disabled inside full-screen preview mode.
          </div>
        </div>
      )}

      {/* ── Top Header Controls (Floating Close Button) ── */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 50,
          opacity: showControls ? 1 : 0,
          transform: showControls ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md, 12px)',
            background: 'var(--bg-elevated, #111625)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            color: 'var(--text-primary, #FFFFFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md, 0 4px 16px rgba(0,0,0,0.25))',
            transition: 'all var(--transition-fast, 0.15s ease)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-elevated, #111625)';
            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
            e.currentTarget.style.color = 'var(--text-primary, #FFFFFF)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Close Full Screen Preview (Esc)"
          aria-label="Close Full Screen Preview"
        >
          <X size={19} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Bottom Floating Zoom Controls Bar (App-Consistent Glass Toolbar) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom, 20px) + 16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full, 9999px)',
          background: 'var(--bg-elevated, #111625)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.35))',
          opacity: showControls ? 1 : 0,
          transform: showControls ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.7}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--bg-secondary, rgba(255, 255, 255, 0.08))',
            border: 'none',
            color: 'var(--text-primary, #FFFFFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoom <= 0.7 ? 'not-allowed' : 'pointer',
            opacity: zoom <= 0.7 ? 0.35 : 1,
            transition: 'all var(--transition-fast, 0.15s ease)'
          }}
          onMouseEnter={e => {
            if (zoom > 0.7) e.currentTarget.style.background = 'var(--bg-hover, rgba(255, 255, 255, 0.15))';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-secondary, rgba(255, 255, 255, 0.08))';
          }}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <span style={{
          color: 'var(--text-primary, #FFFFFF)',
          fontSize: '13px',
          fontWeight: 700,
          minWidth: '46px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans, inherit)',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 6.0}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--bg-secondary, rgba(255, 255, 255, 0.08))',
            border: 'none',
            color: 'var(--text-primary, #FFFFFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoom >= 6.0 ? 'not-allowed' : 'pointer',
            opacity: zoom >= 6.0 ? 0.35 : 1,
            transition: 'all var(--transition-fast, 0.15s ease)'
          }}
          onMouseEnter={e => {
            if (zoom < 6.0) e.currentTarget.style.background = 'var(--bg-hover, rgba(255, 255, 255, 0.15))';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-secondary, rgba(255, 255, 255, 0.08))';
          }}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color, rgba(255, 255, 255, 0.15))', margin: '0 2px' }} />

        <button
          onClick={handleResetZoom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--bg-secondary, rgba(255, 255, 255, 0.08))',
            border: 'none',
            color: 'var(--text-primary, #FFFFFF)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans, inherit)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast, 0.15s ease)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover, rgba(255, 255, 255, 0.15))';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-secondary, rgba(255, 255, 255, 0.08))';
          }}
          title="Reset Zoom (Fit to Screen)"
          aria-label="Reset Zoom (Fit to Screen)"
        >
          <RotateCcw size={12} />
          <span>Fit</span>
        </button>
      </div>
    </div>
  );
}
