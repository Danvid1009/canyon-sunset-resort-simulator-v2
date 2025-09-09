import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign } from 'lucide-react'

interface RevenueChartProps {
  sampleTrial: {
    steps: Array<{
      period: number
      revenue: number
    }>
    total_revenue: number
  }
}

export function RevenueChart({ sampleTrial }: RevenueChartProps) {
  if (!sampleTrial?.steps) {
    return <div className="text-center text-gray-500">No sample trial data available</div>
  }
  
  const data = sampleTrial.steps.map(step => ({
    period: step.period,
    revenue: step.revenue,
    cumulative: sampleTrial.steps
      .slice(0, step.period)
      .reduce((sum, s) => sum + s.revenue, 0)
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Revenue Over Time</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `T${value}`}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'revenue' ? 'Period Revenue' : 'Cumulative Revenue'
              ]}
              labelFormatter={(label) => `Period ${label}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Period Revenue"
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Cumulative Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><span className="font-medium">Total Revenue:</span> ${sampleTrial.total_revenue.toLocaleString()}</p>
        <p><span className="font-medium">Periods with Sales:</span> {data.filter(d => d.revenue > 0).length} / {data.length}</p>
      </div>
    </div>
  )
}
