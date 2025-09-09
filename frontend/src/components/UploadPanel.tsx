import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Download, AlertCircle } from 'lucide-react'
import { useCSVTemplate } from '../hooks/useSimulation'
import { CSVValidationResult } from '../types'
import { api } from '../utils/api'
import toast from 'react-hot-toast'

interface UploadPanelProps {
  onUpload: (csvContent: string) => void
}

export function UploadPanel({ onUpload }: UploadPanelProps) {
  const [csvContent, setCsvContent] = useState<string>('')
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  
  const { data: templateData, isLoading: templateLoading } = useCSVTemplate()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    try {
      const content = await file.text()
      setCsvContent(content)
      await validateCSV(content)
    } catch (error) {
      toast.error('Failed to read CSV file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const validateCSV = async (content: string) => {
    setIsValidating(true)
    try {
      const result = await api.validateCSV(content)
      setValidationResult(result)
      
      if (result.valid) {
        toast.success('CSV validation successful!')
        onUpload(content)
      } else {
        toast.error('CSV validation failed')
      }
    } catch (error) {
      toast.error('Validation failed')
      setValidationResult({ valid: false, errors: [] })
    } finally {
      setIsValidating(false)
    }
  }

  const downloadTemplate = () => {
    if (!templateData) return
    
    const blob = new Blob([templateData.template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canyon_sunset_strategy_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Pricing Strategy
        </h2>
        <p className="text-gray-600">
          Upload a CSV file containing your dynamic pricing strategy for the Canyon Sunset Resort wedding venue.
        </p>
      </div>

      {/* Template Download */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Need a template?</h3>
              <p className="text-sm text-blue-700">
                Download our CSV template to get started
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            disabled={templateLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-canyon-400 bg-canyon-50' 
            : 'border-gray-300 hover:border-canyon-400 hover:bg-canyon-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-lg text-canyon-600 font-medium">
            Drop your CSV file here...
          </p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 font-medium mb-2">
              Drag & drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported format: CSV files only
            </p>
          </div>
        )}
      </div>

      {/* Validation Status */}
      {isValidating && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-yellow-800">Validating CSV...</span>
          </div>
        </div>
      )}

      {validationResult && !validationResult.valid && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-900">Validation Errors</h3>
          </div>
          <div className="space-y-2">
            {validationResult.errors?.map((error, index) => (
              <div key={index} className="text-sm text-red-800">
                <strong>Row {error.row}, Column {error.col}:</strong> {error.message}
                {error.value && <span className="ml-2 text-red-600">(Value: "{error.value}")</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {validationResult?.valid && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 text-green-600">✓</div>
            <h3 className="font-medium text-green-900">CSV Validated Successfully</h3>
          </div>
          {validationResult.dimensions && (
            <p className="text-sm text-green-700 mt-1">
              Dimensions: {validationResult.dimensions.I} capacity levels × {validationResult.dimensions.T} time periods
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Dimensions: 7 rows (capacity levels) × 15 columns (time periods)</li>
          <li>• Valid price values: LOW, MED, HIGH or 30, 40, 50 or $30, $40, $50</li>
          <li>• Optional headers in first row and/or first column</li>
          <li>• Price mapping: LOW=$30,000, MED=$40,000, HIGH=$50,000</li>
        </ul>
      </div>
    </div>
  )
}


