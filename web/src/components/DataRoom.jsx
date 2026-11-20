'use client';

import { APP_NAME, APP_TAGLINE } from '@/config';
import { useState, useRef, useEffect } from 'react';
import { SUGGESTED_QUESTIONS } from './data';
import { GdrLogo, AnswerBlock } from './ChatComponents';
import slugToAsset from '../../../corpus/_slug_to_asset.json';
import SourceDrawer from './SourceDrawer';
import Library from './Library';
import { useIsMobile } from '@/hooks/useIsMobile';
import UserManagement from './UserManagement';
import UserChats from './UserChats';
import { identifyUser, clearUserIdentity } from '@/lib/identify';

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function SidebarIcon({ name }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'chat') return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (name === 'lib')  return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  if (name === 'users') return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === 'user-chats') return <svg {...props}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><circle cx="9" cy="11" r="0.5" fill="currentColor"/><circle cx="13" cy="11" r="0.5" fill="currentColor"/><circle cx="17" cy="11" r="0.5" fill="currentColor"/></svg>;
  return null;
}

function Sidebar({ activeThread, onPick, onNew, view, setView, threads, user, onLogout, isMobile, onClose }) {
  const content = (
    <aside style={{
      width: isMobile ? 280 : 280,
      height: '100%',
      background: 'var(--dr-cream-soft)',
      borderRight: '0.5px solid var(--dr-ink)',
      display: 'flex',
      flexDirection: 'column',
      ...(isMobile ? { position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 } : {}),
    }}>
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GdrLogo height={20} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', borderLeft: '0.5px solid var(--dr-ink-soft)', paddingLeft: 10, whiteSpace: 'nowrap' }}>{APP_TAGLINE}</span>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--dr-ink)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <button onClick={() => { onNew(); if (isMobile) onClose?.(); }} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--dr-ink)', color: 'var(--dr-cream)', border: 0, borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em' }}>
          <span>New question</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { id: 'chat', label: 'Conversations', icon: 'chat' },
          { id: 'library', label: 'Document library', icon: 'lib' },
          ...(user?.isAdmin ? [
            { id: 'users', label: 'User management', icon: 'users' },
            { id: 'user-chats', label: 'User chats', icon: 'user-chats' },
          ] : []),
        ].map(s => (
          <button key={s.id} onClick={() => { setView(s.id); if (isMobile) onClose?.(); }} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, background: view === s.id ? 'var(--dr-cream)' : 'transparent', border: '0.5px solid', borderColor: view === s.id ? 'var(--dr-ink)' : 'transparent', borderRadius: 3, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)' }}>
            <SidebarIcon name={s.icon} /><span>{s.label}</span>
          </button>
        ))}
      </div>

      {view === 'chat' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ padding: '8px 12px 6px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Recent</div>
          {threads.map(t => (
            <button key={t.id} onClick={() => { onPick(t.id); if (isMobile) onClose?.(); }} style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3, background: activeThread === t.id ? 'var(--dr-cream)' : 'transparent', border: '0.5px solid', borderColor: activeThread === t.id ? 'var(--dr-ink)' : 'transparent', borderRadius: 3, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', lineHeight: 1.3 }}>{t.title}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)' }}>{formatWhen(t.when)}</span>
            </button>
          ))}
        </div>
      )}
      {view !== 'chat' && <div style={{ flex: 1 }} />}

      <div style={{ padding: '14px 16px', borderTop: '0.5px solid var(--dr-bone)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--dr-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--dr-ink)' }}>{(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink)' }}>{user?.name || ''}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</span>
        </div>
        <button onClick={onLogout} title="Sign out" style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, color: 'var(--dr-ink-mid)', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(48,44,46,0.3)', zIndex: 99, animation: 'fadeBg 200ms cubic-bezier(0.2,0,0,1)' }} />
        {content}
      </>
    );
  }

  return content;
}

