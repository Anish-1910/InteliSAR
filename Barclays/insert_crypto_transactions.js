/**
 * Insert 10 Cryptocurrency & Foreign Currency Transactions
 * These transactions will be analyzed by the ML model to detect suspicious patterns
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'barclays_app',
  password: process.env.DB_PASSWORD || 'anish@123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'barclays_aml',
});

// 10 Cryptocurrency & Foreign Currency Transactions
const cryptoTransactions = [
  {
    transaction_id: 'TXN_CRYPTO_BTC_001',
    account_id: 'ACC_CRYPTO_001',
    customer_name: 'Rahul Patel',
    from_account: 'US_BANK_ACC_001',
    to_account: 'CRYPTO_WALLET_NK_001',
    amount_received: 2.5,
    receiving_currency: 'BTC',
    amount_paid: 95000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Transfer of 2.5 BTC to North Korea wallet',
    destination_country: 'North Korea',
    risk_flags: ['High-Risk-Jurisdiction', 'Sanctions-Violation', 'Cryptocurrency'],
  },
  {
    transaction_id: 'TXN_CRYPTO_ETH_002',
    account_id: 'ACC_CRYPTO_002',
    customer_name: 'James Mitchell',
    from_account: 'US_BANK_ACC_002',
    to_account: 'CRYPTO_EXCHANGE_IRAN',
    amount_received: 5.8,
    receiving_currency: 'ETH',
    amount_paid: 228000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Transfer of 5.8 ETH to Iranian entity via mixing service',
    destination_country: 'Iran',
    risk_flags: ['OFAC-Sanctioned', 'Mixing-Service', 'Layering'],
  },
  {
    transaction_id: 'TXN_CRYPTO_BTC_003',
    account_id: 'ACC_CRYPTO_003',
    customer_name: 'Lisa Chen',
    from_account: 'US_BANK_ACC_003',
    to_account: 'TORNADO_CASH_MIXER',
    amount_received: 15.2,
    receiving_currency: 'BTC',
    amount_paid: 342000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Large transfer through Tornado Cash cryptocurrency mixer',
    destination_country: 'Multiple',
    risk_flags: ['Cryptocurrency-Mixer', 'Sanctions-Evasion', 'Money-Laundering'],
  },
  {
    transaction_id: 'TXN_CRYPTO_XMR_004',
    account_id: 'ACC_CRYPTO_004',
    customer_name: 'Ahmed Hassan',
    from_account: 'US_BANK_ACC_004',
    to_account: 'PRIVACY_WALLET_SYR',
    amount_received: 8.9,
    receiving_currency: 'XMR',
    amount_paid: 156000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Monero (privacy coin) transfer to Syrian entity',
    destination_country: 'Syria',
    risk_flags: ['Privacy-Coin', 'OFAC-Sanctioned', 'Terrorist-Financing'],
  },
  {
    transaction_id: 'TXN_CRYPTO_BTC_005',
    account_id: 'ACC_CRYPTO_005',
    customer_name: 'Maria Santos',
    from_account: 'US_BANK_ACC_005',
    to_account: 'RANSOMWARE_WALLET',
    amount_received: 42.3,
    receiving_currency: 'BTC',
    amount_paid: 890000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Ransom payment to known Conti ransomware gang wallet',
    destination_country: 'Russia',
    risk_flags: ['Ransomware-Payment', 'Cybercrime', 'High-Value'],
  },
  {
    transaction_id: 'TXN_FOREX_BCH_006',
    account_id: 'ACC_FOREX_006',
    customer_name: 'Viktor Sokolov',
    from_account: 'US_BANK_ACC_006',
    to_account: 'BUDAPEST_CRYPTO_DESK',
    amount_received: 3.6,
    receiving_currency: 'BCH',
    amount_paid: 158000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Bitcoin Cash exchange to EUR through unregulated Budapest exchange',
    destination_country: 'Hungary',
    risk_flags: ['Unregulated-Exchange', 'Rapid-Conversion', 'Foreign-Currency'],
  },
  {
    transaction_id: 'TXN_CRYPTO_BTC_007',
    account_id: 'ACC_CRYPTO_007',
    customer_name: 'Yuki Tanaka',
    from_account: 'US_BANK_ACC_007',
    to_account: 'HONG_KONG_WALLETS_MULTI',
    amount_received: 127.5,
    receiving_currency: 'BTC',
    amount_paid: 2850000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Structured transfers: 127.5 BTC distributed across 50+ wallets to Hong Kong',
    destination_country: 'Hong Kong',
    risk_flags: ['Structuring', 'Wire-Fraud', 'Multi-Hop-Transfer'],
  },
  {
    transaction_id: 'TXN_FOREX_ETH_008',
    account_id: 'ACC_FOREX_008',
    customer_name: 'Sofia Rodriguez',
    from_account: 'US_BANK_ACC_008',
    to_account: 'MEDELLIN_EXCHANGE',
    amount_received: 12.1,
    receiving_currency: 'ETH',
    amount_paid: 425000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'ETH to Colombian Peso conversion (1.8M COP) through unregulated exchange',
    destination_country: 'Colombia',
    risk_flags: ['Foreign-Currency', 'High-Risk-Country', 'Rapid-Conversion'],
  },
  {
    transaction_id: 'TXN_CRYPTO_LTC_009',
    account_id: 'ACC_CRYPTO_009',
    customer_name: 'Dmitri Volkov',
    from_account: 'US_BANK_ACC_009',
    to_account: 'MOSCOW_CRYPTO_DESK',
    amount_received: 6.4,
    receiving_currency: 'LTC',
    amount_paid: 182000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Litecoin to Russian Ruble conversion through Moscow crypto desk',
    destination_country: 'Russia',
    risk_flags: ['Foreign-Currency', 'High-Risk-Country', 'Crypto-Exchange'],
  },
  {
    transaction_id: 'TXN_CRYPTO_BTC_010',
    account_id: 'ACC_CRYPTO_010',
    customer_name: 'Priya Desai',
    from_account: 'US_BANK_ACC_010',
    to_account: 'DUBAI_CRYPTO_EXCHANGE',
    amount_received: 28.7,
    receiving_currency: 'BTC',
    amount_paid: 965000,
    payment_currency: 'USD',
    payment_format: 'CRYPTOCURRENCY',
    description: 'Complex funnel: BTC→AED (3.54M) via Dubai→15 Pakistan companies',
    destination_country: 'UAE/Pakistan',
    risk_flags: ['Money-Laundering', 'Layering', 'Multi-Country-Transfer'],
  },
];

async function insertTransactions() {
  let client;
  try {
    client = await pool.connect();

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║  INSERTING 10 CRYPTO/FOREIGN CURRENCY TRANSACTIONS ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // First, ensure accounts exist
    console.log('Step 1: Creating customer accounts...\n');
    for (const txn of cryptoTransactions) {
      const accountCheckQuery = 'SELECT account_id FROM accounts WHERE account_id = $1';
      const result = await client.query(accountCheckQuery, [txn.account_id]);

      if (result.rows.length === 0) {
        // Account doesn't exist, create it
        const accountInsertQuery = `
          INSERT INTO accounts (account_id, customer_name, kyc_status, country, account_type)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (account_id) DO NOTHING
        `;
        await client.query(accountInsertQuery, [
          txn.account_id,
          txn.customer_name,
          'VERIFIED',
          'United States',
          'BUSINESS',
        ]);
        console.log(`  ✓ Created account ${txn.account_id} for ${txn.customer_name}`);
      }
    }

    // Now insert transactions
    console.log('\nStep 2: Inserting cryptocurrency/foreign currency transactions...\n');
    for (const txn of cryptoTransactions) {
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24h

      const insertQuery = `
        INSERT INTO transactions (
          transaction_id,
          account_id,
          from_account,
          to_account,
          timestamp,
          amount_received,
          receiving_currency,
          amount_paid,
          payment_currency,
          payment_format
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (transaction_id) DO NOTHING
      `;

      await client.query(insertQuery, [
        txn.transaction_id,
        txn.account_id,
        txn.from_account,
        txn.to_account,
        timestamp,
        txn.amount_received,
        txn.receiving_currency,
        txn.amount_paid,
        txn.payment_currency,
        txn.payment_format,
      ]);

      console.log(`  ✓ ${txn.transaction_id}`);
      console.log(`    Customer: ${txn.customer_name}`);
      console.log(`    Amount: ${txn.amount_received} ${txn.receiving_currency} (≈ $${txn.amount_paid.toLocaleString()})`);
      console.log(`    Destination: ${txn.destination_country}`);
      console.log(`    Risk Flags: ${txn.risk_flags.join(', ')}\n`);
    }

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL 10 TRANSACTIONS INSERTED SUCCESSFULLY!     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('📊 TRANSACTION SUMMARY:');
    console.log('   • 10 crypto/foreign currency transactions inserted');
    console.log('   • Includes: Bitcoin, Ethereum, Monero, Bitcoin Cash, Litecoin');
    console.log('   • High-risk destinations: North Korea, Iran, Syria, Russia, etc.');
    console.log('   • Total USD equivalent: $5.3M+');
    console.log('\n🔍 The ML model will now detect these suspicious patterns:');
    console.log('   ✓ Cryptocurrency transactions');
    console.log('   ✓ High-risk jurisdictions (OFAC-sanctioned countries)');
    console.log('   ✓ Ransomware payments');
    console.log('   ✓ Money laundering patterns');
    console.log('   ✓ Structuring/Layering activities\n');

    console.log('Next Steps:');
    console.log('1. Run the ML anomaly detection: node anomaly_detector.py');
    console.log('2. Login to the system: analyser@intelisar.com / analyser123');
    console.log('3. Check the alerts dashboard for detected suspicious transactions');
    console.log('4. Generate SARs for the flagged transactions\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database "barclays_aml" exists');
    console.error('  3. .env file has DB_PASSWORD set correctly');
    console.error('  4. Tables have been created with postgres_setup.sql');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the insertion
insertTransactions();
