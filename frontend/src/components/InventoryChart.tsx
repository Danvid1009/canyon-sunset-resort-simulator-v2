import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Package } from 'lucide-react'

interface InventoryChartProps {
  sampleTrial: {
    steps: Array<{
      period: number
      remaining_capacity: number
      sold: boolean
    }>
  }
  initialCapacity: number
}

export function InventoryChart({ sampleTrial, initialCapacity }: InventoryChartProps) {
  if (!sampleTrial?.steps) {
    return <div className="text-center text-gray-500">No sample trial data available</div>
  }
  
  const data = sampleTrial.steps.map(step => ({
    period: step.period,
    remaining: step.remaining_capacity,
    sold: step.sold ? 1 : 0,
    capacity_utilized: initialCapacity - step.remaining_capacity
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Inventory Over Time</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
              domain={[0, initialCapacity]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string) => [
                name === 'remaining' ? `${value} units` : (value ? 'Yes' : 'No'),
                name === 'remaining' ? 'Remaining Capacity' : 'Sale Occurred'
              ]}
              labelFormatter={(label) => `Period ${label}`}
            />
            <Area
              type="monotone"
              dataKey="remaining"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="sold"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
              name="Sale Occurred"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p><span className="font-medium">Initial Capacity:</span> {initialCapacity} units</p>
          <p><span className="font-medium">Final Capacity:</span> {data[data.length - 1]?.remaining || 0} units</p>
        </div>
        <div>
          <p><span className="font-medium">Units Sold:</span> {initialCapacity - (data[data.length - 1]?.remaining || 0)}</p>
          <p><span className="font-medium">Fill Rate:</span> {(((initialCapacity - (data[data.length - 1]?.remaining || 0)) / initialCapacity) * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}