/* ------------------------------------------------------------------ */
/*  Welcome                                                            */
/* ------------------------------------------------------------------ */
function Welcome({ onAsk, isMobile, group }) {
  const questions = SUGGESTED_QUESTIONS[group] ?? SUGGESTED_QUESTIONS['financial-only'];
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '32px 20px 24px' : '64px 48px 48px', display: 'flex', flexDirection: 'column', gap: isMobile ? 28 : 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 34 : 56, lineHeight: isMobile ? 1.05 : 0.98, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0, textWrap: 'balance' }}>Ask anything about the data room.</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: isMobile ? 16 : 18, lineHeight: 1.5, color: 'var(--dr-ink)', margin: 0, maxWidth: 600 }}>Every answer is grounded in the documents in this room — with the source on every claim.</p>
      </div>
      <Composer big onSubmit={onAsk} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Suggested questions</span>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          {questions.map((s, i) => (
            <button key={i} onClick={() => onAsk(s.q)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 16px' : '16px 18px', background: 'var(--dr-white)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, cursor: 'pointer', textAlign: 'left', transition: 'background 150ms cubic-bezier(0.2,0,0,1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--dr-cream-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--dr-white)'}
            >
              <span style={{ padding: '3px 8px', background: 'var(--dr-cream)', border: '0.5px solid var(--dr-ink)', borderRadius: 999, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink)', flexShrink: 0, whiteSpace: 'nowrap' }}>{s.tag}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', lineHeight: 1.4 }}>{s.q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composer                                                           */
/* ------------------------------------------------------------------ */
function ScopeChip({ label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--dr-cream)', border: '0.5px solid var(--dr-ink)', borderRadius: 999, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--dr-ink)', whiteSpace: 'nowrap' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>
      {label}
    </span>
  );
}

function Composer({ big, onSubmit, attached, isMobile }) {
  const [val, setVal] = useState('');
  const submit = () => { if (val.trim()) { onSubmit(val); setVal(''); } };
  return (
    <div style={{ border: '0.5px solid var(--dr-ink)', borderRadius: 3, background: 'var(--dr-white)', display: 'flex', flexDirection: 'column', ...(attached ? { position: 'sticky', bottom: 0 } : {}) }}>
      <textarea value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={big ? 'Ask about revenue, pricing, the cap table…' : 'Ask a follow-up'}
        rows={big ? 3 : 2}
        style={{ padding: big ? '20px 20px 0' : '14px 16px 0', border: 0, outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)', fontSize: big ? (isMobile ? 16 : 17) : 15, lineHeight: 1.5, color: 'var(--dr-ink)', background: 'transparent' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: big ? '12px 16px 12px 20px' : '8px 12px 8px 16px', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
          <ScopeChip label="All sources" />
          {!isMobile && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Enter to send · Shift+Enter for new line</span>
          )}
        </div>
        <button onClick={submit} disabled={!val.trim()} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: val.trim() ? 'var(--dr-ink)' : 'var(--dr-bone)', color: val.trim() ? 'var(--dr-cream)' : 'var(--dr-ink-mid)', border: 0, borderRadius: 3, cursor: val.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em' }}>
          <span>Ask</span>
          <svg width="12" height="10" viewBox="0 0 14 12" fill="currentColor"><path d="M 13.406 6.375 L 8.625 11.188 L 8.094 11.719 L 7.031 10.656 L 7.563 10.125 L 11.063 6.594 L 0.75 6.594 L 0 6.594 L 0 5.094 L 0.75 5.094 L 11.063 5.094 L 7.563 1.594 L 7.031 1.063 L 8.094 0 L 8.625 0.531 L 13.406 5.313 L 13.938 5.844 L 13.406 6.375 Z" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Thread view                                                        */
/* ------------------------------------------------------------------ */
function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', width: 12, justifyContent: 'center' }}>
      {[0, 300, 600].map(d => (
        <span key={d} style={{ width: 3, height: 3, background: 'var(--dr-ink)', borderRadius: '50%', animation: `gdrDot 1800ms ease-in-out ${d}ms infinite`, display: 'inline-block' }} />
      ))}
    </span>
  );
}

function ThinkingMessage() {
  const steps = ['Searching documents', 'Reading cited passages', 'Composing answer'];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => Math.min(i + 1, steps.length - 1)), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', animation: 'gdrFadeUp 250ms ease both' }}>
      <div style={{ width: 32, height: 32, borderRadius: 3, background: 'var(--dr-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-cream)', letterSpacing: '0.08em', flexShrink: 0 }}>G</div>
      <div style={{ flex: 1, padding: '14px 18px', background: 'var(--dr-cream-soft)', border: '0.5px solid var(--dr-bone)', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: i <= idx ? 'var(--dr-ink)' : 'var(--dr-ink-soft)', opacity: i <= idx ? 1 : 0.5, transition: 'color 200ms, opacity 200ms' }}>
            {i < idx ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dr-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : i === idx ? <Dots /> : (
              <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: '50%', border: '1px solid var(--dr-bone)' }} />
            )}
            <span>{s}{i === idx ? '…' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Message({ msg, onOpen, onOpenSlug, labels, isMobile }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', animation: 'gdrFadeUp 250ms ease both' }}>
        <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%', background: 'var(--dr-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: isMobile ? 11 : 12, color: 'var(--dr-ink)', flexShrink: 0 }}>{msg.initials || 'U'}</div>
        <div style={{ padding: isMobile ? '12px 14px' : '14px 18px', background: 'var(--dr-cream-soft)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, fontFamily: 'var(--font-sans)', fontSize: isMobile ? 15 : 16, color: 'var(--dr-ink)', lineHeight: 1.5 }}>{msg.text}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 3, background: 'var(--dr-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-cream)', letterSpacing: '0.08em', flexShrink: 0 }}>G</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        {msg.blocks.map((b, i) => (
          <div key={i} style={{ animation: 'gdrFadeUp 350ms ease both' }}>
            <AnswerBlock block={b} onOpen={onOpen} labels={labels} isMobile={isMobile} />
          </div>
        ))}
        {msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, borderTop: '0.5px solid var(--dr-bone)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Sources</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {msg.sources.map((s, i) => (
                <button key={s.slug} onClick={() => onOpenSlug?.(s.slug)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--dr-white)', border: '0.5px solid var(--dr-bone)', borderRadius: 3, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--dr-ink)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--dr-bone)'}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink)', lineHeight: 1.3 }}>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadView({ thread, onOpenSource, onAsk, isLoading, isMobile }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length, isLoading]);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '24px 16px 24px' : '40px 48px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>{formatWhen(thread.when)}</span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 24 : 32, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>{thread.title}</h2>
      </div>
      {thread.messages.map((m, i) => (
        <Message key={i} msg={m}
          onOpen={n => { const slug = m.indexToSlug?.[n]; if (slug) onOpenSource(slug); }}
          onOpenSlug={onOpenSource}
          labels={m.sources ? Object.fromEntries(m.sources.map((s, i) => [i + 1, s.title])) : undefined}
          isMobile={isMobile}
        />
      ))}
      {isLoading && <ThinkingMessage />}
      <div ref={bottomRef} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: isMobile ? 28 : 32, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Composer attached onSubmit={q => onAsk(q, thread.id)} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app                                                           */
