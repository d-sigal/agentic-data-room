'use client';

import { APP_NAME } from '@/config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */
export function GdrLogo({ height = 22 }) {
  return <span style={{ fontFamily: 'var(--font-serif)', fontSize: height, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--dr-ink)' }}>{APP_NAME}</span>;
}

/* ------------------------------------------------------------------ */
/*  Citation chip — [n]                                               */
/* ------------------------------------------------------------------ */
export function Cite({ ids = [], onOpen, labels }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 4, verticalAlign: 'middle' }}>
      {ids.map(id => (
        <span key={id} className="cite-wrap" data-tooltip={labels?.[id] ?? undefined}>
          <button
            onClick={() => onOpen?.(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 20, height: 18, padding: '0 5px',
              background: 'var(--dr-cream-soft)',
              border: '0.5px solid var(--dr-ink)', borderRadius: 3,
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
              color: 'var(--dr-ink)', cursor: 'pointer', lineHeight: 1,
              verticalAlign: 'middle',
              transition: 'background 150ms cubic-bezier(0.2,0,0,1)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--dr-orange)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--dr-cream-soft)'}
          >{id}</button>
        </span>
      ))}
    </span>
  );
}

/* Replaces [n] tokens with <Cite> chips inline */
export function CiteText({ text, onOpen, labels }) {
  const parts = [];
  const re = /\[(\d+(?:,\s*\d+)*)\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const ids = m[1].split(',').map(s => parseInt(s.trim(), 10));
    parts.push(<Cite key={m.index} ids={ids} onOpen={onOpen} labels={labels} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/*  TLDR                                                               */
/* ------------------------------------------------------------------ */
export function TLDR({ text, sources, onOpen, labels, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', padding: '4px 0' }}>
      <div style={{ width: 3, background: 'var(--dr-orange)', borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', marginBottom: 6, textTransform: 'uppercase' }}>Short answer</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 20 : 24, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--dr-ink)', textWrap: 'pretty' }}>
          {text}{sources && <Cite ids={sources} onOpen={onOpen} labels={labels} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI grid                                                           */
/* ------------------------------------------------------------------ */
export function KPIGrid({ items, isMobile }) {
  const cols = isMobile ? Math.min(items.length, 2) : Math.min(items.length, 4);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
      border: '0.5px solid var(--dr-ink)', borderRadius: 3,
      background: 'var(--dr-white)', overflow: 'hidden',
    }}>
      {items.map((it, i) => {
        const isLastInRow = (i + 1) % cols === 0 || i === items.length - 1;
        const isLastRow = i >= items.length - (items.length % cols || cols);
        return (
          <div key={i} style={{
            padding: isMobile ? '14px' : '18px',
            borderRight: !isLastInRow ? '0.5px solid var(--dr-ink)' : 'none',
            borderBottom: !isLastRow ? '0.5px solid var(--dr-ink)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase' }}>{it.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 22 : 28, lineHeight: 1, color: 'var(--dr-ink)' }}>{it.value}</div>
            {it.delta && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: it.delta.startsWith('−') || it.delta.startsWith('-') ? 'var(--dr-maroon)' : 'var(--dr-olive)' }}>{it.delta}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar chart                                                          */
/* ------------------------------------------------------------------ */
export function BarChart({ title, data, sources, onOpen, labels }) {
  const max = Math.max(...data.map(d => d.y));
  const W = 640, H = 220, pad = { l: 36, r: 16, t: 16, b: 32 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const bw = innerW / data.length * 0.62, step = innerW / data.length;
  return (
    <ChartFrame title={title} sources={sources} onOpen={onOpen} labels={labels}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--dr-bone)" strokeWidth="0.5" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--dr-ink-mid)" letterSpacing="0.04em">
                {(max * t).toFixed(t === 0 ? 0 : 1)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = innerH * (d.y / max);
          const x = pad.l + step * i + (step - bw) / 2;
          const y = pad.t + innerH - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} fill="var(--dr-ink)" />
              <text x={x + bw / 2} y={H - pad.b + 18} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--dr-ink)" letterSpacing="0.04em">{d.x}</text>
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--dr-ink)" letterSpacing="0.04em">{d.y}</text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ */
/*  Line chart                                                         */
/* ------------------------------------------------------------------ */
export function LineChart({ title, series, sources, onOpen, labels }) {
  const W = 640, H = 240, pad = { l: 36, r: 110, t: 16, b: 32 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const xs = series[0].points.map(p => p.x);
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const max = Math.max(...allY) * 1.15;
  const colorMap = { olive: 'var(--dr-olive)', orange: 'var(--dr-orange)', 'ink-soft': 'var(--dr-ink-soft)', teal: 'var(--dr-teal)' };
  const xScale = i => pad.l + (innerW * i) / (xs.length - 1);
  const yScale = v => pad.t + innerH - (innerH * v) / max;
  return (
    <ChartFrame title={title} sources={sources} onOpen={onOpen} labels={labels}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--dr-bone)" strokeWidth="0.5" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--dr-ink-mid)" letterSpacing="0.04em">{Math.round(max * t)}%</text>
            </g>
          );
        })}
        {xs.map((label, i) => (
          <text key={i} x={xScale(i)} y={H - pad.b + 18} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--dr-ink)" letterSpacing="0.04em">{label}</text>
        ))}
        {series.map((s, si) => {
          const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.y)}`).join(' ');
          const c = colorMap[s.color] || 'var(--dr-ink)';
          return (
            <g key={si}>
              <path d={d} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.color === 'ink-soft' ? '4 4' : 'none'} />
              {s.points.map((p, i) => <circle key={i} cx={xScale(i)} cy={yScale(p.y)} r="4" fill={c} />)}
              <text x={W - pad.r + 8} y={yScale(s.points[s.points.length - 1].y) + 4} fontFamily="var(--font-mono)" fontSize="11" fill={c} letterSpacing="0.04em">{s.name}</text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

function ChartFrame({ title, sources, onOpen, labels, children }) {
  return (
    <div style={{ border: '0.5px solid var(--dr-ink)', borderRadius: 3, background: 'var(--dr-white)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', color: 'var(--dr-ink)' }}>{title}</span>
        {sources && <Cite ids={sources} onOpen={onOpen} labels={labels} />}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table                                                              */
/* ------------------------------------------------------------------ */
export function DataTable({ columns, rows, sources, onOpen, labels, isMobile }) {
  return (
    <div style={{ border: '0.5px solid var(--dr-ink)', borderRadius: 3, background: 'var(--dr-white)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 420 : 'auto' }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: isMobile ? '10px 12px' : '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)', textTransform: 'uppercase', borderBottom: '0.5px solid var(--dr-ink)', fontWeight: 400, background: 'var(--dr-cream-soft)', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci} style={{ textAlign: ci === 0 ? 'left' : 'right', padding: isMobile ? '10px 12px' : '14px 16px', fontFamily: ci === 0 ? 'var(--font-sans)' : 'var(--font-mono)', fontSize: ci === 0 ? 15 : 14, letterSpacing: ci === 0 ? 0 : '0.04em', color: 'var(--dr-ink)', borderBottom: ri < rows.length - 1 ? '0.5px solid var(--dr-bone)' : 'none', whiteSpace: 'nowrap' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {sources && (
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid var(--dr-ink)', background: 'var(--dr-cream-soft)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--dr-ink-mid)' }}>Source</span>
          <Cite ids={sources} onOpen={onOpen} labels={labels} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Callout                                                            */
/* ------------------------------------------------------------------ */
export function Callout({ tone = 'note', text, sources, onOpen, labels }) {
  const bg = tone === 'olive' ? 'rgba(108, 128, 75, 0.08)' : 'var(--dr-cream-soft)';
  const accent = tone === 'olive' ? 'var(--dr-olive)' : 'var(--dr-ink-mid)';
  return (
    <div style={{ background: bg, border: `0.5px solid ${accent}`, borderRadius: 3, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: accent, textTransform: 'uppercase' }}>{tone === 'olive' ? 'Note' : 'Context'}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.5, color: 'var(--dr-ink)' }}>
        <CiteText text={text} onOpen={onOpen} labels={labels} />{sources && <Cite ids={sources} onOpen={onOpen} labels={labels} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block dispatcher                                                   */
/* ------------------------------------------------------------------ */
export function AnswerBlock({ block, onOpen, labels, isMobile }) {
  if (block.type === 'tldr')     return <TLDR text={block.text} sources={block.sources} onOpen={onOpen} labels={labels} isMobile={isMobile} />;
  if (block.type === 'kpi-grid') return <KPIGrid items={block.items} isMobile={isMobile} />;
  if (block.type === 'table')    return <DataTable columns={block.columns} rows={block.rows} sources={block.sources} onOpen={onOpen} labels={labels} isMobile={isMobile} />;
  if (block.type === 'callout')  return <Callout tone={block.tone} text={block.text} sources={block.sources} onOpen={onOpen} labels={labels} />;
  if (block.type === 'chart') {
    if (block.kind === 'line') return <LineChart title={block.title} series={block.series} sources={block.sources} onOpen={onOpen} labels={labels} />;
    return <BarChart title={block.title} data={block.data} sources={block.sources} onOpen={onOpen} labels={labels} />;
  }
  if (block.type === 'paragraph') {
    const cited = block.text?.replace(/\[(\d+)\]/g, '[$1](cite://$1)') ?? '';
    return (
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.55, color: 'var(--dr-ink)' }} className="prose-block">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={(url) => (/^(https?:|mailto:|cite:)/i.test(url) ? url : '')}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('cite://')) {
                const n = parseInt(href.slice(7), 10);
                if (!isNaN(n)) {
                  return (
                    <span className="cite-wrap" data-tooltip={labels?.[n] ?? undefined} style={{ display: 'inline-flex', gap: 4, marginLeft: 4, verticalAlign: 'middle' }}>
                      <button
                        onClick={() => onOpen?.(n)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 20, height: 18, padding: '0 5px',
                          background: 'var(--dr-cream-soft)',
                          border: '0.5px solid var(--dr-ink)', borderRadius: 3,
                          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
                          color: 'var(--dr-ink)', cursor: 'pointer', lineHeight: 1,
                          verticalAlign: 'middle',
                          transition: 'background 150ms cubic-bezier(0.2,0,0,1)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--dr-orange)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--dr-cream-soft)'}
                      >{n}</button>
                    </span>
                  );
                }
              }
              return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
            },
          }}
        >{cited}</ReactMarkdown>
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Doc icon                                                           */
/* ------------------------------------------------------------------ */
export function DocIcon({ kind, size = 18 }) {
  const color = kind === 'sheet' ? 'var(--dr-olive)' : kind === 'deck' ? 'var(--dr-orange)' : 'var(--dr-ink)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
      {kind === 'sheet' && <><path d="M8 13h8"/><path d="M8 17h8"/><path d="M12 13v8"/></>}
      {kind === 'deck'  && <><rect x="8" y="12" width="8" height="6"/></>}
      {kind === 'doc'   && <><path d="M8 13h8"/><path d="M8 17h5"/></>}
    </svg>
  );
}
