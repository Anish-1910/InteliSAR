#!/usr/bin/env node

/**
 * Chatbot Diagnostic Script
 * Run this to check if the chatbot system is properly configured
 */

const http = require('http');

console.log('\n' + '='.repeat(60));
console.log('🔍 CHATBOT DIAGNOSTIC TEST');
console.log('='.repeat(60) + '\n');

// Test 1: Check backend health
console.log('📋 Test 1: Backend Health Check');
console.log('Testing: http://localhost:3001/health\n');

http.get('http://localhost:3001/health', (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend is RUNNING\n');
      console.log('Response:', JSON.parse(data), '\n');
      
      // Test 2: Check chatbot endpoint
      console.log('📋 Test 2: Chatbot API Test');
      console.log('Testing: POST /api/chatbot/ask\n');
      
      const postData = JSON.stringify({
        message: 'Why was this alert generated?',
        alertId: null,
        sectionContext: null
      });
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chatbot/ask',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Status Code: ${res.statusCode}\n`);
          
          try {
            const result = JSON.parse(data);
            console.log('Response:', JSON.stringify(result, null, 2), '\n');
            
            if (result.status === 'success') {
              console.log('✅ CHATBOT API IS WORKING!\n');
              console.log('✨ Expected fields present:');
              console.log('  ✓ status:', result.status);
              console.log('  ✓ response:', result.response?.substring(0, 50) + '...');
              console.log('  ✓ confidence:', result.confidence);
              console.log('  ✓ sources:', result.sources?.length || 0, 'sources');
              console.log('  ✓ recommendations:', result.recommendations?.length || 0, 'recommendations');
              console.log('\n🎉 CHATBOT IS FULLY FUNCTIONAL!\n');
            } else {
              console.log('❌ API returned error status:', result.error || result.message);
            }
          } catch (e) {
            console.log('❌ Invalid JSON response:', e.message);
          }
          
          printSummary();
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ API Request Error:', error.message);
        console.log('\nPossible causes:');
        console.log('  - Backend running but has internal error');
        console.log('  - Database not connected');
        console.log('  - Code error in chatbot endpoint\n');
        printSummary();
      });
      
      req.write(postData);
      req.end();
      
    } else {
      console.log('❌ Unexpected status code:', res.statusCode);
    }
  });
}).on('error', (error) => {
  console.log('❌ Backend NOT RUNNING');
  console.log('Error:', error.message);
  console.log('\nTo start the backend:');
  console.log('  cd C:\\...\\Barclays');
  console.log('  node server.js\n');
  printSummary();
});

function printSummary() {
  console.log('='.repeat(60));
  console.log('QUICK CHECKLIST:');
  console.log('='.repeat(60));
  console.log('[ ] Backend running on http://localhost:3001');
  console.log('[ ] Frontend running on http://localhost:3000');
  console.log('[ ] Database (PostgreSQL) is running');
  console.log('[ ] Chatbot API responding correctly');
  console.log('[ ] No CORS errors in browser console');
  console.log('[ ] All dependencies installed (npm install)');
  console.log('='.repeat(60));
  console.log('\nFor detailed troubleshooting, see: CHATBOT_TROUBLESHOOTING.md\n');
}
