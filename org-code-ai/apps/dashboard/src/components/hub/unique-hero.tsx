'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AnimatedTitle } from '@/components/ui/animated-title';

export function UniqueHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    let animationId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      time += 0.01;

      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated gradient blobs
      for (let i = 0; i < 3; i++) {
        const x = canvas.width / 2 + Math.sin(time + i) * 200;
        const y = canvas.height / 2 + Math.cos(time + i) * 200;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 300);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${0.3 + Math.sin(time) * 0.1})`);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Glass morphism container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-16 shadow-2xl">
          <AnimatedTitle
            text="Security Intelligence"
            className="text-5xl md:text-7xl font-bold mb-6"
            as="h1"
          />

          <p className="text-xl md:text-2xl text-gray-300 mt-8 mb-12">
            AI-powered vulnerability detection for your entire GitHub organization
          </p>

          <Link
            href="/dashboard"
            className="group relative inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-white text-black rounded-full font-bold text-lg md:text-xl overflow-hidden transition-all hover:scale-105"
          >
            <span className="relative z-10">Enter Dashboard</span>
            <ArrowRight className="relative z-10 w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-2" />

            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </Link>
        </div>
      </div>
    </section>
  );
}

