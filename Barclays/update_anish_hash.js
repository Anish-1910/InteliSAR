/**
 * Update anish_kalai password hash in database
 * Run: node update_anish_hash.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'barclays_app',
  password: 'change_me_to_secure_password',
  host: 'localhost',
  port: 5432,
  database: 'barclays_aml',
});

async function updateHash() {
  let client;
  try {
    client = await pool.connect();
    
    const hash = '$2b$10$PnXv.GORlFsDXOvJlAh3I.nhYd1.A5GIVvkzweDdhg9VUGLPyAL3i';
    const username = 'anish_kalai';
    
    console.log('\nUpdating password hash in database...');
    console.log(`Username: ${username}`);
    console.log(`New Hash: ${hash}\n`);
    
    const result = await client.query(
      `UPDATE analysts SET password_hash = $1 WHERE username = $2;`,
      [hash, username]
    );
    
    console.log(`✓ Updated ${result.rowCount} row(s)`);
    console.log('\nYou can now login with:');
    console.log(`  Email: anishkalai2006@gmail.com`);
    console.log(`  Password: anish123\n`);
    
  } catch (error) {
    console.error('Error updating hash:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

updateHash();
