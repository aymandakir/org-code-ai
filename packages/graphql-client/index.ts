import { graphql } from '@octokit/graphql';
import type { Repo, RepoFile } from '@org-code-ai/types';

export interface GitHubClientConfig {
  token: string;
}

export class GitHubGraphQLClient {
  private client: ReturnType<typeof graphql>;

  constructor(config: GitHubClientConfig) {
    this.client = graphql.defaults({
      headers: {
        authorization: `token ${config.token}`,
      },
    });
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
        const result: any = await this.client(query, {
          orgLogin,
          cursor,
        });

        if (!result.organization) {
          throw new Error(`Organization '${orgLogin}' not found`);
        }

        const repos = result.organization.repositories.nodes.map((repo: any) => ({
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
    } catch (error: any) {
      console.error('Error fetching org repos:', error);
      throw new Error(
        error.message || `Failed to fetch repositories for organization '${orgLogin}'`
      );
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
      const result: any = await this.client(query, { owner, repo });

      if (!result.repository?.defaultBranchRef?.target?.tree) {
        throw new Error(`Repository '${owner}/${repo}' not found or empty`);
      }

      const entries = result.repository.defaultBranchRef.target.tree.entries;
      const files: RepoFile[] = entries.map((entry: any) => ({
        name: entry.name,
        path: entry.path,
        type: entry.type === 'tree' ? 'dir' : 'file',
        size: entry.object?.byteSize,
        sha: entry.object?.oid,
      }));

      return files;
    } catch (error: any) {
      console.error('Error fetching repo files:', error);
      throw new Error(
        error.message || `Failed to fetch files for repository '${owner}/${repo}'`
      );
    }
  }

  async searchCode(query: string, orgLogin: string): Promise<any[]> {
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
      const result: any = await this.client(searchQuery, {
        query: searchString,
      });

      return result.search.edges.map((edge: any) => ({
        file: edge.node.name,
        path: edge.node.path,
        repo: edge.node.repository.name,
        owner: edge.node.repository.owner.login,
      }));
    } catch (error: any) {
      console.error('Error searching code:', error);
      throw new Error(error.message || 'Failed to search code');
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

export async function searchCode(
  query: string,
  orgLogin: string,
  token: string
): Promise<any[]> {
  const client = new GitHubGraphQLClient({ token });
  return client.searchCode(query, orgLogin);
}

