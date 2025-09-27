import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllFareCalculations, deleteFareCalculation } from './firestoreService';
import { useTheme } from './ThemeContext.jsx';

const History = () => {
  const { isDarkMode } = useTheme();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadCalculations = async () => {
      try {
        setLoading(true);
        const data = await getAllFareCalculations(50);
        setCalculations(data);
      } catch (err) {
        setError('Failed to load calculation history');
        console.error('Error loading calculations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCalculations();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDeleteCalculation = async (calculationId) => {
    if (!window.confirm('Are you sure you want to delete this calculation? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(calculationId);
      await deleteFareCalculation(calculationId);
      
      // Remove the deleted calculation from the local state
      setCalculations(prev => prev.filter(calc => calc.id !== calculationId));
      
      console.log('Calculation deleted successfully');
    } catch (err) {
      console.error('Error deleting calculation:', err);
      setError('Failed to delete calculation');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center p-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
            <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`p-4 rounded-lg border transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-700/30 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Calculation History
              </h1>
              <p className={`mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                View all your previous fare calculations
              </p>
            </div>
            <Link
              to="/settings"
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              ← Back to Settings
            </Link>
          </div>
        </div>

        {/* History Content */}
        <div className={`rounded-xl shadow-lg p-8 border transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-black border-gray-800' 
            : 'bg-white border-gray-100'
        }`}>
          {calculations.length === 0 ? (
            <div className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={`text-lg transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No calculations found.
              </p>
              <p className={`text-sm mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your fare calculations will appear here after you make some estimates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculations.map((calc) => (
                <div key={calc.id} className={`border rounded-lg p-4 shadow-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {calc.pickupAddress} → {calc.dropoffAddress}
                        {calc.secondDropoffAddress && ` → ${calc.secondDropoffAddress}`}
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Distance: {calc.distance} • Travel Time: {calc.travelTime}
                      </div>
                      <div className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Passengers: {calc.numberOfPassengers} • {calc.isReturnTrip ? 'Return Trip' : 'One Way'}
                      </div>
                      {calc.customerName && (
                        <div className={`text-sm mt-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Customer: {calc.customerName}
                        </div>
                      )}
                      {calc.phoneNumber && (
                        <div className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Phone: {calc.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <div className={`text-lg font-bold transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {calc.currency} {calc.calculatedFare?.toFixed(2)}
                        </div>
                        <div className={`text-xs transition-colors duration-200 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(calc.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCalculation(calc.id)}
                        disabled={deletingId === calc.id}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDarkMode 
                            ? 'bg-red-900/20 text-red-300 border border-red-700/30 hover:bg-red-900/30' 
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                        title="Delete this calculation"
                      >
                        {deletingId === calc.id ? (
                          <div className="flex items-center">
                            <div className={`animate-spin rounded-full h-3 w-3 border-b border-current mr-1`}></div>
                            Deleting...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;