import React, { useState, useEffect } from 'react'
import { useTheme } from './ThemeContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { getPendingUsers, approveUser, rejectUser } from './firestoreService.js'
import { canAccessAdminPanel } from './config.js'

const AdminPanel = () => {
  const { isDarkMode } = useTheme()
  const { currentUser } = useAuth()
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(null)

  // Check if user can access admin panel
  const canAccess = currentUser && canAccessAdminPanel(currentUser.email)

  useEffect(() => {
    if (canAccess) {
      loadPendingUsers()
    }
  }, [canAccess])

  // Show access denied if not authorized
  if (currentUser && !canAccess) {
    return (
      <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
            }`}>
              <svg className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Access Denied
            </h1>
            <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Please log in to access the admin panel
            </h1>
            <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You need to be logged in as a super admin to manage user approvals.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const loadPendingUsers = async () => {
    try {
      setLoading(true)
      const users = await getPendingUsers()
      setPendingUsers(users)
    } catch (error) {
      console.error('Error loading pending users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId)
      await approveUser(userId, currentUser.uid)
      await loadPendingUsers() // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId) => {
    try {
      setActionLoading(userId)
      await rejectUser(userId, currentUser.uid, rejectionReason)
      setShowRejectModal(null)
      setRejectionReason('')
      await loadPendingUsers() // Refresh the list
    } catch (error) {
      console.error('Error rejecting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading pending users...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Admin Panel - User Approvals
          </h1>
          <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage pending user approval requests
          </p>
        </div>

        {/* Pending Users List */}
        <div className={`rounded-xl shadow-lg border transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-black border-gray-800' 
            : 'bg-white border-gray-100'
        }`}>
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDarkMode ? 'bg-green-900/20' : 'bg-green-100'
              }`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No Pending Requests
              </h3>
              <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                All user requests have been processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Email
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Requested At
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${
                  isDarkMode ? 'divide-gray-700 bg-black' : 'divide-gray-200 bg-white'
                }`}>
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-600'
                            }`}>
                              {user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {user.displayName || 'No Name'}
                            </div>
                            <div className={`text-sm transition-colors duration-200 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              ID: {user.userId?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {user.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {formatDate(user.requestedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                          >
                            {actionLoading === user.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setShowRejectModal(user.id)}
                            disabled={actionLoading === user.id}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-full max-w-md mx-4 transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Reject User Request
              </h3>
              <p className={`text-sm mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Please provide a reason for rejecting this user request:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectionReason('')
                  }}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={actionLoading === showRejectModal}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {actionLoading === showRejectModal ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
