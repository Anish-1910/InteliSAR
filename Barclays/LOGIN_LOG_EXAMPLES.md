# Login Log Table - Practical Examples
## Barclays AML Fraud Detection System

---

## 1. Direct Insert Examples

### Example 1: Insert Successful Login

```sql
INSERT INTO login_log (
    user_id, username, role, ip_address, user_agent, 
    device_type, location, login_status, failed_attempts_before_this
) VALUES (
    'ANA_001',
    'john.smith',
    'ANALYST',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'WEB',
    'New York, USA',
    'SUCCESS',
    0
);
```

### Example 2: Insert Failed Login (Invalid Password)

```sql
INSERT INTO login_log (
    user_id, username, role, ip_address, user_agent,
    device_type, location, login_status, failure_reason, failed_attempts_before_this
) VALUES (
    'ANA_002',
    'sarah.johnson',
    'ANALYST',
    '10.0.0.50',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'WEB',
    'London, United Kingdom',
    'FAILED',
    'Invalid password',
    2
);
```

### Example 3: Insert Failed Login (Account Locked)

```sql
INSERT INTO login_log (
    user_id, username, role, ip_address, user_agent,
    device_type, location, login_status, failure_reason
) VALUES (
    'ADMIN_001',
    'admin.user',
    'ADMIN',
    '192.168.1.200',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'WEB',
    'San Francisco, USA',
    'FAILED',
    'Account locked - too many failed attempts'
);
```

### Example 4: Insert Mobile App Login

```sql
INSERT INTO login_log (
    user_id, username, role, ip_address, user_agent,
    device_type, location, login_status, failed_attempts_before_this
) VALUES (
    'REV_001',
    'michael.chen',
    'REVIEWER',
    '203.0.113.45',
    'AMLApp/2.1.0 (iOS/14.5; iPhone12,1)',
    'MOBILE',
    'Singapore',
    'SUCCESS',
    0
);
```

### Example 5: Insert API Access Login

```sql
INSERT INTO login_log (
    user_id, username, role, ip_address, user_agent,
    device_type, location, login_status, failed_attempts_before_this
) VALUES (
    'API_SERVICE_001',
    'ml_service_api',
    'SYSTEM',
    '127.0.0.1',
    'Python/requests 2.28.1',
    'API',
    'Internal',
    'SUCCESS',
    0
);
```

---

## 2. Using the log_user_login() Function

### Example 1: Successful Web Login

```sql
SELECT log_user_login(
    'ANA_003',                          -- user_id
    'emma.wilson',                      -- username
    'ANALYST',                          -- role
    '192.168.1.150',                    -- ip_address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',  -- user_agent
    'WEB',                              -- device_type
    'Dublin, Ireland',                  -- location
    'SUCCESS',                          -- login_status
    NULL,                               -- failure_reason
    0                                   -- failed_attempts
) AS session_id;

-- Returns: SESSION_2026-03-29-14-32-45-123456_a7b8c9d0e1f2
```

### Example 2: Failed Login - Invalid Credentials

```sql
SELECT log_user_login(
    'UNKNOWN',                          -- user_id (unknown for failed login)
    'unknown.user',                     -- username
    'ANALYST',                          -- role
    '203.0.113.78',                     -- ip_address (suspicious)
    'Mozilla/5.0 (Unknown Browser)',    -- user_agent
    'WEB',                              -- device_type
    'Unknown Location',                 -- location
    'FAILED',                           -- login_status
    'Invalid username or password',     -- failure_reason
    0                                   -- failed_attempts
) AS session_id;

-- Returns: SESSION_2026-03-29-14-33-20-654321_f2e1d0c9b8a7
```

### Example 3: Failed Login - Account Locked (Multiple Attempts)

```sql
SELECT log_user_login(
    'ANA_004',                          -- user_id
    'david.martin',                     -- username
    'ANALYST',                          -- role
    '192.168.2.100',                    -- ip_address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',  -- user_agent
    'WEB',                              -- device_type
    'Paris, France',                    -- location
    'FAILED',                           -- login_status
    'Account locked due to 5 failed attempts',  -- failure_reason
    4                                   -- failed_attempts (this is the 5th)
) AS session_id;
```

### Example 4: Successful Mobile Login

