/**
 * Quick setup - use existing backend connection config
 * Run: node quick_auth_setup.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Use exact same config as server.js
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'barclays_aml',
  user: process.env.DB_USER || 'barclays_app',
  password: process.env.DB_PASSWORD || 'anish@123',  // Updated default password
  ssl: process.env.DB_SSL === 'true',
};

const pool = new Pool(config);

// Check if table already exists and use right approach
const checkAndCreateTable = `
DO $$
BEGIN
  -- Create analysts table if it doesn't exist
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
  
  -- Create login_log table if it doesn't exist
  CREATE TABLE IF NOT EXISTS login_log (
    login_id SERIAL PRIMARY KEY,
    analyst_id INT REFERENCES analysts(analyst_id),
    login_time TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAILED', 'LOCKED')),
    failure_reason VARCHAR(255)
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_analysts_username ON analysts(username);
  CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);
  CREATE INDEX IF NOT EXISTS idx_analysts_session_id ON analysts(session_id);
  CREATE INDEX IF NOT EXISTS idx_analysts_is_active ON analysts(is_active);
  CREATE INDEX IF NOT EXISTS idx_analysts_role ON analysts(role);
  CREATE INDEX IF NOT EXISTS idx_analysts_last_login ON analysts(last_login DESC);
  
  RAISE NOTICE 'Tables created successfully';
END $$;
`;

const insertData = `
INSERT INTO analysts (username, email, password_hash, first_name, last_name, full_name, role, department, is_active, created_at, updated_at) 
VALUES  
('analyst1', 'john.doe@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'John', 'Doe', 'John Doe', 'ANALYST', 'AML', true, NOW(), NOW()),
('analyst2', 'jane.smith@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Jane', 'Smith', 'Jane Smith', 'SENIOR_ANALYST', 'AML', true, NOW(), NOW()),
('admin1', 'admin@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Admin', 'User', 'Admin User', 'ADMIN', 'IT', true, NOW(), NOW()),
('reviewer1', 'reviewer@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Review', 'Officer', 'Review Officer', 'REVIEWER', 'Compliance', true, NOW(), NOW()),
('anish_kalai', 'anishkalai2006@gmail.com', '$2b$10$PnXv.GORlFsDXOvJlAh3I.nhYd1.A5GIVvkzweDdhg9VUGLPyAL3i', 'Anish', 'Kalai', 'Anish Kalai', 'ANALYST', 'AML', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
`;

async function setup() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('\n========================================');
    console.log('QUICK AUTHENTICATION SETUP');
    console.log('========================================\n');
    
    console.log('Creating tables...');
    await client.query(checkAndCreateTable);
    console.log('✓ Tables created');
    
    console.log('\nInserting test data...');
    const result = await client.query(insertData);
    console.log('✓ Test data inserted/updated');
    
    console.log('\n========================================');
    console.log('✓ SETUP COMPLETE');
    console.log('========================================\n');
    
    console.log('🎉 You can now login with:');
    console.log('  Email: anishkalai2006@gmail.com');
    console.log('  Password: anish123\n');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

setup();
