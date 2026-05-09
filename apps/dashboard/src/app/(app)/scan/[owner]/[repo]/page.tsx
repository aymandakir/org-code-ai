'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, File, Folder, Scan, Loader2, AlertCircle } from 'lucide-react';

interface TreeItem { path: string; type: 'file' | 'dir'; size?: number; }

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
      .then(r => r.json())
      .then(data => {
        if (data.tree) {
          setTree(
            (data.tree as Array<{ path: string; type: string; size?: number }>)
              .filter(i => i.type === 'blob' || i.type === 'tree')
              .map(i => ({ path: i.path, type: (i.type === 'tree' ? 'dir' : 'file') as 'file' | 'dir', size: i.size }))
              .slice(0, 300)
          );
        } else {
          setError('Could not load repository tree.');
        }
      })
      .catch(() => setError('Failed to fetch repository from GitHub.'))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const codeFiles = tree.filter(i =>
    i.type === 'file' && /\.(ts|tsx|js|jsx|py|go|rb|php|java|rs|cs)$/.test(i.path)
  );
  const topLevel = tree.filter(i => !i.path.includes('/'));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/scan" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Repositories
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">{owner}/{repo}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {codeFiles.length} scannable code files · {tree.length} total
            </p>
          </div>
          <button
            onClick={() => router.push(`/scan/${owner}/${repo}/analyze`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            Scan for Vulnerabilities
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />Loading file tree…
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wider">
            File Structure
          </div>
          <div className="p-4 font-mono text-sm max-h-[60vh] overflow-y-auto">
            {topLevel.map(item => (
              <TreeNode key={item.path} item={item} allItems={tree} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({ item, allItems, depth }: { item: TreeItem; allItems: TreeItem[]; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const name = item.path.split('/').pop()!;
  const children = item.type === 'dir'
    ? allItems.filter(i =>
        i.path.startsWith(item.path + '/') &&
        i.path.split('/').length === item.path.split('/').length + 1
      )
    : [];

  if (item.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 py-0.5 w-full text-left text-gray-300 hover:text-white cursor-pointer rounded hover:bg-gray-800/50"
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
        >
          <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate text-xs">{name}</span>
        </button>
        {open && children.map(child => (
          <TreeNode key={child.path} item={child} allItems={allItems} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 py-0.5 text-gray-500"
      style={{ paddingLeft: `${depth * 14 + 6}px` }}
    >
      <File className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate text-xs">{name}</span>
      {item.size !== undefined && (
        <span className="ml-auto text-gray-700 text-xs shrink-0">{(item.size / 1024).toFixed(1)}kb</span>
      )}
    </div>
  );
}
