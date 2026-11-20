'use client';

import { APP_NAME } from '@/config';
import { useState } from 'react';
import { DocIcon } from './ChatComponents';
import { SRC } from './data';

function FillerLine({ w }) {
  return <div style={{ height: 8, width: w, background: 'var(--dr-bone)', borderRadius: 2 }} />;
}

function titleForSource(s) {
  return s.doc.replace(/\.[a-z]+$/, '');
}

/* ------------------------------------------------------------------ */
/*  Chat-source previews (legacy mock data)                           */
/* ------------------------------------------------------------------ */
function PdfPreview({ source }) {
  const isDeck = source.kind === 'deck';
  return (
    <div style={{ background: 'var(--dr-white)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, padding: '32px 36px', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)', minHeight: 540, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '0.5px solid var(--dr-bone)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{APP_NAME.toUpperCase()} · CONFIDENTIAL</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{typeof source.page === 'number' ? `Page ${source.page}` : source.page}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{isDeck ? 'Section 03 · Traction' : 'Section 02 · Findings'}</span>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--dr-ink)', margin: 0 }}>{titleForSource(source)}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FillerLine w="96%" /><FillerLine w="88%" /><FillerLine w="92%" />
      </div>
      <div style={{ background: 'rgba(255, 146, 73, 0.18)', borderLeft: '3px solid var(--dr-orange)', padding: '14px 16px', borderRadius: 2, fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--dr-ink)' }}>
        {source.excerpt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FillerLine w="94%" /><FillerLine w="82%" /><FillerLine w="70%" /><FillerLine w="60%" />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '0.5px solid var(--dr-bone)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{source.doc}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>{typeof source.page === 'number' ? `${source.page} / 44` : ''}</span>
      </div>
    </div>
  );
}

function SheetPreview({ source }) {
  const ref = String(source.page);
  const sheetName = ref.split('!')[0];
  const cell = ref.split('!')[1] || '';
  const cols = ['', 'A', 'B', 'C', 'D', 'E'];
  const rows = [
    ['1', 'Year',  'Net revenue', 'Gross margin', 'Partners', 'NRR'],
    ['2', '2024A', '$9.1M',       '68%',          '8',        '118%'],
    ['3', '2025A', '$20.4M',      '71%',          '11',       '124%'],
    ['4', '2026E', '$44.8M',      '73%',          '14',       '131%'],
    ['5', '2027E', '$91.0M',      '74%',          '22',       '128%'],
    ['6', '2028E', '$176.0M',     '75%',          '34',       '126%'],
    ['7', '',      '',            '',             '',         ''],
  ];
  const hlCol = cell ? cell.charCodeAt(0) - 64 : -1;
  const hlRow = cell ? parseInt(cell.slice(1), 10) : -1;
  return (
    <div style={{ background: 'var(--dr-white)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, overflow: 'hidden', minHeight: 540, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--dr-ink)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--dr-cream-soft)' }}>
        <DocIcon kind="sheet" size={16} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dr-ink)' }}>{source.doc}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>READ-ONLY</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--dr-bone)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--dr-cream-deep)' }}>
        <span style={{ padding: '4px 8px', background: 'var(--dr-white)', border: '0.5px solid var(--dr-bone)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink)' }}>{cell || 'A1'}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink-mid)' }}>fx</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dr-ink)' }}>=SUM(Plan!E2:E25)*Retention!C8</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            {[cols, ...rows].map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => {
                  const isHdr = ri === 0 || ci === 0;
                  const isHL  = !isHdr && ri === hlRow && ci === hlCol;
                  return (
                    <td key={ci} style={{ padding: '8px 10px', borderRight: '0.5px solid var(--dr-bone)', borderBottom: '0.5px solid var(--dr-bone)', background: isHL ? 'rgba(255,146,73,0.28)' : isHdr ? 'var(--dr-cream-soft)' : 'var(--dr-white)', outline: isHL ? '1.5px solid var(--dr-orange)' : 'none', fontFamily: isHdr ? 'var(--font-mono)' : (ci === 1 ? 'var(--font-sans)' : 'var(--font-mono)'), fontSize: isHdr ? 10 : 12, letterSpacing: isHdr ? '0.08em' : '0.04em', color: isHdr ? 'var(--dr-ink-mid)' : 'var(--dr-ink)', textAlign: ci === 0 ? 'center' : ci > 1 ? 'right' : 'left', width: ci === 0 ? 28 : 'auto' }}>{c}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '6px 12px', borderTop: '0.5px solid var(--dr-ink)', background: 'var(--dr-cream-soft)', display: 'flex', gap: 4 }}>
        {['Summary', sheetName, 'Inputs', 'CAC', 'Runway'].filter((v, i, a) => a.indexOf(v) === i).map((t, i) => (
          <span key={i} style={{ padding: '4px 10px', borderRadius: 2, background: t === sheetName ? 'var(--dr-white)' : 'transparent', border: t === sheetName ? '0.5px solid var(--dr-ink)' : '0.5px solid transparent', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink)' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Library file previews (real Drive files)                          */
/* ------------------------------------------------------------------ */
function FilePdfPreview({ file }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
          background: 'var(--dr-cream-deep)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--dr-ink-soft)" strokeWidth="1.5" strokeLinecap="round"
            style={{ animation: 'spin 900ms linear infinite' }}>
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>
            Loading document…
          </span>
        </div>
      )}
      <iframe
        src={`/api/library/files/${file.id}?action=view`}
        style={{ width: '100%', height: '100%', border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 200ms' }}
        title={file.name}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function FileSheetPreview({ file }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '48px 24px', height: '100%' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--dr-cream-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DocIcon kind="sheet" size={40} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, lineHeight: 1.2, color: 'var(--dr-ink)', margin: 0, textAlign: 'center' }}>{file.name}</h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--dr-ink-mid)', margin: 0, textAlign: 'center' }}>
          Spreadsheet preview is not available.
        </p>
      </div>
    </div>
  );
}

function FileDownloadButton({ file }) {
  const isSheet = file.kind === 'sheet';
  const label = isSheet ? 'Download .xlsx' : 'Download PDF';
  return (
    <a
      href={`/api/library/files/${file.id}?action=download`}
      download
      style={{
        padding: '10px 14px',
        background: 'var(--dr-ink)',
        color: 'var(--dr-cream)',
        border: 0,
        borderRadius: 3,
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.08em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Drawer shell                                                       */
/* ------------------------------------------------------------------ */
function DrawerShell({ header, body, footer, onClose, isMobile }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(48,44,46,0.18)', zIndex: isMobile ? 60 : 10, animation: 'fadeBg 200ms cubic-bezier(0.2,0,0,1)' }} />
      <aside style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 520, background: 'var(--dr-cream)', borderLeft: isMobile ? 'none' : '0.5px solid var(--dr-ink)', zIndex: isMobile ? 61 : 11, display: 'flex', flexDirection: 'column', animation: 'slideIn 250ms cubic-bezier(0.2,0,0,1)' }}>
        <div style={{ padding: isMobile ? '16px 16px' : '20px 24px', borderBottom: '0.5px solid var(--dr-ink)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          {header}
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px' : '20px', background: 'var(--dr-cream-deep)' }}>
          {body}
        </div>
        <div style={{ padding: isMobile ? '12px 16px' : '14px 20px', borderTop: '0.5px solid var(--dr-ink)', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', background: 'var(--dr-cream-soft)', flexWrap: 'wrap' }}>
          {footer}
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */
export default function SourceDrawer({ sourceId, file, onClose, isMobile }) {
  if (!sourceId && !file) return null;

  // Library file drawer
  if (file) {
    const header = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DocIcon kind={file.kind} size={18} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>
            {file.kind === 'sheet' ? 'Spreadsheet' : 'Document'}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 500, color: 'var(--dr-ink)', lineHeight: 1.3 }}>{file.name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)' }}>{file.size}</span>
      </div>
    );

    const body = file.kind === 'sheet'
      ? <FileSheetPreview file={file} />
      : <FilePdfPreview file={file} />;

    const footer = (
      <>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>
          {file.folderName}
        </span>
        <FileDownloadButton file={file} />
      </>
    );

    return <DrawerShell header={header} body={body} footer={footer} onClose={onClose} isMobile={isMobile} />;
  }

  // Chat source drawer (legacy)
  const s = SRC[sourceId];
  if (!s) return null;

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dr-cream-soft)', border: '0.5px solid var(--dr-ink)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dr-ink)' }}>{sourceId}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>Source · {s.kind}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 500, color: 'var(--dr-ink)', lineHeight: 1.3 }}>{s.doc}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--dr-ink-mid)' }}>{typeof s.page === 'number' ? `Page ${s.page}` : s.page}</span>
    </div>
  );

  const body = s.kind === 'sheet' ? <SheetPreview source={s} /> : <PdfPreview source={s} />;

  const footer = (
    <>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Match · cosine 0.91 · 4 passages</span>
      {s.kind === 'sheet' ? (
        <button style={{ padding: '10px 14px', background: 'var(--dr-ink)', color: 'var(--dr-cream)', border: 0, borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download .xlsx
        </button>
      ) : (
        <button style={{ padding: '10px 14px', background: 'var(--dr-ink)', color: 'var(--dr-cream)', border: 0, borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
          Open full document
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
        </button>
      )}
    </>
  );

  return <DrawerShell header={header} body={body} footer={footer} onClose={onClose} isMobile={isMobile} />;
}
