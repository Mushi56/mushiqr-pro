import React, { useState, useRef, useEffect } from 'react';

export function DraggableSheet({ children, isOpen, initialHeight = 220, expandedHeight = window.innerHeight * 0.85, onClose }) {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(initialHeight);

  // When isOpen changes, reset to initialHeight
  useEffect(() => {
    if (isOpen) {
      setHeight(initialHeight);
    }
  }, [isOpen, initialHeight]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startHeight.current = height;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    let newHeight = startHeight.current + deltaY;
    
    // Limits
    if (newHeight < 100) newHeight = 100;
    if (newHeight > expandedHeight) newHeight = expandedHeight;
    
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap logic
    if (height < initialHeight * 0.5) {
      if (onClose) onClose();
      setHeight(initialHeight);
    } else if (height > initialHeight * 1.5) {
      setHeight(expandedHeight);
    } else {
      setHeight(initialHeight);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        height: `${height}px`,
        background: 'var(--bg-elevated, #1A1A24)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
    >
      {/* Drag Handle */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
          cursor: 'grab',
          flexShrink: 0
        }}
      >
        <div style={{
          width: '40px',
          height: '6px',
          background: 'var(--text-muted, rgba(255, 255, 255, 0.3))',
          borderRadius: '4px',
          margin: '0 auto'
        }} />
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {children}
      </div>
    </div>
  );
}
