'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scan, AlertCircle, CheckCircle } from 'lucide-react';
import { saveFindings } from '@/lib/store';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

interface Finding {
  filePath: string;
  type: string;
  severity: Severity;
  description: string;
  fix: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: 'bg-red-500/10 text-red-400 border border-red-500/30',
  High:     'bg-orange-500/10 text-orange-400 border border-orange-500/30',
  Medium:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  Low:      'bg-green-500/10 text-green-400 border border-green-500/30',
};

export default function AnalyzePage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const startScan = async () => {
    setScanning(true);
    setDone(false);
    setPct(0);
    setFindings([]);
    setError('');
    setStatus('Starting scan…');

    abortRef.current = new AbortController();
    const collectedFindings: Finding[] = [];

    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: owner, repo }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);

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
            if (evt.type === 'progress') { setPct(evt.pct); setStatus(evt.message); }
            else if (evt.type === 'result') {
              const f = evt.row as Finding;
              collectedFindings.push(f);
              setFindings(prev => [...prev, f]);
            }
            else if (evt.type === 'done') {
              setDone(true);
              // Persist to localStorage
              saveFindings(owner, repo, collectedFindings);
            }
            else if (evt.type === 'error') setError(evt.message);
          } catch { /* ignore malformed frames */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => { startScan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => { abortRef.current?.abort(); setScanning(false); setStatus('Scan stopped.'); };

  const counts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {} as Record<Severity, number>);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/scan/${owner}/${repo}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {repo}
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Security Scan</h1>
            <p className="text-gray-400 text-sm mt-1">{owner}/{repo}</p>
          </div>
          {scanning ? (
            <button onClick={stop} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
              Stop
            </button>
          ) : (
            <button onClick={startScan} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
              <Scan className="w-4 h-4" /> Re-scan
            </button>
          )}
        </div>
      </div>

      {(scanning || (pct > 0 && !done)) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-400">{status}</span>
            <span className="text-indigo-400 font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {done && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium ${findings.length > 0 ? 'bg-orange-950/40 border border-orange-900 text-orange-300' : 'bg-green-950/40 border border-green-900 text-green-400'}`}>
          {findings.length > 0 ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          {findings.length > 0
            ? `Found ${findings.length} issue${findings.length !== 1 ? 's' : ''} — ${Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(', ')} · Results saved`
            : 'No vulnerabilities detected in the scanned files.'
          }
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {findings.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Findings {scanning && <span className="text-gray-500 font-normal">— live</span>}
            </h2>
            <div className="flex gap-2">
              {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s =>
                counts[s] ? (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_STYLES[s]}`}>
                    {counts[s]} {s}
                  </span>
                ) : null
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-800">
            {findings.map((f, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[f.severity]}`}>{f.severity}</span>
                    <span className="text-sm font-semibold text-white">{f.type}</span>
                  </div>
                  <code className="text-xs text-gray-500 font-mono shrink-0 max-w-48 truncate" title={f.filePath}>{f.filePath}</code>
                </div>
                <p className="text-sm text-gray-400 mb-1">{f.description}</p>
                <p className="text-xs text-indigo-400 font-mono">→ {f.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!scanning && !done && !error && (
        <div className="flex items-center justify-center py-16 text-gray-600">
          <Scan className="w-8 h-8 opacity-30 mr-3" />
          <span className="text-sm">Initializing scan…</span>
        </div>
      )}
    </div>
  );
}
