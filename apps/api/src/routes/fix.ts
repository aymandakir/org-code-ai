import { Router } from 'express';
import { PRGenerator } from '../services/pr-generator';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();

interface SessionData {
  githubToken?: string;
}

router.post('/vulnerabilities/:id/fix', async (req, res) => {
  try {
    const { id } = req.params;
    const token = (req.session as SessionData)?.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'GitHub token required to create PRs',
      } as ApiResponse<null>);
    }

    const prGenerator = new PRGenerator(token);
    const pr = await prGenerator.createFixPR({
      vulnerabilityId: id,
      token,
    });

    return res.json({
      success: true,
      data: {
        pr: {
          url: pr.prUrl,
          number: pr.prNumber,
          branchName: pr.branchName,
        },
      },
    } as ApiResponse<{
      pr: {
        url: string;
        number: number;
        branchName: string;
      };
    }>);
  } catch (error: unknown) {
    console.error('Error creating fix PR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create fix PR';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

