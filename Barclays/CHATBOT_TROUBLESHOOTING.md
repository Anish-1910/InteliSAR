# 🔧 Chatbot Troubleshooting Guide

## Issue: "Sorry, I encountered an error. Please try again."

The chatbot is showing an error which means the API request is failing. Here's how to fix it:

---

## ✅ Step 1: Verify Backend is Running

### Check if Node.js server is running:

```bash
# In a terminal, run:
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Barclays AML Backend",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**If you get an error:**
- ❌ The backend is NOT running
- ✅ Start it with: `node server.js`

---

## ✅ Step 2: Verify Database Connection

### Check if MongoDB/PostgreSQL is connected:

The server logs should show:
```
✓ Connected to PostgreSQL database
✓ Connection to Database successful
```

**If you see connection errors:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check database credentials in `config.js`
3. Verify database tables exist

---

## ✅ Step 3: Check Browser Console

Open DevTools (F12) → Console tab, then ask the chatbot a question.

**Look for:**
- Network errors (red messages)
- CORS errors
- JSON parse errors

**Report any errors you see to identify the issue.**

---

## ✅ Step 4: Test API Directly

```bash
# Test the chatbot endpoint
curl -X POST http://localhost:3001/api/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why was this alert generated?",
    "alertId": null
  }'
```

**Expected successful response:**
```json
{
  "status": "success",
  "response": "I can help you analyze this alert...",
  "confidence": 0.5,
  "sources": [],
  "recommendations": [],
  "follow_up_questions": [...]
}
```

**If you get an error response:**
- Check the error message details
- Verify all helper functions are defined
- Check server console logs for stack trace

---

## 🆘 Common Issues & Solutions

### Issue 1: "Network Error: Failed to fetch"
**Cause:** Backend is not running  
**Solution:** 
```bash
# Terminal 1:
node server.js
```

### Issue 2: "CORS error"  
**Cause:** Backend not accepting requests from frontend  
**Solution:** Check `config.js` CORS settings:
```javascript
cors: {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}
```

### Issue 3: "Database connection failed"
**Cause:** PostgreSQL not running or wrong credentials  
**Solution:**
```bash
# Start PostgreSQL
pg_isready

# If not running, start it
# Windows: net start PostgreSQL13  (or your version)
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Issue 4: "Chatbot processing failed"
**Cause:** Issue in response generation logic  
**Solution:**
1. Check server logs for detailed error
2. Verify `identifyTransactionPatterns()` function is defined
3. Check for null/undefined values in alert data

---

## 📋 Full Debug Checklist

Run through each item:

- [ ] **Backend running?**  
  → `curl http://localhost:3001/health`

- [ ] **Frontend running?**  
  → Open `http://localhost:3000` in browser

- [ ] **Database connected?**  
  → Check server logs for "Connected to PostgreSQL"

- [ ] **Alert exists?**  
  → Open an alert from the dashboard

- [ ] **Chatbot visible?**  
  → Right side panel should show chatbot

- [ ] **Can type message?**  
  → Input field should be enabled

- [ ] **API responding?**  
  → `curl -X POST http://localhost:3001/api/chatbot/ask ...` (see above)

- [ ] **No browser errors?**  
  → Check DevTools → Console for red errors

---

## 📊 Checking Server Logs

When running `node server.js`, look for:

```
✓ Server running on http://localhost:3001
✓ Connected to PostgreSQL database
✓ ML service connection successful

[Chatbot] Query received: "Why was this alert generated?" | Alert: ALERT_1234_abc
[Chatbot] Response generated (confidence: 0.85)
```

**Red flags to look for:**
```
❌ Error connecting to database
❌ Port 3001 is already in use
❌ Cannot find module (missing dependencies)
❌ Syntax error in code
```

---

## 🚀 Quick Fixes

### Fix 1: Port Already in Use
```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

Then restart: `node server.js`

### Fix 2: Install Missing Dependencies
```bash
# In project root (where server.js is)
npm install
```

### Fix 3: Clear Node Cache
```bash
# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# Start
node server.js
```

### Fix 4: Restart Everything
```bash
# Kill all processes
taskkill /F /IM node.exe 2>$null

# Wait
sleep 2

# Start backend
node server.js

# In another terminal, start frontend
cd frontend && npm start
```

---

## 📞 Still Having Issues?

### Last Resort Debugging

1. **Check if Backend Actually Started**
   - Look for: `✓ Server running on http://localhost:3001`
   - If missing, there's a startup error

2. **Check if Alert ID is Passed**
   - Open browser DevTools → Network tab
   - Ask chatbot a question
   - Click the request to `/api/chatbot/ask`
   - View the request body (JSON)
   - Verify `alertId` is included

3. **Check Server Console Output**
   - When you ask a question, logs should show:
   ```
   [Chatbot] Query received: "..." | Alert: ALERT_xxx
   [Chatbot] Response generated (confidence: 0.xx)
   ```
   - If you don't see this, the request never reached the server

4. **Verify Response Format**
   - Network tab → Response (JSON)
   - Should have `status`, `response`, `confidence` fields
   - If format is wrong, the frontend won't display it

---

## 🎯 Expected Behavior

✅ **Working Chatbot:**
1. You ask a question
2. Spinner shows "Thinking..."
3. Chatbot responds with 1-2 seconds
4. Message appears formatted with confidence score

❌ **Broken Chatbot:**
1. You ask a question
2. Red error message appears immediately
3. Error includes "network" or "error"
4. No spinner/loading state

---

## 💡 Pro Tips

- Always check **server console** first - it tells you exactly what's wrong
- Use **browser DevTools** to see network requests
- Test API independently with **curl** to isolate frontend vs backend issues
- **Restart everything** if stuck (backend, frontend, database)

---

**If you provide the exact error message from the server console, I can help pinpoint the solution!**
