import { nativeGoogleSignIn } from '../../utils/nativeGoogleSignIn';
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Check
} from 'lucide-react';
import { auth, googleProvider } from '../../services/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import AppIcon from '../AppIcon';

function handleAuthError(err) {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 8 characters long with uppercase, numbers and symbols.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return err.message || 'An unexpected error occurred during sign up.';
  }
}

export default function SignUpPage({ onNavigate, onSuccess, theme, effectiveTheme: propEffectiveTheme }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Dynamic Theme Detection
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

  // Password criteria checks (Min 8 chars, Uppercase, Number, Special symbol)
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const isStrong = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleRefreshSuggestion = () => {
    setSuggestedPassword(generateStrongPassword());
    setCopiedSuggested(false);
  };

  const handleApplySuggestedPassword = () => {
    setPassword(suggestedPassword);
    setConfirmPassword(suggestedPassword);
    setCopiedSuggested(true);
    setTimeout(() => setCopiedSuggested(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address format.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase || !hasNumber || !hasSpecial) {
      setError('Password must include at least one uppercase letter, one number, and one special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateProfile(cred.user, { displayName: trimmedName });
      try {
        localStorage.setItem('mushi_onboarding_completed', 'true');
      } catch {}
      onSuccess?.();
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await nativeGoogleSignIn();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
          try {
            localStorage.setItem('mushi_onboarding_completed', 'true');
          } catch {}
          onSuccess?.();
        } else {
          throw new Error('No ID token received from Google sign in');
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
          try {
            localStorage.setItem('mushi_onboarding_completed', 'true');
          } catch {}
          onSuccess?.();
        } catch (popupErr) {
          if (
            popupErr.code === 'auth/popup-closed-by-user' ||
            popupErr.code === 'auth/cancelled-popup-request'
          ) {
            throw popupErr;
          }
          await signInWithRedirect(auth, googleProvider);
        }
      }
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setGoogleLoading(false);
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
        backgroundColor: isLight ? '#F8FAFC' : '#0B0F19',
        color: isLight ? '#0F172A' : '#FFFFFF',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 20px calc(28px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto',
        userSelect: 'none'
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
          background: isLight
            ? 'radial-gradient(circle at 45% 45%, rgba(16, 185, 129, 0.18) 0%, rgba(255, 30, 86, 0.1) 40%, rgba(56, 189, 248, 0.08) 65%, transparent 75%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(214, 0, 54, 0.12) 50%, transparent 70%)',
          filter: isLight ? 'blur(55px)' : 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Responsive Container (Fluid on Mobile, Max 420px on Desktop) */}
      <div
        className="signup-content-anim"
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2,
          position: 'relative',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* App Icon & Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <AppIcon size={56} shadow />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: isLight ? '#0F172A' : '#FFFFFF',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
              fontFamily: 'Outfit, var(--font-display, sans-serif)'
            }}
          >
            Create Your Account
          </h1>
          <p style={{ fontSize: '13.5px', color: isLight ? '#475569' : '#CBD5E1', margin: 0, fontWeight: 500 }}>
            Start creating professional QR codes and barcodes today.
          </p>
        </div>

        {/* 1. Continue with Google on Top */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.05)',
            border: isLight ? '1.5px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.14)',
            color: isLight ? '#0F172A' : '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.05)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.1s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {googleLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Sign up with Google</span>
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            OR WITH EMAIL
          </span>
          <div style={{ flex: 1, height: '1px', background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)' }} />
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '11px 14px',
              color: '#EF4444',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isLight ? '#475569' : '#CBD5E1', marginBottom: '5px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={17} style={{ position: 'absolute', left: '14px', color: isLight ? '#94A3B8' : '#64748B' }} />
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px 0 42px',
                  borderRadius: '14px',
                  border: isLight ? '1.5px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: isLight ? '0 2px 6px rgba(0, 0, 0, 0.02)' : 'none'
                }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isLight ? '#475569' : '#CBD5E1', marginBottom: '5px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={17} style={{ position: 'absolute', left: '14px', color: isLight ? '#94A3B8' : '#64748B' }} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px 0 42px',
                  borderRadius: '14px',
                  border: isLight ? '1.5px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: isLight ? '0 2px 6px rgba(0, 0, 0, 0.02)' : 'none'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isLight ? '#475569' : '#CBD5E1', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={17} style={{ position: 'absolute', left: '14px', color: isLight ? '#94A3B8' : '#64748B' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min 8 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 40px 0 42px',
                  borderRadius: '14px',
                  border: isLight ? '1.5px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: isLight ? '0 2px 6px rgba(0, 0, 0, 0.02)' : 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: isLight ? '#94A3B8' : '#64748B',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Real-time Password Strength Criteria Checklist */}
            {password.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  marginTop: '6px'
                }}
              >
                {/* 8+ Chars */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    padding: '3px 2px',
                    borderRadius: '6px',
                    background: hasMinLength
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    color: hasMinLength ? '#10B981' : isLight ? '#94A3B8' : '#64748B',
                    fontSize: '9.5px',
                    fontWeight: 700
                  }}
                >
                  <Check size={10} strokeWidth={hasMinLength ? 3 : 1.5} />
                  <span>8+ Chars</span>
                </div>

                {/* Uppercase */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    padding: '3px 2px',
                    borderRadius: '6px',
                    background: hasUppercase
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    color: hasUppercase ? '#10B981' : isLight ? '#94A3B8' : '#64748B',
                    fontSize: '9.5px',
                    fontWeight: 700
                  }}
                >
                  <Check size={10} strokeWidth={hasUppercase ? 3 : 1.5} />
                  <span>Uppercase</span>
                </div>

                {/* Number */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    padding: '3px 2px',
                    borderRadius: '6px',
                    background: hasNumber
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    color: hasNumber ? '#10B981' : isLight ? '#94A3B8' : '#64748B',
                    fontSize: '9.5px',
                    fontWeight: 700
                  }}
                >
                  <Check size={10} strokeWidth={hasNumber ? 3 : 1.5} />
                  <span>Number</span>
                </div>

                {/* Symbol */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    padding: '3px 2px',
                    borderRadius: '6px',
                    background: hasSpecial
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    color: hasSpecial ? '#10B981' : isLight ? '#94A3B8' : '#64748B',
                    fontSize: '9.5px',
                    fontWeight: 700
                  }}
                >
                  <Check size={10} strokeWidth={hasSpecial ? 3 : 1.5} />
                  <span>Symbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: isLight ? '#475569' : '#CBD5E1', marginBottom: '5px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={17} style={{ position: 'absolute', left: '14px', color: isLight ? '#94A3B8' : '#64748B' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 40px 0 42px',
                  borderRadius: '14px',
                  border: isLight ? '1.5px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: isLight ? '0 2px 6px rgba(0, 0, 0, 0.02)' : 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: isLight ? '#94A3B8' : '#64748B',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF1E56 0%, #D8042B 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '14.5px',
              fontWeight: 800,
              cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(255, 30, 86, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: '6px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={17} strokeWidth={2.4} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13.5px', color: isLight ? '#64748B' : '#CBD5E1' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate?.('login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF1E56',
              fontWeight: 800,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Sign In
          </button>
        </div>
      </div>

      <style>{`
        .signup-content-anim {
          animation: contentSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes contentSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
