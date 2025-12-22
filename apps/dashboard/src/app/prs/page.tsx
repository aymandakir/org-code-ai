'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchPullRequests, type PRFilters, type PullRequest } from '@/lib/api';
import { GitPullRequest, ExternalLink, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function PullRequestsPage() {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [filters, setFilters] = useState<PRFilters>({});

  useEffect(() => {
    loadPRs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadPRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { prs: fetchedPRs, demoMode: demo } = await fetchPullRequests(filters);
      setPRs(fetchedPRs);
      setDemoMode(demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pull requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'merged':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'closed':
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'open':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <GitPullRequest className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'merged':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'closed':
      case 'rejected':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'open':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusCounts = prs.reduce(
    (acc, pr) => {
      acc[pr.status] = (acc[pr.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Fix Pull Requests</h1>
        <p className="text-gray-400 mt-2">AI-generated pull requests that fix security vulnerabilities</p>
      </div>

      {demoMode && (
        <Card className="bg-blue-900/20 border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-300">
              <GitPullRequest className="h-5 w-5" />
              <p className="text-sm">
                <strong>Demo Mode:</strong> Showing mock PR data. Connect GitHub App for real PRs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{prs.length}</div>
            <p className="text-xs text-gray-400 mt-1">Total PRs</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-blue-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{statusCounts.open || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-green-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{statusCounts.merged || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Merged</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{statusCounts.closed || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.status === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: undefined })}
            >
              All Status
            </Button>
            {['open', 'merged', 'closed', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, status: status as 'open' | 'merged' | 'closed' | 'rejected' })}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PRs List */}
      {error && (
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prs.length > 0 ? (
        <div className="space-y-4">
          {prs.map((pr) => (
            <Card key={pr.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(pr.status)}
                      <CardTitle className="text-lg text-white">{pr.title}</CardTitle>
                      <Badge className={getStatusColor(pr.status)}>
                        {pr.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {pr.repositoryName} • {pr.branchName}
                    </CardDescription>
                  </div>
                  {pr.prNumber && (
                    <Badge variant="outline" className="border-gray-700 text-gray-400">
                      #{pr.prNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 mb-4">{pr.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created {formatDate(pr.createdAt)}</span>
                    {pr.mergedAt && <span>Merged {formatDate(pr.mergedAt)}</span>}
                    {pr.rejectedAt && <span>Rejected {formatDate(pr.rejectedAt)}</span>}
                    {pr.vulnerabilitiesFixed.length > 0 && (
                      <span className="text-blue-400">
                        Fixes {pr.vulnerabilitiesFixed.length} vulnerability
                        {pr.vulnerabilitiesFixed.length !== 1 ? 'ies' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {pr.prUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(pr.prUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View PR
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <GitPullRequest className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No pull requests found</p>
            <p className="text-sm text-gray-500 mt-2">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters'
                : 'Create fix PRs from the Vulnerabilities page'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

