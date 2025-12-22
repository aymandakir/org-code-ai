'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Repo } from '@/types';

gsap.registerPlugin(ScrollTrigger);

interface HorizontalScrollSectionProps {
  repositories: Repo[];
}

function RepositoryCard({ repo }: { repo: Repo }) {
  return (
    <Card className="repo-card w-[400px] flex-shrink-0 glass-card">
      <CardHeader>
        <CardTitle className="text-2xl">{repo.name}</CardTitle>
        <CardDescription>{repo.description || 'No description'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>⭐ {repo.stars}</span>
          <span>🍴 {repo.forks}</span>
          {repo.language && <span>💻 {repo.language}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function HorizontalScrollSection({ repositories }: HorizontalScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!triggerRef.current || !sectionRef.current) return;

      const cards = sectionRef.current.querySelectorAll('.repo-card');
      if (cards.length === 0) return;

      gsap.to(cards, {
        xPercent: -100 * (cards.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: triggerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (cards.length - 1),
          end: () => `+=${sectionRef.current?.offsetWidth || 0}`,
        },
      });
    },
    { scope: triggerRef, dependencies: [repositories] }
  );

  return (
    <div ref={triggerRef} className="h-screen overflow-hidden">
      <div ref={sectionRef} className="flex gap-8 w-max px-8">
        {repositories.map((repo) => (
          <RepositoryCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}

