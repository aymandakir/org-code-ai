'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function BridgeToDashboard() {
  return (
    <section className="py-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">
          Your Security <span className="gradient-text">Command Center</span>
        </h2>

        <p className="text-xl md:text-2xl text-gray-400 mb-16">
          Access advanced metrics, vulnerability tracking, and AI-powered insights
        </p>

        {/* Giant CTA button */}
        <Link href="/dashboard" className="group relative inline-block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-[3px]">
            <div className="relative bg-black rounded-2xl px-12 md:px-16 py-6 md:py-8 transition-all group-hover:bg-transparent">
              <span className="relative z-10 text-2xl md:text-4xl font-bold flex items-center gap-4">
                Enter Dashboard
                <ArrowRight className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:translate-x-3" />
              </span>
            </div>
          </div>

          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl animate-pulse group-hover:blur-2xl transition-all" />
        </Link>

        <p className="mt-8 text-gray-500 text-sm md:text-base">
          View 6 repositories • Track 47 vulnerabilities • Monitor $127K security debt
        </p>
      </div>
    </section>
  );
}

