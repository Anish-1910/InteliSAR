# 🚀 CHATBOT - COMPLETE STARTUP GUIDE

## Quick Start (3 Steps)

### Step 1: Open First Terminal - Start Backend

```bash
cd c:\Users\anish\OneDrive\Documents\Personal\HACKATHON\InteliSar\InteliSAR\Barclays

node server.js
```

**You should see:**
```
================================================================================
BARCLAYS AML BACKEND - NODE.JS EXPRESS SERVER
================================================================================

✓ Connected to PostgreSQL database
✓ ML service connection successful

✓ Server running on http://localhost:3001

Available endpoints:
  POST   /api/transactions/analyze    - Analyze single transaction
  POST   /api/transactions/batch      - Analyze batch
  GET    /api/alerts                  - Get pending alerts
  GET    /api/accounts/:id            - Get account details
  GET    /api/metrics                 - Get metrics
  GET    /health                      - Health check
```

**If you see errors:** Jump to "Troubleshooting" section below

---

### Step 2: Open Second Terminal - Start Frontend

```bash
cd c:\Users\anish\OneDrive\Documents\Personal\HACKATHON\InteliSar\InteliSAR\Barclays\frontend

npm start
```

**You should see:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
```

**Browser should automatically open to `http://localhost:3000`**

---

### Step 3: Test the Chatbot

1. Go to Dashboard
2. Click any **Alert**
3. You should see **Chatbot Panel** on the right
4. Type: "Why was this alert generated?"
5. **You should get a response** ✅

---

## 🧪 Verify Everything Works

### Option A: Manual Testing
1. Ask chatbot: "Why was this alert generated?"
2. Click "Analyze Risk" button
3. Click "Compliance Check" button
4. All should work without errors

### Option B: Automated Testing
```bash
# In a third terminal (keep other two running):
node test-chatbot.js
```

This will run diagnostics and tell you what's broken.

---

## ❌ If Chatbot Shows Error

### Problem: Red error message appears

**Step 1:** Check Server Terminal
- Look for error messages
- Copy the error text

**Step 2:** Run Diagnostic
```bash
node test-chatbot.js
```

**Step 3:** Check Browser Console
- Press F12
- Go to "Console" tab
- Look for red error messages
- Copy the error

**Step 4:** Use Troubleshooting Guide
See: `CHATBOT_TROUBLESHOOTING.md`

---

## 🔱 Database Requirements

### PostgreSQL Must Be Running

```bash
# Check if PostgreSQL is running:
pg_isready

# Should output:
# accepting connections
```

**If not running:**

**Windows:**
```bash
# Start PostgreSQL service
net start postgresql13

# Or search for "Services" and start PostgreSQL13
```

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

---

## 📦 Dependencies Check

### Backend Dependencies

```bash
# Verify all installed
npm list

# Should show all packages in green
```

**If modules missing:**
```bash
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm list

# If missing:
npm install
```

---

## 🔧 Common Issues

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Kill existing Node process
taskkill /F /IM node.exe

# Wait 2 seconds
timeout /t 2

# Restart
node server.js
```

---

### Issue: "Cannot find module"

**Solution:**
```bash
# Install dependencies
npm install

# Clear cache
npm cache clean --force

# Reinstall
rm -r node_modules
npm install
```

---

### Issue: Frontend won't start (npm start fails)

**Solution:**
```bash
cd frontend

# Clear cache
npm cache clean --force

# Reinstall
rm -r node_modules
npm install

# Start
npm start
```

---

### Issue: Database connection error

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# If not, start it:
net start postgresql13

# Verify credentials in config.js
# Default: postgres/postgres at localhost:5432
```

---

## 🎯 Full System Check

Run this checklist every time you start:

- [ ] **PostgreSQL Running**
  ```bash
  pg_isready
  ```
  
- [ ] **Backend Starting**
  ```bash
  node server.js
  # Should show: ✓ Server running on http://localhost:3001
  ```

- [ ] **Frontend Starting**
  ```bash
  cd frontend && npm start
  # Should show: http://localhost:3000
  ```

- [ ] **Backend Health Check**
  ```bash
  curl http://localhost:3001/health
  # Should return JSON with status: healthy
  ```

- [ ] **Chatbot API Test**
  ```bash
  node test-chatbot.js
  # Should test and report results
  ```

- [ ] **Browser Opens** to http://localhost:3000
  - Dashboard visible ✓
  - Can click alerts ✓
  - Chatbot panel visible ✓

---

## 🎊 Success Indicators

### Backend Console Shows:
```
✓ Connected to PostgreSQL database
✓ ML service connection successful  
✓ Server running on http://localhost:3001
```

### Frontend Console Shows:
```
Compiled successfully!
http://localhost:3000
```

### Chatbot Works When:
- ✓ Chatbot panel visible on SAR page
- ✓ Can type questions
- ✓ Gets responses within 2 seconds
- ✓ No red error messages
- ✓ Confidence score shows
- ✓ Sources listed

---

## 💡 Need Help?

### Check These Files First:
1. **CHATBOT_TROUBLESHOOTING.md** - Detailed troubleshooting steps
2. **CHATBOT_GUIDE.md** - API documentation
3. **IMPLEMENTATION_SUMMARY.md** - System overview

### Run This:
```bash
node test-chatbot.js
```

### Check Logs:
- Backend logs: Look in terminal running `node server.js`
- Frontend logs: Open browser DevTools (F12) → Console tab

---

## 📋 All Commands Reference

```bash
# Backend
cd c:\Users\anish\OneDrive\Documents\Personal\HACKATHON\InteliSar\InteliSAR\Barclays
node server.js

# Frontend (in separate terminal)
cd frontend
npm start

# Diagnostic Test
node test-chatbot.js

# Kill Node Process (if stuck)
taskkill /F /IM node.exe

# Check PostgreSQL
pg_isready

# Start PostgreSQL (Windows)
net start postgresql13
```

---

## 🎉 Next Steps After Startup

1. ✅ Backend running
2. ✅ Frontend running
3. ✅ Open http://localhost:3000
4. ✅ Click an alert
5. ✅ Ask chatbot a question
6. ✅ See response instantly

**Everything should work smoothly!**

---

**Last Updated:** Today
**Status:** Ready to Use
