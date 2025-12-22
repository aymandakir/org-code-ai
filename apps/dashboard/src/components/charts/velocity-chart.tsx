'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VelocityChartProps {
  data: Array<{
    date: string;
    newVulns: number;
    fixedVulns: number;
    netChange: number;
    runningTotal: number;
  }>;
}

export function VelocityChart({ data }: VelocityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#999' }} />
        <YAxis stroke="#666" tick={{ fill: '#999' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ color: '#999' }} />
        <Line
          type="monotone"
          dataKey="newVulns"
          stroke="#ef4444"
          strokeWidth={2}
          name="New Vulnerabilities"
          dot={{ fill: '#ef4444', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="fixedVulns"
          stroke="#22c55e"
          strokeWidth={2}
          name="Fixed Vulnerabilities"
          dot={{ fill: '#22c55e', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="netChange"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Net Change"
          dot={{ fill: '#3b82f6', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

