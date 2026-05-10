'use client';

import Link from 'next/link';
import { BarChart3, Search, TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const SCORE_FACTORS = [
  { label: 'Critical vulnerabilities',  impact: 'High impact',   direction: 'down', color: 'text-red-400',    bar: 'bg-red-500' },
  { label: 'High severity issues',      impact: 'Medium impact',  direction: 'down', color: 'text-orange-400', bar: 'bg-orange-500' },
  { label: 'Time to fix (MTTF)',        impact: 'Medium impact',  direction: 'up',   color: 'text-yellow-400', bar: 'bg-yellow-500' },
  { label: 'Repos scanned',             impact: 'Low impact',     direction: 'up',   color: 'text-emerald-400',bar: 'bg-emerald-500' },
  { label: 'Fix PRs merged',            impact: 'Low impact',     direction: 'up',   color: 'text-blue-400',   bar: 'bg-blue-500' },
];

const GRADE_SCALE = [
  { grade: 'A', range: '90–100', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { grade: 'B', range: '75–89',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  { grade: 'C', range: '60–74',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  { grade: 'D', range: '40–59',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  { grade: 'F', range: '0–39',   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
];

export default function ScorePage() {
  return (
    <div className="space-y-8">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Score</h1>
          <p className="text-gray-400 mt-1 text-sm">Overall security posture based on vulnerability findings.</p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          Scan to generate score
        </Link>
      </div>

      {/* Score display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-28 h-28 rounded-full border-4 border-gray-800 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
            <span className="text-4xl font-bold text-gray-600 relative">—</span>
          </div>
          <div className="text-lg font-semibold text-white mb-1">Overall Score</div>
          <div className="text-xs text-gray-500">Scan repositories to generate your score</div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Score factors
          </h2>
          <div className="space-y-4">
            {SCORE_FACTORS.map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    {f.direction === 'down'
                      ? <AlertTriangle className="w-3 h-3 text-gray-600" />
                      : <CheckCircle className="w-3 h-3 text-gray-600" />
                    }
                    {f.label}
                  </span>
                  <span className={f.color}>{f.impact}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div className={`h-full w-0 ${f.bar} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Repository Scores</h2>
        </div>
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-5">
            <BarChart3 className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">No score data yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Security scores are calculated automatically after scanning your repositories.
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Start scanning
          </Link>
        </div>
      </div>

      {/* Grading scale */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Grading scale
        </h2>
        <p className="text-xs text-gray-500 mb-5">How scores translate to security grades</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {GRADE_SCALE.map(g => (
            <div key={g.grade} className={`${g.bg} ${g.border} border rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${g.color} mb-1`}>{g.grade}</div>
              <div className="text-xs text-gray-500">{g.range}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
