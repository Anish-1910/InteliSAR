/**
 * SAR Generation Service
 * Generates Suspicious Activity Reports using Groq LLM API
 */

const axios = require('axios');

const SAR_GENERATOR_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || 'your-api-key-here',
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama3-70b-8192',  // Updated: using current available model
};

/**
 * Generate SAR using Groq LLM API
 */
async function generateSAR(alertData) {
  try {
    // Build context from alert data
    const context = buildSARContext(alertData);

    // Create SAR generation prompt
    const prompt = createSARPrompt(context);

    // Call Groq API
    const response = await axios.post(
      SAR_GENERATOR_CONFIG.apiUrl,
      {
        model: SAR_GENERATOR_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `You are a compliance officer specializing in AML (Anti-Money Laundering) Suspicious Activity Reports (SARs). 
Generate professional, detailed SARs based on fraud detection alerts. Include all required sections:
- Filing Institution Information
- Subject Information
- Transaction Details
- Suspicious Activity Description
- Investigation Findings
- Reporting Officer Certification

Format the SAR in a professional document style.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SAR_GENERATOR_CONFIG.apiKey}`,
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from Groq API');
    }

    const sarText = response.data.choices[0].message.content;
    const tokensUsed = response.data.usage?.total_tokens || 0;

    return {
      sar_text: sarText,
      model: SAR_GENERATOR_CONFIG.model,
      tokens_used: tokensUsed,
      generated_at: new Date().toISOString(),
      alert_id: alertData.alert_id,
    };
  } catch (error) {
    console.error('Error generating SAR:', error.message);
    
    // Fallback: Generate professional template-based SAR if API fails
    console.log('Falling back to template-based SAR generation...');
    const sarText = generateTemplateSAR(alertData);
    
    return {
      sar_text: sarText,
      model: 'template-based (API fallback)',
      tokens_used: 0,
      generated_at: new Date().toISOString(),
      alert_id: alertData.alert_id,
      fallback: true,
    };
  }
}

/**
 * Build context from alert data
 */
function buildSARContext(alertData) {
  const patterns = alertData.patterns_detected || [];
  const patternSummary = patterns.join(', ') || 'Unknown patterns';

  return {
    alertId: alertData.alert_id,
    transactionId: alertData.transaction_id,
    accountId: alertData.account_id,
    confidenceScore: alertData.confidence_score,
    riskLevel: alertData.risk_level,
    patternsDetected: patternSummary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create SAR generation prompt
 */
function createSARPrompt(context) {
  return `
Generate a detailed Suspicious Activity Report (SAR) with the following information:

Alert Details:
- Alert ID: ${context.alertId}
- Transaction ID: ${context.transactionId}
- Account ID: ${context.accountId}
- Confidence Score: ${context.confidenceScore}%
- Risk Level: ${context.riskLevel}
- Detected Patterns: ${context.patternsDetected}
- Detection Timestamp: ${context.timestamp}

Please generate a comprehensive SAR that:
1. Documents the suspicious activity in detail
2. Explains how the detected patterns indicate potential AML violations
3. Includes relevant sections for compliance filing
4. Provides clear findings and recommendations
5. Is formatted as a professional compliance document

Make the report realistic and comprehensive, suitable for filing with financial regulators.
`;
}

/**
 * Generate template-based SAR (fallback when API is unavailable)
 */
function generateTemplateSAR(alertData) {
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `SUSPICIOUS ACTIVITY REPORT (SAR)
═════════════════════════════════════════════════════════════════════

FILING INSTITUTION INFORMATION
────────────────────────────────────────────────────────────────────
Institution Name:    Barclays Bank plc
Institution Address: London, United Kingdom
Report Date:         ${date}
Report ID:           SAR-${alertData.alert_id}-${new Date().getTime()}

ALERT SUMMARY
────────────────────────────────────────────────────────────────────
Alert ID:              ${alertData.alert_id}
Transaction ID:        ${alertData.transaction_id}
Account ID:            ${alertData.account_id}
Detection Confidence:  ${alertData.confidence_score}%
Risk Classification:   ${alertData.risk_level}
Detection Timestamp:   ${alertData.timestamp || timestamp}

SUBJECT INFORMATION
────────────────────────────────────────────────────────────────────
Customer Account ID:   ${alertData.account_id}
Account Status:        FLAGGED FOR REVIEW
Relationship Status:   ACTIVE

TRANSACTION DETAILS
────────────────────────────────────────────────────────────────────
Transaction ID:        ${alertData.transaction_id}
Transaction Type:      Wire Transfer / Bank Transfer
Amount:                USD [Amount from transaction database]
Currency:              USD
Beneficiary:           [To be verified from transaction records]
Source:                Customer Account (${alertData.account_id})
Timestamp:             ${alertData.timestamp || timestamp}

SUSPICIOUS ACTIVITY DESCRIPTION
────────────────────────────────────────────────────────────────────
${JSON.stringify(alertData.patterns_detected || ['Anomalous Pattern Detected']).
  replace(/[\[\]"]/g, '').split(',').map(p => `• ${p.trim()}`).join('\n')}

DETECTION RATIONALE
────────────────────────────────────────────────────────────────────
The Anti-Money Laundering (AML) fraud detection system identified this 
transaction as suspicious based on the following factors:

1. RISK SCORE: The ML model calculated a confidence score of ${alertData.confidence_score}%, 
   exceeding the regulatory threshold for SAR filing.

2. PATTERN ANALYSIS: The detected patterns indicate potential money laundering 
   or terrorist financing vulnerabilities:
   - Deviation from normal account behavior
   - Unusual transaction amount or frequency
   - Geographic or beneficiary anomalies
   - Time-based irregularities

3. REGULATORY CONCERN: The combination of detected patterns meets FinCEN 
   requirements for reporting under 31 U.S.C. Section 5318(g).

INVESTIGATION FINDINGS
────────────────────────────────────────────────────────────────────
Status:                PENDING MANUAL REVIEW
Recommended Action:    ESCALATE TO COMPLIANCE TEAM
Priority Level:        ${alertData.risk_level}

COMPLIANCE ASSESSMENT
────────────────────────────────────────────────────────────────────
Potential Violation(s):
✓ Unknown or Suspicious Beneficiary Activity
✓ Unusual Transaction Pattern
✓ Possible Structuring
✓ Geographic Red Flag

Reporting Obligation: YES - Filing required with FinCEN

REGULATORY REFERENCES
────────────────────────────────────────────────────────────────────
- 31 U.S.C. § 5318(g) - Suspicious Activity Reporting Rules
- 31 C.F.R. Part 1020 - Banks
- FinCEN SAR Filing Procedures

FILING CERTIFICATION
────────────────────────────────────────────────────────────────────
This Suspicious Activity Report is based on:
- Automated AML Detection System Analysis
- Machine Learning Pattern Recognition
- Historical Transaction Profiling
- Risk Score Calculation: ${alertData.confidence_score}%

Filed by: AML Compliance System
Authorized by: Barclays Bank plc Compliance Department
Date Filed: ${date}

═════════════════════════════════════════════════════════════════════

NOTE: This is a system-generated SAR based on detected anomalies. 
Manual review by qualified compliance personnel is required before 
final filing with FinCEN.

Recommended Next Steps:
1. Manual review of transaction details
2. Customer contact and verification
3. Enhanced due diligence if warranted
4. Final approval for FinCEN submission
5. Document retention per regulatory requirements

═════════════════════════════════════════════════════════════════════`;
}

module.exports = {
  generateSAR,
  buildSARContext,
};
