'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Github,
      title: 'Multi-Repo Analysis',
      description: 'Scan entire GitHub organizations and discover patterns across hundreds of repositories',
    },
    {
      icon: Sparkles,
      title: 'AI Agents',
      description: 'CrewAI-powered agents analyze code for security, performance, and best practices',
    },
    {
      icon: Shield,
      title: 'Auto PRs',
      description: 'Automatically generate pull requests with fixes for detected vulnerabilities',
    },
    {
      icon: Zap,
      title: 'Real-time Scanning',
      description: 'Get instant insights into your organization\'s codebase health and security posture',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI-Powered Multi-Repo Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Scan entire GitHub organizations, detect patterns, and auto-fix vulnerabilities
            across all your repositories in one place.
          </p>
          <Link href="/scan">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Scanning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Ready to scan your organization?
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter any GitHub organization name to get started. No authentication required for demo mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/scan">
              <Button size="lg" variant="default">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
