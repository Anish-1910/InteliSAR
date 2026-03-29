#!/usr/bin/env node

/**
 * Test SAR Generation for Cryptocurrency Transactions
 * Generates SARs for all 10 crypto transactions
 */

const http = require('http');

const cryptoAlerts = [
  {
    alert_id: 'ALERT_CRYPTO_001',
    customer_name: 'Rahul Patel',
    amount: 2.5,
    amount_usd: 95000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 96,
    risk_level: 'CRITICAL',
    patterns_detected: ['Cryptocurrency_Transaction', 'High_Risk_Jurisdiction', 'Rapid_Transfer', 'Sanctions_Violation'],
    destination: 'Cryptocurrency wallet 1A1z7agoat in North Korea',
    foreign_country: 'North Korea',
    description: 'Transfer of 2.5 BTC (~$95K) to OFAC-sanctioned North Korea',
  },
  {
    alert_id: 'ALERT_CRYPTO_002',
    customer_name: 'James Mitchell',
    amount: 5.8,
    amount_usd: 228000,
    currency_type: 'Ethereum',
    currency_code: 'ETH',
    confidence_score: 93,
    risk_level: 'CRITICAL',
    patterns_detected: ['Cryptocurrency_Transaction', 'High_Value_Transfer', 'Layering_Pattern', 'OFAC_Violation'],
    destination: 'Crypto exchange in Tehran, Iran',
    foreign_country: 'Iran',
    description: 'Transfer of 5.8 ETH via mixing to Iran - OFAC Sanctioned',
  },
  {
    alert_id: 'ALERT_CRYPTO_003',
    customer_name: 'Lisa Chen',
    amount: 15.2,
    amount_usd: 342000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 91,
    risk_level: 'CRITICAL',
    patterns_detected: ['Cryptocurrency_Mixing_Service', 'Sanctions_Evasion', 'Money_Laundering'],
    destination: 'Tornado Cash Mixer',
    foreign_country: 'Multiple',
    description: 'Large transfer through Tornado Cash cryptocurrency mixer (15.2 BTC)',
  },
  {
    alert_id: 'ALERT_CRYPTO_004',
    customer_name: 'Ahmed Hassan',
    amount: 8.9,
    amount_usd: 156000,
    currency_type: 'Monero',
    currency_code: 'XMR',
    confidence_score: 94,
    risk_level: 'CRITICAL',
    patterns_detected: ['Privacy_Coin_Transaction', 'OFAC_Sanctioned', 'Terrorist_Financing'],
    destination: 'Privacy wallet in Damascus, Syria',
    foreign_country: 'Syria',
    description: 'Private crypto transfer to OFAC-sanctioned Syria (8.9 XMR)',
  },
  {
    alert_id: 'ALERT_CRYPTO_005',
    customer_name: 'Maria Santos',
    amount: 42.3,
    amount_usd: 890000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 97,
    risk_level: 'CRITICAL',
    patterns_detected: ['Ransomware_Payment', 'Cryptocurrency_Transaction', 'Cybercrime'],
    destination: 'Conti ransomware gang wallet',
    foreign_country: 'Russia',
    description: 'Ransom payment to known Conti ransomware gang (42.3 BTC - $890K)',
  },
  {
    alert_id: 'ALERT_CRYPTO_006',
    customer_name: 'Viktor Sokolov',
    amount: 3.6,
    amount_usd: 158000,
    currency_type: 'Bitcoin Cash',
    currency_code: 'BCH',
    confidence_score: 88,
    risk_level: 'HIGH',
    patterns_detected: ['Unregulated_Exchange', 'Foreign_Currency_Exchange', 'High_Risk_Country'],
    destination: 'Unregulated crypto desk in Budapest, Hungary',
    foreign_country: 'Hungary',
    description: 'BCH to EUR conversion through unregulated exchange (3.6 BCH - $158K)',
  },
  {
    alert_id: 'ALERT_CRYPTO_007',
    customer_name: 'Yuki Tanaka',
    amount: 127.5,
    amount_usd: 2850000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 95,
    risk_level: 'CRITICAL',
    patterns_detected: ['Structuring', 'Wire_Fraud', 'Multi_Hop_Transfer'],
    destination: '50+ wallets in Hong Kong (suspected fintech front)',
    foreign_country: 'Hong Kong',
    description: 'Structured BTC transfers across multiple wallets (127.5 BTC - $2.85M)',
  },
  {
    alert_id: 'ALERT_CRYPTO_008',
    customer_name: 'Sofia Rodriguez',
    amount: 12.1,
    amount_usd: 425000,
    currency_type: 'Ethereum',
    currency_code: 'ETH',
    confidence_score: 89,
    risk_level: 'HIGH',
    patterns_detected: ['Dual_Currency_Transaction', 'Foreign_Currency_Exchange', 'High_Risk_Country'],
    destination: 'Cryptocurrency exchange in Medellín, Colombia',
    foreign_country: 'Colombia',
    description: 'ETH to Colombian Peso conversion (12.1 ETH - $425K / 1.8M COP)',
  },
  {
    alert_id: 'ALERT_CRYPTO_009',
    customer_name: 'Dmitri Volkov',
    amount: 6.4,
    amount_usd: 182000,
    currency_type: 'Litecoin',
    currency_code: 'LTC',
    confidence_score: 87,
    risk_level: 'HIGH',
    patterns_detected: ['Cryptocurrency_Transaction', 'Foreign_Currency_Exchange', 'High_Risk_Country'],
    destination: 'Crypto trading desk in Moscow, Russia',
    foreign_country: 'Russia',
    description: 'LTC to Russian Ruble conversion (6.4 LTC - $182K)',
  },
  {
    alert_id: 'ALERT_CRYPTO_010',
    customer_name: 'Priya Desai',
    amount: 28.7,
    amount_usd: 965000,
    currency_type: 'Bitcoin',
    currency_code: 'BTC',
    confidence_score: 93,
    risk_level: 'CRITICAL',
    patterns_detected: ['Money_Laundering', 'Layering', 'Multi_Country_Transfer'],
    destination: 'Dubai crypto exchange → 15 Pakistan companies',
    foreign_country: 'UAE/Pakistan',
    description: 'Complex funnel: BTC→AED (3.54M dirhams)→Pakistan (28.7 BTC - $965K)',
  },
];

function generateSAR(alertId) {
  return new Promise((resolve, reject) => {
    const alert = cryptoAlerts.find(a => a.alert_id === alertId);
    if (!alert) {
      reject('Alert not found');
      return;
    }

    const postData = JSON.stringify(alert);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sar/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.sar_text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAllSARs() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          CRYPTOCURRENCY & FOREIGN CURRENCY SAR REPORTS          ║');
  console.log('║                    10 SUSPICIOUS TRANSACTIONS                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (let i = 0; i < cryptoAlerts.length; i++) {
    const alert = cryptoAlerts[i];
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`TRANSACTION ${i + 1}/10: ${alert.alert_id}`);
    console.log(`${'═'.repeat(70)}\n`);

    try {
      const sar = await generateSAR(alert.alert_id);
      console.log(sar);
    } catch (error) {
      console.error(`Error generating SAR: ${error}`);
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ ALL SAR REPORTS GENERATED SUCCESSFULLY');
  console.log(`${'═'.repeat(70)}\n`);
}

testAllSARs().catch(console.error);
