# Barclays AML - Authentication & Analyst Login System

## Overview

The authentication system provides secure login functionality for analysts and staff members using JWT (JSON Web Tokens) for session management. This document explains the authentication architecture, endpoints, and usage patterns.

---

## Database Schema

### 1. Analysts Table
Primary table storing analyst credentials and role information.

```sql
CREATE TABLE analysts (
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
```

**Key Security Features:**
- `password_hash`: Stores bcrypt-hashed passwords (never plain text)
- `is_locked`: Account lockout after 5 failed login attempts
- `session_id`: Unique session identifier per login
- `session_expires`: Session expiration time (24 hours from login)
- `failed_login_attempts`: Tracks failed login attempts

### 2. Login Log Table
Audit trail for all login attempts.

```sql
CREATE TABLE login_log (
  login_id SERIAL PRIMARY KEY,
  analyst_id INT REFERENCES analysts(analyst_id),
  login_time TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAILED', 'LOCKED')),
  failure_reason VARCHAR(255)
);
```

### 3. Performance Indexes

```sql
CREATE INDEX idx_analysts_username ON analysts(username);
CREATE INDEX idx_analysts_email ON analysts(email);
CREATE INDEX idx_analysts_session_id ON analysts(session_id);
CREATE INDEX idx_analysts_is_active ON analysts(is_active);
CREATE INDEX idx_analysts_role ON analysts(role);
CREATE INDEX idx_analysts_last_login ON analysts(last_login);
```

---

## Test Data

The following test analysts are pre-loaded in `postgres_setup.sql`:

| Username  | Email                    | Role           | Password      |
|-----------|--------------------------|----------------|---------------|
| analyst1  | john.doe@barclays.com    | ANALYST        | password123   |
| analyst2  | jane.smith@barclays.com  | SENIOR_ANALYST | password123   |
| admin1    | admin@barclays.com       | ADMIN          | admin123      |
| reviewer1 | reviewer@barclays.com    | REVIEWER       | password123   |

**IMPORTANT:** Test password hashes are placeholders. In production, use proper bcrypt hashes.

---

## Authentication Endpoints

### 1. POST /api/auth/login
**Authenticate analyst and create JWT session**

**Request:**
```json
{
  "username": "analyst1",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "analyst": {
    "analyst_id": 1,
    "username": "analyst1",
    "email": "john.doe@barclays.com",
    "full_name": "John Doe",
    "role": "ANALYST",
    "department": "AML"
  },
  "expires_in": "24h"
}
```

**Response (Failure - 401):**
```json
{
  "error": "Invalid username or password"
}
```

**Response (Account Locked - 403):**
```json
{
  "error": "Account is locked. Contact administrator."
}
```

**Security Features:**
- Password is verified using bcrypt comparison
- Failed login attempts are tracked
- Account locks after 5 failed attempts
- Session ID and expiration are recorded in database
- Login attempt is logged with IP address

---

### 2. POST /api/auth/logout
**End analyst session and clear session data**

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Logout successful"
}
```

**Security Features:**
- Requires valid JWT token
- Clears session_id and session_expires from database
- Logs logout event

---

### 3. GET /api/auth/me
**Get current analyst information**

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "analyst": {
    "analyst_id": 1,
    "username": "analyst1",
    "email": "john.doe@barclays.com",
    "full_name": "John Doe",
    "role": "ANALYST",
    "department": "AML",
    "is_active": true,
    "is_locked": false,
    "last_login": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-10T12:00:00Z"
  }
}
```

**Security Features:**
- Requires valid JWT token
- Returns only non-sensitive data (no passwords)
- Verifies analyst is still active

---

### 4. POST /api/auth/refresh
**Refresh JWT token (extend session)**

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Token refreshed",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h"
}
```

**Security Features:**
- Requires valid JWT token
- Issues new token with fresh 24-hour expiration
- Old token remains valid until it expires

---

## JWT Token Structure

JWT tokens use HS256 signing algorithm and contain the following claims:

```json
{
  "analyst_id": 1,
  "username": "analyst1",
  "email": "john.doe@barclays.com",
  "role": "ANALYST",
  "full_name": "John Doe",
  "iat": 1705310400,
  "exp": 1705396800
}
```

**Expiration:** 24 hours from issuance

---

## JWT Middleware

The `verifyJWT` middleware protects endpoints requiring authentication.

**Usage:**
```javascript
app.get('/api/protected-endpoint', verifyJWT, async (req, res) => {
  const { analyst_id, username, role } = req.analyst;
  // Access analyst info from req.analyst
});
```

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature and expiration
- Returns 401 if token is missing or invalid
- Passes analyst info to req.analyst

---

## Account Security Features

### 1. Password Hashing
- Passwords are hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Verified using bcrypt.compare()

### 2. Account Lockout
- Tracks failed login attempts
- Locks account after 5 failed attempts
- Records timestamp of last failed login
- Manual unlock required (admin operation)

### 3. Session Management
- Unique session ID generated per login
- Session expiration set to 24 hours
- Session data stored in database
- Can be invalidated by logout or admin action

### 4. Audit Logging
- All login attempts logged with:
  - Analyst ID
  - Timestamp
  - IP address
  - Success/failure status
  - Failure reason

---

## Implementation in Frontend

### 1. Login Component

```javascript
async function handleLogin(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (data.status === 'success') {
    localStorage.setItem('token', data.token);
    localStorage.setItem('analyst', JSON.stringify(data.analyst));
    // Redirect to dashboard
  }
}
```

### 2. Authenticated API Calls

```javascript
async function fetchAlerts() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/alerts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

### 3. Token Refresh

```javascript
async function refreshToken() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    localStorage.setItem('token', data.token);
  }
}
```

---

## Production Deployment Checklist

- [ ] Change JWT secret from default to strong random value
- [ ] Store JWT secret in environment variable
- [ ] Implement bcrypt password hashing (currently using test hashes)
- [ ] Update test analyst password hashes with real bcrypt hashes
- [ ] Enable HTTPS for all authentication endpoints
- [ ] Configure session timeout based on security policy
- [ ] Implement account lockout notifications to admins
- [ ] Set up monitoring for failed login attempts
- [ ] Configure backup authentication methods (2FA, etc.)
- [ ] Document password reset procedure
- [ ] Set up audit log retention policies

---

## Troubleshooting

### Token Expired Error
**Error:** "Invalid or expired token"  
**Solution:** Call `/api/auth/refresh` to get a new token

### Account Locked
**Error:** "Account is locked. Contact administrator."  
**Solution:** Admin must update analysts table: `UPDATE analysts SET is_locked = false WHERE analyst_id = X;`

### Failed Login Attempts
**Check failure reason:** Query login_log table for recent failed attempts
```sql
SELECT * FROM login_log 
WHERE analyst_id = X 
ORDER BY login_time DESC 
LIMIT 10;
```

---

## Role-Based Access Control (RBAC)

The system supports 5 analyst roles:

| Role           | Description                      |
|----------------|----------------------------------|
| ANALYST        | Standard analyst (basic access)  |
| SENIOR_ANALYST | Advanced permissions             |
| ADMIN          | Full system access               |
| REVIEWER       | SAR review and approval          |
| MANAGER        | Team management                  |

**Future Implementation:**
Endpoints should check `req.analyst.role` to enforce role-based permissions.

---

## Contact & Support

For authentication issues or questions:
- Database Admin: [Contact Info]
- Security Team: [Contact Info]
- Backend Team: [Contact Info]
