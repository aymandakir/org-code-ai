export type Repo = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
};

export type Org = {
  id: string;
  name: string;
  login: string;
  avatarUrl: string;
  url: string;
};

export type ScanResult = {
  repoId: string;
  repoName: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  findings: Finding[];
  scannedAt: string | null;
  error?: string;
};

export type Finding = {
  id: string;
  type: 'security' | 'performance' | 'code-quality' | 'best-practice';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  message: string;
  suggestion: string;
};

