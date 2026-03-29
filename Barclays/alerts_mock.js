/**
 * Mock Alerts Service
 * Provides test alerts when database is unavailable
 */

const mockAlerts = [
  {
    alert_id: 'ALERT_001',
    transaction_id: 'TXN_10001',
    account_id: 'ACC_5001',
    customer_name: 'John Smith',
    amount: 250000,
    confidence_score: 92,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Unusual_Transaction_Amount', 'Rapid_Fund_Movement', 'Multiple_Countries'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 5),
    transaction_date: new Date(Date.now() - 1000 * 60 * 30),
    description: 'Large international transfer detected',
  },
  {
    alert_id: 'ALERT_002',
    transaction_id: 'TXN_10002',
    account_id: 'ACC_5002',
    customer_name: 'Sarah Johnson',
    amount: 150000,
    confidence_score: 87,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Round_Amount', 'Frequent_Transfers', 'Structuring'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 15),
    transaction_date: new Date(Date.now() - 1000 * 60 * 45),
    description: 'Potential structuring pattern detected',
  },
  {
    alert_id: 'ALERT_003',
    transaction_id: 'TXN_10003',
    account_id: 'ACC_5003',
    customer_name: 'Michael Chen',
    amount: 500000,
    confidence_score: 95,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Offshore_Transaction', 'High_Risk_Country', 'Large_Amount'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 2),
    transaction_date: new Date(Date.now() - 1000 * 60 * 10),
    description: 'Critical: Large transfer to high-risk jurisdiction',
  },
  {
    alert_id: 'ALERT_004',
    transaction_id: 'TXN_10004',
    account_id: 'ACC_5004',
    customer_name: 'Emma Wilson',
    amount: 75000,
    confidence_score: 78,
    risk_level: 'MEDIUM',
    status: 'NEW',
    patterns_detected: ['Unusual_Time', 'Account_Behavior_Change'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 25),
    transaction_date: new Date(Date.now() - 1000 * 60 * 60),
    description: 'Unusual transaction timing detected',
  },
  {
    alert_id: 'ALERT_005',
    transaction_id: 'TXN_10005',
    account_id: 'ACC_5005',
    customer_name: 'David Brown',
    amount: 320000,
    confidence_score: 88,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Multiple_Beneficiaries', 'Rapid_Movement'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 35),
    transaction_date: new Date(Date.now() - 1000 * 60 * 90),
    description: 'Multiple beneficiary transactions in short timeframe',
  },
];

/**
 * Get all pending alerts
 */
function mockGetAlerts() {
  return mockAlerts;
}

/**
 * Get specific alert by ID
 */
function mockGetAlertById(alertId) {
  return mockAlerts.find(alert => alert.alert_id === alertId);
}

/**
 * Get alerts with filters
 */
function mockGetFilteredAlerts(filters) {
  let results = [...mockAlerts];

  if (filters.risk_level) {
    results = results.filter(a => a.risk_level === filters.risk_level);
  }

  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }

  if (filters.confidence_min) {
    results = results.filter(a => a.confidence_score >= filters.confidence_min);
  }

  return results;
}

module.exports = {
  mockGetAlerts,
  mockGetAlertById,
  mockGetFilteredAlerts,
};
