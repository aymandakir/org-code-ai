import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { login: 'stephdl' },
    update: {},
    create: {
      githubId: 'org_stephdl_demo',
      login: 'stephdl',
      name: 'StephDL',
      url: 'https://github.com/stephdl',
      description: 'Demo organization for org-code-ai',
    },
  });

  console.log('✅ Created organization:', org.login);

  // Create demo repositories
  const repos = [
    {
      name: 'api-gateway',
      description: 'Microservices API Gateway',
      language: 'TypeScript',
      stars: 128,
      forks: 23,
    },
    {
      name: 'auth-service',
      description: 'Authentication and authorization service',
      language: 'Go',
      stars: 89,
      forks: 15,
    },
    {
      name: 'frontend-app',
      description: 'React frontend application',
      language: 'TypeScript',
      stars: 156,
      forks: 34,
    },
  ];

  const createdRepos = [];
  for (const repoData of repos) {
    const fullName = `stephdl/${repoData.name}`;
    const repo = await prisma.repository.upsert({
      where: { fullName },
      update: {},
      create: {
        organizationId: org.id,
        githubId: `repo_${fullName}_${Date.now()}`,
        name: repoData.name,
        fullName,
        url: `https://github.com/${fullName}`,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stars,
        forks: repoData.forks,
        defaultBranch: 'main',
      },
    });
    createdRepos.push(repo);
  }

  console.log(`✅ Created ${createdRepos.length} repositories`);

  // Create demo scan
  const scan = await prisma.scan.create({
    data: {
      organizationId: org.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      totalFiles: 150,
      filesScanned: 150,
    },
  });

  console.log('✅ Created scan:', scan.id);

  // Create demo vulnerabilities
  const vulnerabilities = [
    {
      type: 'SQL_INJECTION' as const,
      severity: 'CRITICAL' as const,
      filePath: 'api/users.ts',
      lineStart: 42,
      shortTitle: 'SQL injection in user query',
      description: 'User input is directly concatenated into SQL query without parameterization.',
      fixStrategy: 'Use parameterized queries or prepared statements',
      suggestedCodePatch: "const query = 'SELECT * FROM users WHERE id = $1';\nawait db.query(query, [userId]);",
      language: 'TypeScript',
    },
    {
      type: 'XSS' as const,
      severity: 'HIGH' as const,
      filePath: 'components/Form.tsx',
      lineStart: 128,
      shortTitle: 'XSS vulnerability in form',
      description: 'User input is rendered without sanitization, allowing XSS attacks.',
      fixStrategy: 'Sanitize user input or use React\'s built-in XSS protection',
      suggestedCodePatch: "const sanitized = DOMPurify.sanitize(userInput);\n<div>{sanitized}</div>",
      language: 'TypeScript',
    },
    {
      type: 'SECRET_LEAK' as const,
      severity: 'CRITICAL' as const,
      filePath: 'config/db.ts',
      lineStart: 15,
      shortTitle: 'Hardcoded database password',
      description: 'Database password is hardcoded in source code.',
      fixStrategy: 'Move secrets to environment variables',
      suggestedCodePatch: "const password = process.env.DB_PASSWORD;",
      language: 'TypeScript',
    },
  ];

  for (const vulnData of vulnerabilities) {
    await prisma.vulnerability.create({
      data: {
        scanId: scan.id,
        repositoryId: createdRepos[0].id,
        ...vulnData,
        lineEnd: vulnData.lineStart,
      },
    });
  }

  console.log(`✅ Created ${vulnerabilities.length} vulnerabilities`);

  // Create demo security scores
  for (const repo of createdRepos) {
    await prisma.securityScore.create({
      data: {
        repositoryId: repo.id,
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        breakdown: {
          baseScore: 100,
          critical: -15,
          high: -10,
          medium: -5,
          low: 0,
        },
      },
    });
  }

  console.log('✅ Created security scores');

  // Create demo PR
  const pr = await prisma.pullRequestFix.create({
    data: {
      repositoryId: createdRepos[0].id,
      vulnerabilityId: (await prisma.vulnerability.findFirst({ where: { repositoryId: createdRepos[0].id } }))?.id,
      prUrl: 'https://github.com/stephdl/api-gateway/pull/123',
      branchName: 'fix/sql-injection-users',
      prNumber: 123,
      title: 'Fix SQL injection vulnerability in user query',
      description: 'Replaced string concatenation with parameterized queries.',
      commitMessage: 'fix: use parameterized queries in user endpoint',
      status: 'open',
    },
  });

  console.log('✅ Created demo PR:', pr.id);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

