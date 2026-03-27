-- Insert Suspicious Transactions for Testing
-- This SQL script populates the database with test data

-- Insert test accounts
INSERT INTO accounts (account_id, customer_name, kyc_status, country, high_risk_country, pep_status)
VALUES 
  ('ACC_TEST_001', 'Test Customer 1', 'VERIFIED', 'US', false, false),
  ('ACC_TEST_002', 'Test Customer 2', 'VERIFIED', 'US', false, false),
  ('ACC_TEST_003', 'Test Customer 3', 'VERIFIED', 'US', false, false),
  ('ACC_TEST_004', 'Test Customer 4 - FLAGGED', 'FLAGGED', 'US', false, true),
  ('ACC_TEST_005', 'Test Customer 5', 'VERIFIED', 'US', false, false),
  ('ACC_TEST_006', 'Test Customer 6', 'VERIFIED', 'IRAN', true, false)
ON CONFLICT (account_id) DO NOTHING;

-- Insert suspicious transactions
INSERT INTO transactions (transaction_id, account_id, to_account, timestamp, amount_received, confidence_score, risk_level, ml_processed, is_suspicious)
VALUES
  ('TXN_TEST_001', 'ACC_TEST_001', 'ACC_UNKNOWN_001', NOW(), 500000, 95, 'CRITICAL', true, true),
  ('TXN_TEST_002', 'ACC_TEST_002', 'ACC_UNKNOWN_002', NOW(), 9900, 92, 'HIGH', true, true),
  ('TXN_TEST_003', 'ACC_TEST_003', 'ACC_TEST_006', NOW(), 150000, 94, 'CRITICAL', true, true),
  ('TXN_TEST_004', 'ACC_TEST_004', 'ACC_UNKNOWN_003', NOW(), 999999, 98, 'CRITICAL', true, true),
  ('TXN_TEST_005', 'ACC_TEST_005', 'ACC_TEST_001', NOW(), 100000, 88, 'HIGH', true, true)
ON CONFLICT (transaction_id) DO NOTHING;

-- Insert alerts based on transactions
INSERT INTO alerts (alert_id, transaction_id, account_id, confidence_score, risk_level, status, patterns_detected, alert_timestamp)
VALUES
  ('ALERT_TEST_001', 'TXN_TEST_001', 'ACC_TEST_001', 95, 'CRITICAL', 'NEW', '{"Sudden Spike"}', NOW()),
  ('ALERT_TEST_002', 'TXN_TEST_002', 'ACC_TEST_002', 92, 'HIGH', 'NEW', '{"Structuring Pattern"}', NOW()),
  ('ALERT_TEST_003', 'TXN_TEST_003', 'ACC_TEST_003', 94, 'CRITICAL', 'NEW', '{"Geographic Anomaly"}', NOW()),
  ('ALERT_TEST_004', 'TXN_TEST_004', 'ACC_TEST_004', 98, 'CRITICAL', 'NEW', '{"Balance Drain"}', NOW()),
  ('ALERT_TEST_005', 'TXN_TEST_005', 'ACC_TEST_005', 88, 'HIGH', 'NEW', '{"Circular Transactions"}', NOW())
ON CONFLICT (alert_id) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as test_accounts FROM accounts WHERE account_id LIKE 'ACC_TEST_%';
SELECT COUNT(*) as test_alerts FROM alerts WHERE account_id LIKE 'ACC_TEST_%';
SELECT alert_id, account_id, confidence_score, risk_level, status FROM alerts WHERE account_id LIKE 'ACC_TEST_%' ORDER BY confidence_score DESC;
