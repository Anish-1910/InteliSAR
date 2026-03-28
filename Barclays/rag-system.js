/**
 * RAG System (Retrieval-Augmented Generation)
 * Retrieves relevant regulatory documents, compliance rules, and patterns
 * to enhance SAR generation with contextual information
 */

const axios = require('axios');

class RAGSystem {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  /**
   * Initialize the knowledge base with regulatory and compliance information
   */
  initializeKnowledgeBase() {
    return {
      regulations: [
        {
          id: 'sar-filing-31usc5318',
          title: '31 U.S.C. § 5318 - SAR Filing Requirements',
          content: `Suspicious Activity Reports (SARs) must be filed when:
          - Transaction involving funds of at least $5,000 where institution suspects involvement in illegal activity
          - Customer attempts to structure transactions to avoid reporting
          - Unusual patterns of activity that deviate from customer profile
          - Involvement with known or suspected terrorist financing
          - Connection to sanctioned countries or individuals`,
        },
        {
          id: 'aml-red-flags-31cfr1020',
          title: '31 C.F.R. Part 1020 - Banks AML Program',
          content: `Red flags for potential money laundering:
          - Large cash deposits followed by immediate wire transfers
          - Multiple accounts receiving deposits and transferring to single account
          - Frequent international transfers with no clear business purpose
          - Round-dollar amount transactions (suggests structuring)
          - Transactions involving high-risk countries
          - Customer unable to explain business rationale
          - Frequent large transfers to beneficial owners`,
        },
        {
          id: 'ctf-indicators-31cfr1010',
          title: 'Counter-Terrorist Financing Indicators',
          content: `Indicators of potential terrorist financing:
          - Transfers to/from known terrorist-supporting jurisdictions
          - Small frequent deposits below reporting thresholds
          - Use of multiple intermediaries and accounts
          - Transfers to non-profit organizations with unclear missions
          - Payments for goods never received
          - Hawala or underground banking methods
          - Rapid movement of funds through multiple accounts`,
        },
      ],
      fraudPatterns: [
        {
          id: 'pattern-structuring',
          name: 'Transaction Structuring',
          description: 'Series of transactions deliberately structured to avoid $10k CTR threshold',
          indicators: [
            'Multiple deposits just under $10,000',
            'Deposits on different days',
            'Different tellers or branches',
            'Large withdrawals immediately after',
          ],
          riskScore: 85,
        },
        {
          id: 'pattern-smurfing',
          name: 'Smurfing',
          description: 'Multiple small transactions by different individuals to evade reporting',
          indicators: [
            'Coordinated series of deposits',
            'Unrelated parties depositing same amounts',
            'Rapid consolidation to single account',
            'Funds transferred internationally',
          ],
          riskScore: 80,
        },
        {
          id: 'pattern-layering',
          name: 'Layering',
          description: 'Complex sequence of transactions to obscure money origin',
          indicators: [
            'Multiple transfers between accounts',
            'International wire transfers with rapid turnaround',
            'Conversion to different currencies',
            'Use of trade invoices as cover',
          ],
          riskScore: 75,
        },
        {
          id: 'pattern-integration',
          name: 'Integration',
          description: 'Reintroduction of laundered money into legitimate economy',
          indicators: [
            'Large legitimate-looking purchases',
            'Business deposits from shell companies',
            'Real estate transactions',
            'Luxury goods acquisitions',
          ],
          riskScore: 70,
        },
      ],
      complianceRules: [
        {
          id: 'rule-kyc-verification',
          title: 'Know Your Customer (KYC) Verification',
          content: `All customers must be verified with:
          - Government-issued ID
          - Proof of address
          - Source of funds verification
          - Beneficial ownership documentation (if applicable)
          - Enhanced due diligence for high-risk customers`,
        },
        {
          id: 'rule-cip-procedures',
          title: 'Customer Identification Program (CIP)',
          content: `CIP must include:
          - Obtaining customer identifying information
          - Verifying public records or private databases
          - Using information obtained in the course of business
          - Comparing against OFAC and sanctions lists
          - Maintaining records of identification`,
        },
      ],
      sarTemplates: [
        {
          id: 'template-currency-structuring',
          title: 'Currency Structuring SAR',
          sections: [
            'Structured deposits below reporting thresholds',
            'Lack of legitimate business purpose',
            'Customer behavior inconsistent with profile',
            'Recommendation: File SAR and monitor related accounts',
          ],
        },
        {
          id: 'template-trade-based-ml',
          title: 'Trade-Based Money Laundering SAR',
          sections: [
            'Over/underinvoicing of import/export transactions',
            'Mismatch between goods and payment values',
            'Use of shell companies or intermediaries',
            'Recommendation: Coordinate with customs authorities',
          ],
        },
      ],
    };
  }

