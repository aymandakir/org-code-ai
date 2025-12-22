'use client';

import Link from 'next/link';
import { Code, Star, GitFork, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Repo } from '@/types';

interface RepositoryCardProps {
  repo: Repo;
}

export function RepositoryCard({ repo }: RepositoryCardProps) {
  // Mock security score for demo
  const securityScore = Math.floor(Math.random() * 30) + 70; // 70-100
  const vulnCount = Math.floor(Math.random() * 10);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Code className="w-5 h-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-white truncate">
                {repo.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {repo.url.split('/').slice(-2, -1)[0]}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${getScoreColor(securityScore)} border-gray-700`}
          >
            {securityScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {repo.description || 'No description available'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            {repo.forks}
          </span>
          {repo.language && (
            <span className="text-gray-600">{repo.language}</span>
          )}
          {vulnCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {vulnCount} vulns
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link
            href={`/scan/${repo.url.split('/').slice(-2, -1)[0]}/${repo.name}`}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            View Details
          </Link>
          <button
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={`Scan ${repo.name}`}
          >
            Scan
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

