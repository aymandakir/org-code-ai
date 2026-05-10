'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Search, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { getFindings, type StoredFinding, type Severity } from '@/lib/store';

const SEV_CFG: Record<Severity, { icon: React.ComponentType<{className?:string}>; bg: string; text: string; border: string }> = {
  Critical: { icon: AlertCircle,   bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20' },
  High:     { icon: AlertTriangle, bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Medium:   { icon: AlertTriangle, bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  Low:      { icon: Info,          bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
};

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

export default function VulnerabilitiesPage() {
  const [findings] = useState<StoredFinding[]>(getFindings);
  const [filter, setFilter] = useState<Severity | 'All'>('All');

  const counts = SEVERITIES.reduce((acc, s) => ({ ...acc, [s]: findings.filter(f => f.severity === s).length }), {} as Record<Severity, number>);
  const visible = filter === 'All' ? findings : findings.filter(f => f.severity === filter);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Vulnerabilities</h1>
          <p className="text-gray-400 mt-1 text-sm">Security issues detected across your scanned repositories.</p>
        </div>
        <Link href="/scan" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Search className="w-4 h-4" />Scan a repo
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SEVERITIES.map(s => {
          const cfg = SEV_CFG[s];
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'All' : s)} className={`${cfg.bg} ${cfg.border} border rounded-xl p-5 text-left transition-all ${filter === s ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-gray-600'}`}>
              <div className={`text-2xl font-bold ${cfg.text} mb-1`}>{counts[s]}</div>
              <div className="text-sm font-medium text-white">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white">
            Findings {findings.length > 0 && <span className="text-gray-500 font-normal ml-1">({visible.length})</span>}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {(['All', ...SEVERITIES] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f}{f !== 'All' && counts[f as Severity] > 0 && ` (${counts[f as Severity]})`}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-5">
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">{findings.length === 0 ? 'No vulnerabilities yet' : 'No results for this filter'}</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {findings.length === 0 ? 'Scan a repository to start detecting security issues.' : 'Try selecting a different severity.'}
            </p>
            {findings.length === 0 && (
              <Link href="/scan" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
                <Search className="w-4 h-4" />Scan now
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {visible.map(f => {
              const cfg = SEV_CFG[f.severity];
              const Icon = cfg.icon;
              return (
                <div key={f.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/20 transition-colors">
                  <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white">{f.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${cfg.border} border`}>{f.severity}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{f.description}</p>
                    <p className="text-xs text-indigo-400 font-mono">→ {f.fix}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <code className="text-xs text-gray-600 font-mono block max-w-40 truncate" title={f.filePath}>{f.filePath}</code>
                    <span className="text-xs text-gray-600">{f.org}/{f.repo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
