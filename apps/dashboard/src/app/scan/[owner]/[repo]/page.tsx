'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchRepoScan } from '@/lib/api';
import type { RepoFile } from '@/types';
import { ArrowLeft, File, Folder, Code, Sparkles } from 'lucide-react';

export default function RepoScanPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [files, setFiles] = useState<RepoFile[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRepoScan(owner, repo);
        setFiles(data.files);
        setLanguages(data.languages);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load repository data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRepoData();
  }, [owner, repo]);

  const renderFileTree = (files: RepoFile[], pathPrefix = '') => {
    const filteredFiles = pathPrefix
      ? files.filter((f) => f.path.startsWith(pathPrefix) && f.path !== pathPrefix)
      : files.filter((f) => !f.path.includes('/') || f.path.split('/').length === 1);

    return (
      <div className="space-y-1">
        {filteredFiles.map((file) => {
          const isDir = file.type === 'dir';
          const displayName = pathPrefix
            ? file.path.replace(pathPrefix + '/', '').split('/')[0]
            : file.name;

          const key = pathPrefix ? `${pathPrefix}/${displayName}` : displayName;
          const alreadyRendered = files.some(
            (f, idx) =>
              files.indexOf(file) > idx &&
              f.path === key &&
              f.type === file.type
          );

          if (alreadyRendered) return null;

          const children = isDir
            ? files.filter(
                (f) =>
                  f.path.startsWith(key + '/') &&
                  f.path.split('/').length === key.split('/').length + 1
              )
            : [];

          return (
            <div key={file.path} className="pl-4">
              <div className="flex items-center gap-2 py-1 hover:bg-gray-800/50 rounded px-2">
                {isDir ? (
                  <Folder className="h-4 w-4 text-blue-400" />
                ) : (
                  <File className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-mono text-gray-300">{displayName}</span>
                {!isDir && file.size && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              {isDir && children.length > 0 && (
                <div className="ml-4">{renderFileTree(files, key)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scanner
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {owner}/{repo}
            </h1>
            <p className="text-gray-400 mt-2">Repository file structure and analysis</p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <Code className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-800 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-400">Total Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{files.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-400">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {languages.slice(0, 3).map((lang) => (
                    <Badge key={lang} variant="secondary" className="bg-gray-800 text-gray-300">
                      {lang}
                    </Badge>
                  ))}
                  {languages.length > 3 && (
                    <Badge variant="outline" className="border-gray-700 text-gray-400">
                      +{languages.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-400">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push(`/scan/${owner}/${repo}/analyze`)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with AI
                </Button>
                <p className="text-xs text-gray-500 mt-2">Scan for vulnerabilities</p>
              </CardContent>
            </Card>
          </div>

          {/* File Tree */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-white">File Structure</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Browse the repository file tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="font-mono text-sm bg-gray-950 rounded-md p-4 border border-gray-800">
                  {renderFileTree(files)}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No files found</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