```sql
SELECT log_user_login(
    'REV_002',                          -- user_id
    'lisa.taylor',                      -- username
    'REVIEWER',                         -- role
    '102.183.45.210',                   -- ip_address
    'AMLApp/3.0.0 (Android/12; SM-G991B)',  -- user_agent
    'MOBILE',                           -- device_type
    'Lagos, Nigeria',                   -- location
    'SUCCESS',                          -- login_status
    NULL,                               -- failure_reason
    0                                   -- failed_attempts
) AS session_id;
```

### Example 5: Successful API Login (System Service)

```sql
SELECT log_user_login(
    'SYS_BATCH_001',                    -- user_id
    'batch_processor',                  -- username
    'SYSTEM',                           -- role
    '127.0.0.1',                        -- ip_address (localhost)
    'Python/requests 2.28.1; batch-processor/1.0',  -- user_agent
    'API',                              -- device_type
    'Internal',                         -- location
    'SUCCESS',                          -- login_status
    NULL,                               -- failure_reason
    0                                   -- failed_attempts
) AS session_id;
```

---

## 3. Using the log_user_logout() Function

### Example 1: Normal Logout

```sql
-- First, get the session_id from a login
SELECT session_id FROM login_log 
WHERE user_id = 'ANA_001' 
ORDER BY login_timestamp DESC 
LIMIT 1;

-- Then logout using that session_id
SELECT log_user_logout('SESSION_2026-03-29-14-32-45-123456_a7b8c9d0e1f2') AS logout_success;

-- Returns: logout_success = true
```

### Example 2: Logout with Duration Verification

```sql
-- Get session info before logout
SELECT 
    session_id,
    username,
    login_timestamp,
    EXTRACT(EPOCH FROM (NOW() - login_timestamp))::INT as seconds_active
FROM login_log
WHERE user_id = 'ANA_003' AND logout_timestamp IS NULL
ORDER BY login_timestamp DESC
LIMIT 1;

-- Perform logout
SELECT log_user_logout('SESSION_2026-03-29-14-32-45-123456_a7b8c9d0e1f2');

-- Then verify logout was recorded
SELECT 
    session_id,
    username,
    login_timestamp,
    logout_timestamp,
    session_duration_seconds
FROM login_log
WHERE session_id = 'SESSION_2026-03-29-14-32-45-123456_a7b8c9d0e1f2';
```

### Example 3: Batch Logout Multiple Users (End of Day)

```sql
-- Logout all active sessions from today
SELECT 
    log_user_logout(session_id) as success,
    session_id,
    username
FROM login_log
WHERE logout_timestamp IS NULL
    AND DATE(login_timestamp) = CURRENT_DATE
ORDER BY login_timestamp;
```

---

## 4. Query Examples

### Example 1: View Complete Login History for a User

```sql
SELECT 
    login_id,
    login_timestamp,
    logout_timestamp,
    session_id,
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

**Output:**
```
 login_id | login_timestamp         | logout_timestamp        | session_id              | session_duration_seconds | ip_address    | device_type | location      | login_status | failure_reason
----------+-------------------------+-------------------------+-------------------------+-------------------------+---------------+-------------+---------------+--------------+----------------
        1 | 2026-03-29 14:32:45.123 | 2026-03-29 16:45:30.456 | SESSION_..._a7b8c9d0... |                    7885 | 192.168.1.100 | WEB         | New York, USA | SUCCESS      | (null)
        2 | 2026-03-28 08:15:20.789 | 2026-03-28 12:30:15.234 | SESSION_..._f2e1d0c9... |                   15295 | 192.168.1.100 | WEB         | New York, USA | SUCCESS      | (null)
```

### Example 2: Find Currently Active Sessions

```sql
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

**Output:**
```
 session_id              | username      | user_id  | login_timestamp         | ip_address     | device_type | seconds_active
-------------------------+---------------+----------+-------------------------+----------------+-------------+---------------
 SESSION_..._a7b8c9d0... | john.smith    | ANA_001  | 2026-03-29 14:32:45.123 | 192.168.1.100  | WEB         |        7885
 SESSION_..._c3d4e5f6... | sarah.johnson | ANA_002  | 2026-03-29 10:15:20.456 | 10.0.0.50      | WEB         |       18742
```

### Example 3: Find Failed Login Attempts in Last 24 Hours

