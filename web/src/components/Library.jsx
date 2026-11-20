'use client';

import { useState, useEffect } from 'react';
import { DocIcon } from './ChatComponents';

// ── Icons ─────────────────────────────────────────────────────────────────────

function FolderIcon({ size = 22, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" style={{ color: active ? 'var(--dr-cream)' : 'var(--dr-ink)', flexShrink: 0 }}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
    </svg>
  );
}

function ChevronRight({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date)) return '';
  const diffMs = Date.now() - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays} days ago`;
  if (diffDays < 30)  return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Library({ onOpenFile, isMobile }) {
  // breadcrumbs: [{id, name}, …] — empty means we're at the Drive root
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [data, setData]               = useState({ folders: [], files: [] });
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const currentFolder = breadcrumbs[breadcrumbs.length - 1] ?? null;
  const topFolder     = breadcrumbs[0] ?? null;

  // Fetch the contents of the current folder whenever navigation changes.
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (currentFolder) params.set('folderId', currentFolder.id);
    if (topFolder)     params.set('topFolderId', topFolder.id);

    fetch(`/api/library?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [currentFolder?.id]);

  // ── Navigation helpers ─────────────────────────────────────────────────────

  function navigateInto(folder) {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateToBreadcrumb(index) {
    // index === -1 → go to root
    setBreadcrumbs((prev) => (index < 0 ? [] : prev.slice(0, index + 1)));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isRoot = breadcrumbs.length === 0;

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dr-ink-mid)' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 48px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-maroon)' }}>
          Could not load documents. {error.message}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header / Breadcrumbs ─────────────────────────────────────────── */}
      {isRoot ? (
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 28 : 36, lineHeight: 1, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>
          Documents
        </h2>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 28 : 36, lineHeight: 1, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>
            Documents
          </h2>
          {/* Breadcrumb trail */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              style={crumbStyle(false)}
            >
              Home
            </button>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--dr-ink-mid)', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight />
                  </span>
                  <button
                    onClick={() => !isLast && navigateToBreadcrumb(i)}
                    style={crumbStyle(isLast)}
                  >
                    {crumb.name}
                  </button>
                </span>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Folder grid ─────────────────────────────────────────────────── */}
      {data.folders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isRoot ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: isRoot ? 12 : 8 }}>
          {data.folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              large={isRoot}
              onClick={() => navigateInto(folder)}
            />
          ))}
        </div>
      )}

      {/* ── File table ──────────────────────────────────────────────────── */}
      {(data.files.length > 0 || (!isRoot && data.folders.length === 0)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isRoot && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>
              {data.files.length} {data.files.length === 1 ? 'file' : 'files'}
            </span>
          )}
          <div
            className="table-scroll-wrap"
            style={{ background: 'var(--dr-white)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, overflow: 'hidden' }}
          >
            {data.files.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink-mid)' }}>
                This folder is empty.
              </div>
            ) : isMobile ? (
              <MobileFileList files={data.files} onOpenFile={onOpenFile} />
            ) : (
              <DesktopFileTable files={data.files} onOpenFile={onOpenFile} />
            )}
          </div>
        </div>
      )}

      {/* ── Empty state at root ──────────────────────────────────────────── */}
      {isRoot && data.folders.length === 0 && (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink-mid)' }}>
          No folders found.
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FolderCard({ folder, large, onClick }) {
  const [hovered, setHovered] = useState(false);

  if (large) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px',
          background: hovered ? 'var(--dr-ink)' : 'var(--dr-white)',
          color: hovered ? 'var(--dr-cream)' : 'var(--dr-ink)',
          border: '0.5px solid var(--dr-ink)',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          cursor: 'pointer',
          transition: 'background 120ms, color 120ms',
        }}
      >
        <FolderIcon size={22} active={hovered} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 500 }}>{folder.name}</span>
      </div>
    );
  }

  // Smaller card for subfolders
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 14px',
        background: hovered ? 'var(--dr-cream-soft)' : 'var(--dr-white)',
        border: '0.5px solid var(--dr-ink)',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
    >
      <FolderIcon size={16} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--dr-ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {folder.name}
      </span>
    </div>
  );
}

function MobileFileList({ files, onOpenFile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {files.map((f, i) => (
        <div
          key={f.id}
          onClick={() => onOpenFile?.(f)}
          style={{
            padding: '14px 16px',
            borderBottom: i === files.length - 1 ? 0 : '0.5px solid var(--dr-bone)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dr-cream-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <DocIcon kind={f.kind} size={18} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)' }}>
              {timeAgo(f.modifiedTime)}{f.size ? ` · ${f.size}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopFileTable({ files, onOpenFile }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px', padding: '10px 16px', background: 'var(--dr-cream-soft)', borderBottom: '0.5px solid var(--dr-bone)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>
        <span>Name</span>
        <span>Modified</span>
        <span style={{ textAlign: 'right' }}>Size</span>
      </div>
      {files.map((f, i) => (
        <div
          key={f.id}
          onClick={() => onOpenFile?.(f)}
          style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px', padding: '12px 16px', alignItems: 'center', borderBottom: i === files.length - 1 ? 0 : '0.5px solid var(--dr-bone)', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dr-cream-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <DocIcon kind={f.kind} size={18} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.name}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dr-ink-mid)' }}>{timeAgo(f.modifiedTime)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dr-ink-mid)', textAlign: 'right' }}>{f.size}</span>
        </div>
      ))}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function crumbStyle(isActive) {
  return {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: isActive ? 'default' : 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.04em',
    color: isActive ? 'var(--dr-ink)' : 'var(--dr-ink-mid)',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
  };
}
