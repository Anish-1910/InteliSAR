/**
 * SAR Template Structure Definition
 * Defines the 6-section SAR format as per regulatory requirements
 */

const SAR_TEMPLATE_STRUCTURE = {
  name: 'Standard SAR Report Format',
  version: '2.0',
  description: 'Professional SAR with 6 key sections for AML compliance',
  sections: [
    {
      id: 1,
      title: 'Glossary Code',
      description: 'Unique identifier for this Suspicious Activity Report',
      fields: ['sar_id', 'filing_date', 'institution_name', 'sar_status'],
    },
    {
      id: 2,
      title: 'Statement of Suspicion',
      description: 'Clear statement of what is suspected and why',
      fields: ['suspicion_statement', 'suspicion_basis', 'initial_assessment'],
    },
    {
      id: 3,
      title: 'Customer Details',
      description: 'Complete information about the customer involved',
      fields: ['customer_name', 'customer_id', 'account_id', 'account_type', 'customer_address', 'customer_phone'],
    },
    {
      id: 4,
      title: 'Description of Suspicion',
      description: 'Detailed description covering all aspects of suspicious activity',
      fields: ['transaction_details', 'patterns_detected', 'unusual_behaviors', 'amount_details', 'frequency_analysis', 'destination_analysis'],
    },
    {
      id: 5,
      title: 'Core Error/Operation Analysis',
      description: 'Deep dive into the core suspicious operation - for crypto include currency info',
      fields: ['core_operation', 'operation_analysis', 'crypto_currency_info', 'purchase_source', 'spending_destination', 'regulatory_violation'],
    },
    {
      id: 6,
      title: 'Summary',
      description: 'Concise summary and recommended actions',
      fields: ['summary', 'risk_assessment', 'recommended_action', 'filing_status'],
    },
  ],
};

/**
 * Template for SAR sections with placeholder content
 */
const SAR_SECTION_TEMPLATE = {
  glossary_code: {
    title: 'GLOSSARY CODE',
    content: {
      sar_id: '',
      filing_date: '',
      institution_name: 'Barclays Bank PLC',
      sar_status: 'PENDING REVIEW',
    },
  },
  statement_of_suspicion: {
    title: 'STATEMENT OF SUSPICION',
    content: {
      suspicion_statement: '',
      suspicion_basis: '',
      initial_assessment: '',
    },
  },
  customer_details: {
    title: 'CUSTOMER DETAILS',
    content: {
      customer_name: '',
      customer_id: '',
      account_id: '',
      account_type: '',
      customer_address: '',
      customer_phone: '',
    },
  },
  description_of_suspicion: {
    title: 'DESCRIPTION OF SUSPICION',
    content: {
      transaction_details: '',
      patterns_detected: '',
      unusual_behaviors: '',
      amount_details: '',
      frequency_analysis: '',
      destination_analysis: '',
    },
  },
  core_operation_analysis: {
    title: 'CORE ERROR/OPERATION ANALYSIS',
    subtitle: 'Analysis of the Primary Suspicious Operation',
    content: {
      core_operation: '',
      operation_analysis: '',
      crypto_currency_info: 'N/A', // For crypto cases
      purchase_source: 'N/A', // For crypto: where currency was purchased
      spending_destination: 'N/A', // For crypto: where it was spent
      regulatory_violation: '',
    },
  },
  summary: {
    title: 'SUMMARY AND RECOMMENDATIONS',
    content: {
      summary: '',
      risk_assessment: '',
      recommended_action: '',
      filing_status: 'SUBMITTED',
    },
  },
};

/**
 * Crypto-specific template section
 */
const CRYPTO_OPERATION_TEMPLATE = {
  title: 'CRYPTOCURRENCY OPERATION DETAILS',
  fields: {
    crypto_type: 'Type of Cryptocurrency (e.g., Bitcoin, Ethereum)',
    purchase_exchange: 'Exchange/Platform where crypto was purchased',
    purchase_amount: 'Amount in fiat currency spent',
    purchase_date: 'Date of purchase',
    purchase_wallet_address: 'Source wallet address',
    holding_period: 'How long crypto was held',
    transfer_pattern: 'Transaction pattern/frequency',
    sending_address: 'Address from which crypto was sent',
    receiving_address: 'Address where crypto was received',
    receiving_wallet_type: 'Type of receiving wallet (personal, exchange, mixer)',
    amount_in_crypto: 'Amount in cryptocurrency units',
    conversion_to_fiat: 'Converted back to fiat? (Yes/No)',
    final_destination: 'Final destination of funds',
    red_flags: 'Red flags in crypto movement',
    mixing_service_use: 'Use of mixing/tumbling services (Yes/No)',
    compliance_concerns: 'AML/KYC compliance concerns',
  },
};

module.exports = {
  SAR_TEMPLATE_STRUCTURE,
  SAR_SECTION_TEMPLATE,
  CRYPTO_OPERATION_TEMPLATE,
};
