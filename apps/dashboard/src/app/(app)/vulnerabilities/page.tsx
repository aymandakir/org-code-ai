'use client';

import Link from 'next/link';
import { Shield, Search, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

const SEVERITY_CONFIG: Record<Severity, { icon: React.ComponentType<{className?: string}>; bg: string; text: string; border: string; dot: string }> = {
  Critical: { icon: AlertCircle,   bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-500' },
  High:     { icon: AlertTriangle, bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  Medium:   { icon: AlertTriangle, bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
  Low:      { icon: Info,          bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   dot: 'bg-blue-400' },
};

const EXAMPLE_TYPES = [
  { type: 'SQL Injection', severity: 'Critical' as Severity, desc: 'User input interpolated directly into SQL query.' },
  { type: 'Hardcoded Secret', severity: 'Critical' as Severity, desc: 'API key or credential found in source code.' },
  { type: 'XSS', severity: 'High' as Severity, desc: 'Unsanitized value passed to dangerouslySetInnerHTML.' },
  { type: 'Command Injection', severity: 'Critical' as Severity, desc: 'User input used in shell command execution.' },
  { type: 'Path Traversal', severity: 'High' as Severity, desc: 'File path derived from request parameter.' },
  { type: 'Insecure Randomness', severity: 'Medium' as Severity, desc: 'Math.random() used for security-sensitive values.' },
];

export default function VulnerabilitiesPage() {
  return (
    <div className="space-y-8">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Vulnerabilities</h1>
          <p className="text-gray-400 mt-1 text-sm">Security issues detected across your scanned repositories.</p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          Scan a repo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s => {
          const cfg = SEVERITY_CONFIG[s];
          return (
            <div key={s} className={`${cfg.bg} ${cfg.border} border rounded-xl p-5`}>
              <div className={`text-2xl font-bold ${cfg.text} mb-1`}>0</div>
              <div className="text-sm font-medium text-white">{s}</div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Findings</h2>
          <div className="flex gap-2">
            {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(f => (
              <button key={f} className={`text-xs px-3 py-1 rounded-full transition-colors ${f === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-5">
            <Shield className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">No vulnerabilities yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Scan a repository to start detecting security issues. Results appear here in real-time.
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Scan now
          </Link>
        </div>
      </div>

      {/* What we detect */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">What we detect</h2>
          <p className="text-xs text-gray-500 mt-0.5">18 vulnerability types scanned via static heuristic analysis</p>
        </div>
        <div className="divide-y divide-gray-800/60">
          {EXAMPLE_TYPES.map(v => {
            const cfg = SEVERITY_CONFIG[v.severity];
            const Icon = cfg.icon;
            return (
              <div key={v.type} className="flex items-center gap-4 px-5 py-3">
                <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{v.type}</span>
                  <p className="text-xs text-gray-500 truncate">{v.desc}</p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${cfg.border} border shrink-0`}>
                  {v.severity}
                </span>
                <Link href="/scan" className="text-gray-600 hover:text-indigo-400 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
