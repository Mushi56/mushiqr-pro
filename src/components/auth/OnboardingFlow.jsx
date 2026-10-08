import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Palette,
  Image as ImageIcon,
  Grid,
  ShieldCheck,
  ChevronRight,
  Scan,
  FileSpreadsheet,
  FileText,
  FileCode,
  Zap,
  Layers,
  Archive,
  Download,
  Barcode as BarcodeIcon,
  Check,
  CheckCircle2,
  QrCode,
  ShoppingBag,
  Truck,
  Package,
  Factory,
  Cloud,
  Gauge,
  RefreshCw
} from 'lucide-react';
import onboardingQrSvg from '../../assets/onboarding-qr-code.svg';
import onboardingBarcodeSvg from '../../assets/onboarding-barcode.svg';

export default function OnboardingFlow({ onComplete, theme, effectiveTheme: propEffectiveTheme }) {
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (propEffectiveTheme) return propEffectiveTheme;
    const attr = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
    if (attr === 'light' || attr === 'dark') return attr;
    try {
      const prefs = JSON.parse(localStorage.getItem('mushi_qr_preferences_v2') || '{}');
      if (prefs.theme === 'light') return 'light';
      if (prefs.theme === 'dark') return 'dark';
    } catch (e) {}
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (propEffectiveTheme) {
      setEffectiveTheme(propEffectiveTheme);
      return;
    }
    const updateTheme = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') {
        setEffectiveTheme(attr);
      } else {
        const isSysLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        setEffectiveTheme(isSysLight ? 'light' : 'dark');
      }
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', updateTheme);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [propEffectiveTheme]);

  const isLight = effectiveTheme === 'light';
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('mushi_onboarding_completed', 'true');
    onComplete?.();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
    if (diff < -50 && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft' && currentSlide > 0) setCurrentSlide(prev => prev - 1);
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isLight ? '#F8FAFC' : '#06070B',
        color: isLight ? '#0F172A' : '#FFFFFF',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Dynamic Multi-Orb Ambient Glass Glow (Lush in Light Mode & Atmospheric in Dark Mode) */}
      <div
        style={{
          position: 'absolute',
          top: currentSlide === 0 ? '20%' : '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: isLight
            ? currentSlide === 0
              ? 'radial-gradient(circle at 45% 45%, rgba(255, 30, 86, 0.22) 0%, rgba(244, 63, 94, 0.12) 40%, rgba(168, 85, 247, 0.08) 65%, transparent 75%)'
              : currentSlide === 1
              ? 'radial-gradient(circle at 50% 45%, rgba(255, 124, 0, 0.22) 0%, rgba(245, 158, 11, 0.14) 40%, rgba(139, 92, 246, 0.08) 65%, transparent 75%)'
              : 'radial-gradient(circle at 45% 45%, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.14) 40%, rgba(99, 102, 241, 0.08) 65%, transparent 75%)'
            : currentSlide === 0
              ? 'radial-gradient(circle, rgba(255, 30, 86, 0.28) 0%, rgba(184, 0, 38, 0.12) 50%, transparent 70%)'
              : currentSlide === 1
              ? 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(214, 0, 54, 0.12) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.14) 50%, transparent 70%)',
          filter: isLight ? 'blur(55px)' : 'blur(60px)',
          transition: 'background 0.5s ease',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Secondary Ambient Accent Glow Orbs for Rich Color Vibrance in Light Mode */}
      {isLight && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '4%',
              right: '-8%',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background:
                currentSlide === 0
                  ? 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 70%)'
                  : currentSlide === 1
                  ? 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(251, 191, 36, 0.08) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)',
              filter: 'blur(45px)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '-10%',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background:
                currentSlide === 0
                  ? 'radial-gradient(circle, rgba(251, 146, 60, 0.16) 0%, rgba(255, 30, 86, 0.06) 50%, transparent 70%)'
                  : currentSlide === 1
                  ? 'radial-gradient(circle, rgba(236, 72, 153, 0.16) 0%, rgba(245, 158, 11, 0.06) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(168, 85, 247, 0.16) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 70%)',
              filter: 'blur(45px)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        </>
      )}

      {/* Main Content Area directly under Safe Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 8px',
          boxSizing: 'border-box',
          zIndex: 10,
          position: 'relative',
          maxWidth: '440px',
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto'
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            SLIDE 1: EXACT 3D NEON STAGE WITH GLOWING QR CODE & FLOATING BADGES
            ═════════════════════════════════════════════════════════════════════ */}
        {currentSlide === 0 && (
          <div className="onboarding-slide-anim" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            
            {/* Top Typography Header & Containerless Skip Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0 4px',
                boxSizing: 'border-box',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h1
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    margin: '0 0 8px 0',
                    lineHeight: 1.15,
                    letterSpacing: '-0.5px',
                    fontFamily: 'Outfit, var(--font-display, sans-serif)'
                  }}
                >
                  Create Stunning
                  <br />
                  <span style={{ background: 'linear-gradient(135deg, #FF1E56 0%, #FF6B8B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>QR</span> Codes
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: isLight ? '#475569' : '#94A3B8',
                    margin: 0,
                    lineHeight: 1.45,
                    maxWidth: '280px',
                    fontWeight: 400
                  }}
                >
                  Design beautiful QR codes with custom logos, colors, frames and unique styles.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0 4px 12px',
                  marginTop: '4px',
                  outline: 'none',
                  flexShrink: 0,
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#0F172A' : '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)')}
              >
                Skip
              </button>
            </div>

            {/* Central 3D Interactive Stage Scene */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '340px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px 0 10px 0'
              }}
            >
              {/* Cosmic Sparkle Stars around the 3D space */}
              <span className="sparkle-star" style={{ top: '10%', left: '8%', color: '#FF4D80', fontSize: '13px' }}>✦</span>
              <span className="sparkle-star" style={{ top: '8%', right: '36%', color: '#FF4D80', fontSize: '9px', animationDelay: '1s' }}>✦</span>
              <span className="sparkle-star" style={{ top: '42%', left: '22%', color: '#FF2A6D', fontSize: '8px', animationDelay: '1.5s' }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '28%', left: '16%', color: '#FF4D80', fontSize: '11px', animationDelay: '0.7s' }}>✦</span>
              <span className="sparkle-star" style={{ top: '34%', right: '6%', color: '#FFA07A', fontSize: '10px', animationDelay: '2s' }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '38%', right: '22%', color: '#FF2A6D', fontSize: '8px', animationDelay: '1.2s' }}>✦</span>

              {/* Orbiting Ambient Light Ring Arcs */}
              <div
                style={{
                  position: 'absolute',
                  width: '270px',
                  height: '190px',
                  borderRadius: '50%',
                  border: isLight ? '2px solid rgba(255, 30, 86, 0.45)' : '1.5px solid rgba(255, 30, 86, 0.28)',
                  boxShadow: isLight ? '0 0 20px rgba(255, 30, 86, 0.3)' : '0 0 18px rgba(255, 30, 86, 0.2)',
                  transform: 'rotate(-25deg) translateY(-8px)',
                  pointerEvents: 'none'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '280px',
                  height: '200px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 30, 86, 0.22)',
                  transform: 'rotate(15deg) translateY(12px)',
                  pointerEvents: 'none'
                }}
              />

              {/* 3D Tiered Glowing Stage / Stool Platform beneath the QR Code */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '240px',
                  height: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2
                }}
              >
                {/* Upper Tier of 3D Stool Platform */}
                <div
                  style={{
                    width: '200px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isLight ? 'linear-gradient(180deg, #FF1E56 0%, #D8042B 100%)' : 'linear-gradient(180deg, #D8042B 0%, #500010 100%)',
                    borderTop: '2.5px solid #FF3B69',
                    boxShadow: isLight ? '0 8px 25px rgba(255, 30, 86, 0.35), inset 0 2px 10px rgba(255, 255, 255, 0.7)' : '0 0 35px rgba(255, 30, 86, 0.9), inset 0 2px 14px rgba(255, 255, 255, 0.5)',
                    position: 'relative',
                    zIndex: 3
                  }}
                />
                {/* Lower Tier of 3D Stool Platform */}
                <div
                  style={{
                    width: '235px',
                    height: '46px',
                    borderRadius: '50%',
                    background: isLight ? 'linear-gradient(180deg, #E11D48 0%, #9F1239 100%)' : 'linear-gradient(180deg, #7A0018 0%, #200006 100%)',
                    borderTop: '2px solid #FF1E56',
                    boxShadow: isLight ? '0 10px 25px rgba(0, 0, 0, 0.12), 0 0 20px rgba(216, 4, 43, 0.3)' : '0 14px 38px rgba(0, 0, 0, 0.95), 0 0 45px rgba(216, 4, 43, 0.6)',
                    marginTop: '-26px',
                    zIndex: 2
                  }}
                />
                {/* Base Floor Glow Aura */}
                <div
                  style={{
                    width: '270px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(255, 30, 86, 0.5) 0%, transparent 70%)',
                    filter: 'blur(16px)',
                    marginTop: '-22px',
                    zIndex: 1
                  }}
                />
              </div>

              {/* 3D Floating Glowing QR Code Box with exact 3D Rotation */}
              <div
                className="floating-qr-3d"
                style={{
                  position: 'relative',
                  width: '195px',
                  height: '195px',
                  borderRadius: '32px',
                  background: isLight ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 241, 245, 0.9) 100%)' : 'linear-gradient(145deg, rgba(32, 6, 14, 0.96) 0%, rgba(10, 2, 5, 0.98) 100%)',
                  border: '3px solid #FF2A6D',
                  backdropFilter: isLight ? 'blur(20px)' : 'none',
                  boxShadow: isLight
                    ? '0 20px 50px rgba(255, 30, 86, 0.28), 0 0 25px rgba(255, 30, 86, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.95), 0 10px 24px rgba(0, 0, 0, 0.05)'
                    : `
                    0 0 40px rgba(255, 30, 86, 0.7),
                    0 0 16px #FF1E56,
                    inset 0 0 22px rgba(255, 30, 86, 0.4),
                    0 30px 60px rgba(0, 0, 0, 0.9)
                  `,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  boxSizing: 'border-box',
                  zIndex: 10,
                  transform: 'perspective(900px) rotateX(15deg) rotateY(-18deg) rotateZ(5deg)',
                  marginBottom: '20px'
                }}
              >
                {/* Render the exact QR SVG */}
                <img
                  src={onboardingQrSvg}
                  alt="Mushi QR Code"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '22px'
                  }}
                />

                {/* App Current Icon Logo in the Center of QR Code (Compact size, no strokes, no shadow) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '33px',
                    height: '33px',
                    borderRadius: '7.5px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 15,
                    border: 'none',
                    padding: 0,
                    boxShadow: 'none'
                  }}
                >
                  <img
                    src="/logo.webp"
                    alt="Mushi QR Pro App Icon"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '7.5px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              </div>

              {/* ═════════ 4 3D-ROTATED BORDERLESS FEATURE ICON TILES ═════════ */}

              {/* Badge 1: Top Right - Add Logo & Frame (3D Purple Tile + Text to the Right) */}
              <div
                className="anim-tile-purple"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #8B5CF6 0%, #6D28D9 55%, #4C1D95 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(109, 40, 217, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(139, 92, 246, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <ImageIcon size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Add Logo</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>&amp; Frame</span>
                </div>
              </div>

              {/* Badge 2: Top Left - Custom Designs (3D Magenta Tile + Centered Text Below) */}
              <div
                className="anim-tile-magenta"
                style={{
                  position: 'absolute',
                  top: '32px',
                  left: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #FF2A6D 0%, #D8042B 55%, #880018 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(216, 4, 43, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(255, 42, 109, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Palette size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Custom</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Designs</span>
                </div>
              </div>

              {/* Badge 3: Bottom Left - Templates & Styles (Placed closer to the lower-left QR corner) */}
              <div
                className="anim-tile-blue"
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  left: '26px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #3B82F6 0%, #1D4ED8 55%, #172554 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(29, 78, 216, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(59, 130, 246, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Grid size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Templates</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>&amp; Styles</span>
                </div>
              </div>

              {/* Badge 4: Bottom Right - Colors & Gradients (3D Golden Amber Tile + Centered Text Below) */}
              <div
                className="anim-tile-amber"
                style={{
                  position: 'absolute',
                  bottom: '48px',
                  right: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #F59E0B 0%, #D97706 55%, #78350F 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(217, 119, 6, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(245, 158, 11, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '20px',
                    fontFamily: 'serif'
                  }}
                >
                  <span style={{ filter: 'none' }}>Tt</span>
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Colors &amp;</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Gradients</span>
                </div>
              </div>

            </div>

            {/* Bottom Security & Privacy Card (Rich Glassmorphic in Light Mode) */}
            <div
              style={{
                width: '100%',
                background: isLight
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 241, 245, 0.72) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1.5px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '18px',
                padding: '11px 15px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                marginTop: '4px',
                boxShadow: isLight
                  ? '0 12px 32px rgba(255, 30, 86, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 1)'
                  : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: isLight
                      ? 'linear-gradient(135deg, rgba(255, 30, 86, 0.18) 0%, rgba(255, 107, 138, 0.1) 100%)'
                      : 'rgba(255, 30, 86, 0.12)',
                    border: isLight ? '1.5px solid rgba(255, 30, 86, 0.35)' : '1px solid rgba(255, 30, 86, 0.3)',
                    boxShadow: isLight ? '0 4px 14px rgba(255, 30, 86, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF1E56',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={21} strokeWidth={2.4} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.2 }}>
                    100% Secure &amp; Private
                  </span>
                  <span style={{ fontSize: '11px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, marginTop: '2px', lineHeight: 1.2 }}>
                    On-device encryption &amp; privacy
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color={isLight ? '#FF1E56' : '#64748B'} strokeWidth={2.5} />
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SLIDE 2: PROFESSIONAL BARCODES (EXACT 3D GOLDEN STOOL + 3D BARCODE + CATEGORIES)
            ═════════════════════════════════════════════════════════════════════ */}
        {currentSlide === 1 && (
          <div className="onboarding-slide-anim" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            
            {/* Top Typography Header & Containerless Skip Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0 4px',
                boxSizing: 'border-box',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h1
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    margin: '0 0 8px 0',
                    lineHeight: 1.15,
                    letterSpacing: '-0.5px',
                    fontFamily: 'Outfit, var(--font-display, sans-serif)'
                  }}
                >
                  Professional
                  <br />
                  <span style={{ background: 'linear-gradient(135deg, #FF7C00 0%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Barcodes</span>
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: isLight ? '#475569' : '#94A3B8',
                    margin: 0,
                    lineHeight: 1.45,
                    maxWidth: '280px',
                    fontWeight: 400
                  }}
                >
                  Generate and scan 1D &amp; 2D barcodes for retail, inventory, shipping and industrial standards.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0 4px 12px',
                  marginTop: '4px',
                  outline: 'none',
                  flexShrink: 0,
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#0F172A' : '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)')}
              >
                Skip
              </button>
            </div>

            {/* Central 3D Interactive Stage Scene (Amber / Gold Theme) */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '340px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '4px 0 10px 0'
              }}
            >
              {/* Golden Cosmic Sparkle Stars */}
              <span className="sparkle-star" style={{ top: '10%', left: '8%', color: '#FFA000', fontSize: '13px' }}>✦</span>
              <span className="sparkle-star" style={{ top: '8%', right: '36%', color: '#FFB74D', fontSize: '9px', animationDelay: '1s' }}>✦</span>
              <span className="sparkle-star" style={{ top: '42%', left: '22%', color: '#FF7C00', fontSize: '8px', animationDelay: '1.5s' }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '28%', left: '16%', color: '#FFA000', fontSize: '11px', animationDelay: '0.7s' }}>✦</span>
              <span className="sparkle-star" style={{ top: '34%', right: '6%', color: '#FFD54F', fontSize: '10px', animationDelay: '2s' }}>✦</span>
              <span className="sparkle-star" style={{ bottom: '38%', right: '22%', color: '#FF7C00', fontSize: '8px', animationDelay: '1.2s' }}>✦</span>

              {/* Orbiting Ambient Light Ring Arcs (Gold) */}
              <div
                style={{
                  position: 'absolute',
                  width: '270px',
                  height: '190px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 124, 0, 0.28)',
                  boxShadow: '0 0 18px rgba(255, 124, 0, 0.2)',
                  transform: 'rotate(-25deg) translateY(-8px)',
                  pointerEvents: 'none'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '280px',
                  height: '200px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 124, 0, 0.22)',
                  transform: 'rotate(15deg) translateY(12px)',
                  pointerEvents: 'none'
                }}
              />

              {/* 3D Tiered Glowing Stage / Stool Platform (Golden Theme) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '240px',
                  height: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2
                }}
              >
                {/* Upper Tier of 3D Stool Platform */}
                <div
                  style={{
                    width: '200px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, #D96500 0%, #4D2000 100%)',
                    borderTop: '2.5px solid #FF9D33',
                    boxShadow: '0 0 35px rgba(255, 124, 0, 0.9), inset 0 2px 14px rgba(255, 255, 255, 0.5)',
                    position: 'relative',
                    zIndex: 3
                  }}
                />
                {/* Lower Tier of 3D Stool Platform */}
                <div
                  style={{
                    width: '235px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, #78350F 0%, #250E02 100%)',
                    borderTop: '2px solid #FF7C00',
                    boxShadow: '0 14px 38px rgba(0, 0, 0, 0.95), 0 0 45px rgba(217, 119, 6, 0.6)',
                    marginTop: '-26px',
                    zIndex: 2
                  }}
                />
                {/* Base Floor Glow Aura */}
                <div
                  style={{
                    width: '270px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(255, 124, 0, 0.5) 0%, transparent 70%)',
                    filter: 'blur(16px)',
                    marginTop: '-22px',
                    zIndex: 1
                  }}
                />
              </div>

              {/* 3D Floating Glowing Barcode Box */}
              <div
                className="floating-barcode-3d"
                style={{
                  position: 'relative',
                  width: '210px',
                  height: '145px',
                  borderRadius: '26px',
                  background: 'linear-gradient(145deg, #FBF8F3 0%, #E6E0D5 100%)',
                  border: '3px solid #FFA000',
                  boxShadow: `
                    0 0 40px rgba(255, 124, 0, 0.7),
                    0 0 16px #FF7C00,
                    inset 0 0 18px rgba(255, 124, 0, 0.35),
                    0 30px 60px rgba(0, 0, 0, 0.9)
                  `,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 20px',
                  boxSizing: 'border-box',
                  zIndex: 10,
                  transform: 'perspective(900px) rotateX(15deg) rotateY(-18deg) rotateZ(5deg)',
                  marginBottom: '20px'
                }}
              >
                {/* Crisp Vector Barcode Pattern */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5px', height: '62px', width: '100%' }}>
                  {[3, 1.2, 4, 1.5, 3, 2, 4, 1, 2.5, 3.5, 1, 4, 2, 1.5, 3, 2, 4, 1.5, 3, 1.2, 3.5, 2, 4, 1.5, 2, 3].map((w, i) => (
                    <div key={i} style={{ width: `${w * 1.5}px`, height: '100%', background: '#0F172A', borderRadius: '1px' }} />
                  ))}
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#0F172A', letterSpacing: '4px', marginTop: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  890123456789
                </div>
              </div>

              {/* ═════════ 4 3D-ROTATED BORDERLESS BARCODE FEATURE ICON TILES ═════════ */}

              {/* Badge 1: Top Right - Live Scanner (3D Golden-Orange Tile + Text to the Right) */}
              <div
                className="anim-tile-amber"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #FF7C00 0%, #D96500 55%, #78350F 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(217, 119, 6, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(255, 124, 0, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <Scan size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Live Scanner</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: isLight ? '#64748B' : '#CBD5E1', display: 'block', letterSpacing: '-0.2px' }}>Ultra Fast</span>
                </div>
              </div>

              {/* Badge 2: Top Left - 30+ Formats (3D Purple Tile + Centered Text Below) */}
              <div
                className="anim-tile-purple"
                style={{
                  position: 'absolute',
                  top: '26px',
                  left: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #8B5CF6 0%, #6D28D9 55%, #4C1D95 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(109, 40, 217, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(139, 92, 246, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <BarcodeIcon size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>30+ Formats</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block' }}>EAN, UPC,</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block' }}>Code 128 &amp; more</span>
                </div>
              </div>

              {/* Badge 3: Bottom Left - 1D & 2D Support (3D Cobalt Blue Tile - Tucked near lower-left QR/Barcode) */}
              <div
                className="anim-tile-blue"
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  left: '26px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #3B82F6 0%, #1D4ED8 55%, #172554 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(29, 78, 216, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(59, 130, 246, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <QrCode size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>1D &amp; 2D</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>Support</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block' }}>All Standards</span>
                </div>
              </div>

              {/* Badge 4: Bottom Right - High Quality (3D Emerald Green Tile + Centered Text Below) */}
              <div
                className="anim-tile-green"
                style={{
                  position: 'absolute',
                  bottom: '44px',
                  right: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  zIndex: 15
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, #10B981 0%, #059669 55%, #064E3B 100%)',
                    border: 'none',
                    boxShadow: `
                      0 12px 24px rgba(5, 150, 105, 0.6),
                      0 4px 10px rgba(0, 0, 0, 0.45),
                      inset 0 2px 2px rgba(255, 255, 255, 0.7),
                      inset 0 -3px 4px rgba(0, 0, 0, 0.5),
                      0 0 18px rgba(16, 185, 129, 0.4)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <ShieldCheck size={22} strokeWidth={2.4} style={{ filter: 'none' }} />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', display: 'block', letterSpacing: '-0.2px' }}>High Quality</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block' }}>Print Ready</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block' }}>&amp; Clear</span>
                </div>
              </div>

            </div>

            {/* Bottom Multi-Category Strip Card (Retail, Logistics, Inventory, Industry) */}
            <div
              style={{
                width: '100%',
                background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '16px',
                padding: '10px 6px',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                backdropFilter: 'blur(10px)',
                marginTop: '4px',
                boxShadow: isLight ? '0 8px 24px rgba(0, 0, 0, 0.05)' : 'none'
              }}
            >
              {/* Item 1: Retail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 124, 0, 0.15)',
                    border: '1px solid rgba(255, 124, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF7C00'
                  }}
                >
                  <ShoppingBag size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Retail</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Price tags &amp; labels</span>
              </div>

              {/* Item 2: Logistics */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A855F7'
                  }}
                >
                  <Truck size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Logistics</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Shipping &amp; tracking</span>
              </div>

              {/* Item 3: Inventory */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8'
                  }}
                >
                  <Package size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Inventory</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Stock &amp; assets</span>
              </div>

              {/* Item 4: Industry */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}
                >
                  <Factory size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Industry</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Manufacturing</span>
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SLIDE 3: POWERFUL BULK GENERATION (SPLIT VIEW + 3D DECK + PREVIEW CONSOLE)
            ═════════════════════════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
          <div className="onboarding-slide-anim" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            
            {/* Top Typography Header (Without '03' badge matching user instruction) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0 4px',
                boxSizing: 'border-box',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h1
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    margin: '0 0 6px 0',
                    lineHeight: 1.15,
                    letterSpacing: '-0.5px',
                    fontFamily: 'Outfit, var(--font-display, sans-serif)'
                  }}
                >
                  Powerful
                  <br />
                  <span style={{ background: 'linear-gradient(135deg, #059669 0%, #00E676 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bulk Generation</span>
                </h1>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: isLight ? '#475569' : '#94A3B8',
                    margin: 0,
                    lineHeight: 1.4,
                    maxWidth: '290px',
                    fontWeight: 400
                  }}
                >
                  Create thousands of QR codes and barcodes in seconds. Import, sync and export with ease.
                </p>
              </div>
            </div>

            {/* Central Split Section: Left 3D Extruded Feature Tiles + Right 3D Deck & Preview Console */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.32fr',
                gap: '10px',
                width: '100%',
                alignItems: 'center',
                margin: '4px 0 6px 0'
              }}
            >
              {/* Left Column: 5 3D Extruded Borderless Feature Tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {/* Feature 1: CSV / Excel Import (3D Green Tile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(145deg, #10B981 0%, #059669 55%, #064E3B 100%)',
                      border: 'none',
                      boxShadow: `
                        0 8px 18px rgba(5, 150, 105, 0.55),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 2px 2px rgba(255, 255, 255, 0.7),
                        inset 0 -2px 3px rgba(0, 0, 0, 0.45)
                      `,
                      transform: 'perspective(400px) rotateX(10deg) rotateY(-10deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <FileSpreadsheet size={18} strokeWidth={2.4} style={{ filter: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.15 }}>CSV / Excel Import</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Instant data import</span>
                  </div>
                </div>

                {/* Feature 2: Multi-Format (3D Purple Tile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(145deg, #8B5CF6 0%, #6D28D9 55%, #4C1D95 100%)',
                      border: 'none',
                      boxShadow: `
                        0 8px 18px rgba(109, 40, 217, 0.55),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 2px 2px rgba(255, 255, 255, 0.7),
                        inset 0 -2px 3px rgba(0, 0, 0, 0.45)
                      `,
                      transform: 'perspective(400px) rotateX(10deg) rotateY(-10deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <Layers size={18} strokeWidth={2.4} style={{ filter: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.15 }}>Multi-Format</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>QR Codes &amp; Barcodes</span>
                  </div>
                </div>

                {/* Feature 3: Bulk Engine (3D Lime/Green Tile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(145deg, #00E676 0%, #10B981 55%, #064E3B 100%)',
                      border: 'none',
                      boxShadow: `
                        0 8px 18px rgba(0, 230, 118, 0.55),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 2px 2px rgba(255, 255, 255, 0.7),
                        inset 0 -2px 3px rgba(0, 0, 0, 0.45)
                      `,
                      transform: 'perspective(400px) rotateX(10deg) rotateY(-10deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <Zap size={18} strokeWidth={2.4} style={{ filter: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.15 }}>Bulk Engine</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>5,000+ codes per batch</span>
                  </div>
                </div>

                {/* Feature 4: ZIP Export (3D Blue Tile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(145deg, #38BDF8 0%, #0284C7 55%, #0C4A6E 100%)',
                      border: 'none',
                      boxShadow: `
                        0 8px 18px rgba(2, 132, 199, 0.55),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 2px 2px rgba(255, 255, 255, 0.7),
                        inset 0 -2px 3px rgba(0, 0, 0, 0.45)
                      `,
                      transform: 'perspective(400px) rotateX(10deg) rotateY(-10deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={18} strokeWidth={2.4} style={{ filter: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.15 }}>ZIP Export</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Single or bulk export</span>
                  </div>
                </div>

                {/* Feature 5: Bulk Sync (3D Amber Tile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(145deg, #F59E0B 0%, #D97706 55%, #78350F 100%)',
                      border: 'none',
                      boxShadow: `
                        0 8px 18px rgba(217, 119, 6, 0.55),
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 2px 2px rgba(255, 255, 255, 0.7),
                        inset 0 -2px 3px rgba(0, 0, 0, 0.45)
                      `,
                      transform: 'perspective(400px) rotateX(10deg) rotateY(-10deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <RefreshCw size={18} strokeWidth={2.4} style={{ filter: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.15 }}>Bulk Sync</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Sticky label sheets</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Stacked Deck (QR Overlapping Barcode) + Bulk Generation Preview Console */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                
                {/* 3D Stack of 3 Cards (CSV/Excel at back + Barcode behind + QR in front overlapping) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '148px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible'
                  }}
                >
                  {/* Glowing Emerald Nebula Background Aura */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '-8px',
                      width: '175px',
                      height: '155px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(0, 230, 118, 0.45) 0%, rgba(16, 185, 129, 0.22) 45%, transparent 75%)',
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  />

                  {/* Orbiting Green Light Ring Arc 1 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
                      width: '185px',
                      height: '135px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(0, 230, 118, 0.45)',
                      boxShadow: '0 0 16px rgba(0, 230, 118, 0.3)',
                      transform: 'rotate(-22deg)',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  />
                  {/* Orbiting Green Light Ring Arc 2 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '175px',
                      height: '125px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(16, 185, 129, 0.3)',
                      transform: 'rotate(18deg)',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  />

                  {/* Cosmic Green Sparkle Stars */}
                  <span className="sparkle-star" style={{ top: '-4px', right: '14px', color: '#00E676', fontSize: '13px', zIndex: 1 }}>✦</span>
                  <span className="sparkle-star" style={{ top: '35%', right: '-8px', color: '#34D399', fontSize: '9px', animationDelay: '1.2s', zIndex: 1 }}>✦</span>
                  <span className="sparkle-star" style={{ bottom: '15px', left: '-4px', color: '#00E676', fontSize: '10px', animationDelay: '0.8s', zIndex: 1 }}>✦</span>

                  {/* 1. Back Sheet: CSV / Excel Glass Sheet (Layer 1 - Back) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '6px',
                      width: '138px',
                      height: '115px',
                      borderRadius: '16px',
                      background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.28) 0%, rgba(4, 28, 19, 0.92) 100%)',
                      border: '2px solid #00E676',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 24px rgba(0, 230, 118, 0.45)',
                      padding: '6px 8px',
                      boxSizing: 'border-box',
                      transform: 'perspective(600px) rotateX(14deg) rotateY(-6deg) rotateZ(3deg)',
                      zIndex: 1,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {/* Header Tab with CSV / Excel Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '7.5px', fontWeight: 900, color: '#022C22', background: '#00E676', padding: '1.5px 6px', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,230,118,0.4)' }}>
                        CSV / Excel
                      </span>
                    </div>
                    {/* Top Table Header Bar */}
                    <div style={{ height: '8px', background: '#10B981', borderRadius: '3px', width: '100%', marginBottom: '4px' }} />
                    {/* Grid Table Cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px' }}>
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: '8px',
                            background: i % 2 === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.14)',
                            borderRadius: '2px'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 2. Middle Layer: 3D Barcode Card (Layer 2 - Behind QR, peeking out on the right) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '0px',
                      width: '102px',
                      height: '76px',
                      borderRadius: '15px',
                      background: 'linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 100%)',
                      border: '2px solid rgba(168, 85, 247, 0.8)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.8), 0 0 20px rgba(168, 85, 247, 0.4)',
                      padding: '8px 10px 14px 10px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'perspective(600px) rotateX(15deg) rotateY(16deg) rotateZ(8deg)',
                      zIndex: 2
                    }}
                  >
                    {/* Barcode Pattern */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.8px', height: '36px', width: '100%' }}>
                      {[3, 1, 4, 1.5, 3, 2, 4, 1, 2.5, 3.5, 1, 4, 2, 1.5, 3, 2, 4, 1.5].map((w, i) => (
                        <div key={i} style={{ width: `${w * 1.1}px`, height: '100%', background: '#0F172A', borderRadius: '0.5px' }} />
                      ))}
                    </div>
                    {/* Attached Purple Barcode Tag */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '8px',
                        background: '#8B5CF6',
                        color: '#FFFFFF',
                        fontSize: '7.5px',
                        fontWeight: 900,
                        padding: '1.5px 6px',
                        borderRadius: '5px',
                        boxShadow: '0 2px 6px rgba(139, 92, 246, 0.6)'
                      }}
                    >
                      Barcode
                    </div>
                  </div>

                  {/* 3. Front Layer: 3D QR Code Card (Layer 3 - Front Center-Left, OVERLAPPING the Barcode) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '0px',
                      width: '108px',
                      height: '108px',
                      borderRadius: '18px',
                      background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                      border: '2.5px solid #00E676',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.9), 0 0 32px rgba(0, 230, 118, 0.7)',
                      padding: '8px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'perspective(600px) rotateX(14deg) rotateY(-16deg) rotateZ(4deg)',
                      zIndex: 5
                    }}
                  >
                    {/* Render exact Onboarding QR Code SVG from Screen 1 */}
                    <img
                      src={onboardingQrSvg}
                      alt="Mushi QR"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />

                    {/* App Current Icon Logo in the Center of QR Code Card (Compact size, no strokes) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '17px',
                        height: '17px',
                        borderRadius: '3.5px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        border: 'none',
                        padding: 0
                      }}
                    >
                      <img
                        src="/logo.webp"
                        alt="App Logo"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '3.5px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                    {/* Attached Green QR Tag */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#00E676',
                        color: '#022C22',
                        fontSize: '8px',
                        fontWeight: 900,
                        padding: '1.5px 7px',
                        borderRadius: '5px',
                        boxShadow: '0 2px 8px rgba(0, 230, 118, 0.6)'
                      }}
                    >
                      QR
                    </div>
                  </div>

                </div>

                {/* Bulk Generation Preview Console Box (Reduced by 30% without redesigning, keeping 3D cards untouched) */}
                <div
                  style={{
                    width: '100%',
                    transform: 'scale(0.70)',
                    transformOrigin: 'top center',
                    marginBottom: '-48px'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      background: isLight ? 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)' : '#09131D',
                      border: isLight ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid rgba(16, 185, 129, 0.45)',
                      borderRadius: '16px',
                      padding: '8px 10px',
                      boxSizing: 'border-box',
                      boxShadow: isLight
                        ? '0 6px 20px rgba(0,0,0,0.06)'
                        : '0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>Bulk Generation Preview</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.2)', padding: '1.5px 6px', borderRadius: '6px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00E676' }} />
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#34D399' }}>Ready</span>
                      </div>
                    </div>

                    {/* Total Codes Count */}
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>Total Codes</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#00E676', lineHeight: 1.1 }}>5,000 / 5,000</span>
                      <span style={{ fontSize: '7.5px', color: '#34D399', fontWeight: 600 }}>Ready to generate</span>
                    </div>

                    {/* Full Green Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10B981 0%, #00E676 100%)', borderRadius: '10px' }} />
                    </div>

                    {/* 3 Queue Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)', padding: '2px 5px', borderRadius: '5px', fontSize: '8.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ background: '#10B981', color: '#fff', fontSize: '7px', fontWeight: 900, padding: '0 3px', borderRadius: '2px' }}>X</span>
                          <span style={{ fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>products.csv</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLight ? '#64748B' : '#94A3B8', fontSize: '7.5px' }}>
                          <span>2,500 rows</span>
                          <Check size={10} color="#10B981" strokeWidth={3} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)', padding: '2px 5px', borderRadius: '5px', fontSize: '8.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ background: '#8B5CF6', color: '#fff', fontSize: '7px', fontWeight: 900, padding: '0 3px', borderRadius: '2px' }}>📋</span>
                          <span style={{ fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>contacts.xlsx</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLight ? '#64748B' : '#94A3B8', fontSize: '7.5px' }}>
                          <span>1,500 rows</span>
                          <Check size={10} color="#10B981" strokeWidth={3} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)', padding: '2px 5px', borderRadius: '5px', fontSize: '8.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ background: '#F59E0B', color: '#fff', fontSize: '7px', fontWeight: 900, padding: '0 3px', borderRadius: '2px' }}>{'{}'}</span>
                          <span style={{ fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>barcodes.json</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLight ? '#64748B' : '#94A3B8', fontSize: '7.5px' }}>
                          <span>1,000 rows</span>
                          <Check size={10} color="#10B981" strokeWidth={3} />
                        </div>
                      </div>
                    </div>

                    {/* Export Button */}
                    <button
                      style={{
                        width: '100%',
                        height: '26px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(16, 185, 129, 0.4)',
                        marginTop: '2px'
                      }}
                    >
                      <Download size={11} strokeWidth={2.5} />
                      <span>Export All (ZIP)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Multi-Benefit Strip Card (Super Fast, Works Offline, 100% Secure, No Limits) */}
            <div
              style={{
                width: '100%',
                background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '16px',
                padding: '10px 6px',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                backdropFilter: 'blur(10px)',
                marginTop: '4px',
                boxShadow: isLight ? '0 8px 24px rgba(0, 0, 0, 0.05)' : 'none'
              }}
            >
              {/* Item 1: Super Fast */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}
                >
                  <Gauge size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Super Fast</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Thousands of codes in sec</span>
              </div>

              {/* Item 2: Works Offline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A855F7'
                  }}
                >
                  <Cloud size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>Works Offline</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Create anytime, anywhere</span>
              </div>

              {/* Item 3: 100% Secure */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8'
                  }}
                >
                  <ShieldCheck size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>100% Secure</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Your data is safe &amp; private</span>
              </div>

              {/* Item 4: No Limits */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B'
                  }}
                >
                  <Layers size={16} strokeWidth={2.3} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', lineHeight: 1.1 }}>No Limits</span>
                <span style={{ fontSize: '8px', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500, lineHeight: 1.15 }}>Batch, formats &amp; creativity</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Bottom Controls Bar (Primary CTA Button) */}
      <footer
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 24px calc(38px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          zIndex: 50,
          maxWidth: '440px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Primary CTA Button (Theme-Aware Matching Vibrant Gradient) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '16px',
            background:
              currentSlide === 0
                ? 'linear-gradient(135deg, #FF1E56 0%, #D8042B 100%)'
                : currentSlide === 1
                ? 'linear-gradient(135deg, #FF7C00 0%, #D96500 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '0.2px',
            boxShadow:
              currentSlide === 0
                ? '0 8px 25px rgba(255, 30, 86, 0.45)'
                : currentSlide === 1
                ? '0 8px 25px rgba(255, 124, 0, 0.45)'
                : '0 8px 25px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.3s ease',
            outline: 'none'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>{currentSlide === totalSlides - 1 ? 'Get Started' : 'Next'}</span>
          <ArrowRight size={18} strokeWidth={2.6} />
        </button>
      </footer>

      {/* Global Embedded Animations */}
      <style>{`
        .floating-qr-3d {
          animation: floatQR3D 5s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        @keyframes floatQR3D {
          0%, 100% {
            transform: perspective(900px) rotateX(15deg) rotateY(-18deg) rotateZ(5deg) translateY(0px);
          }
          50% {
            transform: perspective(900px) rotateX(17deg) rotateY(-16deg) rotateZ(6deg) translateY(-8px);
          }
        }
        .floating-barcode-3d {
          animation: floatBarcode3D 5s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        @keyframes floatBarcode3D {
          0%, 100% {
            transform: perspective(900px) rotateX(15deg) rotateY(-18deg) rotateZ(5deg) translateY(0px);
          }
          50% {
            transform: perspective(900px) rotateX(17deg) rotateY(-16deg) rotateZ(6deg) translateY(-8px);
          }
        }
        .anim-tile-purple {
          animation: floatTilePurple 4.5s ease-in-out infinite;
        }
        @keyframes floatTilePurple {
          0%, 100% {
            transform: perspective(600px) rotateX(14deg) rotateY(-18deg) rotateZ(4deg) translateY(0px);
          }
          50% {
            transform: perspective(600px) rotateX(16deg) rotateY(-16deg) rotateZ(5deg) translateY(-5px);
          }
        }
        .anim-tile-magenta {
          animation: floatTileMagenta 4s ease-in-out infinite;
        }
        @keyframes floatTileMagenta {
          0%, 100% {
            transform: perspective(600px) rotateX(12deg) rotateY(16deg) rotateZ(-4deg) translateY(0px);
          }
          50% {
            transform: perspective(600px) rotateX(14deg) rotateY(14deg) rotateZ(-3deg) translateY(-5px);
          }
        }
        .anim-tile-blue {
          animation: floatTileBlue 4.2s ease-in-out infinite;
        }
        @keyframes floatTileBlue {
          0%, 100% {
            transform: perspective(600px) rotateX(12deg) rotateY(14deg) rotateZ(-3deg) translateY(0px);
          }
          50% {
            transform: perspective(600px) rotateX(14deg) rotateY(12deg) rotateZ(-2deg) translateY(-5px);
          }
        }
        .anim-tile-amber {
          animation: floatTileAmber 3.8s ease-in-out infinite;
        }
        @keyframes floatTileAmber {
          0%, 100% {
            transform: perspective(600px) rotateX(14deg) rotateY(-16deg) rotateZ(4deg) translateY(0px);
          }
          50% {
            transform: perspective(600px) rotateX(16deg) rotateY(-14deg) rotateZ(5deg) translateY(-5px);
          }
        }
        .anim-tile-green {
          animation: floatTileGreen 4.4s ease-in-out infinite;
        }
        @keyframes floatTileGreen {
          0%, 100% {
            transform: perspective(600px) rotateX(14deg) rotateY(-16deg) rotateZ(4deg) translateY(0px);
          }
          50% {
            transform: perspective(600px) rotateX(16deg) rotateY(-14deg) rotateZ(5deg) translateY(-5px);
          }
        }
        @keyframes floatCenter {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes floatLeft {
          0%, 100% { transform: rotate(-10deg) translateY(0px); }
          50% { transform: rotate(-8deg) translateY(-6px); }
        }
        @keyframes floatRight {
          0%, 100% { transform: rotate(8deg) translateY(0px); }
          50% { transform: rotate(10deg) translateY(-6px); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .sparkle-star {
          position: absolute;
          animation: twinkle 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 5;
        }
        .onboarding-slide-anim {
          animation: slideFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Sub-component: Floating Orbital Badge for Barcode and Bulk slides
function OrbitBadge({ icon: Icon, label, desc, top, bottom, left, right, color, delay, isLight }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.75) 100%)' : 'rgba(15, 23, 42, 0.85)',
        border: isLight ? '1.5px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '16px',
        padding: '6px 12px 6px 7px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: isLight
          ? '0 10px 28px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 1)'
          : '0 12px 30px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        zIndex: 15,
        animation: `floatBadge 3.5s ease-in-out infinite ${delay}`
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: `radial-gradient(circle, ${color}25 0%, rgba(255, 255, 255, 0.05) 100%)`,
          border: `1px solid ${color}65`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 10px ${color}35`
        }}
      >
        <Icon size={13} color={color} strokeWidth={2.4} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
        <span style={{ fontSize: '10.5px', fontWeight: 800, color: isLight ? '#0F172A' : '#F8FAFC', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {desc && (
          <span style={{ fontSize: '8.5px', fontWeight: 600, color: isLight ? '#64748B' : 'rgba(203, 213, 225, 0.85)', lineHeight: 1.15, whiteSpace: 'nowrap', marginTop: 1 }}>
            {desc}
          </span>
        )}
      </div>
    </div>
  );
}


