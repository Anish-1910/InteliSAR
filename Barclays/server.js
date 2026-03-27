/**
 * Barclays AML Backend Server
 * Node.js Express API for Fraud Detection
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

// Load configuration
const { config, validateConfig } = require('./config');

// Load SAR generator
const { generateSAR } = require('./sar-generator');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool(config.database);

pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('⚠ Unexpected error on idle client:', err);
});

// ============================================================================
// ML SERVICE CLIENT
// ============================================================================

const mlClient = axios.create({
  baseURL: config.mlService.url,
  timeout: config.mlService.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Call ML service to predict on a transaction
 */
async function predictTransaction(transaction) {
  try {
    const response = await mlClient.post('/api/predict', transaction);
    return response.data;
  } catch (error) {
    console.error('Error calling ML service:', error.message);
    throw error;
  }
}

/**
 * Save transaction to database
 */
async function saveTransaction(client, transaction) {
  const query = `
    INSERT INTO transactions 
    (transaction_id, account_id, from_account, to_account, 
     timestamp, amount_received, receiving_currency, 
     amount_paid, payment_currency, payment_format)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (transaction_id) DO UPDATE 
    SET updated_at = NOW()
    RETURNING transaction_id;
  `;

  const result = await client.query(query, [
    transaction.transaction_id,
    transaction.account_id,
    transaction.from_account,
    transaction.to_account,
    transaction.timestamp || new Date(),
    transaction.amount_received,
    transaction.receiving_currency || 'USD',
    transaction.amount_paid,
    transaction.payment_currency || 'USD',
    transaction.payment_format,
  ]);

  return result.rows[0].transaction_id;
}

/**
 * Update transaction with ML scores
 */
async function updateTransactionScores(client, transactionId, scores) {
  const query = `
    UPDATE transactions
    SET confidence_score = $1,
        is_suspicious = $2,
        risk_level = $3,
        ml_processed = true,
        processing_timestamp = NOW(),
        updated_at = NOW()
    WHERE transaction_id = $4;
  `;

  await client.query(query, [
    scores.confidence_score,
    scores.is_suspicious,
    scores.risk_level,
    transactionId,
  ]);
}

/**
 * Create alert if high risk
 */
async function createAlertIfNeeded(client, transaction, prediction) {
  if (prediction.confidence_score >= config.alerts.threshold) {
    const alertId = `ALERT_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const priority = prediction.confidence_score >= 95 ? 'IMMEDIATE' : 'HIGH';

    const query = `
      INSERT INTO alerts 
      (alert_id, transaction_id, account_id, confidence_score, 
       risk_level, priority, patterns_detected)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    await client.query(query, [
      alertId,
      transaction.transaction_id,
      transaction.account_id,
      prediction.confidence_score,
      prediction.risk_level,
      priority,
      prediction.patterns_detected || [],
    ]);

    // Update transaction with alert_id
    await client.query(
      'UPDATE transactions SET alert_id = $1 WHERE transaction_id = $2',
      [alertId, transaction.transaction_id]
    );

    return alertId;
  }
  return null;
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Barclays AML Backend',
    timestamp: new Date().toISOString(),
  });
});

// ========== TRANSACTIONS ==========

/**
 * POST /api/transactions/analyze
 * Analyze a single transaction
 */
