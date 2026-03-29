/**
 * Mock SAR Generator
 * Provides mock Suspicious Activity Reports when real services are unavailable
 */

function generateMockSAR(alertData) {
  const alertId = alertData.alert_id || 'UNKNOWN';
  const patterns = Array.isArray(alertData.patterns_detected) 
    ? alertData.patterns_detected 
    : (alertData.patterns_detected ? alertData.patterns_detected.split(',') : []);
  const riskLevel = alertData.risk_level || 'UNKNOWN';
  const confidence = alertData.confidence_score || 0;
  const customer = alertData.customer_name || 'Unknown Customer';
  const amount = alertData.amount || 0;
  const transactionId = alertData.transaction_id || 'N/A';
  const accountId = alertData.account_id || 'N/A';
  
  // Cryptocurrency and Foreign Currency Details
  const currencyType = alertData.currency_type || null;
  const currencyCode = alertData.currency_code || '';
  const amountUSD = alertData.amount_usd || amount;
  const destination = alertData.destination || 'N/A';
  const foreignCountry = alertData.foreign_country || 'Unknown';

  // Build SAR text
  const sarText = `
SUSPICIOUS ACTIVITY REPORT (SAR) - MOCK GENERATION
Generated: ${new Date().toISOString()}
Alert ID: ${alertId}

═══════════════════════════════════════════════════════════════════════════════

I. IDENTIFICATION INFORMATION

Alert ID: ${alertId}
Customer Name: ${customer}
Account Number: ${accountId}
Transaction Reference: ${transactionId}
Report Date: ${new Date().toLocaleDateString()}
Filing Deadline: Due within 30 days of detection

═══════════════════════════════════════════════════════════════════════════════

II. TRANSACTION DETAILS

${currencyType ? `
╔ CRYPTOCURRENCY TRANSACTION ╗
Transaction Type: ${currencyType} (${currencyCode})
Crypto Amount: ${amount} ${currencyCode}
USD Equivalent: $${amountUSD.toLocaleString()}
Destination: ${destination}
Foreign Country: ${foreignCountry}
╚═══════════════════════════╝
` : `Transaction Amount: $${amount.toLocaleString()}\n`}

Patterns Detected: ${patterns.length > 0 ? patterns.join(', ') : 'N/A'}
Confidence Score: ${confidence}%
Risk Level: ${riskLevel}
Transaction Status: Flagged for review

═══════════════════════════════════════════════════════════════════════════════

III. DESCRIPTION OF SUSPICIOUS ACTIVITY

The transaction involving ${customer} (Account: ${accountId}) has been flagged as 
suspicious based on advanced machine learning analysis and behavioral pattern detection.

${currencyType ? `
CRYPTOCURRENCY ANALYSIS:
Transaction Currency: ${currencyType} (${currencyCode})
Amount: ${amount} ${currencyCode} (≈ $${amountUSD.toLocaleString()})
Destination Country: ${foreignCountry}
Destination Details: ${destination}

Critical Factors:
• Cryptocurrency transactions carry heightened AML/CFT risk
• Privacy coins and mixing services increase suspicious activity likelihood
• Transfers to high-risk jurisdictions are red flags
• Ransomware and sanctions evasion commonly use crypto channels
` : `
Key Indicators:
${patterns.map((p, i) => `  ${i + 1}. ${p.replace(/_/g, ' ')}`).join('\n')}

Risk Assessment: ${riskLevel}
Confidence Level: ${confidence}%
`}

═══════════════════════════════════════════════════════════════════════════════

IV. REGULATORY CLASSIFICATION

Money Laundering Indicators: 
  • Potential structuring or layering
  • Unusual transaction patterns
  • Account behavior deviation

Terrorist Financing Indicators:
  • High-risk jurisdictions involved
  • Rapid fund movement patterns
  • Multiple beneficiary involvement

${currencyType ? `
CRYPTOCURRENCY SPECIFIC RISKS:
  • Anonymous or pseudo-anonymous transactions
  • Rapid fund movement capabilities
  • Regulatory arbitrage exploitation
  • Sanctions evasion mechanisms
  • Ransomware/extortion payment channels
  • Cross-border transaction obfuscation
` : ''}

═══════════════════════════════════════════════════════════════════════════════

V. RECOMMENDED ACTIONS

Priority Level: ${getPriorityLevel(confidence)}
Recommended Investigation: Enhanced Due Diligence (EDD)

Next Steps:
  1. Conduct customer interviews
  2. Review transaction records (past 90 days)
  3. Analyze beneficiary verification
  4. Document source of funds
  5. Determine if additional analysis required

═══════════════════════════════════════════════════════════════════════════════

VI. EXAMINER NOTES

This report is generated in MOCK MODE and is for demonstration purposes only.
All data is synthetic and derived from alert parameters.

System Status: Mock Data Mode
Generated Method: Template-based Mock SAR
Data Source: Alert Database (Mock)

═══════════════════════════════════════════════════════════════════════════════

CONFIDENTIAL - FOR OFFICIAL USE ONLY
This report contains sensitive regulatory information.
  `.trim();

  return {
    sar_text: sarText,
    model: 'mock-sar-generator',
    provider: 'mock',
    tokens_used: 0,
    generated_at: new Date().toISOString(),
    alert_id: alertId,
    ragContext: null,
    method: 'Mock Template',
    fallback: true,
    status: 'success',
    customer_name: customer,
    risk_level: riskLevel,
    confidence_score: confidence,
    patterns_detected: patterns,
  };
}

function getPriorityLevel(confidence) {
  if (confidence >= 90) return 'CRITICAL';
  if (confidence >= 75) return 'HIGH';
  if (confidence >= 50) return 'MEDIUM';
  return 'LOW';
}

function generateMockSARVersions(alertId) {
  return [
    {
      version_id: 1,
      alert_id: alertId,
      version_number: 1,
      status: 'active',
      created_at: new Date(Date.now() - 1000 * 60 * 60),
      revision_comment: 'Initial SAR generation',
      investigator_notes: 'Preliminary analysis complete',
      next_review_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  ];
}

module.exports = {
  generateMockSAR,
  getPriorityLevel,
  generateMockSARVersions,
};
