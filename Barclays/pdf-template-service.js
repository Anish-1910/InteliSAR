/**
 * PDF Template Management Service
 * Handles PDF template storage, parsing, and dynamic SAR generation
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFTemplateService {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'sar_templates');
    this.ensureTemplatesDirectory();
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Ensure templates directory exists
   */
  ensureTemplatesDirectory() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
      console.log(`[PDF] Templates directory created: ${this.templatesDir}`);
    }
  }

  /**
   * Load all templates from disk
   */
  loadTemplates() {
    try {
      if (fs.existsSync(this.templatesDir)) {
        const files = fs.readdirSync(this.templatesDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const templateName = file.replace('.json', '');
            const templatePath = path.join(this.templatesDir, file);
            const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
            this.templates.set(templateName, templateData);
            console.log(`[PDF] Loaded template: ${templateName}`);
          }
        });
      }
    } catch (error) {
      console.error('[PDF] Error loading templates:', error.message);
    }
  }

  /**
   * Save template to disk
   */
  saveTemplate(templateName, templateData) {
    const templatePath = path.join(this.templatesDir, `${templateName}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(templateData, null, 2));
    this.templates.set(templateName, templateData);
    console.log(`[PDF] Saved template: ${templateName}`);
  }

  /**
   * Get template by name
   */
  getTemplate(templateName) {
    return this.templates.get(templateName) || this.getDefaultTemplate();
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return Array.from(this.templates.entries()).map(([name, data]) => ({
      name,
      version: data.version,
      createdAt: data.createdAt,
      sections: data.sections.length,
    }));
  }

  /**
   * Delete template
   */
  deleteTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, `${templateName}.json`);
    if (fs.existsSync(templatePath)) {
      fs.unlinkSync(templatePath);
      this.templates.delete(templateName);
      console.log(`[PDF] Deleted template: ${templateName}`);
      return true;
    }
    return false;
  }

  /**
   * Create default SAR template
   */
  getDefaultTemplate() {
    return {
      name: 'Default SAR Template',
      version: '1.0',
      createdAt: new Date().toISOString(),
      pageSetup: {
        size: 'LETTER',
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
        fontSize: 10,
        fontFamily: 'Helvetica'
      },
      sections: [
        {
          type: 'header',
          title: 'SUSPICIOUS ACTIVITY REPORT (SAR)',
          subtitle: 'FinCEN Form 111 - Confidential',
          centered: true
        },
        {
          type: 'section',
          title: 'FILING INSTITUTION INFORMATION',
          fields: [
            { label: 'Institution Name', key: 'institution_name', width: 0.5 },
            { label: 'Routing Number', key: 'routing_number', width: 0.5 },
            { label: 'Address', key: 'institution_address', width: 1 },
            { label: 'Report Date', key: 'report_date', width: 0.5 }
          ]
        },
        {
          type: 'section',
          title: 'ALERT SUMMARY',
          fields: [
            { label: 'Alert ID', key: 'alert_id', width: 0.3 },
            { label: 'Transaction ID', key: 'transaction_id', width: 0.35 },
            { label: 'Account ID', key: 'account_id', width: 0.35 },
            { label: 'Confidence Score', key: 'confidence_score', width: 0.3 },
            { label: 'Risk Level', key: 'risk_level', width: 0.35 }
          ]
        },
        {
          type: 'section',
          title: 'SUBJECT INFORMATION',
          fields: [
            { label: 'Customer Name', key: 'customer_name', width: 1 },
            { label: 'Account Type', key: 'account_type', width: 0.5 },
            { label: 'Account Status', key: 'account_status', width: 0.5 }
          ]
        },
        {
          type: 'section',
          title: 'TRANSACTION DETAILS',
          fields: [
            { label: 'Amount', key: 'amount_received', width: 0.3 },
            { label: 'Currency', key: 'receiving_currency', width: 0.2 },
            { label: 'Transaction Type', key: 'payment_format', width: 0.5 },
            { label: 'From Account', key: 'from_account', width: 0.5 },
            { label: 'To Account', key: 'to_account', width: 0.5 },
            { label: 'Timestamp', key: 'timestamp', width: 1 }
          ]
        },
        {
          type: 'section',
          title: 'SUSPICIOUS ACTIVITY DESCRIPTION',
          fields: [
            { label: 'Patterns Detected', key: 'patterns_detected', width: 1, multiline: true }
          ]
        },
        {
          type: 'section',
          title: 'INVESTIGATION FINDINGS',
          fields: [
            { label: 'Status', key: 'investigation_status', width: 0.5 },
            { label: 'Priority Level', key: 'priority_level', width: 0.5 },
            { label: 'Findings', key: 'investigation_findings', width: 1, multiline: true }
          ]
        },
        {
          type: 'section',
          title: 'REGULATORY REFERENCES',
          fields: [
            { label: 'Applicable Regulations', key: 'regulatory_references', width: 1, multiline: true }
          ]
        },
        {
          type: 'section',
          title: 'FILING CERTIFICATION',
          fields: [
            { label: 'Generated By', key: 'generated_by', width: 1 },
            { label: 'Date Filed', key: 'date_filed', width: 0.5 },
            { label: 'Status', key: 'filing_status', width: 0.5 }
          ]
        }
      ]
    };
  }

  /**
   * Parse and extract fields from an existing PDF template
   */
  extractTemplateFromPDF(pdfBuffer) {
    // This would require a PDF parsing library
    // For now, return a structured template that can be manually adjusted
    const template = this.getDefaultTemplate();
    console.log('[PDF] PDF parsing - using default template structure');
    return template;
  }

  /**
   * Generate PDF from template and data
   */
  async generatePDFFromTemplate(alertData, templateName = 'default') {
    try {
      const template = this.getTemplate(templateName);
      const doc = new PDFDocument(template.pageSetup);

      // Generate PDF content based on template
      await this.renderTemplate(doc, template, alertData);

      return doc;
    } catch (error) {
      console.error('[PDF] Error generating PDF:', error.message);
      throw error;
    }
  }

  /**
   * Render template sections to PDF document
   */
  async renderTemplate(doc, template, alertData) {
    const pageSetup = template.pageSetup || {};
    doc.fontSize(pageSetup.fontSize || 10);
    doc.font(pageSetup.fontFamily || 'Helvetica');

    // Render each section
    for (const section of template.sections) {
      switch (section.type) {
        case 'header':
          this.renderHeader(doc, section);
          doc.moveDown(0.5);
          break;

        case 'section':
          this.renderSection(doc, section, alertData);
          doc.moveDown(0.5);
          break;

        case 'spacer':
          doc.moveDown(section.lines || 1);
          break;
      }

      // Check if we need to add a new page
      if (doc.y > doc.page.height - 50) {
        doc.addPage();
      }
    }
  }

  /**
   * Render header section
   */
  renderHeader(doc, section) {
    if (section.title) {
      doc.fontSize(16).font('Helvetica-Bold');
      if (section.centered) {
        doc.text(section.title, { align: 'center' });
      } else {
        doc.text(section.title);
      }
    }

    if (section.subtitle) {
      doc.fontSize(10).font('Helvetica-Oblique');
      if (section.centered) {
        doc.text(section.subtitle, { align: 'center' });
      } else {
        doc.text(section.subtitle);
      }
    }

    doc.fontSize(10).font('Helvetica');
  }

  /**
   * Render content section
   */
  renderSection(doc, section, alertData) {
    // Section title
    if (section.title) {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(section.title);
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.3);
    }

    // Section fields
    doc.fontSize(10).font('Helvetica');

    if (section.fields) {
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      let currentX = doc.page.margins.left;
      let currentY = doc.y;
      const lineHeight = 20;

      for (const field of section.fields) {
        const fieldWidth = pageWidth * (field.width || 1);
        const value = this.getFieldValue(alertData, field.key);

        // Label
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(field.label + ':', currentX, currentY, { width: fieldWidth });

        // Value
        doc.fontSize(9).font('Helvetica');
        if (field.multiline) {
          const textHeight = doc.heightOfString(String(value || ''), { width: fieldWidth });
          doc.text(String(value || ''), currentX, currentY + 12, { width: fieldWidth });
          currentY += Math.max(lineHeight, textHeight + 15);
        } else {
          doc.text(String(value || ''), currentX, currentY + 12, { width: fieldWidth });
          currentY += lineHeight;
        }

        // Check if we need new row
        if (field.width < 1) {
          currentX += fieldWidth;
          if (currentX + fieldWidth > doc.page.width - doc.page.margins.right) {
            currentX = doc.page.margins.left;
            currentY += 5;
          }
        } else {
          currentX = doc.page.margins.left;
          currentY += 5;
        }
      }

      doc.y = currentY;
    }
  }

  /**
   * Extract field value from alert data
   */
  getFieldValue(alertData, key) {
    const keys = key.split('.');
    let value = alertData;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return '';
      }
    }

    return value;
  }

  /**
   * Validate template structure
   */
  validateTemplate(template) {
    const errors = [];

    if (!template.name) errors.push('Template must have a name');
    if (!template.sections || !Array.isArray(template.sections)) {
      errors.push('Template must have a sections array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = PDFTemplateService;
