'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchDashboardOverview,
  fetchMTTF,
  fetchSecurityDebt,
  fetchSecurityVelocity,
  fetchAttackSurface,
  fetchCompliance,
  fetchOrgRepos,
} from '@/lib/api';
import type { Repo } from '@/types';
import { RepositoryCard } from '@/components/repository-card';
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VelocityChart } from '@/components/charts/velocity-chart';
import { MTTFChart } from '@/components/charts/mttf-chart';

// TODO: Get orgId from auth/session - for now using hardcoded demo org
const DEMO_ORG_ID = 'stephdl'; // This should come from user session

export default function DashboardPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [overviewData, reposData, mttfData, debtData, velocityData, surfaceData, complianceData] = await Promise.allSettled([
          fetchDashboardOverview(DEMO_ORG_ID),
          fetchOrgRepos('stephdl'),
          fetchMTTF(DEMO_ORG_ID),
          fetchSecurityDebt(DEMO_ORG_ID),
          fetchSecurityVelocity(DEMO_ORG_ID, 30),
          fetchAttackSurface(DEMO_ORG_ID),
          fetchCompliance(DEMO_ORG_ID),
        ]);

        // Process overview
        if (overviewData.status === 'fulfilled') {
          setOverview(overviewData.value);
        }

        // Process repos
        if (reposData.status === 'fulfilled') {
          setRepositories(reposData.value.repos.slice(0, 6));
        }

        // Process metrics
        if (
          mttfData.status === 'fulfilled' ||
          debtData.status === 'fulfilled' ||
          velocityData.status === 'fulfilled' ||
          surfaceData.status === 'fulfilled' ||
          complianceData.status === 'fulfilled'
        ) {
          setMetrics({
            mttf: mttfData.status === 'fulfilled' ? mttfData.value : null,
            debt: debtData.status === 'fulfilled' ? debtData.value : null,
            velocity: velocityData.status === 'fulfilled' ? velocityData.value : null,
            attackSurface: surfaceData.status === 'fulfilled' ? surfaceData.value : null,
            compliance: complianceData.status === 'fulfilled' ? complianceData.value : null,
          });
        }
      } catch (err: unknown) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-800 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <Card className="bg-gray-900 border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback to demo data if API unavailable
  const stats = overview || {
    repositories: { total: repositories.length, addedThisMonth: 0, change: 'No change' },
    vulnerabilities: { total: 47, critical: 12, high: 15, medium: 12, low: 8, addedThisMonth: 5, change: '5 new this month' },
    securityScore: { current: 82, previous: 80, change: 2, changePercent: 2.5, trend: 'up' as const, display: '+2.5%' },
  };

  return (
    <div className="space-y-8">
      {/* Core Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.repositories.total}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.repositories.change}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.vulnerabilities.total}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                {stats.vulnerabilities.critical} critical
              </Badge>
              <Badge variant="outline" className="text-xs border-orange-700 text-orange-400">
                {stats.vulnerabilities.high} high
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.vulnerabilities.change}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              {stats.securityScore.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.securityScore.current}</div>
            <p className={`text-xs mt-1 ${stats.securityScore.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {stats.securityScore.display} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              Security Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.debt ? (
              <>
                <div className="text-3xl font-bold text-white">
                  ${(metrics.debt.ageAdjustedDebt / 1000).toFixed(0)}k
                </div>
                <p className="text-xs text-gray-500 mt-1">{metrics.debt.interpretation}</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-white">$0k</div>
                <p className="text-xs text-gray-500 mt-1">Calculating...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mean Time To Fix
            </CardTitle>
            <CardDescription className="text-gray-400">Average time to resolve vulnerabilities</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.mttf ? (
              <>
                <div className="text-2xl font-bold text-white">
                  {metrics.mttf.overall > 0 ? `${metrics.mttf.overall.toFixed(1)}h` : 'N/A'}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Critical:</span>
                    <span className="text-white">{metrics.mttf.bySeverity.critical.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">High:</span>
                    <span className="text-white">{metrics.mttf.bySeverity.high.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Medium:</span>
                    <span className="text-white">{metrics.mttf.bySeverity.medium.toFixed(1)}h</span>
                  </div>
        </div>
              </>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Target className="h-4 w-4" />
              Attack Surface Score
            </CardTitle>
            <CardDescription className="text-gray-400">Exposure risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.attackSurface ? (
              <>
                <div className="text-2xl font-bold text-white">{metrics.attackSurface.normalized}/100</div>
                <Badge
                  className={`mt-2 ${
                    metrics.attackSurface.score > 500
                      ? 'bg-red-900 text-red-200 border-red-700'
                      : metrics.attackSurface.score > 200
                        ? 'bg-yellow-900 text-yellow-200 border-yellow-700'
                        : 'bg-green-900 text-green-200 border-green-700'
                  }`}
                >
                  {metrics.attackSurface.interpretation}
                </Badge>
              </>
            ) : (
              <div className="text-gray-500">Calculating...</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              OWASP Compliance
            </CardTitle>
            <CardDescription className="text-gray-400">Top 10 compliance score</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.compliance ? (
              <>
                <div className="text-2xl font-bold text-white">{metrics.compliance.score}/100</div>
                {metrics.compliance.passing ? (
                  <Badge className="mt-2 bg-green-900 text-green-200 border-green-700">✓ Compliant</Badge>
                ) : (
                  <Badge className="mt-2 bg-yellow-900 text-yellow-200 border-yellow-700">
                    {metrics.compliance.message}
                  </Badge>
                )}
              </>
            ) : (
              <div className="text-gray-500">Calculating...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Velocity Chart */}
      {metrics?.velocity && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Security Velocity (30 days)</CardTitle>
            <CardDescription className="text-gray-400">
              Trend: <span className={metrics.velocity.trend === 'improving' ? 'text-green-400' : 'text-red-400'}>
                {metrics.velocity.trend === 'improving' ? 'Improving' : 'Worsening'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VelocityChart data={metrics.velocity.timeline} />
          </CardContent>
        </Card>
      )}

      {/* MTTF Chart */}
      {metrics?.mttf && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Mean Time To Fix by Severity</CardTitle>
            <CardDescription className="text-gray-400">Average hours to resolve vulnerabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <MTTFChart data={metrics.mttf.bySeverity} />
          </CardContent>
        </Card>
      )}

      {/* Repository Grid */}
      {repositories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently Scanned Repositories</h2>
            <Link href="/scan">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <RepositoryCard key={repo.id} repo={repo} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => router.push('/vulnerabilities')}>
          <CardHeader>
            <CardTitle className="text-white">View All Vulnerabilities</CardTitle>
            <CardDescription className="text-gray-400">
              {stats.vulnerabilities.total} total issues to review
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => router.push('/score')}>
          <CardHeader>
            <CardTitle className="text-white">Security Score Details</CardTitle>
            <CardDescription className="text-gray-400">
              Current score: {stats.securityScore.current}/100
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
