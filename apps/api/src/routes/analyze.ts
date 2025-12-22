import { Router } from 'express';
import { VulnerabilityAnalyzer } from '../services/vulnerability-analyzer';
import { GitHubScanner } from '../services/github-scanner';
import { prisma } from '../lib/prisma';
import type { ApiResponse } from '@org-code-ai/types';

const router = Router();
const analyzer = new VulnerabilityAnalyzer();

router.post('/analyze/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = (req.session as any)?.githubToken || process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'GitHub token required for analysis',
      } as ApiResponse<null>);
    }

    // Get repo from database
    const repository = await prisma.repository.findFirst({
      where: { fullName: `${owner}/${repo}` },
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found. Scan organization first.',
      } as ApiResponse<null>);
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        repositoryId: repository.id,
        status: 'SCANNING',
        startedAt: new Date(),
      },
    });

    try {
      // Get all code files
      const scanner = new GitHubScanner(token);
      const files = await scanner.getRepositoryFiles(owner, repo, '', { token });

      // Update scan with total files
      await prisma.scan.update({
        where: { id: scan.id },
        data: { totalFiles: files.length },
      });

      // Analyze each file (limit to 20 for performance)
      let totalVulns = 0;
      let filesScanned = 0;

      for (const file of files.slice(0, 20)) {
        try {
          const content = await scanner.getFileContent(owner, repo, file.path, { token });

          if (content) {
            const language = file.name.split('.').pop() || 'javascript';
            const vulns = await analyzer.analyzeFile({
              filePath: file.path,
              fileContent: content,
              language,
              repositoryId: repository.id,
              scanId: scan.id,
            });
            totalVulns += vulns.length;
            filesScanned++;

            // Update progress
            await prisma.scan.update({
              where: { id: scan.id },
              data: { filesScanned },
            });
          }
        } catch (error) {
          console.error(`Error analyzing ${file.path}:`, error);
        }
      }

      // Mark scan as completed
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Calculate security score
      await analyzer.calculateSecurityScore(repository.id);

      return res.json({
        success: true,
        data: {
          repository: repository.name,
          vulnerabilitiesFound: totalVulns,
          filesScanned,
          totalFiles: files.length,
          message: 'Analysis complete',
        },
      } as ApiResponse<{
        repository: string;
        vulnerabilitiesFound: number;
        filesScanned: number;
        totalFiles: number;
        message: string;
      }>);
    } catch (error) {
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Analysis failed',
        },
      });
      throw error;
    }
  } catch (error: unknown) {
    console.error('Error analyzing repository:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<null>);
  }
});

export default router;

