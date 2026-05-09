import { Octokit } from '@octokit/rest';
import { NextRequest } from 'next/server';
import { analyzeContent } from '@/lib/heuristic';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.php',
  '.java', '.rb', '.go', '.rs', '.cs', '.cpp', '.c',
]);

function ext(path: string) {
  const i = path.lastIndexOf('.');
  return i === -1 ? '' : path.slice(i);
}

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
}

function friendlyGitHubError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error contacting GitHub.';
  const status = (err as { status?: number }).status;
  if (status === 401) return 'GitHub token is invalid or expired.';
  if (status === 403) return err.message.includes('rate limit')
    ? 'GitHub rate limit exceeded. Add a token for higher limits, or try again later.'
    : 'Access denied. This org may be private — provide a token with repo scope.';
  if (status === 404) return 'Org not found, or all repos are private. Check the org name or add a token.';
  return err.message;
}

async function getRepoFiles(octokit: Octokit, owner: string, repo: string, path = '', depth = 0): Promise<string[]> {
  if (depth > 3) return [];
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) return [];
    const files: string[] = [];
    for (const item of data) {
      if (item.type === 'file' && CODE_EXTENSIONS.has(ext(item.path))) {
        files.push(item.path);
      } else if (item.type === 'dir' && !item.path.includes('node_modules') && !item.path.startsWith('.')) {
        files.push(...await getRepoFiles(octokit, owner, repo, item.path, depth + 1));
      }
    }
    return files;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const org: string = (body.org ?? '').trim();
  const token: string = (body.token ?? '').trim();

  if (!org) return new Response('Missing org name', { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const octokit = new Octokit(token ? { auth: token } : {});

      try {
        send(controller, { type: 'progress', pct: 5, message: `Fetching public repos for ${org}…` });

        let repos: Array<{ name: string }>;
        try {
          const { data } = await octokit.repos.listForOrg({ org, sort: 'updated', per_page: 3, type: 'public' });
          repos = data.slice(0, 3);
        } catch (err) {
          send(controller, { type: 'error', message: friendlyGitHubError(err) });
          controller.close();
          return;
        }

        if (repos.length === 0) {
          send(controller, { type: 'error', message: 'No public repositories found for this org.' });
          controller.close();
          return;
        }

        send(controller, { type: 'progress', pct: 15, message: `Found ${repos.length} repos. Fetching files…` });

        const results: object[] = [];
        const totalRepos = repos.length;

        for (let ri = 0; ri < totalRepos; ri++) {
          const repo = repos[ri];
          const basePct = 15 + (ri / totalRepos) * 70;
          send(controller, { type: 'progress', pct: Math.round(basePct), message: `Scanning ${repo.name}…` });

          const files = await getRepoFiles(octokit, org, repo.name);
          const filesToScan = files.slice(0, 5);

          for (let fi = 0; fi < filesToScan.length; fi++) {
            const filePath = filesToScan[fi];
            send(controller, {
              type: 'progress',
              pct: Math.round(basePct + ((fi + 1) / filesToScan.length) * (70 / totalRepos)),
              message: `Analyzing ${repo.name}/${filePath}…`,
            });

            try {
              const { data } = await octokit.repos.getContent({ owner: org, repo: repo.name, path: filePath });
              if (Array.isArray(data) || data.type !== 'file' || !data.content) continue;
              const content = Buffer.from(data.content, 'base64').toString('utf-8');
              if (!content.trim()) continue;

              const vulns = analyzeContent(content);
              for (const v of vulns) {
                const row = { repo: repo.name, filePath, ...v };
                results.push(row);
                send(controller, { type: 'result', row });
              }
            } catch {
              continue;
            }
          }
        }

        send(controller, { type: 'progress', pct: 100, message: 'Scan complete.' });
        send(controller, { type: 'done', total: results.length });
      } catch (err) {
        send(controller, { type: 'error', message: friendlyGitHubError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
