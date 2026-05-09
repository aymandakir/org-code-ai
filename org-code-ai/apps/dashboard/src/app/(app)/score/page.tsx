'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchSecurityScores, type SecurityScore } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle } from 'lucide-react';

export default function SecurityScorePage() {
  const [score, setScore] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const { score: fetchedScore, demoMode: demo } = await fetchSecurityScores();
      setScore(fetchedScore);
      setDemoMode(demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security scores');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-900/20 border-green-800';
    if (score >= 75) return 'bg-yellow-900/20 border-yellow-800';
    if (score >= 60) return 'bg-orange-900/20 border-orange-800';
    return 'bg-red-900/20 border-red-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Security Score</h1>
        <p className="text-gray-400 mt-2">Overall security posture and trends across your organization</p>
      </div>

      {demoMode && (
        <Card className="bg-blue-900/20 border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-300">
              <Shield className="h-5 w-5" />
              <p className="text-sm">
                <strong>Demo Mode:</strong> Showing mock security score data. Connect GitHub App for real scores.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : score ? (
        <>
          {/* Overall Score */}
          {score.overallScore !== undefined ? (
            <Card className={`bg-gray-900 border-gray-800 ${getScoreBgColor(score.overallScore)}`}>
              <CardHeader>
                <CardTitle className="text-white">Organization Security Score</CardTitle>
                <CardDescription className="text-gray-400">
                  {score.organizationName || 'Your Organization'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-4">
                  <div className={`text-6xl font-bold ${getScoreColor(score.overallScore)}`}>
                    {score.overallScore}
                  </div>
                  <div className="text-2xl text-gray-500">/ 100</div>
                </div>
                {score.summary && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Repositories</div>
                      <div className="text-xl font-semibold text-white">{score.summary.totalRepos}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Total Vulns</div>
                      <div className="text-xl font-semibold text-white">{score.summary.totalVulnerabilities}</div>
                    </div>
                    <div>
                      <div className="text-sm text-red-400">Critical</div>
                      <div className="text-xl font-semibold text-red-400">{score.summary.critical}</div>
                    </div>
                    <div>
                      <div className="text-sm text-orange-400">High</div>
                      <div className="text-xl font-semibold text-orange-400">{score.summary.high}</div>
                    </div>
                    <div>
                      <div className="text-sm text-yellow-400">Medium</div>
                      <div className="text-xl font-semibold text-yellow-400">{score.summary.medium}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className={`bg-gray-900 border-gray-800 ${getScoreBgColor(score.score)}`}>
              <CardHeader>
                <CardTitle className="text-white">Repository Security Score</CardTitle>
                <CardDescription className="text-gray-400">
                  {score.repositoryName || 'Repository'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-4">
                  <div className={`text-6xl font-bold ${getScoreColor(score.score)}`}>
                    {score.score}
                  </div>
                  <div className="text-2xl text-gray-500">/ 100</div>
                </div>
                {score.breakdown && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Base Score</span>
                      <span className="text-white">+{score.breakdown.baseScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">Critical Vulnerabilities</span>
                      <span className="text-red-400">{score.breakdown.critical}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-400">High Vulnerabilities</span>
                      <span className="text-orange-400">{score.breakdown.high}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-400">Medium Vulnerabilities</span>
                      <span className="text-yellow-400">{score.breakdown.medium}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Low Vulnerabilities</span>
                      <span className="text-blue-400">{score.breakdown.low}</span>
                    </div>
                  </div>
                )}
                {score.topRisks && score.topRisks.length > 0 && (
                  <div className="mt-6">
                    <div className="text-sm font-medium text-gray-400 mb-2">Top Risks</div>
                    <div className="space-y-2">
                      {score.topRisks.map((risk, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{risk.type.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="border-gray-700 text-gray-400">
                            {risk.count} {risk.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Repository Scores */}
          {score.repositoryScores && score.repositoryScores.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Repository Scores</CardTitle>
                <CardDescription className="text-gray-400">
                  Security scores for each repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {score.repositoryScores.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${getScoreColor(repo.score)}`}>
                          {repo.score}
                        </div>
                        <div>
                          <div className="font-medium text-white">{repo.name}</div>
                          <div className="text-xs text-gray-500">Security score</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(repo.trend)}
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          {repo.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend Chart */}
          {score.trend && score.trend.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Score Trend</CardTitle>
                <CardDescription className="text-gray-400">
                  Historical security score over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {score.trend.map((point, i) => {
                    const prevScore = i > 0 ? score.trend![i - 1].score : point.score;
                    const isImproving = point.score >= prevScore;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 border border-gray-800 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`text-lg font-semibold ${getScoreColor(point.score)}`}>
                            {point.score}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(point.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        {isImproving ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No security score data available</p>
            <p className="text-sm text-gray-500 mt-2">Scan your repositories to generate security scores</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

