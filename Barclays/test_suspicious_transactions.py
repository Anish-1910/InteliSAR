#!/usr/bin/env python3
"""
Test Script - Insert Suspicious Transactions to Demonstrate AML System
This script inserts transaction data that deviates from normal patterns
to trigger fraud detection alerts in the system.
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
BACKEND_URL = "http://localhost:3000"
ML_SERVICE_URL = "http://localhost:5000"

def test_connection():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"✓ Backend health: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Backend not accessible: {e}")
        return False

def send_suspicious_transaction(transaction_data):
    """Send a transaction for ML analysis"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/transactions/analyze",
            json={"transaction": transaction_data},
            timeout=10
        )
        return response.json()
    except Exception as e:
        print(f"✗ Error sending transaction: {e}")
        return None

def create_test_transactions():
    """Create various suspicious transaction patterns"""
    
    print("\n" + "="*80)
    print("INSERTING SUSPICIOUS TRANSACTIONS FOR ANOMALY DETECTION")
    print("="*80 + "\n")
    
    tests = [
        {
            "name": "🚨 SUDDEN SPIKE - $500K from Account",
            "account_id": "ACC_TEST_001",
            "transaction_id": f"TXN_TEST_001_{datetime.now().timestamp()}",
            "amount": 500000,  # Extremely high - pattern 1
            "recipient": "UNKNOWN_BENEFICIARY_001",
            "description": "Unusual large transfer outside normal range"
        },
        {
            "name": "🚨 STRUCTURING PATTERN - Multiple $9.9K transfers",
            "transactions": [
                {
                    "account_id": "ACC_TEST_002",
                    "transaction_id": f"TXN_TEST_002A_{datetime.now().timestamp()}",
                    "amount": 9900,
                    "recipient": "BENEFICIARY_001",
                    "description": "Multiple transfers just under reporting threshold"
                },
                {
                    "account_id": "ACC_TEST_002",
                    "transaction_id": f"TXN_TEST_002B_{datetime.now().timestamp() + 1}",
                    "amount": 9900,
                    "recipient": "BENEFICIARY_002",
                    "description": "Second transfer under threshold"
                },
                {
                    "account_id": "ACC_TEST_002",
                    "transaction_id": f"TXN_TEST_002C_{datetime.now().timestamp() + 2}",
                    "amount": 9900,
                    "recipient": "BENEFICIARY_003",
                    "description": "Third transfer under threshold"
                }
            ]
        },
        {
            "name": "🚨 GEOGRAPHIC ANOMALY - New Country Transaction",
            "account_id": "ACC_TEST_003",
            "transaction_id": f"TXN_TEST_003_{datetime.now().timestamp()}",
            "amount": 150000,
            "recipient": "INTL_BENEFICIARY_IRAN",
            "description": "Sudden international transfer to sanctioned jurisdiction"
        },
        {
            "name": "🚨 DORMANT ACCOUNT ACTIVATION",
            "account_id": "ACC_TEST_004",  # Simulating dormant account
            "transaction_id": f"TXN_TEST_004_{datetime.now().timestamp()}",
            "amount": 200000,
            "recipient": "NEW_BENEFICIARY_UNKNOWN",
            "description": "First transaction from previously inactive account"
        },
        {
            "name": "🚨 CIRCULAR TRANSACTION PATTERN",
            "transactions": [
                {
                    "account_id": "ACC_TEST_005",
                    "transaction_id": f"TXN_TEST_005A_{datetime.now().timestamp()}",
                    "amount": 100000,
                    "recipient": "ACC_TEST_006",
                    "description": "Send to another account"
                },
                {
                    "account_id": "ACC_TEST_006",
                    "transaction_id": f"TXN_TEST_005B_{datetime.now().timestamp() + 10}",
                    "amount": 95000,
                    "recipient": "ACC_TEST_005",
                    "description": "Return from same account (circular)"
                }
            ]
        },
        {
            "name": "🚨 VELOCITY ANOMALY - 10 transactions in seconds",
            "account_id": "ACC_TEST_007",
            "multiple": True,
            "count": 10,
            "amount_range": (5000, 15000),
            "description": "Rapid sequential transactions"
        },
        {
            "name": "🚨 BALANCE DRAIN PATTERN",
            "account_id": "ACC_TEST_008",
            "transaction_id": f"TXN_TEST_008_{datetime.now().timestamp()}",
            "amount": 999999,  # Massive amount
            "recipient": "OFFSHORE_ACCOUNT_001",
            "description": "Near-complete account drain"
        },
        {
            "name": "🚨 TIME ANOMALY - 3 AM Transaction from Regular User",
            "account_id": "ACC_TEST_009",
            "transaction_id": f"TXN_TEST_009_{datetime.now().timestamp()}",
            "amount": 75000,
            "recipient": "SUSPICIOUS_BENEFICIARY_009",
            "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
            "description": "Large transaction outside business hours"
        },
        {
            "name": "🚨 LINKED ACCOUNT CHAIN",
            "transactions": [
                {
                    "account_id": "ACC_TEST_010",
                    "transaction_id": f"TXN_TEST_010A_{datetime.now().timestamp()}",
                    "amount": 200000,
                    "recipient": "ACC_TEST_011",
                    "description": "First link in chain"
                },
                {
                    "account_id": "ACC_TEST_011",
                    "transaction_id": f"TXN_TEST_010B_{datetime.now().timestamp() + 5}",
                    "amount": 195000,
                    "recipient": "ACC_TEST_012",
                    "description": "Second link in chain"
                },
                {
                    "account_id": "ACC_TEST_012",
                    "transaction_id": f"TXN_TEST_010C_{datetime.now().timestamp() + 10}",
                    "amount": 190000,
                    "recipient": "ACC_TEST_013",
                    "description": "Third link in chain - potential layering"
                }
            ]
        }
    ]
    
    results = []
    
    for test in tests:
        print(f"\n{test['name']}")
        print("-" * 80)
        
        if "transactions" in test:
            # Handle multiple transactions
            for txn in test["transactions"]:
                print(f"  Sending: {txn['description']}")
                result = send_suspicious_transaction(txn)
                if result:
                    confidence = result.get("confidence_score", 0)
                    flag = "🚨 FLAGGED" if confidence >= 90 else "⚠️  MEDIUM" if confidence >= 70 else "✓ LOW"
                    print(f"    {flag} - Confidence: {confidence}% | Risk: {result.get('risk_level', 'UNKNOWN')}")
                    results.append({
                        "test": test['name'],
                        "confidence": confidence,
                        "risk_level": result.get('risk_level', 'UNKNOWN'),
                        "patterns": result.get('patterns_detected', [])
                    })
                    
        elif "multiple" in test and test["multiple"]:
            # Handle velocity test
            for i in range(test["count"]):
                amount = random.randint(*test["amount_range"])
                txn = {
                    "account_id": test["account_id"],
                    "transaction_id": f"{test['account_id']}_VEL_{i}_{datetime.now().timestamp()}",
                    "amount": amount,
                    "recipient": f"BENEFICIARY_VEL_{i}",
                    "description": f"{test['description']} ({i+1}/{test['count']})"
                }
                print(f"  Sending: Transaction {i+1} - ${amount:,}")
                result = send_suspicious_transaction(txn)
                if result and i == test["count"] - 1:  # Show summary for last one
                    confidence = result.get("confidence_score", 0)
                    flag = "🚨 FLAGGED" if confidence >= 90 else "⚠️  MEDIUM" if confidence >= 70 else "✓ LOW"
                    print(f"    {flag} - Confidence: {confidence}% | Risk: {result.get('risk_level', 'UNKNOWN')}")
                    results.append({
                        "test": test['name'],
                        "confidence": confidence,
                        "risk_level": result.get('risk_level', 'UNKNOWN'),
                        "patterns": result.get('patterns_detected', [])
                    })
        else:
            # Handle single transaction
            print(f"  Sending: {test['description']}")
            result = send_suspicious_transaction(test)
            if result:
                confidence = result.get("confidence_score", 0)
                flag = "🚨 FLAGGED" if confidence >= 90 else "⚠️  MEDIUM" if confidence >= 70 else "✓ LOW"
                print(f"    {flag} - Confidence: {confidence}% | Risk: {result.get('risk_level', 'UNKNOWN')}")
                results.append({
                    "test": test['name'],
                    "confidence": confidence,
                    "risk_level": result.get('risk_level', 'UNKNOWN'),
                    "patterns": result.get('patterns_detected', [])
                })
    
    return results

