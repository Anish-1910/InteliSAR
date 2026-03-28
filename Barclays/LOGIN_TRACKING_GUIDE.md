# User Login Tracking System
## Barclays AML Fraud Detection System

**Date Created:** March 29, 2026
**Purpose:** Track and audit all user login/logout activities for security compliance

---

## 1. Overview

The login tracking system maintains a complete audit trail of all user access to the AML platform. This ensures compliance with regulatory requirements for access control and provides forensic capabilities to investigate unauthorized access attempts.

### Features:
- ✅ Login/logout timestamp tracking
- ✅ Unique session identification
- ✅ IP address and device tracking
- ✅ Login success/failure recording
- ✅ Failed attempt counting
- ✅ Session duration calculation
- ✅ Browser/client identification
- ✅ Geolocation tracking (optional)

---

## 2. Database Schema

### login_log Table Structure

```sql
CREATE TABLE login_log (
    login_id SERIAL PRIMARY KEY,           -- Auto-incrementing unique identifier
    user_id VARCHAR(255) NOT NULL,         -- Analyst or system user ID
    username VARCHAR(255) NOT NULL,        -- Username for easy reference
    role VARCHAR(50),                      -- ANALYST, ADMIN, REVIEWER, SYSTEM
    
    -- Login Details
    login_timestamp TIMESTAMP DEFAULT NOW(),    -- When user logged in
    logout_timestamp TIMESTAMP,                 -- When user logged out (nullable)
    session_id VARCHAR(255) NOT NULL UNIQUE,   -- Unique session identifier
    session_duration_seconds INT,               -- Duration in seconds (calculated on logout)
    
    -- Security Details
    ip_address VARCHAR(45),                     -- IPv4 or IPv6 address
    user_agent TEXT,                            -- Browser/client information
    device_type VARCHAR(50),                    -- WEB, MOBILE, API, DESKTOP
    location VARCHAR(255),                      -- Geolocation if available
    
    -- Login Status
    login_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',  -- SUCCESS, FAILED, TIMEOUT
    failure_reason VARCHAR(255),                -- Reason if login failed
    failed_attempts_before_this INT DEFAULT 0,  -- Number of failed attempts before success
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

| Index | Columns | Use Case |
|---|---|---|
| `idx_login_log_user_id` | user_id | Find all logins by specific user |
| `idx_login_log_username` | username | Search by username |
| `idx_login_log_login_timestamp` | login_timestamp DESC | Recent login activity |
| `idx_login_log_session_id` | session_id | Quick session lookup |
| `idx_login_log_status` | login_status | Filter by success/failure |
| `idx_login_log_ip_address` | ip_address | Track logins from specific IP |

---

## 3. API Functions

### 3.1 log_user_login()

**Purpose:** Record a user login attempt (successful or failed)

**Function Signature:**
```sql
log_user_login(
    p_user_id VARCHAR(255),
    p_username VARCHAR(255),
    p_role VARCHAR(50),
    p_ip_address VARCHAR(45),
    p_user_agent TEXT,
    p_device_type VARCHAR(50),
    p_location VARCHAR(255),
    p_login_status VARCHAR(50) DEFAULT 'SUCCESS',
    p_failure_reason VARCHAR(255) DEFAULT NULL,
    p_failed_attempts INT DEFAULT 0
)
RETURNS VARCHAR(255)  -- Returns session_id
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| p_user_id | VARCHAR(255) | ✅ Yes | Unique user identifier (e.g., ANA_001, ADMIN_001) |
| p_username | VARCHAR(255) | ✅ Yes | Username for easy reference (e.g., john.smith) |
| p_role | VARCHAR(50) | ✅ Yes | User role (ANALYST, ADMIN, REVIEWER, SYSTEM) |
| p_ip_address | VARCHAR(45) | ✅ Yes | Client IP address (IPv4 or IPv6) |
| p_user_agent | TEXT | ✅ Yes | Browser/client info (from HTTP header) |
| p_device_type | VARCHAR(50) | ✅ Yes | Device type (WEB, MOBILE, API, DESKTOP) |
| p_location | VARCHAR(255) | ✅ Yes | Geographic location if available |
| p_login_status | VARCHAR(50) | ❌ No | SUCCESS, FAILED, TIMEOUT (default: SUCCESS) |
| p_failure_reason | VARCHAR(255) | ❌ No | Reason for failure (invalid password, account locked, etc.) |
| p_failed_attempts | INT | ❌ No | Number of failed attempts before this login |

