'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface ThroughputGaugeChartProps {
  eventsLast5Minutes: number
  eventsLast30Minutes: number
}

export default function ThroughputGaugeChart({ eventsLast5Minutes, eventsLast30Minutes }: ThroughputGaugeChartProps) {
  const data = [
    { name: 'Last 5 Min', value: eventsLast5Minutes, color: '#3b82f6' },
    { name: 'Last 30 Min', value: eventsLast30Minutes, color: '#10b981' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Throughput Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

