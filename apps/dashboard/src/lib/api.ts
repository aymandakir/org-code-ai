import type { Repo, RepoFile, ApiResponse } from '@org-code-ai/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T> & { demoMode?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('API request error:', error);
    throw error;
  }
}

export async function fetchOrgRepos(orgName: string): Promise<{ repos: Repo[]; demoMode: boolean }> {
  const response = await fetchApi<Repo[]>(`/api/orgs/${orgName}/repos`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch repositories');
  }
  return {
    repos: response.data,
    demoMode: response.demoMode || false,
  };
}

export async function fetchRepoScan(
  owner: string,
  repo: string
): Promise<{ files: RepoFile[]; totalFiles: number; languages: string[] }> {
  const response = await fetchApi<{
    files: RepoFile[];
    totalFiles: number;
    languages: string[];
  }>(`/api/repos/${owner}/${repo}/scan`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to scan repository');
  }
  return response.data;
}

export function getGitHubAuthUrl(redirectUrl?: string): string {
  const state = redirectUrl ? encodeURIComponent(redirectUrl) : 'default';
  return `${API_BASE_URL}/api/auth/github?state=${state}`;
}

