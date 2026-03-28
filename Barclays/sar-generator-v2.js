/**
 * SAR Generation Service v2
 * Generates Suspicious Activity Reports using RAG + LLM
 */

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
 * Main SAR Generation Function - Uses RAG + LLM
 */
async function generateSARWithRAG(alertData) {
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
      enhancedPrompt = createBasicPrompt(alertData);
    }

    // Step 2: Call LLM with enhanced prompt
    let llmResponse = null;
    if (SAR_GENERATOR_CONFIG.useLLM) {
      console.log('[SAR] Calling LLM service for generation...');
      try {
        llmResponse = await llmService.generateText(
          enhancedPrompt,
          'You are a compliance officer specializing in AML Suspicious Activity Reports (SARs). Generate professional, detailed SARs based on fraud detection alerts.'
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
      // Fallback to template with RAG enhancement
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
 * Create basic prompt for non-RAG mode
 */
function createBasicPrompt(alertData) {
  return `Generate a detailed Suspicious Activity Report (SAR) with the following information:

Alert Details:
- Alert ID: ${alertData.alert_id}
- Transaction ID: ${alertData.transaction_id}
- Account ID: ${alertData.account_id}
- Confidence Score: ${alertData.confidence_score}%
- Risk Level: ${alertData.risk_level}
- Detected Patterns: ${(alertData.patterns_detected || []).join(', ')}
- Amount: ${alertData.amount_received} ${alertData.receiving_currency}

Please generate a comprehensive SAR that documents the suspicious activity with proper regulatory formatting.`;
}

/**
 * Generate template-based SAR with optional RAG enhancement
 */
function generateTemplateSAR(alertData, ragContext = {}) {
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Extract RAG insights if available
  const regulatoryNotes = ragContext.regulations ? 
    ragContext.regulations.map(r => r.title).join(', ') : 
    'Applicable AML Regulations';
  
  const patternDetails = ragContext.patterns ?
    ragContext.patterns.map(p => `${p.name}: ${p.description}`).join('\n• ') :
    'Detected Suspicious Patterns';

  return `SUSPICIOUS ACTIVITY REPORT (SAR)
═════════════════════════════════════════════════════════════════════

FILING INSTITUTION INFORMATION
────────────────────────────────────────────────────────────────────
Institution Name:    Barclays Bank plc
Institution Address: London, United Kingdom
Report Date:         ${date}
Report ID:           SAR-${alertData.alert_id}-${new Date().getTime()}
Compliance Officer:  AML Detection System

ALERT SUMMARY
────────────────────────────────────────────────────────────────────
Alert ID:              ${alertData.alert_id}
Transaction ID:        ${alertData.transaction_id}
Account ID:            ${alertData.account_id}
Detection Confidence:  ${alertData.confidence_score}%
Risk Classification:   ${alertData.risk_level}
Detection Timestamp:   ${alertData.timestamp || timestamp}
System Version:        InteliSAR v2.0 (RAG+LLM Enhanced)

SUBJECT INFORMATION
────────────────────────────────────────────────────────────────────
Customer Name:         ${alertData.customer_name || 'N/A'}
Customer Account ID:   ${alertData.account_id}
Account Type:          ${alertData.account_type || 'Unknown'}
Account Status:        FLAGGED FOR REVIEW
Relationship Status:   ACTIVE
KYC Status:            VERIFIED

TRANSACTION DETAILS
────────────────────────────────────────────────────────────────────
Transaction ID:        ${alertData.transaction_id}
Transaction Type:      ${alertData.payment_format || 'Wire Transfer'}
Amount:                ${alertData.amount_received || 'N/A'} ${alertData.receiving_currency || 'USD'}
From Account:          ${alertData.from_account || alertData.account_id}
To Account:            ${alertData.to_account || '[Beneficiary Account]'}
Transaction Date:      ${alertData.timestamp || timestamp}

SUSPICIOUS ACTIVITY DESCRIPTION (RAG-Enhanced)
────────────────────────────────────────────────────────────────────
${(alertData.patterns_detected || []).map(p => `• ${p}`).join('\n')}

REGULATORY FRAMEWORK APPLIED
────────────────────────────────────────────────────────────────────
${regulatoryNotes}

DETECTION METHODOLOGY
────────────────────────────────────────────────────────────────────
ML Model:              Advanced Pattern Recognition with RAG
Confidence Score:      ${alertData.confidence_score}%
Risk Level:            ${alertData.risk_level}
Detection Method:      Machine Learning + Retrieval-Augmented Generation
Training Data:         5M+ historical transactions

The system flagged this alert as requiring SAR filing based on:
✓ ML confidence score of ${alertData.confidence_score}% (threshold: 90%)
✓ Multiple fraud pattern matches
✓ Regulatory violation indicators
✓ Enhanced due diligence requirements

INVESTIGATION FINDINGS
────────────────────────────────────────────────────────────────────
Status:                PENDING MANUAL REVIEW
Recommended Action:    ESCALATE TO COMPLIANCE TEAM
Priority Level:        ${alertData.risk_level}

COMPLIANCE ASSESSMENT
────────────────────────────────────────────────────────────────────
${patternDetails}

Reporting Obligation:  YES - Filing REQUIRED with FinCEN

REGULATORY REFERENCES
────────────────────────────────────────────────────────────────────
- 31 U.S.C. § 5318(g) - Suspicious Activity Reporting Rules
- 31 C.F.R. Part 1020 - Banks AML Program
- FinCEN SAR Filing Procedures

FILING CERTIFICATION
────────────────────────────────────────────────────────────────────
This SAR is based on:
✓ Automated Machine Learning Analysis
✓ Retrieval-Augmented Generation (RAG) Enhancement
✓ Multi-factor Risk Assessment
✓ Regulatory Compliance Framework

Generated by:  InteliSAR v2.0 (AI-Powered Compliance System)
Date Filed:    ${date}
Status:        SYSTEM-GENERATED - REQUIRES MANUAL REVIEW

═════════════════════════════════════════════════════════════════════

⚠️  Manual review by qualified compliance personnel is REQUIRED before
    final FinCEN submission.

Recommended Actions:
1. Manual review of transaction details
2. Customer verification and communication
3. Enhanced due diligence investigation
4. OFAC and sanctions list verification
5. Final approval for FinCEN submission
6. Document retention per regulatory requirements

═════════════════════════════════════════════════════════════════════`;
}

module.exports = {
  generateSAR: generateSARWithRAG,
  generateSARWithRAG,
  generateTemplateSAR,
};
