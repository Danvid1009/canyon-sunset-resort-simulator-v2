// API utility functions

const API_BASE_URL = '/api'

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.json()
  },

  // Get API configuration
  async getConfig() {
    const response = await fetch(`${API_BASE_URL}/config`)
    if (!response.ok) {
      throw new Error('Failed to fetch API configuration')
    }
    return response.json()
  },

  // Get CSV template
  async getTemplate(I?: number, T?: number) {
    const params = new URLSearchParams()
    if (I) params.append('I', I.toString())
    if (T) params.append('T', T.toString())
    
    const url = `${API_BASE_URL}/template${params.toString() ? `?${params}` : ''}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch CSV template')
    }
    return response.json()
  },

  // Validate CSV
  async validateCSV(csvContent: string) {
    const formData = new FormData()
    formData.append('csv_content', csvContent)

    const response = await fetch(`${API_BASE_URL}/validate-csv`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Validation failed')
    }

    return response.json()
  },

  // Run simulation
  async runSimulation(csvFile: File, config?: any, philosophy?: string) {
    const formData = new FormData()
    formData.append('csv_file', csvFile)
    
    if (config) {
      formData.append('config_json', JSON.stringify(config))
    }
    
    if (philosophy) {
      formData.append('philosophy', philosophy)
    }

    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Simulation failed')
    }

    return response.json()
  },

  // Submit strategy
  async submitStrategy(submissionData: any) {
    const response = await fetch(`${API_BASE_URL}/submit`, {
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

    return response.json()
  },

  // Get submission details
  async getSubmission(submissionId: string) {
    const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch submission details')
    }
    return response.json()
  },
}


