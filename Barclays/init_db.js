/**
 * Initialize database from postgres_setup.sql
 * Run: node init_db.js
 */

const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'barclays_app',
  password: 'change_me_to_secure_password',
  host: 'localhost',
  port: 5432,
  database: 'barclays_aml',
});

async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('\n========================================');
    console.log('DATABASE INITIALIZATION');
    console.log('========================================\n');
    
    // Read the SQL setup file
    const sqlContent = fs.readFileSync('./postgres_setup.sql', 'utf8');
    
    console.log('Executing postgres_setup.sql...');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const stmt = statements[i];
        if (stmt) {
          console.log(`\n[${i + 1}/${statements.length}] Executing SQL statement...`);
          await client.query(stmt);
        }
      } catch (error) {
        // Some errors are OK (like duplicate tables)
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.error(`Error in statement ${i + 1}:`, error.message);
        } else {
          console.log(`  (Skipped - already exists)`);
        }
      }
    }
    
    console.log('\n✓ Database initialization complete!');
    console.log('\nYou can now login with:');
    console.log(`  Email: anishkalai2006@gmail.com`);
    console.log(`  Password: anish123\n`);
    
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initializeDatabase();
