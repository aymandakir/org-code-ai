'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchOrgRepos } from '@/lib/api';

export default function ScanPage() {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { repos, demoMode } = await fetchOrgRepos(orgName.trim());
      
      if (repos.length > 0) {
        // Navigate to first repo or show list
        const firstRepo = repos[0];
        const [owner] = firstRepo.url.split('/').slice(-2);
        router.push(`/scan/${owner}/${firstRepo.name}`);
      } else {
        setError('No repositories found for this organization');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Scan Organization</h1>
        <p className="text-gray-400 mt-2">Enter a GitHub organization name to scan all repositories</p>
      </div>

      {/* Scan Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Organization Scanner</CardTitle>
          <CardDescription className="text-gray-400">
            Scan all repositories in a GitHub organization for security vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., stephdl, microsoft, vercel"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the GitHub organization login (username)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Start Scan'
              )}
            </Button>
          </form>

          {/* Demo Mode Banner */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-md">
            <p className="text-sm text-blue-300">
              <strong>Demo Mode:</strong> Using mock data. Connect GitHub App for real scans.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Try These Organizations</h2>
        <div className="flex flex-wrap gap-2">
          {['stephdl', 'microsoft', 'vercel', 'github'].map((org) => (
            <button
              key={org}
              onClick={() => {
                setOrgName(org);
                handleScan({ preventDefault: () => {} } as React.FormEvent);
              }}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {org}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
