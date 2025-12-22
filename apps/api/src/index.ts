import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
// import { Octokit } from '@octokit/rest'; // TODO: Use for actual PR creation
import { GitHubClient } from './github/client';
import {
  scanCodeForVulnerabilities,
  detectCrossRepoPatterns,
  generateFix,
  generatePullRequest,
} from '@org-code-ai/ai-agents';
import { fetchOrgRepos, fetchRepoFiles } from '@org-code-ai/graphql-client';
import type { ApiResponse, Finding, Pattern, RepoFile } from '@org-code-ai/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub OAuth - Initiate
app.get('/api/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback';
  const state = req.query.state as string || 'default';

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: 'GitHub OAuth not configured. Using demo mode.',
      demoMode: true,
    } as ApiResponse<null>);
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo&state=${state}`;
  res.redirect(githubAuthUrl);
});

// GitHub OAuth - Callback
app.get('/api/auth/github/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code not provided',
    } as ApiResponse<null>);
  }

  try {
    const client = new GitHubClient();
    const token = await client.authenticate(code);

    // Store token in session
    interface SessionData {
      githubToken?: string;
    }
    (req.session as SessionData).githubToken = token;

    // Redirect to dashboard
    const redirectUrl = state && state !== 'default' ? decodeURIComponent(state) : 'http://localhost:3000/scan';
    res.redirect(redirectUrl);
  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Get organization repositories
app.get('/api/orgs/:orgName/repos', async (req, res) => {
  try {
    const { orgName } = req.params;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    const client = new GitHubClient({ token: token || undefined });
    const repos = await client.getOrgRepos(orgName);

    const isDemoMode = !token && !process.env.GITHUB_TOKEN;

    res.json({
      success: true,
      data: repos,
      demoMode: isDemoMode,
      message: isDemoMode ? 'Using demo data. Connect GitHub App for real scans.' : undefined,
    } as ApiResponse<typeof repos>);
  } catch (error: unknown) {
    console.error('Error fetching org repos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repositories';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Scan single repository
app.get('/api/repos/:owner/:repo/scan', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    const client = new GitHubClient({ token: token || undefined });
    const files = await client.getRepoFiles(owner, repo);

    const isDemoMode = !token && !process.env.GITHUB_TOKEN;

    res.json({
      success: true,
      data: {
        files,
        totalFiles: files.length,
        languages: Array.from(new Set(files.map(f => f.name.split('.').pop() || '').filter(Boolean))),
      },
      demoMode: isDemoMode,
    } as ApiResponse<{ files: RepoFile[]; totalFiles: number; languages: string[] }>);
  } catch (error: unknown) {
    console.error('Error scanning repo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan repository';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Legacy endpoint for compatibility
app.post('/api/repos/:repoId/scan', async (req, res) => {
  try {
    const { repoId } = req.params;
    res.json({
      success: true,
      message: 'Use GET /api/repos/:owner/:repo/scan instead',
      repoId,
    } as ApiResponse<null>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan repository';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// AI Analysis endpoint
app.post('/api/repos/:owner/:repo/analyze', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
      } as ApiResponse<null>);
    }

    // Fetch repo files
    const files = token
      ? await fetchRepoFiles(owner, repo, token)
      : await fetchRepoFiles(owner, repo, '');

    // Mock file contents for demo (in production, fetch actual file contents)
    const filesWithContent = files.slice(0, 50).map((file) => ({
      ...file,
      content: file.type === 'file' ? `// Mock content for ${file.path}` : undefined,
      language: file.path.split('.').pop() || 'javascript',
    }));

    // Scan each file for vulnerabilities
    const allFindings: Finding[] = [];
    for (const file of filesWithContent) {
      if (file.type === 'file' && file.content) {
        try {
          const findings = await scanCodeForVulnerabilities(
            file.content,
            file.language || 'javascript',
            file.path
          );
          allFindings.push(...findings.map((f) => ({ ...f, file: file.path })));
        } catch (error: unknown) {
          console.error(`Error scanning ${file.path}:`, error);
          // Continue with other files
        }
      }
    }

    res.json({
      success: true,
      data: {
        findings: allFindings,
        scanned: filesWithContent.length,
        totalFiles: files.length,
      },
    } as ApiResponse<{ findings: Finding[]; scanned: number; totalFiles: number }>);
  } catch (error: unknown) {
    console.error('Error analyzing repo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Cross-repo pattern detection
app.post('/api/orgs/:orgName/analyze-patterns', async (req, res) => {
  try {
    const { orgName } = req.params;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
      } as ApiResponse<null>);
    }

    const repos = token
      ? await fetchOrgRepos(orgName, token)
      : await fetchOrgRepos(orgName, '');

    const patterns = await detectCrossRepoPatterns(repos);

    res.json({
      success: true,
      data: {
        patterns,
        reposAnalyzed: repos.length,
      },
    } as ApiResponse<{ patterns: Pattern[]; reposAnalyzed: number }>);
  } catch (error: unknown) {
    console.error('Error analyzing patterns:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze patterns';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Generate fix PR
app.post('/api/repos/:owner/:repo/create-fix-pr', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { findings } = req.body as { findings: Finding[] };
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'GitHub authentication required to create PRs',
      } as ApiResponse<null>);
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
      } as ApiResponse<null>);
    }

    if (!findings || findings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No findings provided',
      } as ApiResponse<null>);
    }

    // Generate fixes for each finding
    const fixes: Record<string, string> = {};
    const filesToFix = new Set(findings.map((f) => f.file));

    for (const filePath of filesToFix) {
      const fileFindings = findings.filter((f) => f.file === filePath);
      // Mock original code (in production, fetch from GitHub)
      const originalCode = `// Original code for ${filePath}\n// TODO: Fetch actual file content`;
      const language = filePath.split('.').pop() || 'javascript';

      // Generate fix for the first finding in this file
      if (fileFindings.length > 0) {
        try {
          const fixedCode = await generateFix(fileFindings[0], originalCode, language);
          fixes[filePath] = fixedCode;
        } catch (error: unknown) {
          console.error(`Error generating fix for ${filePath}:`, error);
        }
      }
    }

    // Generate PR content
    const prContent = await generatePullRequest(findings, fixes, repo);

    // Create PR via GitHub API
    try {
      // const octokit = new Octokit({ auth: token });
      // TODO: Use octokit to create actual PR in production

      // Note: In production, you'd need to:
      // 1. Create a branch
      // 2. Commit the fixes
      // 3. Push the branch
      // 4. Create the PR
      // For now, we'll return the PR content that would be created

      res.json({
        success: true,
        data: {
          pr: {
            title: prContent.title,
            body: prContent.description,
            commit_message: prContent.commit_message,
            html_url: `https://github.com/${owner}/${repo}/compare/main...org-code-ai-fixes`,
            number: Math.floor(Math.random() * 1000), // Mock PR number
          },
          fixes: Object.keys(fixes).length,
          message: 'PR content generated. In production, this would create an actual PR.',
        },
      } as ApiResponse<{
        pr: {
          title: string;
          body: string;
          commit_message: string;
          html_url: string;
          number: number;
        };
        fixes: number;
        message: string;
      }>);
    } catch (error: unknown) {
      console.error('Error creating PR:', error);
      // Return PR content even if PR creation fails
      res.json({
        success: true,
        data: {
          pr: {
            title: prContent.title,
            body: prContent.description,
            commit_message: prContent.commit_message,
            html_url: null,
          },
          fixes: Object.keys(fixes).length,
          message: 'PR content generated but PR creation failed. Check GitHub token permissions.',
        },
      } as ApiResponse<{
        pr: {
          title: string;
          body: string;
          commit_message: string;
          html_url: null;
        };
        fixes: number;
        message: string;
      }>);
    }
  } catch (error: unknown) {
    console.error('Error creating fix PR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create fix PR';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// ============================================
// VULNERABILITIES API
// ============================================

// Get all vulnerabilities (with filters)
app.get('/api/vulnerabilities', async (req, res) => {
  try {
    const { severity, type, repoId, resolved } = req.query;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    // Mock vulnerabilities for demo
    const mockVulnerabilities: Finding[] = [
      {
        id: '1',
        type: 'SQL_INJECTION',
        severity: 'critical',
        line: 42,
        file: 'api/users.ts',
        description: 'SQL injection vulnerability in user query. User input is directly concatenated into SQL query.',
        fix: 'Use parameterized queries or prepared statements',
        language: 'TypeScript',
      },
      {
        id: '2',
        type: 'XSS',
        severity: 'high',
        line: 128,
        file: 'components/Form.tsx',
        description: 'Cross-site scripting vulnerability. User input is rendered without sanitization.',
        fix: 'Sanitize user input or use React\'s built-in XSS protection',
        language: 'TypeScript',
      },
      {
        id: '3',
        type: 'SECRET_LEAK',
        severity: 'critical',
        line: 15,
        file: 'config/db.ts',
        description: 'Hardcoded database password found in source code.',
        fix: 'Move secrets to environment variables or secret management service',
        language: 'TypeScript',
      },
      {
        id: '4',
        type: 'CSRF',
        severity: 'medium',
        line: 89,
        file: 'routes/auth.ts',
        description: 'Missing CSRF protection on state-changing operations.',
        fix: 'Implement CSRF tokens for all POST/PUT/DELETE requests',
        language: 'TypeScript',
      },
      {
        id: '5',
        type: 'PATH_TRAVERSAL',
        severity: 'high',
        line: 56,
        file: 'utils/file.ts',
        description: 'Path traversal vulnerability. User input used in file path without validation.',
        fix: 'Validate and sanitize file paths, use path.join() and restrict to allowed directories',
        language: 'TypeScript',
      },
    ];

    let filtered = [...mockVulnerabilities];

    if (severity) {
      filtered = filtered.filter((v) => v.severity === severity);
    }
    if (type) {
      filtered = filtered.filter((v) => v.type === type);
    }
    if (resolved === 'false' || resolved === 'true') {
      // In real implementation, check isResolved field
    }

    res.json({
      success: true,
      data: filtered,
      demoMode: !token && !process.env.GITHUB_TOKEN,
    } as ApiResponse<Finding[]>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vulnerabilities';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Get vulnerability by ID
app.get('/api/vulnerabilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Mock single vulnerability
    const vulnerability: Finding = {
      id,
      type: 'SQL_INJECTION',
      severity: 'critical',
      line: 42,
      file: 'api/users.ts',
      description: 'SQL injection vulnerability in user query. User input is directly concatenated into SQL query.',
      fix: 'Use parameterized queries or prepared statements',
      language: 'TypeScript',
    };

    res.json({
      success: true,
      data: vulnerability,
    } as ApiResponse<Finding>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vulnerability';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// ============================================
// PULL REQUESTS API
// ============================================

// Get all fix PRs
app.get('/api/pull-requests', async (req, res) => {
  try {
    const { status, repoId } = req.query;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    // Mock PRs for demo
    const mockPRs = [
      {
        id: '1',
        repositoryId: '1',
        repositoryName: 'api-gateway',
        prUrl: 'https://github.com/stephdl/api-gateway/pull/123',
        branchName: 'fix/sql-injection-users',
        prNumber: 123,
        title: 'Fix SQL injection vulnerability in user query',
        description: 'Replaced string concatenation with parameterized queries to prevent SQL injection attacks.',
        commitMessage: 'fix: use parameterized queries in user endpoint',
        commitSha: 'abc123def456',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        mergedAt: null,
        rejectedAt: null,
        vulnerabilitiesFixed: ['1'],
      },
      {
        id: '2',
        repositoryId: '2',
        repositoryName: 'auth-service',
        prUrl: 'https://github.com/stephdl/auth-service/pull/45',
        branchName: 'fix/xss-form-component',
        prNumber: 45,
        title: 'Fix XSS vulnerability in form component',
        description: 'Added input sanitization to prevent cross-site scripting attacks.',
        commitMessage: 'fix: sanitize user input in form component',
        commitSha: 'def456ghi789',
        status: 'merged',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        mergedAt: new Date(Date.now() - 86400000).toISOString(),
        rejectedAt: null,
        vulnerabilitiesFixed: ['2'],
      },
      {
        id: '3',
        repositoryId: '3',
        repositoryName: 'frontend-app',
        prUrl: 'https://github.com/stephdl/frontend-app/pull/78',
        branchName: 'fix/secret-leak-config',
        prNumber: 78,
        title: 'Move hardcoded secrets to environment variables',
        description: 'Removed hardcoded database password and moved to environment variables.',
        commitMessage: 'fix: move secrets to env variables',
        commitSha: 'ghi789jkl012',
        status: 'open',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        mergedAt: null,
        rejectedAt: null,
        vulnerabilitiesFixed: ['3'],
      },
    ];

    let filtered = [...mockPRs];

    if (status) {
      filtered = filtered.filter((pr) => pr.status === status);
    }
    if (repoId) {
      filtered = filtered.filter((pr) => pr.repositoryId === repoId);
    }

    res.json({
      success: true,
      data: filtered,
      demoMode: !token && !process.env.GITHUB_TOKEN,
    } as ApiResponse<typeof mockPRs>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pull requests';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// ============================================
// SECURITY SCORES API
// ============================================

// Get security scores
app.get('/api/security-scores', async (req, res) => {
  try {
    const { orgId, repoId } = req.query;
    interface SessionData {
      githubToken?: string;
    }
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    // Mock security scores
    const mockScores = repoId
      ? {
          repositoryId: repoId,
          repositoryName: 'api-gateway',
          score: 82,
          breakdown: {
            baseScore: 100,
            critical: -15,
            high: -3,
            medium: 0,
            low: 0,
          },
          trend: [
            { date: '2024-01-01', score: 75 },
            { date: '2024-01-15', score: 78 },
            { date: '2024-02-01', score: 80 },
            { date: '2024-02-15', score: 82 },
          ],
          topRisks: [
            { type: 'SQL_INJECTION', count: 2, severity: 'critical' },
            { type: 'XSS', count: 1, severity: 'high' },
          ],
        }
      : {
          organizationId: orgId || 'stephdl',
          organizationName: 'stephdl',
          overallScore: 78,
          repositoryScores: [
            { id: '1', name: 'api-gateway', score: 82, trend: 'up' },
            { id: '2', name: 'auth-service', score: 85, trend: 'up' },
            { id: '3', name: 'frontend-app', score: 75, trend: 'down' },
            { id: '4', name: 'ns8-lamp', score: 70, trend: 'stable' },
            { id: '5', name: 'database-migrations', score: 90, trend: 'up' },
            { id: '6', name: 'monitoring-dashboard', score: 88, trend: 'up' },
          ],
          summary: {
            totalRepos: 6,
            totalVulnerabilities: 47,
            critical: 12,
            high: 15,
            medium: 12,
            low: 8,
          },
        };

    res.json({
      success: true,
      data: mockScores,
      demoMode: !token && !process.env.GITHUB_TOKEN,
    } as ApiResponse<typeof mockScores>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch security scores';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.GITHUB_CLIENT_ID) {
    console.log(`⚠️  GitHub OAuth not configured. Running in demo mode.`);
  }
});

