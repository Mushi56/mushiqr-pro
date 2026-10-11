import React, { useState } from 'react';
import { Trash2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item?',
  description = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  itemTitle = null,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  iconType = 'trash', // 'trash' | 'warning' | 'alert'
  isDangerous = false
}) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (e) {
      console.error('Delete confirmation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (iconType === 'warning') return <AlertTriangle size={26} color="#F59E0B" />;
    if (iconType === 'alert') return <AlertCircle size={26} color="#EF4444" />;
    return <Trash2 size={26} color="#EF4444" />;
  };

  const getHaloBg = () => {
    if (iconType === 'warning') return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(239, 68, 68, 0.15)';
  };

  const getBorderColor = () => {
    if (iconType === 'warning') return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(239, 68, 68, 0.25)';
  };

  return (
    <div 
      onClick={() => !isLoading && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        background: 'rgba(9, 11, 20, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated, #0F172A)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '26px',
          width: '100%',
          maxWidth: '400px',
          padding: '26px 24px',
          color: 'var(--text-primary, #FFFFFF)',
          boxShadow: '0 24px 65px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          animation: 'scaleUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Animated Warning / Trash Icon Halo */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: getHaloBg(),
          border: `1px solid ${getBorderColor()}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          boxShadow: isDangerous ? '0 0 25px rgba(239, 68, 68, 0.35)' : 'none',
          animation: isDangerous ? 'pulse 2s infinite ease-in-out' : 'none'
        }}>
          {getIcon()}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '19px',
          fontWeight: 800,
          margin: '0 0 8px',
          color: 'var(--text-primary, #FFFFFF)',
          letterSpacing: '-0.3px'
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary, #94A3B8)',
          lineHeight: 1.5,
          margin: '0 0 16px',
          maxWidth: '320px'
        }}>
          {description}
        </p>

        {/* Optional Item Preview Tag / Box */}
        {itemTitle && (
          <div style={{
            width: '100%',
            background: 'var(--bg-primary, rgba(0, 0, 0, 0.25))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-primary, #FFFFFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box'
          }}>
            <span style={{ color: 'var(--text-tertiary, #64748B)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target:</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemTitle}</span>
          </div>
        )}

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
          marginTop: itemTitle ? '0' : '8px'
        }}>
          <button
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
              background: 'transparent',
              color: 'var(--text-primary, #FFFFFF)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
              transition: 'background 0.2s, transform 0.1s'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = 'var(--bg-hover, rgba(255, 255, 255, 0.08))')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = 'transparent')}
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              flex: 1.2,
              padding: '12px 16px',
              borderRadius: '14px',
              border: 'none',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.1s, opacity 0.2s',
              opacity: isLoading ? 0.75 : 1
            }}
            onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
