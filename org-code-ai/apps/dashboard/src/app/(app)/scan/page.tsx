'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Star, GitFork, Code2, ChevronRight, AlertCircle } from 'lucide-react';

interface Repo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
}

const PRESETS = ['vercel', 'supabase', 'calcom', 'shadcn-ui'];

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', Java: '#b07219',
};

export default function ScanPage() {
  const router = useRouter();
  const [org, setOrg] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [scannedOrg, setScannedOrg] = useState('');
  const [error, setError] = useState('');

  const fetchRepos = async (target: string) => {
    const orgName = target.trim();
    if (!orgName) return;
    setLoading(true);
    setError('');
    setRepos([]);
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: orgName, token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setRepos(data.repos);
      setScannedOrg(orgName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Repositories</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Enter a GitHub org to browse its public repos, then pick one to scan for vulnerabilities.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <form
          onSubmit={e => { e.preventDefault(); fetchRepos(org); }}
          className="flex gap-3 flex-wrap"
        >
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="GitHub org name, e.g. vercel"
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="GitHub token (optional)"
            disabled={loading}
            className="w-52 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={loading || !org.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Loading…' : 'Fetch Repos'}
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Quick pick:</span>
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => { setOrg(p); fetchRepos(p); }}
              disabled={loading}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-xs text-gray-300 font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {repos.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">
            {repos.length} repos in{' '}
            <span className="text-indigo-400">{scannedOrg}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {repos.map(repo => (
              <button
                key={repo.name}
                onClick={() => router.push(`/scan/${scannedOrg}/${repo.name}`)}
                className="text-left bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl p-5 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors truncate">
                    {repo.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
                </div>
                {repo.description && (
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {repo.language && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: LANG_COLORS[repo.language] ?? '#6b7280' }}
                      />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stars.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && repos.length === 0 && !error && (
        <div className="text-center py-16 text-gray-600">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">{scannedOrg ? `No public repositories found for ${scannedOrg}.` : 'Enter an org name above to get started.'}</p>
        </div>
      )}
    </div>
  );
}
