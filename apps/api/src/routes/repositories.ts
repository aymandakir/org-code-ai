import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();

// Repository analysis endpoint
router.get('/repositories/:owner/:repo/analysis', async (req, res) => {
  try {
    const { owner, repo } = req.params;

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        organization: { login: owner },
      },
      include: {
        organization: true,
        vulnerabilities: {
          where: { isResolved: false },
          orderBy: { severity: 'desc' },
        },
        securityScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        pullRequestFixes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found',
      } as ApiResponse<null>);
    }

    // Calculate repository-specific metrics
    const affectedFiles = new Set(repository.vulnerabilities.map((v: { filePath: string }) => v.filePath)).size;

    // Language breakdown
    const languageStats = await prisma.vulnerability.groupBy({
      by: ['language'],
      where: {
        repositoryId: repository.id,
      },
      _count: true,
    });

    const languageBreakdown = languageStats.map((stat: { language: string | null; _count: number }) => ({
      language: stat.language || 'Unknown',
      count: stat._count,
    }));

    res.json({
      success: true,
      data: {
        repository: {
          id: repository.id,
          name: repository.name,
          fullName: repository.fullName,
          url: repository.url,
          description: repository.description,
          language: repository.language,
          stars: repository.stars,
          forks: repository.forks,
          isPrivate: repository.isPrivate,
        },
        metrics: {
          totalVulnerabilities: repository.vulnerabilities.length,
          affectedFiles,
          securityScore: repository.securityScores[0]?.score || 0,
          lastScanAt: repository.scans[0]?.startedAt || null,
          openPRs: repository.pullRequestFixes.filter((pr: { status: string }) => pr.status === 'open').length,
          languageBreakdown,
        },
        vulnerabilities: repository.vulnerabilities,
        recentPRs: repository.pullRequestFixes,
      },
    } as ApiResponse<{
      repository: {
        id: string;
        name: string;
        fullName: string;
        url: string;
        description: string | null;
        language: string | null;
        stars: number;
        forks: number;
        isPrivate: boolean;
      };
      metrics: {
        totalVulnerabilities: number;
        affectedFiles: number;
        securityScore: number;
        lastScanAt: Date | null;
        openPRs: number;
        languageBreakdown: Array<{ language: string; count: number }>;
      };
      vulnerabilities: unknown[];
      recentPRs: unknown[];
    }>);
  } catch (error: unknown) {
    console.error('Error fetching repository analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repository analysis';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

