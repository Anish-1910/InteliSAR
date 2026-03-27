"""
ML MODEL API SERVICE
====================
Service layer for integrating the anomaly detection model with database backends
Handles real-time transaction processing with 5-second polling

Author: Barclays Hackathon
Version: 1.0
"""

import json
import time
from typing import Dict, List, Optional
from datetime import datetime
from anomaly_detector import AnomalyDetectionModel
import threading
import queue


class TransactionProcessor:
    """Processes transactions and manages polling"""
    
    def __init__(self, model: AnomalyDetectionModel, poll_interval: int = 5):
        """
        Initialize transaction processor
        
        Args:
            model: Trained anomaly detection model
            poll_interval: Polling interval in seconds (default: 5)
        """
        self.model = model
        self.poll_interval = poll_interval
        self.is_running = False
        self.transaction_queue = queue.Queue()
        self.results_queue = queue.Queue()
        self.alert_queue = queue.Queue()
        
    def process_single_transaction(self, transaction: Dict) -> Dict:
        """
        Process a single transaction and return result
        Includes confidence score, boolean flag, and alert generation
        
        Args:
            transaction: {
                'transaction_id': 'txn_123',
                'account_id': 'acc_456',
                'timestamp': '2022-09-01T12:30:00',
                'from_account': 'acc_456',
                'to_account': 'acc_789',
                'amount_received': 5000.00,
                'receiving_currency': 'USD',
                'amount_paid': 5000.00,
                'payment_currency': 'USD',
                'payment_format': 'ACH'
            }
        
        Returns:
            {
                'transaction_id': 'txn_123',
                'account_id': 'acc_456',
                'confidence_score': 45,  # 1-100
                'is_suspicious': False,  # boolean
                'risk_level': 'LOW',
                'alert_generated': False,
                'alert_threshold_breached': False,
                'model_version': 'v1',
                'processing_time_ms': 12.5,
                'top_indicators': ['Pattern 1', 'Pattern 2'],
                'timestamp': '2026-03-27T...'
            }
        """
        start_time = time.time()
        
        try:
            # Get prediction from model
            prediction = self.model.predict(transaction)
            
            # Extract results
            result = {
                'transaction_id': transaction.get('transaction_id', 'unknown'),
                'account_id': prediction['account_id'],
                'confidence_score': prediction['confidence_score'],
                'is_suspicious': prediction['is_suspicious'],
                'risk_level': prediction['risk_level'],
                'alert_generated': prediction['alert_generated'],
                'alert_threshold_breached': prediction['confidence_score'] > 90,
                'model_version': self.model.model_name,
                'processing_time_ms': round((time.time() - start_time) * 1000, 2),
                'top_indicators': prediction.get('top_indicators', []),
                'patterns_detected': prediction.get('patterns_detected', {}),
                'processing_timestamp': datetime.now().isoformat()
            }
            
            # Add to results queue
            self.results_queue.put(result)
            
            # If alert threshold breached, add to alert queue
            if result['alert_threshold_breached']:
                alert = {
                    'alert_id': f"ALT_{result['account_id']}_{int(time.time()*1000)}",
                    'account_id': result['account_id'],
                    'transaction_id': result['transaction_id'],
                    'confidence_score': result['confidence_score'],
                    'risk_level': result['risk_level'],
                    'alert_type': 'HIGH_RISK_TRANSACTION',
                    'priority': 'CRITICAL' if result['confidence_score'] > 95 else 'HIGH',
                    'indicators': result['top_indicators'],
                    'alert_timestamp': datetime.now().isoformat(),
                    'status': 'NEW'
                }
                self.alert_queue.put(alert)
                result['alert_id'] = alert['alert_id']
            
            return result
            
        except Exception as e:
            return {
                'transaction_id': transaction.get('transaction_id', 'unknown'),
                'account_id': transaction.get('account_id', 'unknown'),
                'error': str(e),
                'processing_timestamp': datetime.now().isoformat()
            }
    
    def batch_process_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """Process multiple transactions"""
        return [self.process_single_transaction(tx) for tx in transactions]
    
    def get_pending_alerts(self) -> List[Dict]:
        """Get all pending alerts"""
        alerts = []
        try:
            while not self.alert_queue.empty():
                alerts.append(self.alert_queue.get_nowait())
        except queue.Empty:
            pass
        return alerts
    
    def get_results(self, max_results: int = 10) -> List[Dict]:
        """Get processed results"""
        results = []
        try:
            for _ in range(min(max_results, self.results_queue.qsize())):
                results.append(self.results_queue.get_nowait())
        except queue.Empty:
            pass
        return results


