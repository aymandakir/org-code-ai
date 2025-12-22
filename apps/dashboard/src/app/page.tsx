'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchOrgRepos } from '@/lib/api';
import { useEffect, useState } from 'react';
import type { Repo } from '@/types';

// Dynamic imports for client-only components
const AnimatedHeading = dynamic(() => import('@/components/ui/animated-heading').then(mod => ({ default: mod.AnimatedHeading })), { ssr: false });
const WebGLBackground = dynamic(() => import('@/components/ui/webgl-background').then(mod => ({ default: mod.WebGLBackground })), { ssr: false });
const MagneticButton = dynamic(() => import('@/components/ui/magnetic-button').then(mod => ({ default: mod.MagneticButton })), { ssr: false });
const CursorTrail = dynamic(() => import('@/components/ui/cursor-trail').then(mod => ({ default: mod.CursorTrail })), { ssr: false });
const HorizontalScrollSection = dynamic(() => import('@/components/horizontal-scroll-section').then(mod => ({ default: mod.HorizontalScrollSection })), { ssr: false });
const StatsCard = dynamic(() => import('@/components/stats-card').then(mod => ({ default: mod.StatsCard })), { ssr: false });
const VulnerabilityTicker = dynamic(() => import('@/components/vulnerability-ticker').then(mod => ({ default: mod.VulnerabilityTicker })), { ssr: false });

const stats = [
  {
    value: '10K+',
    label: 'Repositories Scanned',
    description: 'Across hundreds of organizations',
  },
  {
    value: '50K+',
    label: 'Vulnerabilities Detected',
    description: 'With AI-powered analysis',
  },
  {
    value: '99%',
    label: 'Accuracy Rate',
    description: 'Industry-leading detection',
  },
];

export default function HomePage() {
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock repositories for demo (always use these for homepage)
    const mockRepos: Repo[] = [
      {
        id: '1',
        name: 'api-gateway',
        url: 'https://github.com/stephdl/api-gateway',
        description: 'Microservices API Gateway',
        language: 'TypeScript',
        stars: 128,
        forks: 23,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'auth-service',
        url: 'https://github.com/stephdl/auth-service',
        description: 'Authentication and authorization service',
        language: 'Go',
        stars: 89,
        forks: 15,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'frontend-app',
        url: 'https://github.com/stephdl/frontend-app',
        description: 'React frontend application',
        language: 'TypeScript',
        stars: 156,
        forks: 34,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'ns8-lamp',
        url: 'https://github.com/stephdl/ns8-lamp',
        description: 'LAMP stack configuration for NS8',
        language: 'PHP',
        stars: 42,
        forks: 8,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'database-migrations',
        url: 'https://github.com/stephdl/database-migrations',
        description: 'Database schema migrations',
        language: 'SQL',
        stars: 34,
        forks: 12,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'monitoring-dashboard',
        url: 'https://github.com/stephdl/monitoring-dashboard',
        description: 'Application monitoring and metrics',
        language: 'JavaScript',
        stars: 91,
        forks: 18,
        updatedAt: new Date().toISOString(),
      },
    ];

    // Try to fetch real data, but use mock data as fallback
    fetchOrgRepos('stephdl')
      .then(({ repos, demoMode }) => {
        if (repos.length > 0) {
          setRepositories(repos.slice(0, 10)); // Limit for horizontal scroll
        } else {
          // Use mock data if API returns empty or demo mode
          setRepositories(mockRepos);
        }
        setLoading(false);
      })
      .catch(() => {
        // Always fallback to mock data on error
        setRepositories(mockRepos);
        setLoading(false);
      });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CursorTrail />
      <WebGLBackground />

      {/* Hero Section - Full viewport */}
      <section className="h-screen flex items-center justify-center relative z-10">
        <div className="text-center px-4 max-w-5xl mx-auto">
          <AnimatedHeading className="text-6xl md:text-8xl font-bold mb-6">
            Master Your
            <br />
            Code Security
          </AnimatedHeading>
          <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            AI-powered vulnerability scanning across your entire GitHub organization.
            <br />
            Detect. Fix. Deploy.
          </p>
          <div className="mt-12">
            <Link href="/scan">
              <MagneticButton className="text-lg px-10 py-5">
                Start Scanning →
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Stats Cards - Parallax effect */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, i) => (
              <StatsCard key={i} stat={stat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Repository Scanner - Horizontal scroll */}
      {!loading && repositories.length > 0 && (
        <section className="py-32 relative z-10">
          <div className="container mx-auto px-4 mb-16">
            <AnimatedHeading as="h2" className="text-4xl md:text-5xl font-bold text-center mb-4">
              Explore Repositories
            </AnimatedHeading>
            <p className="text-center text-muted-foreground text-lg">
              Scroll horizontally to discover scanned repositories
            </p>
          </div>
          <HorizontalScrollSection repositories={repositories} />
        </section>
      )}

      {/* Live Vulnerability Feed - Ticker animation */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 mb-8">
          <AnimatedHeading as="h2" className="text-3xl md:text-4xl font-bold text-center">
            Live Vulnerability Feed
          </AnimatedHeading>
        </div>
        <VulnerabilityTicker />
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <AnimatedHeading as="h2" className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Secure Your Code?
          </AnimatedHeading>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of organizations using AI to detect and fix vulnerabilities
            before they become security incidents.
          </p>
          <Link href="/scan">
            <MagneticButton className="text-lg px-10 py-5">
              Get Started Free →
            </MagneticButton>
          </Link>
        </div>
      </section>
    </main>
  );
}
