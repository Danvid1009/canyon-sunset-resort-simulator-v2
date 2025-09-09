import React, { useState } from 'react'
import { Play, Settings, FileText } from 'lucide-react'
import { PolicyHeatmap } from './PolicyHeatmap'

interface SimulationPanelProps {
  csvContent: string
  onSimulate: (config?: any) => void
  isLoading: boolean
  philosophy: string
  setPhilosophy: (value: string) => void
}

export function SimulationPanel({
  csvContent,
  onSimulate,
  isLoading,
  philosophy,
  setPhilosophy
}: SimulationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [config, setConfig] = useState({
    trials: 2000,
    last_minute_k: 3,
    seed: 42
  })

  const handleSimulate = () => {
    const simulationConfig = showAdvanced ? config : undefined
    onSimulate(simulationConfig)
  }

  return (
    <div className="space-y-6">
      {/* Policy Preview */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Strategy Preview
          </h2>
          <p className="text-gray-600">
            Review your pricing strategy before running the simulation.
          </p>
        </div>
        
        <PolicyHeatmap csvContent={csvContent} />
      </div>

      {/* Philosophy Input */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Strategy Philosophy
          </h2>
          <p className="text-gray-600">
            Describe your pricing strategy rationale (optional but recommended for grading).
          </p>
        </div>
        
        <textarea
          value={philosophy}
          onChange={(e) => setPhilosophy(e.target.value)}
          placeholder="Explain your pricing strategy rationale, key decisions, and expected outcomes..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canyon-500 focus:border-canyon-500 resize-none"
          maxLength={1000}
        />
        <div className="text-sm text-gray-500 mt-1">
          {philosophy.length}/1000 characters
        </div>
      </div>

      {/* Simulation Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Simulation Configuration
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="label">Number of Trials</label>
              <input
                type="number"
                value={config.trials}
                onChange={(e) => setConfig({ ...config, trials: parseInt(e.target.value) || 2000 })}
                min="100"
                max="10000"
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                More trials = more accurate results, but slower simulation
              </p>
            </div>

            <div>
              <label className="label">Last-Minute Periods (k)</label>
              <input
                type="number"
                value={config.last_minute_k}
                onChange={(e) => setConfig({ ...config, last_minute_k: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of final periods for last-minute share calculation
              </p>
            </div>

            <div>
              <label className="label">Random Seed</label>
              <input
                type="number"
                value={config.seed}
                onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value) || 42 })}
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                Seed for deterministic results (same seed = same results)
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Simulation Parameters</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Capacity:</strong> 7 wedding slots</li>
                <li>• <strong>Periods:</strong> 15 selling opportunities</li>
                <li>• <strong>Sale Probabilities:</strong> LOW (90%), MED (80%), HIGH (40%)</li>
                <li>• <strong>Prices:</strong> LOW ($30K), MED ($40K), HIGH ($50K)</li>
                <li>• <strong>Deterministic:</strong> Same random numbers for all students</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 text-lg py-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Running Simulation...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Run Simulation</span>
            </>
          )}
        </button>

        {isLoading && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-800">
                Running Monte Carlo simulation with {config.trials} trials...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


