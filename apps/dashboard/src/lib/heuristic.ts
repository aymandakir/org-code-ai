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
  // Hardcoded secrets
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /(?:password|passwd|secret|api_?key|auth_?token|private_?key)\s*[:=]\s*['"][^'"]{6,}['"]/i,
    allowPattern: /process\.env|getenv|os\.environ|placeholder|example|changeme|your[_\-]|<.*>/i,
    description: 'Hardcoded credential found in source code.',
    fix: 'Move to environment variable: process.env.SECRET_NAME',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}/,
    description: 'GitHub personal access token hardcoded in source.',
    fix: 'Revoke immediately and load from env var.',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /sk-[A-Za-z0-9]{32,}/,
    description: 'OpenAI API key hardcoded in source.',
    fix: 'Revoke and move to OPENAI_API_KEY env var.',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'Critical',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
    description: 'Private key material embedded in source file.',
    fix: 'Remove key from source; use a secrets manager.',
  },
  {
    type: 'Hardcoded Secret',
    severity: 'High',
    pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/,
    description: 'Possible AWS access key ID found in source.',
    fix: 'Rotate the key and move to AWS Secrets Manager or env var.',
  },
  // SQL Injection
  {
    type: 'SQL Injection',
    severity: 'High',
    pattern: /(?:query|execute|exec|db\.run|connection\.query)\s*\(\s*[`"']\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)[^`"']*\$\{/i,
    description: 'User input interpolated directly into SQL query.',
    fix: 'Use parameterized queries: db.query("SELECT * WHERE id = ?", [id])',
  },
  {
    type: 'SQL Injection',
    severity: 'High',
    pattern: /(?:query|execute|exec)\s*\(\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE).*['"]\s*\+\s*\w/i,
    description: 'SQL query built via string concatenation.',
    fix: 'Use parameterized queries or an ORM.',
  },
  {
    type: 'SQL Injection',
    severity: 'High',
    pattern: /f['"]\s*(?:SELECT|INSERT|UPDATE|DELETE)[^'"]*\{/i,
    description: 'Python f-string used to build SQL — injection risk.',
    fix: 'Use cursor.execute() with parameter tuple instead.',
  },
  // XSS
  {
    type: 'XSS',
    severity: 'High',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{/,
    description: 'dangerouslySetInnerHTML — XSS risk if value is user-controlled.',
    fix: 'Sanitize with DOMPurify before passing to __html.',
  },
  {
    type: 'XSS',
    severity: 'High',
    pattern: /document\.write\s*\(/,
    description: 'document.write() with unsanitized input enables XSS.',
    fix: 'Use DOM APIs (createElement, textContent) instead.',
  },
  {
    type: 'XSS',
    severity: 'Medium',
    pattern: /\.innerHTML\s*=/,
    allowPattern: /=\s*['"`][^$]/,
    description: 'innerHTML assigned a dynamic value — possible XSS.',
    fix: 'Use textContent for plain text, or sanitize with DOMPurify.',
  },
  {
    type: 'XSS',
    severity: 'Medium',
    pattern: /\.outerHTML\s*=/,
    description: 'outerHTML assigned dynamically — possible XSS.',
    fix: 'Use DOM APIs or sanitize input with DOMPurify.',
  },
  // Code / Command Injection
  {
    type: 'Code Injection',
    severity: 'Critical',
    pattern: /\beval\s*\(/,
    allowPattern: /\/\/.*eval|evalsha|geteval/i,
    description: 'eval() executes arbitrary code — dangerous with user input.',
    fix: 'Remove eval(); use JSON.parse() or a safe parser.',
  },
  {
    type: 'Code Injection',
    severity: 'High',
    pattern: /new\s+Function\s*\(/,
    description: 'new Function() is equivalent to eval.',
    fix: 'Replace with a safe expression evaluator.',
  },
  {
    type: 'Command Injection',
    severity: 'Critical',
    pattern: /(?:exec|execSync|spawn|spawnSync|shell_exec|system|popen)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.|\$_GET|\$_POST|\$\{)/,
    description: 'Shell command includes user-controlled input — RCE risk.',
    fix: 'Use execFile() with argument array; never interpolate user input.',
  },
  {
    type: 'Command Injection',
    severity: 'High',
    pattern: /child_process.*exec\s*\(`[^`]*\$\{/,
    description: 'Template literal in exec() — command injection risk.',
    fix: 'Use execFile() with a separate args array.',
  },
  // Path Traversal
  {
    type: 'Path Traversal',
    severity: 'High',
    pattern: /(?:readFile|readFileSync|createReadStream|open|unlink)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'File path derived from request — path traversal risk.',
    fix: 'Validate path with path.resolve() and check against allowed base dir.',
  },
  // SSRF
  {
    type: 'SSRF',
    severity: 'High',
    pattern: /(?:fetch|axios\.get|axios\.post|axios\.request|http\.get|https\.get|request\()\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'HTTP request URL derived from user input — SSRF risk.',
    fix: 'Validate URL against an allowlist of trusted domains.',
  },
  // Insecure transport
  {
    type: 'Insecure Transport',
    severity: 'Medium',
    pattern: /(?:fetch|axios\.get|axios\.post|XMLHttpRequest)\s*\(\s*['"]http:\/\//,
    allowPattern: /localhost|127\.0\.0\.1|0\.0\.0\.0/,
    description: 'HTTP (not HTTPS) used for external request.',
    fix: 'Switch to HTTPS for all external requests.',
  },
  // Cryptography
  {
    type: 'Weak Cryptography',
    severity: 'High',
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i,
    description: 'MD5/SHA-1 are broken for security-sensitive hashing.',
    fix: 'Use SHA-256 or bcrypt: crypto.createHash("sha256")',
  },
  {
    type: 'Weak Cryptography',
    severity: 'Medium',
    pattern: /createCipher\s*\(/,
    description: 'createCipher() is deprecated — does not use a random IV.',
    fix: 'Use createCipheriv() with a random IV instead.',
  },
  {
    type: 'Insecure Randomness',
    severity: 'Medium',
    pattern: /Math\.random\s*\(\s*\)/,
    allowPattern: /\/\/|color|position|animation|delay|offset|canvas|test|example|mock|demo/i,
    description: 'Math.random() is not cryptographically secure.',
    fix: 'Use crypto.randomBytes() or crypto.getRandomValues() for tokens.',
  },
  // Auth
  {
    type: 'JWT Misconfiguration',
    severity: 'High',
    pattern: /jwt\.sign\s*\([^)]+\)/,
    allowPattern: /expiresIn|exp:/,
    description: 'JWT signed without expiry — tokens never expire.',
    fix: 'Add expiresIn: jwt.sign(payload, secret, { expiresIn: "1h" })',
  },
  {
    type: 'Auth Bypass',
    severity: 'High',
    pattern: /jwt\.verify\s*\([^)]*,\s*(?:null|undefined|''|"")/,
    description: 'JWT verified with null secret — signature not checked.',
    fix: 'Always verify with a strong secret from env var.',
  },
  {
    type: 'Insecure Cookie',
    severity: 'Medium',
    pattern: /(?:res\.cookie|cookie\.set)\s*\([^)]*\)/,
    allowPattern: /httpOnly|secure|sameSite/i,
    description: 'Cookie set without httpOnly/secure/sameSite flags.',
    fix: 'Add: res.cookie(name, val, { httpOnly: true, secure: true, sameSite: "strict" })',
  },
  // Sensitive data
  {
    type: 'Sensitive Data Exposure',
    severity: 'Medium',
    pattern: /console\.(?:log|warn|error|info)\s*\([^)]*(?:password|token|secret|key|auth|ssn|credit)/i,
    description: 'Sensitive data logged to console — may appear in server logs.',
    fix: 'Remove the log statement or redact the sensitive field.',
  },
  {
    type: 'Sensitive Data Exposure',
    severity: 'Low',
    pattern: /(?:localStorage|sessionStorage)\.setItem\s*\([^)]*(?:token|password|secret|key)/i,
    description: 'Sensitive data stored in localStorage — accessible via XSS.',
    fix: 'Use httpOnly cookies or in-memory storage for sensitive tokens.',
  },
  // Injection / Pollution
  {
    type: 'Prototype Pollution',
    severity: 'High',
    pattern: /\[\s*['"]__proto__['"]\s*\]|Object\.assign\s*\(\s*\w+,\s*(?:req|body|params)/,
    description: 'Possible prototype pollution via dynamic property merge.',
    fix: 'Use Object.create(null) maps; validate all merged objects.',
  },
  {
    type: 'ReDoS',
    severity: 'Medium',
    pattern: /new RegExp\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'RegExp built from user input — ReDoS risk.',
    fix: 'Validate and sanitize input before using in RegExp constructor.',
  },
  // Misconfiguration
  {
    type: 'CORS Misconfiguration',
    severity: 'High',
    pattern: /cors\s*\(\s*\{[^}]*origin\s*:\s*['"]\*['"]/,
    description: 'CORS wildcard origin — any site can make requests.',
    fix: 'Restrict origin: cors({ origin: "https://yourdomain.com" })',
  },
  {
    type: 'Open Redirect',
    severity: 'Medium',
    pattern: /(?:res\.redirect|router\.push|window\.location(?:\.href)?\s*=)\s*[^'"]*(?:req\.|request\.|params\.|query\.|body\.)/,
    description: 'Redirect target derived from user input — open redirect risk.',
    fix: 'Validate redirect URL against allowlisted paths.',
  },
  {
    type: 'Hardcoded IP',
    severity: 'Low',
    pattern: /['"](?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?['"]/,
    allowPattern: /localhost|127\.0\.0|0\.0\.0\.0|192\.168\.|10\.\d|172\.\d/,
    description: 'Public IP address hardcoded — use environment variable.',
    fix: 'Replace with process.env.API_HOST or a config variable.',
  },
];

export function analyzeContent(content: string): Vuln[] {
  const lines = content.split('\n');
  const found: Vuln[] = [];
  const seenTypes = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    for (const rule of RULES) {
      if (seenTypes.has(rule.type)) continue;
      if (!rule.pattern.test(line)) continue;
      if (rule.allowPattern?.test(line)) continue;
      found.push({ type: rule.type, severity: rule.severity, description: rule.description, fix: rule.fix });
      seenTypes.add(rule.type);
    }
  }

  return found.slice(0, 8);
}
