import { graphql } from '@octokit/graphql';
import type { Repo, RepoFile } from '@org-code-ai/types';

export interface GitHubClientConfig {
  token: string;
}

export class GitHubGraphQLClient {
  private client: (query: string, variables?: Record<string, unknown>) => Promise<unknown>;

  constructor(config: GitHubClientConfig) {
    this.client = graphql.defaults({
      headers: {
        authorization: `token ${config.token}`,
      },
    }) as (query: string, variables?: Record<string, unknown>) => Promise<unknown>;
  }

  async fetchOrgRepos(orgLogin: string): Promise<Repo[]> {
    const query = `
      query($orgLogin: String!, $cursor: String) {
        organization(login: $orgLogin) {
          repositories(first: 100, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              name
              url
              description
              primaryLanguage {
                name
              }
              stargazerCount
              forkCount
              updatedAt
              defaultBranchRef {
                target {
                  ... on Commit {
                    committedDate
                    message
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const allRepos: Repo[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = (await this.client(query, {
          orgLogin,
          cursor,
        })) as {
          organization?: {
            repositories: {
              nodes: Array<{
                id: string;
                name: string;
                url: string;
                description: string | null;
                primaryLanguage: { name: string } | null;
                stargazerCount: number;
                forkCount: number;
                updatedAt: string;
              }>;
              pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
              };
            };
          };
        };

        if (!result.organization) {
          throw new Error(`Organization '${orgLogin}' not found`);
        }

        const repos = result.organization.repositories.nodes.map((repo) => ({
          id: repo.id,
          name: repo.name,
          url: repo.url,
          description: repo.description,
          language: repo.primaryLanguage?.name || null,
          stars: repo.stargazerCount,
          forks: repo.forkCount,
          updatedAt: repo.updatedAt,
        }));

        allRepos.push(...repos);

        hasNextPage = result.organization.repositories.pageInfo.hasNextPage;
        cursor = result.organization.repositories.pageInfo.endCursor;
      }

      return allRepos;
    } catch (error: unknown) {
      console.error('Error fetching org repos:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch repositories for organization '${orgLogin}'`;
      throw new Error(errorMessage);
    }
  }

  async fetchRepoFiles(owner: string, repo: string): Promise<RepoFile[]> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef {
            target {
              ... on Commit {
                tree {
                  entries {
                    name
                    path
                    type
                    object {
                      ... on Blob {
                        byteSize
                        oid
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const result = (await this.client(query, { owner, repo })) as {
        repository?: {
          defaultBranchRef?: {
            target?: {
              tree?: {
                entries: Array<{
                  name: string;
                  path: string;
                  type: string;
                  object?: {
                    byteSize?: number;
                    oid?: string;
                  };
                }>;
              };
            };
          };
        };
      };

      if (!result.repository?.defaultBranchRef?.target?.tree) {
        throw new Error(`Repository '${owner}/${repo}' not found or empty`);
      }

      const entries = result.repository.defaultBranchRef.target.tree.entries;
      const files: RepoFile[] = entries.map((entry) => ({
        name: entry.name,
        path: entry.path,
        type: entry.type === 'tree' ? 'dir' : 'file',
        size: entry.object?.byteSize,
        sha: entry.object?.oid,
      }));

      return files;
    } catch (error: unknown) {
      console.error('Error fetching repo files:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch files for repository '${owner}/${repo}'`;
      throw new Error(errorMessage);
    }
  }

  async searchCode(query: string, orgLogin: string): Promise<CodeSearchResult[]> {
    const searchQuery = `
      query($query: String!) {
        search(query: $query, type: CODE, first: 100) {
          codeCount
          edges {
            node {
              ... on File {
                name
                path
                repository {
                  name
                  owner {
                    login
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const searchString = `${query} org:${orgLogin}`;
      const result = (await this.client(searchQuery, {
        query: searchString,
      })) as {
        search: {
          edges: Array<{
            node: {
              name: string;
              path: string;
              repository: {
                name: string;
                owner: {
                  login: string;
                };
              };
            };
          }>;
        };
      };

      return result.search.edges.map((edge) => ({
        file: edge.node.name,
        path: edge.node.path,
        repo: edge.node.repository.name,
        owner: edge.node.repository.owner.login,
      }));
    } catch (error: unknown) {
      console.error('Error searching code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search code';
      throw new Error(errorMessage);
    }
  }
}

export async function fetchOrgRepos(
  orgLogin: string,
  token: string
): Promise<Repo[]> {
  const client = new GitHubGraphQLClient({ token });
  return client.fetchOrgRepos(orgLogin);
}

export async function fetchRepoFiles(
  owner: string,
  repo: string,
  token: string
): Promise<RepoFile[]> {
  const client = new GitHubGraphQLClient({ token });
  return client.fetchRepoFiles(owner, repo);
}

export interface CodeSearchResult {
  file: string;
  path: string;
  repo: string;
  owner: string;
}

export async function searchCode(
  query: string,
  orgLogin: string,
  token: string
): Promise<CodeSearchResult[]> {
  const client = new GitHubGraphQLClient({ token });
  return client.searchCode(query, orgLogin);
}

