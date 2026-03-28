-- ============================================================================
-- BARCLAYS AML FRAUD DETECTION SYSTEM - PostgreSQL Database Setup
-- ============================================================================
-- This script creates all necessary tables and indexes for the ML model
-- Run this to initialize your PostgreSQL database
-- ============================================================================

-- Create database
CREATE DATABASE barclays_aml OWNER postgres;

-- Connect to the new database
-- (In psql, run: \c barclays_aml)

-- ============================================================================
-- 1. ACCOUNTS TABLE 
-- ============================================================================
CREATE TABLE accounts (
    account_id VARCHAR(255) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    kyc_status VARCHAR(50),          -- VERIFIED, UNVERIFIED, FLAGGED
    account_open_date DATE,
    country VARCHAR(100),
    account_type VARCHAR(50),         -- CHECKING, SAVINGS, BUSINESS, etc.
    avg_monthly_transactions INT,
    avg_transaction_amount DECIMAL(15, 2),
    high_risk_country BOOLEAN DEFAULT false,
    pep_status BOOLEAN DEFAULT false,  -- Politically Exposed Person
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE transactions (
    transaction_id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    from_account VARCHAR(255),
    to_account VARCHAR(255),
    
    -- Transaction Details
    timestamp TIMESTAMP NOT NULL,
    amount_received DECIMAL(15, 2) NOT NULL,
    receiving_currency VARCHAR(3),
    amount_paid DECIMAL(15, 2),
    payment_currency VARCHAR(3),
    payment_format VARCHAR(100),      -- ACH, WIRE, CARD, CHECK, etc.
    
    -- Alert Linkage
    alert_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. ML PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE ml_predictions (
    prediction_id SERIAL PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Prediction Details
    rule_violated VARCHAR(255) NOT NULL,              -- Pattern name (e.g., 'Sudden Spike', 'Structuring/Smurfing')
    score INT NOT NULL,                               -- Confidence score 1-100
    
    -- Metadata
    prediction_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. ALERTS TABLE
-- ============================================================================
CREATE TABLE alerts (
    alert_id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    
    -- Risk Information
    confidence_score INT NOT NULL,                     -- Score that triggered alert
    risk_level VARCHAR(50) NOT NULL,                   -- HIGH, CRITICAL
    priority VARCHAR(50),                              -- IMMEDIATE, HIGH, MEDIUM, LOW
    
    -- Pattern Details
    patterns_detected TEXT[],                          -- Array of pattern names
    pattern_scores JSONB,                              -- JSON of pattern scores
    
    -- Alert Status
    status VARCHAR(50) DEFAULT 'NEW',                  -- NEW, ACKNOWLEDGED, RESOLVED, FALSE_POSITIVE
    alert_timestamp TIMESTAMP DEFAULT NOW(),
    acknowledged_timestamp TIMESTAMP,
    resolved_timestamp TIMESTAMP,
    
    -- Investigation
    investigator_id VARCHAR(255),
    investigation_notes TEXT,
    resolution_action VARCHAR(255),                    -- BLOCK, MONITOR, CLOSE, ESCALATE, etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. VERSION LOG TABLE (SAR Report Edit Tracking)
-- ============================================================================
CREATE TABLE version_log (
    version_id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
    
    -- User Information
    analyst_id VARCHAR(255) NOT NULL,                 -- ID of analyst/admin making changes
    analyst_name VARCHAR(255),                        -- Name of analyst/admin for easy reference
    role VARCHAR(50),                                 -- ANALYST, ADMIN, REVIEWER, etc.
    
    -- Change Details
    version_number INT NOT NULL,                      -- Version number (1, 2, 3, etc.)
    field_changed VARCHAR(255),                       -- Which field was changed (e.g., 'narrative', 'findings', 'status')
    old_value TEXT,                                   -- Previous value
    new_value TEXT,                                   -- New value
    change_description TEXT,                          -- Human-readable description of change
    
    -- Additional Context
    change_type VARCHAR(50),                          -- ADDED, MODIFIED, DELETED, APPROVED, REJECTED
    sar_status_before VARCHAR(50),                    -- SAR status before change (DRAFT, PENDING, APPROVED, etc.)
    sar_status_after VARCHAR(50),                     -- SAR status after change
    
    -- Metadata
    change_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    alert_id VARCHAR(255) REFERENCES alerts(alert_id) ON DELETE CASCADE,
    
    action_type VARCHAR(100),                          -- SCORED, ALERTED, ACKNOWLEDGED, etc.
    old_values JSONB,
    new_values JSONB,
    
    changed_by VARCHAR(255),                           -- System or user ID
    change_timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. MODEL METRICS TABLE (for monitoring)
-- ============================================================================
CREATE TABLE model_metrics (
    metric_id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    metric_hour INT,                                   -- 0-23
    
    -- Processing Stats
    total_transactions_processed INT DEFAULT 0,
    avg_processing_time_ms DECIMAL(10, 2) DEFAULT 0,  -- milliseconds
    
    -- Alert Stats
    total_alerts_generated INT DEFAULT 0,
    high_risk_alerts INT DEFAULT 0,
    critical_alerts INT DEFAULT 0,
    
    -- Accuracy Metrics (for feedback loop)
    true_positives INT DEFAULT 0,
    false_positives INT DEFAULT 0,
    true_negatives INT DEFAULT 0,
    false_negatives INT DEFAULT 0,
    
    -- Pattern Breakdown
    patterns_breakdown JSONB,                          -- Count per pattern type
    
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 8. PATTERN DEFINITIONS TABLE
-- ============================================================================
CREATE TABLE pattern_definitions (
    pattern_id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(255) NOT NULL UNIQUE,
    pattern_description TEXT,
    weight DECIMAL(3, 2),                              -- How much this pattern contributes to score
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert the 13 patterns
INSERT INTO pattern_definitions (pattern_name, pattern_description, weight) VALUES
    ('Sudden Spike', 'Transaction amount significantly higher than historical average', 0.10),
    ('Structuring/Smurfing', 'Multiple transactions near suspicious thresholds', 0.12),
    ('Geographic Behavior Change', 'Transaction from unusual location', 0.08),
    ('New Account High Activity', 'Newly opened account with immediate high activity', 0.10),
    ('Layering/Rapid In-Out', 'Quick back-to-back movement of funds', 0.11),
    ('Dormant Account Activation', 'Long inactive account suddenly active', 0.09),
    ('Linked Account Behavior', 'Suspicious pattern in linked accounts', 0.08),
    ('Balance Drain Pattern', 'Systematic withdrawal of account balance', 0.10),
    ('Time-Based Anomaly', 'Transaction at unusual times', 0.07),
    ('Transaction Type Change', 'Unusual payment method for this account', 0.09),
    ('Velocity Change', 'Rapid increase in transaction frequency', 0.10),
    ('Merchant/Receiver Pattern Change', 'New recipients or merchants', 0.08),
    ('Circular Transactions', 'Round-trip money movement between accounts', 0.12);

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Transactions indexes
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_alert_id ON transactions(alert_id);

-- Alerts indexes
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_account_id ON alerts(account_id);
CREATE INDEX idx_alerts_transaction_id ON alerts(transaction_id);
CREATE INDEX idx_alerts_alert_timestamp ON alerts(alert_timestamp DESC);
CREATE INDEX idx_alerts_confidence ON alerts(confidence_score DESC);
CREATE INDEX idx_alerts_risk_level ON alerts(risk_level);

-- ML Predictions indexes
CREATE INDEX idx_ml_predictions_account_id ON ml_predictions(account_id);
CREATE INDEX idx_ml_predictions_transaction_id ON ml_predictions(transaction_id);
CREATE INDEX idx_ml_predictions_score ON ml_predictions(score DESC);
CREATE INDEX idx_ml_predictions_rule_violated ON ml_predictions(rule_violated);
CREATE INDEX idx_ml_predictions_timestamp ON ml_predictions(prediction_timestamp DESC);

-- Version Log indexes
CREATE INDEX idx_version_log_alert_id ON version_log(alert_id);
CREATE INDEX idx_version_log_analyst_id ON version_log(analyst_id);
CREATE INDEX idx_version_log_version_number ON version_log(alert_id, version_number DESC);
CREATE INDEX idx_version_log_change_type ON version_log(change_type);
CREATE INDEX idx_version_log_timestamp ON version_log(change_timestamp DESC);
CREATE INDEX idx_version_log_field_changed ON version_log(field_changed);

-- Audit log indexes
CREATE INDEX idx_audit_log_transaction_id ON audit_log(transaction_id);
CREATE INDEX idx_audit_log_alert_id ON audit_log(alert_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(change_timestamp DESC);

-- Model metrics indexes
CREATE INDEX idx_model_metrics_date ON model_metrics(metric_date DESC);

-- ============================================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- High-risk accounts view
CREATE VIEW high_risk_accounts AS
SELECT 
    a.account_id,
    a.customer_name,
    COUNT(t.transaction_id) as transaction_count,
    SUM(CASE WHEN t.is_suspicious THEN 1 ELSE 0 END) as suspicious_count,
    AVG(t.confidence_score) as avg_confidence,
    MAX(t.timestamp) as latest_transaction
FROM accounts a
LEFT JOIN transactions t ON a.account_id = t.account_id
WHERE a.kyc_status = 'FLAGGED' 
   OR a.pep_status = true
   OR a.high_risk_country = true
GROUP BY a.account_id, a.customer_name;

-- Pending alerts view
CREATE VIEW pending_alerts AS
SELECT 
    al.alert_id,
    al.account_id,
    a.customer_name,
    al.transaction_id,
    al.confidence_score,
    al.risk_level,
    al.status,
    al.alert_timestamp,
    array_length(al.patterns_detected, 1) as pattern_count
FROM alerts al
JOIN accounts a ON al.account_id = a.account_id
WHERE al.status = 'NEW'
ORDER BY al.confidence_score DESC, al.alert_timestamp DESC;

-- SAR Version History view
CREATE VIEW sar_version_history AS
SELECT 
    vl.alert_id,
    vl.version_number,
    vl.analyst_name,
    vl.role,
    vl.field_changed,
    vl.change_type,
    vl.change_timestamp,
    vl.sar_status_before,
    vl.sar_status_after,
    ROW_NUMBER() OVER (PARTITION BY vl.alert_id ORDER BY vl.version_number DESC) as latest_change_rank
FROM version_log vl
ORDER BY vl.alert_id, vl.version_number DESC;

-- ============================================================================
-- 11. FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to create a new alert
CREATE OR REPLACE FUNCTION create_alert(
    p_transaction_id VARCHAR(255),
    p_account_id VARCHAR(255),
    p_confidence_score INT,
    p_risk_level VARCHAR(50),
    p_patterns TEXT[]
)
RETURNS VARCHAR(255) AS $$
DECLARE
    v_alert_id VARCHAR(255);
BEGIN
    v_alert_id := 'ALERT_' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24-MI-SS-US') || '_' || 
                  SUBSTR(MD5(p_transaction_id), 1, 8);
    
    INSERT INTO alerts (
        alert_id, transaction_id, account_id, confidence_score, 
        risk_level, patterns_detected, priority
    ) VALUES (
        v_alert_id, p_transaction_id, p_account_id, p_confidence_score,
        p_risk_level, p_patterns,
        CASE 
            WHEN p_confidence_score >= 95 THEN 'IMMEDIATE'
            WHEN p_confidence_score >= 90 THEN 'HIGH'
            ELSE 'MEDIUM'
        END
    );
    
    -- Update transaction with alert_id
    UPDATE transactions SET alert_id = v_alert_id WHERE transaction_id = p_transaction_id;
    
    -- Log to audit table
    INSERT INTO audit_log (transaction_id, alert_id, action_type, new_values, changed_by)
    VALUES (p_transaction_id, v_alert_id, 'ALERT_CREATED', 
            jsonb_build_object('confidence_score', p_confidence_score, 'risk_level', p_risk_level),
            'ML_SYSTEM');
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to acknowledge an alert
CREATE OR REPLACE FUNCTION acknowledge_alert(p_alert_id VARCHAR(255), p_investigator_id VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE alerts 
    SET status = 'ACKNOWLEDGED',
        acknowledged_timestamp = NOW(),
        investigator_id = p_investigator_id
    WHERE alert_id = p_alert_id;
    
    INSERT INTO audit_log (alert_id, action_type, new_values, changed_by)
    VALUES (p_alert_id, 'ACKNOWLEDGED', jsonb_build_object('acknowledger', p_investigator_id), p_investigator_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to log SAR report edits (Version Control)
CREATE OR REPLACE FUNCTION log_sar_edit(
    p_alert_id VARCHAR(255),
    p_analyst_id VARCHAR(255),
    p_analyst_name VARCHAR(255),
    p_role VARCHAR(50),
    p_field_changed VARCHAR(255),
    p_old_value TEXT,
    p_new_value TEXT,
    p_change_description TEXT,
    p_change_type VARCHAR(50),
    p_sar_status_before VARCHAR(50),
    p_sar_status_after VARCHAR(50)
)
RETURNS INT AS $$
DECLARE
    v_version_number INT;
BEGIN
    -- Get the next version number for this alert
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM version_log
    WHERE alert_id = p_alert_id;
    
    -- Insert the version log entry
    INSERT INTO version_log (
        alert_id, analyst_id, analyst_name, role, version_number,
        field_changed, old_value, new_value, change_description,
        change_type, sar_status_before, sar_status_after
    ) VALUES (
        p_alert_id, p_analyst_id, p_analyst_name, p_role, v_version_number,
        p_field_changed, p_old_value, p_new_value, p_change_description,
        p_change_type, p_sar_status_before, p_sar_status_after
    );
    
    -- Log to audit table
    INSERT INTO audit_log (alert_id, action_type, old_values, new_values, changed_by)
    VALUES (p_alert_id, 'SAR_EDITED', 
            jsonb_build_object('field', p_field_changed, 'old_value', p_old_value),
            jsonb_build_object('field', p_field_changed, 'new_value', p_new_value),
            p_analyst_id);
    
    RETURN v_version_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get SAR edit history
CREATE OR REPLACE FUNCTION get_sar_edit_history(p_alert_id VARCHAR(255))
RETURNS TABLE(
    version_id INT,
    version_number INT,
    analyst_name VARCHAR(255),
    field_changed VARCHAR(255),
    change_type VARCHAR(50),
    change_timestamp TIMESTAMP,
    sar_status_before VARCHAR(50),
    sar_status_after VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vl.version_id,
        vl.version_number,
        vl.analyst_name,
        vl.field_changed,
        vl.change_type,
        vl.change_timestamp,
        vl.sar_status_before,
        vl.sar_status_after
    FROM version_log vl
    WHERE vl.alert_id = p_alert_id
    ORDER BY vl.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. PERMISSIONS (Optional - Create application user)
-- ============================================================================

CREATE USER barclays_app WITH PASSWORD 'change_me_to_secure_password';

GRANT CONNECT ON DATABASE barclays_aml TO barclays_app;
GRANT USAGE ON SCHEMA public TO barclays_app;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO barclays_app;
GRANT SEQUENCE ON ALL SEQUENCES IN SCHEMA public TO barclays_app;

-- Grant view permissions
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO barclays_app;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your PostgreSQL database is now ready!
-- 
-- Next steps:
-- 1. Connect to your database: psql -U postgres -d barclays_aml
-- 2. Verify tables: \dt
-- 3. Load sample data (if you have any)
-- 4. Configure your Flask backend to connect using:
--    - User: barclays_app
--    - Password: change_me_to_secure_password
--    - Host: localhost (or your server)
--    - Port: 5432
--    - Database: barclays_aml
-- ============================================================================
