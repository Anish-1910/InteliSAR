import React, { useState } from 'react';
import './AlertList.css';

function AlertList({ alerts, onSelectAlert }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Calculate pagination
  const totalPages = Math.ceil((alerts?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = alerts?.slice(startIndex, endIndex) || [];

  // Reset to first page when items per page changes
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Handle page navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle alert selection
  const handleAlertClick = (alert) => {
    onSelectAlert(alert);
  };

  // Get risk level styling
  const getRiskLevelStyle = (riskLevel) => {
    const styles = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      medium: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      low: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      minimal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
    };
    return styles[riskLevel?.toLowerCase()] || styles.low;
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-list empty">
        <div className="empty-message">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Alerts</h3>
            <p className="text-gray-600">All transactions are within acceptable risk parameters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-list">
      {/* Header */}
      <div className="alert-list-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Suspicious Activity Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">
              {alerts.length} pending alert{alerts.length !== 1 ? 's' : ''} requiring review
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 per page</option>
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="alert-table-container">
        <table className="alert-table">
          <thead className="alert-table-header">
            <tr>
              <th className="alert-table-th">Alert ID</th>
              <th className="alert-table-th">Risk Level</th>
              <th className="alert-table-th">Confidence</th>
              <th className="alert-table-th">Transaction ID</th>
              <th className="alert-table-th">Account ID</th>
              <th className="alert-table-th">Customer</th>
              <th className="alert-table-th">Patterns</th>
              <th className="alert-table-th">Status</th>
              <th className="alert-table-th">Date/Time</th>
            </tr>
          </thead>
          <tbody className="alert-table-body">
            {currentAlerts.map((alert) => {
              const riskStyle = getRiskLevelStyle(alert.risk_level);

              return (
                <tr
                  key={alert.alert_id}
                  onClick={() => handleAlertClick(alert)}
                  className="alert-table-row hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="alert-table-td font-mono text-sm">
                    <div className="font-semibold text-blue-600">{alert.alert_id}</div>
                  </td>
                  <td className="alert-table-td">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}>
                      {alert.risk_level}
                    </span>
                  </td>
                  <td className="alert-table-td">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${alert.confidence_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {alert.confidence_score}%
                      </span>
                    </div>
                  </td>
                  <td className="alert-table-td font-mono text-sm text-gray-700">
                    {alert.transaction_id}
                  </td>
                  <td className="alert-table-td font-mono text-sm text-gray-700">
                    {alert.account_id}
                  </td>
                  <td className="alert-table-td">
                    <div className="text-sm text-gray-900">
                      {alert.customer_name || 'Unknown Customer'}
                    </div>
                  </td>
                  <td className="alert-table-td">
                    <div className="flex flex-wrap gap-1">
                      {alert.patterns_detected && alert.patterns_detected.length > 0 ? (
                        alert.patterns_detected.slice(0, 2).map((pattern, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                          >
                            {pattern.replace(/[{"}]/g, '')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No patterns</span>
                      )}
                      {alert.patterns_detected && alert.patterns_detected.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{alert.patterns_detected.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="alert-table-td">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Pending
                    </span>
                  </td>
                  <td className="alert-table-td text-sm text-gray-600">
                    {new Date(alert.alert_timestamp).toLocaleDateString()} <br />
                    <span className="text-xs text-gray-500">
                      {new Date(alert.alert_timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="alert-pagination">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, alerts.length)} of {alerts.length} alerts
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertList;
