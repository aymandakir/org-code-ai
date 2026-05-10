'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, ShieldAlert, GitPullRequest,
  BarChart3, ChevronLeft, ChevronRight, Settings, Sun, Moon, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
  { icon: Search,          label: 'Repositories',   href: '/scan' },
  { icon: ShieldAlert,     label: 'Vulnerabilities', href: '/vulnerabilities' },
  { icon: GitPullRequest,  label: 'Fix PRs',         href: '/prs' },
  { icon: BarChart3,       label: 'Security Score',  href: '/score' },
];

const THEMES: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'dark',     label: 'Dark',     icon: Moon },
  { value: 'light',    label: 'Light',    icon: Sun },
  { value: 'midnight', label: 'Midnight', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r transition-all duration-300 ease-in-out relative shrink-0',
        'border-gray-800/60',
        theme === 'light'
          ? 'bg-white'
          : theme === 'midnight'
          ? 'bg-[#0a0a1a]'
          : 'bg-gray-950',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/40 to-violet-500/0 pointer-events-none" />

      {/* Logo */}
      <div className={cn('flex items-center border-b border-gray-800/60 h-16 px-4 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-gray-950" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className={cn('font-bold text-sm leading-tight truncate', theme === 'light' ? 'text-gray-900' : 'text-white')}>
              org-code-ai
            </div>
            <div className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Security</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                active
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : theme === 'light'
                  ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-500 hover:text-white hover:bg-white/5',
                collapsed && 'justify-center'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
              )}
              <Icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-indigo-400' : '')} style={{ width: 18, height: 18 }} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={cn('px-2 pb-4 space-y-1 border-t border-gray-800/60 pt-3')}>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(s => !s)}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all',
            theme === 'light' ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-500 hover:text-white hover:bg-white/5',
            collapsed && 'justify-center'
          )}
        >
          <Settings style={{ width: 18, height: 18 }} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* Theme switcher — shown when settings expanded */}
        {showSettings && !collapsed && (
          <div className={cn('mx-1 p-2 rounded-xl border space-y-1', theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/60 border-gray-800')}>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-2">Theme</p>
            {THEMES.map(t => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all',
                  theme === t.value
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : theme === 'light' ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                )}
              >
                <t.icon style={{ width: 14, height: 14 }} />
                {t.label}
                {theme === t.value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        )}

        {/* Org avatar row */}
        {!collapsed && (
          <div className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg', theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/40')}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">O</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn('text-xs font-medium truncate', theme === 'light' ? 'text-gray-800' : 'text-white')}>Your Org</div>
              <div className="text-[10px] text-gray-500">Free plan</div>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all z-10 shadow-sm',
          theme === 'light'
            ? 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
            : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight style={{ width: 12, height: 12 }} /> : <ChevronLeft style={{ width: 12, height: 12 }} />}
      </button>
    </aside>
  );
}