  /**
   * Retrieve relevant regulations based on patterns detected
   */
  retrieveRelevantRegulations(patternsDetected = []) {
    const relevantRegs = [];

    if (patternsDetected.length === 0) {
      return this.knowledgeBase.regulations;
    }

    // Map patterns to relevant regulations
    const patternToReg = {
      'Structuring': ['sar-filing-31usc5318', 'aml-red-flags-31cfr1020'],
      'Smurfing': ['aml-red-flags-31cfr1020'],
      'Layering': ['aml-red-flags-31cfr1020'],
      'Terrorist Financing': ['ctf-indicators-31cfr1010'],
      'High Risk Country': ['ctf-indicators-31cfr1010'],
    };

    const regIds = new Set();
    patternsDetected.forEach(pattern => {
      const relatedRegs = patternToReg[pattern] || [];
      relatedRegs.forEach(id => regIds.add(id));
    });

    // Default to main SAR filing reg
    if (regIds.size === 0) {
      regIds.add('sar-filing-31usc5318');
    }

    return this.knowledgeBase.regulations.filter(reg => regIds.has(reg.id));
  }

  /**
   * Retrieve matching fraud patterns
   */
  retrieveMatchingPatterns(patternsDetected = []) {
    if (patternsDetected.length === 0) {
      return this.knowledgeBase.fraudPatterns;
    }

    const matchingPatterns = [];
    patternsDetected.forEach(detectedPattern => {
      const match = this.knowledgeBase.fraudPatterns.find(
        p => p.name.toLowerCase().includes(detectedPattern.toLowerCase()) ||
             p.id.includes(detectedPattern.toLowerCase())
      );
      if (match) matchingPatterns.push(match);
    });

    return matchingPatterns.length > 0 ? matchingPatterns : this.knowledgeBase.fraudPatterns.slice(0, 2);
  }

  /**
   * Retrieve compliance rules relevant to the alert
   */
  retrieveComplianceRules(riskLevel = 'HIGH') {
    const rules = [...this.knowledgeBase.complianceRules];

    // Prioritize based on risk level
    if (riskLevel === 'CRITICAL') {
      return rules; // Return all rules for critical alerts
    }
    return rules.slice(0, 2);
  }

  /**
   * Build RAG context for SAR generation
   */
  buildRAGContext(alertData) {
    const patternsDetected = alertData.patterns_detected || [];
    const riskLevel = alertData.risk_level || 'HIGH';
    const confidenceScore = alertData.confidence_score || 0;

    const ragContext = {
      regulations: this.retrieveRelevantRegulations(patternsDetected),
      patterns: this.retrieveMatchingPatterns(patternsDetected),
      complianceRules: this.retrieveComplianceRules(riskLevel),
      alertMetadata: {
        confidenceScore,
        riskLevel,
        patternsDetected,
        receivedCount: alertData.amount_received || 0,
        currency: alertData.receiving_currency || 'USD',
      },
    };

    return ragContext;
  }

  /**
   * Create enhancedPrompt using RAG context
   */
  createEnhancedPrompt(alertData, ragContext) {
    const regulatoryContext = ragContext.regulations
      .map(r => `${r.title}:\n${r.content}`)
      .join('\n\n');

    const patternContext = ragContext.patterns
      .map(p => `${p.name}: ${p.description}\nIndicators: ${p.indicators.join(', ')}`)
      .join('\n\n');

    const complianceContext = ragContext.complianceRules
      .map(r => `${r.title}: ${r.content}`)
      .join('\n\n');

    return `You are a compliance officer specializing in AML (Anti-Money Laundering) Suspicious Activity Reports (SARs).

REGULATORY FRAMEWORK:
${regulatoryContext}

DETECTED FRAUD PATTERNS:
${patternContext}

COMPLIANCE REQUIREMENTS:
${complianceContext}

ALERT DETAILS:
- Alert ID: ${alertData.alert_id}
- Transaction ID: ${alertData.transaction_id}
- Account ID: ${alertData.account_id}
- Confidence Score: ${alertData.confidence_score}%
- Risk Level: ${alertData.risk_level}
- Amount: ${alertData.amount_received} ${alertData.receiving_currency}
- Detected Patterns: ${(alertData.patterns_detected || []).join(', ')}
- Customer Name: ${alertData.customer_name || 'N/A'}
- Account Type: ${alertData.account_type || 'Unknown'}

Please generate a comprehensive, professional Suspicious Activity Report (SAR) that:
1. Summarizes the alert and detected suspicious patterns
2. References the applicable regulations and compliance requirements
3. Explains how the detected patterns indicate AML violations
4. Includes clear findings and recommendations
5. Is formatted as a professional compliance document suitable for FinCEN filing
6. Includes all SEC-required sections and details
7. Provides specific action items and next steps

Generate the complete SAR report with proper formatting and professional tone.`;
  }
}

module.exports = RAGSystem;
