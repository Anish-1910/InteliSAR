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
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Load configuration
const { config, validateConfig } = require('./config');

// Load mock authentication (fallback)
const { mockLogin, mockGetMe } = require('./auth_mock');

// Load mock alerts (fallback)
const { mockGetAlerts, mockGetAlertById } = require('./alerts_mock');

// Load mock SAR (fallback)
const { generateMockSAR, generateMockSARVersions } = require('./sar_mock');

// Load mock PDF generator (fallback)
const { generateMockPDFBuffer, generateEnhancedMockPDFBuffer } = require('./pdf_mock');

// Load enhanced SAR systems
const SARGeneratorV4 = require('./sar-generator-v4');
const SARPDFFormatter = require('./sar-pdf-formatter');
const sarGenerator = new SARGeneratorV4();
const pdfFormatter = new SARPDFFormatter();

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
// FILE UPLOAD CONFIGURATION (for PDF templates)
// ============================================================================

const upload = multer({
  dest: 'sar_templates/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and JSON files are allowed'));
    }
  }
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
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM pending_alerts ORDER BY confidence_score DESC, alert_timestamp DESC;
      `);

      res.json({
        alerts: result.rows,
        total: result.rows.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    // Database failed - use mock alerts
    console.warn('Database alerts query failed, using mock alerts');
    const mockAlerts = mockGetAlerts();
    res.json({
      alerts: mockAlerts,
      total: mockAlerts.length,
      source: 'mock',
    });
  }
});

/**
 * GET /api/alerts/:alertId
 * Get specific alert details
 */
app.get('/api/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT a.*, t.*, acc.customer_name, acc.account_type
        FROM alerts a
        LEFT JOIN transactions t ON a.transaction_id = t.transaction_id
        LEFT JOIN accounts acc ON a.account_id = acc.account_id
        WHERE a.alert_id = $1;
      `, [alertId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const alertData = result.rows[0];
      res.json({
        alert: alertData,
        alert_id: alertData.alert_id,
        account_id: alertData.account_id,
        transaction_id: alertData.transaction_id,
        confidence_score: alertData.confidence_score,
        risk_level: alertData.risk_level,
        status: alertData.status,
        patterns_detected: alertData.patterns_detected,
        amount_received: alertData.amount_received,
        currency: alertData.receiving_currency,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    // Database failed - check mock alerts
    const mockAlert = mockGetAlertById(req.params.alertId);
    if (mockAlert) {
      res.json({
        alert: mockAlert,
        alert_id: mockAlert.alert_id,
        account_id: mockAlert.account_id,
        transaction_id: mockAlert.transaction_id,
        confidence_score: mockAlert.confidence_score,
        risk_level: mockAlert.risk_level,
        status: mockAlert.status,
        patterns_detected: mockAlert.patterns_detected,
        amount_received: mockAlert.amount,
        currency: 'USD',
        source: 'mock',
      });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
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

    try {
      // Try to generate SAR using real service
      const sarResult = await generateSAR(alertData);
      console.log(`✓ SAR generated successfully for alert: ${alertData.alert_id}`);
      res.json(sarResult);
    } catch (error) {
      // Fallback to mock SAR
      console.warn(`Real SAR generation failed, using mock SAR: ${error.message}`);
      const mockSAR = generateMockSAR(alertData);
      res.json(mockSAR);
    }
  } catch (error) {
    console.error('Error in SAR generation endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate SAR',
      message: error.message,
    });
  }
});

/**
 * POST /api/generate-sar
 * Generate 6-section SAR with enhanced RAG
 * Returns professionally formatted SAR with fallback to mock SAR
 */
