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
      </main>
    </div>
  );
};

export default Dashboard;