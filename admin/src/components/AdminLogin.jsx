// admin/src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, Loader2, ArrowRight, AlertCircle, 
  Eye, EyeOff 
} from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  SUPER_ADMIN_EMAIL 
} from '../services/authService';
import GoldenAdminBadge from './GoldenAdminBadge';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { user, isSuperAdmin } = await loginWithGoogle();
      if (!isSuperAdmin) {
        setError(`Access Denied: Account (${user.email}) is not authorized as Super Admin. Please sign in with ${SUPER_ADMIN_EMAIL}.`);
        setGoogleLoading(false);
        return;
      }
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      console.error('[AdminLogin] Google error:', err);
      setError(err?.message || 'Google authentication failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { user, isSuperAdmin } = await loginWithEmail(email.trim(), password);
      if (!isSuperAdmin) {
        setError(`Access Denied: Account (${user.email}) is not authorized as Super Admin.`);
        setLoading(false);
        return;
      }
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      console.error('[AdminLogin] Email error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid admin credentials. Please check your email and password, or use Google Sign-In.');
      } else {
        setError(err?.message || 'Authentication failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'var(--bg-primary, #030305)',
        color: 'var(--text-primary, #FFFFFF)',
        padding: 'calc(48px + env(safe-area-inset-top, 0px)) 24px calc(24px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto',
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif"
      }}
    >
      {/* Dynamic Ambient Background Radiant Mesh */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(214, 0, 54, 0.16) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Form Content - Fully Out-of-the-box (Frameless & Clean) */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2,
          position: 'relative',
          animation: 'fadeIn 0.3s ease forwards'
        }}
      >
        {/* App Icon & Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '14px', position: 'relative' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 5px 12.8px rgba(214,0,54,0.3)',
                background: '#030305'
              }}
            >
              <img
                src="/logo.webp"
                alt="Mushi QR Pro Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            {/* Shield Icon Overlay */}
            <div style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              background: '#030305',
              borderRadius: '50%',
              padding: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              <Shield size={20} color="#F59E0B" fill="rgba(245, 158, 11, 0.2)" />
            </div>
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: 'var(--text-primary, #FFFFFF)',
              margin: '0 0 6px',
              letterSpacing: '-0.5px'
            }}
          >
            Mushi QR Pro
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: '12px',
              color: '#F59E0B',
              fontWeight: 800,
              letterSpacing: '0.6px',
              lineHeight: 1.4
            }}
          >
            <GoldenAdminBadge size={13} /> SUPER ADMIN PORTAL
          </div>
        </div>

        {/* 1. Continue with Google on Top */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '16px',
            background: 'var(--bg-input, #0E0E16)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
            color: 'var(--text-primary, #FFFFFF)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.1s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input, #0E0E16)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {googleLoading ? (
            <Loader2 size={19} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Sign In with Super Admin Google</span>
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.12))' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--text-muted, #64748B)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}
          >
            OR WITH EMAIL
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.12))' }} />
        </div>

        {/* Error Alert Message */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary, #CBD5E1)',
                marginBottom: '6px',
                letterSpacing: '0.2px'
              }}
            >
              Admin Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '15px',
                  color: 'var(--text-muted, #64748B)'
                }}
              />
              <input
                type="email"
                placeholder={SUPER_ADMIN_EMAIL}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '50px',
                  padding: '0 14px 0 44px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--bg-input, #0E0E16)',
                  color: 'var(--text-primary, #FFFFFF)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#D60036';
                  e.target.style.boxShadow = '0 0 0 3px rgba(214, 0, 54, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-secondary, #CBD5E1)',
                marginBottom: '6px',
                letterSpacing: '0.2px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '15px',
                  color: 'var(--text-muted, #64748B)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '50px',
                  padding: '0 44px 0 44px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--bg-input, #0E0E16)',
                  color: 'var(--text-primary, #FFFFFF)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#D60036';
                  e.target.style.boxShadow = '0 0 0 3px rgba(214, 0, 54, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '16px',
              background: '#D60036',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 18px rgba(214, 0, 54, 0.35)',
              marginTop: '10px',
              transition: 'transform 0.1s ease',
              opacity: (loading || googleLoading) ? 0.7 : 1
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? (
              <Loader2 size={19} style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                <span>Sign In as Super Admin</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Notice */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted, #64748B)', lineHeight: 1.5, marginTop: '24px' }}>
          🔒 Restricted portal. All logins, queries, and administrative actions are logged in authoritative server audit records.
        </div>
      </div>
    </div>
  );
}
