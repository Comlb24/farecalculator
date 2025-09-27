import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext.jsx'

const Settings = () => {
  const { isDarkMode } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: ''
  })
  const [loginError, setLoginError] = useState('')
  const [settings, setSettings] = useState({
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  })

  // Default admin credentials (in a real app, this would be handled securely)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  }

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

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

  const handleLogin = (e) => {
    e.preventDefault()
    setLoginError('')
    
    if (loginCredentials.username === ADMIN_CREDENTIALS.username && 
        loginCredentials.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('isAuthenticated', 'true')
      setLoginCredentials({ username: '', password: '' })
    } else {
      setLoginError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
    setLoginCredentials({ username: '', password: '' })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLoginCredentials(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (loginError) {
      setLoginError('')
    }
  }

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
    <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isAuthenticated ? 'Fare Settings' : 'Admin Login'}
              </h1>
              <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isAuthenticated ? 'Configure your taxi fare calculation parameters' : 'Please login to access settings'}
              </p>
            </div>
            <Link
              to="/"
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              ← Back to Calculator
            </Link>
          </div>
        </div>

        {/* Login Form */}
        {!isAuthenticated ? (
          <div className={`rounded-xl shadow-lg p-8 border transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-black border-gray-800' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'
                }`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Admin Access Required
                </h2>
                <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enter your credentials to access fare settings
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={loginCredentials.username}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={loginCredentials.password}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter password"
                  />
                </div>

                {loginError && (
                  <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-700/30' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                      {loginError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login
                </button>
              </form>

            </div>
          </div>
        ) : (
          /* Settings Form - Only shown when authenticated */
          <>
            {/* Logout Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  isDarkMode 
                    ? 'border-red-600 text-red-300 bg-red-900/20 hover:bg-red-900/30' 
                    : 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

            {/* Settings Form */}
            <div className={`rounded-xl shadow-lg p-8 border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-black border-gray-800' 
                : 'bg-white border-gray-100'
            }`}>
          <div className="space-y-8">
            {/* Per Kilometer Rate */}
            <div>
              <label className={`block text-lg font-medium mb-3 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Per Kilometer Rate ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.perKmRate}
                  onChange={(e) => updateSetting('perKmRate', e.target.value)}
                  className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="2.25"
                />
                <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>per km</span>
              </div>
              <p className={`mt-2 text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                The rate charged per kilometer traveled
              </p>
            </div>

            {/* Base Fare */}
            <div>
              <label className={`block text-lg font-medium mb-3 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Base Fare ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.baseFare}
                  onChange={(e) => updateSetting('baseFare', e.target.value)}
                  className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="3.00"
                />
                <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>flat rate</span>
              </div>
              <p className={`mt-2 text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                The starting fare before distance calculation
              </p>
            </div>

            {/* Minimum Fare */}
            <div>
              <label className={`block text-lg font-medium mb-3 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Minimum Fare ({settings.currency})
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.minFare}
                  onChange={(e) => updateSetting('minFare', e.target.value)}
                  className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="10.00"
                />
                <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>minimum</span>
              </div>
              <p className={`mt-2 text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                The minimum fare regardless of distance
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className={`block text-lg font-medium mb-3 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="INR">Indian Rupee (INR)</option>
              </select>
              <p className={`mt-2 text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                The currency used for fare calculations
              </p>
            </div>


            {/* Formula Display */}
            <div className={`border rounded-lg p-6 transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-700/30' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 transition-colors duration-200 ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>Fare Calculation Formula</h3>
              <div className="text-center">
                <p className={`text-2xl font-mono mb-2 transition-colors duration-200 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  Fare = max(MinFare, BaseFare + (PerKmRate × Distance))
                </p>
                <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  Using your current settings: max({settings.currency} {settings.minFare}, {settings.currency} {settings.baseFare} + ({settings.currency} {settings.perKmRate} × Distance))
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={resetToDefaults}
                className={`flex-1 px-6 py-3 border rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Reset to Defaults
              </button>
              <Link
                to="/"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Save & Return to Calculator
              </Link>
            </div>

            {/* Footer Info */}
            <div className={`mt-8 text-center text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Settings are automatically saved and will be used for all fare calculations</p>
            </div>
          </div>
          </div>
        </>
        )}
      </div>
    </div>
  )
}

export default Settings