import { LenisScroll } from '@/components/lenis-scroll';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { MetricsShowcase } from '@/components/landing/metrics-showcase';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { CTASection } from '@/components/landing/cta-section';

export default function LandingPage() {
  return (
    <LenisScroll>
      <div className="bg-black text-white min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <MetricsShowcase />
        <InteractiveDemo />
        <CTASection />
      </div>
    </LenisScroll>
  );
}

