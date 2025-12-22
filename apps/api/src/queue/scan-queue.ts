import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { GitHubScanner } from '../services/github-scanner';
import { VulnerabilityAnalyzer } from '../services/vulnerability-analyzer';
import { prisma } from '../lib/prisma';
import { emitScanEvent, emitOrgEvent } from '../websocket';

// Redis connection (optional - queue works without it but won't persist)
let connection: Redis | undefined;
try {
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'development') {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
} catch (error) {
  console.warn('Redis not available, queue will run in-memory only');
}

export interface ScanOrgJob {
  orgName: string;
  token?: string;
}

export interface ScanRepoJob {
  owner: string;
  repoName: string;
  token?: string;
}

// Organization scan queue (only create if Redis is available)
export const scanOrgQueue = connection
  ? new Queue<ScanOrgJob>('scan-org', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  : null;

// Repository scan queue (only create if Redis is available)
export const scanRepoQueue = connection
  ? new Queue<ScanRepoJob>('scan-repo', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  : null;

// Worker function for organization scans
async function processOrgScan(job: { data: ScanOrgJob; updateProgress: (progress: number) => Promise<void> }) {
  const { orgName, token } = job.data;
  const scanner = new GitHubScanner(token);
  const { VulnerabilityAnalyzer } = await import('../services/vulnerability-analyzer');
  const analyzer = new VulnerabilityAnalyzer();

  // Emit start event
  emitOrgEvent('org:scan:started', { orgName }, undefined);

  // Create scan record
  let org = await prisma.organization.findUnique({
    where: { login: orgName },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        githubId: `org_${orgName}_${Date.now()}`,
        login: orgName,
        name: orgName,
        url: `https://github.com/${orgName}`,
      },
    });
  }

  const scan = await prisma.scan.create({
    data: {
      organizationId: org.id,
      status: 'SCANNING',
      startedAt: new Date(),
    },
  });

  try {
    // Scan organization
    const result = await scanner.scanOrganization(orgName, { token, storeInDb: true });

    await job.updateProgress(20);
    emitOrgEvent('org:scan:progress', {
      current: 1,
      total: result.totalRepos + 1,
      step: 'Organization scanned',
    }, org.id);

    // Analyze each repository
    let analyzed = 0;
    for (const repo of result.repos) {
      const [owner, repoName] = repo.name.includes('/') ? repo.name.split('/') : [orgName, repo.name];

      try {
        // Find repo in DB
        const dbRepo = await prisma.repository.findUnique({
          where: { fullName: `${owner}/${repoName}` },
        });

        if (dbRepo) {
          // Get files and analyze
          const files = await scanner.getRepositoryFiles(owner, repoName, '', { token });
          
          for (const file of files.slice(0, 10)) {
            // Limit to 10 files per repo for performance
            try {
              const content = await scanner.getFileContent(owner, repoName, file.path, { token });
              if (content) {
                const language = file.name.split('.').pop() || 'javascript';
                await analyzer.analyzeFile({
                  filePath: file.path,
                  fileContent: content,
                  language,
                  repositoryId: dbRepo.id,
                  scanId: scan.id,
                });
              }
            } catch (error) {
              console.error(`Error analyzing ${file.path}:`, error);
            }
          }

          // Calculate security score
          await analyzer.calculateSecurityScore(dbRepo.id);
        }

        analyzed++;

        const progress = 20 + Math.round((analyzed / result.totalRepos) * 80);
        await job.updateProgress(progress);

        emitOrgEvent('org:scan:progress', {
          current: analyzed + 1,
          total: result.totalRepos + 1,
          step: `Analyzed ${repoName}`,
        }, org.id);
      } catch (error) {
        console.error(`Error analyzing ${repoName}:`, error);
      }
    }

    // Update scan
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalFiles: 0,
      },
    });

    // Emit WebSocket event
    emitOrgEvent('org:scan:completed', {
      orgName,
      reposScanned: result.totalRepos,
      reposAnalyzed: analyzed,
    }, org.id);

    return { scanId: scan.id, reposScanned: result.totalRepos, reposAnalyzed: analyzed };
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

// Worker function for repository scans
async function processRepoScan(job: { data: ScanRepoJob; updateProgress?: (progress: number) => Promise<void> }) {
  const { owner, repoName, token } = job.data;
  const scanner = new GitHubScanner(token);
  const analyzer = new VulnerabilityAnalyzer();

  // Find repository
  const fullName = `${owner}/${repoName}`;
  let repo = await prisma.repository.findUnique({
    where: { fullName },
  });

  if (!repo) {
    const org = await prisma.organization.findFirst({
      where: { login: owner },
    });

    if (!org) {
      throw new Error(`Organization ${owner} not found`);
    }

    repo = await prisma.repository.create({
      data: {
        organizationId: org.id,
        githubId: `repo_${fullName}_${Date.now()}`,
        name: repoName,
        fullName,
        url: `https://github.com/${fullName}`,
        defaultBranch: 'main',
      },
    });
  }

  // Create scan
  const scan = await prisma.scan.create({
    data: {
      repositoryId: repo.id,
      status: 'SCANNING',
      startedAt: new Date(),
    },
  });

  try {
    // Get files
    const scanResult = await scanner.scanRepository(owner, repoName, { token, storeInDb: false });

    await prisma.scan.update({
      where: { id: scan.id },
      data: { totalFiles: scanResult.files.length },
    });

    // Analyze files (limit to 20 for performance)
    const filesToAnalyze = scanResult.files
      .filter((f) => f.type === 'file')
      .slice(0, 20);

    let filesScanned = 0;
    for (const file of filesToAnalyze) {
      try {
        const content = await scanner.getFileContent(owner, repoName, file.path, { token });
        const language = file.path.split('.').pop() || 'javascript';

        await analyzer.analyzeFile({
          filePath: file.path,
          fileContent: content,
          language,
          repositoryId: repo.id,
          scanId: scan.id,
        });

        filesScanned++;
        await prisma.scan.update({
          where: { id: scan.id },
          data: { filesScanned },
        });

        // Update job progress
        if (job.updateProgress) {
          await job.updateProgress((filesScanned / filesToAnalyze.length) * 100);
        }
      } catch (error) {
        console.error(`Error analyzing ${file.path}:`, error);
      }
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Emit WebSocket event
    emitScanEvent('scan:completed', {
      scanId: scan.id,
      vulnerabilitiesFound: filesScanned,
    }, scan.id);

    return { scanId: scan.id, vulnerabilitiesFound: filesScanned };
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

// Workers (only start if Redis is available)
export const scanOrgWorker = connection
  ? new Worker<ScanOrgJob>('scan-org', processOrgScan, { connection })
  : null;

export const scanRepoWorker = connection
  ? new Worker<ScanRepoJob>('scan-repo', processRepoScan, { connection })
  : null;