class DatabaseIntegrationAPI:
    """
    API for integrating with PostgreSQL database
    NOTE: This is the interface - actual DB calls will be in backend
    """
    
    def __init__(self, model: AnomalyDetectionModel):
        self.model = model
        self.processor = TransactionProcessor(model)
        
    def process_transaction_for_db(self, transaction_row: Dict) -> Dict:
        """
        Process transaction and prepare for database update
        
        This function is called by the backend to:
        1. Get prediction from ML model
        2. Return structured result
        3. Result is then saved to transaction table
        
        Args:
            transaction_row: Row from database with transaction data
        
        Returns:
            {
                'transaction_id': 'txn_123',
                'confidence_score': 45,
                'is_suspicious': False,
                'alert_id': 'ALT_123' (if alert generated)
            }
        """
        result = self.processor.process_single_transaction(transaction_row)
        
        return {
            'transaction_id': result.get('transaction_id'),
            'confidence_score': result.get('confidence_score', 1),
            'is_suspicious': result.get('is_suspicious', False),
            'risk_level': result.get('risk_level', 'MINIMAL'),
            'alert_id': result.get('alert_id'),
            'processing_timestamp': result.get('processing_timestamp')
        }
    
    def get_alerts_for_ui(self) -> List[Dict]:
        """
        Get alerts to display in React UI
        Called by backend which forwards to frontend
        """
        alerts = self.processor.get_pending_alerts()
        
        return [{
            'id': alert['alert_id'],
            'accountId': alert['account_id'],
            'transactionId': alert['transaction_id'],
            'confidenceScore': alert['confidence_score'],
            'riskLevel': alert['risk_level'],
            'priority': alert['priority'],
            'indicators': alert['indicators'],
            'timestamp': alert['alert_timestamp'],
            'status': alert['status'],
            'actionRequired': True
        } for alert in alerts]
    
    def get_account_history(self, account_id: str) -> Dict:
        """
        Get account history for investigation/UI display
        """
        transactions = self.model.history.get_account_transactions(account_id)
        
        return {
            'account_id': account_id,
            'total_transactions': len(transactions),
            'is_new_account': len(transactions) <= 2,
            'recent_transactions': transactions[-10:],  # Last 10
            'account_info': self.model.history.account_info.get(account_id, {})
        }


class MonitoringService:
    """
    Monitoring and metrics for model performance
    """
    
    def __init__(self):
        self.metrics = {
            'total_transactions_processed': 0,
            'total_alerts_generated': 0,
            'average_confidence_score': 0,
            'high_risk_transactions': 0,
            'processing_times': []
        }
        
    def update_metrics(self, result: Dict):
        """Update metrics after processing"""
        self.metrics['total_transactions_processed'] += 1
        
        if result.get('alert_generated'):
            self.metrics['total_alerts_generated'] += 1
        
        if result.get('risk_level') in ['HIGH', 'CRITICAL']:
            self.metrics['high_risk_transactions'] += 1
        
        self.metrics['processing_times'].append(result.get('processing_time_ms', 0))
        
        # Keep only last 1000 processing times
        if len(self.metrics['processing_times']) > 1000:
            self.metrics['processing_times'] = self.metrics['processing_times'][-1000:]
        
        # Calculate average
        if self.metrics['processing_times']:
            self.metrics['average_processing_time_ms'] = round(
                sum(self.metrics['processing_times']) / len(self.metrics['processing_times']),
                2
            )
    
    def get_metrics(self) -> Dict:
        """Get current metrics"""
        return self.metrics.copy()


