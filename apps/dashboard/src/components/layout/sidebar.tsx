'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Code, 
  Shield, 
  GitPullRequest, 
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

function NavItem({ icon: Icon, label, href }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900",
          isActive
            ? "bg-gray-800 text-white font-medium"
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-gray-800 bg-gray-900">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-white">org-code-ai</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4" aria-label="Main navigation">
        <ul className="space-y-1">
          <NavItem icon={Home} label="Dashboard" href="/dashboard" />
          <NavItem icon={Code} label="Repositories" href="/scan" />
          <NavItem icon={Shield} label="Vulnerabilities" href="/vulnerabilities" />
          <NavItem icon={GitPullRequest} label="Fix PRs" href="/prs" />
          <NavItem icon={BarChart3} label="Security Score" href="/score" />
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-800">
        <button 
          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="User settings"
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-gray-300">U</span>
          </div>
          <span className="text-sm text-gray-300">Your Org</span>
        </button>
      </div>
    </aside>
  );
}

