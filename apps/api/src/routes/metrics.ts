import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();

// Mean Time To Fix (MTTF)
router.get('/metrics/mttf', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    // Calculate average time from vulnerability discovery to fix PR merge
    const fixedVulns = await prisma.vulnerability.findMany({
      where: {
        repository: { organizationId: orgId },
        isResolved: true,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
        severity: true,
      },
    });

    const mttfBySeverity: Record<string, number[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    fixedVulns.forEach((vuln: { resolvedAt: Date | null; createdAt: Date; severity: string }) => {
      if (vuln.resolvedAt) {
        const timeDiff = vuln.resolvedAt.getTime() - vuln.createdAt.getTime();
        const hours = timeDiff / (1000 * 60 * 60);
        const severity = vuln.severity.toUpperCase();
        if (mttfBySeverity[severity]) {
          mttfBySeverity[severity].push(hours);
        }
      }
    });

    const calculateAvg = (arr: number[]): number =>
      arr.length > 0 ? arr.reduce((sum: number, v: number) => sum + v, 0) / arr.length : 0;

    const allTimes = Object.values(mttfBySeverity).flat();

    res.json({
      success: true,
      data: {
        overall: calculateAvg(allTimes),
        bySeverity: {
          critical: calculateAvg(mttfBySeverity.CRITICAL),
          high: calculateAvg(mttfBySeverity.HIGH),
          medium: calculateAvg(mttfBySeverity.MEDIUM),
          low: calculateAvg(mttfBySeverity.LOW),
        },
        unit: 'hours',
      },
    } as ApiResponse<{
      overall: number;
      bySeverity: { critical: number; high: number; medium: number; low: number };
      unit: string;
    }>);
  } catch (error: unknown) {
    console.error('Error calculating MTTF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate MTTF';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Vulnerability Density (Vulns per 1000 lines of code)
router.get('/metrics/density', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    const repos = await prisma.repository.findMany({
      where: { organizationId: orgId },
      include: {
        vulnerabilities: {
          where: { isResolved: false },
        },
        _count: {
          select: { vulnerabilities: true },
        },
      },
    });

    // Estimate lines of code (in production, you'd fetch this from GitHub)
    // For now, use a placeholder or fetch from repo metadata
    const density = repos.map((repo) => {
      // Placeholder: estimate LOC based on repo size or use 0
      const linesOfCode = repo.linesOfCode || 0;
      const vulnCount = repo.vulnerabilities.length;
      const calculatedDensity = linesOfCode > 0 ? (vulnCount / linesOfCode) * 1000 : 0;

      return {
        repoName: repo.name,
        repoId: repo.id,
        linesOfCode,
        vulnCount,
        density: calculatedDensity,
      };
    });

    const orgAverage =
      density.length > 0 ? density.reduce((sum: number, d: { density: number }) => sum + d.density, 0) / density.length : 0;

    res.json({
      success: true,
      data: {
        byRepo: density,
        orgAverage,
      },
    } as ApiResponse<{
      byRepo: Array<{
        repoName: string;
        repoId: string;
        linesOfCode: number;
        vulnCount: number;
        density: number;
      }>;
      orgAverage: number;
    }>);
  } catch (error: unknown) {
    console.error('Error calculating density:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate density';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Security Debt Score (Financial impact of unresolved issues)
router.get('/metrics/security-debt', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    // Assign dollar cost to each vulnerability type/severity
    const costMatrix: Record<string, number> = {
      CRITICAL: 50000, // $50k per critical vuln
      HIGH: 15000, // $15k per high vuln
      MEDIUM: 5000,
      LOW: 1000,
    };

    const vulns = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: {
        repository: { organizationId: orgId },
        isResolved: false,
      },
      _count: true,
    });

    const totalDebt = vulns.reduce((sum: number, v: { _count: number; severity: string }) => {
      return sum + (v._count * (costMatrix[v.severity] || 0));
    }, 0);

    // Calculate time-based accumulation (older = more expensive)
    const ageWeightedDebt = await prisma.vulnerability.findMany({
      where: {
        repository: { organizationId: orgId },
        isResolved: false,
      },
      select: {
        severity: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const ageAdjustedDebt = ageWeightedDebt.reduce((sum: number, v: { severity: string; createdAt: Date }) => {
      const ageInDays = (now.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const baseCost = costMatrix[v.severity] || 0;
      // Add 10% per month of age
      const ageFactor = 1 + (ageInDays / 30) * 0.1;
      return sum + baseCost * ageFactor;
    }, 0);

    res.json({
      success: true,
      data: {
        totalDebt: Math.round(totalDebt),
        ageAdjustedDebt: Math.round(ageAdjustedDebt),
        currency: 'USD',
        interpretation: 'Estimated cost if these vulnerabilities are exploited',
      },
    } as ApiResponse<{
      totalDebt: number;
      ageAdjustedDebt: number;
      currency: string;
      interpretation: string;
    }>);
  } catch (error: unknown) {
    console.error('Error calculating security debt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate security debt';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Security Velocity (Trend over time)
router.get('/metrics/velocity', async (req, res) => {
  try {
    const { orgId, days = '30' } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get all vulnerabilities in date range
    const allVulns = await prisma.vulnerability.findMany({
      where: {
        repository: { organizationId: orgId },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        isResolved: true,
        resolvedAt: true,
      },
    });

    // Group by date
    const dailyMap = new Map<string, { new: number; resolved: number }>();

    allVulns.forEach((vuln: { createdAt: Date; isResolved: boolean; resolvedAt: Date | null }) => {
      const dateKey = vuln.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { new: 0, resolved: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      day.new += 1;
    });

    // Count resolved by date
    const resolvedVulns = allVulns.filter((v: { isResolved: boolean; resolvedAt: Date | null }) => v.isResolved && v.resolvedAt);
    resolvedVulns.forEach((vuln: { resolvedAt: Date | null; createdAt: Date }) => {
      if (vuln.resolvedAt) {
        const dateKey = vuln.resolvedAt.toISOString().split('T')[0];
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { new: 0, resolved: 0 });
        }
        const day = dailyMap.get(dateKey)!;
        day.resolved += 1;
      }
    });

    // Convert to array and sort
    const velocity = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({
        date,
        newVulns: counts.new,
        fixedVulns: counts.resolved,
        netChange: counts.new - counts.resolved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running total
    let runningTotal = 0;
    const velocityWithRunning = velocity.map((day) => {
      runningTotal += day.netChange;
      return {
        ...day,
        runningTotal,
      };
    });

    const trend =
      velocityWithRunning.length > 0 &&
      velocityWithRunning[velocityWithRunning.length - 1].runningTotal >
        (velocityWithRunning[0]?.runningTotal || 0)
        ? 'worsening'
        : 'improving';

    res.json({
      success: true,
      data: {
        timeline: velocityWithRunning,
        trend,
      },
    } as ApiResponse<{
      timeline: Array<{
        date: string;
        newVulns: number;
        fixedVulns: number;
        netChange: number;
        runningTotal: number;
      }>;
      trend: 'worsening' | 'improving';
    }>);
  } catch (error: unknown) {
    console.error('Error calculating velocity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate velocity';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Attack Surface Score
router.get('/metrics/attack-surface', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    const repos = await prisma.repository.findMany({
      where: { organizationId: orgId },
      include: {
        vulnerabilities: {
          where: { isResolved: false },
        },
      },
    });

    const surfaceScore = repos.reduce((score: number, repo: { isPrivate: boolean; language: string | null; stars: number; vulnerabilities: Array<{ severity: string }> }) => {
      // Higher score = more exposed
      let repoScore = 0;

      // Public repos are more exposed
      if (!repo.isPrivate) repoScore += 50;

      // Web-facing languages increase surface
      const webLanguages = ['JavaScript', 'TypeScript', 'PHP', 'Python', 'Ruby', 'Java'];
      if (repo.language && webLanguages.includes(repo.language)) repoScore += 30;

      // Open ports/endpoints (would need to scan package.json/docker files)
      // Simplified: assume repos with > 1000 stars have high visibility
      if (repo.stars > 1000) repoScore += 20;

      // Add vulnerability weight
      repo.vulnerabilities.forEach((v: { severity: string }) => {
        const weights: Record<string, number> = { CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1 };
        repoScore += weights[v.severity] || 0;
      });

      return score + repoScore;
    }, 0);

    const normalized = Math.min((surfaceScore / repos.length) * 10, 100);

    res.json({
      success: true,
      data: {
        score: surfaceScore,
        normalized: Math.round(normalized),
        interpretation:
          surfaceScore > 500 ? 'High risk' : surfaceScore > 200 ? 'Medium risk' : 'Low risk',
      },
    } as ApiResponse<{
      score: number;
      normalized: number;
      interpretation: string;
    }>);
  } catch (error: unknown) {
    console.error('Error calculating attack surface:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate attack surface';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

// Compliance Readiness (OWASP Top 10, CWE coverage)
router.get('/metrics/compliance', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'orgId is required',
      } as ApiResponse<null>);
    }

    const vulns = await prisma.vulnerability.findMany({
      where: {
        repository: { organizationId: orgId },
        isResolved: false,
      },
      select: { type: true },
    });

    // Map vulnerability types to OWASP Top 10
    const owaspMapping: Record<string, string> = {
      SQL_INJECTION: 'A03:2021 – Injection',
      XSS: 'A03:2021 – Injection',
      AUTH_BYPASS: 'A07:2021 – Identification and Authentication Failures',
      CSRF: 'A01:2021 – Broken Access Control',
      SECRET_LEAK: 'A02:2021 – Cryptographic Failures',
      PATH_TRAVERSAL: 'A01:2021 – Broken Access Control',
      DEPENDENCY_VULNERABILITY: 'A06:2021 – Vulnerable and Outdated Components',
      INSECURE_DESERIALIZATION: 'A08:2021 – Software and Data Integrity Failures',
      XXE: 'A05:2021 – Security Misconfiguration',
      SSRF: 'A10:2021 – Server-Side Request Forgery',
    };

    const owaspCoverage: Record<string, number> = {};
    vulns.forEach((v: { type: string }) => {
      const owaspCat = owaspMapping[v.type];
      if (owaspCat) {
        owaspCoverage[owaspCat] = (owaspCoverage[owaspCat] || 0) + 1;
      }
    });

    const totalCategories = 10;
    const coveredCategories = Object.keys(owaspCoverage).length;
    const complianceScore = ((totalCategories - coveredCategories) / totalCategories) * 100;

    res.json({
      success: true,
      data: {
        score: Math.round(complianceScore),
        breakdown: owaspCoverage,
        passing: complianceScore >= 80,
        message:
          complianceScore >= 80
            ? 'OWASP compliant'
            : `${coveredCategories} OWASP categories have violations`,
      },
    } as ApiResponse<{
      score: number;
      breakdown: Record<string, number>;
      passing: boolean;
      message: string;
    }>);
  } catch (error: unknown) {
    console.error('Error calculating compliance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate compliance';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

