'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchVulnerabilities, type VulnerabilityFilters } from '@/lib/api';
import type { Finding } from '@/types';
import { AlertTriangle, Filter, ExternalLink, Loader2 } from 'lucide-react';

export default function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [filters, setFilters] = useState<VulnerabilityFilters>({});

  useEffect(() => {
    loadVulnerabilities();
  }, [filters]);

  const loadVulnerabilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const { vulnerabilities: vulns, demoMode: demo } = await fetchVulnerabilities(filters);
      setVulnerabilities(vulns);
      setDemoMode(demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vulnerabilities');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'high':
        return 'bg-orange-900 text-orange-200 border-orange-700';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'low':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const severityCounts = vulnerabilities.reduce(
    (acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Vulnerabilities</h1>
        <p className="text-gray-400 mt-2">View and manage security vulnerabilities across your repositories</p>
      </div>

      {demoMode && (
        <Card className="bg-blue-900/20 border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-300">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                <strong>Demo Mode:</strong> Showing mock vulnerability data. Connect GitHub App for real scans.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{vulnerabilities.length}</div>
            <p className="text-xs text-gray-400 mt-1">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{severityCounts.critical || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-orange-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-400">{severityCounts.high || 0}</div>
            <p className="text-xs text-gray-400 mt-1">High</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-yellow-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">{severityCounts.medium || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Medium</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-blue-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{severityCounts.low || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Low</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-white">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.severity === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, severity: undefined })}
            >
              All Severities
            </Button>
            {['critical', 'high', 'medium', 'low'].map((sev) => (
              <Button
                key={sev}
                variant={filters.severity === sev ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, severity: sev as 'critical' | 'high' | 'medium' | 'low' })}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities Table */}
      {error && (
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
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
      ) : vulnerabilities.length > 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Vulnerability List</CardTitle>
            <CardDescription className="text-gray-400">
              {vulnerabilities.length} vulnerability{vulnerabilities.length !== 1 ? 'ies' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vulnerabilities.map((vuln) => (
                <div
                  key={vuln.id}
                  className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-white">
                          {getTypeLabel(vuln.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{vuln.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-mono">{vuln.file}</span>
                        <span>Line {vuln.line}</span>
                        {vuln.language && <span>{vuln.language}</span>}
                      </div>
                      {vuln.fix && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                          <p className="text-xs font-medium text-gray-400 mb-1">Suggested Fix:</p>
                          <p className="text-sm text-gray-300">{vuln.fix}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={async () => {
                        if (!vuln.id) return;
                        try {
                          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                          const res = await fetch(`${API_BASE_URL}/api/vulnerabilities/${vuln.id}/fix`, {
                            method: 'POST',
                            credentials: 'include',
                          });
                          const data = await res.json();
                          if (data.success && data.data?.pr?.url) {
                            window.open(data.data.pr.url, '_blank');
                          } else {
                            alert(data.error || 'Failed to create PR');
                          }
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Failed to create PR');
                        }
                      }}
                    >
                      Create Fix PR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No vulnerabilities found</p>
            <p className="text-sm text-gray-500 mt-2">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters'
                : 'Scan your repositories to find vulnerabilities'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

