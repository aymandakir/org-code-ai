import { fetchOrgRepos, fetchRepoFiles } from '@org-code-ai/graphql-client';
import { prisma } from '../lib/prisma';
import type { Repo, RepoFile } from '@org-code-ai/types';

export interface ScanOptions {
  token?: string;
  storeInDb?: boolean;
}

export class GitHubScanner {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Scan an entire organization and store repositories in database
   */
  async scanOrganization(orgName: string, options: ScanOptions = {}): Promise<{
    organizationId: string;
    repos: Repo[];
    totalRepos: number;
  }> {
    const token = options.token || this.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GitHub token required for scanning');
    }

    // Fetch repositories from GitHub
    const repos = await fetchOrgRepos(orgName, token);

    if (options.storeInDb !== false) {
      // Find or create organization
      let org = await prisma.organization.findUnique({
        where: { login: orgName },
      });

      if (!org) {
        // Create organization (we'll need GitHub ID, but for now use a placeholder)
        org = await prisma.organization.create({
          data: {
            githubId: `org_${orgName}_${Date.now()}`,
            login: orgName,
            name: orgName,
            url: `https://github.com/${orgName}`,
          },
        });
      }

      // Store repositories
      const storedRepos = await Promise.all(
        repos.map(async (repo: Repo) => {
          const fullName = `${orgName}/${repo.name}`;
          const existing = await prisma.repository.findUnique({
            where: { fullName },
          });

          if (existing) {
            // Update existing
            return prisma.repository.update({
              where: { id: existing.id },
              data: {
                name: repo.name,
                url: repo.url,
                description: repo.description,
                language: repo.language,
                stars: repo.stars,
                forks: repo.forks,
                updatedAt: new Date(repo.updatedAt),
              },
            });
          } else {
            // Create new
            return prisma.repository.create({
              data: {
                organizationId: org.id,
                githubId: repo.id,
                name: repo.name,
                fullName,
                url: repo.url,
                description: repo.description,
                language: repo.language,
                stars: repo.stars,
                forks: repo.forks,
                defaultBranch: 'main',
                isPrivate: false,
              },
            });
          }
        })
      );

      return {
        organizationId: org.id,
        repos: storedRepos.map((r: { id: string; name: string; url: string; description: string | null; language: string | null; stars: number; forks: number; updatedAt: Date }) => ({
          id: r.id,
          name: r.name,
          url: r.url,
          description: r.description,
          language: r.language,
          stars: r.stars,
          forks: r.forks,
          updatedAt: r.updatedAt.toISOString(),
        })),
        totalRepos: storedRepos.length,
      };
    }

    return {
      organizationId: '',
      repos,
      totalRepos: repos.length,
    };
  }

  /**
   * Scan a single repository and get file tree
   */
  async scanRepository(
    owner: string,
    repoName: string,
    options: ScanOptions = {}
  ): Promise<{
    repositoryId?: string;
    files: RepoFile[];
    totalFiles: number;
    languages: string[];
  }> {
    const token = options.token || this.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GitHub token required for scanning');
    }

    // Fetch files from GitHub
    const files = await fetchRepoFiles(owner, repoName, token);

    // Extract languages
    const languages = Array.from(
      new Set(
        files
          .map((f) => {
            const ext = f.path.split('.').pop()?.toLowerCase();
            const langMap: Record<string, string> = {
              ts: 'TypeScript',
              tsx: 'TypeScript',
              js: 'JavaScript',
              jsx: 'JavaScript',
              py: 'Python',
              go: 'Go',
              java: 'Java',
              php: 'PHP',
              rb: 'Ruby',
              rs: 'Rust',
              sql: 'SQL',
              yml: 'YAML',
              yaml: 'YAML',
              json: 'JSON',
              md: 'Markdown',
            };
            return langMap[ext || ''] || ext?.toUpperCase() || 'Unknown';
          })
          .filter(Boolean)
      )
    );

    if (options.storeInDb !== false) {
      // Find repository in database
      const fullName = `${owner}/${repoName}`;
      const repo = await prisma.repository.findUnique({
        where: { fullName },
      });

      if (repo) {
        return {
          repositoryId: repo.id,
          files,
          totalFiles: files.length,
          languages,
        };
      }
    }

    return {
      files,
      totalFiles: files.length,
      languages,
    };
  }

  /**
   * Get file content from GitHub
   */
  async getFileContent(
    owner: string,
    repoName: string,
    filePath: string,
    options: ScanOptions = {}
  ): Promise<string> {
    const token = options.token || this.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GitHub token required');
    }

    // Use GitHub REST API to get file content
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Get all repository files recursively (for analysis)
   */
  async getRepositoryFiles(
    owner: string,
    repoName: string,
    path: string = '',
    options: ScanOptions = {}
  ): Promise<Array<{ path: string; name: string; url: string; size: number }>> {
    const token = options.token || this.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GitHub token required');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch contents: ${response.statusText}`);
      }

      const data = await response.json();
      const files: Array<{ path: string; name: string; url: string; size: number }> = [];

      for (const item of Array.isArray(data) ? data : [data]) {
        if (item.type === 'file') {
          // Only analyze code files
          const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.php', '.java', '.rb', '.go', '.rs', '.cs', '.cpp', '.c'];
          if (codeExtensions.some((ext) => item.name.endsWith(ext))) {
            files.push({
              path: item.path,
              name: item.name,
              url: item.download_url || '',
              size: item.size || 0,
            });
          }
        } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'vendor') {
          // Recursively get files from subdirectories (limit depth)
          if (path.split('/').length < 5) {
            // Limit recursion depth
            const subFiles = await this.getRepositoryFiles(owner, repoName, item.path, options);
            files.push(...subFiles);
          }
        }
      }

      return files;
    } catch (error) {
      console.error(`Error fetching repository files for ${path}:`, error);
      return [];
    }
  }
}

