import { useState } from 'react'
import { useQuery } from 'react-query'
import { SimulationResults, CSVValidationResult, ApiConfig } from '../types'
import { api } from '../utils/api'

export function useSimulation() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const clearError = () => setError(null)

  const runSimulation = async (
    csvContent: string,
    config?: any,
    philosophy?: string
  ): Promise<SimulationResults> => {
    try {
      setError(null)
      setIsLoading(true)
      
      // Create FormData for multipart upload
      const formData = new FormData()
      
      // Create a CSV file blob
      const csvBlob = new Blob([csvContent], { type: 'text/csv' })
      formData.append('csv_file', csvBlob, 'strategy.csv')
      
      // Add optional config
      if (config) {
        formData.append('config_json', JSON.stringify(config))
      }
      
      // Add philosophy
      if (philosophy) {
        formData.append('philosophy', philosophy)
      }

      const response = await fetch('/api/simulate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Simulation failed')
      }

      const results = await response.json()
      return results as SimulationResults
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const validateCSV = async (csvContent: string): Promise<CSVValidationResult> => {
    try {
      const formData = new FormData()
      formData.append('csv_content', csvContent)

      const response = await fetch('/api/validate-csv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Validation failed')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed'
      setError(errorMessage)
      throw err
    }
  }

  const submitStrategy = async (
    results: SimulationResults,
    philosophy: string,
    studentEmail: string,
    studentName: string
  ): Promise<string> => {
    try {
      setError(null)

      const submissionData = {
        simulation_results: results,
        philosophy,
        student_email: studentEmail,
        student_name: studentName,
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Submission failed')
      }

      const result = await response.json()
      return result.submission_id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed'
      setError(errorMessage)
      throw err
    }
  }

  return {
    runSimulation,
    validateCSV,
    submitStrategy,
    error,
    isLoading,
    clearError,
  }
}

export function useApiConfig() {
  return useQuery<ApiConfig>('api-config', async () => {
    const response = await fetch('/api/config')
    if (!response.ok) {
      throw new Error('Failed to fetch API configuration')
    }
    return response.json()
  })
}

export function useCSVTemplate() {
  return useQuery<{ template: string; dimensions: { I: number; T: number } }>(
    'csv-template',
    async () => {
      const response = await fetch('/api/template')
      if (!response.ok) {
        throw new Error('Failed to fetch CSV template')
      }
      return response.json()
    }
  )
}