app.post('/api/transactions/analyze', async (req, res) => {
  const client = await pool.connect();

  try {
    const transaction = req.body;

    if (!transaction.transaction_id) {
      return res.status(400).json({ error: 'transaction_id is required' });
    }

    // Save transaction
    await saveTransaction(client, transaction);

    // Get ML prediction
    const prediction = await predictTransaction(transaction);

    // Update transaction with scores
    await updateTransactionScores(client, transaction.transaction_id, {
      confidence_score: prediction.confidence_score,
      is_suspicious: prediction.is_suspicious,
      risk_level: prediction.risk_level,
    });

    // Create alert if high risk
    const alertId = await createAlertIfNeeded(client, transaction, prediction);

    res.json({
      transaction_id: transaction.transaction_id,
      confidence_score: prediction.confidence_score,
      is_suspicious: prediction.is_suspicious,
      risk_level: prediction.risk_level,
      patterns_detected: prediction.patterns_detected,
      alert_id: alertId,
      alert_generated: alertId !== null,
    });
  } catch (error) {
    console.error('Error analyzing transaction:', error);
    res.status(500).json({
      error: 'Failed to analyze transaction',
      message: error.message,
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/transactions/batch
 * Analyze multiple transactions
 */
app.post('/api/transactions/batch', async (req, res) => {
  const client = await pool.connect();

  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions array is required' });
    }

    const results = [];
    const alerts = [];

    for (const transaction of transactions) {
      try {
        await saveTransaction(client, transaction);
        const prediction = await predictTransaction(transaction);

        await updateTransactionScores(client, transaction.transaction_id, {
          confidence_score: prediction.confidence_score,
          is_suspicious: prediction.is_suspicious,
          risk_level: prediction.risk_level,
        });

        const alertId = await createAlertIfNeeded(client, transaction, prediction);
        if (alertId) alerts.push(alertId);

        results.push({
          transaction_id: transaction.transaction_id,
          confidence_score: prediction.confidence_score,
          is_suspicious: prediction.is_suspicious,
          alert_generated: alertId !== null,
        });
      } catch (error) {
        results.push({
          transaction_id: transaction.transaction_id,
          error: error.message,
        });
      }
    }

    res.json({
      processed: results.length,
      alerts_generated: alerts.length,
      results,
    });
  } catch (error) {
    console.error('Error analyzing batch:', error);
    res.status(500).json({
      error: 'Failed to analyze batch',
      message: error.message,
    });
  } finally {
    client.release();
  }
});

// ========== ALERTS ==========

/**
 * GET /api/alerts
 * Get pending alerts
 */
app.get('/api/alerts', async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT * FROM pending_alerts ORDER BY confidence_score DESC, alert_timestamp DESC;
    `);

    res.json({
      alerts: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
app.put('/api/alerts/:alertId/acknowledge', async (req, res) => {
  const client = await pool.connect();

  try {
    const { alertId } = req.params;
    const { investigator_id } = req.body;

    await client.query(`
      UPDATE alerts 
      SET status = 'ACKNOWLEDGED',
          acknowledged_timestamp = NOW(),
          investigator_id = $1,
          updated_at = NOW()
      WHERE alert_id = $2;
    `, [investigator_id, alertId]);

    res.json({ status: 'acknowledged', alert_id: alertId });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/alerts/:alertId/resolve
 * Resolve an alert
 */
app.put('/api/alerts/:alertId/resolve', async (req, res) => {
  const client = await pool.connect();

  try {
    const { alertId } = req.params;
    const { resolution_action, notes } = req.body;

    await client.query(`
      UPDATE alerts 
      SET status = 'RESOLVED',
          resolved_timestamp = NOW(),
          resolution_action = $1,
          investigation_notes = $2,
          updated_at = NOW()
      WHERE alert_id = $3;
    `, [resolution_action, notes, alertId]);

    res.json({ status: 'resolved', alert_id: alertId });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  } finally {
    client.release();
  }
});

// ========== ACCOUNTS ==========

/**
 * GET /api/accounts/:accountId
 * Get account details
 */
app.get('/api/accounts/:accountId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { accountId } = req.params;

    const result = await client.query(
      'SELECT * FROM accounts WHERE account_id = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/accounts/:accountId/transactions
 * Get account transaction history
 */
app.get('/api/accounts/:accountId/transactions', async (req, res) => {
  const client = await pool.connect();

  try {
    const { accountId } = req.params;
    const { days = 30, limit = 100 } = req.query;

    const result = await client.query(`
      SELECT * FROM transactions
      WHERE account_id = $1
        AND timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
      ORDER BY timestamp DESC
      LIMIT ${parseInt(limit)};
    `, [accountId]);

    res.json({
      account_id: accountId,
      days_looked_back: parseInt(days),
      transaction_count: result.rows.length,
      transactions: result.rows,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  } finally {
    client.release();
  }
});

// ========== METRICS ==========

/**
 * GET /api/metrics
 * Get system metrics
 */
app.get('/api/metrics', async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM transactions WHERE ml_processed = true) as processed,
        (SELECT COUNT(*) FROM alerts WHERE status = 'NEW') as pending_alerts,
        (SELECT COUNT(*) FROM alerts WHERE status = 'NEW' AND confidence_score >= 95) as critical_alerts,
        (SELECT COUNT(*) FROM accounts) as total_accounts
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  } finally {
    client.release();
  }
});

// ========== SAR GENERATION ==========

/**
 * POST /api/sar/generate
 * Generate a Suspicious Activity Report (SAR) for an alert
 */
app.post('/api/sar/generate', async (req, res) => {
  try {
    const alertData = req.body;

    if (!alertData.alert_id) {
      return res.status(400).json({ error: 'alert_id is required' });
    }

    console.log(`Generating SAR for alert: ${alertData.alert_id}`);

    // Generate SAR using LLM
    const sarResult = await generateSAR(alertData);

    // Optional: Save SAR to database or file
    console.log(`✓ SAR generated successfully for alert: ${alertData.alert_id}`);

    res.json(sarResult);
  } catch (error) {
    console.error('Error generating SAR:', error);
    res.status(500).json({
      error: 'Failed to generate SAR',
      message: error.message,
    });
  }
});

// ============================================================================
// BACKGROUND JOBS
// ============================================================================

/**
 * Process unprocessed transactions every N seconds
 */
async function processUnprocessedTransactions() {
  const client = await pool.connect();

  try {
    // Get unprocessed transactions
    const result = await client.query(`
      SELECT * FROM transactions
      WHERE ml_processed = false
      ORDER BY timestamp DESC
      LIMIT $1;
    `, [config.jobs.batchSize]);

    const unprocessed = result.rows;

    if (unprocessed.length === 0) {
      return;
    }

    console.log(`Processing ${unprocessed.length} transactions...`);

    for (const tx of unprocessed) {
      try {
        const prediction = await predictTransaction(tx);

        await updateTransactionScores(client, tx.transaction_id, {
          confidence_score: prediction.confidence_score,
          is_suspicious: prediction.is_suspicious,
          risk_level: prediction.risk_level,
        });

        await createAlertIfNeeded(client, tx, prediction);
      } catch (error) {
        console.error(`Failed to process ${tx.transaction_id}: ${error.message}`);
      }
    }

    console.log(`✓ Processed ${unprocessed.length} transactions`);
  } catch (error) {
    console.error('Error in background job:', error);
  } finally {
    client.release();
  }
}

// Schedule background job
const scheduleSeconds = config.jobs.processIntervalSeconds;
const schedule = `*/${scheduleSeconds} * * * * *`;

cron.schedule(schedule, processUnprocessedTransactions, {
  runOnInit: false,
});

console.log(`✓ Background job scheduled every ${scheduleSeconds} seconds`);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('BARCLAYS AML BACKEND - NODE.JS EXPRESS SERVER');
    console.log('='.repeat(80) + '\n');

    // Validate configuration
    validateConfig();

    // Test database connection
    console.log('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connection successful');

    // Test ML service connection
    console.log('Testing ML service connection...');
    try {
      const response = await mlClient.get('/health');
      console.log('✓ ML service connection successful');
    } catch (error) {
      console.warn('⚠ ML service not responding (will retry on first request)');
    }

    // Start server
    app.listen(config.server.port, config.server.host, () => {
      console.log(`\n✓ Server running on http://${config.server.host}:${config.server.port}`);
      console.log('\nAvailable endpoints:');
      console.log('  POST   /api/transactions/analyze    - Analyze single transaction');
      console.log('  POST   /api/transactions/batch      - Analyze batch');
      console.log('  GET    /api/alerts                  - Get pending alerts');
      console.log('  GET    /api/accounts/:id            - Get account details');
      console.log('  GET    /api/metrics                 - Get metrics');
      console.log('  GET    /health                      - Health check');
      console.log('\n' + '='.repeat(80) + '\n');
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startup();

module.exports = app;
