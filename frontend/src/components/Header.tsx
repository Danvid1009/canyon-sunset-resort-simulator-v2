import React from 'react'
import { Mountain, Sun } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Mountain className="h-8 w-8 text-canyon-600" />
              <Sun className="h-6 w-6 text-sunset-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Canyon Sunset Resort
              </h1>
              <p className="text-sm text-gray-600">
                Dynamic Pricing Strategy Simulator
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Assignment v2.0
              </div>
              <div className="text-xs text-gray-500">
                Wedding Venue Pricing
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


