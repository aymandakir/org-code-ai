import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'org-code-ai | AI-Powered Security Intelligence',
  description: 'Secure your entire GitHub organization with AI-powered vulnerability detection and auto-fix PRs.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

