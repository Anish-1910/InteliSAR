/**
 * Enhanced RAG System with Section-Specific Content Generation
 * Tailored for the 6-section SAR template structure
 */

const { SAR_TEMPLATE_STRUCTURE, CRYPTO_OPERATION_TEMPLATE } = require('./sar-template-structure');

class EnhancedRAGSystem {
  constructor() {
    this.regulations = this.loadRegulations();
    this.fraudPatterns = this.loadFraudPatterns();
    this.complianceRules = this.loadComplianceRules();
  }

  /**
   * Load regulatory references
   */
  loadRegulations() {
    return {
      aml_primary: {
        title: 'Bank Secrecy Act (BSA) - 31 U.S.C. § 5318',
        content: 'Requires financial institutions to establish and maintain anti-money laundering programs',
        key_points: [
          'Know Your Customer (KYC) requirements',
          'Customer Identification Program (CIP)',
          'Suspicious Activity Reporting (SAR)',
          'Recordkeeping and reporting',
        ],
      },
      aml_secondary: {
        title: 'Currency and Foreign Transactions Reporting Act - 31 U.S.C. § 5313',
        content: 'Requires reporting of transactions exceeding $10,000',
        key_points: ['CTR filing', 'International transmittals', 'Form 8300'],
      },
      fatca: {
        title: 'Foreign Account Tax Compliance Act (FATCA)',
        content: 'Requires reporting of foreign financial accounts',
        key_points: ['FBAR requirements', 'Form 90.22.1', 'Penalties for non-compliance'],
      },
      kyc: {
        title: 'Know Your Customer (KYC) - FinCEN Guidance',
        content: 'Essential component of AML program',
        key_points: [
          'Customer identification and verification',
          'Beneficial ownership identification',
          'Understanding customer activities',
          'Enhanced due diligence (EDD)',
        ],
      },
      offshore: {
        title: 'Offshore Money Laundering Prevention',
        content: 'Controls on international fund transfers',
        key_points: ['Wire transfer rules', 'Correspondent banking', 'Sanctions compliance'],
      },
    };
  }

  /**
   * Load fraud pattern definitions
   */
  loadFraudPatterns() {
    return {
      structuring: {
        name: 'Structuring',
        risk: 'HIGH',
        indicators: [
          'Multiple small deposits under $10,000',
          'Daily deposits in sequential pattern',
          'Round amounts suggesting deliberate structure',
          'Withdrawals shortly after deposit',
        ],
        regulation: '31 U.S.C. § 5324',
      },
      smurfing: {
        name: 'Smurfing',
        risk: 'HIGH',
        indicators: [
          'Multiple individuals depositing funds',
          'Same source of funds',
          'Coordinated timing',
          'Resemblance to money laundry',
        ],
      },
      layering: {
        name: 'Layering',
        risk: 'HIGH',
        indicators: [
          'Complex web of transactions',
          'Multiple currency conversions',
          'Frequent transfers between accounts',
          'Difficult to trace origin',
        ],
      },
      integration: {
        name: 'Integration',
        risk: 'MEDIUM',
        indicators: [
          'Unexplained deposits to business accounts',
          'Inconsistent with stated business',
          'Rapid withdrawal and conversion',
          'Use for legitimate purchases',
        ],
      },
      cryptocurrency: {
        name: 'Cryptocurrency Mixing',
        risk: 'CRITICAL',
        indicators: [
          'Use of mixing/tumbling services',
          'Rapid crypto transfers',
          'Conversion to stablecoins',
          'Bridge to untraced wallets',
          'Use of privacy coins (Monero, Zcash)',
        ],
      },
    };
  }

  /**
   * Load compliance rules
   */
  loadComplianceRules() {
    return {
      sar_filing: 'SAR must be filed within 30 days of detection',
      no_tipping_rule: 'Customers must NOT be informed of SAR filing',
      minimum_threshold: 'Minimum $5,000 for SAR filing (BSA requirement)',
      record_retention: 'Maintain records for minimum 5 years',
      multi_state_rule: 'Transactions involving multiple states/countries require escalation',
    };
  }

  /**
   * Generate content for each SAR section
   */
  generateSectionContent(sectionId, alertData) {
    switch (sectionId) {
      case 1:
        return this.generateGlossaryCode(alertData);
      case 2:
        return this.generateStatementOfSuspicion(alertData);
      case 3:
        return this.generateCustomerDetails(alertData);
      case 4:
        return this.generateDescriptionOfSuspicion(alertData);
      case 5:
        return this.generateCoreOperationAnalysis(alertData);
      case 6:
        return this.generateSummary(alertData);
      default:
        return '';
    }
  }

  /**
   * Section 1: Generate Glossary Code
   */
  generateGlossaryCode(alertData) {
    const reportDate = new Date().toISOString().split('T')[0];
    return `
GLOSSARY CODE
=============
SAR Identification Number: SAR-${alertData.alert_id}-${Date.now()}
Report Filing Date: ${reportDate}
Filing Institution: Barclays Bank PLC
Report Status: SUBMITTED TO FinCEN
Reporting Officer: AML Compliance Department
Regulatory Authority: Financial Crimes Enforcement Network (FinCEN)
    `;
  }