**Return Value:** 
- Session ID (VARCHAR): Unique identifier for this session, used for logout tracking

**Example Usage:**

```javascript
// Node.js/JavaScript Example
const sessionId = await pool.query(
    'SELECT log_user_login($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [
        'ANA_001',                          // user_id
        'john.smith',                       // username
        'ANALYST',                          // role
        '192.168.1.100',                   // ip_address
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',  // user_agent
        'WEB',                              // device_type
        'New York, USA',                    // location
        'SUCCESS',                          // login_status
        null,                               // failure_reason
        0                                   // failed_attempts
    ]
);

// Store sessionId in user session for logout tracking
req.session.sessionId = sessionId.rows[0].log_user_login;
```

### 3.2 log_user_logout()

**Purpose:** Record a user logout and calculate session duration

**Function Signature:**
```sql
log_user_logout(p_session_id VARCHAR(255))
RETURNS BOOLEAN  -- Returns TRUE if success, FALSE if session not found
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| p_session_id | VARCHAR(255) | ✅ Yes | Session ID returned from log_user_login() |

**Return Value:**
- BOOLEAN: TRUE if logout recorded successfully, FALSE if session not found or already logged out

**Example Usage:**

```javascript
// Node.js/JavaScript Example
const result = await pool.query(
    'SELECT log_user_logout($1)',
    ['SESSION_2026-03-29-14-35-22-123456_a1b2c3d4e5f6']
);

