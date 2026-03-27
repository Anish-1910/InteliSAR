"""
ML Service Wrapper - Python Flask Server
This exposes the anomaly detection model as a REST API
for Node.js backend to call
"""

from flask import Flask, request, jsonify
from ml_service_api import MLServiceManager
import json
import traceback
from datetime import datetime

app = Flask(__name__)

# Initialize ML service globally
try:
    manager = MLServiceManager(model_path='trained_model_api.pkl')
    print("✓ ML Service initialized successfully")
except Exception as e:
    print(f"✗ Failed to initialize ML service: {e}")
    manager = None

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if manager:
        return jsonify({
            'status': 'healthy',
            'service': 'ML Anomaly Detection Service',
            'timestamp': datetime.now().isoformat()
        }), 200
    else:
        return jsonify({
            'status': 'unhealthy',
            'error': 'ML service not initialized'
        }), 500


# ============================================================================
# TRANSACTION ANALYSIS
# ============================================================================

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Analyze a transaction and return ML predictions
    
    Input JSON:
    {
        "transaction_id": "TXN_001",
        "account_id": "ACC_001",
        "from_account": "ACC_001",
        "to_account": "ACC_002",
        "timestamp": "2026-03-27T10:30:00",
        "amount_received": 5000.00,
        "receiving_currency": "USD",
        "amount_paid": 5000.00,
        "payment_currency": "USD",
        "payment_format": "ACH"
    }
    
    Returns:
    {
        "transaction_id": "TXN_001",
        "confidence_score": 92,
        "is_suspicious": true,
        "risk_level": "HIGH",
        "patterns_detected": ["Sudden Spike", "Velocity Change"],
        "alert_generated": true
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided'
            }), 400
        
        # Process transaction through ML model
        result = manager.process_transaction_from_db(data)
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Error in predict: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/predict-batch', methods=['POST'])
def predict_batch():
    """
    Analyze multiple transactions in batch
    
    Input JSON:
    {
        "transactions": [
            { transaction 1 },
            { transaction 2 },
            ...
        ]
    }
    
    Returns:
    {
        "results": [
            { prediction 1 },
            { prediction 2 },
            ...
        ],
        "processed": 2,
        "alerts_generated": 1
    }
    """
    try:
        data = request.get_json()
        transactions = data.get('transactions', [])
        
        if not transactions:
            return jsonify({
                'error': 'No transactions provided'
            }), 400
        
        results = []
        alerts_count = 0
        
        for tx in transactions:
            try:
                result = manager.process_transaction_from_db(tx)
                results.append(result)
                if result.get('alert_generated'):
                    alerts_count += 1
            except Exception as e:
                results.append({
                    'transaction_id': tx.get('transaction_id'),
                    'error': str(e)
                })
        
        return jsonify({
            'results': results,
            'processed': len(results),
            'alerts_generated': alerts_count
        }), 200
    
    except Exception as e:
        print(f"Error in predict_batch: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e)
        }), 500


# ============================================================================
# ALERTS MANAGEMENT
# ============================================================================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Get all pending alerts from the ML service queue
    
    Returns:
    {
        "alerts": [
            {
                "alert_id": "ALERT_123",
                "transaction_id": "TXN_001",
                "account_id": "ACC_001",
                "confidence_score": 95,
                "risk_level": "CRITICAL",
                "patterns_detected": [...],
                "timestamp": "2026-03-27T10:30:00"
            },
            ...
        ],
        "total": 5
    }
    """
    try:
        alerts = manager.get_alerts()
        
        return jsonify({
            'alerts': alerts,
            'total': len(alerts)
        }), 200
    
    except Exception as e:
        print(f"Error in get_alerts: {e}")
        return jsonify({
            'error': str(e)
        }), 500


# ============================================================================
# ACCOUNT PROFILE
# ============================================================================

@app.route('/api/account/<account_id>/profile', methods=['GET'])
def get_account_profile(account_id):
    """
    Get account details and transaction history
    
    Returns:
    {
        "account_id": "ACC_001",
        "transaction_count": 45,
        "suspicious_count": 2,
        "high_risk_patterns": [...],
        "recent_transactions": [...]
    }
    """
    try:
        profile = manager.get_account_profile(account_id)
        
        return jsonify(profile), 200
    
    except Exception as e:
        print(f"Error in get_account_profile: {e}")
        return jsonify({
            'error': str(e)
        }), 500


# ============================================================================
# METRICS & MONITORING
# ============================================================================

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """
    Get ML model performance metrics
    
    Returns:
    {
        "model_version": "v1",
        "total_transactions_processed": 10000,
        "total_alerts_generated": 150,
        "avg_processing_time_ms": 12.5,
        "patterns": { pattern counts }
    }
    """
    try:
        metrics = manager.get_model_metrics()
        
        return jsonify(metrics), 200
    
    except Exception as e:
        print(f"Error in get_metrics: {e}")
        return jsonify({
            'error': str(e)
        }), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'path': request.path
    }), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("ML ANOMALY DETECTION SERVICE - REST API")
    print("=" * 80)
    print("\nStarting server on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  POST   /api/predict              - Analyze single transaction")
    print("  POST   /api/predict-batch        - Analyze multiple transactions")
    print("  GET    /api/alerts               - Get pending alerts")
    print("  GET    /api/account/<id>/profile - Get account profile")
    print("  GET    /api/metrics              - Get model metrics")
    print("  GET    /health                   - Health check")
    print("\n" + "=" * 80 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