def display_summary(results):
    """Display test results summary"""
    print("\n\n" + "="*80)
    print("ANOMALY DETECTION TEST RESULTS SUMMARY")
    print("="*80 + "\n")
    
    flagged = [r for r in results if r["confidence"] >= 90]
    medium = [r for r in results if 70 <= r["confidence"] < 90]
    low = [r for r in results if r["confidence"] < 70]
    
    print(f"🚨 CRITICAL ALERTS (≥90%):  {len(flagged)}")
    for r in flagged:
        print(f"   • {r['test']}")
        print(f"     Confidence: {r['confidence']}% | Risk: {r['risk_level']}")
        print(f"     Patterns: {', '.join(r['patterns'][:3]) if r['patterns'] else 'None detected'}")
    
    print(f"\n⚠️  MEDIUM ALERTS (70-89%):   {len(medium)}")
    for r in medium:
        print(f"   • {r['test']}")
        print(f"     Confidence: {r['confidence']}% | Risk: {r['risk_level']}")
    
    print(f"\n✓ LOW RISK (<70%):           {len(low)}")
    for r in low:
        print(f"   • {r['test']}")
        print(f"     Confidence: {r['confidence']}% | Risk: {r['risk_level']}")
    
    print("\n" + "="*80)
    print(f"TOTAL TESTS: {len(results)} | FLAGGED: {len(flagged)} ⚠️ | MEDIUM: {len(medium)} | LOW: {len(low)}")
    print("="*80 + "\n")

def main():
    print("\n" + "╔" + "="*78 + "╗")
    print("║" + " "*20 + "BARCLAYS AML - SUSPICIOUS TRANSACTION TEST" + " "*15 + "║")
    print("╚" + "="*78 + "╝")
    
    # Check connection
    if not test_connection():
        print("\n✗ Cannot connect to backend. Make sure it's running on port 3000")
        return
    
    # Run tests
    results = create_test_transactions()
    
    # Display summary
    display_summary(results)
    
    print("\n💡 TIP: Now check the React frontend at http://localhost:3001")
    print("   You should see all these suspicious transactions as alerts in the left panel.\n")

if __name__ == "__main__":
    main()
