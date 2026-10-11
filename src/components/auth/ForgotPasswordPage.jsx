import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import AppIcon from '../AppIcon';

function handleAuthError(err) {
  switch (err.code) {
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/user-not-found': return 'No account found with this email address.';
    default: return err.message || 'Unable to send password reset email. Please try again.';
  }
}

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccess(true);
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #0B0F19)',
        color: 'var(--text-primary, #FFFFFF)',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto'
      }}
    >
      {/* Background Ambience */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 30, 52, 0.16) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Container Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card, #141420)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Back Link */}
        <button
          type="button"
          onClick={() => onNavigate?.('login')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #CBD5E1)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <AppIcon size={52} shadow />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--text-primary, #FFFFFF)',
              margin: '0 0 6px',
              letterSpacing: '-0.4px',
              fontFamily: 'Outfit, var(--font-display, sans-serif)'
            }}
          >
            Reset Your Password
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #CBD5E1)', margin: 0, fontWeight: 500 }}>
            Enter your email and we'll send you a password reset link.
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#10B981',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <CheckCircle2 size={20} color="#10B981" flexShrink={0} />
            <span>Password reset email sent. Check your inbox.</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#EF4444',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #CBD5E1)', marginBottom: '6px' }}>
              Account Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted, #64748B)' }} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 14px 0 42px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--bg-input, #0E0E16)',
                  color: 'var(--text-primary, #FFFFFF)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #EF1E34 0%, #B50B20 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '14.5px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(239, 30, 52, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: '4px'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
