import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { GitHubClient } from './github/client';
import type { ApiResponse } from '@org-code-ai/types';

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
    (req.session as any).githubToken = token;

    // Redirect to dashboard
    const redirectUrl = state && state !== 'default' ? decodeURIComponent(state) : 'http://localhost:3000/scan';
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'OAuth authentication failed',
    } as ApiResponse<null>);
  }
});

// Get organization repositories
app.get('/api/orgs/:orgName/repos', async (req, res) => {
  try {
    const { orgName } = req.params;
    const token = (req.session as any)?.githubToken || process.env.GITHUB_TOKEN;

    const client = new GitHubClient({ token: token || undefined });
    const repos = await client.getOrgRepos(orgName);

    const isDemoMode = !token && !process.env.GITHUB_TOKEN;

    res.json({
      success: true,
      data: repos,
      demoMode: isDemoMode,
      message: isDemoMode ? 'Using demo data. Connect GitHub App for real scans.' : undefined,
    } as ApiResponse<typeof repos>);
  } catch (error: any) {
    console.error('Error fetching org repos:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repositories',
    } as ApiResponse<null>);
  }
});

// Scan single repository
app.get('/api/repos/:owner/:repo/scan', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = (req.session as any)?.githubToken || process.env.GITHUB_TOKEN;

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
    } as ApiResponse<typeof files>);
  } catch (error: any) {
    console.error('Error scanning repo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan repository',
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan repository',
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

