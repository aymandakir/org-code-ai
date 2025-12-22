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
  id?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  file: string;
  description: string;
  fix?: string;
  language?: string;
};

export type RepoFile = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  url?: string;
};

export type FileTree = {
  files: RepoFile[];
  totalFiles: number;
  languages: string[];
};

export type ScanProgress = {
  repoId: string;
  repoName: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  filesScanned: number;
  totalFiles: number;
  findings: Finding[];
  error?: string;
};

export type GitHubAuthResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type OAuthState = {
  redirectUrl?: string;
  orgName?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type Pattern = {
  type: 'duplicate' | 'vulnerability' | 'inconsistency';
  repos: string[];
  description: string;
  impact: 'low' | 'medium' | 'high';
  affectedFiles: string[];
};

export type PRContent = {
  title: string;
  description: string;
  commit_message: string;
};