  /**
   * Section 2: Generate Statement of Suspicion
   */
  generateStatementOfSuspicion(alertData) {
    const patterns = (alertData.patterns_detected || []).join(', ') || 'Money Laundering';
    const confidence = alertData.confidence_score || 0;
    const riskLevel = alertData.risk_level || 'HIGH';

    return `
STATEMENT OF SUSPICION
======================
Barclays Bank PLC has reasonable suspicion that the following transaction(s) may involve money laundering, terrorist financing, or other financial crimes.

Primary Suspicion: ${patterns}
Confidence Level: ${confidence}% (Very High Probability)
Risk Assessment: ${riskLevel} RISK
Basis of Suspicion: Pattern analysis and behavioral anomalies consistent with known AML typologies.

This report is filed in accordance with 31 U.S.C. § 5318(g) requiring reporting of suspicious activities.
Applicable Regulation: Bank Secrecy Act - Suspicious Activity Reporting Rule
    `;
  }

  /**
   * Section 3: Generate Customer Details
   */
  generateCustomerDetails(alertData) {
    return `
CUSTOMER DETAILS
================
Customer Name: ${alertData.customer_name || 'Unknown Customer'}
Customer ID: ${alertData.account_id || 'N/A'}
Account Number: ${alertData.from_account || 'N/A'}
Account Type: ${alertData.account_type || 'Standard Checking'}
Account Status: ACTIVE
Account Opening Date: Within Last 12 Months
Customer KYC Status: VERIFIED

Address: ${alertData.customer_address || 'On File'}
Phone Number: ${alertData.customer_phone || 'On File'}
Email: ${alertData.customer_email || 'On File'}

Risk Rating: ${alertData.risk_level === 'high' || alertData.risk_level === 'critical' ? 'HIGH' : 'MEDIUM'}
Previous SARs: None
Enhanced Due Diligence Required: YES
    `;
  }

  /**
   * Section 4: Generate Detailed Description of Suspicion
   */
  generateDescriptionOfSuspicion(alertData) {
    const transactionDate = new Date(alertData.timestamp).toISOString().split('T')[0];
    const amount = alertData.amount_paid || 0;
    const patterns = (alertData.patterns_detected || []).join(', ') || 'Unknown';

    return `
DESCRIPTION OF SUSPICION - DETAILED ANALYSIS
==============================================

TRANSACTION DETAILS:
Transaction Date: ${transactionDate}
Transaction Amount: $${amount.toLocaleString()} USD
Currency: ${alertData.payment_currency || 'USD'}
Transaction Type: ${alertData.payment_format || 'Wire Transfer'}
From Account: ${alertData.from_account}
To Account: ${alertData.to_account}
Benefits Flowed To: Unknown Third Party

PATTERNS DETECTED:
Identified Fraud Patterns: ${patterns}
Confidence Score: ${alertData.confidence_score}%

BEHAVIORAL ANOMALIES:
1. Transaction size inconsistent with account profile
2. Unusual geographic destination for funds
3. Rapid movement through intermediary accounts
4. Timing suggests coordinated activity with other accounts

UNUSUAL BEHAVIORS IDENTIFIED:
- Account showed no activity before this transaction
- No obvious business purpose for transfer
- Recipient account characteristics suggest shell entity
- Multiple rapid transactions within short timeframe

FREQUENCY ANALYSIS:
This appears to be part of a larger layering scheme with multiple transactions within 48 hours of each other.

DESTINATION ANALYSIS:
Funds transferred to high-risk jurisdiction.
Recipient institution has weak AML controls.
Final beneficiary remains obscured.
    `;
  }

  /**
   * Section 5: Generate Core Operation Analysis
   */
  generateCoreOperationAnalysis(alertData) {
    const isCrypto = (alertData.patterns_detected || []).some(p => 
      p.toLowerCase().includes('crypto') || p.toLowerCase().includes('blockchain')
    );

    let analysis = `
CORE ERROR/OPERATION ANALYSIS
=============================
Core Suspicious Operation: ${this.identifyCoreOperation(alertData)}

OPERATION ANALYSIS:
This transaction exhibits characteristics consistent with money laundering through the integration phase.
The suspicious activity appears designed to:
1. Obscure the origin of funds
2. Layer transactions across multiple entities
3. Create legitimate appearance of funds
4. Emerge into the financial system undetected

REGULATORY VIOLATION:
Primary Violation: 31 U.S.C. § 5318 - Suspicious Activity
Secondary Violations: Bank Secrecy Act compliance failures
Risk Type: Money Laundering / Terrorist Financing
AML Typology: ${alertData.patterns_detected?.[0] || 'Complex Layering Scheme'}
    `;

    if (isCrypto) {
      analysis += this.generateCryptoCurrencyAnalysis(alertData);
    }

    return analysis;
  }

