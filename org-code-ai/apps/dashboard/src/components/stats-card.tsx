'use client';

import { useRef } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stat {
  value: string;
  label: string;
  description: string;
}

interface StatsCardProps {
  stat: Stat;
  index: number;
}

export function StatsCard({ stat, index }: StatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref);

  return (
    <Card
      ref={ref}
      className="glass-card text-center"
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <CardHeader>
        <CardTitle className="text-5xl font-bold gradient-text">{stat.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold mb-2">{stat.label}</p>
        <p className="text-sm text-muted-foreground">{stat.description}</p>
      </CardContent>
    </Card>
  );
}

