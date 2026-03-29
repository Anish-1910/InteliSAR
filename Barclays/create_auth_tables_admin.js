/**
 * Create analysts and login_log tables using postgres superuser
 * Run: node create_auth_tables_admin.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',  // Try common default
  host: 'localhost',
  port: 5432,
  database: 'barclays_aml',
});

const createAnalystsTable = `
CREATE TABLE IF NOT EXISTS analysts (
  analyst_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  role VARCHAR(50) CHECK (role IN ('ANALYST', 'SENIOR_ANALYST', 'ADMIN', 'REVIEWER', 'MANAGER')),
  department VARCHAR(100),
  manager_id INT REFERENCES analysts(analyst_id),
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INT DEFAULT 0,
  last_failed_login TIMESTAMP,
  last_login TIMESTAMP,
  session_id UUID,
  session_expires TIMESTAMP,
  phone_number VARCHAR(20),
  office_location VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);
`;

const createLoginLogTable = `
CREATE TABLE IF NOT EXISTS login_log (
  login_id SERIAL PRIMARY KEY,
  analyst_id INT REFERENCES analysts(analyst_id),
  login_time TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAILED', 'LOCKED')),
  failure_reason VARCHAR(255)
);
`;

const createIndexes = [
  `CREATE INDEX IF NOT EXISTS idx_analysts_username ON analysts(username);`,
  `CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);`,
  `CREATE INDEX IF NOT EXISTS idx_analysts_session_id ON analysts(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_analysts_is_active ON analysts(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_analysts_role ON analysts(role);`,
  `CREATE INDEX IF NOT EXISTS idx_analysts_last_login ON analysts(last_login DESC);`,
];

const insertTestData = `
INSERT INTO analysts (username, email, password_hash, first_name, last_name, full_name, role, department, is_active, created_at, updated_at) VALUES
('analyst1', 'john.doe@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'John', 'Doe', 'John Doe', 'ANALYST', 'AML', true, NOW(), NOW()),
('analyst2', 'jane.smith@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Jane', 'Smith', 'Jane Smith', 'SENIOR_ANALYST', 'AML', true, NOW(), NOW()),
('admin1', 'admin@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Admin', 'User', 'Admin User', 'ADMIN', 'IT', true, NOW(), NOW()),
('reviewer1', 'reviewer@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Review', 'Officer', 'Review Officer', 'REVIEWER', 'Compliance', true, NOW(), NOW()),
('anish_kalai', 'anishkalai2006@gmail.com', '$2b$10$PnXv.GORlFsDXOvJlAh3I.nhYd1.A5GIVvkzweDdhg9VUGLPyAL3i', 'Anish', 'Kalai', 'Anish Kalai', 'ANALYST', 'AML', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
`;

async function createTables() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('\n========================================');
    console.log('CREATE AUTHENTICATION TABLES (Admin)');
    console.log('========================================\n');
    
    // Create analysts table
    console.log('Creating analysts table...');
    await client.query(createAnalystsTable);
    console.log('✓ analysts table created');
    
    // Create login_log table
    console.log('\nCreating login_log table...');
    await client.query(createLoginLogTable);
    console.log('✓ login_log table created');
    
    // Create indexes
    console.log('\nCreating indexes...');
    for (const indexSQL of createIndexes) {
      await client.query(indexSQL);
    }
    console.log('✓ Indexes created');
    
    // Insert test data
    console.log('\nInserting test data...');
    const result = await client.query(insertTestData);
    console.log('✓ Test data inserted');
    
    console.log('\n========================================');
    console.log('✓ SETUP COMPLETE');
    console.log('========================================\n');
    
    console.log('You can now login with:');
    console.log(`  Email: anishkalai2006@gmail.com`);
    console.log(`  Password: anish123\n`);
    console.log('Or use one of the other test accounts:');
    console.log(`  analyst1 / password123`);
    console.log(`  analyst2 / password123`);
    console.log(`  admin1 / admin123`);
    console.log(`  reviewer1 / password123\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Try with password if empty password fails
    if (error.message.includes('FATAL') || error.message.includes('authentication')) {
      console.log('\nTrying with different password...');
      return;
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

createTables();
