/**
 * Failsafe PostgreSQL Setup
 * Tries multiple database credential combinations
 */

const { Pool } = require('pg');

// Array of connection configs to try
const configs = [
  {
    name: 'postgres (no password)',
    user: 'postgres',
    password: '',
    database: 'barclays_aml'
  },
  {
    name: 'postgres (postgres)',
    user: 'postgres',
    password: 'postgres',
    database: 'barclays_aml'
  },
  {
    name: 'barclays_app (anish@123)',
    user: 'barclays_app',
    password: 'anish@123',
    database: 'barclays_aml'
  },
  {
    name: 'barclays_app (no password)',
    user: 'barclays_app',
    password: '',
    database: 'barclays_aml'
  },
];

const createAnalystsTableSQL = `
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

CREATE INDEX IF NOT EXISTS idx_analysts_username ON analysts(username);
CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);
CREATE INDEX IF NOT EXISTS idx_analysts_session_id ON analysts(session_id);
CREATE INDEX IF NOT EXISTS idx_analysts_is_active ON analysts(is_active);
CREATE INDEX IF NOT EXISTS idx_analysts_role ON analysts(role);
CREATE INDEX IF NOT EXISTS idx_analysts_last_login ON analysts(last_login DESC);

INSERT INTO analysts (username, email, password_hash, first_name, last_name, full_name, role, department, is_active, created_at, updated_at) VALUES
('analyst1', 'john.doe@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'John', 'Doe', 'John Doe', 'ANALYST', 'AML', true, NOW(), NOW()),
('analyst2', 'jane.smith@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Jane', 'Smith', 'Jane Smith', 'SENIOR_ANALYST', 'AML', true, NOW(), NOW()),
('admin1', 'admin@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Admin', 'User', 'Admin User', 'ADMIN', 'IT', true, NOW(), NOW()),
('reviewer1', 'reviewer@barclays.com', '$2b$10$w7cEuM7vjqO1K1q0Q0q0a.example', 'Review', 'Officer', 'Review Officer', 'REVIEWER', 'Compliance', true, NOW(), NOW()),
('anish_kalai', 'anishkalai2006@gmail.com', '$2b$10$PnXv.GORlFsDXOvJlAh3I.nhYd1.A5GIVvkzweDdhg9VUGLPyAL3i', 'Anish', 'Kalai', 'Anish Kalai', 'ANALYST', 'AML', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
`;

async function trySetup(config) {
  return new Promise((resolve) => {
    const pool = new Pool({
      user: config.user,
      password: config.password,
      host: 'localhost',
      port: 5432,
      database: config.database,
      connectionTimeoutMillis: 3000,
    });

    pool.connect()
      .then(client => {
        console.log(`✓ Connected as: ${config.name}`);
        
        return client.query(createAnalystsTableSQL)
          .then(() => {
            console.log(`✓ Tables created successfully!\n`);
            client.release();
            pool.end();
            resolve({ success: true, config });
          })
          .catch(err => {
            console.log(`✗ Setup failed: ${err.message}\n`);
            client.release();
            pool.end();
            resolve({ success: false, config });
          });
      })
      .catch(err => {
        console.log(`✗ Connection failed: ${err.message}\n`);
        pool.end();
        resolve({ success: false, config });
      });
  });
}

async function main() {
  console.log('\n========================================');
  console.log('POSTGRESQL SETUP - TRYING ALL CONFIGS');
  console.log('========================================\n');

  for (const config of configs) {
    console.log(`Trying: ${config.name}`);
    const result = await trySetup(config);
    
    if (result.success) {
      console.log('✅ SUCCESS!\n');
      console.log('🎉 Authentication tables are now ready!\n');
      console.log('You can login with:');
      console.log('  Email: anishkalai2006@gmail.com');
      console.log('  Password: anish123\n');
      process.exit(0);
    }
  }

  console.log('❌ All configuration attempts failed.\n');
  console.log('Possible solutions:');
  console.log('1. Verify PostgreSQL is running');
  console.log('2. Check database password in .env file');
  console.log('3. Run as database admin and execute create_analysts_tables.sql');
  console.log('\nGenerated SQL file: create_analysts_tables.sql');
  process.exit(1);
}

main();
