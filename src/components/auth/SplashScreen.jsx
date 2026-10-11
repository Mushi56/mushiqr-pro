import React, { useEffect, useState } from 'react';
import AppIcon from '../AppIcon';

export default function SplashScreen({ onFinish }) {
  const [fadeState, setFadeState] = useState('in'); // 'in' -> 'visible' -> 'out'

  useEffect(() => {
    // Stage 1: Fade-in and pulse animation
    const timerIn = setTimeout(() => {
      setFadeState('visible');
    }, 100);

    // Stage 2: Trigger exit fade
    const timerOut = setTimeout(() => {
      setFadeState('out');
    }, 1400);

    // Stage 3: Complete & callback
    const timerEnd = setTimeout(() => {
      onFinish?.();
    }, 1800);

    return () => {
      clearTimeout(timerIn);
      clearTimeout(timerOut);
      clearTimeout(timerEnd);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #0B0F19)',
        color: 'var(--text-primary, #FFFFFF)',
        opacity: fadeState === 'out' ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadeState === 'out' ? 'none' : 'auto',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Subtle background radiant ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 30, 52, 0.22) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 70%)',
          filter: 'blur(40px)',
          transform: fadeState === 'visible' ? 'scale(1.15)' : 'scale(0.85)',
          transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          pointerEvents: 'none'
        }}
      />

      {/* Center Icon & Branding */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          zIndex: 1,
          transform: fadeState === 'visible' ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <AppIcon size={84} shadow />
          {/* Subtle pulsating ring */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '26px',
              border: '2px solid rgba(239, 30, 52, 0.4)',
              animation: 'splashPulse 1.6s ease-out infinite'
            }}
          />
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              margin: 0,
              background: 'linear-gradient(135deg, #FFFFFF 30%, rgba(255, 255, 255, 0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Outfit, var(--font-display, sans-serif)'
            }}
          >
            Mushi QR Pro
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-tertiary, #94A3B8)',
              margin: 0,
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}
          >
            Create · Connect · Share
          </p>
        </div>
      </div>

      {/* Bottom Loading Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#EF1E34',
            animation: 'splashDot 1.2s ease-in-out infinite 0s'
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#EF1E34',
            animation: 'splashDot 1.2s ease-in-out infinite 0.2s'
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#EF1E34',
            animation: 'splashDot 1.2s ease-in-out infinite 0.4s'
          }}
        />
      </div>

      <style>{`
        @keyframes splashPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.12); opacity: 0.2; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes splashDot {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
