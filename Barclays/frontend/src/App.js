import React, { useState, useEffect } from 'react';
import './App.css';
import AlertList from './components/AlertList';
import SARPanel from './components/SARPanel';
import axios from 'axios';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch alerts every 5 seconds
  useEffect(() => {
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
  }, []);

  const handleAlertSelect = (alert) => {
    setSelectedAlert(alert);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚨 Barclays AML Fraud Detection System</h1>
        <div className="status">
          <span className="status-count">
            {alerts.length} Pending Alerts
          </span>
          {loading && <span className="status-loading">Loading...</span>}
          {error && <span className="status-error">⚠️ {error}</span>}
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          {/* Left Panel - Alerts List */}
          <div className="left-panel">
            <AlertList
              alerts={alerts}
              selectedAlert={selectedAlert}
              onSelectAlert={handleAlertSelect}
            />
          </div>

          {/* Right Panel - SAR Generation */}
          <div className="right-panel">
            {selectedAlert ? (
              <SARPanel alert={selectedAlert} />
            ) : (
              <div className="empty-state">
                <p>👈 Select an alert to generate SAR</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
