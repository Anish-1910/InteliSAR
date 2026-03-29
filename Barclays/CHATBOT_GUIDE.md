# AML Compliance Chatbot - Features & Usage Guide

## Overview

The AML Compliance Chatbot is an intelligent assistant integrated into the InteliSAR system that helps compliance officers and investigators understand alerts, analyze risks, and ensure regulatory compliance. It uses Retrieval-Augmented Generation (RAG) to provide contextual, regulation-aware responses.

## Key Features

### 1. **Interactive Q&A with RAG**
- Ask natural language questions about suspicious activities
- Get contextual responses based on alert data and compliance regulations
- Automatic confidence scoring for all responses
- Sources provided for all recommendations

### 2. **Risk Analysis**
- One-click risk profile analysis for alerts
- Breakdown of transaction patterns, behavioral flags, and regulatory concerns
- Risk score components displayed with detailed explanation
- Customized recommendations based on detected risk factors

### 3. **Compliance Checking**
- Automated compliance rule validation
- AML guidelines verification
- Counter-terrorism funding (CTF) checks
- Know Your Customer (KYC) compliance verification
- Sanctions screening recommendations

### 4. **Red Flag Detection**
- Identifies suspicious transaction patterns:
  - Large transaction amounts
  - Cross-currency exchanges
  - Late-night or weekend activity
  - Rapid succession transactions
  - Multiple jurisdictions
  - Pattern mismatches

## API Endpoints

### POST /api/chatbot/ask
Interactive chatbot with RAG capabilities

