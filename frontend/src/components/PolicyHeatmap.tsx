import React, { useMemo } from 'react'
import Papa from 'papaparse'

interface PolicyHeatmapProps {
  csvContent: string
}

export function PolicyHeatmap({ csvContent }: PolicyHeatmapProps) {
  const { matrix, isValid } = useMemo(() => {
    if (!csvContent.trim()) {
      return { matrix: [], isValid: false }
    }

    try {
      const result = Papa.parse(csvContent.trim(), {
        skipEmptyLines: true,
        transform: (value) => value.trim().toUpperCase()
      })

      if (result.errors.length > 0) {
        return { matrix: [], isValid: false }
      }

      const rows = result.data as string[][]
      if (rows.length === 0) {
        return { matrix: [], isValid: false }
      }

      // Detect headers
      const firstRow = rows[0]
      const hasRowHeader = firstRow.some(cell => 
        cell && !['LOW', 'MED', 'HIGH', '30', '40', '50', '$30', '$40', '$50'].includes(cell)
      )

      // Extract matrix
      let matrix = hasRowHeader ? rows.slice(1) : rows
      
      // Check for column headers
      if (matrix.length > 0) {
        const firstColValues = matrix.map(row => row[0])
        const hasColHeader = firstColValues.some(cell => 
          cell && !['LOW', 'MED', 'HIGH', '30', '40', '50', '$30', '$40', '$50'].includes(cell)
        )
        
        if (hasColHeader) {
          matrix = matrix.map(row => row.slice(1))
        }
      }

      // Clean up empty rows
      matrix = matrix.filter(row => row.some(cell => cell))

      return { matrix, isValid: true }
    } catch (error) {
      return { matrix: [], isValid: false }
    }
  }, [csvContent])

  const getPriceColor = (value: string) => {
    const normalizedValue = value.toUpperCase()
    
    if (['HIGH', '50', '$50', '50000'].includes(normalizedValue)) {
      return 'bg-red-500 text-white'
    } else if (['MED', 'MEDIUM', '40', '$40', '40000'].includes(normalizedValue)) {
      return 'bg-yellow-500 text-white'
    } else if (['LOW', '30', '$30', '30000'].includes(normalizedValue)) {
      return 'bg-green-500 text-white'
    } else {
      return 'bg-gray-200 text-gray-600'
    }
  }

  const getPriceLabel = (value: string) => {
    const normalizedValue = value.toUpperCase()
    
    if (['HIGH', '50', '$50', '50000'].includes(normalizedValue)) {
      return 'HIGH'
    } else if (['MED', 'MEDIUM', '40', '$40', '40000'].includes(normalizedValue)) {
      return 'MED'
    } else if (['LOW', '30', '$30', '30000'].includes(normalizedValue)) {
      return 'LOW'
    } else {
      return value
    }
  }

  if (!isValid || matrix.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-lg mb-2">No valid policy matrix found</div>
        <div className="text-sm">Upload a valid CSV file to see your strategy</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm font-medium">HIGH ($50K)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm font-medium">MED ($40K)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm font-medium">LOW ($30K)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-20 h-8 text-xs font-medium text-gray-600 border border-gray-300 bg-gray-50">
                  Capacity
                </th>
                {Array.from({ length: matrix[0]?.length || 0 }, (_, i) => (
                  <th key={i} className="w-16 h-8 text-xs font-medium text-gray-600 border border-gray-300 bg-gray-50">
                    T{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-20 h-12 text-xs font-medium text-gray-600 border border-gray-300 bg-gray-50 text-center">
                    C{rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`
                        w-16 h-12 text-xs font-medium border border-gray-300 text-center
                        ${getPriceColor(cell)}
                      `}
                    >
                      {getPriceLabel(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600 text-center">
        Matrix dimensions: {matrix.length} capacity levels × {matrix[0]?.length || 0} time periods
      </div>
    </div>
  )
}


