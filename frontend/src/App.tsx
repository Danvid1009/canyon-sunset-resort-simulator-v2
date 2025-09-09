import React, { useState } from 'react'
import { Header } from './components/Header'
import { UploadPanel } from './components/UploadPanel'
import { SimulationPanel } from './components/SimulationPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { SubmitPanel } from './components/SubmitPanel'
import { ConfigPanel } from './components/ConfigPanel'
import { useSimulation } from './hooks/useSimulation'
import { SimulationResults } from './types'

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'simulate' | 'results' | 'submit'>('upload')
  const [csvContent, setCsvContent] = useState<string>('')
  const [philosophy, setPhilosophy] = useState<string>('')
  const [results, setResults] = useState<SimulationResults | null>(null)
  
  const {
    runSimulation,
    isLoading,
    error,
    clearError
  } = useSimulation()

  const handleCsvUpload = (content: string) => {
    setCsvContent(content)
    setCurrentStep('simulate')
    clearError()
  }

  const handleSimulation = async (config?: any) => {
    if (!csvContent) return
    
    try {
      const simulationResults = await runSimulation(csvContent, config, philosophy)
      setResults(simulationResults)
      setCurrentStep('results')
    } catch (err) {
      console.error('Simulation failed:', err)
    }
  }

  const handleSubmit = () => {
    if (results) {
      setCurrentStep('submit')
    }
  }

  const handleReset = () => {
    setCsvContent('')
    setPhilosophy('')
    setResults(null)
    setCurrentStep('upload')
    clearError()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-canyon-50 to-sunset-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { key: 'upload', label: 'Upload Strategy', icon: '📁' },
                { key: 'simulate', label: 'Run Simulation', icon: '⚡' },
                { key: 'results', label: 'View Results', icon: '📊' },
                { key: 'submit', label: 'Submit', icon: '📤' }
              ].map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                    ${currentStep === step.key 
                      ? 'bg-canyon-600 text-white' 
                      : index < ['upload', 'simulate', 'results', 'submit'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {index < ['upload', 'simulate', 'results', 'submit'].indexOf(currentStep) ? '✓' : step.icon}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step.key ? 'text-canyon-600' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className={`ml-4 w-16 h-0.5 ${
                      index < ['upload', 'simulate', 'results', 'submit'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {error}
                </div>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Panel */}
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 'upload' && (
                <UploadPanel onUpload={handleCsvUpload} />
              )}
              
              {currentStep === 'simulate' && (
                <SimulationPanel
                  csvContent={csvContent}
                  onSimulate={handleSimulation}
                  isLoading={isLoading}
                  philosophy={philosophy}
                  setPhilosophy={setPhilosophy}
                />
              )}
              
              {currentStep === 'results' && results && (
                <ResultsPanel
                  results={results}
                  onSubmit={handleSubmit}
                  onReset={handleReset}
                />
              )}
              
              {currentStep === 'submit' && results && (
                <SubmitPanel
                  results={results}
                  philosophy={philosophy}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Right Column - Config Panel */}
            <div className="space-y-6">
              <ConfigPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App


