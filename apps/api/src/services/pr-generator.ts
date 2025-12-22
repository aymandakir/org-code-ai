import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { GitHubScanner } from './github-scanner';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CreatePROptions {
  vulnerabilityId: string;
  token: string;
}

export class PRGenerator {
  private octokit: Octokit;
  private scanner: GitHubScanner;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
    this.scanner = new GitHubScanner(token);
  }

  /**
   * Create a fix PR for a vulnerability
   */
  async createFixPR(options: CreatePROptions): Promise<{
    prUrl: string;
    prNumber: number;
    branchName: string;
  }> {
    const { vulnerabilityId, token } = options;

    // Get vulnerability from database
    const vulnerability = await prisma.vulnerability.findUnique({
      where: { id: vulnerabilityId },
      include: {
        repository: true,
        scan: true,
      },
    });

    if (!vulnerability) {
      throw new Error('Vulnerability not found');
    }

    const repo = vulnerability.repository;
    const [owner, repoName] = repo.fullName.split('/');

    // Get file content from GitHub
    const fileContent = await this.scanner.getFileContent(owner, repoName, vulnerability.filePath, {
      token,
    });

    // Generate fix using AI
    const fix = await this.generateFix(vulnerability, fileContent);

    // Create branch
    const branchName = `org-code-ai-fix-${vulnerabilityId.substring(0, 8)}`;
    const defaultBranch = repo.defaultBranch || 'main';

    // Get default branch SHA
    const { data: defaultBranchData } = await this.octokit.repos.getBranch({
      owner,
      repo: repoName,
      branch: defaultBranch,
    });

    // Create new branch
    await this.octokit.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: defaultBranchData.commit.sha,
    });

    // Get file SHA for update
    const { data: fileData } = await this.octokit.repos.getContent({
      owner,
      repo: repoName,
      path: vulnerability.filePath,
      ref: defaultBranch,
    });

    if (Array.isArray(fileData) || fileData.type !== 'file') {
      throw new Error('File not found or is not a file');
    }

    // Apply fix to file content
    const fixedContent = this.applyFix(fileContent, vulnerability.lineStart, fix.codePatch);

    // Commit the fix
    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: vulnerability.filePath,
      message: fix.commitMessage,
      content: Buffer.from(fixedContent).toString('base64'),
      sha: fileData.sha,
      branch: branchName,
    });

    // Create PR
    const { data: pr } = await this.octokit.pulls.create({
      owner,
      repo: repoName,
      title: fix.title,
      body: fix.description,
      head: branchName,
      base: defaultBranch,
    });

    // Store PR in database
    await prisma.pullRequestFix.create({
      data: {
        repositoryId: repo.id,
        vulnerabilityId: vulnerability.id,
        prUrl: pr.html_url,
        branchName,
        prNumber: pr.number,
        title: fix.title,
        description: fix.description,
        commitMessage: fix.commitMessage,
        commitSha: pr.head.sha,
        status: 'open',
      },
    });

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branchName,
    };
  }

  /**
   * Generate fix using AI
   */
  private async generateFix(
    vulnerability: {
      type: string;
      severity: string;
      filePath: string;
      lineStart: number;
      description: string;
      suggestedCodePatch?: string | null;
    },
    fileContent: string
  ): Promise<{
    title: string;
    description: string;
    commitMessage: string;
    codePatch: string;
  }> {
    const systemPrompt = `You are a security expert generating code fixes for vulnerabilities. Generate a secure fix that:
1. Fixes the vulnerability completely
2. Preserves existing functionality
3. Follows security best practices
4. Is minimal and focused (don't refactor unnecessarily)

Return JSON with:
- title: PR title (max 80 chars)
- description: PR description with before/after code blocks
- commitMessage: Git commit message (conventional format)
- codePatch: The exact code to replace the vulnerable section`;

    const userPrompt = `Vulnerability:
Type: ${vulnerability.type}
Severity: ${vulnerability.severity}
File: ${vulnerability.filePath}
Line: ${vulnerability.lineStart}
Description: ${vulnerability.description}
${vulnerability.suggestedCodePatch ? `Suggested fix: ${vulnerability.suggestedCodePatch}` : ''}

File content around the vulnerability:
\`\`\`
${this.getContextLines(fileContent, vulnerability.lineStart, 10)}
\`\`\`

Generate a secure fix.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Failed to generate fix');
    }

    const parsed = JSON.parse(content);
    return {
      title: parsed.title || `Fix ${vulnerability.type} in ${vulnerability.filePath}`,
      description: parsed.description || vulnerability.description,
      commitMessage: parsed.commitMessage || `fix: ${vulnerability.type.toLowerCase()} in ${vulnerability.filePath}`,
      codePatch: parsed.codePatch || vulnerability.suggestedCodePatch || '',
    };
  }

  /**
   * Apply fix to file content
   */
  private applyFix(fileContent: string, lineNumber: number, fix: string): string {
    const lines = fileContent.split('\n');
    // Simple replacement: replace the vulnerable line with the fix
    // In production, you'd want more sophisticated patching
    if (lineNumber > 0 && lineNumber <= lines.length) {
      lines[lineNumber - 1] = fix;
    }
    return lines.join('\n');
  }

  /**
   * Get context lines around a line number
   */
  private getContextLines(content: string, lineNumber: number, context: number): string {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - context - 1);
    const end = Math.min(lines.length, lineNumber + context);
    return lines.slice(start, end).join('\n');
  }
}

