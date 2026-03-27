#!/usr/bin/env python3
"""
Insert Test Data Directly into PostgreSQL
Creates suspicious transactions with proper history for anomaly detection
"""

import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta
import os

# Database connection
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "aml_fraud_detection"
DB_USER = "postgres"
DB_PASSWORD = "anish@123"

def connect_db():
    """Connect to PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return None

def insert_test_data():
    """Insert suspicious transactions and create alerts"""
    
    conn = connect_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    print("\n" + "="*80)
    print("INSERTING SUSPICIOUS TRANSACTIONS INTO DATABASE")
    print("="*80 + "\n")
    
    try:
        # Insert test accounts
        print("📊 Inserting test accounts...")
        
        accounts = [
            ("ACC_TEST_001", "Test Bank", "Test Entity 1", False),
            ("ACC_TEST_002", "Test Bank", "Test Entity 2", False),
            ("ACC_TEST_003", "Test Bank", "Test Entity 3", False),
            ("ACC_TEST_004", "Test Bank", "Test Entity 4", True),  # Flagged
            ("ACC_TEST_005", "Test Bank", "Test Entity 5", False),
        ]
        
        for account_id, bank, entity, is_flagged in accounts:
            cursor.execute("""
                INSERT INTO accounts (account_id, bank_name, account_holder, is_flagged, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (account_id, bank, entity, is_flagged, datetime.now()))
        
        conn.commit()
        print(f"✓ Inserted {len(accounts)} test accounts\n")
        
        # Insert suspicious transactions
        print("🚨 Inserting suspicious transactions...\n")
        
        transactions_data = [
            {
                "name": "SUDDEN SPIKE - $500K",
                "account_id": "ACC_TEST_001",
                "amount": 500000,
                "recipient": "UNKNOWN_ENTITY_001",
                "risk_score": 95
            },
            {
                "name": "Structuring Pattern - Multiple $9.9K",
                "account_id": "ACC_TEST_002",
                "amount": 9900,
                "recipient": "BENEFICIARY_STRUCT_1",
                "risk_score": 92
            },
            {
                "name": "Geographic Anomaly - Sanctioned Country",
                "account_id": "ACC_TEST_003",
                "amount": 150000,
                "recipient": "INTL_BENEFICIARY_IRAN",
                "risk_score": 94
            },
            {
                "name": "Balance Drain - 99% of Account",
                "account_id": "ACC_TEST_004",
                "amount": 999999,
                "recipient": "OFFSHORE_ACCOUNT_X",
                "risk_score": 98
            },
            {
                "name": "Circular Transactions - Looping Transfer",
                "account_id": "ACC_TEST_005",
                "amount": 100000,
                "recipient": "ACC_TEST_001",
                "risk_score": 88
            },
        ]
        
        transaction_ids = []
        for i, txn in enumerate(transactions_data):
            txn_id = f"TXN_TEST_{i+1:03d}"
            transaction_ids.append(txn_id)
            
            cursor.execute("""
                INSERT INTO transactions 
                (transaction_id, account_id, recipient, amount, transaction_type, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                txn_id,
                txn["account_id"],
                txn["recipient"],
                txn["amount"],
                "TRANSFER",
                "COMPLETED",
                datetime.now()
            ))
            
            print(f"  ✓ {txn['name']} (${txn['amount']:,}) -> {txn_id}")
        
        conn.commit()
        
        # Create corresponding alerts
        print(f"\n🚨 Creating alerts based on transactions...\n")
        
        for i, txn in enumerate(transactions_data):
            alert_id = f"ALERT_TEST_{i+1:03d}"
            txn_id = transaction_ids[i]
            confidence = txn["risk_score"]
            
            # Determine risk level
            if confidence >= 95:
                risk_level = "CRITICAL"
            elif confidence >= 85:
                risk_level = "HIGH"
            elif confidence >= 70:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
            cursor.execute("""
                INSERT INTO alerts
                (alert_id, transaction_id, account_id, confidence_score, risk_level, 
                 status, pattern_detected, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                alert_id,
                txn_id,
                txn["account_id"],
                confidence,
                risk_level,
                "PENDING",
                txn["name"],
                datetime.now()
            ))
            
            print(f"  ✓ {alert_id} | {txn['name']}")
            print(f"     Risk: {risk_level} | Confidence: {confidence}%\n")
        
        conn.commit()
        print("="*80)
        print("✓ DATABASE POPULATED WITH SUSPICIOUS TRANSACTIONS")
        print("="*80)
        print("\n💡 TIP: Refresh the React app at http://localhost:3001")
        print("   You should now see the alerts in the left panel!\n")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    insert_test_data()
