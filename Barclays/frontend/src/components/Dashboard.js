import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertList from './AlertList';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(userData));

    // Fetch alerts every 5 seconds
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/alerts');
        setAlerts(response.data.alerts || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch alerts: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchAlerts();

    // Then fetch every 5 seconds
    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [navigate]);

  const handleAlertSelect = (alert) => {
    navigate(`/sar/${alert.alert_id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">InteliSAR Dashboard</h1>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? 'Administrator' : 'Analyser'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            🚨 AML Fraud Detection System
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Status: {alerts.length} Pending Alerts</span>
            {loading && <span className="text-blue-600">Loading...</span>}
            {error && <span className="text-red-600">⚠️ {error}</span>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Suspicious Alerts</h3>
          <AlertList
            alerts={alerts}
            onSelectAlert={handleAlertSelect}
          />
        </div>

        {/* Admin Management Section (Only visible for admin role) */}
        {user.role === 'admin' && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Add Analyst Button */}
              <button
                type="button"
                className="bg-gradient-to-br from-green-500 to-green-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Analyst</span>
              </button>

              {/* View Analysts Button */}
              <button
                type="button"
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.646m0-8.646a4 4 0 100 8.646M9 9h.01M15 15h.01M9 15a6 6 0 1112 0" />
                </svg>
                <span>View Analysts</span>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>

              {/* Reports Button */}
              <button
                type="button"
                className="bg-gradient-to-br from-pink-500 to-pink-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Reports</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;