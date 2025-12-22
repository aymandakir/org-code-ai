'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap-setup';

interface AnimatedTitleProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function AnimatedTitle({ text, className = '', as: Component = 'h1' }: AnimatedTitleProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chars = ref.current.querySelectorAll('.char');
    if (chars.length > 0) {
      gsap.from(chars, {
        opacity: 0,
        y: 50,
        rotateX: -90,
        stagger: 0.03,
        duration: 0.8,
        ease: 'back.out(1.4)',
      });
    }
  }, [text]);

  const chars = text.split('').map((char, i) => (
    <span key={i} className="char inline-block">
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  const ComponentWithRef = Component as any;

  return (
    <ComponentWithRef ref={ref} className={className}>
      {chars}
    </ComponentWithRef>
  );
}

