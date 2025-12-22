'use client';

import { useEffect } from 'react';
import gsap from 'gsap';

export function CursorTrail() {
  useEffect(() => {
    const cursor = document.createElement('div');
    cursor.className =
      'fixed w-8 h-8 rounded-full bg-white/20 blur-xl pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-screen z-50';
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', moveCursor);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      cursor.remove();
    };
  }, []);

  return null;
}

