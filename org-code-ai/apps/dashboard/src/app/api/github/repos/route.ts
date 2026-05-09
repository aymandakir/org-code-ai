import { Octokit } from '@octokit/rest';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error contacting GitHub.';
  const status = (err as { status?: number }).status;
  if (status === 401) return 'GitHub token is invalid or expired.';
  if (status === 403) return err.message.includes('rate limit')
    ? 'GitHub rate limit exceeded. Add a token for higher limits.'
    : 'Access denied — this org may be private. Provide a token with repo scope.';
  if (status === 404) return 'Org not found, or all repos are private.';
  return err.message;
}

export async function POST(req: NextRequest) {
  const { org, token } = await req.json();
  if (!org?.trim()) return NextResponse.json({ error: 'Missing org name' }, { status: 400 });

  const octokit = new Octokit(token ? { auth: token } : {});

  try {
    const { data } = await octokit.repos.listForOrg({
      org: org.trim(),
      sort: 'updated',
      per_page: 12,
      type: 'public',
    });

    const repos = data.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? '',
      url: r.html_url,
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      language: r.language ?? null,
      updatedAt: r.updated_at ?? '',
      isPrivate: r.private,
    }));

    return NextResponse.json({ repos });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}
