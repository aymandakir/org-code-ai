import { graphql } from '@octokit/graphql';
import type { Repo, Org } from '@org-code-ai/types';

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
    // Placeholder implementation
    // TODO: Implement GraphQL query to fetch organization repositories
    const query = `
      query($orgLogin: String!) {
        organization(login: $orgLogin) {
          repositories(first: 100) {
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
            }
          }
        }
      }
    `;

    try {
      const result: any = await this.client(query, { orgLogin });
      return result.organization.repositories.nodes.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        description: repo.description,
        language: repo.primaryLanguage?.name || null,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        updatedAt: repo.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching org repos:', error);
      throw error;
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

