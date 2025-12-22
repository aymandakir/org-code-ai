'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchRepoAnalysis, createFixPR } from '@/lib/api';
import type { Finding } from '@/types';
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [prCreated, setPrCreated] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const analyzeRepo = async () => {
    setLoading(true);
    setError(null);
    setFindings([]);
    try {
      const result = await fetchRepoAnalysis(owner, repo);
      setFindings(result.findings);
      setScanned(result.scanned);
      setTotalFiles(result.totalFiles);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze repository';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createPR = async () => {
    if (findings.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const result = await createFixPR(owner, repo, findings);
      setPrCreated(true);
      if (result.pr?.html_url) {
        setPrUrl(result.pr.html_url);
      }
      // Refresh PRs page after creating
      setTimeout(() => {
        router.push('/prs');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create PR';
      setError(errorMessage);
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

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/scan/${owner}/${repo}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Repository
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Security Analysis</h1>
          <p className="text-gray-400 mt-2">{owner}/{repo}</p>
        </div>
      </div>

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

      {!findings.length && !loading && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Start AI Analysis</CardTitle>
            <CardDescription className="text-gray-400">
              Scan this repository for security vulnerabilities using AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={analyzeRepo}
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Repository
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && !findings.length && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-300">Analyzing repository...</p>
              <p className="text-sm text-gray-500 mt-2">
                Scanning {scanned} of {totalFiles} files
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {findings.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{findings.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {scanned} files scanned
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">High</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{highCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Medium/Low</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{mediumCount + lowCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-white">
              Found {findings.length} {findings.length === 1 ? 'vulnerability' : 'vulnerabilities'}
            </p>
            <Button
              onClick={createPR}
              disabled={loading || prCreated}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {prCreated ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  PR Created
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Auto-Generate Fix PR
                </>
              )}
            </Button>
          </div>

          {prCreated && (
            <Card className="bg-green-900/20 border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Pull Request created successfully!</p>
                  </div>
                  {prUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(prUrl, '_blank')}
                      className="border-green-700 text-green-300 hover:bg-green-900/20"
                    >
                      View PR
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Link href="/prs">
                      <Button variant="outline" size="sm" className="border-green-700 text-green-300 hover:bg-green-900/20">
                        View All PRs
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Findings List */}
          <div className="space-y-4">
            {findings.map((finding, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        finding.severity === 'critical' || finding.severity === 'high'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`} />
                      <CardTitle className="text-lg text-white capitalize">
                        {finding.type.replace(/_/g, ' ')}
                      </CardTitle>
                    </div>
                    <Badge className={getSeverityColor(finding.severity)}>
                      {finding.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 mb-3">{finding.description}</p>
                  {finding.fix && (
                    <div className="bg-gray-800 p-3 rounded-md mb-3 border border-gray-700">
                      <p className="text-xs font-semibold mb-1 text-gray-400">Suggested Fix:</p>
                      <p className="text-sm text-gray-300">{finding.fix}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-mono">{finding.file}</span>
                    <span>Line {finding.line}</span>
                    {finding.language && (
                      <Badge variant="outline" className="border-gray-700 text-gray-400">
                        {finding.language}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
