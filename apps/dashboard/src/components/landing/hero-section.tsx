'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleRef.current || !subtitleRef.current || !ctaRef.current) return;

    // Animated text reveal (StringTune style)
    const chars = titleRef.current.querySelectorAll('.char');
    if (chars.length > 0) {
      gsap.from(chars, {
        y: 100,
        opacity: 0,
        rotationX: -90,
        stagger: 0.02,
        duration: 1,
        ease: 'back.out(1.7)',
      });
    }

    gsap.from(subtitleRef.current, {
      y: 50,
      opacity: 0,
      delay: 0.5,
      duration: 1,
    });

    gsap.from(ctaRef.current, {
      scale: 0,
      opacity: 0,
      delay: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)',
    });
  }, []);

  const title = 'Secure Your Entire Org';
  const titleWords = title.split(' ');

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

      {/* Animated grid (subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 text-center max-w-6xl px-6">
        {/* Main title with char splitting */}
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold mb-6" data-splitting>
          {titleWords.map((word, wordIndex) => (
            <span key={wordIndex}>
              {word.split('').map((char, charIndex) => (
                <span
                  key={charIndex}
                  className={`char inline-block ${wordIndex === 1 ? 'gradient-text' : ''}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              {wordIndex < titleWords.length - 1 && <span className="char"> </span>}
            </span>
          ))}
        </h1>

        <p ref={subtitleRef} className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
          AI-powered security intelligence for GitHub organizations.
          <br />
          Find vulnerabilities. Auto-generate fixes. Track security debt.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6 justify-center">
          <MagneticButton href="/dashboard">
            <span className="text-lg font-semibold px-8 py-4 bg-white text-black rounded-full inline-flex items-center gap-2">
              View Dashboard
              <ArrowRight className="w-5 h-5" />
            </span>
          </MagneticButton>

          <MagneticButton href="/scan">
            <span className="text-lg font-semibold px-8 py-4 border border-white/20 rounded-full hover:bg-white/10 transition">
              Start Scanning
            </span>
          </MagneticButton>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Magnetic button component
function MagneticButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = ((e.clientX - left - width / 2) * 0.3) / 10;
    const y = ((e.clientY - top - height / 2) * 0.3) / 10;

    gsap.to(ref.current, {
      x,
      y,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  return (
    <Link
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
    </Link>
  );
}

