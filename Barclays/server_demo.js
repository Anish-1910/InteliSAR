/**
 * BARCLAYS AML DEMO SERVER - No Database Required
 * This is a demo version that simulates the backend without needing PostgreSQL
 * Perfect for testing the React frontend and SAR generation
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cron = require('node-cron');
const { generateSAR } = require('./sar-generator');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(express.json());

// Configuration
const ML_SERVICE_URL = 'http://localhost:5000';
const ALERT_THRESHOLD = 90;

// In-memory storage (demo only)
let alerts = [];
let alertIdCounter = 1;
let transactionIdCounter = 1001;

// Sample demo alerts to simulate real system
const sampleAlerts = [
  {
    account_id: 'ACC_001',
    transaction_id: 'TXN_001',
    confidence_score: 95,
    risk_level: 'CRITICAL',
    patterns_detected: ['Sudden Spike', 'Structuring'],
    transaction_amount: 50000,
    timestamp: new Date(Date.now() - 2 * 60000),
    description: 'Multiple rapid transactions exceeding normal account behavior'
  },
  {
    account_id: 'ACC_002',
    transaction_id: 'TXN_002',
    confidence_score: 88,
    risk_level: 'HIGH',
    patterns_detected: ['Geographic Change', 'New Account Activity'],
    transaction_amount: 35000,
    timestamp: new Date(Date.now() - 5 * 60000),
    description: 'Sudden account activation from new geographic location'
  },
  {
    account_id: 'ACC_003',
    transaction_id: 'TXN_003',
    confidence_score: 72,
    risk_level: 'MEDIUM',
    patterns_detected: ['Layering'],
    transaction_amount: 25000,
    timestamp: new Date(Date.now() - 10 * 60000),
    description: 'Complex transaction pattern with multiple beneficiaries'
  },
  {
    account_id: 'ACC_004',
    transaction_id: 'TXN_004',
    confidence_score: 92,
    risk_level: 'CRITICAL',
    patterns_detected: ['Time Anomaly', 'Velocity Change'],
    transaction_amount: 75000,
    timestamp: new Date(Date.now() - 15 * 60000),
    description: 'Unusual transaction timing outside normal business hours'
  },
  {
    account_id: 'ACC_005',
    transaction_id: 'TXN_005',
    confidence_score: 81,
    risk_level: 'HIGH',
    patterns_detected: ['Circular Transactions'],
    transaction_amount: 45000,
    timestamp: new Date(Date.now() - 20 * 60000),
    description: 'Money flow detected returning to original sender'
  }
];

// Initialize with sample alerts
function initializeSampleAlerts() {
  sampleAlerts.forEach(alert => {
    alerts.push({
      id: `ALERT_${alertIdCounter++}`,
      ...alert,
      status: 'pending',
      created_at: alert.timestamp,
      acknowledged: false,
      resolved: false
    });
  });
  console.log(`✓ Initialized ${alerts.length} sample alerts for demo`);
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/alerts
 * Fetch all pending alerts
 */
app.get('/api/alerts', (req, res) => {
  const pendingAlerts = alerts.filter(a => a.status === 'pending' && !a.resolved);
  res.json({
    success: true,
    count: pendingAlerts.length,
    alerts: pendingAlerts.map(a => ({
      id: a.id,
      alert_id: a.id,
      transaction_id: a.transaction_id,
      account_id: a.account_id,
      confidence_score: a.confidence_score,
      risk_level: a.risk_level,
      patterns_detected: a.patterns_detected,
      transaction_amount: a.transaction_amount,
      timestamp: a.timestamp,
      status: a.status,
      description: a.description
    }))
  });
});

/**
 * POST /api/transactions/analyze
 * Send a transaction to ML service for analysis
 */
