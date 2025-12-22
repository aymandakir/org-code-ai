import { Router } from 'express';
import { GitHubScanner } from '../services/github-scanner';
import { scanOrgQueue } from '../queue/scan-queue';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();

// Trigger organization scan (async via queue)
interface SessionData {
  githubToken?: string;
}

router.post('/scan/org/:orgName', async (req, res) => {
  try {
    const { orgName } = req.params;
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'GitHub token required for scanning',
      } as ApiResponse<null>);
    }

    if (!scanOrgQueue) {
      // Fallback to immediate scan if queue not available
      const scanner = new GitHubScanner(token);
      const result = await scanner.scanOrganization(orgName, { token, storeInDb: true });

      return res.json({
        success: true,
        data: {
          organizationId: result.organizationId,
          reposScanned: result.totalRepos,
          message: 'Scan completed immediately (queue not available)',
        },
      } as ApiResponse<{ organizationId: string; reposScanned: number; message: string }>);
    }

    // Add to job queue for async processing
    const job = await scanOrgQueue.add('scan-org', {
      orgName,
      token,
    });

    return res.json({
      success: true,
      data: {
        jobId: job.id,
        message: `Scan started for organization: ${orgName}`,
        status: 'processing',
      },
    } as ApiResponse<{ jobId: string; message: string; status: string }>);
  } catch (error: unknown) {
    console.error('Error starting scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start scan';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Get scan status
router.get('/scan/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!scanOrgQueue) {
      return res.status(503).json({
        success: false,
        error: 'Job queue not available',
      } as ApiResponse<null>);
    }

    const job = await scanOrgQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      } as ApiResponse<null>);
    }

    const state = await job.getState();

    return res.json({
      success: true,
      data: {
        id: job.id,
        status: state,
        progress: (job.progress as number) || 0,
        result: job.returnvalue,
        failedReason: job.failedReason,
      },
    } as ApiResponse<{
      id: string;
      status: string;
      progress: number;
      result: unknown;
      failedReason: string | undefined;
    }>);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get scan status';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Manual immediate scan (for testing)
router.post('/scan/org/:orgName/immediate', async (req, res) => {
  try {
    const { orgName } = req.params;
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'GitHub token required for scanning',
      } as ApiResponse<null>);
    }

    const scanner = new GitHubScanner(token);
    const result = await scanner.scanOrganization(orgName, { token, storeInDb: true });

    return res.json({
      success: true,
      data: {
        organizationId: result.organizationId,
        repositories: result.repos,
        count: result.totalRepos,
      },
    } as ApiResponse<{
      organizationId: string;
      repositories: unknown[];
      count: number;
    }>);
  } catch (error: unknown) {
    console.error('Error scanning organization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan organization';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