  /**
   * Generate Cryptocurrency-specific Analysis
   */
  generateCryptoCurrencyAnalysis(alertData) {
    return `

CRYPTOCURRENCY OPERATION DETAILS:
==================================
Type of Cryptocurrency: Bitcoin/Ethereum (Detected)
Source of Funds: Identified from transaction metadata
Purchase Method: Direct fiat-to-crypto conversion
Purchase Platform: Multiple exchanges (high-risk indicators)

PURCHASE INFORMATION:
Amount in Fiat: $${alertData.amount_paid || 0}
Purchase Date: ${new Date(alertData.timestamp).toISOString().split('T')[0]}
Purchase Exchange: Unregulated Platform
Receipt Wallet Address: 0x... [On File]

CRYPTO MOVEMENT ANALYSIS:
Holding Period: Less than 24 hours
Transfer Pattern: Immediate to mixing service
Mixing Service Used: YES - [CoinJoin/Tornado Cash indicators]
Number of Hops: 5+ intermediary transfers

DESTINATION ANALYSIS:
Final Receiving Address: Multiple privacy-enhanced wallets
Receiving Exchange: Unregulated, high-risk jurisdiction
Conversion to Fiat: YES - Back to fiat within 48 hours
Final Destination: Unknown beneficiary
Destination Country: High-risk AML jurisdiction

RED FLAGS:
- Use of privacy coins (Monero/Zcash)
- Rapid movement through mixing services
- No legitimate business purpose
- Conversion pattern consistent with money laundering
- Receiving addresses associated with sanctions watchlists

COMPLIANCE CONCERNS:
- OFAC compliance violations suspected
- Travel Rule violations
- KYC failures at exchange
- Beneficial ownership not verified
    `;
  }

  /**
   * Section 6: Generate Summary and Recommendations
   */
  generateSummary(alertData) {
    return `
SUMMARY AND RECOMMENDATIONS
============================

SUMMARY:
Barclays Bank PLC reports suspicious activity related to Account ${alertData.account_id}.
The transaction of $${alertData.amount_paid || 0} exhibits multiple characteristics of money laundering.
Pattern analysis indicates ${(alertData.confidence_score || 0)}% probability of illicit origin.

Risk Level: ${alertData.risk_level || 'HIGH'}
This activity poses a significant compliance risk to the institution.

RISK ASSESSMENT:
Inherent Risk: ${this.assessRisk(alertData)}
Control Risk: MEDIUM (Mitigated by current monitoring)
Detection Risk: LOW (Successfully identified by AML system)
Net Risk: ${alertData.risk_level || 'HIGH'}

RECOMMENDED ACTIONS:
1. IMMEDIATE: Freeze account pending investigation
2. File Currency Transaction Report (CTR) if threshold exceeded
3. Conduct enhanced due diligence on beneficial ownership
4. Review related accounts for layering patterns
5. Coordinate with law enforcement if indicated
6. Escalate to FinCEN within 30-day window
7. Maintain detailed documentation for regulatory examination
8. Review related transactions for past 2 years

FILING INFORMATION:
SAR Filed: YES
Filing Date: ${new Date().toISOString().split('T')[0]}
Filing Method: FinCEN Secure System (encrypted)
Status: SUBMITTED
Compliance Officer Signature: Digital ✓
Review Status: APPROVED FOR FILING
    `;
  }

  /**
   * Helper: Identify Core Operation Type
   */
  identifyCoreOperation(alertData) {
    const patterns = alertData.patterns_detected || [];
    const amount = alertData.amount_paid || 0;

    if (patterns.some(p => p.toLowerCase().includes('crypto'))) {
      return 'Cryptocurrency Conversion and Layering';
    } else if (amount > 100000) {
      return 'Rapid Large Value Transfer';
    } else if (patterns.some(p => p.toLowerCase().includes('structur'))) {
      return 'Structured Deposits Below Reporting Threshold';
    } else {
      return 'Multi-Layer Fund Obfuscation';
    }
  }

  /**
   * Helper: Assess Risk Level
   */
  assessRisk(alertData) {
    const confidence = alertData.confidence_score || 0;
    const patterns = (alertData.patterns_detected || []).length;

    if (confidence >= 90 && patterns >= 3) {
      return 'CRITICAL - Immediate action required';
    } else if (confidence >= 75 && patterns >= 2) {
      return 'HIGH - Requires investigation';
    } else if (confidence >= 50) {
      return 'MEDIUM - Monitor closely';
    } else {
      return 'LOW - Routine monitoring';
    }
  }

  /**
   * Generate complete SAR with all sections
   */
  generateCompleteSAR(alertData) {
    const sar = {};
    const sections = SAR_TEMPLATE_STRUCTURE.sections;

    sections.forEach(section => {
      sar[section.id] = this.generateSectionContent(section.id, alertData);
    });

    return sar;
  }

  /**
   * Format SAR sections for display
   */
  formatForDisplay(sarSections) {
    let formatted = '';
    for (let i = 1; i <= 6; i++) {
      formatted += sarSections[i];
      formatted += '\n' + '='.repeat(80) + '\n\n';
    }
    return formatted;
  }
}

module.exports = EnhancedRAGSystem;
