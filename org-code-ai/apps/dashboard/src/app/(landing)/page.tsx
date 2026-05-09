'use client';

import { LenisScroll } from '@/components/lenis-scroll';
import { UniqueHero } from '@/components/hub/unique-hero';
import { BridgeToDashboard } from '@/components/hub/bridge-to-dashboard';
import { UniqueFeatures } from '@/components/hub/unique-features';
import { LiveMetricsPreview } from '@/components/hub/live-metrics-preview';
import { FinalCTA } from '@/components/hub/final-cta';

export default function HubPage() {
  return (
    <LenisScroll>
      <div className="min-h-screen bg-black text-white">
        <UniqueHero />
        <BridgeToDashboard />
        <UniqueFeatures />
        <LiveMetricsPreview />
        <FinalCTA />
      </div>
    </LenisScroll>
  );
}

