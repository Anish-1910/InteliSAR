/**
 * Mock Authentication Service
 * Fallback authentication when database is unavailable
 * Used for demo/testing purposes
 */

// Mock analyst database
// These match the credentials in frontend/src/data/users.json
const mockAnalysts = {
  // Analyser credentials
  'analyser@intelisar.com': {
    analyst_id: 1,
    username: 'analyser',
    email: 'analyser@intelisar.com',
    password: 'analyser123',
    first_name: 'Fraud',
    last_name: 'Analyst',
    full_name: 'Fraud Analyst',
    role: 'ANALYST',
    department: 'AML',
  },
  'senior.analyser@intelisar.com': {
    analyst_id: 2,
    username: 'senior_analyser',
    email: 'senior.analyser@intelisar.com',
    password: 'senior123',
    first_name: 'Senior',
    last_name: 'Analyst',
    full_name: 'Senior Fraud Analyst',
    role: 'SENIOR_ANALYST',
    department: 'AML',
  },
  // Admin credentials
  'admin@intelisar.com': {
    analyst_id: 3,
    username: 'admin',
    email: 'admin@intelisar.com',
    password: 'admin123',
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    role: 'ADMIN',
    department: 'IT',
  },
  'superadmin@intelisar.com': {
    analyst_id: 4,
    username: 'superadmin',
    email: 'superadmin@intelisar.com',
    password: 'super123',
    first_name: 'Super',
    last_name: 'Administrator',
    full_name: 'Super Administrator',
    role: 'ADMIN',
    department: 'IT',
  },
  // Legacy credentials (keep for backward compatibility)
  'anishkalai2006@gmail.com': {
    analyst_id: 5,
    username: 'anish_kalai',
    email: 'anishkalai2006@gmail.com',
    password: 'anish123',
    first_name: 'Anish',
    last_name: 'Kalai',
    full_name: 'Anish Kalai',
    role: 'ANALYST',
    department: 'AML',
  },
};

/**
 * Mock API - Authenticate user
 * Returns JWT-like token for frontend
 */
function mockLogin(email, password) {
  const analyst = mockAnalysts[email.toLowerCase()];
  
  if (!analyst) {
    throw new Error('Invalid username or password');
  }
  
  if (analyst.password !== password) {
    throw new Error('Invalid username or password');
  }
  
  // Return mock response compatible with real auth endpoint
  return {
    status: 'success',
    message: 'Login successful',
    token: 'mock_token_' + Buffer.from(JSON.stringify(analyst)).toString('base64'),
    analyst: {
      analyst_id: analyst.analyst_id,
      username: analyst.username,
      email: analyst.email,
      full_name: analyst.full_name,
      role: analyst.role,
      department: analyst.department,
    },
    expires_in: '24h',
  };
}

/**
 * Mock API - Get current user
 */
function mockGetMe(token) {
  try {
    const decoded = Buffer.from(token.replace('mock_token_', ''), 'base64').toString();
    const analyst = JSON.parse(decoded);
    return {
      status: 'success',
      analyst: {
        analyst_id: analyst.analyst_id,
        username: analyst.username,
        email: analyst.email,
        full_name: analyst.full_name,
        role: analyst.role,
        department: analyst.department,
        is_active: true,
        is_locked: false,
        created_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  mockLogin,
  mockGetMe,
  mockAnalysts,
};
