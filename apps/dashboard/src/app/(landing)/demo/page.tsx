'use client';

import { useState, useRef } from 'react';

type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

interface VulnRow {
  repo: string;
  filePath: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  fix: string;
}

const SEVERITY_STYLES: Record<SeverityLevel, React.CSSProperties> = {
  Critical: { background: '#ef444420', color: '#f87171', border: '1px solid #ef444440' },
  High:     { background: '#f9731620', color: '#fb923c', border: '1px solid #f9731640' },
  Medium:   { background: '#eab30820', color: '#fbbf24', border: '1px solid #eab30840' },
  Low:      { background: '#22c55e20', color: '#4ade80', border: '1px solid #22c55e40' },
};

const PRESET_ORGS = ['vercel', 'supabase', 'calcom'];

function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      ...(SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.Medium),
    }}>
      {severity}
    </span>
  );
}

export default function DemoPage() {
  const [org, setOrg] = useState('');
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [pct, setPct] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [rows, setRows] = useState<VulnRow[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleScan = async (overrideOrg?: string) => {
    const target = (overrideOrg ?? org).trim();
    if (!target) {
      setError('Please enter a GitHub org name.');
      return;
    }
    setError('');
    setRows([]);
    setDone(false);
    setPct(0);
    setStatusMsg('Starting scan…');
    setScanning(true);
    if (overrideOrg) setOrg(overrideOrg);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/demo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: target, token: token.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === 'progress') {
              setPct(evt.pct);
              setStatusMsg(evt.message);
            } else if (evt.type === 'result') {
              setRows(prev => [...prev, evt.row as VulnRow]);
            } else if (evt.type === 'done') {
              setDone(true);
            } else if (evt.type === 'error') {
              setError(evt.message);
            }
          } catch {
            // ignore malformed SSE frames
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setScanning(false);
    setStatusMsg('Scan stopped.');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 0', fontFamily: 'var(--font-geist-sans)' }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Scan a public GitHub org
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 14, maxWidth: 560 }}>
          No token required for public repos. Optional token only for private repos or higher rate limits.
        </p>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 16 }}>

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#475569', marginRight: 10 }}>Try an example:</span>
          {PRESET_ORGS.map(preset => (
            <button
              key={preset}
              onClick={() => !scanning && handleScan(preset)}
              disabled={scanning}
              style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '3px 12px', fontSize: 12, color: '#94a3b8', cursor: scanning ? 'not-allowed' : 'pointer', marginRight: 8, fontFamily: 'monospace' }}
            >
              {preset}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>GitHub Org Name</label>
            <input
              type="text"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="e.g. vercel"
              disabled={scanning}
              onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: '2 1 280px' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
              GitHub Token <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_•••••••••••••••• (leave blank for public repos)"
              disabled={scanning}
              onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={scanning ? handleStop : () => handleScan()}
              style={{ background: scanning ? '#334155' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {scanning ? 'Stop' : 'Scan Now'}
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
      </div>

      <p style={{ fontSize: 12, color: '#475569', margin: '0 0 24px', paddingLeft: 4 }}>
        Optional GitHub token is used only for this request and is never stored.
      </p>

      {(scanning || (pct > 0 && !done)) && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{statusMsg}</span>
            <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {done && (
        <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 12, padding: '12px 20px', marginBottom: 24, color: '#4ade80', fontSize: 13, fontWeight: 500 }}>
          ✓ Scan complete — {rows.length} finding{rows.length !== 1 ? 's' : ''} found.
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
              Findings {scanning && <span style={{ color: '#64748b', fontWeight: 400 }}>— live results</span>}
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['Repo', 'File', 'Vulnerability', 'Severity', 'Fix Preview'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                    <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.repo}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.filePath}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{row.type}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><SeverityBadge severity={row.severity as SeverityLevel} /></td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.fix}>{row.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {done && rows.length === 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 40, textAlign: 'center', color: '#64748b' }}>
          No vulnerabilities found — the repos look clean!
        </div>
      )}
    </div>
  );
}