app.post('/api/generate-sar', async (req, res) => {
  let client;
  try {
    console.log('[API] 6-Section SAR generation request received');
    const { alertId, alertData } = req.body;

    if (!alertId && !alertData?.alert_id) {
      return res.status(400).json({ error: 'alert_id is required' });
    }

    const aid = alertId || alertData.alert_id;
    console.log(`[API] Generating 6-section SAR for alert: ${aid}`);

    try {
      client = await pool.connect();

      // Fetch complete alert data if not provided
      let fullAlertData = alertData || {};
      const alertIdToUse = aid;
      
      const needsDBFetch = !fullAlertData.account_id || 
                           !fullAlertData.transaction_id || 
                           fullAlertData.alert_id === null ||
                           fullAlertData.alert_id === undefined;
      
      if (needsDBFetch) {
        const dbResult = await client.query(`
          SELECT 
            a.alert_id, a.transaction_id, a.account_id, 
            a.confidence_score, a.risk_level, a.priority,
            a.patterns_detected, a.pattern_scores, a.status,
            t.from_account, t.to_account, t.timestamp,
            t.amount_received, t.receiving_currency, 
            t.amount_paid, t.payment_currency, t.payment_format,
            acc.customer_name, acc.account_type
          FROM alerts a
          LEFT JOIN transactions t ON a.transaction_id = t.transaction_id
          LEFT JOIN accounts acc ON a.account_id = acc.account_id
          WHERE a.alert_id = $1;
        `, [alertIdToUse]);

        if (dbResult.rows.length > 0) {
          fullAlertData = dbResult.rows[0];
        }
      }

      fullAlertData.alert_id = alertIdToUse;

      try {
        // Generate 6-section SAR
        const sarContent = await sarGenerator.generateCompleteSAR(fullAlertData);

        // Try to save Version 1 to version_log
        try {
          const existingVersion = await client.query(`
            SELECT version_number FROM version_log WHERE alert_id = $1 ORDER BY version_number DESC LIMIT 1;
          `, [alertIdToUse]);

          if (existingVersion.rows.length === 0) {
            await client.query(`
              INSERT INTO version_log 
              (alert_id, analyst_id, analyst_name, role, version_number, sar_content, 
               sar_format, field_changed, change_type, change_description, 
               sar_status_before, sar_status_after, change_timestamp)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            `, [
              alertIdToUse, 'SYSTEM', 'System', 'SYSTEM', 1,
              sarContent.sar_text, 'TEXT', 'sar_content', 'GENERATED',
              'Initial SAR generated by system',
              'DRAFT', 'DRAFT'
            ]);
          }
        } catch (dbErr) {
          console.warn('Could not save SAR version to database:', dbErr.message);
        }

        console.log(`[API] ✓ 6-Section SAR generated for alert: ${aid}`);

        res.json({
          sar_text: sarContent.sar_text,
          sections: sarContent.sections,
          alert_id: aid,
          template: 'six_section_sar',
          status: 'success',
          metadata: sarContent.metadata,
          version_saved: true,
        });
      } catch (sarError) {
        console.warn('Real SAR generation failed, using mock SAR:', sarError.message);
        // Fallback to mock SAR
        const mockSAR = generateMockSAR(fullAlertData);
        res.json({
          sar_text: mockSAR.sar_text,
          sections: [],
          alert_id: aid,
          template: 'mock_sar',
          status: 'success',
          metadata: mockSAR,
          version_saved: false,
          fallback: true,
        });
      }
    } catch (dbError) {
      console.warn('Database connection failed, using mock SAR and data:', dbError.message);
      // Use mock alert data and mock SAR
      const mockAlert = mockGetAlertById(aid);
      if (!mockAlert && alertData) {
        // Use provided alertData
        const mockSAR = generateMockSAR(alertData);
        return res.json({
          sar_text: mockSAR.sar_text,
          alert_id: aid,
          template: 'mock_sar',
          status: 'success',
          metadata: mockSAR,
          version_saved: false,
          fallback: true,
        });
      } else if (mockAlert) {
        const mockSAR = generateMockSAR(mockAlert);
        return res.json({
          sar_text: mockSAR.sar_text,
          alert_id: aid,
          template: 'mock_sar',
          status: 'success',
          metadata: mockSAR,
          version_saved: false,
          fallback: true,
        });
      }
      throw dbError;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('[API] SAR generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate SAR',
      message: error.message 
    });
  }
});

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================
// Note: Templates are now managed through the 6-section SAR template structure
// No file uploads needed - standard format is predefined in enhanced-rag-system.js

// For legacy support, these endpoints return standard response:
app.get('/api/templates', (req, res) => {
  res.json({
    templates: ['six_section_sar'],
    total: 1,
    status: 'success',
    note: 'Standard 6-section SAR template is always available',
  });
});

app.post('/api/templates/upload', (req, res) => {
  res.status(404).json({
    error: 'Not implemented',
    note: 'Standard 6-section SAR template is predefined. No uploads needed.',
  });
});

app.delete('/api/templates/:name', (req, res) => {
  res.status(404).json({
    error: 'Cannot delete standard template',
    note: 'The standard 6-section SAR template cannot be modified.',
  });
});

/**
 * POST /api/generate-sar-pdf
 * Generate beautiful 6-section SAR PDF with professional formatting
 * Falls back to mock PDF if database or real service unavailable
 */
