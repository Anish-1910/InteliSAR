/**
 * SAR Generation Service
 * Generates Suspicious Activity Reports using RAG + LLM
 */

const axios = require('axios');
const RAGSystem = require('./rag-system');
const LLMService = require('./llm-service');

// Initialize RAG and LLM systems
const ragSystem = new RAGSystem();
const llmService = new LLMService();

const SAR_GENERATOR_CONFIG = {
  useRAG: process.env.USE_RAG !== 'false',
  useLLM: process.env.USE_LLM !== 'false',
  llmProvider: process.env.LLM_PROVIDER || 'groq',
};

/**
 * Generate SAR using RAG + LLM
 */
async function generateSAR(alertData) {
  try {
    console.log('[SAR] Starting SAR generation for alert:', alertData.alert_id);

    // Step 1: Use RAG to build context
    let ragContext = {};
    let enhancedPrompt = '';

    if (SAR_GENERATOR_CONFIG.useRAG) {
      console.log('[SAR] Building RAG context...');
      ragContext = ragSystem.buildRAGContext(alertData);
      enhancedPrompt = ragSystem.createEnhancedPrompt(alertData, ragContext);
      console.log('[SAR] RAG context built successfully');
    } else {
      enhancedPrompt = createSARPrompt(buildSARContext(alertData));
    }

    // Step 2: Call LLM with enhanced prompt
    let llmResponse = null;
    if (SAR_GENERATOR_CONFIG.useLLM) {
      console.log('[SAR] Calling LLM service...');
      try {
        llmResponse = await llmService.generateText(
          enhancedPrompt,
          'You are a compliance officer specializing in AML Suspicious Activity Reports.'
        );
        console.log('[SAR] LLM generation successful');
      } catch (llmError) {
        console.error('[SAR] LLM generation failed:', llmError.message);
        console.log('[SAR] Falling back to template-based SAR');
        llmResponse = null;
      }
    }

    // Step 3: Return LLM response or fallback to template
    if (llmResponse) {
      return {
        sar_text: llmResponse.text,
        model: llmResponse.model,
        provider: llmResponse.provider,
        tokens_used: llmResponse.tokensUsed,
        generated_at: new Date().toISOString(),
        alert_id: alertData.alert_id,
        ragContext: SAR_GENERATOR_CONFIG.useRAG ? ragContext : null,
        method: 'RAG+LLM',
      };
    } else {
      // Fallback to template
      console.log('[SAR] Using template-based SAR generation');
      const sarText = generateTemplateSAR(alertData, ragContext);
      return {
        sar_text: sarText,
        model: 'template-based',
        provider: 'fallback',
        tokens_used: 0,
        generated_at: new Date().toISOString(),
        alert_id: alertData.alert_id,
        ragContext: SAR_GENERATOR_CONFIG.useRAG ? ragContext : null,
        method: 'Template (Fallback)',
        fallback: true,
      };
    }
  } catch (error) {
    console.error('[SAR] Error generating SAR:', error.message);
    throw error;
  }
}

/**
 * Build context from alert data (legacy)
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
 * Create SAR generation prompt (legacy)
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
 * Generate template-based SAR (fallback when LLM is unavailable)
 */
function generateTemplateSAR(alertData, ragContext = {}) {
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
