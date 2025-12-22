'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fetchDashboardOverview, fetchSecurityDebt } from '@/lib/api';
import CountUp from 'react-countup';

export function LiveMetricsPreview() {
  const [stats, setStats] = useState<any>(null);
  const [debt, setDebt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, debtData] = await Promise.allSettled([
          fetchDashboardOverview('stephdl'),
          fetchSecurityDebt('stephdl'),
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }
        if (debtData.status === 'fulfilled') {
          setDebt(debtData.value);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-32 px-6 md:px-12 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 px-6 md:px-12 bg-gradient-to-b from-black via-purple-950/10 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-center mb-20">
          Real-Time <span className="gradient-text">Intelligence</span>
        </h2>

        {/* Large animated stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <StatGlass
            value={stats?.vulnerabilities?.total || 47}
            label="Vulnerabilities Tracked"
            trend={`${stats?.vulnerabilities?.critical || 12} critical`}
            icon="🔍"
          />

          <StatGlass
            value={debt ? `$${Math.round(debt.ageAdjustedDebt / 1000)}K` : '$127K'}
            label="Security Debt"
            trend="Age-weighted calculation"
            icon="💰"
          />
        </div>

        {/* Mini chart preview */}
        <div className="border border-gray-800 rounded-2xl p-8 bg-black/50 backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-6">Security Velocity (Last 30 Days)</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>View full dashboard for detailed charts</p>
          </div>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
          >
            View Full Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatGlass({
  value,
  label,
  trend,
  icon,
}: {
  value: string | number;
  label: string;
  trend: string;
  icon: string;
}) {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const isNumeric = !isNaN(numericValue);

  return (
    <div className="relative group">
      {/* Glow */}
      <div className="absolute inset-0 bg-purple-500/20 blur-3xl group-hover:bg-purple-500/30 transition-all duration-500 rounded-3xl" />

      {/* Glass card */}
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
        <div className="text-6xl md:text-8xl mb-6">{icon}</div>
        <div className="text-5xl md:text-7xl font-bold mb-4 gradient-text">
          {isNumeric ? (
            <>
              {typeof value === 'string' && value.includes('$') && '$'}
              <CountUp end={numericValue} duration={2} />
              {typeof value === 'string' && value.includes('K') && 'K'}
            </>
          ) : (
            value
          )}
        </div>
        <div className="text-xl md:text-2xl text-gray-300 mb-2">{label}</div>
        <div className="text-sm md:text-base text-gray-500">{trend}</div>
      </div>
    </div>
  );
}