```sql
SELECT 
    login_id,
    username,
    user_id,
    login_timestamp,
    failure_reason,
    ip_address,
    location,
    COUNT(*) OVER (PARTITION BY ip_address) as attempts_from_this_ip
FROM login_log
WHERE login_status = 'FAILED'
    AND login_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY login_timestamp DESC;
```

**Output:**
```
 login_id | username      | user_id | login_timestamp         | failure_reason      | ip_address    | location            | attempts_from_this_ip
----------+---------------+---------+-------------------------+---------------------+---------------+---------------------+---------------------
        5 | unknown.user  | UNKNOWN | 2026-03-29 11:20:10.123 | Invalid password    | 203.0.113.78  | Unknown Location    |                     3
        6 | unknown.user  | UNKNOWN | 2026-03-29 11:15:05.456 | Invalid password    | 203.0.113.78  | Unknown Location    |                     3
        7 | david.martin  | ANA_004 | 2026-03-29 09:45:30.789 | Account locked      | 192.168.2.100 | Paris, France       |                     1
```

### Example 4: Get Login Statistics By User (Last 30 Days)

```sql
SELECT 
    username,
    role,
    COUNT(*) as total_logins,
    SUM(CASE WHEN login_status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_logins,
    SUM(CASE WHEN login_status = 'FAILED' THEN 1 ELSE 0 END) as failed_logins,
    AVG(session_duration_seconds)::INT as avg_session_duration,
    MAX(login_timestamp) as last_login,
    COUNT(DISTINCT ip_address) as unique_ips
FROM login_log
WHERE login_timestamp > NOW() - INTERVAL '30 days'
GROUP BY username, role
ORDER BY total_logins DESC;
```

**Output:**
```
 username       | role     | total_logins | successful_logins | failed_logins | avg_session_duration | last_login              | unique_ips
----------------+----------+--------------+-------------------+---------------+----------------------+------------------------+-----------
 john.smith     | ANALYST  |           15 |                15 |             0 |                 8200 | 2026-03-29 14:32:45.123 |          1
 sarah.johnson  | ANALYST  |           12 |                10 |             2 |                 7450 | 2026-03-29 10:15:20.456 |          2
 michael.chen   | REVIEWER |            8 |                 8 |             0 |                 6100 | 2026-03-28 15:40:10.789 |          3
 admin.user     | ADMIN    |            4 |                 3 |             1 |                 9800 | 2026-03-27 09:20:00.234 |          1
```

### Example 5: Detect Logins from Unusual Locations

```sql
WITH user_locations AS (
    SELECT 
        user_id,
        location,
        COUNT(*) as login_count
    FROM login_log
    WHERE login_status = 'SUCCESS'
        AND login_timestamp > NOW() - INTERVAL '30 days'
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
LEFT JOIN user_locations ul 
    ON ll.user_id = ul.user_id AND ll.location = ul.location
WHERE ll.login_status = 'SUCCESS'
    AND ul.login_count <= 2  -- Unusual location (1-2 logins only)
    AND ll.login_timestamp > NOW() - INTERVAL '7 days'
ORDER BY ll.login_timestamp DESC;
```

**Output:**
```
 login_id | username      | login_timestamp         | location            | ip_address     | logins_from_this_location
----------+---------------+-------------------------+---------------------+----------------+-----------------------
        3 | lisa.taylor   | 2026-03-27 13:10:20.123 | Lagos, Nigeria      | 102.183.45.210 |                     2
        8 | emma.wilson   | 2026-03-26 16:55:40.456 | Bangkok, Thailand   | 202.58.123.45  |                     1
```

### Example 6: Get Session Duration Statistics

```sql
SELECT 
    username,
    role,
    COUNT(*) as completed_sessions,
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

**Output:**
```
 username      | role     | completed_sessions | min_duration | avg_duration | max_duration | median_duration
---------------+----------+--------------------+--------------+--------------+--------------+----------------
 john.smith    | ANALYST  |                 14 |         3600 |         8200 |        14400 |            8100
 sarah.johnson | ANALYST  |                 10 |         2400 |         7450 |        12600 |            7350
 michael.chen  | REVIEWER |                  8 |         1800 |         6100 |        10200 |            6050
 admin.user    | ADMIN    |                  3 |         5400 |         9800 |        14400 |            9800