if (result.rows[0].log_user_logout === true) {
    console.log('User logged out successfully');
} else {
    console.log('Session not found or already logged out');
}
```

---

## 4. Integration with Backend

### 4.1 Login Endpoint (Express.js Example)

```javascript
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    user: 'barclays_app',
    password: 'change_me_to_secure_password',
    host: 'localhost',
    port: 5432,
    database: 'barclays_aml'
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Validate credentials (implement your auth logic)
        const user = await authenticateUser(username, password);
        
        if (!user) {
            // Log failed login attempt
            await pool.query(
                'SELECT log_user_login($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [
                    'UNKNOWN',                  // user_id
                    username,                   // username
                    'UNKNOWN',                  // role
                    req.ip,                     // ip_address
                    req.get('user-agent'),      // user_agent
                    'WEB',                      // device_type
                    await getLocation(req.ip),  // location
                    'FAILED',                   // login_status
                    'Invalid credentials',      // failure_reason
                    0                           // failed_attempts
                ]
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Log successful login
        const loginResult = await pool.query(
            'SELECT log_user_login($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
                user.user_id,                  // user_id
                user.username,                 // username
                user.role,                     // role
                req.ip,                        // ip_address
                req.get('user-agent'),         // user_agent
                'WEB',                         // device_type
                await getLocation(req.ip),     // location
                'SUCCESS',                     // login_status
                null,                          // failure_reason
                0                              // failed_attempts
            ]
        );
        
        const sessionId = loginResult.rows[0].log_user_login;
        
        // Store in session
        req.session.userId = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.sessionId = sessionId;
        
        res.json({
            success: true,
            user: user,
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
```

### 4.2 Logout Endpoint (Express.js Example)

```javascript
// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { sessionId } = req.session;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'No active session' });
        }
        
        // Log user logout
        const result = await pool.query(
            'SELECT log_user_logout($1)',
            [sessionId]
        );
        
        if (result.rows[0].log_user_logout !== true) {
            console.warn('Failed to log logout for session:', sessionId);
        }
        
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

---

## 5. Query Examples

### 5.1 Get All Login Activity for a User

```sql
-- View complete login history for a specific user
SELECT 
    login_id,
    username,
    login_timestamp,
    logout_timestamp,
    session_duration_seconds,
    ip_address,
    device_type,
    location,
    login_status,
    failure_reason
FROM login_log
WHERE user_id = 'ANA_001'
ORDER BY login_timestamp DESC;
```

### 5.2 Get Recent Active Sessions

```sql
-- Find sessions still active (not logged out)
SELECT 
    session_id,
    username,
    user_id,
    login_timestamp,
    ip_address,
    device_type,
    EXTRACT(EPOCH FROM (NOW() - login_timestamp))::INT as seconds_active
FROM login_log
WHERE logout_timestamp IS NULL
    AND login_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY login_timestamp DESC;
```

### 5.3 Get Failed Login Attempts

```sql
-- View all failed login attempts in the last 24 hours
SELECT 
    login_id,
    username,
    login_timestamp,
    failure_reason,
    ip_address,
    device_type,
    location
FROM login_log
WHERE login_status = 'FAILED'
    AND login_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY login_timestamp DESC;
```

### 5.4 Get Login Statistics by User

```sql
-- Statistics for each user
SELECT 
    username,
    COUNT(*) as total_logins,
    SUM(CASE WHEN login_status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_logins,
    SUM(CASE WHEN login_status = 'FAILED' THEN 1 ELSE 0 END) as failed_logins,
    AVG(session_duration_seconds) as avg_session_duration,
    MAX(login_timestamp) as last_login
FROM login_log
WHERE login_timestamp > NOW() - INTERVAL '30 days'
GROUP BY username
ORDER BY total_logins DESC;
```

### 5.5 Get Logins from Unusual Locations

```sql
-- Find logins from new/unusual locations for a user
WITH user_locations AS (
    SELECT 
        user_id,
        location,
        COUNT(*) as login_count
    FROM login_log
    WHERE login_status = 'SUCCESS'
    GROUP BY user_id, location
)
SELECT 
    ll.login_id,
    ll.username,
    ll.login_timestamp,
    ll.location,
    ll.ip_address,
    ul.login_count as logins_from_this_location
FROM login_log ll
LEFT JOIN user_locations ul ON ll.user_id = ul.user_id AND ll.location = ul.location
WHERE ll.login_status = 'SUCCESS'
    AND ul.login_count <= 2  -- New or infrequent location
    AND ll.login_timestamp > NOW() - INTERVAL '7 days'
ORDER BY ll.login_timestamp DESC;
```

### 5.6 Get Session Duration Statistics

```sql
-- Analyze session patterns
SELECT 
    username,
    role,
    COUNT(*) as total_sessions,
    MIN(session_duration_seconds) as min_duration,
    AVG(session_duration_seconds)::INT as avg_duration,
    MAX(session_duration_seconds) as max_duration,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY session_duration_seconds)::INT as median_duration
FROM login_log
WHERE logout_timestamp IS NOT NULL
    AND login_timestamp > NOW() - INTERVAL '30 days'
GROUP BY username, role
ORDER BY avg_duration DESC;
```

---

## 6. Security Considerations

### 6.1 Data Protection
- ✅ Store IP addresses (PII) with appropriate access controls
- ✅ Do not log passwords or sensitive credentials
- ✅ Encrypt user_agent if containing sensitive info
- ✅ Hash session_id if needed for additional security

### 6.2 Retention Policy
- **Recommended:** Keep login logs for minimum 90 days
- **Compliance:** AML regulations may require longer retention
- **Archive:** Move older logs to archive table after 1 year

```sql
-- Example archival query (run monthly)
INSERT INTO login_log_archive
SELECT * FROM login_log
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM login_log
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 6.3 Monitoring Alerts
Consider alerting on:
- Multiple failed login attempts from same IP
- Login from new geographic location
- Session timeout violations
- Unusual login times for analyst
- Logins from multiple locations simultaneously

---

## 7. Audit Log Integration

Login events are automatically logged to the `audit_log` table:

```sql
-- View audit trail for user logins
SELECT 
    log_id,
    action_type,      -- 'USER_LOGIN' or 'USER_LOGOUT'
    new_values,       -- Contains user_id, username, ip_address, device_type
    changed_by,       -- User ID who logged in/out
    change_timestamp
FROM audit_log
WHERE action_type IN ('USER_LOGIN', 'USER_LOGOUT')
    AND change_timestamp > NOW() - INTERVAL '7 days'
ORDER BY change_timestamp DESC;
```

---

## 8. Testing

### 8.1 Test Login Function

```sql
-- Test successful login
SELECT log_user_login(
    'TEST_ANA_001',
    'test.analyst',
    'ANALYST',
    '192.168.1.1',
    'Mozilla/5.0 Test Browser',
    'WEB',
    'Test Location',
    'SUCCESS',
    NULL,
    0
);

-- Test failed login
SELECT log_user_login(
    'UNKNOWN',
    'test.analyst',
    'ANALYST',
    '192.168.1.2',
    'Mozilla/5.0 Test Browser',
    'WEB',
    'Test Location',
    'FAILED',
    'Invalid password',
    1
);
```

### 8.2 Test Logout Function

```sql
-- Get the session_id from a recent login
SELECT session_id FROM login_log 
WHERE user_id = 'TEST_ANA_001' 
ORDER BY login_timestamp DESC LIMIT 1;

-- Logout using that session_id
SELECT log_user_logout('SESSION_2026-03-29-14-35-22-123456_a1b2c3d4e5f6');

-- Verify logout was recorded
SELECT * FROM login_log 
WHERE session_id = 'SESSION_2026-03-29-14-35-22-123456_a1b2c3d4e5f6';
```

---

## 9. Reporting & Analytics

### 9.1 Daily Login Report

```sql
-- Generate daily login summary
SELECT 
    DATE(login_timestamp) as login_date,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_logins,
    COUNT(DISTINCT CASE WHEN login_status = 'SUCCESS' THEN user_id END) as users_with_success,
    COUNT(CASE WHEN login_status = 'FAILED' THEN 1 END) as failed_attempts,
    COUNT(DISTINCT device_type) as device_types_used,
    COUNT(DISTINCT ip_address) as unique_ips
FROM login_log
WHERE login_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(login_timestamp)
ORDER BY login_date DESC;
```

### 9.2 User Behavior Anomaly Report

```sql
-- Detect unusual login patterns
WITH user_stats AS (
    SELECT 
        user_id,
        username,
        COUNT(*) as avg_logins_per_day,
        AVG(EXTRACT(HOUR FROM login_timestamp)) as avg_login_hour
    FROM login_log
    WHERE login_timestamp > NOW() - INTERVAL '30 days'
    GROUP BY user_id, username
)
SELECT 
    ll.login_id,
    ll.username,
    ll.login_timestamp,
    EXTRACT(HOUR FROM ll.login_timestamp) as login_hour,
    us.avg_login_hour,
    ABS(EXTRACT(HOUR FROM ll.login_timestamp) - us.avg_login_hour) as hour_deviation,
    ll.ip_address,
    ll.location
FROM login_log ll
JOIN user_stats us ON ll.user_id = us.user_id
WHERE ll.login_timestamp > NOW() - INTERVAL '3 days'
    AND ABS(EXTRACT(HOUR FROM ll.login_timestamp) - us.avg_login_hour) > 6
ORDER BY hour_deviation DESC;
```

---

## 10. Maintenance

### 10.1 Regular Monitoring

```sql
-- Monitor login_log table size
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as table_size,
    (SELECT COUNT(*) FROM login_log) as total_records
FROM information_schema.tables
WHERE table_name = 'login_log';
```

### 10.2 Optimize Performance

```sql
-- Analyze table regularly for query optimization
ANALYZE login_log;

-- Vacuum to reclaim space
VACUUM ANALYZE login_log;
```

---

## Summary

The login tracking system provides:
- ✅ Complete audit trail of user access
- ✅ Session management with unique IDs
- ✅ Failed attempt tracking for security
- ✅ Geolocation and device tracking
- ✅ Session duration metrics
- ✅ Integration with audit_log for compliance
- ✅ Easy integration with Node.js/Express backend

All login events are automatically captured in both `login_log` table and `audit_log` table for redundant audit trail security.
