'use client';

import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

export function MetricsShowcase() {
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <section ref={ref} className="py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-20">Built for Scale</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
          <MetricCard
            value={47}
            label="Vulnerabilities Detected"
            suffix=""
            delay={0}
            inView={inView}
          />
          <MetricCard
            value={127}
            label="Security Debt ($K)"
            prefix="$"
            suffix="K"
            delay={0.2}
            inView={inView}
          />
          <MetricCard
            value={23}
            label="Auto-Fix PRs Created"
            suffix=""
            delay={0.4}
            inView={inView}
          />
          <MetricCard
            value={82}
            label="OWASP Compliance Score"
            suffix="%"
            delay={0.6}
            inView={inView}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  value,
  label,
  prefix = '',
  suffix = '',
  delay,
  inView,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  delay: number;
  inView: boolean;
}) {
  return (
    <div className="text-center p-6 md:p-8 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl">
      <div className="text-5xl md:text-6xl font-bold gradient-text mb-4">
        {prefix}
        {inView && <CountUp end={value} duration={2} delay={delay} />}
        {suffix}
      </div>
      <p className="text-gray-400 text-base md:text-lg">{label}</p>
    </div>
  );
}

