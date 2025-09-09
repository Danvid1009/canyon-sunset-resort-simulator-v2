import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Calendar } from 'lucide-react'

interface SalesByPeriodChartProps {
  salesByPeriod: number[]
  sampleTrial: {
    steps: Array<{
      period: number
      sold: boolean
      price: number
    }>
  }
}

export function SalesByPeriodChart({ salesByPeriod, sampleTrial }: SalesByPeriodChartProps) {
  if (!salesByPeriod || !sampleTrial?.steps) {
    return <div className="text-center text-gray-500">No sales data available</div>
  }
  
  const data = salesByPeriod.map((sales, index) => ({
    period: index + 1,
    sales,
    sampleSold: sampleTrial.steps[index]?.sold ? 1 : 0,
    samplePrice: sampleTrial.steps[index]?.price || 0
  }))

  const totalSales = salesByPeriod.reduce((sum, sales) => sum + sales, 0)
  const avgSalesPerPeriod = totalSales / salesByPeriod.length

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Sales by Time Period</h3>
      </div>
      
      {/* Bar Chart - Sales Count by Period */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Sales Count Across All Trials</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                formatter={(value: number) => [`${value} sales`, 'Sales Count']}
                labelFormatter={(label) => `Period ${label}`}
              />
              <Bar 
                dataKey="sales" 
                fill="#6366f1" 
                radius={[2, 2, 0, 0]}
                name="Sales Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Sample Trial Overlay */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Sample Trial Overlay</h4>
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
                domain={[0, 'dataMax']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                formatter={(value: number, name: string) => [
                  name === 'sales' ? `${value} sales` : (value ? 'Yes' : 'No'),
                  name === 'sales' ? 'All Trials Sales' : 'Sample Trial Sale'
                ]}
                labelFormatter={(label) => `Period ${label}`}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                name="All Trials Sales"
              />
              <Line
                type="monotone"
                dataKey="sampleSold"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                name="Sample Trial Sale"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-800">Total Sales</div>
          <div className="text-blue-600 text-lg font-bold">{totalSales}</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-medium text-green-800">Avg Sales/Period</div>
          <div className="text-green-600 text-lg font-bold">{avgSalesPerPeriod.toFixed(1)}</div>
        </div>
      </div>

      {/* Peak Periods */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-2">Peak Sales Periods</h4>
        <div className="text-sm text-gray-600">
          {(() => {
            const maxSales = Math.max(...salesByPeriod)
            const peakPeriods = salesByPeriod
              .map((sales, index) => ({ period: index + 1, sales }))
              .filter(item => item.sales === maxSales)
              .map(item => `T${item.period}`)
              .join(', ')
            
            return (
              <p>
                <span className="font-medium">Highest sales:</span> {maxSales} sales in periods {peakPeriods}
              </p>
            )
          })()}
        </div>
      </div>

      {/* Early vs Late Sales */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="font-medium text-yellow-800">Early Sales (T1-T5)</div>
          <div className="text-yellow-600">
            {salesByPeriod.slice(0, 5).reduce((sum, sales) => sum + sales, 0)} sales
          </div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="font-medium text-red-800">Late Sales (T11-T15)</div>
          <div className="text-red-600">
            {salesByPeriod.slice(10, 15).reduce((sum, sales) => sum + sales, 0)} sales
          </div>
        </div>
      </div>
    </div>
  )
}
