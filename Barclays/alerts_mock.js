/**
 * Mock Alerts Service
 * Provides test alerts when database is unavailable
 */

const mockAlerts = [
  // === CRYPTOCURRENCY TRANSACTIONS ===
  {
    alert_id: 'ALERT_CRYPTO_001',
    transaction_id: 'TXN_CRYPTO_001',
    account_id: 'ACC_5006',
    customer_name: 'Rahul Patel',
    amount: 2.5,
    amount_usd: 95000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 96,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Transaction', 'High_Risk_Jurisdiction', 'Rapid_Transfer'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 1),
    transaction_date: new Date(Date.now() - 1000 * 60 * 5),
    description: 'Transfer of 2.5 BTC (~$95K) to cryptocurrency wallet in North Korea (DPRK)',
    destination: 'Cryptocurrency wallet address 1A1z7agoat2xhxQ1YiZcriqe8axHHzZyQw - Located in North Korea',
    foreign_country: 'North Korea',
  },
  {
    alert_id: 'ALERT_CRYPTO_002',
    transaction_id: 'TXN_CRYPTO_002',
    account_id: 'ACC_5007',
    customer_name: 'James Mitchell',
    amount: 5.8,
    amount_usd: 228000,
    currency_type: 'Ethereum',
    currency_code: 'ETH',
    confidence_score: 93,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Transaction', 'High_Value_Transfer', 'Layering_Pattern'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 3),
    transaction_date: new Date(Date.now() - 1000 * 60 * 8),
    description: 'Transfer of 5.8 ETH (~$228K) via multi-hop cryptocurrency exchange routing to Iran',
    destination: 'Cryptocurrency exchange in Iran (Tehran)',
    foreign_country: 'Iran',
  },
  {
    alert_id: 'ALERT_CRYPTO_003',
    transaction_id: 'TXN_CRYPTO_003',
    account_id: 'ACC_5008',
    customer_name: 'Lisa Chen',
    amount: 15.2,
    amount_usd: 342000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 91,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Mixing_Service', 'Sanctions_Evasion', 'Foreign_Currency'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 2),
    transaction_date: new Date(Date.now() - 1000 * 60 * 12),
    description: 'Large cryptocurrency mixing service transaction: 15.2 BTC sent to Tornado Cash mixer to obscure destination',
    destination: 'Tornado Cash cryptocurrency mixer service',
    foreign_country: 'Multiple (mixing service)',
  },
  {
    alert_id: 'ALERT_CRYPTO_004',
    transaction_id: 'TXN_CRYPTO_004',
    account_id: 'ACC_5009',
    customer_name: 'Ahmed Hassan',
    amount: 8.9,
    amount_usd: 156000,
    currency_type: 'Monero',
    currency_code: 'XMR',
    confidence_score: 94,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Privacy_Coin_Transaction', 'High_Risk_Activity', 'Sanctions_Violation'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 4),
    transaction_date: new Date(Date.now() - 1000 * 60 * 15),
    description: 'Private transfer using privacy-focused cryptocurrency Monero (8.9 XMR ~$156K) to Syrian entity (OFAC sanctioned)',
    destination: 'Cryptocurrency address in Syria (Damascus)',
    foreign_country: 'Syria',
  },
  {
    alert_id: 'ALERT_CRYPTO_005',
    transaction_id: 'TXN_CRYPTO_005',
    account_id: 'ACC_5010',
    customer_name: 'Maria Santos',
    amount: 42.3,
    amount_usd: 890000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 97,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Ransomware_Payment', 'Cryptocurrency_Transaction', 'High_Value_Transfer'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 1),
    transaction_date: new Date(Date.now() - 1000 * 60 * 20),
    description: 'Massive cryptocurrency ransom payment: 42.3 BTC (~$890K) transferred to known ransomware payment address',
    destination: 'Known ransomware gang wallet (Conti gang)',
    foreign_country: 'Russia',
  },
  {
    alert_id: 'ALERT_CRYPTO_006',
    transaction_id: 'TXN_CRYPTO_006',
    account_id: 'ACC_5011',
    customer_name: 'Viktor Sokolov',
    amount: 3.6,
    amount_usd: 158000,
    currency_type: 'Bitcoin Cash',
    currency_code: 'BCH',
    confidence_score: 88,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Transaction', 'Foreign_Currency', 'Fast_Exchange'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 5),
    transaction_date: new Date(Date.now() - 1000 * 60 * 25),
    description: 'Exchange of 3.6 BCH (~$158K) to Euro through unregulated cryptocurrency exchange in Eastern Europe',
    destination: 'Unregulated crypto exchange - Budapest, Hungary',
    foreign_country: 'Hungary',
  },
  {
    alert_id: 'ALERT_CRYPTO_007',
    transaction_id: 'TXN_CRYPTO_007',
    account_id: 'ACC_5012',
    customer_name: 'Yuki Tanaka',
    amount: 127.5,
    amount_usd: 2850000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 95,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Structured_Cryptocurrency_Transfers', 'Wire_Fraud', 'Foreign_Currency'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 6),
    transaction_date: new Date(Date.now() - 1000 * 60 * 30),
    description: 'Structured multi-wallet cryptocurrency transfers: 127.5 BTC (~$2.85M) distributed across 50+ wallets to Hong Kong entities',
    destination: 'Multiple wallets in Hong Kong (suspected fintech entities)',
    foreign_country: 'Hong Kong',
  },
  {
    alert_id: 'ALERT_CRYPTO_008',
    transaction_id: 'TXN_CRYPTO_008',
    account_id: 'ACC_5013',
    customer_name: 'Sofia Rodriguez',
    amount: 12.1,
    amount_usd: 425000,
    currency_type: 'Ethereum',
    currency_code: 'ETH',
    confidence_score: 89,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Dual_Currency_Transaction', 'Cryptocurrency_To_Foreign_Currency_Conversion'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 7),
    transaction_date: new Date(Date.now() - 1000 * 60 * 35),
    description: 'ETH to Colombian Peso conversion: 12.1 ETH (~$425K) exchanged to COP 1.8M through unregulated exchange',
    destination: 'Cryptocurrency exchange in Medellín, Colombia',
    foreign_country: 'Colombia',
  },
  {
    alert_id: 'ALERT_CRYPTO_009',
    transaction_id: 'TXN_CRYPTO_009',
    account_id: 'ACC_5014',
    customer_name: 'Dmitri Volkov',
    amount: 6.4,
    amount_usd: 182000,
    currency_type: 'Litecoin',
    currency_code: 'LTC',
    confidence_score: 87,
    risk_level: 'HIGH',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Transaction', 'Foreign_Currency_Exchange', 'High_Risk_Country'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 8),
    transaction_date: new Date(Date.now() - 1000 * 60 * 40),
    description: 'Litecoin to Russian Ruble conversion: 6.4 LTC (~$182K) exchanged via cryptocurrency desk in Moscow',
    destination: 'Cryptocurrency trading desk - Moscow, Russia',
    foreign_country: 'Russia',
  },
  {
    alert_id: 'ALERT_CRYPTO_010',
    transaction_id: 'TXN_CRYPTO_010',
    account_id: 'ACC_5015',
    customer_name: 'Priya Desai',
    amount: 28.7,
    amount_usd: 965000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 93,
    risk_level: 'CRITICAL',
    status: 'NEW',
    patterns_detected: ['Cryptocurrency_Money_Laundering', 'Foreign_Exchange', 'Structuring_Pattern'],
    alert_timestamp: new Date(Date.now() - 1000 * 60 * 9),
    transaction_date: new Date(Date.now() - 1000 * 60 * 45),
    description: 'Complex cryptocurrency funnel: 28.7 BTC (~$965K) converted to United Arab Emirates Dirhams (AED 3.54M) via Dubai crypto desk, then forwarded to 15 companies in Pakistan',
    destination: 'Cryptocurrency exchange - Dubai, UAE; then to business entities in Pakistan (Karachi/Lahore)',
    foreign_country: 'UAE and Pakistan',
  },
  // === ORIGINAL ALERTS ===
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
