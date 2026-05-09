'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(ref: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ref.current) return;

      gsap.from(ref.current, {
        y: 100,
        opacity: 0,
        rotation: 15,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
        },
      });
    },
    { scope: ref }
  );
}

