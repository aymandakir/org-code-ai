import { Octokit } from '@octokit/rest';
import { NextRequest } from 'next/server';
import { analyzeContent } from '@/lib/heuristic';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.php',
  '.java', '.rb', '.go', '.rs', '.cs', '.cpp', '.c', '.vue', '.svelte',
]);

// Deprioritized paths — scan last
const LOW_PRIORITY = /node_modules|\.min\.|vendor|dist\/|build\/|\.d\.ts$|__pycache__|\.test\.|\.spec\.|fixture/i;
// Prioritized paths — scan first
const HIGH_PRIORITY = /(?:src|lib|server|api|routes|controllers|middleware|auth|utils|helpers)\//i;

function ext(path: string) {
  const i = path.lastIndexOf('.');
  return i === -1 ? '' : path.slice(i);
}

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
}

async function getFiles(octokit: Octokit, owner: string, repo: string, path = '', depth = 0): Promise<string[]> {
  if (depth > 4) return [];
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) return [];
    const files: string[] = [];
    for (const item of data) {
      if (item.type === 'file' && CODE_EXTENSIONS.has(ext(item.path)) && !LOW_PRIORITY.test(item.path)) {
        files.push(item.path);
      } else if (item.type === 'dir' && !item.path.startsWith('.') && !LOW_PRIORITY.test(item.path + '/')) {
        files.push(...await getFiles(octokit, owner, repo, item.path, depth + 1));
      }
    }
    return files;
  } catch {
    return [];
  }
}

function prioritizeFiles(files: string[]): string[] {
  const high = files.filter(f => HIGH_PRIORITY.test(f));
  const rest = files.filter(f => !HIGH_PRIORITY.test(f));
  return [...high, ...rest];
}

export async function POST(req: NextRequest) {
  const { org, repo, token } = await req.json();
  if (!org || !repo) return new Response('Missing org or repo', { status: 400 });

  const octokit = new Octokit(token ? { auth: token } : {});

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { type: 'progress', pct: 5, message: `Fetching file list for ${org}/${repo}…` });

        const allFiles = await getFiles(octokit, org, repo);
        const toScan = prioritizeFiles(allFiles).slice(0, 20);

        if (toScan.length === 0) {
          send(controller, { type: 'done', total: 0 });
          controller.close();
          return;
        }

        send(controller, { type: 'progress', pct: 15, message: `Found ${allFiles.length} files. Scanning ${toScan.length}…` });

        const results: object[] = [];

        for (let i = 0; i < toScan.length; i++) {
          const filePath = toScan[i];
          const pct = Math.round(15 + ((i + 1) / toScan.length) * 80);
          send(controller, { type: 'progress', pct, message: `Analyzing ${filePath}…` });

          try {
            const { data } = await octokit.repos.getContent({ owner: org, repo, path: filePath });
            if (Array.isArray(data) || data.type !== 'file') continue;

            let content = '';
            if (data.content) {
              content = Buffer.from(data.content, 'base64').toString('utf-8');
            } else if (data.download_url) {
              // Large file — fetch directly
              const res = await fetch(data.download_url);
              content = await res.text();
            }
            if (!content.trim()) continue;

            const vulns = analyzeContent(content);
            for (const v of vulns) {
              const row = { filePath, ...v };
              results.push(row);
              send(controller, { type: 'result', row });
            }
          } catch {
            continue;
          }
        }

        send(controller, { type: 'progress', pct: 100, message: 'Scan complete.' });
        send(controller, { type: 'done', total: results.length });
      } catch (err) {
        send(controller, { type: 'error', message: err instanceof Error ? err.message : 'Scan failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
