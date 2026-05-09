'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MTTFChartProps {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function MTTFChart({ data }: MTTFChartProps) {
  const chartData = [
    { severity: 'Critical', hours: data.critical || 0 },
    { severity: 'High', hours: data.high || 0 },
    { severity: 'Medium', hours: data.medium || 0 },
    { severity: 'Low', hours: data.low || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="severity" stroke="#666" tick={{ fill: '#999' }} />
        <YAxis stroke="#666" tick={{ fill: '#999' }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#999' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: number | undefined) => [`${value ? value.toFixed(1) : '0'}h`, 'MTTF']}
        />
        <Bar dataKey="hours" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

