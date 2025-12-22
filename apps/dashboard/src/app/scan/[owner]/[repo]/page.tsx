'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchRepoScan } from '@/lib/api';
import type { RepoFile } from '@org-code-ai/types';
import { ArrowLeft, File, Folder, Code, AlertCircle, Sparkles } from 'lucide-react';

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
    if (owner && repo) {
      loadRepoData();
    }
  }, [owner, repo]);

  const loadRepoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepoScan(owner, repo);
      setFiles(data.files);
      setLanguages(data.languages);
    } catch (err: any) {
      setError(err.message || 'Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

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

          // Check if this item was already rendered
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
              <div className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2">
                {isDir ? (
                  <Folder className="h-4 w-4 text-blue-500" />
                ) : (
                  <File className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-mono">{displayName}</span>
                {!isDir && file.size && (
                  <span className="text-xs text-muted-foreground ml-auto">
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/scan')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scanner
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {owner}/{repo}
              </h1>
              <p className="text-muted-foreground">
                Repository file structure and analysis
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {languages.slice(0, 3).map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
                {languages.length > 3 && (
                  <Badge variant="outline">+{languages.length - 3}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.push(`/scan/${owner}/${repo}/analyze`)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze with AI
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Scan for vulnerabilities
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <CardTitle>File Structure</CardTitle>
            </div>
            <CardDescription>
              Browse the repository file tree
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length > 0 ? (
              <div className="font-mono text-sm">{renderFileTree(files)}</div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No files found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

