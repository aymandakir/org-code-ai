'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !triggerRef.current) return;

    const features = gsap.utils.toArray<HTMLElement>('.feature-card');

    if (features.length > 0) {
      gsap.to(features, {
        xPercent: -100 * (features.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: triggerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (features.length - 1),
          end: () => `+=${sectionRef.current?.offsetWidth || 0}`,
        },
      });
    }
  }, { scope: triggerRef });

  const features = [
    {
      icon: '🔍',
      title: 'AI Vulnerability Detection',
      description: 'Scans your entire GitHub org for SQL injection, XSS, secrets, and 20+ vulnerability types',
      stats: '47 vulns found in 6 repos',
    },
    {
      icon: '🤖',
      title: 'Auto-Fix PRs',
      description: 'AI generates secure code fixes and opens GitHub PRs automatically',
      stats: '23 PRs created, 89% merge rate',
    },
    {
      icon: '💰',
      title: 'Security Debt Tracking',
      description: 'Calculate financial impact of vulnerabilities with age-weighted cost analysis',
      stats: '$127K security debt',
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'MTTF, vulnerability density, attack surface scoring, OWASP compliance',
      stats: '12h mean time to fix',
    },
    {
      icon: '⚡',
      title: 'Real-Time Monitoring',
      description: 'Live scan progress, instant alerts, security velocity tracking',
      stats: '5.2 vulns/day velocity',
    },
    {
      icon: '🎯',
      title: 'OWASP Compliance',
      description: 'Automated compliance checking against OWASP Top 10 and CWE standards',
      stats: '82% compliant',
    },
  ];

  return (
    <section ref={triggerRef} className="h-screen overflow-hidden py-20">
      <div className="mb-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-4">Everything You Need</h2>
        <p className="text-xl text-gray-400">Security intelligence that goes beyond basic scanning</p>
      </div>

      <div ref={sectionRef} className="flex gap-12 w-max px-12">
        {features.map((feature, i) => (
          <div
            key={i}
            className="feature-card w-[400px] md:w-[500px] h-[500px] md:h-[600px] bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col justify-between"
          >
            <div>
              <div className="text-6xl md:text-8xl mb-8">{feature.icon}</div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">{feature.title}</h3>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">{feature.description}</p>
            </div>

            <div className="text-4xl md:text-5xl font-bold gradient-text">{feature.stats}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

