import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Settings = () => {
  const [settings, setSettings] = useState({
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  })

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('fareSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('fareSettings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'perKmRate' || key === 'baseFare' || key === 'minFare' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const resetToDefaults = () => {
    const defaultSettings = {
      perKmRate: 1.65,
      baseFare: 3.00,
      minFare: 25.00,
      currency: 'CAD'
    }
    setSettings(defaultSettings)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fare Settings</h1>
              <p className="mt-2 text-gray-600">Configure your taxi fare calculation parameters</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Calculator
            </Link>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="space-y-8">
            {/* Per Kilometer Rate */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Per Kilometer Rate ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.perKmRate}
                  onChange={(e) => updateSetting('perKmRate', e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2.25"
                />
                <span className="text-gray-500 text-sm">per km</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                The rate charged per kilometer traveled
              </p>
            </div>

            {/* Base Fare */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Base Fare ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.baseFare}
                  onChange={(e) => updateSetting('baseFare', e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3.00"
                />
                <span className="text-gray-500 text-sm">flat rate</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                The starting fare before distance calculation
              </p>
            </div>

            {/* Minimum Fare */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Minimum Fare ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.minFare}
                  onChange={(e) => updateSetting('minFare', e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10.00"
                />
                <span className="text-gray-500 text-sm">minimum</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                The minimum fare regardless of distance
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="INR">Indian Rupee (INR)</option>
              </select>
              <p className="mt-2 text-sm text-gray-600">
                The currency used for fare calculations
              </p>
            </div>

            {/* Formula Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Fare Calculation Formula</h3>
              <div className="text-center">
                <p className="text-2xl font-mono text-blue-800 mb-2">
                  Fare = max(MinFare, BaseFare + (PerKmRate × Distance))
                </p>
                <p className="text-sm text-blue-700">
                  Using your current settings: max({settings.currency} {settings.minFare}, {settings.currency} {settings.baseFare} + ({settings.currency} {settings.perKmRate} × Distance))
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={resetToDefaults}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
              >
                Reset to Defaults
              </button>
              <Link
                to="/"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save & Return to Calculator
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Settings are automatically saved and will be used for all fare calculations</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
