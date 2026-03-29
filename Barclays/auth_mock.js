/**
 * Mock Authentication Service
 * Fallback authentication when database is unavailable
 * Used for demo/testing purposes
 */

// Mock analyst database
const mockAnalysts = {
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
  'john.doe@barclays.com': {
    analyst_id: 1,
    username: 'analyst1',
    email: 'john.doe@barclays.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    role: 'ANALYST',
    department: 'AML',
  },
  'jane.smith@barclays.com': {
    analyst_id: 2,
    username: 'analyst2',
    email: 'jane.smith@barclays.com',
    password: 'password123',
    first_name: 'Jane',
    last_name: 'Smith',
    full_name: 'Jane Smith',
    role: 'SENIOR_ANALYST',
    department: 'AML',
  },
  'admin@barclays.com': {
    analyst_id: 3,
    username: 'admin1',
    email: 'admin@barclays.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    full_name: 'Admin User',
    role: 'ADMIN',
    department: 'IT',
  },
  'reviewer@barclays.com': {
    analyst_id: 4,
    username: 'reviewer1',
    email: 'reviewer@barclays.com',
    password: 'password123',
    first_name: 'Review',
    last_name: 'Officer',
    full_name: 'Review Officer',
    role: 'REVIEWER',
    department: 'Compliance',
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
