/**
 * Check database state and list tables
 * Run: node check_db.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'barclays_app',
  password: 'change_me_to_secure_password',
  host: 'localhost',
  port: 5432,
  database: 'barclays_aml',
});

async function checkDatabase() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('\n========================================');
    console.log('DATABASE CHECK');
    console.log('========================================\n');
    
    // List all tables
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema='public' ORDER BY table_name;`
    );
    
    console.log('Available Tables:');
    if (result.rows.length === 0) {
      console.log('  (No tables found - database is empty)');
    } else {
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Try to query analysts table
    console.log('\n\nChecking analysts table...');
    try {
      const analystResult = await client.query(
        `SELECT analyst_id, username, email, role FROM analysts ORDER BY analyst_id;`
      );
      console.log(`  Found ${analystResult.rows.length} analysts:`);
      analystResult.rows.forEach(row => {
        console.log(`    - ${row.username} (${row.email}) - ${row.role}`);
      });
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Connection Error:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkDatabase();