app.post('/api/transactions/analyze', async (req, res) => {
  try {
    const { transaction } = req.body;

    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predict`, {
      account_id: transaction.account_id,
      transaction_id: transaction.transaction_id,
      amount: transaction.amount,
      recipient: transaction.recipient,
      timestamp: new Date().toISOString()
    });

    const { confidence_score, is_suspicious, risk_level, patterns_detected } = mlResponse.data;

    // Create alert if suspicious
    let alert = null;
    if (confidence_score >= ALERT_THRESHOLD) {
      alert = {
        id: `ALERT_${alertIdCounter++}`,
        alert_id: `ALERT_${alertIdCounter - 1}`,
        transaction_id: transaction.transaction_id,
        account_id: transaction.account_id,
        confidence_score,
        is_suspicious,
        risk_level,
        patterns_detected,
        transaction_amount: transaction.amount,
        timestamp: new Date(),
        status: 'pending',
        description: `Transaction flagged with ${confidence_score}% confidence`,
        acknowledged: false,
        resolved: false
      };
      alerts.push(alert);
    }

    res.json({
      success: true,
      confidence_score,
      is_suspicious,
      risk_level,
      patterns_detected,
      alert_created: !!alert,
      alert_id: alert ? alert.id : null
    });
  } catch (error) {
    console.error('Error analyzing transaction:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
app.put('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.acknowledged = true;
  alert.status = 'acknowledged';

  res.json({
    success: true,
    message: 'Alert acknowledged',
    alert: alert
  });
});

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert
 */
app.put('/api/alerts/:id/resolve', (req, res) => {
  const { sar_generated, action_taken } = req.body;
  const alert = alerts.find(a => a.id === req.params.id);
  
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.resolved = true;
  alert.status = 'resolved';
  alert.action_taken = action_taken;
  alert.sar_generated = sar_generated;
  alert.resolved_at = new Date();

  res.json({
    success: true,
    message: 'Alert resolved',
    alert: alert
  });
});

/**
 * POST /api/sar/generate
 * Generate a Suspicious Activity Report using Groq LLM
 */
app.post('/api/sar/generate', async (req, res) => {
  try {
    const { alert_id, transaction_id, account_id, confidence_score, risk_level, patterns_detected } = req.body;

    console.log(`\n📄 Generating SAR for alert: ${alert_id}`);

    // Find alert details
    const alert = alerts.find(a => a.id === alert_id);
    const alertData = alert || {
      alert_id,
      transaction_id,
      account_id,
      confidence_score,
      risk_level,
      patterns_detected
    };

    // Generate SAR using LLM
    const sarResult = await generateSAR(alertData);

    res.json({
      success: true,
      sar_text: sarResult.sar_text,
      alert_id,
      tokens_used: sarResult.tokens_used,
      model: sarResult.model,
      generated_at: sarResult.generated_at
    });
  } catch (error) {
    console.error('Error generating SAR:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate SAR',
      message: error.message
    });
  }
});

/**
 * GET /api/accounts/:id
 * Get account information
 */
app.get('/api/accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const accountAlerts = alerts.filter(a => a.account_id === accountId);

  res.json({
    success: true,
    account_id: accountId,
    total_alerts: accountAlerts.length,
    alerts: accountAlerts
  });
});

/**
 * GET /api/metrics
 * Get system metrics
 */
app.get('/api/metrics', (req, res) => {
  const pendingAlerts = alerts.filter(a => a.status === 'pending' && !a.resolved);
  const highRiskAlerts = alerts.filter(a => a.risk_level === 'CRITICAL' || a.risk_level === 'HIGH');

  res.json({
    success: true,
    metrics: {
      total_alerts: alerts.length,
      pending_alerts: pendingAlerts.length,
      high_risk_alerts: highRiskAlerts.length,
      processed_transactions: transactionIdCounter - 1001,
      system_status: 'operational',
      last_updated: new Date()
    }
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Backend running (DEMO MODE - No database)',
    port: PORT,
    ml_service_url: ML_SERVICE_URL,
    timestamp: new Date()
  });
});

// ============================================================================
// BACKGROUND JOBS
// ============================================================================

// Generate fake transactions periodically and add new alerts (demo)
function generateDemoTransaction() {
  const accounts = ['ACC_001', 'ACC_002', 'ACC_003', 'ACC_004', 'ACC_005'];
  const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];
  const randomConfidence = 50 + Math.floor(Math.random() * 51); // 50-100

  if (randomConfidence >= ALERT_THRESHOLD) {
    // Occasionally create new alerts for demo
    const riskLevels = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const newAlert = {
      id: `ALERT_${alertIdCounter++}`,
      alert_id: `ALERT_${alertIdCounter - 1}`,
      transaction_id: `TXN_${transactionIdCounter++}`,
      account_id: randomAccount,
      confidence_score: randomConfidence,
      risk_level: riskLevels[Math.floor(randomConfidence / 20)],
      patterns_detected: ['Suspicious Pattern Detected'],
      transaction_amount: Math.floor(Math.random() * 100000) + 10000,
      timestamp: new Date(),
      status: 'pending',
      description: `New transaction flagged with ${randomConfidence}% confidence`,
      acknowledged: false,
      resolved: false
    };
    
    alerts.push(newAlert);
    console.log(`✓ New demo alert created: ${newAlert.id}`);
  }
}

// Schedule background job (every 30 seconds for demo)
cron.schedule('*/30 * * * * *', () => {
  generateDemoTransaction();
});

console.log('✓ Background job scheduled (demo alert generation every 30 seconds)');

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              ✓ BARCLAYS AML BACKEND - DEMO MODE (No Database)                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}

📋 Configuration:
  ├─ Mode: DEMO (In-Memory Storage)
  ├─ CORS Origin: http://localhost:3001
  ├─ ML Service: ${ML_SERVICE_URL}
  ├─ Alert Threshold: ${ALERT_THRESHOLD}%
  └─ Database: Not required for demo

✓ Sample alerts loaded: ${alerts.length}

🔗 Available Endpoints:
  ├─ GET    /api/alerts
  ├─ GET    /api/accounts/:id
  ├─ GET    /api/metrics
  ├─ GET    /health
  ├─ POST   /api/transactions/analyze
  ├─ POST   /api/sar/generate
  ├─ PUT    /api/alerts/:id/acknowledge
  └─ PUT    /api/alerts/:id/resolve

🔄 Background Jobs:
  └─ Demo alert generation every 30 seconds

💡 To use with full PostgreSQL:
  1. Install PostgreSQL
  2. Create database: aml_fraud_detection
  3. Run: postgres_setup.sql
  4. Use: npm start (which runs server.js with DB)

Ready for requests!
═══════════════════════════════════════════════════════════════════════════════
  `);

  // Initialize sample alerts
  initializeSampleAlerts();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  Server shutting down...');
  process.exit(0);
});
