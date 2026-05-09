export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Vuln {
  type: string;
  severity: Severity;
  description: string;
  fix: string;
}

const RULES: Array<{
  type: string;
  severity: Severity;
  description: string;
  fix: string;
  pattern: RegExp;
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
    pattern: /\[\s*['"]__proto__['"]\s*\]/,
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

export function analyzeContent(content: string): Vuln[] {
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

  if (/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(content)) {
    found.push({
      type: 'Hardcoded Secret',
      severity: 'Critical',
      description: 'Private key material embedded directly in source file.',
      fix: 'Remove the key from source; load from a secrets manager or env var.',
    });
  }

  return found.slice(0, 6);
}
