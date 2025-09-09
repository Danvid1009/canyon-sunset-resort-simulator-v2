import React from 'react'
import { BarChart3, TrendingUp, Clock, DollarSign, Target, AlertCircle } from 'lucide-react'
import { SimulationResults } from '../types'
import { RevenueChart } from './RevenueChart'
import { InventoryChart } from './InventoryChart'
import { PriceMixChart } from './PriceMixChart'
import { SalesByPeriodChart } from './SalesByPeriodChart'

interface ResultsPanelProps {
  results: SimulationResults
  onSubmit: () => void
  onReset: () => void
}

export function ResultsPanel({ results, onSubmit, onReset }: ResultsPanelProps) {
  const aggregates = results.aggregates
  const sampleTrial = results.sample_trial

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(aggregates.avg_revenue)}
              </div>
              <div className="text-sm text-gray-600">Average Revenue</div>
              <div className="text-xs text-gray-500">
                ±{formatCurrency(aggregates.std_revenue)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(aggregates.fill_rate)}
              </div>
              <div className="text-sm text-gray-600">Fill Rate</div>
              <div className="text-xs text-gray-500">
                Capacity sold
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(aggregates.last_minute_share)}
              </div>
              <div className="text-sm text-gray-600">Last-Minute Share</div>
              <div className="text-xs text-gray-500">
                Final {results.config.last_minute_k} periods
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(aggregates.avg_price)}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
              <div className="text-xs text-gray-500">
                Per sale
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regret Display */}
      {aggregates.regret !== undefined && (
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                Regret: {formatCurrency(aggregates.regret)}
              </div>
              <div className="text-sm text-gray-600">
                Gap vs. optimal dynamic programming solution
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Sample Trial Revenue
            </h3>
            <p className="text-sm text-gray-600">
              Revenue progression for one simulation trial
            </p>
          </div>
          <RevenueChart sampleTrial={sampleTrial} />
        </div>

        {/* Inventory Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Sample Trial Inventory
            </h3>
            <p className="text-sm text-gray-600">
              Remaining capacity over time
            </p>
          </div>
          <InventoryChart sampleTrial={sampleTrial} initialCapacity={results.config.I} />
        </div>

        {/* Price Mix Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Price Mix Distribution
            </h3>
            <p className="text-sm text-gray-600">
              Distribution of prices used across all trials
            </p>
          </div>
          <PriceMixChart priceHistogram={results.price_histogram} priceMix={aggregates.price_mix} />
        </div>

        {/* Sales by Period Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Sales by Time Period
            </h3>
            <p className="text-sm text-gray-600">
              Number of sales per period across all trials
            </p>
          </div>
          <SalesByPeriodChart salesByPeriod={results.sales_by_period} sampleTrial={sampleTrial} />
        </div>
      </div>

      {/* Price Mix Summary */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Strategy Analysis
          </h3>
          <p className="text-sm text-gray-600">
            Key insights from your pricing strategy
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Price Distribution</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>LOW ($30K):</span>
                <span className="font-medium">{aggregates.price_mix.LOW} sales</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>MED ($40K):</span>
                <span className="font-medium">{aggregates.price_mix.MED} sales</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>HIGH ($50K):</span>
                <span className="font-medium">{aggregates.price_mix.HIGH} sales</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Performance</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Fill Rate:</span>
                <span className="font-medium">{formatPercentage(aggregates.fill_rate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Revenue:</span>
                <span className="font-medium">{formatCurrency(aggregates.avg_revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Revenue Std:</span>
                <span className="font-medium">{formatCurrency(aggregates.std_revenue)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Timing</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Last-Minute:</span>
                <span className="font-medium">{formatPercentage(aggregates.last_minute_share)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Price:</span>
                <span className="font-medium">{formatCurrency(aggregates.avg_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Trials:</span>
                <span className="font-medium">{results.config.trials.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="btn-secondary"
        >
          Start Over
        </button>
        
        <button
          onClick={onSubmit}
          className="btn-primary flex items-center space-x-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Submit for Grading</span>
        </button>
      </div>
    </div>
  )
}


