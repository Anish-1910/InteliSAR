"""
PostgreSQL Database Connection Helper for Barclays AML System
This module provides easy database connectivity and common operations.
"""

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from contextlib import contextmanager
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class DatabaseConfig:
    """Database configuration"""
    def __init__(self, 
                 dbname: str = "barclays_aml",
                 user: str = "barclays_app",
                 password: str = "change_me_to_secure_password",
                 host: str = "localhost",
                 port: int = 5432):
        self.dbname = dbname
        self.user = user
        self.password = password
        self.host = host
        self.port = port
    
    def get_connection_string(self) -> str:
        """Get psycopg2 connection string"""
        return f"dbname={self.dbname} user={self.user} password={self.password} host={self.host} port={self.port}"


class DatabaseManager:
    """Database operations for Barclays AML System"""
    
    def __init__(self, config: Optional[DatabaseConfig] = None):
        self.config = config or DatabaseConfig()
        self.conn = None
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        try:
            conn = psycopg2.connect(self.config.get_connection_string())
            yield conn
            conn.close()
        except psycopg2.Error as e:
            print(f"Database connection error: {e}")
            raise
    
    # ========== TRANSACTION OPERATIONS ==========
    
    def save_transaction(self, transaction_data: Dict) -> str:
        """
        Save a transaction to database
        
        Args:
            transaction_data: Dict with transaction details
            
        Returns:
            transaction_id
        """
        query = """
        INSERT INTO transactions 
        (transaction_id, account_id, from_account, to_account, 
         timestamp, amount_received, receiving_currency, 
         amount_paid, payment_currency, payment_format)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (transaction_id) DO UPDATE 
        SET updated_at = NOW();
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (
                transaction_data.get('transaction_id'),
                transaction_data.get('account_id'),
                transaction_data.get('from_account'),
                transaction_data.get('to_account'),
                transaction_data.get('timestamp'),
                transaction_data.get('amount_received'),
                transaction_data.get('receiving_currency'),
                transaction_data.get('amount_paid'),
                transaction_data.get('payment_currency'),
                transaction_data.get('payment_format'),
            ))
            conn.commit()
        
        return transaction_data.get('transaction_id')
    
    def update_transaction_scores(self, transaction_id: str, 
                                  confidence_score: int,
                                  is_suspicious: bool,
                                  risk_level: str,
                                  alert_id: Optional[str] = None) -> bool:
        """
        Update ML prediction scores for a transaction
        
        Args:
            transaction_id: Transaction ID
            confidence_score: 1-100 confidence score
            is_suspicious: Boolean flag
            risk_level: MINIMAL, LOW, MEDIUM, HIGH, CRITICAL
            alert_id: Optional alert ID if high risk
            
        Returns:
            Success status
        """
        query = """
        UPDATE transactions
        SET confidence_score = %s,
            is_suspicious = %s,
            risk_level = %s,
            alert_id = %s,
            ml_processed = true,
            processing_timestamp = NOW(),
            updated_at = NOW()
        WHERE transaction_id = %s;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (
                confidence_score,
                is_suspicious,
                risk_level,
                alert_id,
                transaction_id
            ))
            conn.commit()
            return cur.rowcount > 0
    
    def get_unprocessed_transactions(self, limit: int = 100) -> List[Dict]:
        """
        Get transactions that haven't been scored by ML yet
        
        Args:
            limit: Maximum transactions to return
            
        Returns:
            List of transaction dictionaries
        """
        query = """
        SELECT transaction_id, account_id, from_account, to_account,
               timestamp, amount_received, receiving_currency,
               amount_paid, payment_currency, payment_format
        FROM transactions
        WHERE ml_processed = false
        ORDER BY timestamp DESC
        LIMIT %s;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, (limit,))
            return cur.fetchall()
    
    # ========== ALERT OPERATIONS ==========
    
    def create_alert(self, transaction_id: str, account_id: str,
                    confidence_score: int, risk_level: str,
                    patterns: List[str]) -> str:
        """
        Create a high-risk alert
        
        Args:
            transaction_id: Associated transaction
            account_id: Associated account
            confidence_score: ML confidence score
            risk_level: HIGH or CRITICAL
            patterns: List of detected pattern names
            
        Returns:
            alert_id
        """
        query = """
        SELECT create_alert(%s, %s, %s, %s, %s);
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (
                transaction_id,
                account_id,
                confidence_score,
                risk_level,
                patterns
            ))
            alert_id = cur.fetchone()[0]
            conn.commit()
        
        return alert_id
    
    def get_pending_alerts(self) -> List[Dict]:
        """Get all NEW (unacknowledged) alerts"""
        query = """
        SELECT * FROM pending_alerts
        ORDER BY confidence_score DESC;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query)
            return cur.fetchall()
    
    def acknowledge_alert(self, alert_id: str, investigator_id: str) -> bool:
        """
        Mark an alert as acknowledged
        
        Args:
            alert_id: Alert to acknowledge
            investigator_id: Investigator ID or user name
            
        Returns:
            Success status
        """
        query = """
        SELECT acknowledge_alert(%s, %s);
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (alert_id, investigator_id))
            conn.commit()
            return True
    
    def resolve_alert(self, alert_id: str, resolution_action: str, notes: str = "") -> bool:
        """
        Mark an alert as resolved
        
        Args:
            alert_id: Alert to resolve
            resolution_action: BLOCK, MONITOR, CLOSE, ESCALATE, FALSE_POSITIVE
            notes: Investigation notes
            
        Returns:
            Success status
        """
        query = """
        UPDATE alerts
        SET status = 'RESOLVED',
            resolved_timestamp = NOW(),
            resolution_action = %s,
            investigation_notes = %s,
            updated_at = NOW()
        WHERE alert_id = %s;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (resolution_action, notes, alert_id))
            conn.commit()
            return cur.rowcount > 0
    
    # ========== ACCOUNT OPERATIONS ==========
    
    def save_account(self, account_data: Dict) -> str:
        """
        Save or update an account
        
        Args:
            account_data: Account details
            
        Returns:
            account_id
        """
        query = """
        INSERT INTO accounts 
        (account_id, customer_name, kyc_status, account_type, 
         country, pep_status, high_risk_country)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (account_id) DO UPDATE
        SET customer_name = EXCLUDED.customer_name,
            kyc_status = EXCLUDED.kyc_status,
            updated_at = NOW();
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (
                account_data.get('account_id'),
                account_data.get('customer_name'),
                account_data.get('kyc_status', 'UNVERIFIED'),
                account_data.get('account_type', 'CHECKING'),
                account_data.get('country'),
                account_data.get('pep_status', False),
                account_data.get('high_risk_country', False),
            ))
            conn.commit()
        
        return account_data.get('account_id')
    
    def get_account_details(self, account_id: str) -> Optional[Dict]:
        """Get account details"""
        query = "SELECT * FROM accounts WHERE account_id = %s;"
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, (account_id,))
            return cur.fetchone()
    
    def get_high_risk_accounts(self) -> List[Dict]:
        """Get all flagged or high-risk accounts"""
        query = "SELECT * FROM high_risk_accounts ORDER BY avg_confidence DESC;"
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query)
            return cur.fetchall()
    
    # ========== METRICS OPERATIONS ==========
    
    def record_metrics(self, metric_data: Dict) -> bool:
        """
        Record model performance metrics
        
        Args:
            metric_data: Metrics to record
            
        Returns:
            Success status
        """
        query = """
        INSERT INTO model_metrics
        (metric_date, metric_hour, total_transactions_processed,
         avg_processing_time_ms, total_alerts_generated)
        VALUES (CURRENT_DATE, EXTRACT(HOUR FROM NOW()), %s, %s, %s);
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, (
                metric_data.get('total_transactions', 0),
                metric_data.get('avg_processing_time', 0),
                metric_data.get('total_alerts', 0),
            ))
            conn.commit()
            return True
    
    def get_today_metrics(self) -> Optional[Dict]:
        """Get today's aggregate metrics"""
        query = """
        SELECT 
            SUM(total_transactions_processed) as total_transactions,
            AVG(avg_processing_time_ms) as avg_processing_time,
            SUM(total_alerts_generated) as total_alerts,
            SUM(high_risk_alerts) as high_risk_alerts,
            SUM(critical_alerts) as critical_alerts
        FROM model_metrics
        WHERE metric_date = CURRENT_DATE;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query)
            return cur.fetchone()
    
    # ========== AUDIT & DIAGNOSTICS ==========
    
    def get_transaction_history(self, account_id: str, days: int = 30) -> List[Dict]:
        """Get transaction history for an account"""
        query = """
        SELECT * FROM transactions
        WHERE account_id = %s
          AND timestamp >= NOW() - INTERVAL '%s days'
        ORDER BY timestamp DESC;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, (account_id, days))
            return cur.fetchall()
    
    def verify_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT 1;")
                return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
    
    def check_database_status(self) -> Dict:
        """Get database status information"""
        query = """
        SELECT 
            (SELECT COUNT(*) FROM transactions) as total_transactions,
            (SELECT COUNT(*) FROM alerts WHERE status = 'NEW') as pending_alerts,
            (SELECT COUNT(*) FROM accounts) as total_accounts,
            (SELECT COUNT(*) FROM transactions WHERE ml_processed = false) as unprocessed_transactions;
        """
        
        with self.get_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query)
            return cur.fetchone()


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Initialize database manager
    config = DatabaseConfig(
        dbname="barclays_aml",
        user="barclays_app",
        password="change_me_to_secure_password",
        host="localhost"
    )
    
    db = DatabaseManager(config)
    
    # Test connection
    print("Testing database connection...")
    if db.verify_connection():
        print("✓ Database connection successful!")
    else:
        print("✗ Failed to connect to database")
        exit(1)
    
    # Get status
    print("\nDatabase Status:")
    status = db.check_database_status()
    for key, value in status.items():
        print(f"  {key}: {value}")
    
    # Example: Save a transaction
    print("\nExample: Saving transaction...")
    tx = {
        'transaction_id': 'TXN_TEST_001',
        'account_id': 'ACC_001',
        'from_account': 'ACC_001',
        'to_account': 'ACC_002',
        'timestamp': datetime.now(),
        'amount_received': 5000.00,
        'receiving_currency': 'USD',
        'amount_paid': 5000.00,
        'payment_currency': 'USD',
        'payment_format': 'ACH'
    }
    
    # Note: Uncomment to actually save
    # tx_id = db.save_transaction(tx)
    # print(f"  Saved transaction: {tx_id}")
    
    # Example: Get pending alerts
    print("\nPending Alerts:")
    alerts = db.get_pending_alerts()
    if alerts:
        for alert in alerts[:3]:  # Show first 3
            print(f"  Alert {alert['alert_id']}: Confidence={alert['confidence_score']}, Status={alert['status']}")
    else:
        print("  No pending alerts")
    
    print("\n✓ Database manager is ready to use!")
