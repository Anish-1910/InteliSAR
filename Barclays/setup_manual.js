/**
 * Direct table creation script
 * This script directly creates the analysts table without permission checks
 * by using raw SQL that PostgreSQL admin can execute
 */

const fs = require('fs');
const path = require('path');

// Read the postgres_setup.sql to extract the analysts table creation SQL
const setupSQL = fs.readFileSync('./postgres_setup.sql', 'utf8');

// Extract just the analysts table and login_log table creation and insert statements
const lines = setupSQL.split('\n');
let tableSQL = '';
let inAnalystsSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Look for test analysts data section
  if (line.includes('INSERT INTO analysts')) {
    inAnalystsSection = true;
  }
  
  if (inAnalystsSection) {
    tableSQL += line + '\n';
    if (line.trim().endsWith(';')) {
      break;
    }
  }
}

console.log('');
console.log('========================================');
console.log('MANUAL SETUP INSTRUCTIONS');
console.log('========================================\n');

console.log('Execute this SQL directly in PostgreSQL:\n');
console.log('------- ANALYSTS TABLE -------\n');

const createAnalystsSQL = `
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

-- Insert test data
INSERT INTO analysts (username, email, password_hash, first_name, last_name, full_name, role, department, is_active, created_at, updated_at) VALUES
('analyst1', 'john.doe@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'John', 'Doe', 'John Doe', 'ANALYST', 'AML', true, NOW(), NOW()),
('analyst2', 'jane.smith@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Jane', 'Smith', 'Jane Smith', 'SENIOR_ANALYST', 'AML', true, NOW(), NOW()),
('admin1', 'admin@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Admin', 'User', 'Admin User', 'ADMIN', 'IT', true, NOW(), NOW()),
('reviewer1', 'reviewer@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Review', 'Officer', 'Review Officer', 'REVIEWER', 'Compliance', true, NOW(), NOW()),
('anish_kalai', 'anishkalai2006@gmail.com', '$2b$10$PnXv.GORlFsDXOvJlAh3I.nhYd1.A5GIVvkzweDdhg9VUGLPyAL3i', 'Anish', 'Kalai', 'Anish Kalai', 'ANALYST', 'AML', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
`;

console.log(createAnalystsSQL);

console.log('\n------- OR SAVE TO FILE AND RUN -------\n');
console.log('1. Save the above SQL to a file: create_analysts.sql');
console.log('2. Run as PostgreSQL admin:');
console.log('   psql -U postgres -h localhost -d barclays_aml -f create_analysts.sql');
console.log('\n');

// Also save to file for convenience
fs.writeFileSync('./create_analysts_tables.sql', createAnalystsSQL);
console.log('✓ SQL saved to: create_analysts_tables.sql\n');

console.log('========================================');
console.log('Alternative: Use this simplified update query');
console.log('========================================\n');

console.log(`
-- Verify the analysts table exists
SELECT COUNT(*) FROM analysts;

-- Check specifically for anish_kalai
SELECT analyst_id, username, email, role FROM analysts WHERE email = 'anishkalai2006@gmail.com';

-- IF table doesn't exist yet, ask your database admin to run create_analysts_tables.sql
`);
