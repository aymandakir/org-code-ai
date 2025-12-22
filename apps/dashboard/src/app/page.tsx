'use client';

import Link from 'next/link';
import { fetchOrgRepos } from '@/lib/api';
import { useEffect, useState } from 'react';
import type { Repo } from '@/types';
import { RepositoryCard } from '@/components/repository-card';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock repositories for demo
    const mockRepos: Repo[] = [
      {
        id: '1',
        name: 'api-gateway',
        url: 'https://github.com/stephdl/api-gateway',
        description: 'Microservices API Gateway',
        language: 'TypeScript',
        stars: 128,
        forks: 23,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'auth-service',
        url: 'https://github.com/stephdl/auth-service',
        description: 'Authentication and authorization service',
        language: 'Go',
        stars: 89,
        forks: 15,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'frontend-app',
        url: 'https://github.com/stephdl/frontend-app',
        description: 'React frontend application',
        language: 'TypeScript',
        stars: 156,
        forks: 34,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'ns8-lamp',
        url: 'https://github.com/stephdl/ns8-lamp',
        description: 'LAMP stack configuration for NS8',
        language: 'PHP',
        stars: 42,
        forks: 8,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'database-migrations',
        url: 'https://github.com/stephdl/database-migrations',
        description: 'Database schema migrations',
        language: 'SQL',
        stars: 34,
        forks: 12,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'monitoring-dashboard',
        url: 'https://github.com/stephdl/monitoring-dashboard',
        description: 'Application monitoring and metrics',
        language: 'JavaScript',
        stars: 91,
        forks: 18,
        updatedAt: new Date().toISOString(),
      },
    ];

    // Try to fetch real data, but use mock data as fallback
    fetchOrgRepos('stephdl')
      .then(({ repos }) => {
        if (repos.length > 0) {
          setRepositories(repos);
        } else {
          setRepositories(mockRepos);
        }
        setLoading(false);
      })
      .catch(() => {
        setRepositories(mockRepos);
        setLoading(false);
      });
  }, []);

  const stats = [
    {
      title: 'Total Repositories',
      value: repositories.length,
      icon: Shield,
      change: '+2 this month',
    },
    {
      title: 'Vulnerabilities Found',
      value: '47',
      icon: AlertTriangle,
      change: '12 critical',
    },
    {
      title: 'Security Score',
      value: '82',
      icon: TrendingUp,
      change: '+5% this week',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Overview of your organization's security posture</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Repositories Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Repositories</h2>
            <p className="text-sm text-gray-400 mt-1">Manage and scan your repositories</p>
          </div>
          <Link
            href="/scan"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Scan New Org
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-6 bg-gray-900 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : repositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <RepositoryCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">No repositories found</p>
              <Link
                href="/scan"
                className="text-blue-500 hover:text-blue-400 text-sm mt-2 inline-block"
              >
                Scan your first organization →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
