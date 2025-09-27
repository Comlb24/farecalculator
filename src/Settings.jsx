import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { createPendingUser, checkUserApprovalStatus } from './firestoreService.js'
import { isSuperAdmin } from './config.js'

const Settings = () => {
  const { isDarkMode } = useTheme()
  const { currentUser, login, logout, signup, resetPassword } = useAuth()
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  })
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [approvalStatus, setApprovalStatus] = useState(null)
  const [showApprovalMessage, setShowApprovalMessage] = useState(false)
  const [settings, setSettings] = useState({
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  })

  // Check if user is super admin (bypasses approval)
  const isUserSuperAdmin = currentUser && isSuperAdmin(currentUser.email)

  // Check if user is admin and approved
  const isAdmin = currentUser && (
    isUserSuperAdmin || // Super admin bypass
    (approvalStatus === 'approved' && (
      currentUser.email === 'admin@farecalculator.com' || 
      currentUser.email?.includes('admin') ||
      currentUser.uid // For now, any authenticated user can access settings
    ))
  )

  // Check user approval status when user is logged in
  useEffect(() => {
    const checkApproval = async () => {
      if (currentUser) {
        // Skip approval check for super admins
        if (isUserSuperAdmin) {
          setApprovalStatus('approved')
          setShowApprovalMessage(false)
          return
        }
        
        try {
          const status = await checkUserApprovalStatus(currentUser.uid)
          setApprovalStatus(status.status)
          if (status.status === 'pending') {
            setShowApprovalMessage(true)
          }
        } catch (error) {
          console.error('Error checking approval status:', error)
        }
      } else {
        setApprovalStatus(null)
        setShowApprovalMessage(false)
      }
    }
    
    checkApproval()
  }, [currentUser, isUserSuperAdmin])

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

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)
    
    try {
      if (isSignUp) {
        // Create Firebase user first
        const userCredential = await signup(loginCredentials.email, loginCredentials.password)
        const user = userCredential.user
        
        // Create pending user request
        await createPendingUser({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          requestedBy: user.uid
        })
        
        setShowApprovalMessage(true)
        setLoginCredentials({ email: '', password: '' })
      } else {
        await login(loginCredentials.email, loginCredentials.password)
        setLoginCredentials({ email: '', password: '' })
      }
    } catch (error) {
      setLoginError(error.message || `Failed to ${isSignUp ? 'sign up' : 'login'}`)
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setLoginCredentials({ email: '', password: '' })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setLoginError('')
    setLoginCredentials({ email: '', password: '' })
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotPasswordMessage('')
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address')
      return
    }

    try {
      await resetPassword(forgotPasswordEmail)
      setForgotPasswordMessage('Password reset email sent! Check your inbox.')
      setForgotPasswordEmail('')
    } catch (error) {
      setForgotPasswordMessage(error.message)
    }
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
                {isAdmin ? 'Fare Settings' : 'Admin Login'}
              </h1>
              <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isAdmin ? 'Configure your taxi fare calculation parameters' : 'Please login to access settings'}
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
        {!isAdmin ? (
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
                  {isSignUp ? 'Create Admin Account' : 'Admin Access Required'}
                </h2>
                <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isSignUp ? 'Create an account to access fare settings' : 'Enter your credentials to access fare settings'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={loginCredentials.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter email"
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

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? (isSignUp ? 'Creating account...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
                  </button>
                  
                  <div className="text-center">
                    <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        className={`font-medium transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-blue-600 hover:text-blue-500'
                        }`}
                      >
                        {isSignUp ? 'Sign in' : 'Sign up'}
                      </button>
                      {!isSignUp && (
                        <>
                          {' • '}
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className={`font-medium transition-colors duration-200 ${
                              isDarkMode 
                                ? 'text-blue-400 hover:text-blue-300' 
                                : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            Forgot Password?
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </form>

            </div>
          </div>
        ) : showApprovalMessage ? (
          /* Approval Status Message */
          <div className={`rounded-xl shadow-lg p-8 border transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-black border-gray-800' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'
              }`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Account Created Successfully!
              </h2>
              <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your account has been created and is pending admin approval. You will be notified once your access is approved.
              </p>
              <div className={`mt-6 p-4 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-900/20 border-blue-700/30' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Status: <span className="font-semibold">Pending Approval</span>
                </p>
              </div>
              <button
                onClick={() => setShowApprovalMessage(false)}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Settings Form - Only shown when admin is authenticated */
          <>
            {/* Action Buttons */}
            <div className="mb-6 flex justify-between items-center">
              <div className="flex space-x-3">
                <Link
                  to="/history"
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    isDarkMode 
                      ? 'border-green-600 text-green-300 bg-green-900/20 hover:bg-green-900/30' 
                      : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View History
                </Link>
                
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                    isDarkMode 
                      ? 'border-purple-600 text-purple-300 bg-purple-900/20 hover:bg-purple-900/30' 
                      : 'border-purple-300 text-purple-700 bg-white hover:bg-purple-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Admin Panel
                </Link>
              </div>
              
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

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordMessage('');
                      setForgotPasswordEmail('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your email address"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    />
                  </div>
                  
                  {forgotPasswordMessage && (
                    <div className={`px-4 py-3 rounded ${
                      forgotPasswordMessage.includes('sent') 
                        ? 'bg-green-100 border border-green-400 text-green-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                      {forgotPasswordMessage}
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                        setForgotPasswordEmail('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
                    >
                      Send Reset Email
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings