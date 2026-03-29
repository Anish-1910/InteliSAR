/**
 * Mock PDF Generator
 * Creates mock PDF files for SAR documents when real PDF service is unavailable
 */

const Buffer = require('buffer').Buffer;

/**
 * Generate a simple PDF buffer for mock mode
 * Creates a basic text-based PDF for testing
 */
function generateMockPDFBuffer(sarData) {
  try {
    // Create a very basic PDF manually
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 1200 >>
stream
BT
/F1 14 Tf
50 750 Td
(SUSPICIOUS ACTIVITY REPORT - MOCK GENERATION) Tj
0 -30 Td
(Generated: ${new Date().toISOString()}) Tj
0 -30 Td
(Alert ID: ${(sarData.alert_id || 'N/A').substring(0, 50)}) Tj
0 -20 Td
/F1 12 Tf
(Customer: ${(sarData.customer_name || 'Unknown').substring(0, 50)}) Tj
0 -15 Td
(Risk Level: ${(sarData.risk_level || 'N/A').substring(0, 20)}) Tj
0 -15 Td
(Confidence: ${(sarData.confidence_score || 0)}%) Tj
0 -20 Td
/F1 10 Tf
(Patterns Detected:) Tj
0 -15 Td
(${getPatternsText(sarData.patterns_detected)}) Tj
0 -30 Td
/F1 9 Tf
(This is a mock PDF generated in MOCK MODE for demonstration purposes.) Tj
0 -15 Td
(All data is synthetic and for testing only.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000317 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1567
%%EOF`;

    return Buffer.from(pdfContent, 'latin1');
  } catch (error) {
    console.error('Error generating mock PDF:', error);
    throw error;
  }
}

/**
 * Format patterns for PDF display
 */
function getPatternsText(patterns) {
  if (!patterns) return 'No patterns detected';
  if (Array.isArray(patterns)) {
    return patterns.slice(0, 5).map(p => `• ${p.replace(/_/g, ' ')}`).join(' | ');
  }
  return patterns.toString().substring(0, 100);
}

/**
 * Generate mock SAR PDF with enhanced formatting
 */
function generateEnhancedMockPDFBuffer(sarData) {
  try {
    // Create a formatted PDF string with basic structure
    const sarText = sarData.sar_text || buildDefaultSARText(sarData);
    
    // For mock mode, we'll create a simple text representation
    // In production, this would use a library like pdfkit or puppeteer
    const pdfContent = `%PDF-1.3
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /MediaBox [0 0 612 792] /Parent 2 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 2000 >>
stream
BT
/F2 20 Tf
50 750 Td
(Suspicious Activity Report) Tj
/F1 11 Tf
0 -25 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -30 Td
(Alert ID: ${sarData.alert_id || 'N/A'}) Tj
0 -15 Td
(Customer: ${sarData.customer_name || 'Unknown'}) Tj
0 -15 Td
(Risk Level: ${sarData.risk_level} | Confidence: ${sarData.confidence_score}%) Tj
0 -25 Td
/F2 12 Tf
(Summary) Tj
/F1 10 Tf
0 -15 Td
(This Suspicious Activity Report has been generated in MOCK MODE.) Tj
0 -15 Td
(Account: ${sarData.account_id || 'N/A'} | Transaction: ${sarData.transaction_id || 'N/A'}) Tj
0 -15 Td
(Amount: ${sarData.amount ? '$' + sarData.amount.toLocaleString() : 'N/A'}) Tj
0 -25 Td
/F2 12 Tf
(Detected Patterns) Tj
/F1 10 Tf
0 -15 Td
(${Array.isArray(sarData.patterns_detected) ? sarData.patterns_detected.slice(0, 5).map(p => '• ' + p.replace(/_/g, ' ')).join(String.fromCharCode(10)) : 'N/A'}) Tj
0 -30 Td
/F1 8 Tf
(Mock Mode Notice: This PDF has been generated using mock data. All information is for demonstration purposes only.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000002280 00000 n
0000002361 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
2444
%%EOF`;

    return Buffer.from(pdfContent, 'latin1');
  } catch (error) {
    console.error('Error generating enhanced mock PDF:', error);
    return generateMockPDFBuffer(sarData);
  }
}

function buildDefaultSARText(sarData) {
  return `SUSPICIOUS ACTIVITY REPORT\nAlert: ${sarData.alert_id}\nCustomer: ${sarData.customer_name}\nRisk: ${sarData.risk_level}`;
}

module.exports = {
  generateMockPDFBuffer,
  generateEnhancedMockPDFBuffer,
};
