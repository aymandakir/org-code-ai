'use client';

export function UniqueFeatures() {
  const features = [
    {
      icon: '🛡️',
      title: 'AI Detection',
      desc: 'GPT-4 powered vulnerability scanning',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '⚡',
      title: 'Auto-Fix PRs',
      desc: 'Generate secure code fixes automatically',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📊',
      title: 'Security Debt',
      desc: 'Track financial impact in dollars',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-32 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-center mb-20">
          Unique <span className="gradient-text">Features</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative"
              style={{
                transform: `perspective(1000px) rotateY(${i * 2}deg)`,
                transition: 'all 0.5s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `perspective(1000px) rotateY(${i * 2}deg) scale(1)`;
              }}
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl`}
              />

              {/* Card */}
              <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 h-full">
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

