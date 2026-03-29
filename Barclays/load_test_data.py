import psycopg2

conn = psycopg2.connect(
    dbname='barclays_aml',
    user='barclays_app',
    password='change_me_to_secure_password',
    host='localhost',
    port=5432
)
cursor = conn.cursor()

print("Inserting test data...")

# Insert accounts
accounts = [
    ('ACC_TEST_001', 'Test Customer 1', 'VERIFIED', 'US', False, False),
    ('ACC_TEST_002', 'Test Customer 2', 'VERIFIED', 'US', False, False),
    ('ACC_TEST_003', 'Test Customer 3', 'VERIFIED', 'US', False, False),
    ('ACC_TEST_004', 'Test Customer 4 - FLAGGED', 'FLAGGED', 'US', False, True),
]

for acc in accounts:
    cursor.execute("""
        INSERT INTO accounts (account_id, customer_name, kyc_status, country, high_risk_country, pep_status)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (account_id) DO NOTHING
    """, acc)

# Insert transactions
trans = [
    ('TXN_TEST_001', 'ACC_TEST_001', 'ACC_UNKNOWN_001', 500000),
    ('TXN_TEST_002', 'ACC_TEST_002', 'ACC_UNKNOWN_002', 9900),
    ('TXN_TEST_003', 'ACC_TEST_003', 'ACC_TEST_004', 150000),
    ('TXN_TEST_004', 'ACC_TEST_004', 'ACC_UNKNOWN_003', 999999),
]

for t in trans:
    cursor.execute("""
        INSERT INTO transactions 
        (transaction_id, account_id, to_account, timestamp, amount_received, receiving_currency, risk_level, confidence_score, is_suspicious, ml_processed)
        VALUES (%s, %s, %s, NOW(), %s, 'USD', 'CRITICAL', 95, true, true)
        ON CONFLICT (transaction_id) DO NOTHING
    """, t)

# Insert alerts
alerts = [
    ('ALERT_TEST_001', 'TXN_TEST_001', 'ACC_TEST_001', 95, 'CRITICAL', 'NEW'),
    ('ALERT_TEST_002', 'TXN_TEST_002', 'ACC_TEST_002', 92, 'HIGH', 'NEW'),
    ('ALERT_TEST_003', 'TXN_TEST_003', 'ACC_TEST_003', 94, 'CRITICAL', 'NEW'),
    ('ALERT_TEST_004', 'TXN_TEST_004', 'ACC_TEST_004', 98, 'CRITICAL', 'NEW'),
]

for alert in alerts:
    cursor.execute("""
        INSERT INTO alerts 
        (alert_id, transaction_id, account_id, confidence_score, risk_level, status, patterns_detected, alert_timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, '{"Pattern1"}', NOW())
        ON CONFLICT (alert_id) DO NOTHING
    """, alert)

conn.commit()

# Verify
cursor.execute("SELECT COUNT(*) FROM alerts WHERE status = 'NEW'")
count = cursor.fetchone()[0]
print(f"✓ Test data inserted successfully!")
print(f"✓ Total NEW alerts: {count}")

cursor.close()
conn.close()
