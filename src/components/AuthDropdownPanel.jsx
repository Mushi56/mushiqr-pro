import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, X } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import AppIcon from './AppIcon';
function handleAuthError(err) {
  switch (err.code) {
    case 'auth/invalid-email': return 'Invalid email address format.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'An account already exists with this email.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.';
    default: return err.message || 'An unexpected error occurred.';
  }
}

export default function AuthDropdownPanel({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (isSignUp && !displayName) { setError('Please enter your name.'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        setMessage('Account created! Welcome 🎉');
        setTimeout(onClose, 1200);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Signed in successfully!');
        setTimeout(onClose, 900);
      }
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await FirebaseAuthentication.signInWithGoogle({
            useCredentialManager: false,
          });
          if (result.credential?.idToken) {
            const credential = GoogleAuthProvider.credential(result.credential.idToken);
            await signInWithCredential(auth, credential);
            setTimeout(onClose, 1000);
          } else {
            throw new Error('No idToken received from native Google Sign-In');
          }
        } catch (nativeErr) {
          console.error('Native Google Sign-In failed [Dropdown]:', nativeErr);
          const errorMsg = `Native Auth Error: ${nativeErr.message || 'Unknown'} (Code: ${nativeErr.code || 'None'})`;
          setError(errorMsg);
          throw nativeErr;
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
          setTimeout(onClose, 1000);
        } catch (popupErr) {
          if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
            throw popupErr;
          }
          console.warn('Popup login failed, attempting redirect fallback:', popupErr);
          await signInWithRedirect(auth, googleProvider);
        }
      }
    } catch (err) {
      console.error('Outer Auth Error [Dropdown]:', err);
      if (err.message && err.message.includes('10')) {
        setError(`Dev Error 10: ${err.message}. Check SHA-1/ClientId.`);
      } else {
        setError(handleAuthError(err) + (err.message ? ` [Diag: ${err.message}]` : ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) { setError('Enter your email first to reset your password.'); return; }
    setError(''); setMessage(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: '24px' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '-16px', right: '-16px',
          background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)',
          width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s'
        }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <AppIcon size={56} shadow />
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isSignUp ? 'Sign up to sync your QR codes' : 'Sign in to access your saved codes'}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#EF4444', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          ⚠️ {error}
        </div>
      )}
      {message && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#10B981', fontSize: '13px', marginBottom: '16px' }}>
          ✓ {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isSignUp && (
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Full Name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        </div>

        {!isSignUp && (
          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <button type="button" onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Forgot password?
            </button>
          </div>
        )}


        <button type="submit" disabled={loading} style={{
          width: '100%', height: '48px', borderRadius: '12px',
          background: 'var(--accent-gradient)', border: 'none', color: '#fff',
          fontWeight: 700, fontSize: '15px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 14px rgba(214,0,54,0.25)',
          opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          fontFamily: 'inherit'
        }}>
          {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
      </div>

      {/* Google */}
      <button onClick={handleGoogle} disabled={loading} style={{
        width: '100%', height: '48px', borderRadius: '12px',
        border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        transition: 'all 0.2s', fontFamily: 'inherit'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.77-2.4 3.61v3h3.86c2.26-2.09 3.59-5.17 3.59-8.46z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.81-2.13-6.76-5.01H1.31v3.1A12 12 0 0 0 12 24z"/>
          <path fill="#FBBC05" d="M5.24 14.24a7.19 7.19 0 0 1 0-4.48V6.66H1.31a12 12 0 0 0 0 10.68l3.93-3.1z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.31 6.66l3.93 3.1c.95-2.88 3.61-5.01 6.76-5.01z"/>
        </svg>
        Continue with Google
      </button>

      {/* Toggle */}
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{isSignUp ? 'Already have an account? ' : "Don't have an account? "}</span>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: '13px' }}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
