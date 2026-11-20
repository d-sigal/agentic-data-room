'use client';

import { APP_NAME } from '@/config';
import { useState, useEffect, useCallback } from 'react';
import { GROUPS } from '@/lib/groups';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAuditAction(entry) {
  switch (entry.action) {
    case 'seeded':        return 'Account seeded';
    case 'invited':       return `Invited by ${entry.by || 'unknown'}`;
    case 'login':         return 'Signed in';
    case 'deactivated':   return `Deactivated by ${entry.by || 'unknown'}`;
    case 'reactivated':   return `Reactivated by ${entry.by || 'unknown'}`;
    case 'deleted':       return `Deleted by ${entry.by || 'unknown'}`;
    case 'restored':      return `Restored by ${entry.by || 'unknown'}`;
    case 'group_changed': return `Access changed to ${GROUPS[entry.group] ?? entry.group} by ${entry.by || 'unknown'}`;
    case 'admin_granted': return `Admin granted by ${entry.by || 'unknown'}`;
    case 'admin_revoked': return `Admin revoked by ${entry.by || 'unknown'}`;
    default:              return entry.action;
  }
}

/* ------------------------------------------------------------------ */
/*  Invite form                                                        */
/* ------------------------------------------------------------------ */

function InviteForm({ onInvite }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onInvite(email.trim(), name.trim());
      setEmail('');
      setName('');
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to invite user.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--dr-ink)', color: 'var(--dr-cream)', border: 0,
        borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)',
        fontSize: 12, letterSpacing: '0.08em',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Invite user
      </button>
    );
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 3,
    border: '0.5px solid var(--dr-ink)', background: 'var(--dr-white)',
    fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 18px', background: 'var(--dr-white)', border: '0.5px solid var(--dr-ink)', borderRadius: 3 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Invite new user</span>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Display name (optional)" style={inputStyle} onKeyDown={e => e.key === 'Enter' && submit()} />
      {error && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={loading || !email.trim()} style={{
          padding: '8px 14px', background: loading || !email.trim() ? 'var(--dr-bone)' : 'var(--dr-ink)',
          color: loading || !email.trim() ? 'var(--dr-ink-mid)' : 'var(--dr-cream)',
          border: 0, borderRadius: 3, cursor: loading || !email.trim() ? 'default' : 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em',
        }}>
          {loading ? 'Sending…' : 'Send invite'}
        </button>
        <button onClick={() => { setOpen(false); setEmail(''); setName(''); setError(''); }} style={{
          padding: '8px 14px', background: 'transparent', border: '0.5px solid var(--dr-ink)',
          borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
          letterSpacing: '0.08em', color: 'var(--dr-ink)',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Audit drawer                                                       */
/* ------------------------------------------------------------------ */

function AuditDrawer({ person, onClose }) {
  if (!person) return null;

  const sorted = [...(person.audit || [])].sort((a, b) => (b.at || 0) - (a.at || 0));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex',
      justifyContent: 'flex-end', background: 'rgba(48,44,46,0.3)',
    }} onClick={onClose}>
      <div style={{
        width: 360, height: '100%', background: 'var(--dr-cream)',
        borderLeft: '0.5px solid var(--dr-ink)', padding: '24px 20px',
        overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Audit log</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--dr-ink)', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--dr-ink)' }}>{person.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', marginTop: 2 }}>{person.email}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sorted.length === 0 && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink-mid)' }}>No audit entries.</span>
          )}
          {sorted.map((entry, i) => (
            <div key={i} style={{
              padding: '10px 0',
              borderBottom: i < sorted.length - 1 ? '0.5px solid var(--dr-bone)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink)' }}>{formatAuditAction(entry)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>{formatDateTime(entry.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User row                                                           */
/* ------------------------------------------------------------------ */

function UserRow({ person, currentEmail, isAdmin, onDeactivate, onReactivate, onSetGroup, onSetAdmin, onDelete, onViewAudit }) {
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const isSelf = person.email === currentEmail;

  const handleToggleActive = async () => {
    setLoadingActive(true);
    try {
      if (person.active) await onDeactivate(person.email);
      else await onReactivate(person.email);
    } finally {
      setLoadingActive(false);
    }
  };

  const handleSetGroup = async (newGroup) => {
    setLoadingGroup(true);
    try {
      await onSetGroup(person.email, newGroup);
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleToggleAdmin = async () => {
    setLoadingAdmin(true);
    try {
      await onSetAdmin(person.email, !person.admin);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      await onDelete(person.email);
    } finally {
      setLoadingDelete(false);
    }
  };

  const pillStyle = (active, activeColor, inactiveColor) => ({
    padding: '3px 8px', borderRadius: 999, fontFamily: 'var(--font-mono)',
    fontSize: 10, letterSpacing: '0.08em',
    background: active ? `${activeColor}14` : `${inactiveColor}14`,
    color: active ? activeColor : inactiveColor,
    border: `0.5px solid ${active ? `${activeColor}33` : `${inactiveColor}33`}`,
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 100px 100px 140px 100px 160px',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '0.5px solid var(--dr-bone)',
      gap: 12,
    }}>
      {/* Name + email */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', lineHeight: 1.3 }}>
          {person.name}
          {isSelf && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dr-ink-mid)', marginLeft: 6, letterSpacing: '0.04em' }}>(you)</span>}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.email}</span>
      </div>

      {/* Invited date */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
        {formatDate(person.invitedAt)}
      </span>

      {/* Last login */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>
        {formatDate(person.lastLoginAt)}
      </span>

      {/* Group */}
      <div>
        {isAdmin ? (
          <select
            value={person.group}
            onChange={e => handleSetGroup(e.target.value)}
            disabled={loadingGroup}
            style={{
              width: '100%', height: 26, padding: '0 6px',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
              color: person.group === 'full' ? '#2563eb' : '#6b7280',
              background: 'transparent',
              border: `0.5px solid ${person.group === 'full' ? '#2563eb55' : 'var(--dr-ink-soft)'}`,
              borderRadius: 999, cursor: loadingGroup ? 'default' : 'pointer',
              opacity: loadingGroup ? 0.5 : 1, outline: 'none',
            }}
          >
            {Object.entries(GROUPS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        ) : (
          <span style={pillStyle(person.group === 'full', '#2563eb', '#6b7280')}>
            {GROUPS[person.group] ?? person.group}
          </span>
        )}
      </div>

      {/* Admin */}
      <div>
        {isAdmin && !isSelf ? (
          <button onClick={handleToggleAdmin} disabled={loadingAdmin} title="Toggle admin" style={{
            ...pillStyle(person.admin, '#7c3aed', '#6b7280'),
            border: `0.5px solid ${person.admin ? '#7c3aed55' : 'var(--dr-ink-soft)'}`,
            cursor: loadingAdmin ? 'default' : 'pointer', opacity: loadingAdmin ? 0.5 : 1,
            background: 'transparent',
          }}>
            {person.admin ? 'Admin' : 'User'}
          </button>
        ) : (
          <span style={pillStyle(person.admin, '#7c3aed', '#6b7280')}>
            {person.admin ? 'Admin' : 'User'}
          </span>
        )}
      </div>

      {/* Status + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={pillStyle(person.active, '#228b22', '#b34747')}>
          {person.active ? 'Active' : 'Inactive'}
        </span>
        {isAdmin && !isSelf && (
          <button onClick={handleToggleActive} disabled={loadingActive} title={person.active ? 'Deactivate' : 'Reactivate'} style={{
            padding: '4px 8px', background: 'transparent',
            border: `0.5px solid ${person.active ? 'var(--dr-ink-soft)' : 'rgba(34,139,34,0.3)'}`,
            borderRadius: 3, cursor: loadingActive ? 'default' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
            color: person.active ? '#b34747' : '#228b22',
            opacity: loadingActive ? 0.5 : 1,
          }}>
            {person.active ? 'Deactivate' : 'Reactivate'}
          </button>
        )}
        {isAdmin && !isSelf && (
          <button onClick={handleDelete} disabled={loadingDelete} title="Delete user" style={{
            padding: '4px 8px', background: 'transparent',
            border: '0.5px solid rgba(179,71,71,0.3)',
            borderRadius: 3, cursor: loadingDelete ? 'default' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
            color: '#b34747',
            opacity: loadingDelete ? 0.5 : 1,
          }}>
            Delete
          </button>
        )}
        <button onClick={() => onViewAudit(person)} title="View audit log" style={{
          padding: '4px 6px', background: 'transparent', border: 0,
          cursor: 'pointer', color: 'var(--dr-ink-mid)', display: 'flex', alignItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function UserManagement({ user }) {
  const [people, setPeople] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditPerson, setAuditPerson] = useState(null);
  const [deletedOpen, setDeletedOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load users.');
      }
      const data = await res.json();
      setPeople(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeletedUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users/deleted');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load deleted users.');
      }
      const data = await res.json();
      setDeletedUsers(data);
    } catch {
      // silently ignore — deleted section is supplementary
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (deletedOpen) fetchDeletedUsers(); }, [deletedOpen, fetchDeletedUsers]);

  const invite = async (email, name) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to invite user.');
    setPeople(prev => [...prev, data].sort((a, b) => a.email.localeCompare(b.email)));
  };

  const deactivate = async (email) => {
    const res = await fetch('/api/admin/users/deactivate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to deactivate user.');
    setPeople(prev => prev.map(p => p.email === email ? data : p));
  };

  const reactivate = async (email) => {
    const res = await fetch('/api/admin/users/reactivate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reactivate user.');
    setPeople(prev => prev.map(p => p.email === email ? data : p));
  };

  const setGroup = async (email, group) => {
    const res = await fetch('/api/admin/users/group', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, group }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change group.');
    setPeople(prev => prev.map(p => p.email === email ? data : p));
  };

  const setAdmin = async (email, admin) => {
    const res = await fetch('/api/admin/users/set-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, admin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change admin status.');
    setPeople(prev => prev.map(p => p.email === email ? data : p));
  };

  const deleteUser = async (email) => {
    const res = await fetch('/api/admin/users/delete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
    setPeople(prev => prev.filter(p => p.email !== email));
    // Refresh deleted users list
    fetchDeletedUsers();
  };

  const restoreUser = async (email) => {
    const res = await fetch('/api/admin/users/restore', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to restore user.');
    setDeletedUsers(prev => prev.filter(p => p.email !== email));
    fetchUsers();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 48px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Loading…</span>
      </div>
    );
  }

  const headerStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
    color: 'var(--dr-ink-mid)', textTransform: 'uppercase', padding: '8px 0',
    borderBottom: '1px solid var(--dr-ink)',
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 48px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>User management</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.5, color: 'var(--dr-ink)', margin: 0 }}>
          {people.length} {people.length === 1 ? 'user' : 'users'} with access to {APP_NAME}.
        </p>
      </div>

      {user?.isAdmin && <InviteForm onInvite={invite} />}

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(179,71,71,0.06)', border: '0.5px solid rgba(179,71,71,0.2)', borderRadius: 3, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b34747' }}>
          {error}
        </div>
      )}

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px 100px 160px', gap: 12 }}>
          <span style={headerStyle}>User</span>
          <span style={headerStyle}>Invited</span>
          <span style={headerStyle}>Last login</span>
          <span style={headerStyle}>Access</span>
          <span style={headerStyle}>Role</span>
          <span style={headerStyle}>Status</span>
        </div>
        {people.sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          return a.email.localeCompare(b.email);
        }).map(p => (
          <UserRow
            key={p.email}
            person={p}
            currentEmail={user?.email}
            isAdmin={user?.isAdmin}
            onDeactivate={deactivate}
            onReactivate={reactivate}
            onSetGroup={setGroup}
            onSetAdmin={setAdmin}
            onDelete={deleteUser}
            onViewAudit={setAuditPerson}
          />
        ))}
      </div>

      {/* Deleted users section */}
      {user?.isAdmin && (
        <div style={{ marginTop: 8, border: '0.5px solid var(--dr-ink-soft)', borderRadius: 3, overflow: 'hidden' }}>
          <button
            onClick={() => setDeletedOpen(!deletedOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'transparent', border: 0,
              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase',
            }}
          >
            <span>Deleted users ({deletedUsers.length})</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: deletedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {deletedOpen && (
            <div style={{ borderTop: '0.5px solid var(--dr-bone)', padding: '0 16px 16px' }}>
              {deletedUsers.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink-mid)', margin: '12px 0 0' }}>No deleted users.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase', textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid var(--dr-bone)' }}>User</th>
                      <th style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase', textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid var(--dr-bone)' }}>Deleted</th>
                      <th style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase', textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid var(--dr-bone)' }}>Deleted by</th>
                      <th style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase', textAlign: 'right', padding: '6px 8px', borderBottom: '0.5px solid var(--dr-bone)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedUsers.map(p => (
                      <tr key={p.email} style={{ borderBottom: '0.5px solid var(--dr-bone)' }}>
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink)', lineHeight: 1.3 }}>{p.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>{p.email}</div>
                        </td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>{formatDate(p.deletedAt)}</td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)', letterSpacing: '0.04em' }}>{p.deletedBy || '—'}</td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            onClick={async () => {
                              try { await restoreUser(p.email); } catch (err) { setError(err.message); }
                            }}
                            style={{
                              padding: '4px 10px', background: 'transparent',
                              border: '0.5px solid rgba(34,139,34,0.3)', borderRadius: 3,
                              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10,
                              letterSpacing: '0.06em', color: '#228b22',
                            }}
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      <AuditDrawer person={auditPerson} onClose={() => setAuditPerson(null)} />
    </div>
  );
}
