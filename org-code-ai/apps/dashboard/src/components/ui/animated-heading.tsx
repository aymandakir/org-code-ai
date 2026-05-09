'use client';

import { useEffect, useRef } from 'react';
import Splitting from 'splitting';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'splitting/dist/splitting.css';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function AnimatedHeading({
  children,
  className = '',
  as: Component = 'h1',
}: AnimatedHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (ref.current) {
      Splitting({ target: ref.current, by: 'chars' });

      const chars = ref.current.querySelectorAll('.char');
      if (chars.length > 0) {
        gsap.from(chars, {
          y: 100,
          opacity: 0,
          rotateX: -90,
          stagger: 0.02,
          duration: 0.8,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 80%',
          },
        });
      }
    }
  }, []);

  // Render the appropriate heading element
  const props = {
    ref,
    className,
    'data-splitting': true,
  } as React.HTMLAttributes<HTMLHeadingElement> & { ref: React.RefObject<HTMLHeadingElement> };

  switch (Component) {
    case 'h1':
      return <h1 {...props}>{children}</h1>;
    case 'h2':
      return <h2 {...props}>{children}</h2>;
    case 'h3':
      return <h3 {...props}>{children}</h3>;
    case 'h4':
      return <h4 {...props}>{children}</h4>;
    case 'h5':
      return <h5 {...props}>{children}</h5>;
    case 'h6':
      return <h6 {...props}>{children}</h6>;
    default:
      return <h1 {...props}>{children}</h1>;
  }
}