class MLServiceManager:
    """
    High-level service manager
    Orchestrates model loading, processing, and integration
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize service manager
        
        Args:
            model_path: Path to saved model pickle file
        """
        self.model = AnomalyDetectionModel()
        
        # Load model if provided
        if model_path:
            self.model.load_model(model_path)
        
        self.db_api = DatabaseIntegrationAPI(self.model)
        self.monitoring = MonitoringService()
    
    def train_model(self, trans_file: str, accounts_file: str, patterns_file: str = None):
        """Train model on historical data"""
        self.model.train(trans_file, accounts_file, patterns_file)
    
    def process_transaction_from_db(self, transaction: Dict) -> Dict:
        """Process transaction from database"""
        result = self.db_api.process_transaction_for_db(transaction)
        self.monitoring.update_metrics(result)
        return result
    
    def get_alerts(self) -> List[Dict]:
        """Get all pending alerts"""
        return self.db_api.get_alerts_for_ui()
    
    def get_account_profile(self, account_id: str) -> Dict:
        """Get account profile and history"""
        return self.db_api.get_account_history(account_id)
    
    def get_model_metrics(self) -> Dict:
        """Get model performance metrics"""
        return self.monitoring.get_metrics()
    
    def save_model(self, filepath: str):
        """Save trained model"""
        self.model.save_model(filepath)


# Example usage with pseudo-database integration
if __name__ == "__main__":
    print("\n" + "="*80)
    print("ML MODEL API SERVICE - INITIALIZATION")
    print("="*80 + "\n")
    
    # Initialize service manager
    manager = MLServiceManager()
    
    # Train model
    print("[1] Training model on historical data...")
    manager.train_model(
        trans_file='dataset/full_IBM_dataset/HI-Small_Trans.csv',
        accounts_file='dataset/full_IBM_dataset/HI-Small_accounts.csv',
        patterns_file='dataset/full_IBM_dataset/HI-Small_Patterns.txt'
    )
    
    # Simulate database records and process
    print("\n[2] Processing sample transactions from database...")
    sample_transactions = [
        {
            'transaction_id': 'TXN_001',
            'account': '8000EBD30',
            'timestamp': '2022-09-01T00:20:00',
            'to_account': '8000EBD30',
            'amount_received': 3697.34,
            'receiving_currency': 'US Dollar',
            'amount_paid': 3697.34,
            'payment_currency': 'US Dollar',
            'payment_format': 'Reinvestment'
        },
        {
            'transaction_id': 'TXN_002',
            'account': '80B779D80',
            'timestamp': '2022-09-01T12:45:00',
            'to_account': '809D86900',
            'amount_received': 150000.00,
            'receiving_currency': 'US Dollar',
            'amount_paid': 149500.00,
            'payment_currency': 'US Dollar',
            'payment_format': 'Wire Transfer'
        }
    ]
    
    results = []
    for tx in sample_transactions:
        result = manager.process_transaction_from_db(tx)
        results.append(result)
        print(f"  ✓ TXN {result['transaction_id']}: "
              f"Confidence={result['confidence_score']}, "
              f"Suspicious={result['is_suspicious']}")
    
    # Get pending alerts
    print("\n[3] Checking for alerts...")
    alerts = manager.get_alerts()
    print(f"  Alerts generated: {len(alerts)}")
    for alert in alerts:
        print(f"    - {alert['id']}: {alert['priority']} - {alert['riskLevel']}")
    
    # Get metrics
    print("\n[4] Model metrics...")
    metrics = manager.get_model_metrics()
    print(f"  Total transactions processed: {metrics['total_transactions_processed']}")
    print(f"  Total alerts: {metrics['total_alerts_generated']}")
    print(f"  Avg processing time: {metrics.get('average_processing_time_ms', 0):.2f}ms")
    
    # Save model
    print("\n[5] Saving trained model...")
    manager.save_model('trained_model_api.pkl')
    
    print("\n" + "="*80)
    print("✓ ML API SERVICE READY FOR INTEGRATION")
    print("="*80 + "\n")
    
    print("INTEGRATION GUIDE:")
    print("-" * 80)
    print("1. Backend receives transaction from PostgreSQL")
    print("2. Backend calls: manager.process_transaction_from_db(transaction)")
    print("3. Returns: confidence_score (1-100) + is_suspicious (boolean)")
    print("4. Backend updates transaction table with these values")
    print("5. If confidence > 90, alert is generated")
    print("6. Frontend polls: manager.get_alerts()")
    print("7. Frontend displays alerts in React UI")
    print("-" * 80)
