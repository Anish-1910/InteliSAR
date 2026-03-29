# Barclays AML - Authentication Setup Instructions

## Quick Summary
You've added authentication to the system, but the database needs to be initialized for it to work. Follow the steps below:

---

## Step 1: Verify Database Connection

### Test the current database user:
```bash
node check_db.js
```

Expected output should show existing tables like:
- accounts
- alerts  
- audit_log
- transactions

If you get a connection error, verify:
- PostgreSQL is running
- Database `barclays_aml` exists
- User `barclays_app` exists
- Check `.env` file has correct credentials: `DB_PASSWORD=anish@123`

---

## Step 2: Grant Database Permissions

The `barclays_app` user needs CREATE permission on the public schema. Run this **as a database administrator** (using the `postgres` superuser account):

### Option A: Using psql command (recommended for Windows)
```bash
# First, find your PostgreSQL installation
# Usually: C:\Program Files\PostgreSQL\15\bin\psql.exe

psql -U postgres -h localhost -d barclays_aml -f grant_permissions.sql
```

### Option B: Manual SQL execution
Connect to the database as postgres superuser and run the commands in `grant_permissions.sql`

---

## Step 3: Create Authentication Tables

After permissions are granted, run:

```bash
node quick_auth_setup.js
```

Expected output:
```
========================================
QUICK AUTHENTICATION SETUP
========================================

Creating tables...
✓ Tables created

Inserting test data...
✓ Test data inserted/updated

========================================
✓ SETUP COMPLETE
========================================

🎉 You can now login with:
  Email: anishkalai2006@gmail.com
  Password: anish123
```

---

## Step 4: Start the Backend Server

```bash
node server.js
```

The server should start on `http://localhost:3000` and show:
```
✓ Database connection successful
✓ Server running on http://localhost:3000
```

---

## Step 5: Start the Frontend

In another terminal:
```bash
cd frontend
npm start
```

Frontend will start on `http://localhost:3001`

---

## Step 6: Test Login

1. Navigate to `http://localhost:3001/login/analyser`
2. Enter credentials:
   - **Email**: anishkalai2006@gmail.com
   - **Password**: anish123
3. Click "Sign In as Analyst"

You should be logged in successfully!

---

## Available Test Accounts

| Email                    | Password     | Role           |
|--------------------------|--------------|----------------|
| anishkalai2006@gmail.com | anish123     | ANALYST        |
| john.doe@barclays.com    | password123  | ANALYST        |
| jane.smith@barclays.com  | password123  | SENIOR_ANALYST |
| admin@barclays.com       | admin123     | ADMIN          |
| reviewer@barclays.com    | password123  | REVIEWER       |

---

## Troubleshooting

### Error: "permission denied for schema public"
**Solution**: Run `grant_permissions.sql` as postgres superuser (Step 2)

### Error: "password authentication failed"
**Solution**: Verify `.env` file has correct `DB_PASSWORD`
Check the `.env` entry matches your actual database password

### Error: "FATAL: database 'barclays_aml' does not exist"
**Solution**: Create the database first:
```bash
createdb -U postgres barclays_aml
```
Then run Step 3

### "Invalid username or password" at login
**Possible causes:**
- Backend not running (check `node server.js`)
- Tables not created (run Step 3)
- Wrong password (check the table above)

### JWT Token Expiration
- Tokens expire after 24 hours
- Refresh token at `/api/auth/refresh` endpoint
- Or login again

---

## Database Password

If you don't know the database password for `barclays_app`, it's specified in `.env`:

```
DB_PASSWORD=anish@123
```

If this doesn't work, the admin should set it:
```sql
ALTER USER barclays_app WITH PASSWORD 'your_new_password';
```

Then update `.env` accordingly.

---

## What Was Added

### Backend Endpoints (Node.js/Express)
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Database Tables
- `analysts` - Stores analyst credentials and roles
- `login_log` - Audit trail of login attempts

### Frontend Changes
- Updated `Login.js` to call backend API instead of checking local JSON
- Stores JWT token in localStorage for authenticated requests

### Utilities Created
- `create_auth_tables.js` - Create auth tables
- `generate_test_hashes.js` - Generate bcrypt password hashes
- `generate_anish_hash.js` - Generate hash for anish123
- `quick_auth_setup.js` - Quick setup script
- `check_db.js` - Check database state
- `grant_permissions.sql` - Grant permissions to barclays_app

---

## Production Deployment Checklist

- [ ] Change JWT secret in `server.js` (currently hardcoded, should be in `.env`)
- [ ] Use properly hashed passwords (already done with bcrypt)
- [ ] Change `DB_PASSWORD` to a strong password
- [ ] Enable HTTPS for all endpoints
- [ ] Set up two-factor authentication
- [ ] Configure account lockout policies
- [ ] Set up monitoring for failed login attempts
- [ ] Implement password reset functionality
- [ ] Create backup/disaster recovery plan

---

## Questions?

If you encounter issues:
1. Check the database is up and running
2. Verify network connectivity to localhost:5432
3. Make sure ports 3000 (backend) and 3001 (frontend) are available
4. Check terminal output for detailed error messages
