export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface StoredFinding {
  id: string;
  org: string;
  repo: string;
  filePath: string;
  type: string;
  severity: Severity;
  description: string;
  fix: string;
  scannedAt: number;
}

const KEY = 'scan_findings';

export function getFindings(): StoredFinding[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveFindings(org: string, repo: string, findings: Omit<StoredFinding, 'id' | 'org' | 'repo' | 'scannedAt'>[]) {
  const existing = getFindings().filter(f => !(f.org === org && f.repo === repo));
  const now = Date.now();
  const newEntries: StoredFinding[] = findings.map((f, i) => ({
    ...f,
    id: `${org}/${repo}/${now}/${i}`,
    org,
    repo,
    scannedAt: now,
  }));
  localStorage.setItem(KEY, JSON.stringify([...existing, ...newEntries]));
}

export function clearFindings() {
  localStorage.removeItem(KEY);
}

export function getSecurityScore(findings: StoredFinding[]): number {
  if (findings.length === 0) return 0;
  const penalty = findings.reduce((acc, f) => {
    return acc + ({ Critical: 20, High: 10, Medium: 5, Low: 1 }[f.severity] ?? 0);
  }, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
