/**
 * Generate bcrypt hash for anish123 password
 * Run: node generate_anish_hash.js
 */

const bcrypt = require('bcrypt');

async function generateHash() {
  try {
    const hash = await bcrypt.hash('anish123', 10);
    console.log('\n========================================');
    console.log('BCRYPT HASH FOR ANISH KALAI');
    console.log('========================================\n');
    console.log('Password: anish123');
    console.log('Bcrypt Hash:');
    console.log(hash);
    console.log('\n========================================');
    console.log('UPDATE SQL:');
    console.log('========================================\n');
    console.log(`UPDATE analysts SET password_hash = '${hash}' WHERE username = 'anish_kalai';`);
    console.log('\nOR in postgres_setup.sql, replace the anish_kalai line with:');
    console.log(`('anish_kalai', 'anishkalai2006@gmail.com', '${hash}', 'Anish', 'Kalai', 'Anish Kalai', 'ANALYST', 'AML', true, NOW(), NOW()),`);
  } catch (err) {
    console.error('Error:', err);
  }
}

generateHash();
