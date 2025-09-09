// Type definitions for the Canyon Sunset Resort Simulator

export interface SimulationConfig {
  I: number
  T: number
  trials: number
  seed?: number
  last_minute_k: number
}

export interface PolicyMatrix {
  matrix: number[][]
  I: number
  T: number
}

export interface SimulationAggregates {
  avg_revenue: number
  std_revenue: number
  fill_rate: number
  avg_price: number
  last_minute_share: number
  regret?: number
  price_mix: {
    LOW: number
    MED: number
    HIGH: number
  }
}

export interface TrialStep {
  period: number
  remaining_capacity: number
  price: number
  sold: boolean
  revenue: number
}

export interface SampleTrial {
  trial_id: number
  steps: TrialStep[]
  total_revenue: number
}

export interface SimulationResults {
  config: SimulationConfig
  policy: PolicyMatrix
  aggregates: SimulationAggregates
  sample_trial: SampleTrial
  price_histogram: {
    LOW: number
    MED: number
    HIGH: number
  }
  sales_by_period: number[]
}

export interface CSVValidationError {
  row: number
  col: number
  value: string
  message: string
}

export interface CSVValidationResult {
  valid: boolean
  errors?: CSVValidationError[]
  dimensions?: {
    I: number
    T: number
  }
  matrix_preview?: string[][]
}

export interface SubmissionRequest {
  simulation_results: SimulationResults
  philosophy: string
  student_email: string
  student_name: string
}

export interface SubmissionResponse {
  submission_id: string
  message: string
}

export interface ApiConfig {
  assignment_version: string
  locked_dimensions: {
    I: number
    T: number
  }
  max_trials: number
  rng_seed: number
  price_mapping: {
    LOW: number
    MED: number
    HIGH: number
  }
  sale_probabilities: {
    [key: number]: number
  }
}

export interface HeatmapData {
  data: Array<Array<{
    value: number
    label: string
    color: string
  }>>
  xLabels: string[]
  yLabels: string[]
  colors: {
    [key: number]: string
  }
}