app.post('/api/generate-sar-pdf', async (req, res) => {
  let client;
  try {
    console.log('[API] Beautiful PDF SAR generation request received');
    const { alertId, alertData } = req.body;

    if (!alertId && !alertData?.alert_id) {
      return res.status(400).json({ error: 'alert_id is required' });
    }

    const aid = alertId || alertData.alert_id;
    console.log(`[API] Generating formatted PDF SAR for alert: ${aid}`);

    try {
      client = await pool.connect();

      // Fetch full alert data if needed
      let fullAlertData = alertData || {};
      const alertIdToUse = aid;
      
      const needsDBFetch = !fullAlertData.account_id || 
                           !fullAlertData.transaction_id || 
                           fullAlertData.alert_id === null ||
                           fullAlertData.alert_id === undefined;
      
      if (needsDBFetch) {
        const dbResult = await client.query(`
          SELECT 
            a.alert_id, a.transaction_id, a.account_id, 
            a.confidence_score, a.risk_level, a.priority,
            a.patterns_detected, a.pattern_scores, a.status,
            t.from_account, t.to_account, t.timestamp,
            t.amount_received, t.receiving_currency, 
            t.amount_paid, t.payment_currency, t.payment_format,
            acc.customer_name, acc.account_type
          FROM alerts a
          LEFT JOIN transactions t ON a.transaction_id = t.transaction_id
          LEFT JOIN accounts acc ON a.account_id = acc.account_id
          WHERE a.alert_id = $1;
        `, [alertIdToUse]);

        if (dbResult.rows.length > 0) {
          fullAlertData = dbResult.rows[0];
        }
      }

      fullAlertData.alert_id = alertIdToUse;

      try {
        // Generate 6-section SAR
        const sarContent = await sarGenerator.generateCompleteSAR(fullAlertData);
        
        // Generate structured SAR for PDF
        const structuredSAR = await sarGenerator.generateStructuredSAR(fullAlertData);

        // Generate PDF buffer
        const pdfBuffer = await pdfFormatter.generatePDFBuffer(structuredSAR);

        // Send PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SAR_${aid}_${Date.now()}.pdf"`);
        res.send(pdfBuffer);
        
        console.log(`[API] ✓ Beautiful PDF SAR sent for download: ${aid}`);
      } catch (sarError) {
        // Real PDF generation failed, use mock PDF
        console.warn('Real PDF generation failed, using mock PDF:', sarError.message);
        const mockPdfData = {
          alert_id: fullAlertData.alert_id,
          customer_name: fullAlertData.customer_name,
          account_id: fullAlertData.account_id,
          transaction_id: fullAlertData.transaction_id,
          amount: fullAlertData.amount_received,
          confidence_score: fullAlertData.confidence_score,
          risk_level: fullAlertData.risk_level,
          patterns_detected: fullAlertData.patterns_detected,
        };
        const pdfBuffer = generateMockPDFBuffer(mockPdfData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SAR_${aid}_MOCK_${Date.now()}.pdf"`);
        res.send(pdfBuffer);
        console.log(`[API] ✓ Mock PDF SAR sent for download: ${aid}`);
      }
    } catch (dbError) {
      // Database connection failed, use mock PDF with provided data
      console.warn('Database connection failed, generating mock PDF with provided data:', dbError.message);
      const mockPdfData = {
        alert_id: alertData?.alert_id || alertId,
        customer_name: alertData?.customer_name || 'Unknown',
        account_id: alertData?.account_id || 'N/A',
        transaction_id: alertData?.transaction_id || 'N/A',
        amount: alertData?.amount,
        confidence_score: alertData?.confidence_score || 0,
        risk_level: alertData?.risk_level || 'UNKNOWN',
        patterns_detected: alertData?.patterns_detected || [],
      };
      const pdfBuffer = generateMockPDFBuffer(mockPdfData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SAR_${aid}_MOCK_${Date.now()}.pdf"`);
      res.send(pdfBuffer);
      console.log(`[API] ✓ Mock PDF SAR sent for download (mock mode): ${aid}`);
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('[API] Error generating PDF SAR:', error);
    res.status(500).json({
      error: 'Failed to generate PDF SAR',
      message: error.message,
    });
  }
});

// ========== CHATBOT & RAG ==========

/**
 * POST /api/chatbot/ask
 * Interactive chatbot with RAG for alerts and SARs
 * Accepts user questions about specific alerts or SARs
 * Returns contextual responses using retrieved information
 */
app.post('/api/chatbot/ask', async (req, res) => {
  let client;
  try {
    const { message, alertId, sectionContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    console.log(`[Chatbot] Query received: "${message}" | Alert: ${alertId || 'general'}`);

    client = await pool.connect();

    // Build context for RAG
    let ragContext = {
      alert_data: null,
      sar_content: null,
      regulations: {
        aml_principles: [
          'Know Your Customer (KYC) requirements',
          'Customer Due Diligence (CDD)',
          'Enhanced Due Diligence (EDD) for high-risk entities',
          'Transaction monitoring and suspicious activity detection',
          'Reporting requirements to relevant authorities',
          'Record keeping and documentation',
          'Staff training and compliance program',
        ],
        red_flags: [
          'Unusual transaction patterns',
          'Multiple rapid transactions',
          'Structuring (smurfing) activities',
          'Transactions with high-risk countries',
          'Mismatched customer profile',
          'Round-amount transactions',
          'Late-night or weekend activity',
        ],
      },
    };

    // Fetch alert data if alertId provided
    if (alertId) {
      const alertResult = await client.query(`
        SELECT 
          a.alert_id, a.transaction_id, a.account_id, 
          a.confidence_score, a.risk_level, a.priority,
          a.patterns_detected, a.status,
          t.from_account, t.to_account, t.timestamp,
          t.amount_received, t.receiving_currency, 
          t.amount_paid, t.payment_currency, t.payment_format,
          acc.customer_name, acc.account_type, acc.country
        FROM alerts a
        LEFT JOIN transactions t ON a.transaction_id = t.transaction_id
        LEFT JOIN accounts acc ON a.account_id = acc.account_id
        WHERE a.alert_id = $1;
      `, [alertId]);

      if (alertResult.rows.length > 0) {
        ragContext.alert_data = alertResult.rows[0];
      }
    }

    // Generate context-aware response using LLM simulation
    const response = generateChatbotResponse(message, ragContext, sectionContext);

    // Log chatbot interaction
    console.log(`[Chatbot] Response generated (confidence: ${response.confidence})`);

    res.json({
      status: 'success',
      message: message,
      response: response.text,
      confidence: response.confidence,
      sources: response.sources,
      recommendations: response.recommendations,
      follow_up_questions: response.follow_up_questions,
      alert_id: alertId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chatbot] Error:', error.message);
    console.error('[Chatbot] Stack:', error.stack);
    res.status(500).json({
      status: 'error',
      error: 'Chatbot processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * POST /api/chatbot/analyze-risk
 * Analyze risk profile based on transaction data
 */
app.post('/api/chatbot/analyze-risk', async (req, res) => {
  try {
    const { alertData } = req.body;

    if (!alertData) {
      return res.status(400).json({ error: 'alertData is required' });
    }

    // Analyze risk factors
    const riskFactors = {
      transaction_pattern: identifyTransactionPatterns(alertData),
      behavioral_flags: identifyBehavioralFlags(alertData),
      regulatory_concerns: identifyRegulatoryFlagss(alertData),
      risk_score_breakdown: calculateRiskBreakdown(alertData),
    };

    const summary = generateRiskAnalysisSummary(riskFactors, alertData);

    res.json({
      status: 'success',
      alert_id: alertData.alert_id,
      risk_analysis: riskFactors,
      summary: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chatbot] Risk analysis error:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Risk analysis failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/chatbot/compliance-check
 * Check alert against compliance rules and regulations
 */
app.post('/api/chatbot/compliance-check', async (req, res) => {
  try {
    const { alertData } = req.body;

    if (!alertData) {
      return res.status(400).json({ error: 'alertData is required' });
    }

    // Compliance rules
    const complianceRules = {
      aml: {
        high_value_transaction: alertData.amount_received > 100000,
        rapid_succession: false, // Would need transaction history
        multiple_currencies: alertData.receiving_currency !== alertData.payment_currency,
        high_risk_jurisdiction: checkHighRiskJurisdiction(alertData.country),
      },
      ctf: {
        counter_terrorism_check: checkCounterTerrorismFlags(alertData),
        sanctions_screening: performSanctionsCheck(alertData),
      },
      kyc: {
        kyc_complete: !!alertData.customer_name,
        profile_mismatch: detectProfileMismatch(alertData),
        edd_required: alertData.confidence_score > 85,
      },
    };

    const findings = [];
    let complianceRisk = 'LOW';

    // Assess findings
    if (complianceRules.aml.high_value_transaction) {
      findings.push('High-value transaction detected (>$100k)');
    }
    if (complianceRules.aml.multiple_currencies) {
      findings.push('Cross-currency transaction requires verification');
    }
    if (complianceRules.aml.high_risk_jurisdiction) {
      findings.push('Transaction involves high-risk jurisdiction');
      complianceRisk = 'HIGH';
    }
    if (complianceRules.kyc.profile_mismatch) {
      findings.push('Account profile mismatch detected');
      complianceRisk = 'HIGH';
    }
    if (complianceRules.kyc.edd_required) {
      findings.push('Enhanced Due Diligence (EDD) required');
    }

    res.json({
      status: 'success',
      alert_id: alertData.alert_id,
      compliance_rules: complianceRules,
      findings: findings,
      compliance_risk: complianceRisk,
      required_actions: generateComplianceActions(findings),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chatbot] Compliance check error:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Compliance check failed',
      message: error.message,
    });
  }
});

/**
 * Helper: Generate chatbot response using LLM simulation
 */
function generateChatbotResponse(userMessage, ragContext, sectionContext) {
  const messageLower = userMessage.toLowerCase();
  let response = {
    text: '',
    confidence: 0.5,
    sources: [],
    recommendations: [],
    follow_up_questions: [],
  };

  // Pattern matching for different question types
  if (messageLower.includes('why') || messageLower.includes('reason') || messageLower.includes('cause')) {
    // Why question - explain the alert
    if (ragContext.alert_data) {
      const alert = ragContext.alert_data;
      response.text = `This alert was triggered due to several suspicious indicators: `;
      
      if (alert.patterns_detected && alert.patterns_detected.length > 0) {
        response.text += `Pattern detection identified: ${alert.patterns_detected.join(', ')}. `;
      }
      
      response.text += `The confidence score of ${(alert.confidence_score || 0).toFixed(1)}% indicates ${
        alert.risk_level === 'HIGH' ? 'significant' : 'moderate'
      } suspicion levels. `;
      
      response.text += `This is based on the transaction from ${alert.from_account} to ${alert.to_account} on ${
        new Date(alert.timestamp).toLocaleDateString()
      } for $${(alert.amount_received || 0).toLocaleString()} ${alert.receiving_currency}.`;
      
      response.confidence = 0.85;
      response.sources = ['Transaction data', 'ML Model', 'Pattern Analysis'];
    } else {
      response.text = 'Please provide an alert ID to analyze specific reasons for suspicion.';
      response.confidence = 0.6;
    }
  } 
  else if (messageLower.includes('what') && (messageLower.includes('do') || messageLower.includes('action'))) {
    // What to do - recommendations
    response.text = 'Recommended next steps:\n';
    response.text += '1. Document all findings in the SAR (Suspicious Activity Report)\n';
    response.text += '2. Verify customer identity and source of funds\n';
    response.text += '3. Review transaction history for patterns\n';
    response.text += '4. Contact the customer if appropriate\n';
    response.text += '5. File with relevant regulatory authorities if suspicious activity is confirmed';
    response.confidence = 0.8;
    response.recommendations = [
      'Complete KYC/CDD verification',
      'Document investigation findings',
      'File SAR if criteria met',
      'Monitor account for follow-up activity',
    ];
  }
  else if (messageLower.includes('risk') || messageLower.includes('score')) {
    // Risk assessment question
    if (ragContext.alert_data) {
      const alert = ragContext.alert_data;
      const riskFactors = identifyTransactionPatterns(alert);
      response.text = `Risk Assessment: The confidence score of ${(alert.confidence_score || 0).toFixed(1)}% places this transaction in the ${
        alert.risk_level
      } risk category. `;
      response.text += `Key risk factors include: ${riskFactors.join(', ')}. `;
      response.text += `Based on AML guidelines, ${alert.risk_level === 'HIGH' ? 'immediate investigation is warranted' : 'further due diligence is recommended'}.`;
      response.confidence = 0.85;
    } else {
      response.text = 'To assess risk, please provide transaction details or an alert ID.';
      response.confidence = 0.6;
    }
  }
  else if (messageLower.includes('regulation') || messageLower.includes('compliance') || messageLower.includes('aml')) {
    // Compliance/regulation question
    response.text = 'AML Compliance Framework:\n';
    response.text += '• You must establish and maintain programs to detect and report suspicious activity\n';
    response.text += '• Know Your Customer (KYC) requirements are mandatory\n';
    response.text += '• Transactions must be monitored for unusual patterns\n';
    response.text += '• SARs must be filed timely for confirmed suspicious activities\n';
    response.text += '• Enhanced Due Diligence (EDD) required for high-risk customers\n';
    response.text += '• Records must be maintained for at least 5 years';
    response.confidence = 0.9;
    response.sources = ragContext.regulations.aml_principles;
    response.follow_up_questions = [
      'What is Enhanced Due Diligence (EDD)?',
      'When must a SAR be filed?',
      'What records must be kept?',
    ];
  }
  else if (messageLower.includes('pattern') || messageLower.includes('flag') || messageLower.includes('indicator')) {
    // Pattern/flag question
    response.text = 'Red Flags and Suspicious Patterns:\n';
    ragContext.regulations.red_flags.forEach((flag, idx) => {
      response.text += `${idx + 1}. ${flag}\n`;
    });
    response.text += '\nConsider these indicators when evaluating transaction risk.';
    response.confidence = 0.85;
    response.sources = ['AML Red Flag Indicators'];
  }
  else {
    // Generic response
    response.text = `I can help you analyze this alert. Try asking:\n`;
    response.text += `• "Why was this alert generated?"\n`;
    response.text += `• "What should I do next?"\n`;
    response.text += `• "What is the risk level?"\n`;
    response.text += `• "What are the compliance requirements?"\n`;
    response.text += `• "What are red flags I should look for?"`;
    response.confidence = 0.5;
    response.follow_up_questions = [
      'Why was this alert generated?',
      'What actions should I take?',
      'What is the compliance requirement?',
    ];
  }

  return response;
}

/**
 * Helper: Identify transaction patterns
 */
function identifyTransactionPatterns(alertData) {
  const patterns = [];
  
  if (alertData.amount_received > 100000) {
    patterns.push('Large transaction amount');
  }
  if (alertData.receiving_currency !== alertData.payment_currency) {
    patterns.push('Cross-currency exchange');
  }
  if (alertData.patterns_detected && alertData.patterns_detected.length > 0) {
    patterns.push(...alertData.patterns_detected);
  }
  
  return patterns.length > 0 ? patterns : ['Standard transaction'];
}

/**
 * Helper: Identify behavioral flags
 */
function identifyBehavioralFlags(alertData) {
  const flags = [];
  
  const txnTime = new Date(alertData.timestamp);
  if (txnTime.getHours() >= 22 || txnTime.getHours() <= 5) {
    flags.push('Late-night transaction');
  }
  if (txnTime.getDay() === 6 || txnTime.getDay() === 0) {
    flags.push('Weekend activity');
  }
  
  return flags;
}

/**
 * Helper: Identify regulatory flags
 */
function identifyRegulatoryFlagss(alertData) {
  const flags = [];
  
  if (alertData.confidence_score > 85) {
    flags.push('High confidence suspicious activity');
  }
  if (alertData.risk_level === 'CRITICAL') {
    flags.push('Critical risk level requires immediate action');
  }
  
  return flags;
}

/**
 * Helper: Calculate risk breakdown
 */
function calculateRiskBreakdown(alertData) {
  return {
    ml_model_score: alertData.confidence_score || 0,
    transaction_factors: 30,
    behavioral_factors: 20,
    regulatory_factors: 25,
  };
}

/**
 * Helper: Generate risk analysis summary
 */
function generateRiskAnalysisSummary(riskFactors, alertData) {
  return `This account presents a ${alertData.risk_level} risk profile. ` +
    `The transaction was flagged due to ${riskFactors.transaction_pattern.join(' and ')}. ` +
    `Recommend ${alertData.risk_level === 'HIGH' ? 'immediate investigation' : 'detailed review'}.`;
}

/**
 * Helper: Check high-risk jurisdiction
 */
function checkHighRiskJurisdiction(country) {
  const highRiskCountries = ['N/A', 'Unknown', 'Offshore'];
  return country && highRiskCountries.some(c => country.includes(c));
}

/**
 * Helper: Check counter-terrorism flags
 */
function checkCounterTerrorismFlags(alertData) {
  // Simplified check
  return false;
}

/**
 * Helper: Perform sanctions check
 */
function performSanctionsCheck(alertData) {
  // Simplified check
  return false;
}

/**
 * Helper: Detect profile mismatch
 */
function detectProfileMismatch(alertData) {
  // Simplified check - would compare transaction with customer profile
  return false;
}

/**
 * Helper: Generate compliance actions
 */
function generateComplianceActions(findings) {
  const actions = [];
  
  findings.forEach(finding => {
    if (finding.includes('High-value')) {
      actions.push('Verify source of funds');
    }
    if (finding.includes('currency')) {
      actions.push('Obtain transaction documentation');
    }
    if (finding.includes('jurisdiction')) {
      actions.push('Perform OFAC/sanctions screening');
      actions.push('File STR if applicable');
    }
    if (finding.includes('profile')) {
      actions.push('Update customer profile');
      actions.push('Perform enhanced due diligence');
    }
  });
  
  return actions.length > 0 ? actions : ['Continue standard monitoring'];
}

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
// AUTHENTICATION ENDPOINTS (Analyst Login & Session Management)
// ============================================================================

// Helper function to generate JWT token
function generateJWT(analyst) {
  const token = jwt.sign(
    {
      analyst_id: analyst.analyst_id,
      username: analyst.username,
      email: analyst.email,
      role: analyst.role,
      full_name: analyst.full_name,
    },
    'your_jwt_secret_key_change_in_production', // TODO: Move to config
    { expiresIn: '24h' }
  );
  return token;
}

// Middleware to verify JWT token
function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key_change_in_production');
    req.analyst = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * POST /api/auth/login
 * Authenticate analyst and create session
 * Falls back to mock authentication if database is unavailable
 */
app.post('/api/auth/login', async (req, res) => {
  let client;
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      // Try real database authentication first
      client = await pool.connect();

      const result = await client.query(`
        SELECT analyst_id, username, email, password_hash, full_name, role, 
               department, is_active, is_locked, failed_login_attempts
        FROM analysts
        WHERE username = $1 OR email = $1;
      `, [username]);

      if (result.rows.length === 0) {
        // Try mock auth as fallback
        throw new Error('Analyst not found - will try mock auth');
      }

      const analyst = result.rows[0];

      if (analyst.is_locked) {
        return res.status(403).json({ error: 'Account is locked. Contact administrator.' });
      }

      if (!analyst.is_active) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      const passwordMatch = await bcrypt.compare(password, analyst.password_hash);

      if (!passwordMatch) {
        await client.query(`
          UPDATE analysts
          SET failed_login_attempts = failed_login_attempts + 1,
              last_failed_login = NOW()
          WHERE analyst_id = $1;
        `, [analyst.analyst_id]);

        if (analyst.failed_login_attempts >= 4) {
          await client.query(`
            UPDATE analysts
            SET is_locked = true
            WHERE analyst_id = $1;
          `, [analyst.analyst_id]);
        }

        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = generateJWT(analyst);
      const sessionId = uuidv4();
      const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(`
        UPDATE analysts
        SET session_id = $1,
            session_expires = $2,
            last_login = NOW(),
            failed_login_attempts = 0
        WHERE analyst_id = $3;
      `, [sessionId, sessionExpires, analyst.analyst_id]);

      await client.query(`
        INSERT INTO login_log (analyst_id, login_time, ip_address, status)
        VALUES ($1, NOW(), $2, 'SUCCESS');
      `, [analyst.analyst_id, req.ip || 'UNKNOWN']);

      console.log(`[API] ✓ Analyst ${username} logged in successfully (DB)`);

      return res.json({
        status: 'success',
        message: 'Login successful',
        token,
        analyst: {
          analyst_id: analyst.analyst_id,
          username: analyst.username,
          email: analyst.email,
          full_name: analyst.full_name,
          role: analyst.role,
          department: analyst.department,
        },
        expires_in: '24h',
      });
    } catch (dbError) {
      // Database unavailable or query error - use mock auth
      console.warn('[API] Database auth failed, using mock auth:', dbError.message);
      
      const mockResponse = mockLogin(username, password);
      console.log(`[API] ✓ Analyst ${username} logged in successfully (MOCK)`);
      return res.json(mockResponse);
    }
  } catch (error) {
    console.error('[API] Error during login:', error);
    res.status(401).json({
      error: error.message || 'Invalid username or password',
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * POST /api/auth/logout
 * End analyst session
 */
app.post('/api/auth/logout', verifyJWT, async (req, res) => {
  let client;
  try {
    const { analyst_id } = req.analyst;

    client = await pool.connect();

    // Clear session info
    await client.query(`
      UPDATE analysts
      SET session_id = NULL,
          session_expires = NULL
      WHERE analyst_id = $1;
    `, [analyst_id]);

    console.log(`[API] ✓ Analyst ${analyst_id} logged out`);

    res.json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('[API] Error during logout:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/auth/me
 * Get current analyst information
 */
app.get('/api/auth/me', verifyJWT, async (req, res) => {
  let client;
  try {
    const { analyst_id } = req.analyst;

    client = await pool.connect();

    const result = await client.query(`
      SELECT analyst_id, username, email, full_name, role, department, 
             is_active, is_locked, last_login, created_at
      FROM analysts
      WHERE analyst_id = $1;
    `, [analyst_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analyst not found' });
    }

    const analyst = result.rows[0];

    res.json({
      status: 'success',
      analyst,
    });
  } catch (error) {
    console.error('[API] Error fetching analyst info:', error);
    res.status(500).json({
      error: 'Failed to fetch analyst info',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
app.post('/api/auth/refresh', verifyJWT, async (req, res) => {
  try {
    const analyst = req.analyst;

    // Generate new token
    const newToken = generateJWT(analyst);

    res.json({
      status: 'success',
      message: 'Token refreshed',
      token: newToken,
      expires_in: '24h',
    });
  } catch (error) {
    console.error('[API] Error refreshing token:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: error.message,
    });
  }
});

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

    // Test database connection (non-blocking)
    console.log('Testing database connection...');
    let dbConnected = false;
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✓ Database connection successful');
      dbConnected = true;
    } catch (dbError) {
      console.warn('⚠ Database connection failed - running in MOCK MODE');
      console.warn(`   Error: ${dbError.message}`);
      console.warn('   Using mock authentication for login');
      console.warn('   Some features may be limited\n');
    }

    // Test ML service connection
    console.log('Testing ML service connection...');
    try {
      const response = await mlClient.get('/health');
      console.log('✓ ML service connection successful');
    } catch (error) {
      console.warn('⚠ ML service not responding (will retry on first request)');
    }

    // Start server regardless of database status
    app.listen(config.server.port, config.server.host, () => {
      console.log(`\n✓ Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`\nDatabase Status: ${dbConnected ? '✓ Connected' : '⚠ Mock Mode (DB unavailable)'}`);
      console.log('\nAvailable endpoints:');
      console.log('  POST   /api/auth/login              - Analyst login');
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
// ============================================================================
// VERSION MANAGEMENT ENDPOINTS (SAR Report Versioning)
// ============================================================================

/**
 * POST /api/sar/version/save
 * Save a new version of SAR (generates version 1 on first save, then v2, v3, etc.)
 */
app.post('/api/sar/version/save', async (req, res) => {
  let client;
  try {
    const {
      alert_id,
      sar_content,
      analyst_id = 'SYSTEM',
      analyst_name = 'System',
      role = 'SYSTEM',
      change_type = 'GENERATED',
      change_description = 'Initial SAR generation',
      field_changed = 'sar_content',
    } = req.body;

    if (!alert_id || !sar_content) {
      return res.status(400).json({ error: 'alert_id and sar_content are required' });
    }

    client = await pool.connect();

    // Get the next version number
    const versionResult = await client.query(`
      SELECT MAX(version_number) as max_version FROM version_log WHERE alert_id = $1;
    `, [alert_id]);

    const nextVersion = (versionResult.rows[0]?.max_version || 0) + 1;

    // Get current SAR status from alerts table
    const alertResult = await client.query(`
      SELECT status FROM alerts WHERE alert_id = $1;
    `, [alert_id]);

    const currentStatus = alertResult.rows[0]?.status || 'DRAFT';

    // Insert new version record
    const insertResult = await client.query(`
      INSERT INTO version_log 
      (alert_id, analyst_id, analyst_name, role, version_number, sar_content, 
       sar_format, field_changed, change_type, change_description, 
       sar_status_before, sar_status_after, change_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING version_id, version_number, change_timestamp;
    `, [
      alert_id, analyst_id, analyst_name, role, nextVersion, sar_content,
      'TEXT', field_changed, change_type, change_description,
      currentStatus, currentStatus,
    ]);

    const newVersion = insertResult.rows[0];

    console.log(`[API] ✓ Version ${nextVersion} saved for alert ${alert_id}`);

    res.json({
      status: 'success',
      version_id: newVersion.version_id,
      version_number: newVersion.version_number,
      alert_id,
      message: `Version ${nextVersion} saved successfully`,
      timestamp: newVersion.change_timestamp,
    });
  } catch (error) {
    console.error('[API] Error saving SAR version:', error);
    res.status(500).json({
      error: 'Failed to save SAR version',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/sar/versions/:alertId
 * Get all versions (with version history) for an alert
 */
app.get('/api/sar/versions/:alertId', async (req, res) => {
  let client;
  try {
    const { alertId } = req.params;

    client = await pool.connect();

    const result = await client.query(`
      SELECT 
        version_id, version_number, analyst_id, analyst_name, role,
        change_type, change_description, field_changed, 
        sar_status_before, sar_status_after,
        change_timestamp, created_at
      FROM version_log 
      WHERE alert_id = $1
      ORDER BY version_number ASC;
    `, [alertId]);

    res.json({
      status: 'success',
      alert_id: alertId,
      versions: result.rows,
      total_versions: result.rows.length,
    });
  } catch (error) {
    console.error('[API] Error fetching SAR versions:', error);
    res.status(500).json({
      error: 'Failed to fetch SAR versions',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/sar/version/:versionId
 * Get a specific version's full content
 */
app.get('/api/sar/version/:versionId', async (req, res) => {
  let client;
  try {
    const { versionId } = req.params;

    client = await pool.connect();

    const result = await client.query(`
      SELECT 
        version_id, alert_id, version_number, sar_content, sar_format,
        analyst_id, analyst_name, role, change_type, change_description,
        sar_status_before, sar_status_after, change_timestamp, created_at
      FROM version_log 
      WHERE version_id = $1;
    `, [versionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const version = result.rows[0];

    res.json({
      status: 'success',
      version_id: version.version_id,
      alert_id: version.alert_id,
      version_number: version.version_number,
      sar_content: version.sar_content,
      sar_format: version.sar_format,
      analyst_id: version.analyst_id,
      analyst_name: version.analyst_name,
      role: version.role,
      change_type: version.change_type,
      change_description: version.change_description,
      sar_status_before: version.sar_status_before,
      sar_status_after: version.sar_status_after,
      change_timestamp: version.change_timestamp,
    });
  } catch (error) {
    console.error('[API] Error fetching SAR version:', error);
    res.status(500).json({
      error: 'Failed to fetch SAR version',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * POST /api/sar/version/revert/:versionId
 * Revert to a previous version (creates a new version entry pointing back to old content)
 */
app.post('/api/sar/version/revert/:versionId', async (req, res) => {
  let client;
  try {
    const { versionId } = req.params;
    const {
      analyst_id = 'SYSTEM',
      analyst_name = 'System',
      role = 'SYSTEM',
    } = req.body;

    client = await pool.connect();

    // Get the version to revert to
    const versionResult = await client.query(`
      SELECT version_id, alert_id, version_number, sar_content, sar_status_before
      FROM version_log 
      WHERE version_id = $1;
    `, [versionId]);

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const revertTo = versionResult.rows[0];

    // Get next version number for this alert
    const maxVersionResult = await client.query(`
      SELECT MAX(version_number) as max_version FROM version_log WHERE alert_id = $1;
    `, [revertTo.alert_id]);

    const nextVersion = (maxVersionResult.rows[0]?.max_version || 0) + 1;

    // Create new version entry (revert operation)
    const insertResult = await client.query(`
      INSERT INTO version_log 
      (alert_id, analyst_id, analyst_name, role, version_number, sar_content, 
       sar_format, field_changed, change_type, change_description, 
       sar_status_before, sar_status_after, change_timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING version_id, version_number, change_timestamp;
    `, [
      revertTo.alert_id, analyst_id, analyst_name, role, nextVersion,
      revertTo.sar_content, 'TEXT', 'sar_content',
      'REVERTED', `Reverted to version ${revertTo.version_number}`,
      revertTo.sar_status_before, revertTo.sar_status_before,
    ]);

    const newVersion = insertResult.rows[0];

    console.log(`[API] ✓ Reverted to version ${revertTo.version_number}, now version ${nextVersion} for alert ${revertTo.alert_id}`);

    res.json({
      status: 'success',
      alert_id: revertTo.alert_id,
      reverted_from_version: revertTo.version_number,
      new_version_number: newVersion.version_number,
      new_version_id: newVersion.version_id,
      message: `Successfully reverted to version ${revertTo.version_number}. Created new version ${newVersion.version_number}`,
      timestamp: newVersion.change_timestamp,
    });
  } catch (error) {
    console.error('[API] Error reverting SAR version:', error);
    res.status(500).json({
      error: 'Failed to revert SAR version',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/sar/current/:alertId
 * Get the current/latest version of a SAR
 */
app.get('/api/sar/current/:alertId', async (req, res) => {
  let client;
  try {
    const { alertId } = req.params;

    client = await pool.connect();

    const result = await client.query(`
      SELECT 
        version_id, version_number, sar_content, sar_format,
        analyst_id, analyst_name, role, change_type, change_description,
        sar_status_before, sar_status_after, change_timestamp
      FROM version_log 
      WHERE alert_id = $1
      ORDER BY version_number DESC
      LIMIT 1;
    `, [alertId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No SAR version found for this alert' });
    }

    const currentVersion = result.rows[0];

    res.json({
      status: 'success',
      alert_id: alertId,
      version_id: currentVersion.version_id,
      version_number: currentVersion.version_number,
      sar_content: currentVersion.sar_content,
      sar_format: currentVersion.sar_format,
      analyst_id: currentVersion.analyst_id,
      analyst_name: currentVersion.analyst_name,
      role: currentVersion.role,
      change_type: currentVersion.change_type,
      change_description: currentVersion.change_description,
      sar_status: currentVersion.sar_status_after,
      change_timestamp: currentVersion.change_timestamp,
    });
  } catch (error) {
    console.error('[API] Error fetching current SAR version:', error);
    res.status(500).json({
      error: 'Failed to fetch current SAR version',
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startup();

module.exports = app;