**Request:**
```json
{
  "message": "Why was this alert generated?",
  "alertId": "ALERT_1234_abc123",
  "sectionContext": null
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Why was this alert generated?",
  "response": "This alert was triggered due to several suspicious indicators: Pattern detection identified: unusual_amount_pattern, cross_currency_exchange. The confidence score of 87.5% indicates significant suspicion levels...",
  "confidence": 0.85,
  "sources": ["Transaction data", "ML Model", "Pattern Analysis"],
  "recommendations": ["Complete KYC/CDD verification", "Document investigation findings", "File SAR if criteria met"],
  "follow_up_questions": ["What actions should I take?", "What is the compliance requirement?"],
  "alert_id": "ALERT_1234_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/chatbot/analyze-risk
Perform comprehensive risk analysis on alert data

**Request:**
```json
{
  "alertData": {
    "alert_id": "ALERT_1234_abc123",
    "confidence_score": 87.5,
    "risk_level": "HIGH",
    "amount_received": 250000,
    "receiving_currency": "USD",
    "payment_currency": "EUR",
    "country": "Unknown"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "alert_id": "ALERT_1234_abc123",
  "risk_analysis": {
    "transaction_pattern": ["Large transaction amount", "Cross-currency exchange"],
    "behavioral_flags": ["Late-night transaction"],
    "regulatory_concerns": ["High confidence suspicious activity"],
    "risk_score_breakdown": {
      "ml_model_score": 87.5,
      "transaction_factors": 30,
      "behavioral_factors": 20,
      "regulatory_factors": 25
    }
  },
  "summary": "This account presents a HIGH risk profile. The transaction was flagged due to Large transaction amount and Cross-currency exchange. Recommend immediate investigation.",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/chatbot/compliance-check
Check alert against compliance rules and regulations

**Request:**
```json
{
  "alertData": {
    "alert_id": "ALERT_1234_abc123",
    "amount_received": 250000,
    "receiving_currency": "USD",
    "payment_currency": "EUR",
    "confidence_score": 87.5,
    "country": "CN"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "alert_id": "ALERT_1234_abc123",
  "compliance_rules": {
    "aml": {
      "high_value_transaction": true,
      "rapid_succession": false,
      "multiple_currencies": true,
      "high_risk_jurisdiction": true
    },
    "ctf": {
      "counter_terrorism_check": false,
      "sanctions_screening": false
    },
    "kyc": {
      "kyc_complete": true,
      "profile_mismatch": false,
      "edd_required": true
    }
  },
  "findings": [
    "High-value transaction detected (>$100k)",
    "Cross-currency transaction requires verification",
    "Transaction involves high-risk jurisdiction",
    "Enhanced Due Diligence (EDD) required"
  ],
  "compliance_risk": "HIGH",
  "required_actions": [
    "Perform OFAC/sanctions screening",
    "File STR if applicable",
    "Perform enhanced due diligence",
    "Update customer profile"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Usage Examples

### Example 1: Understanding an Alert
**User Question:** "Why was this alert generated?"

**Chatbot Response:**
```
This alert was triggered due to several suspicious indicators:
Pattern detection identified: Large transaction amount, Cross-currency exchange.
The confidence score of 87.5% indicates significant suspicion levels.
This is based on the transaction from ACC_5678 to ACC_9012 on 1/15/2024
for $250,000 USD.
```

### Example 2: Compliance Requirements
**User Question:** "What are the compliance requirements?"

**Chatbot Response:**
```
AML Compliance Framework:
• You must establish and maintain programs to detect and report suspicious activity
• Know Your Customer (KYC) requirements are mandatory
• Transactions must be monitored for unusual patterns
• SARs must be filed timely for confirmed suspicious activities
• Enhanced Due Diligence (EDD) required for high-risk customers
• Records must be maintained for at least 5 years
```

### Example 3: Red Flag Indicators
**User Question:** "What are red flags I should look for?"

**Chatbot Response:**
```
Red Flags and Suspicious Patterns:
1. Unusual transaction patterns
2. Multiple rapid transactions
3. Structuring (smurfing) activities
4. Transactions with high-risk countries
5. Mismatched customer profile
6. Round-amount transactions
7. Late-night or weekend activity
```

## Frontend Integration

### Using the Chatbot Component in React

```jsx
import Chatbot from './components/Chatbot';

function AlertDetails() {
  const alertId = "ALERT_1234_abc123";
  const alertData = {
    alert_id: alertId,
    // ... other alert fields
  };

  return (
    <div>
      <h1>Alert Details</h1>
      {/* Chatbot will handle all API calls and RAG internally */}
      <Chatbot alertId={alertId} alertData={alertData} />
    </div>
  );
}
```

### Chatbot Props

| Prop | Type | Description |
|------|------|-------------|
| `alertId` | string | Alert ID to provide context for queries |
| `alertData` | object | Full alert object for risk analysis and compliance checking |

### Chatbot Features in UI

1. **Quick Questions**: Suggested follow-up questions appear after each response
2. **Action Buttons**: "Analyze Risk" and "Compliance Check" buttons for one-click analysis
3. **Confidence Badges**: Shows confidence level of each response
4. **Sources**: Lists data sources used to generate each response
5. **Recommendations**: Provides actionable next steps

## Supported Question Types

### Pattern Questions
- "What patterns were detected?"
- "What red flags should I be aware of?"
- "Are there any suspicious indicators?"

### Risk Questions
- "What is the risk level?"
- "Why is the confidence score so high?"
- "What factors contributed to this alert?"

### Action Questions
- "What should I do next?"
- "How should I investigate this?"
- "What actions are required?"

### Compliance Questions
- "What are the AML requirements?"
- "Is this transaction compliant?"
- "What regulations apply?"

### Due Diligence Questions
- "Do we need EDD for this customer?"
- "What KYC checks are needed?"
- "Are sanctions screening required?"

## Backend Implementation Details

### RAG Context Structure

```javascript
const ragContext = {
  alert_data: {
    alert_id: "",
    transaction_id: "",
    account_id: "",
    confidence_score: 0,
    risk_level: "",
    patterns_detected: [],
    // ... other fields
  },
  sar_content: "", // SAR text if available
  regulations: {
    aml_principles: [...],
    red_flags: [...]
  }
};
```

### Helper Functions

1. **identifyTransactionPatterns()**: Extracts transaction-based risk factors
2. **identifyBehavioralFlags()**: Detects behavioral indicators (timing, etc.)
3. **identifyRegulatoryFlags()**: Maps to regulatory requirements
4. **calculateRiskBreakdown()**: Provides risk score components
5. **checkHighRiskJurisdiction()**: Validates jurisdiction risk level
6. **performSanctionsCheck()**: Sanctions screening
7. **detectProfileMismatch()**: KYC profile validation

## Error Handling

### Common Errors

**400 Bad Request**: Missing required parameters
```json
{
  "error": "message is required"
}
```

**404 Not Found**: Alert not found in database
```json
{
  "error": "Alert not found"
}
```

**500 Server Error**: Processing failed
```json
{
  "error": "Chatbot error",
  "message": "Error details..."
}
```

## Performance Considerations

- **Response Time**: < 2 seconds for typical queries
- **Context Window**: Supports up to 10,000 tokens of alert data
- **Confidence Scoring**: Dynamically adjusted based on data completeness
- **Rate Limiting**: Recommended 10 requests/second per user

## Security & Privacy

- All alert data stays within the organization
- No external API calls for sensitive data
- Input validation on all user messages
- SQL injection prevention via parameterized queries
- CORS protection enabled

## Future Enhancements

1. **Multi-language Support**: Support for Spanish, German, French, Mandarin
2. **Custom Training**: Fine-tune LLM on organization-specific regulations
3. **Integration with External APIs**: FinCEN, OFAC, sanctions lists
4. **Audit Trail**: Log all chatbot interactions for compliance
5. **Machine Learning Feedback**: Improve responses based on user feedback
6. **Advanced Analytics**: Aggregate chatbot usage patterns for insights

## Support & Troubleshooting

### Chatbot Not Responding
1. Check MongoDB connection
2. Verify alert ID exists in database
3. Check server logs for errors
4. Ensure correct CORS headers

### Slow Responses
1. Check network latency
2. Verify database query performance
3. Check server CPU/memory usage
4. Reduce alert data complexity

### Inaccurate Recommendations
1. Ensure alert data is complete
2. Verify confidence thresholds are appropriate
3. Check regulatory database is up-to-date
4. Validate risk scoring logic

## Contact & Support

For issues or questions about the chatbot:
- Check server logs: `tail -f logs/server.log`
- Test API directly: `curl localhost:3001/health`
- Check database connection: Monitor MongoDB dashboard

---

**Last Updated:** January 2024
**Version:** 1.0
**Status:** Production Ready
