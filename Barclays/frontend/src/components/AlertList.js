import React from 'react';
import './AlertList.css';

function AlertList({ alerts, selectedAlert, onSelectAlert }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-list empty">
        <div className="empty-message">
          <p>✅ No pending alerts</p>
          <small>All transactions are within acceptable risk parameters</small>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-list">
      <h2>Pending Alerts ({alerts.length})</h2>
      <div className="alerts-container">
        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className={`alert-item ${selectedAlert?.alert_id === alert.alert_id ? 'active' : ''}`}
            onClick={() => onSelectAlert(alert)}
          >
            <div className="alert-header">
              <span className={`risk-badge ${alert.risk_level.toLowerCase()}`}>
                {alert.risk_level}
              </span>
              <span className="confidence-score">
                {alert.confidence_score}%
              </span>
            </div>

            <div className="alert-body">
              <p className="alert-id">
                <strong>Alert ID:</strong> {alert.alert_id}
              </p>
              <p className="transaction-id">
                <strong>Transaction:</strong> {alert.transaction_id}
              </p>
              <p className="account-id">
                <strong>Account:</strong> {alert.account_id}
              </p>
            </div>

            <div className="alert-footer">
              <p className="patterns">
                {alert.patterns_detected?.length || 0} patterns detected
              </p>
              <p className="timestamp">
                {new Date(alert.alert_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertList;