```

### Example 7: Detect Suspicious Login Patterns

```sql
-- Find users accessing from multiple locations on same day
WITH daily_locations AS (
    SELECT 
        user_id,
        username,
        DATE(login_timestamp) as login_date,
        COUNT(DISTINCT location) as location_count,
        STRING_AGG(DISTINCT location, ', ') as locations
    FROM login_log
    WHERE login_status = 'SUCCESS'
        AND login_timestamp > NOW() - INTERVAL '7 days'
    GROUP BY user_id, username, DATE(login_timestamp)
)
SELECT *
FROM daily_locations
WHERE location_count > 1
ORDER BY login_date DESC;
```

**Output:**
```
 user_id | username      | login_date | location_count | locations
---------+---------------+------------+----------------+------------------------------------------
 ANA_003 | emma.wilson   | 2026-03-29 |              2 | New York, USA; Dublin, Ireland
 ANA_002 | sarah.johnson | 2026-03-28 |              2 | London, UK; Paris, France
```

---

## 5. Real-World Scenarios

### Scenario 1: Track a Single User's Day

```sql
-- Get John's activity for March 29, 2026
SELECT 
    login_timestamp as login_time,
    logout_timestamp as logout_time,
    session_duration_seconds,
    ip_address,
    location,
    login_status
FROM login_log
WHERE user_id = 'ANA_001'
    AND DATE(login_timestamp) = '2026-03-29'
ORDER BY login_timestamp;
```

### Scenario 2: Investigate Security Incident

```sql
-- A user reported suspicious login activity
-- Track all logins for that user from a suspicious IP in the past 7 days
SELECT 
    login_id,
    login_timestamp,
    logout_timestamp,
    session_duration_seconds,
    ip_address,
    location,
    device_type,
    user_agent,
    login_status
FROM login_log
WHERE username = 'john.smith'
    AND ip_address = '203.0.113.78'
    AND login_timestamp > NOW() - INTERVAL '7 days'
ORDER BY login_timestamp;
```

### Scenario 3: Generate Compliance Report

```sql
-- Monthly audit report for all analyst access
SELECT 
    DATE_TRUNC('month', login_timestamp) as month,
    role,
    COUNT(*) as total_logins,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(CASE WHEN login_status = 'FAILED' THEN 1 ELSE 0 END) as failed_attempts,
    COUNT(DISTINCT ip_address) as unique_ips,
    MIN(login_timestamp) as first_login,
    MAX(login_timestamp) as last_login
FROM login_log
WHERE role IN ('ANALYST', 'REVIEWER')
    AND login_timestamp > NOW() - INTERVAL '3 months'
GROUP BY DATE_TRUNC('month', login_timestamp), role
ORDER BY month DESC, role;
```

### Scenario 4: Find Dormant Accounts

```sql
-- Identify users who haven't logged in for 30 days
SELECT DISTINCT
    user_id,
    username,
    role,
    MAX(login_timestamp) as last_login,
    (NOW() - MAX(login_timestamp))::INTERVAL as inactive_period
FROM login_log
WHERE login_status = 'SUCCESS'
GROUP BY user_id, username, role
HAVING MAX(login_timestamp) < NOW() - INTERVAL '30 days'
ORDER BY MAX(login_timestamp) DESC;
```

---

## 6. Integration with Application Code

### JavaScript/Node.js Example

```javascript
// Upon user login
const sessionId = await pool.query(
    'SELECT log_user_login($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [
        user.id,
        user.username,
        user.role,
        req.ip,
        req.get('user-agent'),
        'WEB',
        await getLocationFromIP(req.ip),
        'SUCCESS',
        null,
        0
    ]
);

// Store session ID
req.session.sessionId = sessionId.rows[0].log_user_login;

// Upon user logout
await pool.query(
    'SELECT log_user_logout($1)',
    [req.session.sessionId]
);
```

---

## Summary Table: Insert vs Function

| Method | Best For | Example |
|--------|----------|---------|
| **Direct INSERT** | Bulk historical data, testing | `INSERT INTO login_log VALUES (...)` |
| **log_user_login()** | Application login events | `SELECT log_user_login(...)` |
| **log_user_logout()** | Application logout events | `SELECT log_user_logout(...)` |
| **Direct INSERT + UPDATE** | Processing external logs | Insert then UPDATE logout_timestamp |

