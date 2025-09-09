import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer as BarResponsiveContainer } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface PriceMixChartProps {
  priceHistogram: {
    LOW: number
    MED: number
    HIGH: number
  }
  priceMix: {
    LOW: number
    MED: number
    HIGH: number
  }
}

export function PriceMixChart({ priceHistogram, priceMix }: PriceMixChartProps) {
  if (!priceMix || !priceHistogram) {
    return <div className="text-center text-gray-500">No price mix data available</div>
  }
  
  const pieData = [
    { name: 'LOW ($30k)', value: priceMix.LOW, color: '#ef4444' },
    { name: 'MED ($40k)', value: priceMix.MED, color: '#f59e0b' },
    { name: 'HIGH ($50k)', value: priceMix.HIGH, color: '#10b981' }
  ]

  const barData = [
    { price: 'LOW', used: priceHistogram.LOW, sold: priceMix.LOW },
    { price: 'MED', used: priceHistogram.MED, sold: priceMix.MED },
    { price: 'HIGH', used: priceHistogram.HIGH, sold: priceMix.HIGH }
  ]

  const totalSales = priceMix.LOW + priceMix.MED + priceMix.HIGH
  const totalUsed = priceHistogram.LOW + priceHistogram.MED + priceHistogram.HIGH

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <PieChartIcon className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Price Mix Analysis</h3>
      </div>
      
      {/* Pie Chart - Sales Distribution */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Sales Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                formatter={(value: number) => [`${value} sales`, 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Usage vs Sales */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Price Usage vs Sales</h4>
        <div className="h-64">
          <BarResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="price" 
                stroke="#6b7280"
                fontSize={12}
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
                formatter={(value: number, name: string) => [
                  `${value} ${name === 'used' ? 'times' : 'sales'}`,
                  name === 'used' ? 'Times Used' : 'Sales Made'
                ]}
              />
              <Bar 
                dataKey="used" 
                fill="#94a3b8" 
                name="Times Used"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="sold" 
                fill="#3b82f6" 
                name="Sales Made"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </BarResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="font-medium text-red-800">LOW Price</div>
          <div className="text-red-600">
            <div>{priceMix.LOW} sales ({totalSales > 0 ? ((priceMix.LOW / totalSales) * 100).toFixed(1) : 0}%)</div>
            <div>{priceHistogram.LOW} uses</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="font-medium text-yellow-800">MED Price</div>
          <div className="text-yellow-600">
            <div>{priceMix.MED} sales ({totalSales > 0 ? ((priceMix.MED / totalSales) * 100).toFixed(1) : 0}%)</div>
            <div>{priceHistogram.MED} uses</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-medium text-green-800">HIGH Price</div>
          <div className="text-green-600">
            <div>{priceMix.HIGH} sales ({totalSales > 0 ? ((priceMix.HIGH / totalSales) * 100).toFixed(1) : 0}%)</div>
            <div>{priceHistogram.HIGH} uses</div>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-2">Conversion Rates</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">LOW:</span> 
            <span className="ml-2 text-gray-800">
              {priceHistogram.LOW > 0 ? ((priceMix.LOW / priceHistogram.LOW) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">MED:</span> 
            <span className="ml-2 text-gray-800">
              {priceHistogram.MED > 0 ? ((priceMix.MED / priceHistogram.MED) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">HIGH:</span> 
            <span className="ml-2 text-gray-800">
              {priceHistogram.HIGH > 0 ? ((priceMix.HIGH / priceHistogram.HIGH) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
