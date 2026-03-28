/**
 * Enhanced SAR Generator v3 with PDF Support
 * Generates Suspicious Activity Reports in multiple formats (Text + PDF)
 */

const RAGSystem = require('./rag-system');
const LLMService = require('./llm-service');
const PDFTemplateService = require('./pdf-template-service');

// Initialize services
const ragSystem = new RAGSystem();
const llmService = new LLMService();
const pdfService = new PDFTemplateService();

const SAR_GENERATOR_CONFIG = {
  useRAG: process.env.USE_RAG !== 'false',
  useLLM: process.env.USE_LLM !== 'false',
  llmProvider: process.env.LLM_PROVIDER || 'groq',
  defaultFormat: process.env.DEFAULT_SAR_FORMAT || 'pdf', // text or pdf
  defaultTemplate: process.env.DEFAULT_SAR_TEMPLATE || 'default',
};

/**
 * Generate SAR in specified format
 */
async function generateSAR(alertData, options = {}) {
  try {
    console.log('[SAR] Starting SAR generation for alert:', alertData.alert_id);

    const format = options.format || SAR_GENERATOR_CONFIG.defaultFormat;
    const templateName = options.templateName || SAR_GENERATOR_CONFIG.defaultTemplate;

    // Build RAG context
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

    // Generate text content via LLM
    let sarText = null;
    let llmResponse = null;

    if (SAR_GENERATOR_CONFIG.useLLM) {
      console.log('[SAR] Calling LLM service for generation...');
      try {
        llmResponse = await llmService.generateText(
          enhancedPrompt,
          'You are a compliance officer specializing in AML Suspicious Activity Reports (SARs). Generate professional, detailed SARs based on fraud detection alerts.'
        );
        sarText = llmResponse.text;
        console.log('[SAR] LLM generation successful');
      } catch (llmError) {
        console.error('[SAR] LLM generation failed:', llmError.message);
        console.log('[SAR] Falling back to template-based text');
        sarText = generateTemplateSAR(alertData, ragContext);
      }
    } else {
      sarText = generateTemplateSAR(alertData, ragContext);
    }

    // Generate PDF if requested
    let pdfBuffer = null;
    if (format === 'pdf') {
      console.log(`[SAR] Generating PDF from template: ${templateName}`);
      try {
        const doc = await pdfService.generatePDFFromTemplate(alertData, templateName);
        pdfBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
          doc.end();
        });
        console.log('[SAR] PDF generation successful');
      } catch (pdfError) {
        console.error('[SAR] PDF generation failed:', pdfError.message);
        pdfBuffer = null;
      }
    }

    // Return result
    const result = {
      sar_text: sarText,
      alert_id: alertData.alert_id,
      format: format,
      template: templateName,
      pdf_generated: pdfBuffer !== null,
      generated_at: new Date().toISOString(),
      method: llmResponse ? 'RAG+LLM' : 'Template (Fallback)',
      provider: llmResponse?.provider || 'fallback',
      model: llmResponse?.model,
      tokens_used: llmResponse?.tokensUsed || 0,
      ragContext: SAR_GENERATOR_CONFIG.useRAG ? ragContext : null,
    };

    // Include PDF buffer if available and requested
    if (pdfBuffer && format === 'pdf') {
      result.pdf_buffer = pdfBuffer;
    }

    return result;
  } catch (error) {
    console.error('[SAR] Error generating SAR:', error.message);
    throw error;
  }
}

/**
 * Generate SAR in text format only
 */
async function generateSARText(alertData) {
  return generateSAR(alertData, { format: 'text' });
}

/**
 * Generate SAR in PDF format
 */
async function generateSARPDF(alertData, templateName = 'default') {
  return generateSAR(alertData, { format: 'pdf', templateName });
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
 * Generate template-based SAR text
 */
function generateTemplateSAR(alertData, ragContext = {}) {
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
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

ALERT SUMMARY
────────────────────────────────────────────────────────────────────
Alert ID:              ${alertData.alert_id}
Transaction ID:        ${alertData.transaction_id}
Account ID:            ${alertData.account_id}
Detection Confidence:  ${alertData.confidence_score}%
Risk Classification:   ${alertData.risk_level}
Detection Timestamp:   ${alertData.timestamp || timestamp}
System Version:        InteliSAR v3.0 (RAG+LLM+PDF)

SUBJECT INFORMATION
────────────────────────────────────────────────────────────────────
Customer Name:         ${alertData.customer_name || 'N/A'}
Customer Account ID:   ${alertData.account_id}
Account Type:          ${alertData.account_type || 'Unknown'}
Account Status:        FLAGGED FOR REVIEW

TRANSACTION DETAILS
────────────────────────────────────────────────────────────────────
Transaction ID:        ${alertData.transaction_id}
Transaction Type:      ${alertData.payment_format || 'Wire Transfer'}
Amount:                ${alertData.amount_received || 'N/A'} ${alertData.receiving_currency || 'USD'}
From Account:          ${alertData.from_account || alertData.account_id}
To Account:            ${alertData.to_account || '[Beneficiary Account]'}
Transaction Date:      ${alertData.timestamp || timestamp}

SUSPICIOUS ACTIVITY DESCRIPTION
────────────────────────────────────────────────────────────────────
${(alertData.patterns_detected || []).map(p => `• ${p}`).join('\n')}

DETECTION METHODOLOGY
────────────────────────────────────────────────────────────────────
The system flagged this alert using advanced ML pattern recognition combined with 
Retrieval-Augmented Generation (RAG) to ensure regulatory compliance.

Confidence Score: ${alertData.confidence_score}%
Risk Level: ${alertData.risk_level}

INVESTIGATION FINDINGS
────────────────────────────────────────────────────────────────────
Status:                PENDING MANUAL REVIEW
Recommended Action:    ESCALATE TO COMPLIANCE TEAM
Priority Level:        ${alertData.risk_level}

REGULATORY REFERENCES
────────────────────────────────────────────────────────────────────
${regulatoryNotes}

FILING CERTIFICATION
────────────────────────────────────────────────────────────────────
Generated by:  InteliSAR v3.0 (AI-Powered Compliance System)
Date Filed:    ${date}
Status:        SYSTEM-GENERATED - REQUIRES MANUAL REVIEW

═════════════════════════════════════════════════════════════════════

NOTE: This is a system-generated SAR. Manual review by qualified compliance 
personnel is REQUIRED before final FinCEN submission.

═════════════════════════════════════════════════════════════════════`;
}

module.exports = {
  generateSAR,
  generateSARText,
  generateSARPDF,
  SAR_GENERATOR_CONFIG,
  pdfService,
};
