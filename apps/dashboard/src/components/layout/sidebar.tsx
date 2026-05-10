'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, ShieldAlert, GitPullRequest,
  BarChart3, ChevronLeft, ChevronRight, Settings, Sun, Moon, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/lib/theme';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
  { icon: Search,          label: 'Repositories',    href: '/scan' },
  { icon: ShieldAlert,     label: 'Vulnerabilities', href: '/vulnerabilities' },
  { icon: GitPullRequest,  label: 'Fix PRs',         href: '/prs' },
  { icon: BarChart3,       label: 'Security Score',  href: '/score' },
];

const THEMES: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'dark',     label: 'Dark',     Icon: Moon },
  { value: 'light',    label: 'Light',    Icon: Sun },
  { value: 'midnight', label: 'Midnight', Icon: Sparkles },
];

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sidebar_collapsed') === 'true';
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [showSettings, setShowSettings] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const light = theme === 'light';

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r transition-all duration-300 ease-in-out relative shrink-0',
        'border-gray-800/60',
        light ? 'bg-white border-gray-200' : theme === 'midnight' ? 'bg-[#0a0a1a]' : 'bg-gray-950',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/40 to-violet-500/0 pointer-events-none" />

      {/* Logo */}
      <div className={cn('flex items-center border-b h-16 px-4 shrink-0', light ? 'border-gray-200' : 'border-gray-800/60', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border', light ? 'border-white' : 'border-gray-950')} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className={cn('font-bold text-sm leading-tight truncate', light ? 'text-gray-900' : 'text-white')}>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                active
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : light
                  ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-500 hover:text-white hover:bg-white/5',
                collapsed && 'justify-center'
              )}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />}
              <Icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-indigo-400' : '')} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('px-2 pb-4 space-y-1 border-t pt-3', light ? 'border-gray-200' : 'border-gray-800/60')}>
        <button
          onClick={() => setShowSettings(s => !s)}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all',
            light ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-500 hover:text-white hover:bg-white/5',
            collapsed && 'justify-center'
          )}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        {showSettings && !collapsed && (
          <div className={cn('mx-1 p-2 rounded-xl border space-y-1', light ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/60 border-gray-800')}>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-2">Theme</p>
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all',
                  theme === value
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : light ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {theme === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        )}

        {!collapsed && (
          <div className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg', light ? 'bg-gray-50' : 'bg-gray-900/40')}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">O</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn('text-xs font-medium truncate', light ? 'text-gray-800' : 'text-white')}>Your Org</div>
              <div className="text-[10px] text-gray-500">Free plan</div>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center z-10 shadow-sm transition-all',
          light ? 'bg-white border-gray-200 text-gray-500 hover:text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </aside>
  );
}
