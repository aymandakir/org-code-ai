import { Octokit } from '@octokit/rest';
import { NextRequest } from 'next/server';

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
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(payload));
}

function friendlyGitHubError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error contacting GitHub.';
  const status = (err as { status?: number }).status;
  if (status === 401) return 'GitHub token is invalid or expired.';
  if (status === 403) {
    if (err.message.includes('rate limit')) {
      return 'GitHub rate limit exceeded. Add a token for higher limits, or try again later.';
    }
    return 'Access denied. This org may be private — provide a token with repo scope.';
  }
  if (status === 404) return 'Org not found, or all repos are private. Check the org name or add a token.';
  return err.message;
}

type Vuln = { type: string; severity: 'Critical' | 'High' | 'Medium' | 'Low'; description: string; fix: string };

const RULES: Array<{
  type: string;
  severity: Vuln['severity'];
  description: string;
  fix: string;
  pattern: RegExp;
  // optional: skip if this pattern also matches (reduces false positives)
  allowPattern?: RegExp;
}> = [
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /(?:password|passwd|secret|api_?key|auth_?token)\s*[:=]\s*['"][^'"]{6,}['"]/i,
    allowPattern: /process\.env|getenv|os\.environ|placeholder|example|changeme|your[_-]?/i,
    description: 'Hardcoded credential found in source code.',
    fix: 'Move to environment variable: process.env.SECRET_NAME',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}/,
    description: 'GitHub personal access token hardcoded in source.',
    fix: 'Revoke the token immediately and load from env var.',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /sk-[A-Za-z0-9]{32,}/,
    description: 'OpenAI API key hardcoded in source.',
    fix: 'Revoke and move to OPENAI_API_KEY env var.',
  },
  {
    type: 'SQL Injection',
    severity: 'High',
    pattern: /(?:query|execute|exec)\s*\(\s*[`"']\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)[^`"']*\$\{/i,
    description: 'User input interpolated directly into SQL query.',
    fix: 'Use parameterized queries or a prepared statement.',
  },
  {
    type: 'SQL Injection',
    severity: 'High',
    pattern: /(?:query|execute|exec)\s*\(\s*['"`]\s*(?:SELECT|INSERT|UPDATE|DELETE)[^'"`]*['"]\s*\+/i,
    description: 'SQL query built via string concatenation.',
    fix: 'Use parameterized queries or an ORM.',
  },
  {
    type: 'XSS',
    severity: 'High',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
    description: 'dangerouslySetInnerHTML used — potential XSS if value is user-controlled.',
    fix: 'Sanitize with DOMPurify before passing to __html.',
  },
  {
    type: 'XSS',
    severity: 'High',
    pattern: /document\.write\s*\(/,
    description: 'document.write() can introduce XSS with unsanitized input.',
    fix: 'Use DOM APIs (createElement, textContent) instead.',
  },
  {
    type: 'XSS',
    severity: 'Medium',
    pattern: /innerHTML\s*=\s*(?!['"`])/,
    description: 'innerHTML assigned a non-literal value — possible XSS.',
    fix: 'Use textContent or sanitize with DOMPurify.',
  },
  {
    type: 'Code Injection',
    severity: 'Critical',
    pattern: /\beval\s*\(/,
    allowPattern: /\/\/.*eval|#.*eval/,
    description: 'eval() executes arbitrary code — dangerous with user input.',
    fix: 'Remove eval(); use JSON.parse() or a safe alternative.',
  },
  {
    type: 'Code Injection',
    severity: 'High',
    pattern: /new\s+Function\s*\(/,
    description: 'new Function() is equivalent to eval — avoid with user input.',
    fix: 'Replace with a safe expression parser.',
  },
  {
    type: 'Path Traversal',
    severity: 'High',
    pattern: /(?:readFile|readFileSync|createReadStream|open)\s*\([^)]*(?:req\.|request\.|params\.|query\.)/,
    description: 'File path derived from request input — path traversal risk.',
    fix: 'Validate and sanitize path; use path.resolve() and check against allowed dir.',
  },
  {
    type: 'SSRF',
    severity: 'High',
    pattern: /(?:fetch|axios\.get|axios\.post|http\.get|https\.get)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'HTTP request URL derived from user input — SSRF risk.',
    fix: 'Validate URL against an allowlist before making the request.',
  },
  {
    type: 'Insecure Randomness',
    severity: 'Medium',
    pattern: /Math\.random\s*\(\s*\)/,
    description: 'Math.random() is not cryptographically secure.',
    fix: 'Use crypto.randomBytes() or crypto.getRandomValues() for security tokens.',
  },
  {
    type: 'Prototype Pollution',
    severity: 'High',
    pattern: /\[\s*['"]__proto__['"]\s*\]|Object\.assign\s*\(\s*(?:\{\}|target)/,
    description: 'Possible prototype pollution via dynamic property assignment.',
    fix: 'Use Object.create(null) for safe key-value maps; validate input keys.',
  },
  {
    type: 'Command Injection',
    severity: 'Critical',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.|\$\{)/,
    description: 'Shell command includes user-controlled input — command injection risk.',
    fix: 'Use execFile() with an argument array; never interpolate user input into shell strings.',
  },
  {
    type: 'Sensitive Data Exposure',
    severity: 'Medium',
    pattern: /console\.log\s*\([^)]*(?:password|token|secret|key|auth)/i,
    description: 'Sensitive value logged to console — may appear in server logs.',
    fix: 'Remove the log statement or redact the sensitive field.',
  },
  {
    type: 'Weak Cryptography',
    severity: 'Medium',
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i,
    description: 'MD5/SHA-1 are cryptographically broken for security use.',
    fix: 'Switch to SHA-256 or SHA-512: crypto.createHash("sha256").',
  },
  {
    type: 'Open Redirect',
    severity: 'Medium',
    pattern: /(?:res\.redirect|router\.push|window\.location)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'Redirect target derived from user input — open redirect risk.',
    fix: 'Validate redirect URL against an allowlist of trusted origins.',
  },
];

function analyzeFile(content: string, filePath: string): Vuln[] {
  const lines = content.split('\n');
  const found: Vuln[] = [];
  const seenTypes = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

    for (const rule of RULES) {
      if (seenTypes.has(rule.type)) continue;
      if (!rule.pattern.test(line)) continue;
      if (rule.allowPattern?.test(line)) continue;

      found.push({ type: rule.type, severity: rule.severity, description: rule.description, fix: rule.fix });
      seenTypes.add(rule.type);
    }
  }

  // Extra: flag files with >1 hardcoded-looking private key block
  if (/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(content)) {
    found.push({
      type: 'Hardcoded Secret',
      severity: 'Critical',
      description: 'Private key material embedded directly in source file.',
      fix: 'Remove the key from source; load from a secrets manager or env var.',
    });
  }

  void filePath; // used by caller for display; analysis is content-only
  return found.slice(0, 6);
}

async function getRepoFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  path = '',
  depth = 0,
): Promise<string[]> {
  if (depth > 3) return [];
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) return [];
    const files: string[] = [];
    for (const item of data) {
      if (item.type === 'file' && CODE_EXTENSIONS.has(ext(item.path))) {
        files.push(item.path);
      } else if (item.type === 'dir' && !item.path.includes('node_modules') && !item.path.startsWith('.')) {
        const sub = await getRepoFiles(octokit, owner, repo, item.path, depth + 1);
        files.push(...sub);
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

  if (!org) {
    return new Response('Missing org name', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Token is used only for this request and never stored or logged.
      const octokit = new Octokit(token ? { auth: token } : {});

      try {
        send(controller, { type: 'progress', pct: 5, message: `Fetching public repos for ${org}…` });

        let repos: Array<{ name: string }>;
        try {
          const { data } = await octokit.repos.listForOrg({
            org,
            sort: 'updated',
            per_page: 3,
            type: 'public',
          });
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

          send(controller, {
            type: 'progress',
            pct: Math.round(basePct),
            message: `Scanning ${repo.name}…`,
          });

          const files = await getRepoFiles(octokit, org, repo.name);
          const filesToScan = files.slice(0, 5);

          for (let fi = 0; fi < filesToScan.length; fi++) {
            const filePath = filesToScan[fi];
            send(controller, {
              type: 'progress',
              pct: Math.round(basePct + ((fi + 1) / filesToScan.length) * (70 / totalRepos)),
              message: `Analyzing ${repo.name}/${filePath}…`,
            });

            let content = '';
            try {
              const { data } = await octokit.repos.getContent({ owner: org, repo: repo.name, path: filePath });
              if (!Array.isArray(data) && data.type === 'file' && data.content) {
                content = Buffer.from(data.content, 'base64').toString('utf-8');
              }
            } catch {
              continue;
            }

            if (!content.trim()) continue;

            const vulns = analyzeFile(content, filePath);

            for (const v of vulns) {
              const row = { repo: repo.name, filePath, ...v };
              results.push(row);
              send(controller, { type: 'result', row });
            }
          }
        }

        send(controller, { type: 'progress', pct: 100, message: 'Scan complete.' });
        send(controller, { type: 'done', total: results.length });
      } catch (err: unknown) {
        send(controller, { type: 'error', message: friendlyGitHubError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
