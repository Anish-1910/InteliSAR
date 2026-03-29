/**
 * Professional PDF Formatter for 6-Section SAR
 * Creates well-formatted, compliance-ready PDF documents
 */

const PDFDocument = require('pdfkit');

class SARPDFFormatter {
  constructor() {
    this.pageWidth = 612;
    this.pageHeight = 792;
    this.margin = 40;
    this.contentHeight = this.pageHeight - (2 * this.margin) - 60; // Leave room for footer
    this.colors = {
      header: '#1a3a52',
      subheader: '#2e5266',
      accent: '#d4af37',
      text: '#333333',
      light: '#f5f5f5',
      border: '#cccccc',
    };
  }

  /**
   * Generate formatted PDF from SAR content
   */
  generatePDF(sarContent) {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: this.margin,
      bufferPages: true,
    });

    // Draw cover page
    this.drawCoverPage(doc, sarContent);
    
    // Draw TOC on same page or new page depending on space
    this.drawTableOfContents(doc, sarContent);
    
    // Draw all sections efficiently
    this.drawSectionsEfficient(doc, sarContent);
    
    // Add footers to all pages
    this.drawFooter(doc, sarContent);

    return doc;
  }

  /**
   * Draw professional cover page
   */
  drawCoverPage(doc, sarContent) {
    const { margin, pageWidth, pageHeight, colors } = this;

    // Background color
    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.header);

    // Title
    doc.fillColor('white').fontSize(40).font('Helvetica-Bold');
    doc.text('SUSPICIOUS ACTIVITY REPORT', margin, 80, { align: 'center', width: pageWidth - 2 * margin });

    doc.moveDown(0.5);
    doc.fontSize(14).text('(SAR)', { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(12).text('Filing Institution: Barclays Bank PLC', { align: 'center' });
    doc.text('Financial Crimes Enforcement Network (FinCEN)', { align: 'center' });

    doc.moveDown(3);
    doc.fontSize(11).font('Helvetica').text(sarContent.metadata.sar_id, { align: 'center' });
    doc.text(`Filing Date: ${sarContent.metadata.filing_date}`, { align: 'center' });

    doc.moveDown(5);
    doc.fillColor(colors.accent).fontSize(10).text('CONFIDENTIAL - FOR FinCEN FILING ONLY', { align: 'center' });
    doc.text('Do Not Disclose to Customer', { align: 'center' });

    // Always start TOC on new page
    doc.addPage();
  }

  /**
   * Draw table of contents - compact version
   */
  drawTableOfContents(doc, sarContent) {
    const { colors, margin, pageWidth } = this;
    
    // Header
    doc.fillColor(colors.header).fontSize(16).font('Helvetica-Bold');
    doc.text('TABLE OF CONTENTS', { underline: true });
    doc.moveDown(0.5);

    // Divider line
    doc.strokeColor(colors.accent).lineWidth(1)
      .moveTo(margin, doc.y)
      .lineTo(pageWidth - margin, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // Sections list - compact
    doc.fillColor(colors.text).fontSize(11).font('Helvetica');
    const sections = [
      '1. Glossary Code',
      '2. Statement of Suspicion',
      '3. Customer Details',
      '4. Description of Suspicion',
      '5. Core Error/Operation Analysis',
      '6. Summary and Recommendations',
    ];

    sections.forEach(section => {
      doc.text(section, { lineGap: 1 });
    });

    doc.moveDown(1);
  }

  /**
   * Draw all sections efficiently without extra blank pages
   */
  drawSectionsEfficient(doc, sarContent) {
    const { colors, margin, pageWidth, pageHeight, contentHeight } = this;
    
    // Map SAR content to sections
    const sections = [
      {
        num: 1,
        title: 'GLOSSARY CODE',
        content: this.extractContent(sarContent.glossary_code)
      },
      {
        num: 2,
        title: 'STATEMENT OF SUSPICION',
        content: this.extractContent(sarContent.statement_of_suspicion)
      },
      {
        num: 3,
        title: 'CUSTOMER DETAILS',
        content: this.extractContent(sarContent.customer_details)
      },
      {
        num: 4,
        title: 'DESCRIPTION OF SUSPICION',
        content: this.extractContent(sarContent.description_of_suspicion)
      },
      {
        num: 5,
        title: 'CORE ERROR/OPERATION ANALYSIS',
        content: this.extractContent(sarContent.core_operation_analysis)
      },
      {
        num: 6,
        title: 'SUMMARY AND RECOMMENDATIONS',
        content: this.extractContent(sarContent.summary)
      }
    ];

    // Draw sections one by one, only adding pages when really needed
    sections.forEach((section, idx) => {
      // If on page with very little room left, start new page (not for first section on each page)
      if (doc.y > pageHeight - 150 && idx > 0) {
        doc.addPage();
      }

      // Draw section header - compact
      doc.fillColor(colors.subheader).fontSize(11).font('Helvetica-Bold');
      doc.text(`${section.num}. ${section.title}`);
      doc.moveDown(0.15);

      // Thin divider
      doc.strokeColor(colors.border).lineWidth(0.5)
        .moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();
      
      doc.moveDown(0.15);

      // Draw content - smaller font, tight line spacing
      doc.fillColor(colors.text).fontSize(8).font('Helvetica');
      doc.text(section.content, {
        align: 'left',
        width: pageWidth - 2 * margin,
        lineGap: 0.5,
      });

      doc.moveDown(0.25); // Minimal space between sections
    });
  }

  /**
   * Extract content from different possible formats
   */
  extractContent(field) {
    if (!field) return '(No content)';
    if (typeof field === 'string') return field;
    if (field.content && typeof field.content === 'string') return field.content;
    if (typeof field === 'object') {
      try {
        return JSON.stringify(field, null, 2);
      } catch (e) {
        return '(Content parsing error)';
      }
    }
    return '(No content)';
  }

  /**
   * Estimate height needed for content
   */
  estimateContentHeight(doc, text) {
    if (!text) return 0;
    
    // Very rough estimate: 10pt font ~12px, 80 chars per line average
    const lines = text.split('\n').length;
    const avgLineLength = 80;
    const estimatedLines = Math.ceil((text.length / avgLineLength) + lines);
    
    return estimatedLines * 12; // 12px per line at 9pt font
  }

  /**
   * Draw professional footer on all pages
   */
  drawFooter(doc, sarContent) {
    const pages = doc.bufferedPageRange().count;

    for (let i = 1; i <= pages; i++) {
      doc.switchToPage(i - 1);

      const { margin, pageWidth, pageHeight, colors } = this;
      const footerY = pageHeight - 25;

      // Light gray separator line
      doc.strokeColor(colors.border).lineWidth(0.5)
        .moveTo(margin, footerY - 10)
        .lineTo(pageWidth - margin, footerY - 10)
        .stroke();

      // Footer text
      doc.fontSize(8).fillColor(colors.border);
      const footerText = `Page ${i} of ${pages} | ${sarContent.metadata.sar_id}`;
      doc.text(footerText, margin, footerY, { align: 'center', width: pageWidth - 2 * margin });

      // Compliance notice
      doc.fontSize(7).fillColor('#999999');
      doc.text('CONFIDENTIAL - Do Not Disclose to Customer', margin, pageHeight - 12, { 
        align: 'center', 
        width: pageWidth - 2 * margin 
      });
    }
  }

  /**
   * Generate PDF buffer
   */
  async generatePDFBuffer(sarContent) {
    return new Promise((resolve, reject) => {
      const doc = this.generatePDF(sarContent);
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.end();
    });
  }
}

module.exports = SARPDFFormatter;
