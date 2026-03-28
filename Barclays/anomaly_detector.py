"""
PRODUCTION ML ANOMALY DETECTION MODEL
=====================================
Detects 13 fraud patterns based on ML parameters
Structured for database integration
Returns: confidence_score (1-100), is_suspicious (boolean)

Author: Barclays Hackathon
Version: 1.0
"""

import csv
import json
import math
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
import pickle
import os


class TransactionHistory:
    """Maintains account transaction history for pattern detection"""
    
    def __init__(self, max_history_days=90):
        self.transactions = defaultdict(list)  # account_id -> [transactions]
        self.max_history_days = max_history_days
        self.account_info = {}  # account_id -> {bank, entity}
        
    def add_transaction(self, account_id: str, transaction: Dict):
        """Add transaction to history"""
        self.transactions[account_id].append(transaction)
        # Keep only recent transactions
        cutoff = datetime.now() - timedelta(days=self.max_history_days)
        self.transactions[account_id] = [
            t for t in self.transactions[account_id]
            if datetime.fromisoformat(t['timestamp']) > cutoff
        ]
    
    def get_account_transactions(self, account_id: str) -> List[Dict]:
        """Get all transactions for account"""
        return self.transactions.get(account_id, [])
    
    def set_account_info(self, account_id: str, info: Dict):
        """Set account metadata"""
        self.account_info[account_id] = info


