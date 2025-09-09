import React, { useState } from 'react'
import { CheckCircle, Upload, User, Mail, FileText, AlertCircle } from 'lucide-react'
import { SimulationResults } from '../types'
import { useSimulation } from '../hooks/useSimulation'
import toast from 'react-hot-toast'

interface SubmitPanelProps {
  results: SimulationResults
  philosophy: string
  onReset: () => void
}

export function SubmitPanel({ results, philosophy, onReset }: SubmitPanelProps) {
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState('')

  const { submitStrategy } = useSimulation()

  const handleSubmit = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error('Please provide both name and email')
      return
    }

    if (!philosophy.trim()) {
      toast.error('Please provide a strategy philosophy')
      return
    }

    setIsSubmitting(true)
    try {
      const id = await submitStrategy(results, philosophy, studentEmail, studentName)
      setSubmissionId(id)
      setSubmitted(true)
      toast.success('Strategy submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit strategy')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Strategy Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your pricing strategy has been submitted for grading.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Submission ID:</p>
            <p className="font-mono text-lg font-bold text-gray-900">{submissionId}</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={onReset}
              className="btn btn-primary w-full"
            >
              Submit Another Strategy
            </button>
            <p className="text-sm text-gray-500">
              Save your submission ID for future reference.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Information */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Student Information
          </h2>
          <p className="text-gray-600">
            Provide your details for submission tracking.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canyon-500 focus:border-canyon-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canyon-500 focus:border-canyon-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Strategy Philosophy Review */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            <FileText className="w-5 h-5 inline mr-2" />
            Strategy Philosophy
          </h2>
          <p className="text-gray-600">
            Review your strategy rationale before submission.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 whitespace-pre-wrap">
            {philosophy || 'No philosophy provided'}
          </p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Strategy Performance Summary
          </h2>
          <p className="text-gray-600">
            Key metrics from your simulation results.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Average Revenue</div>
            <div className="text-2xl font-bold text-blue-900">
              ${results.aggregates.avg_revenue.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Fill Rate</div>
            <div className="text-2xl font-bold text-green-900">
              {(results.aggregates.fill_rate * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Average Price</div>
            <div className="text-2xl font-bold text-purple-900">
              ${results.aggregates.avg_price.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Last-Minute Share</div>
            <div className="text-2xl font-bold text-orange-900">
              {(results.aggregates.last_minute_share * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">
              Review all information before submitting
            </span>
          </div>
          
          <div className="space-x-3">
            <button
              onClick={onReset}
              className="btn btn-secondary"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !studentName.trim() || !studentEmail.trim() || !philosophy.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Strategy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
