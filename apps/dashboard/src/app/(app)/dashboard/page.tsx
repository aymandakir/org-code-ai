'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Search, GitPullRequest, BarChart3, ArrowRight, Zap, Lock, Eye } from 'lucide-react';
import { getFindings, getSecurityScore, type StoredFinding } from '@/lib/store';

const QUICK_ACTIONS = [
  { icon: Search, title: 'Scan a Repository', description: 'Enter any public GitHub org to instantly scan its repos for vulnerabilities.', href: '/scan', cta: 'Start scanning', gradient: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/20 hover:border-indigo-500/50', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10' },
  { icon: Shield, title: 'View Vulnerabilities', description: 'Browse all detected security issues, filter by severity, and track resolution.', href: '/vulnerabilities', cta: 'View findings', gradient: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/20 hover:border-orange-500/50', iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  { icon: GitPullRequest, title: 'Fix Pull Requests', description: 'Review AI-generated PRs that automatically patch security vulnerabilities.', href: '/prs', cta: 'View PRs', gradient: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20 hover:border-violet-500/50', iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10' },
  { icon: BarChart3, title: 'Security Score', description: 'Track your overall security posture with trends and repository breakdowns.', href: '/score', cta: 'View score', gradient: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20 hover:border-emerald-500/50', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
];

const FEATURES = [
  { icon: Zap, title: 'Instant scanning', desc: 'Heuristic analysis runs in seconds — no API key required.' },
  { icon: Lock, title: '30+ vulnerability patterns', desc: 'SQL injection, XSS, secrets, SSRF, command injection, JWT misconfig and more.' },
  { icon: Eye, title: 'Live results', desc: 'Findings stream in real-time as each file is analyzed.' },
];

export default function DashboardPage() {
  const [findings, setFindings] = useState<StoredFinding[]>([]);

  useEffect(() => {
    setFindings(getFindings());
  }, []);

  const repos = [...new Set(findings.map(f => `${f.org}/${f.repo}`))];
  const critical = findings.filter(f => f.severity === 'Critical').length;
  const score = findings.length > 0 ? getSecurityScore(findings) : null;

  const STATS = [
    { label: 'Repos Scanned',        value: repos.length || '—',              sub: repos.length ? `${repos.join(', ').slice(0, 40)}…` : 'Scan an org to populate',    color: 'text-indigo-400' },
    { label: 'Vulnerabilities',      value: findings.length || '—',           sub: findings.length ? `${critical} critical` : 'Run a scan to detect issues',          color: 'text-orange-400' },
    { label: 'Security Score',       value: score !== null ? score : '—',     sub: score !== null ? (score >= 75 ? 'Good posture' : score >= 50 ? 'Needs work' : 'Critical issues') : 'Score generated after scanning', color: score !== null ? (score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400') : 'text-emerald-400' },
    { label: 'Fix PRs Created',      value: '—',                              sub: 'PRs auto-created per finding',                                                      color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Scan any public GitHub org — no API key, no setup required.</p>
        </div>
        <Link href="/scan" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Search className="w-4 h-4" />Scan an org
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm font-medium text-white mb-0.5">{s.label}</div>
            <div className="text-xs text-gray-500 truncate">{s.sub}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold text-white mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.title} href={a.href} className={`group bg-gradient-to-br ${a.gradient} ${a.border} border rounded-xl p-6 transition-all block`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${a.iconBg} ${a.iconColor}`}><a.icon className="w-5 h-5" /></div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{a.title}</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{a.description}</p>
              <span className={`text-xs font-semibold ${a.iconColor}`}>{a.cta} →</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-3">
              <div className="p-2 h-fit rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0"><f.icon className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-medium text-white mb-0.5">{f.title}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
