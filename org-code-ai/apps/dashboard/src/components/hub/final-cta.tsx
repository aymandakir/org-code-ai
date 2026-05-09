'use client';

import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-7xl font-bold mb-8">
          Ready to Secure
          <br />
          <span className="gradient-text">Your Organization?</span>
        </h2>

        <p className="text-xl md:text-2xl text-gray-400 mb-12">
          Start scanning your GitHub repositories in seconds.
          <br />
          No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/dashboard"
            className="px-12 py-6 bg-white text-black rounded-full text-xl font-semibold hover:scale-105 transition inline-block"
          >
            Get Started Free
          </Link>

          <Link
            href="https://github.com/aymandakir/org-code-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-12 py-6 border border-white/20 rounded-full text-xl font-semibold hover:bg-white/10 transition inline-block"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

