'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Search, TrendingUp, Shield } from 'lucide-react';
import { getFindings, getSecurityScore, type StoredFinding, type Severity } from '@/lib/store';

const GRADE = (s: number) => s >= 90 ? { g: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' } : s >= 75 ? { g: 'B', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' } : s >= 60 ? { g: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' } : s >= 40 ? { g: 'D', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' } : { g: 'F', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };

const SEV_WEIGHT: Record<Severity, number> = { Critical: 20, High: 10, Medium: 5, Low: 1 };

export default function ScorePage() {
  const [findings, setFindings] = useState<StoredFinding[]>([]);

  useEffect(() => { setFindings(getFindings()); }, []);

  const score = findings.length > 0 ? getSecurityScore(findings) : null;
  const grade = score !== null ? GRADE(score) : null;
  const repos = [...new Set(findings.map(f => `${f.org}/${f.repo}`))];

  const repoScores = repos.map(r => {
    const rf = findings.filter(f => `${f.org}/${f.repo}` === r);
    return { name: r, score: getSecurityScore(rf), count: rf.length };
  }).sort((a, b) => a.score - b.score);

  const factors: { label: string; severity: Severity; count: number }[] = (
    ['Critical', 'High', 'Medium', 'Low'] as Severity[]
  ).map(s => ({ label: s, severity: s, count: findings.filter(f => f.severity === s).length }));

  const GRADE_SCALE = [
    { grade: 'A', range: '90–100', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { grade: 'B', range: '75–89',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    { grade: 'C', range: '60–74',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    { grade: 'D', range: '40–59',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    { grade: 'F', range: '0–39',   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Score</h1>
          <p className="text-gray-400 mt-1 text-sm">Overall security posture based on vulnerability findings.</p>
        </div>
        <Link href="/scan" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Search className="w-4 h-4" />Scan to update score
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score ring */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center mb-4 relative ${grade ? `${grade.border} border-opacity-50` : 'border-gray-800'}`}>
            <div className={`absolute inset-0 rounded-full ${grade?.bg ?? 'bg-indigo-500/5'}`} />
            <span className={`text-4xl font-bold relative ${grade?.color ?? 'text-gray-600'}`}>
              {score !== null ? score : '—'}
            </span>
          </div>
          {grade && (
            <div className={`text-3xl font-black mb-1 ${grade.color}`}>{grade.g}</div>
          )}
          <div className="text-sm font-semibold text-white mb-1">Overall Score</div>
          <div className="text-xs text-gray-500">
            {score !== null ? `Based on ${findings.length} findings across ${repos.length} repo${repos.length !== 1 ? 's' : ''}` : 'Scan repositories to generate your score'}
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />Score factors
          </h2>
          <div className="space-y-4">
            {factors.map(f => {
              const maxPenalty = f.severity === 'Critical' ? 100 : f.severity === 'High' ? 50 : f.severity === 'Medium' ? 25 : 10;
              const penalty = Math.min(f.count * SEV_WEIGHT[f.severity], maxPenalty);
              const pct = maxPenalty > 0 ? (penalty / maxPenalty) * 100 : 0;
              const colors: Record<Severity, string> = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-blue-400' };
              const textColors: Record<Severity, string> = { Critical: 'text-red-400', High: 'text-orange-400', Medium: 'text-yellow-400', Low: 'text-blue-400' };
              return (
                <div key={f.severity}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{f.severity} vulnerabilities</span>
                    <span className={textColors[f.severity]}>{f.count} found · -{penalty} pts</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full">
                    <div className={`h-full ${colors[f.severity]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Repo breakdown */}
      {repoScores.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Repository Scores</h2>
          </div>
          <div className="divide-y divide-gray-800/60">
            {repoScores.map(r => {
              const g = GRADE(r.score);
              return (
                <div key={r.name} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg ${g.bg} ${g.border} border flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${g.color}`}>{g.g}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.count} finding{r.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${r.score >= 75 ? 'bg-emerald-500' : r.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`} style={{ width: `${r.score}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-8 text-right ${g.color}`}>{r.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {repoScores.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No score data yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Scores are calculated after scanning repositories.</p>
          <Link href="/scan" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Search className="w-4 h-4" />Start scanning
          </Link>
        </div>
      )}

      {/* Grade scale */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />Grading scale
        </h2>
        <p className="text-xs text-gray-500 mb-5">Score = 100 − (Critical×20 + High×10 + Medium×5 + Low×1)</p>
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