/* ------------------------------------------------------------------ */
function formatWhen(ts) {
  if (!ts || typeof ts !== 'number') return 'Just now';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function DataRoom() {
  const isMobile = useIsMobile(768);
  const [view, setView]         = useState('chat');
  const [active, setActive]     = useState(null);
  const [openSrc, setOpenSrc]   = useState(null);
  const [openFile, setOpenFile] = useState(null);
  const [liveThreads, setLiveThreads] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [user, setUser]               = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch current user then load persisted threads
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (r.status === 403) {
          // Deactivated — force logout
          fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
            window.location.href = '/';
          });
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (!data?.email) return;
        setUser({ email: data.email, name: data.name, isAdmin: data.isAdmin === true, group: data.group ?? 'financial-only' });
        identifyUser({ email: data.email, name: data.name, isAdmin: data.isAdmin === true, group: data.group ?? 'financial-only' });
        return fetch('/api/threads')
          .then(r => r.ok ? r.json() : null)
          .then(res => { if (res?.threads?.length) setLiveThreads(res.threads); })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase();

  const logout = async () => {
    clearUserIdentity();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  const thread = liveThreads.find(t => t.id === active);

  const openSource = (slug) => {
    const asset = slugToAsset?.slugs?.[slug] ?? slugToAsset?.legal_docs?.[slug];
    const fileId = asset?.file_id || asset?.drive_id;
    if (!fileId) { console.warn('[citations] slug not found or has no file id:', slug); return; }
    setOpenFile({
      id: fileId,
      name: asset.title,
      kind: asset.mime_type?.includes('spreadsheet') ? 'sheet' : 'doc',
      size: '',
      folderName: '',
    });
  };

  const ask = async (q, threadId = null) => {
    const tid = threadId || `t-${Date.now()}`;
    const userMsg = { role: 'user', text: q, initials };

    // Snapshot current history before any state update.
    const existing = liveThreads.find(t => t.id === tid);
    const history = existing ? [...existing.messages, userMsg] : [userMsg];

    // Update thread list.
    setLiveThreads(prev => {
      const has = prev.find(t => t.id === tid);
      if (has) return prev.map(t => t.id === tid ? { ...t, messages: [...t.messages, userMsg] } : t);
      const title = q.length > 80 ? q.slice(0, 80).replace(/\s+\S*$/, '') + '…' : q;
      return [{ id: tid, title, when: Date.now(), messages: [userMsg] }, ...prev];
    });
    setActive(tid);
    setView('chat');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Build slug ↔ index maps from the sources list.
      const sourceList = data.sources ?? [];
      const slugToIndex = Object.fromEntries(sourceList.map((s, i) => [s.slug, i + 1]));
      const indexToSlug = Object.fromEntries(sourceList.map((s, i) => [i + 1, s.slug]));

      // Replace [doc:slug] with [N] chips; unknown slugs are dropped.
      const rewrite = text =>
        text?.replace(/\[doc:([^\]]+)\]/g, (_, slug) => {
          const n = slugToIndex[slug];
          return n != null ? `[${n}]` : '';
        }).trim() ?? '';

      // Build the blocks array for the renderer.
      const blocks = [];
      if (data.tldr) blocks.push({ type: 'tldr', text: rewrite(data.tldr) });
      for (const b of data.blocks ?? []) {
        if (b.type === 'paragraph') blocks.push({ ...b, text: rewrite(b.text) });
        else blocks.push(b);
      }

      // Serialize to plain text for conversation history.
      const rawText = [data.tldr, ...(data.blocks ?? []).filter(b => b.type === 'paragraph').map(b => b.text)].join('\n\n');

      setLiveThreads(prev => {
        const next = prev.map(t =>
          t.id === tid ? { ...t, messages: [...t.messages, {
            role: 'assistant',
            blocks,
            rawText,
            indexToSlug,
            sources: sourceList,
          }]} : t
        );
        fetch('/api/threads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threads: next }),
        }).catch(() => {});
        return next;
      });
    } catch (err) {
      console.error('chat error', err);
      setLiveThreads(prev => prev.map(t =>
        t.id === tid ? { ...t, messages: [...t.messages, {
          role: 'assistant',
          blocks: [{ type: 'callout', tone: 'note', text: 'Something went wrong — check the browser console.' }],
          rawText: '',
        }]} : t
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', background: 'var(--dr-cream)' }}>
      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 56,
          background: 'var(--dr-cream-soft)', borderBottom: '0.5px solid var(--dr-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 50,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--dr-ink)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GdrLogo height={18} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{APP_NAME}</span>
          </div>
          <div style={{ width: 22 }} />
        </div>
      )}

      {/* Sidebar: desktop = always visible, mobile = overlay */}
      {!isMobile && <Sidebar threads={liveThreads} activeThread={active} onPick={id => { setActive(id); setView('chat'); }} onNew={() => { setActive(null); setView('chat'); }} view={view} setView={setView} user={user} onLogout={logout} isMobile={false} />}
      {isMobile && sidebarOpen && <Sidebar threads={liveThreads} activeThread={active} onPick={id => { setActive(id); setView('chat'); }} onNew={() => { setActive(null); setView('chat'); }} view={view} setView={setView} user={user} onLogout={logout} isMobile={true} onClose={() => setSidebarOpen(false)} />}

      <main style={{ flex: 1, height: '100%', overflow: 'auto', position: 'relative', ...(isMobile ? { paddingTop: 56 } : {}) }}>
        {view === 'chat' && !thread && <Welcome onAsk={ask} isMobile={isMobile} group={user?.group} />}
        {view === 'chat' && thread && <ThreadView thread={thread} onOpenSource={openSource} onAsk={ask} isLoading={isLoading} isMobile={isMobile} />}
        {view === 'library' && <Library onOpenFile={setOpenFile} isMobile={isMobile} />}
        {view === 'users' && <UserManagement user={user} />}
        {view === 'user-chats' && user?.isAdmin && <UserChats onOpenSource={openSource} isMobile={isMobile} />}
      </main>
      <SourceDrawer sourceId={openSrc} file={openFile} onClose={() => { setOpenSrc(null); setOpenFile(null); }} isMobile={isMobile} />
    </div>
  );
}
