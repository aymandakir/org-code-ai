import type { Repo, RepoFile, ApiResponse, Finding } from '@/types';

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
  } catch (error: unknown) {
    // Network errors or API unavailable - return demo mode response silently
    if (
      error instanceof TypeError &&
      (error.message.includes('fetch') || error.message.includes('Failed to fetch'))
    ) {
      // Silently return demo mode - don't log network errors
      return {
        success: false,
        error: 'API server unavailable',
        demoMode: true,
      } as ApiResponse<T> & { demoMode: boolean };
    }
    // Re-throw other errors
    throw error instanceof Error ? error : new Error('API request failed');
  }
}

export async function fetchOrgRepos(orgName: string): Promise<{ repos: Repo[]; demoMode: boolean }> {
  const response = await fetchApi<Repo[]>(`/api/orgs/${orgName}/repos`);
  
  // If API is unavailable, return demo mode with empty repos
  if (!response.success || !response.data) {
    if (response.demoMode) {
      return {
        repos: [],
        demoMode: true,
      };
    }
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

export async function fetchRepoAnalysis(
  owner: string,
  repo: string
): Promise<{ findings: Finding[]; scanned: number; totalFiles: number }> {
  const response = await fetchApi<{
    findings: Finding[];
    scanned: number;
    totalFiles: number;
  }>(`/api/repos/${owner}/${repo}/analyze`, {
    method: 'POST',
  });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to analyze repository');
  }
  return response.data;
}

export async function createFixPR(
  owner: string,
  repo: string,
  findings: Finding[]
): Promise<{ pr: { html_url?: string; title: string; body: string }; fixes: number }> {
  const response = await fetchApi<{
    pr: { html_url?: string; title: string; body: string };
    fixes: number;
  }>(`/api/repos/${owner}/${repo}/create-fix-pr`, {
    method: 'POST',
    body: JSON.stringify({ findings }),
  });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create PR');
  }
  return response.data;
}

// ============================================
// VULNERABILITIES API
// ============================================

export interface VulnerabilityFilters {
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type?: string;
  repoId?: string;
  resolved?: boolean;
}

export async function fetchVulnerabilities(
  filters?: VulnerabilityFilters
): Promise<{ vulnerabilities: Finding[]; demoMode: boolean }> {
  const params = new URLSearchParams();
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.repoId) params.append('repoId', filters.repoId);
  if (filters?.resolved !== undefined) params.append('resolved', String(filters.resolved));

  const query = params.toString();
  const response = await fetchApi<Finding[]>(`/api/vulnerabilities${query ? `?${query}` : ''}`);
  
  if (!response.success || !response.data) {
    if (response.demoMode) {
      return { vulnerabilities: [], demoMode: true };
    }
    throw new Error(response.error || 'Failed to fetch vulnerabilities');
  }
  
  return {
    vulnerabilities: response.data,
    demoMode: response.demoMode || false,
  };
}

export async function fetchVulnerability(id: string): Promise<Finding> {
  const response = await fetchApi<Finding>(`/api/vulnerabilities/${id}`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch vulnerability');
  }
  return response.data;
}

// ============================================
// PULL REQUESTS API
// ============================================

export interface PullRequest {
  id: string;
  repositoryId: string;
  repositoryName: string;
  prUrl: string;
  branchName: string;
  prNumber: number | null;
  title: string;
  description: string;
  commitMessage: string;
  commitSha: string | null;
  status: 'open' | 'merged' | 'closed' | 'rejected';
  createdAt: string;
  mergedAt: string | null;
  rejectedAt: string | null;
  vulnerabilitiesFixed: string[];
}

export interface PRFilters {
  status?: 'open' | 'merged' | 'closed' | 'rejected';
  repoId?: string;
}

export async function fetchPullRequests(
  filters?: PRFilters
): Promise<{ prs: PullRequest[]; demoMode: boolean }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.repoId) params.append('repoId', filters.repoId);

  const query = params.toString();
  const response = await fetchApi<PullRequest[]>(`/api/pull-requests${query ? `?${query}` : ''}`);
  
  if (!response.success || !response.data) {
    if (response.demoMode) {
      return { prs: [], demoMode: true };
    }
    throw new Error(response.error || 'Failed to fetch pull requests');
  }
  
  return {
    prs: response.data,
    demoMode: response.demoMode || false,
  };
}

// ============================================
// SECURITY SCORES API
// ============================================

export interface SecurityScore {
  repositoryId?: string;
  repositoryName?: string;
  organizationId?: string;
  organizationName?: string;
  score: number;
  breakdown?: {
    baseScore: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trend?: Array<{ date: string; score: number }>;
  topRisks?: Array<{ type: string; count: number; severity: string }>;
  overallScore?: number;
  repositoryScores?: Array<{ id: string; name: string; score: number; trend: 'up' | 'down' | 'stable' }>;
  summary?: {
    totalRepos: number;
    totalVulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SecurityScoreFilters {
  orgId?: string;
  repoId?: string;
}

export async function fetchSecurityScores(
  filters?: SecurityScoreFilters
): Promise<{ score: SecurityScore; demoMode: boolean }> {
  const params = new URLSearchParams();
  if (filters?.orgId) params.append('orgId', filters.orgId);
  if (filters?.repoId) params.append('repoId', filters.repoId);

  const query = params.toString();
  const response = await fetchApi<SecurityScore>(`/api/security-scores${query ? `?${query}` : ''}`);
  
  if (!response.success || !response.data) {
    if (response.demoMode) {
      return {
        score: {
          score: 0,
          overallScore: 0,
        },
        demoMode: true,
      };
    }
    throw new Error(response.error || 'Failed to fetch security scores');
  }
  
  return {
    score: response.data,
    demoMode: response.demoMode || false,
  };
}

