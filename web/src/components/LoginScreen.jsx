'use client';

import { APP_NAME } from '@/config';
import { useState } from 'react';
import { GdrLogo } from './ChatComponents';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [stage, setStage]  = useState('email'); // email | code | error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---- Request code ---- */
  const requestCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setStage('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Verify code ---- */
  const verifyCode = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code.');
        return;
      }
      onLogin();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    height: 50, padding: '0 14px', borderRadius: 3,
    border: '0.5px solid var(--dr-ink)', background: 'var(--dr-white)',
    fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--dr-ink)', outline: 'none',
  };

  const buttonStyle = (disabled) => ({
    width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: disabled ? 'var(--dr-bone)' : 'var(--dr-ink)',
    color: disabled ? 'var(--dr-ink-mid)' : 'var(--dr-cream)',
    border: 0, borderRadius: 3, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em',
    opacity: loading ? 0.7 : 1,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dr-cream)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
        <GdrLogo height={22} />
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>Welcome to {APP_NAME}</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.5, color: 'var(--dr-ink-mid)', margin: 0 }}>
            {stage === 'email' ? 'Sign in to continue.' : 'We sent a 6-digit code to your email.'}
          </p>
        </div>

        {stage === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && requestCode()}
              placeholder="you@company.com"
              disabled={loading}
              style={inputStyle}
            />
            {error && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>{error}</p>}
            <button onClick={requestCode} disabled={loading || !email.trim()} style={buttonStyle(loading || !email.trim())}>
              {loading ? 'Sending…' : 'Continue'}
            </button>
          </div>
        )}

        {stage === 'code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}
              onPasteCapture={e => {
                e.preventDefault();
                const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                if (!pasted) return;
                setCode(pasted);
                setTimeout(() => {
                  const inputs = e.currentTarget.querySelectorAll('input');
                  const focusIdx = Math.min(pasted.length, 5);
                  if (inputs[focusIdx]) inputs[focusIdx].focus();
                }, 0);
              }}
            >
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input key={i} maxLength={1}
                  value={code[i] || ''}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    const next = (code.slice(0, i) + v + code.slice(i + 1)).slice(0, 6);
                    setCode(next);
                    if (v && e.target.nextSibling) e.target.nextSibling.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !code[i] && e.target.previousSibling) {
                      e.target.previousSibling.focus();
                    }
                  }}
                  disabled={loading}
                  style={{ width: 48, height: 56, textAlign: 'center', border: '0.5px solid var(--dr-ink)', borderRadius: 3, background: 'var(--dr-white)', fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.04em', color: 'var(--dr-ink)', outline: 'none' }}
                />
              ))}
            </div>
            {error && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>{error}</p>}
            <button onClick={verifyCode} disabled={loading || code.length !== 6} style={buttonStyle(loading || code.length !== 6)}>
              {loading ? 'Verifying…' : 'Continue'}
            </button>
            <button onClick={() => { setStage('email'); setCode(''); setError(''); }} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)', textAlign: 'center' }}>
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
