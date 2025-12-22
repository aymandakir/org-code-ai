import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();

// Dashboard overview endpoint
router.get('/dashboard/overview', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    // Get current month date range
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Total repositories
    const totalRepos = await prisma.repository.count({
      where: { organizationId: orgId },
    });

    // Repos added this month
    const reposThisMonth = await prisma.repository.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: firstDayThisMonth },
      },
    });

    // Total vulnerabilities by severity
    const vulnerabilities = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: {
        repository: { organizationId: orgId },
        isResolved: false,
      },
      _count: true,
    });

    const vulnStats = {
      total: vulnerabilities.reduce((sum, v) => sum + v._count, 0),
      critical: vulnerabilities.find((v) => v.severity === 'CRITICAL')?._count || 0,
      high: vulnerabilities.find((v) => v.severity === 'HIGH')?._count || 0,
      medium: vulnerabilities.find((v) => v.severity === 'MEDIUM')?._count || 0,
      low: vulnerabilities.find((v) => v.severity === 'LOW')?._count || 0,
    };

    // New vulnerabilities this month
    const newVulnsThisMonth = await prisma.vulnerability.count({
      where: {
        repository: { organizationId: orgId },
        createdAt: { gte: firstDayThisMonth },
      },
    });

    // Average security score (current)
    const currentScores = await prisma.securityScore.findMany({
      where: {
        repository: { organizationId: orgId },
        createdAt: { gte: firstDayThisMonth },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['repositoryId'],
      select: { score: true },
    });

    // Get latest score per repository
    const reposWithScores = await prisma.repository.findMany({
      where: { organizationId: orgId },
      include: {
        securityScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const avgScore =
      reposWithScores.length > 0
        ? Math.round(
            reposWithScores
              .filter((r) => r.securityScores.length > 0)
              .reduce((sum, r) => sum + (r.securityScores[0]?.score || 0), 0) /
              reposWithScores.filter((r) => r.securityScores.length > 0).length || 1
          )
        : 0;

    // Previous month average for trend
    const previousScores = await prisma.securityScore.findMany({
      where: {
        repository: { organizationId: orgId },
        createdAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['repositoryId'],
      select: { score: true },
    });

    const prevAvgScore =
      previousScores.length > 0
        ? Math.round(previousScores.reduce((sum, s) => sum + s.score, 0) / previousScores.length)
        : avgScore;

    const scoreChange = avgScore - prevAvgScore;
    const scoreChangePercent = prevAvgScore > 0 ? Math.round((scoreChange / prevAvgScore) * 100) : 0;

    res.json({
      success: true,
      data: {
        repositories: {
          total: totalRepos,
          addedThisMonth: reposThisMonth,
          change: reposThisMonth > 0 ? `+${reposThisMonth} this month` : 'No change',
        },
        vulnerabilities: {
          ...vulnStats,
          addedThisMonth: newVulnsThisMonth,
          change: `${newVulnsThisMonth} new this month`,
        },
        securityScore: {
          current: avgScore,
          previous: prevAvgScore,
          change: scoreChange,
          changePercent: scoreChangePercent,
          trend: scoreChange >= 0 ? 'up' : 'down',
          display: scoreChange >= 0 ? `+${scoreChangePercent}%` : `${scoreChangePercent}%`,
        },
      },
    } as ApiResponse<{
      repositories: { total: number; addedThisMonth: number; change: string };
      vulnerabilities: typeof vulnStats & { addedThisMonth: number; change: string };
      securityScore: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
        trend: 'up' | 'down';
        display: string;
      };
    }>);
  } catch (error: unknown) {
    console.error('Error fetching dashboard overview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

