import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { Octokit } from '@octokit/rest';
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
      const octokit = new Octokit({ auth: token });

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

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.GITHUB_CLIENT_ID) {
    console.log(`⚠️  GitHub OAuth not configured. Running in demo mode.`);
  }
});

