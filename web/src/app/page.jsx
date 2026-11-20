'use client';

import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import DataRoom from '@/components/DataRoom';

export default function Page() {
  const [authed, setAuthed] = useState(undefined); // undefined = checking

  useEffect(() => {
    // Ping /api/auth/me to check session validity.
    // Returns 403 with deactivated:true if the user has been deactivated.
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          setAuthed(true);
        } else if (res.status === 403) {
          // Deactivated — clear session and show login
          fetch('/api/auth/logout', { method: 'POST' }).finally(() => setAuthed(false));
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = () => {
    setAuthed(true);
  };

  // Loading state while checking session
  if (authed === undefined) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dr-cream)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Loading…</span>
      </div>
    );
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', background: 'var(--dr-cream)' }}>
      <DataRoom />
    </div>
  );
}
