'use client';

import Link from 'next/link';
import { GitPullRequest, Search, CheckCircle, Clock, GitMerge, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: Search,         step: '01', title: 'Scan a repo',         desc: 'Run the vulnerability scanner on any public GitHub repository.' },
  { icon: Sparkles,       step: '02', title: 'Findings detected',   desc: 'Issues are identified and categorized by severity in real-time.' },
  { icon: GitPullRequest, step: '03', title: 'PR auto-generated',   desc: 'A pull request with code fixes is created for each finding.' },
  { icon: GitMerge,       step: '04', title: 'Review and merge',    desc: 'Review the suggested fix and merge when satisfied.' },
];

const PR_STATS = [
  { label: 'Total PRs',  value: '0', icon: GitPullRequest, color: 'text-gray-400' },
  { label: 'Open',       value: '0', icon: Clock,          color: 'text-blue-400'  },
  { label: 'Merged',     value: '0', icon: CheckCircle,    color: 'text-emerald-400' },
  { label: 'Closed',     value: '0', icon: GitMerge,       color: 'text-gray-500'  },
];

export default function PRsPage() {
  return (
    <div className="space-y-8">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Fix Pull Requests</h1>
          <p className="text-gray-400 mt-1 text-sm">AI-generated PRs that patch security vulnerabilities automatically.</p>
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
        {PR_STATS.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white">Pull Requests</h2>
          <div className="flex gap-2">
            {['All', 'Open', 'Merged', 'Closed'].map(f => (
              <button key={f} className={`text-xs px-3 py-1 rounded-full transition-colors ${f === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-5">
            <GitPullRequest className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">No pull requests yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Fix PRs are generated automatically after scanning a repository for vulnerabilities.
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Run a scan
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-6">How fix PRs work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-4 left-full w-full h-px bg-gradient-to-r from-gray-700 to-transparent -translate-y-1/2 z-0" />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono text-gray-600">{s.step}</span>
                </div>
                <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
