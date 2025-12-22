'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
      console.error(err);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create PR';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return null;
  };

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/scan/${owner}/${repo}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Repository
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Security Analysis</h1>
              <p className="text-muted-foreground">
                {owner}/{repo}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {!findings.length && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Start AI Analysis</CardTitle>
              <CardDescription>
                Scan this repository for security vulnerabilities using AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={analyzeRepo} disabled={loading} size="lg">
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing repository...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Scanning {scanned} of {totalFiles} files
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {findings.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{findings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {scanned} files scanned
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">High</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{highCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Medium/Low</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediumCount + lowCount}</div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">
                Found {findings.length} {findings.length === 1 ? 'vulnerability' : 'vulnerabilities'}
              </p>
              <Button
                onClick={createPR}
                disabled={loading || prCreated}
                size="lg"
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

            {prCreated && prUrl && (
              <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Pull Request created successfully!</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(prUrl, '_blank')}
                    >
                      View PR
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {findings.map((finding, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(finding.severity)}
                        <CardTitle className="text-lg capitalize">
                          {finding.type.replace(/_/g, ' ')}
                        </CardTitle>
                      </div>
                      <Badge variant={getSeverityColor(finding.severity) as any}>
                        {finding.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {finding.description}
                    </p>
                    {finding.fix && (
                      <div className="bg-muted p-3 rounded-md mb-3">
                        <p className="text-xs font-semibold mb-1">Suggested Fix:</p>
                        <p className="text-sm">{finding.fix}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">{finding.file}</span>
                      <span>Line {finding.line}</span>
                      {finding.language && (
                        <Badge variant="outline" className="text-xs">
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
    </div>
  );
}

