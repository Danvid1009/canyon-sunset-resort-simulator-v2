import React from 'react'
import { Settings, Info, Target, Clock, DollarSign } from 'lucide-react'
import { useApiConfig } from '../hooks/useSimulation'

export function ConfigPanel() {
  const { data: config, isLoading, error } = useApiConfig()

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="card">
        <div className="text-center text-gray-500">
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <p>Configuration unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assignment Configuration */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            <Settings className="w-5 h-5 inline mr-2" />
            Assignment Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Current assignment parameters and constraints.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Assignment Version</span>
            <span className="text-sm font-medium text-gray-900">
              {config.assignment_version}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Max Trials</span>
            <span className="text-sm font-medium text-gray-900">
              {config.max_trials.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">RNG Seed</span>
            <span className="text-sm font-medium text-gray-900">
              {config.rng_seed}
            </span>
          </div>
        </div>
      </div>

      {/* Locked Dimensions */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            <Target className="w-5 h-5 inline mr-2" />
            Locked Dimensions
          </h3>
          <p className="text-sm text-gray-600">
            Fixed parameters for this assignment.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Capacity Levels (I)</span>
            <span className="text-sm font-medium text-gray-900">
              {config.locked_dimensions.I}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Time Periods (T)</span>
            <span className="text-sm font-medium text-gray-900">
              {config.locked_dimensions.T}
            </span>
          </div>
        </div>
      </div>

      {/* Price Configuration */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            <DollarSign className="w-5 h-5 inline mr-2" />
            Price Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Valid price levels and their values.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">LOW Price</span>
            <span className="text-sm font-medium text-gray-900">
              ${config.price_mapping.LOW.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">MED Price</span>
            <span className="text-sm font-medium text-gray-900">
              ${config.price_mapping.MED.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">HIGH Price</span>
            <span className="text-sm font-medium text-gray-900">
              ${config.price_mapping.HIGH.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sale Probabilities */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            <Clock className="w-5 h-5 inline mr-2" />
            Sale Probabilities
          </h3>
          <p className="text-sm text-gray-600">
            Probability of sale at each price level.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">LOW Price Sale Rate</span>
            <span className="text-sm font-medium text-gray-900">
              {(config.sale_probabilities[30000] * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">MED Price Sale Rate</span>
            <span className="text-sm font-medium text-gray-900">
              {(config.sale_probabilities[40000] * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">HIGH Price Sale Rate</span>
            <span className="text-sm font-medium text-gray-900">
              {(config.sale_probabilities[50000] * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            <Info className="w-5 h-5 inline mr-2" />
            Instructions
          </h3>
        </div>
        
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Upload a CSV file with your pricing strategy</p>
          <p>• Matrix dimensions must be {config.locked_dimensions.I} × {config.locked_dimensions.T}</p>
          <p>• Use LOW, MED, HIGH or 30, 40, 50 or $30, $40, $50</p>
          <p>• Provide a strategy philosophy for grading</p>
          <p>• Results are deterministic with the same seed</p>
        </div>
      </div>
    </div>
  )
}
