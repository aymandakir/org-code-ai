import { Octokit } from '@octokit/rest';
import { fetchOrgRepos, fetchRepoFiles } from '@org-code-ai/graphql-client';
import type { Repo, RepoFile } from '@org-code-ai/types';

export interface GitHubClientConfig {
  token?: string;
}

export class GitHubClient {
  private octokit: Octokit | null = null;
  private token: string | null = null;

  constructor(config: GitHubClientConfig = {}) {
    if (config.token) {
      this.token = config.token;
      this.octokit = new Octokit({
        auth: config.token,
      });
    }
  }

  async authenticate(code: string): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      this.token = data.access_token;
      this.octokit = new Octokit({
        auth: this.token,
      });

      return this.token;
    } catch (error: any) {
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
  }

  async getOrgRepos(orgName: string): Promise<Repo[]> {
    if (!this.token) {
      return this.getMockOrgRepos(orgName);
    }

    try {
      return await fetchOrgRepos(orgName, this.token);
    } catch (error: any) {
      console.error('Error fetching org repos, falling back to mock:', error);
      return this.getMockOrgRepos(orgName);
    }
  }

  async getRepoFiles(owner: string, repo: string): Promise<RepoFile[]> {
    if (!this.token) {
      return this.getMockRepoFiles(owner, repo);
    }

    try {
      return await fetchRepoFiles(owner, repo, this.token);
    } catch (error: any) {
      console.error('Error fetching repo files, falling back to mock:', error);
      return this.getMockRepoFiles(owner, repo);
    }
  }

  private getMockOrgRepos(orgName: string): Repo[] {
    // Mock data for stephdl org
    if (orgName.toLowerCase() === 'stephdl') {
      return [
        {
          id: 'R_1',
          name: 'ns8-lamp',
          url: `https://github.com/${orgName}/ns8-lamp`,
          description: 'LAMP stack configuration for NS8',
          language: 'PHP',
          stars: 42,
          forks: 8,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'R_2',
          name: 'api-gateway',
          url: `https://github.com/${orgName}/api-gateway`,
          description: 'Microservices API Gateway',
          language: 'TypeScript',
          stars: 128,
          forks: 23,
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'R_3',
          name: 'auth-service',
          url: `https://github.com/${orgName}/auth-service`,
          description: 'Authentication and authorization service',
          language: 'Go',
          stars: 89,
          forks: 15,
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 'R_4',
          name: 'frontend-app',
          url: `https://github.com/${orgName}/frontend-app`,
          description: 'React frontend application',
          language: 'TypeScript',
          stars: 156,
          forks: 34,
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'R_5',
          name: 'database-migrations',
          url: `https://github.com/${orgName}/database-migrations`,
          description: 'Database schema migrations',
          language: 'SQL',
          stars: 34,
          forks: 12,
          updatedAt: new Date(Date.now() - 259200000).toISOString(),
        },
        {
          id: 'R_6',
          name: 'ci-cd-pipelines',
          url: `https://github.com/${orgName}/ci-cd-pipelines`,
          description: 'CI/CD pipeline configurations',
          language: 'YAML',
          stars: 67,
          forks: 19,
          updatedAt: new Date(Date.now() - 432000000).toISOString(),
        },
        {
          id: 'R_7',
          name: 'monitoring-dashboard',
          url: `https://github.com/${orgName}/monitoring-dashboard`,
          description: 'Application monitoring and metrics',
          language: 'JavaScript',
          stars: 91,
          forks: 18,
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'R_8',
          name: 'documentation',
          url: `https://github.com/${orgName}/documentation`,
          description: 'Project documentation and guides',
          language: 'Markdown',
          stars: 23,
          forks: 5,
          updatedAt: new Date(Date.now() - 604800000).toISOString(),
        },
      ];
    }

    // Generic mock data for other orgs
    return [
      {
        id: 'R_1',
        name: 'sample-repo',
        url: `https://github.com/${orgName}/sample-repo`,
        description: 'Sample repository',
        language: 'TypeScript',
        stars: 10,
        forks: 2,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getMockRepoFiles(owner: string, repo: string): RepoFile[] {
    return [
      { name: 'src', path: 'src', type: 'dir' },
      { name: 'index.ts', path: 'src/index.ts', type: 'file', size: 1024 },
      { name: 'utils.ts', path: 'src/utils.ts', type: 'file', size: 2048 },
      { name: 'components', path: 'src/components', type: 'dir' },
      { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file', size: 1536 },
      { name: 'package.json', path: 'package.json', type: 'file', size: 512 },
      { name: 'README.md', path: 'README.md', type: 'file', size: 256 },
      { name: '.gitignore', path: '.gitignore', type: 'file', size: 128 },
    ];
  }
}

