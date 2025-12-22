'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function InteractiveDemo() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Array<{ type: string; file: string; severity: string }>>([]);

  const startDemo = async () => {
    setScanning(true);
    setResults([]);

    // Simulate progressive scanning
    const mockVulns = [
      { type: 'SQL Injection', file: 'api/users.ts', severity: 'critical' },
      { type: 'XSS', file: 'components/Form.tsx', severity: 'high' },
      { type: 'Hardcoded Secret', file: 'config/db.ts', severity: 'critical' },
      { type: 'CSRF', file: 'routes/auth.ts', severity: 'medium' },
    ];

    for (const vuln of mockVulns) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResults((prev) => [...prev, vuln]);
    }

    setScanning(false);
  };

  return (
    <section className="py-32 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-12">See It In Action</h2>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <input
              type="text"
              value="stephdl/ns8-lamp"
              readOnly
              className="flex-1 w-full bg-black border border-gray-700 rounded-lg px-6 py-4 text-lg md:text-xl"
            />
            <button
              onClick={startDemo}
              disabled={scanning}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg md:text-xl hover:scale-105 transition disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan Repository'}
            </button>
          </div>

          <AnimatePresence>
            {results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-4 bg-black/50 border border-gray-800 rounded-lg mb-3"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    result.severity === 'critical'
                      ? 'bg-red-500'
                      : result.severity === 'high'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-semibold">{result.type}</div>
                  <div className="text-sm text-gray-500">{result.file}</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition">
                  Generate Fix
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {scanning && (
            <div className="flex items-center gap-3 text-gray-400 animate-pulse">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              Analyzing files...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

