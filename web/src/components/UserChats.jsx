'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnswerBlock } from './ChatComponents';

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatWhen(ts) {
  if (!ts || typeof ts !== 'number') return '—';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const headerStyle = {
  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
  color: 'var(--dr-ink-mid)', textTransform: 'uppercase', padding: '8px 0',
  borderBottom: '1px solid var(--dr-ink)',
};

const backButtonStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
  background: 'transparent', border: '0.5px solid var(--dr-ink-soft)',
  borderRadius: 3, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
  color: 'var(--dr-ink-mid)',
};

/* ------------------------------------------------------------------ */
/*  Message (read-only)                                                */
/* ------------------------------------------------------------------ */
function ReadOnlyMessage({ msg, onOpenSource, isMobile }) {
  const labels = msg.sources
    ? Object.fromEntries(msg.sources.map((s, i) => [i + 1, s.title]))
    : undefined;

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%', background: 'var(--dr-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: isMobile ? 11 : 12, color: 'var(--dr-ink)', flexShrink: 0 }}>
          {msg.initials || 'U'}
        </div>
        <div style={{ padding: isMobile ? '12px 14px' : '14px 18px', background: 'var(--dr-cream-soft)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, fontFamily: 'var(--font-sans)', fontSize: isMobile ? 15 : 16, color: 'var(--dr-ink)', lineHeight: 1.5 }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 3, background: 'var(--dr-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-cream)', letterSpacing: '0.08em', flexShrink: 0 }}>G</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        {(msg.blocks || []).map((b, i) => (
          <AnswerBlock
            key={i}
            block={b}
            onOpen={n => { const slug = msg.indexToSlug?.[n]; if (slug) onOpenSource?.(slug); }}
            labels={labels}
            isMobile={isMobile}
          />
        ))}
        {msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, borderTop: '0.5px solid var(--dr-bone)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Sources</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {msg.sources.map((s, i) => (
                <button key={s.slug} onClick={() => onOpenSource?.(s.slug)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--dr-white)', border: '0.5px solid var(--dr-bone)', borderRadius: 3, cursor: 'pointer', textAlign: 'left' }}
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

/* ------------------------------------------------------------------ */
/*  Users list                                                         */
/* ------------------------------------------------------------------ */
function UsersList({ users, onPickUser }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px', gap: 12 }}>
        <span style={headerStyle}>User</span>
        <span style={{ ...headerStyle, textAlign: 'right' }}>Threads</span>
        <span style={headerStyle}>Last activity</span>
      </div>
      {users.map(u => (
        <button
          key={u.email}
          onClick={() => onPickUser(u)}
          disabled={u.threadCount === 0}
          style={{
            width: '100%', display: 'grid', gridTemplateColumns: '1fr 120px 160px',
            gap: 12, alignItems: 'center', padding: '14px 0', textAlign: 'left',
            background: 'transparent', border: 0,
            borderBottom: '0.5px solid var(--dr-bone)',
            cursor: u.threadCount === 0 ? 'default' : 'pointer',
            opacity: u.threadCount === 0 ? 0.55 : 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', lineHeight: 1.3 }}>
              {u.name}
              {!u.active && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dr-ink-mid)', marginLeft: 6, letterSpacing: '0.04em' }}>(inactive)</span>
              )}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.email}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dr-ink)', letterSpacing: '0.04em', textAlign: 'right' }}>
            {u.threadCount}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
            {u.lastActivity ? formatDateTime(u.lastActivity) : '—'}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Threads list for a user                                            */
/* ------------------------------------------------------------------ */
function ThreadsList({ threads, onPickThread }) {
  if (threads.length === 0) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink-mid)', margin: 0 }}>
        No threads yet.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {threads.map(t => (
        <button
          key={t.id}
          onClick={() => onPickThread(t)}
          style={{
            display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 0',
            borderBottom: '0.5px solid var(--dr-bone)',
            background: 'transparent', border: 0, borderBottomWidth: '0.5px',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', lineHeight: 1.3 }}>
            {t.title}
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
              {formatWhen(t.when)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
              {(t.messages?.length ?? 0)} {t.messages?.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Thread detail (read-only)                                          */
/* ------------------------------------------------------------------ */
function ThreadDetail({ thread, onOpenSource, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>
          {formatDateTime(thread.when)} · Read-only
        </span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 24 : 32, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>
          {thread.title}
        </h2>
      </div>
      {(thread.messages || []).map((m, i) => (
        <ReadOnlyMessage key={i} msg={m} onOpenSource={onOpenSource} isMobile={isMobile} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function UserChats({ onOpenSource, isMobile }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState('');

  const [selectedThread, setSelectedThread] = useState(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/chats');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load users.');
      }
      const data = await res.json();
      data.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      setUsers(data);
      setUsersError('');
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUser = async (user) => {
    setSelectedUser(user);
    setSelectedThread(null);
    setThreadsLoading(true);
    setThreadsError('');
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(user.email)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load threads.');
      }
      const data = await res.json();
      setThreads(Array.isArray(data.threads) ? data.threads : []);
    } catch (err) {
      setThreadsError(err.message);
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  };

  /* ----- Render: thread detail ----- */
  if (selectedUser && selectedThread) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '24px 16px 24px' : '32px 48px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button onClick={() => setSelectedThread(null)} style={backButtonStyle}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to {selectedUser.name}'s threads
        </button>
        <ThreadDetail thread={selectedThread} onOpenSource={onOpenSource} isMobile={isMobile} />
      </div>
    );
  }

  /* ----- Render: threads list for a user ----- */
  if (selectedUser) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 48px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <button onClick={() => { setSelectedUser(null); setThreads([]); }} style={backButtonStyle}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          All users
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>
            {selectedUser.name}
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
            {selectedUser.email}
          </span>
        </div>

        {threadsLoading && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Loading…</span>
        )}
        {threadsError && (
          <div style={{ padding: '12px 16px', background: 'rgba(179,71,71,0.06)', border: '0.5px solid rgba(179,71,71,0.2)', borderRadius: 3, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>
            {threadsError}
          </div>
        )}
        {!threadsLoading && !threadsError && (
          <ThreadsList threads={threads} onPickThread={setSelectedThread} />
        )}
      </div>
    );
  }

  /* ----- Render: users list ----- */
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 48px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>
          User chats
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.5, color: 'var(--dr-ink)', margin: 0 }}>
          Read-only view of every user's chat history.
        </p>
      </div>

      {usersLoading && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Loading…</span>
      )}
      {usersError && (
        <div style={{ padding: '12px 16px', background: 'rgba(179,71,71,0.06)', border: '0.5px solid rgba(179,71,71,0.2)', borderRadius: 3, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>
          {usersError}
        </div>
      )}
      {!usersLoading && !usersError && (
        <UsersList users={users} onPickUser={openUser} />
      )}
    </div>
  );
}
