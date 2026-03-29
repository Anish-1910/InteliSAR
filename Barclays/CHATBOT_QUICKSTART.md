# 🚀 QUICK START - Interactive Chatbot

## ⚡ 60-Second Setup

### 1. Start Backend (if not running)
```bash
node server.js
# You should see: ✓ Server running on http://localhost:3001
```

### 2. Start Frontend (if not running)
```bash
cd frontend && npm start
# You should see: http://localhost:3000 in browser
```

### 3. Access Chatbot
1. Go to Dashboard
2. Click any **Alert**
3. Look for **Chatbot Panel** on the right side
4. Type a question!

---

## 💬 Try These Questions

| Question | What It Does |
|----------|-------------|
| "Why was this alert generated?" | Explains suspicious patterns |
| "What should I do?" | Action recommendations |
| "What's the risk?" | Risk assessment |
| "Is this compliant?" | Compliance check |
| "What patterns?" | Red flags list |

---

## 🎯 Main Features

### 📊 Analyze Risk Button
- One-click risk analysis
- Shows score breakdown
- Lists contributing factors

### ✓ Compliance Check Button
- Validates against AML rules
- Checks KYC requirements
- Lists required actions

### 💡 Follow-Up Questions
- Smart suggestions appear
- Click to auto-fill questions
- Learn more about the alert

---

## 📱 API Endpoints (for developers)

```
POST /api/chatbot/ask                 → Ask about alerts
POST /api/chatbot/analyze-risk        → Risk analysis
POST /api/chatbot/compliance-check    → Compliance validation
```

---

## 🧠 How It Works

```
You write question
    ↓
Retrieves alert data (RAG)
    ↓
Checks compliance rules
    ↓
Identifies patterns
    ↓
Generates response
    ↓
Shows confidence score
    ↓
Lists sources & recommendations
```

---

## 📚 Full Documentation

For detailed information, see:
- **CHATBOT_GUIDE.md** - Complete API docs
- **CHATBOT_IMPLEMENTATION.md** - What was built
- **IMPLEMENTATION_SUMMARY.md** - System overview

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can open an alert
- [ ] Chatbot panel visible on right
- [ ] Can type a question
- [ ] Gets a response
- [ ] Confidence score displayed
- [ ] Sources listed

---

## 🆘 Troubleshooting

**Chatbot not showing?**
→ Reload page (Ctrl+R)

**No response?**
→ Check server logs for errors

**API error?**
→ Verify MongoDB is running

---

## 🎉 You're Ready!

The chatbot is ready to help your compliance team understand alerts better.

**Happy investigating!** 🕵️‍♀️

---

*Questions? Check CHATBOT_GUIDE.md for detailed docs*
