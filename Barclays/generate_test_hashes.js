/**
 * Generate bcrypt hashes for test analyst passwords
 * Run this script: node generate_test_hashes.js
 * 
 * This generates proper bcrypt hashes for the test analyst accounts
 * so you can test the login system.
 */

const bcrypt = require('bcrypt');

// Test analyst credentials
const testAnalysts = [
  { username: 'analyst1', password: 'password123', email: 'john.doe@barclays.com' },
  { username: 'analyst2', password: 'password123', email: 'jane.smith@barclays.com' },
  { username: 'admin1', password: 'admin123', email: 'admin@barclays.com' },
  { username: 'reviewer1', password: 'password123', email: 'reviewer@barclays.com' },
];

async function generateHashes() {
  console.log('\n========================================');
  console.log('BCRYPT HASH GENERATION FOR TEST ANALYSTS');
  console.log('========================================\n');

  console.log('SQL INSERT STATEMENTS:\n');

  const sqlInserts = [];

  for (const analyst of testAnalysts) {
    // Generate bcrypt hash with 10 salt rounds
    const hash = await bcrypt.hash(analyst.password, 10);

    sqlInserts.push(
      `  ('${analyst.username}', '${analyst.email}', '${hash}', ...)`
    );

    console.log(`\nUsername: ${analyst.username}`);
    console.log(`Password: ${analyst.password}`);
    console.log(`Email: ${analyst.email}`);
    console.log(`Bcrypt Hash:`);
    console.log(`${hash}`);
  }

  console.log('\n\n========================================');
  console.log('TEST THESE ACCOUNTS:');
  console.log('========================================\n');

  for (const analyst of testAnalysts) {
    console.log(`Login with username: "${analyst.username}", password: "${analyst.password}"`);
  }

  console.log('\n\n========================================');
  console.log('INSTRUCTIONS:');
  console.log('========================================\n');
  console.log('1. Run: npm install bcrypt jsonwebtoken');
  console.log('2. Update the password hashes in postgres_setup.sql with the hashes above');
  console.log('3. Run: node postgres_setup.sql (or your database initialization)');
  console.log('4. Test login with the credentials above');
  console.log('\nExample curl command:');
  console.log(`curl -X POST http://localhost:3000/api/auth/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"username":"analyst1","password":"password123"}'`);
}

generateHashes().catch(err => {
  console.error('Error generating hashes:', err);
  process.exit(1);
});
