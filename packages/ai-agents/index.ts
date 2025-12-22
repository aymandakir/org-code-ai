import OpenAI from 'openai';
import type { Finding, Pattern, PRContent, Repo } from '@org-code-ai/types';

// Agent 1: Code Scanner
export async function scanCodeForVulnerabilities(
  code: string,
  language: string,
  fileName: string
): Promise<Finding[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, returning empty findings');
    return [];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Analyze this ${language} code for security vulnerabilities:

File: ${fileName}
Code:
\`\`\`${language}
${code.slice(0, 8000)}
\`\`\`

Detect:
- SQL injection risks
- XSS vulnerabilities
- Hardcoded secrets/API keys
- Insecure dependencies
- Authentication bypasses
- CSRF vulnerabilities
- Path traversal issues
- Insecure random number generation
- Missing input validation
- Insecure deserialization

Return JSON object with "vulnerabilities" array. Each vulnerability should have:
- "type": string (e.g., "sql_injection", "xss", "hardcoded_secret")
- "severity": "low" | "medium" | "high" | "critical"
- "line": number (line number where issue occurs)
- "description": string (detailed explanation)
- "fix": string (suggested fix or mitigation)

Example format:
{
  "vulnerabilities": [
    {
      "type": "sql_injection",
      "severity": "high",
      "line": 42,
      "description": "User input directly concatenated into SQL query",
      "fix": "Use parameterized queries or prepared statements"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    const vulnerabilities = parsed.vulnerabilities || [];
    
    return vulnerabilities.map((v: any) => ({
      type: v.type || 'unknown',
      severity: v.severity || 'medium',
      line: v.line || 0,
      file: fileName,
      description: v.description || '',
      fix: v.fix || '',
      language: language,
    }));
  } catch (error: any) {
    console.error('Error scanning code for vulnerabilities:', error);
    throw new Error(`Vulnerability scan failed: ${error.message}`);
  }
}

// Agent 2: Pattern Detector (finds duplicated code across repos)
export async function detectCrossRepoPatterns(
  repos: Repo[]
): Promise<Pattern[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, returning empty patterns');
    return [];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Mock code snippets for pattern detection
  // In production, this would fetch actual file contents
  const codeSnippets = repos.slice(0, 10).flatMap((repo) => [
    {
      repo: repo.name,
      file: 'src/auth.js',
      code: '// Authentication logic placeholder',
    },
    {
      repo: repo.name,
      file: 'src/db.js',
      code: '// Database connection placeholder',
    },
  ]);

  const prompt = `Analyze these code snippets from ${repos.length} repositories. Find:

- Duplicated logic (copy-paste code)
- Similar vulnerability patterns
- Inconsistent implementations of same feature
- Shared dependencies with vulnerabilities

Code samples:
${JSON.stringify(codeSnippets.slice(0, 50), null, 2)}

Return JSON object with "patterns" array. Each pattern should have:
- "type": "duplicate" | "vulnerability" | "inconsistency"
- "repos": string[] (array of repo names)
- "description": string
- "impact": "low" | "medium" | "high"
- "affectedFiles": string[] (file paths)

Example format:
{
  "patterns": [
    {
      "type": "duplicate",
      "repos": ["repo1", "repo2"],
      "description": "Same authentication logic duplicated across repos",
      "impact": "high",
      "affectedFiles": ["src/auth.js", "src/auth.js"]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.patterns || [];
  } catch (error: any) {
    console.error('Error detecting patterns:', error);
    throw new Error(`Pattern detection failed: ${error.message}`);
  }
}

// Agent 3: Fix Generator
export async function generateFix(
  finding: Finding,
  code: string,
  language: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return code; // Return original code if no API key
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Generate a secure code fix:

Vulnerability: ${finding.type}
Severity: ${finding.severity}
Description: ${finding.description}
Line: ${finding.line}

Original code:
\`\`\`${language}
${code.slice(0, 4000)}
\`\`\`

Provide ONLY the fixed code (same language), no explanations, no markdown, just the code:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const fixedCode = response.choices[0]?.message?.content || code;
    // Clean up any markdown code blocks
    return fixedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
  } catch (error: any) {
    console.error('Error generating fix:', error);
    throw new Error(`Fix generation failed: ${error.message}`);
  }
}

// Agent 4: PR Generator
export async function generatePullRequest(
  findings: Finding[],
  fixes: Record<string, string>,
  repoName: string
): Promise<PRContent> {
  if (!process.env.OPENAI_API_KEY) {
    // Return default PR content if no API key
    return {
      title: `Security fixes for ${repoName}`,
      description: `Fixed ${findings.length} security vulnerabilities.`,
      commit_message: `fix: resolve ${findings.length} security vulnerabilities`,
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Generate a GitHub Pull Request for these security fixes:

Repository: ${repoName}
Findings: ${findings.length} vulnerabilities fixed
Details: ${JSON.stringify(findings.slice(0, 20), null, 2)}

Generate:
- PR title (concise, actionable, max 72 chars)
- PR description (markdown, explain fixes, list key vulnerabilities)
- Commit message (conventional commit format)

Return JSON object:
{
  "title": "...",
  "description": "...",
  "commit_message": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error generating PR:', error);
    // Fallback to default PR content
    return {
      title: `Security fixes for ${repoName}`,
      description: `Fixed ${findings.length} security vulnerabilities detected by AI analysis.`,
      commit_message: `fix: resolve ${findings.length} security vulnerabilities`,
    };
  }
}

// Legacy function for backward compatibility
export async function analyzeCode(
  repoName: string,
  codeContent: string,
  filePath: string,
  apiKey: string
): Promise<Finding[]> {
  const language = filePath.split('.').pop() || 'javascript';
  return scanCodeForVulnerabilities(codeContent, language, filePath);
}