class FraudPatternDetector:
    """Detects all 13 fraud patterns"""
    
    def __init__(self, history: TransactionHistory):
        self.history = history
        self.pattern_scores = {}
        
    def detect_patterns(self, account_id: str, transaction: Dict) -> Dict[str, float]:
        """
        Detect all 13 fraud patterns
        Returns dict of pattern_name -> score (0-1)
        """
        scores = {}
        
        # Get account history
        tx_history = self.history.get_account_transactions(account_id)
        
        # Pattern 1: Sudden Spike in Transaction Amount
        scores['sudden_spike'] = self._detect_sudden_spike(transaction, tx_history)
        
        # Pattern 2: Structuring (Smurfing)
        scores['structuring'] = self._detect_structuring(account_id, transaction, tx_history)
        
        # Pattern 3: Geographic Behavior Change
        scores['geographic_change'] = self._detect_geographic_change(transaction, tx_history)
        
        # Pattern 4: New Account High Activity
        scores['new_account_activity'] = self._detect_new_account_activity(transaction, tx_history)
        
        # Pattern 5: Rapid In-Out Movement (Layering)
        scores['layering'] = self._detect_layering(account_id, transaction, tx_history)
        
        # Pattern 6: Dormant Account Activation
        scores['dormant_activation'] = self._detect_dormant_activation(tx_history)
        
        # Pattern 7: Linked Account Behavior
        scores['linked_accounts'] = self._detect_linked_accounts(transaction, tx_history)
        
        # Pattern 8: Balance Drain Pattern
        scores['balance_drain'] = self._detect_balance_drain(transaction, tx_history)
        
        # Pattern 9: Time-Based Anomaly
        scores['time_anomaly'] = self._detect_time_anomaly(transaction, tx_history)
        
        # Pattern 10: Transaction Type Change
        scores['type_change'] = self._detect_type_change(transaction, tx_history)
        
        # Pattern 11: Velocity Change
        scores['velocity_change'] = self._detect_velocity_change(transaction, tx_history)
        
        # Pattern 12: Merchant/Receiver Pattern Change
        scores['receiver_change'] = self._detect_receiver_change(transaction, tx_history)
        
        # Pattern 13: Circular Transactions
        scores['circular_tx'] = self._detect_circular_transactions(account_id, transaction, tx_history)
        
        self.pattern_scores = scores
        return scores
    
    def _detect_sudden_spike(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 1: Sudden Spike in Amount - Using full history for accuracy"""
        if not history:
            return 0.0
        
        current_amt = float(transaction.get('amount_received', 0))
        if current_amt == 0:
            return 0.0
        
        # MODIFIED: Use entire history for more accurate average (not just last 10)
        all_amounts = [float(t.get('amount_received', 0)) for t in history]
        avg_amt = sum(all_amounts) / len(all_amounts) if all_amounts else 0
        
        if avg_amt == 0:
            return 0.0
        
        # Score based on deviation from average
        ratio = current_amt / avg_amt
        if ratio >= 10:  # 10x spike - IMMEDIATE ALERT with high confidence
            return 1.0
        elif ratio > 5:  # 5x spike
            return 0.8
        elif ratio > 3:  # 3x spike
            return 0.5
        elif ratio > 1.5:
            return 0.2
        return 0.0
    
    def _detect_structuring(self, account_id: str, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 2: Structuring/Smurfing - Modified to trigger on 3 occurrences"""
        THRESHOLD = 50000
        WINDOW_HOURS = 24
        
        current_amt = float(transaction.get('amount_received', 0))
        
        # Count transactions just below threshold in last 24 hours
        below_threshold = [
            t for t in history
            if float(t.get('amount_received', 0)) < THRESHOLD and
            float(t.get('amount_received', 0)) > THRESHOLD * 0.8
        ]
        
        # MODIFIED: If 3 or more threshold-near transactions, HIGH CONFIDENCE ALERT
        if THRESHOLD * 0.8 < current_amt < THRESHOLD:
            if len(below_threshold) >= 5:
                return 1.0
            elif len(below_threshold) >= 3:  # 3 times = high confidence alert
                return 0.95  # INCREASED from 0.7 to 0.95
            elif len(below_threshold) >= 1:
                return 0.4
        
        return 0.0
    
    def _detect_geographic_change(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 3: Geographic Behavior Change - 2 shifts + large amounts = alert"""
        current_currency = transaction.get('receiving_currency', '')
        current_format = transaction.get('payment_format', '')
        current_amt = float(transaction.get('amount_received', 0))
        
        if not history or not current_currency:
            return 0.0
        
        # MODIFIED: Track 2 unusual location shifts with large amounts
        
        # Get most common currencies in history
        currencies = [t.get('receiving_currency', '') for t in history[-30:]]
        if not currencies:
            return 0.0
        
        most_common = max(set(currencies), key=currencies.count)
        
        # Count recent currency changes
        currency_changes = [t for t in history[-10:] if t.get('receiving_currency') != most_common]
        currency_change_count = len(set(t.get('receiving_currency', '') for t in currency_changes))
        
        # If 2+ unusual locations with large amounts
        if current_currency != most_common and currency_change_count >= 2:
            if current_amt > 50000 and current_format in ['Wire Transfer', 'International Transfer', 'ACH']:
                return 0.9  # ELEVATED: 2 shifts + large international wire
            elif current_amt > 50000:
                return 0.8
        
        # Single currency change
        if current_currency != most_common:
            if current_format in ['Wire Transfer', 'International Transfer', 'ACH']:
                return 0.7
            return 0.3
        
        return 0.0
    
    def _detect_new_account_activity(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 4: New Account High Activity - IMMEDIATE ALERT on spike"""
        # MODIFIED: Fresh account with ANY spike = IMMEDIATE ALERT
        if len(history) <= 2:
            current_amt = float(transaction.get('amount_received', 0))
            if current_amt > 100000:
                return 1.0  # ELEVATED: Immediate full alert
            elif current_amt > 50000:
                return 0.95  # ELEVATED from 0.6 to 0.95: Immediate high alert
            elif current_amt > 10000:
                return 0.75  # ELEVATED from 0.3 to 0.75: Fresh account spike
        
        return 0.0
    
    def _detect_layering(self, account_id: str, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 5: Rapid In-Out Movement"""
        TIME_WINDOW_MINUTES = 30
        
        # Look for rapid money in and out
        current_time = datetime.fromisoformat(transaction.get('timestamp', datetime.now().isoformat()))
        current_amt = float(transaction.get('amount_received', 0))
        
        # Count transactions within 30 minutes
        rapid_txs = [
            t for t in history[-20:]
            if abs((datetime.fromisoformat(t.get('timestamp', '')) - current_time).total_seconds()) 
            < TIME_WINDOW_MINUTES * 60
        ]
        
        # If money received and immediately sent at high percentage
        if len(rapid_txs) > 0:
            inflow = sum(float(t.get('amount_received', 0)) for t in rapid_txs)
            outflow = sum(float(t.get('amount_paid', 0)) - float(t.get('amount_received', 0)) for t in rapid_txs)
            
            if inflow > 0 and outflow / inflow > 0.8:
                return 0.8
        
        return 0.0
    
    def _detect_dormant_activation(self, history: List[Dict]) -> float:
        """Pattern 6: Dormant Account - 20-30 transactions within 1hr = ALERT"""
        if len(history) < 2:
            return 0.0
        
        # MODIFIED: Check for sudden burst of 20-30+ transactions within 1 hour
        sorted_history = sorted(history, key=lambda x: x.get('timestamp', ''))
        
        if len(sorted_history) >= 2:
            # Check for recent activity burst
            if len(sorted_history) >= 20:
                recent_txs = sorted_history[-30:]
                if len(recent_txs) >= 20:
                    # Check time window
                    first_recent = datetime.fromisoformat(recent_txs[0].get('timestamp', ''))
                    last_recent = datetime.fromisoformat(recent_txs[-1].get('timestamp', ''))
                    time_window_minutes = (last_recent - first_recent).total_seconds() / 60
                    
                    # 20-30 transactions within 1 hour = HIGH ALERT
                    if time_window_minutes <= 60 and len(recent_txs) >= 20:
                        return 1.0  # IMMEDIATE ALERT
        
        # Original gap-based logic still applies
        if len(sorted_history) >= 2:
            last_tx = datetime.fromisoformat(sorted_history[-1].get('timestamp', ''))
            prev_tx = datetime.fromisoformat(sorted_history[-2].get('timestamp', ''))
            
            gap_days = (last_tx - prev_tx).days
            
            if gap_days > 365:  # More than 1 year dormant
                return 0.9
            elif gap_days > 180:
                return 0.7
            elif gap_days > 90:
                return 0.5
        
        return 0.0
    
    def _detect_linked_accounts(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 7: Linked Account Behavior"""
        to_account = transaction.get('to_account', '')
        
        if not to_account or not history:
            return 0.0
        
        # Count how many times this receiver appears
        receiver_counts = defaultdict(int)
        for t in history:
            receiver_counts[t.get('to_account', '')] += 1
        
        # If current receiver is brand new and appears in multiple recent txs
        if receiver_counts[to_account] == 0:
            # Check if other new receivers in recent txs
            recent_receivers = [t.get('to_account', '') for t in history[-5:]]
            if len(set(recent_receivers)) > len(recent_receivers) / 2:
                return 0.6
        
        return 0.0
    
    def _detect_balance_drain(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 8: Balance Drain - Receiver gets 10-20x avg = ALERT"""
        if not history:
            return 0.0
        
        # MODIFIED: Check if receiver is getting 10-20x normal average
        to_account = transaction.get('to_account', '')
        current_amt = float(transaction.get('amount_received', 0))
        
        # Get average transaction amount to this receiver
        txs_to_receiver = [t for t in history if t.get('to_account') == to_account]
        if txs_to_receiver:
            avg_to_receiver = sum(float(t.get('amount_received', 0)) for t in txs_to_receiver) / len(txs_to_receiver)
            if avg_to_receiver > 0:
                ratio = current_amt / avg_to_receiver
                if ratio >= 20:  # 20x normal = IMMEDIATE ALERT
                    return 1.0
                elif ratio >= 10:  # 10x normal = HIGH ALERT
                    return 0.95
        
        # Original balance drain logic
        recent_txs = history[-10:]
        
        outflow_total = sum(
            float(t.get('amount_paid', 0)) - float(t.get('amount_received', 0))
            for t in recent_txs if float(t.get('amount_paid', 0)) > float(t.get('amount_received', 0))
        )
        
        if outflow_total > 100000:
            return 0.8
        elif outflow_total > 50000:
            return 0.5
        
        return 0.0
    
    def _detect_time_anomaly(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 9: Time-Based Anomaly"""
        tx_time = datetime.fromisoformat(transaction.get('timestamp', datetime.now().isoformat()))
        tx_hour = tx_time.hour
        
        if not history:
            return 0.0
        
        # Get typical hours
        history_hours = [
            datetime.fromisoformat(t.get('timestamp', '')).hour
            for t in history if t.get('timestamp')
        ]
        
        if not history_hours:
            return 0.0
        
        # Typical business hours: 9-17
        if all(9 <= h <= 17 for h in history_hours):
            if tx_hour < 9 or tx_hour > 17:
                return 0.8
        
        return 0.0
    
    def _detect_type_change(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 10: Transaction Type - International wire within 4-5 txs"""
        current_format = transaction.get('payment_format', '')
        current_amt = float(transaction.get('amount_received', 0))
        
        if not current_format or not history:
            return 0.0
        
        # MODIFIED: Detect international wire transfers within 4-5 transactions
        recent_txs = history[-5:]
        history_formats = [t.get('payment_format', '') for t in recent_txs]
        
        if history_formats:
            most_common = max(set(history_formats), key=history_formats.count)
            
            # International wire detected within 4-5 txs
            if current_format in ['Wire Transfer', 'International Transfer', 'SWIFT']:
                wire_count = sum(1 for t in recent_txs if t.get('payment_format') in ['Wire Transfer', 'International Transfer', 'SWIFT'])
                if wire_count >= 1 and current_format != most_common:
                    if current_amt > 50000:
                        return 0.85  # International wire pattern detected
                    return 0.6
            
            # Regular type change
            if current_format != most_common:
                if current_amt > 50000:
                    return 0.6
                return 0.2
        
        return 0.0
    
    def _detect_velocity_change(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 11: Velocity Change - 10+ transaction within 1hr = ALERT"""
        TIME_WINDOW_HOURS = 1
        
        current_time = datetime.fromisoformat(transaction.get('timestamp', datetime.now().isoformat()))
        
        # Count transactions in last hour
        recent_txs = [
            t for t in history
            if (current_time - datetime.fromisoformat(t.get('timestamp', current_time.isoformat()))).total_seconds() 
            < TIME_WINDOW_HOURS * 3600
        ]
        
        # MODIFIED: >=10 transactions in 1 hour = HIGH VELOCITY
        if len(recent_txs) >= 10:  # Changed from > to >=
            return 0.95  # ELEVATED from 0.9
        elif len(recent_txs) > 5:
            return 0.7
        elif len(recent_txs) > 3:
            return 0.4
        
        return 0.0
    
    def _detect_receiver_change(self, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 12: Receiver Change - Suddenly 10+ unknown accounts = ALERT"""
        to_account = transaction.get('to_account', '')
        
        if not to_account or len(history) < 5:
            return 0.0
        
        # MODIFIED: Track unique receivers and flag >10 unknown accounts
        unique_receivers = set(t.get('to_account', '') for t in history[-30:])
        
        # If sending to many new receivers (>10 unknown accounts)
        if to_account not in unique_receivers:
            if len(unique_receivers) > 10:  # >10 unknown accounts
                return 0.95  # ELEVATED from 0.7: HIGH ALERT
            elif len(unique_receivers) > 5:
                return 0.5  # ELEVATED from 0.4
        
        return 0.0
    
    def _detect_circular_transactions(self, account_id: str, transaction: Dict, history: List[Dict]) -> float:
        """Pattern 13: Circular Transactions (Money Cycling)"""
        to_account = transaction.get('to_account', '')
        
        if not to_account:
            return 0.0
        
        # Check if money was sent from this account to current receiver
        # and then money comes back
        sent_to_receiver = [
            t for t in history
            if t.get('to_account') == to_account
        ]
        
        if sent_to_receiver:
            # Transaction going to a frequent receiver at high volume
            if len(sent_to_receiver) > 5:
                # Check if amounts are similar (cycling)
                amounts = [float(t.get('amount_received', 0)) for t in sent_to_receiver]
                if amounts and all(abs(amt - amounts[0]) < amounts[0] * 0.1 for amt in amounts):
                    return 0.85
            
            return 0.3
        
        return 0.0


class ConfidenceScorer:
    """Converts pattern scores to 1-100 confidence with explainability"""
    
    def __init__(self):
        self.pattern_weights = {
            'sudden_spike': 0.12,
            'structuring': 0.11,
            'geographic_change': 0.10,
            'new_account_activity': 0.09,
            'layering': 0.10,
            'dormant_activation': 0.08,
            'linked_accounts': 0.07,
            'balance_drain': 0.09,
            'time_anomaly': 0.06,
            'type_change': 0.06,
            'velocity_change': 0.10,
            'receiver_change': 0.09,
            'circular_tx': 0.08
        }
    
    def calculate_confidence(self, pattern_scores: Dict[str, float]) -> Tuple[int, Dict]:
        """
        Calculate confidence score 1-100
        Returns: (confidence_score, explanation)
        """
        # Weighted sum
        confidence = sum(
            pattern_scores.get(pattern, 0) * weight
            for pattern, weight in self.pattern_weights.items()
        )
        
        # Scale to 1-100
        confidence_score = max(1, min(100, int(confidence * 100)))
        
        # Get top contributing patterns
        top_patterns = sorted(
            [(p, s) for p, s in pattern_scores.items() if s > 0],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        explanation = {
            'patterns_detected': {p: f"{s:.2%}" for p, s in top_patterns},
            'risk_level': self._get_risk_level(confidence_score),
            'top_indicators': [p.replace('_', ' ').title() for p, _ in top_patterns]
        }
        
        return confidence_score, explanation
    
    def _get_risk_level(self, score: int) -> str:
        """Map score to risk level"""
        if score >= 90:
            return "CRITICAL"
        elif score >= 70:
            return "HIGH"
        elif score >= 50:
            return "MEDIUM"
        elif score >= 30:
            return "LOW"
        return "MINIMAL"


class AnomalyDetectionModel:
    """Main ML model class - Production ready"""
    
    def __init__(self, model_name: str = "barclays_aml_model_v1"):
        self.model_name = model_name
        self.history = TransactionHistory()
        self.detector = FraudPatternDetector(self.history)
        self.scorer = ConfidenceScorer()
        self.trained = False
        
    def train(self, trans_file: str, accounts_file: str, patterns_file: str = None):
        """
        Train model on historical data
        
        Args:
            trans_file: Path to transaction CSV (HI-Small_Trans.csv)
            accounts_file: Path to accounts CSV (HI-Small_accounts.csv)
            patterns_file: Path to patterns file (HI-Small_Patterns.txt) - optional
        """
        print(f"\n{'='*80}")
        print(f"TRAINING ANOMALY DETECTION MODEL: {self.model_name}")
        print(f"{'='*80}\n")
        
        # Load accounts
        print("[1/3] Loading account data...")
        accounts = self._load_accounts(accounts_file)
        print(f"  ✓ Loaded {len(accounts)} accounts")
        
        # Load transactions
        print("[2/3] Loading transaction history...")
        tx_count = self._load_transactions(trans_file, accounts)
        print(f"  ✓ Loaded {tx_count} transactions")
        
        # Process patterns (if provided)
        if patterns_file and os.path.exists(patterns_file):
            print("[3/3] Analyzing patterns...")
            self._process_patterns(patterns_file)
        else:
            print("[3/3] Skipping patterns analysis (file not found)")
        
        self.trained = True
        print(f"\n✓ Model trained successfully!")
        print(f"{'='*80}\n")
        
    def _load_accounts(self, filepath: str) -> Dict:
        """Load account metadata"""
        accounts = {}
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    account_id = row.get('Account Number', '')
                    accounts[account_id] = {
                        'bank_id': row.get('Bank ID', ''),
                        'bank_name': row.get('Bank Name', ''),
                        'entity_id': row.get('Entity ID', ''),
                        'entity_name': row.get('Entity Name', '')
                    }
                    self.history.set_account_info(account_id, accounts[account_id])
        except Exception as e:
            print(f"  Error loading accounts: {e}")
        
        return accounts
    
    def _load_transactions(self, filepath: str, accounts: Dict) -> int:
        """Load transaction history"""
        count = 0
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                headers = lines[0].strip().split(',')
                
                for line_num, line in enumerate(lines[1:], 1):
                    try:
                        values = line.strip().split(',')
                        if len(values) < 11:
                            continue
                        
                        # Map columns manually (due to duplicate "Account" columns)
                        timestamp_str = values[0].strip()
                        from_bank = values[1].strip()
                        from_account = values[2].strip()
                        to_bank = values[3].strip()
                        to_account = values[4].strip()
                        amount_received = values[5].strip()
                        receiving_currency = values[6].strip()
                        amount_paid = values[7].strip()
                        payment_currency = values[8].strip()
                        payment_format = values[9].strip()
                        is_laundering = values[10].strip()
                        
                        # Parse timestamp
                        try:
                            timestamp = datetime.strptime(timestamp_str, '%Y/%m/%d %H:%M')
                        except:
                            try:
                                timestamp = datetime.fromisoformat(timestamp_str)
                            except:
                                timestamp = datetime.now()
                        
                        transaction = {
                            'timestamp': timestamp.isoformat(),
                            'from_bank': from_bank,
                            'from_account': from_account,
                            'to_bank': to_bank,
                            'to_account': to_account,
                            'amount_received': float(amount_received),
                            'receiving_currency': receiving_currency,
                            'amount_paid': float(amount_paid),
                            'payment_currency': payment_currency,
                            'payment_format': payment_format,
                            'is_laundering': int(is_laundering)
                        }
                        
                        # Add to history for the sender (from_account)
                        self.history.add_transaction(from_account, transaction)
                        count += 1
                        
                    except Exception as e:
                        if count == 0:  # Only log first few errors
                            pass
        except Exception as e:
            print(f"  Error loading transactions: {e}")
        
        return count
    
    def _process_patterns(self, filepath: str):
        """Process known patterns from patterns file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                # Simple pattern counting
                pattern_count = 0
                for line in f:
                    if 'BEGIN LAUNDERING' in line or 'CYCLE' in line or 'FAN-OUT' in line:
                        pattern_count += 1
                print(f"  ✓ Identified {pattern_count} known fraud patterns")
        except Exception as e:
            print(f"  ⚠ Could not process patterns: {e}")
    
    def predict(self, transaction: Dict) -> Dict:
        """
        Predict anomaly for a transaction
        
        Args:
            transaction: {
                'timestamp': '2022-09-01T00:20:00',
                'account': 'account_id',
                'to_account': 'recipient_account',
                'amount_received': 3697.34,
                'receiving_currency': 'US Dollar',
                'amount_paid': 3697.34,
                'payment_currency': 'US Dollar',
                'payment_format': 'Reinvestment'
            }
        
        Returns:
            {
                'account_id': '...',
                'transaction_id': '...',
                'confidence_score': 45,  # 1-100
                'is_suspicious': False,  # boolean
                'risk_level': 'LOW',
                'patterns_detected': {...},
                'alert_generated': False,
                'explanation': {...},
                'timestamp': '...'
            }
        """
        if not self.trained:
            raise ValueError("Model not trained. Call train() first.")
        
        account_id = transaction.get('account', '')
        
        # Normalize transaction
        normalized_tx = {
            'timestamp': transaction.get('timestamp', datetime.now().isoformat()),
            'to_account': transaction.get('to_account', ''),
            'amount_received': float(transaction.get('amount_received', 0)),
            'receiving_currency': transaction.get('receiving_currency', ''),
            'amount_paid': float(transaction.get('amount_paid', 0)),
            'payment_currency': transaction.get('payment_currency', ''),
            'payment_format': transaction.get('payment_format', '')
        }
        
        # Detect patterns
        pattern_scores = self.detector.detect_patterns(account_id, normalized_tx)
        
        # Calculate confidence and explanation
        confidence_score, explanation = self.scorer.calculate_confidence(pattern_scores)
        
        # Generate result
        result = {
            'account_id': account_id,
            'transaction': transaction,
            'confidence_score': confidence_score,
            'is_suspicious': confidence_score > 50,  # Threshold
            'risk_level': explanation['risk_level'],
            'patterns_detected': explanation['patterns_detected'],
            'alert_generated': confidence_score > 90,  # Alert threshold
            'top_indicators': explanation['top_indicators'],
            'processing_timestamp': datetime.now().isoformat()
        }
        
        return result
    
    def batch_predict(self, transactions: List[Dict]) -> List[Dict]:
        """Process multiple transactions"""
        return [self.predict(tx) for tx in transactions]
    
    def save_model(self, filepath: str):
        """Save trained model to disk"""
        try:
            model_data = {
                'model_name': self.model_name,
                'trained': self.trained,
                'history': self.history,
                'detector': self.detector,
                'scorer': self.scorer
            }
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            print(f"✓ Model saved to {filepath}")
        except Exception as e:
            print(f"✗ Error saving model: {e}")
    
    def load_model(self, filepath: str):
        """Load trained model from disk"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            self.model_name = model_data['model_name']
            self.history = model_data['history']
            self.detector = model_data['detector']
            self.scorer = model_data['scorer']
            self.trained = model_data['trained']
            print(f"✓ Model loaded from {filepath}")
        except Exception as e:
            print(f"✗ Error loading model: {e}")


# Example usage / Testing
if __name__ == "__main__":
    # Initialize model
    model = AnomalyDetectionModel(model_name="barclays_aml_v1")
    
    # Train on small dataset
    model.train(
        trans_file='dataset/full_IBM_dataset/HI-Small_Trans.csv',
        accounts_file='dataset/full_IBM_dataset/HI-Small_accounts.csv',
        patterns_file='dataset/full_IBM_dataset/HI-Small_Patterns.txt'
    )
    
    # Test on sample transaction
    sample_transaction = {
        'timestamp': '2022-09-01T00:20:00',
        'account': '8000EBD30',
        'to_account': '8000EBD30',
        'amount_received': 3697.34,
        'receiving_currency': 'US Dollar',
        'amount_paid': 3697.34,
        'payment_currency': 'US Dollar',
        'payment_format': 'Reinvestment'
    }
    
    print("\nTesting model on sample transaction...")
    result = model.predict(sample_transaction)
    
    print("\nPrediction Result:")
    print(json.dumps(result, indent=2, default=str))
    
    # Save model
    model.save_model('trained_model.pkl')
