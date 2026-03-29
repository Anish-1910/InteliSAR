/**
 * SAR Generator v4 - Section-Based with Enhanced RAG
 * Generates professional SARs with 6 required sections
 */

const EnhancedRAGSystem = require('./enhanced-rag-system');
const { SAR_TEMPLATE_STRUCTURE } = require('./sar-template-structure');

class SARGeneratorV4 {
  constructor() {
    this.rag = new EnhancedRAGSystem();
  }

  /**
   * Generate complete SAR with all 6 sections
   */
  async generateCompleteSAR(alertData) {
    try {
      console.log(`[SAR-Gen-v4] Generating 6-section SAR for alert ${alertData.alert_id}`);

      // Generate all sections
      const sarSections = this.rag.generateCompleteSAR(alertData);

      // Format for text output
      const sarText = this.rag.formatForDisplay(sarSections);

      return {
        status: 'success',
        sar_text: sarText,
        sections: sarSections,
        template: 'six_section_sar',
        format: 'text',
        generation_method: 'enhanced-rag',
        alert_id: alertData.alert_id,
        generated_at: new Date().toISOString(),
        metadata: {
          total_sections: 6,
          confidence: alertData.confidence_score,
          risk_level: alertData.risk_level,
          patterns: alertData.patterns_detected,
        },
      };
    } catch (error) {
      console.error('[SAR-Gen-v4] Error generating SAR:', error);
      throw error;
    }
  }

  /**
   * Generate SAR as structured JSON
   */
  async generateStructuredSAR(alertData) {
    const sarSections = this.rag.generateCompleteSAR(alertData);

    return {
      glossary_code: this.parseSection(sarSections[1]),
      statement_of_suspicion: this.parseSection(sarSections[2]),
      customer_details: this.parseSection(sarSections[3]),
      description_of_suspicion: this.parseSection(sarSections[4]),
      core_operation_analysis: this.parseSection(sarSections[5]),
      summary: this.parseSection(sarSections[6]),
      metadata: {
        sar_id: `SAR-${alertData.alert_id}-${Date.now()}`,
        filing_date: new Date().toISOString().split('T')[0],
        institution: 'Barclays Bank PLC',
        alert_id: alertData.alert_id,
        confidence: alertData.confidence_score,
      },
    };
  }

  /**
   * Parse section text into structured object
   */
  parseSection(sectionText) {
    return {
      content: sectionText.trim(),
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Generate PDF-formatted SAR
   */
  async generatePDFContent(alertData) {
    const structured = await this.generateStructuredSAR(alertData);

    return {
      title: 'SUSPICIOUS ACTIVITY REPORT (SAR)',
      subtitle: 'Financial Crimes Enforcement Network (FinCEN) Filing',
      institution: 'Barclays Bank PLC',
      report_date: new Date().toISOString().split('T')[0],
      sections: [
        {
          number: 1,
          title: 'GLOSSARY CODE',
          content: structured.glossary_code.content,
          page_break: false,
        },
        {
          number: 2,
          title: 'STATEMENT OF SUSPICION',
          content: structured.statement_of_suspicion.content,
          page_break: false,
        },
        {
          number: 3,
          title: 'CUSTOMER DETAILS',
          content: structured.customer_details.content,
          page_break: true,
        },
        {
          number: 4,
          title: 'DESCRIPTION OF SUSPICION - DETAILED ANALYSIS',
          content: structured.description_of_suspicion.content,
          page_break: true,
        },
        {
          number: 5,
          title: 'CORE ERROR/OPERATION ANALYSIS',
          content: structured.core_operation_analysis.content,
          page_break: true,
        },
        {
          number: 6,
          title: 'SUMMARY AND RECOMMENDATIONS',
          content: structured.summary.content,
          page_break: false,
        },
      ],
      metadata: structured.metadata,
      footer: {
        confidential: 'CONFIDENTIAL - FOR FinCEN FILING ONLY',
        compliance_note: 'This report is filed pursuant to 31 U.S.C. § 5318(g)',
        filing_deadline: '30 days from detection date',
      },
    };
  }

  /**
   * Generate SAR for display (simplified format)
   */
  async generateDisplaySAR(alertData) {
    const sarContent = await this.generateCompleteSAR(alertData);

    return {
      display_text: sarContent.sar_text,
      sections: sarContent.sections,
      alert_id: alertData.alert_id,
      metadata: sarContent.metadata,
    };
  }
}

module.exports = SARGeneratorV4;
