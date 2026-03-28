# RAG + LLM Integration Guide for SAR Generation

## Overview

The InteliSAR system has been upgraded with **Retrieval-Augmented Generation (RAG)** and **Large Language Model (LLM)** integration to generate more sophisticated and contextually aware Suspicious Activity Reports (SARs).

## Architecture

```
┌──────────────────┐
│  Frontend Alert  │
│  (Generate SAR)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Backend API     │
│  /api/generate-sar
└────────┬─────────┘
         │
    ┌────┴────┬──────────────────┐
    │ Database │                  │
    │ Fetch    ▼                  ▼
    │    ┌──────────┐      ┌────────────────┐
    │    │ Alert    │      │  RAG System    │
    │    │ Data     │      │  ┌──────────┐  │
    └────┤          │      │  │Knowledge │  │
         │ +Meta    │      │  │Base      │  │
         │          │      │  │(Rules,   │  │
         └──────┬───┘      │  │Patterns) │  │
                │          │  └──────────┘  │
                │          └────────────────┘
                │                   │
                │ Enhanced Prompt   │
                └───────────┬───────┘
                            │
                    ┌───────▼──────────┐
                    │  LLM Service     │
                    │  ┌────────────┐  │
                    │  │ Groq (Fast)│  │
                    │  │ OpenAI     │  │
                    │  │ Anthropic  │  │
                    │  └────────────┘  │
                    └───────┬──────────┘
                            │
                    ┌───────▼──────────┐
                    │  Generated SAR   │
                    │  (Professional   │
                    │   Compliance     │
                    │   Document)      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Frontend       │
                    │  Display SAR    │
                    └─────────────────┘
```

## Components

### 1. **RAG System** (`rag-system.js`)

The RAG system retrieves relevant regulatory context to enhance SAR generation.

**Features:**
- Regulatory database (31 U.S.C., CFR regulations)
- Fraud pattern definitions (Structuring, Smurfing, Layering, etc.)
- Compliance rules and requirements
- Enhanced prompt creation with regulatory context

```javascript
// Initialize
const RAGSystem = require('./rag-system');
const rag = new RAGSystem();

// Build context
const ragContext = rag.buildRAGContext(alertData);

// Create enhanced prompt
const prompt = rag.createEnhancedPrompt(alertData, ragContext);
```

### 2. **LLM Service** (`llm-service.js`)

Unified interface for multiple LLM providers with automatic fallback.

**Supported Providers:**
- **Groq** (Fast, free tier available) - *Recommended*
- **OpenAI** (GPT-4 supported)
- **Anthropic** (Claude supported)

```javascript
// Initialize
const LLMService = require('./llm-service');
const llm = new LLMService();

// Generate text
const result = await llm.generateText(prompt, systemMessage);

// Set provider
llm.setProvider('groq'); // or 'openai', 'anthropic'
```

### 3. **Enhanced SAR Generator** (`sar-generator-v2.js`)

Main function that orchestrates RAG + LLM.

```javascript
const { generateSAR } = require('./sar-generator-v2');

// Generate SAR with RAG+LLM
const sarResult = await generateSAR(alertData);

// Returns:
// {
//   sar_text: "Professional SAR document...",
//   method: "RAG+LLM" or "Template (Fallback)",
//   provider: "Groq" | "OpenAI" | "Anthropic" | "fallback",
//   model: "mixtral-8x7b-32768",
//   tokens_used: 1234,
//   ragContext: { ... },  // RAG context used
//   generated_at: "2026-03-29T..."
// }
```

## Setup & Configuration

### Step 1: Install Dependencies

All required packages are already installed. If needed:

```bash
npm install axios dotenv
```

### Step 2: Get LLM API Keys

#### Option A: Groq (Recommended - Free)
1. Visit https://console.groq.com/keys
2. Create a new API key
3. Copy the key to `.env`

#### Option B: OpenAI
1. Visit https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy to `.env`

#### Option C: Anthropic
1. Visit https://console.anthropic.com
2. Create a new API key
3. Copy to `.env`

### Step 3: Configure Environment

Create `.env` file:

```bash
# Copy the template
cp .env.example .env

# Edit with your API keys
nano .env
```

**Minimal Configuration:**
```
LLM_PROVIDER=groq
GROQ_API_KEY=your-key-here
USE_RAG=true
USE_LLM=true
```

### Step 4: Restart Backend

```bash
# Kill existing server
# Start new server
node server.js
```

## Usage

### From Frontend

Click "Generate SAR" on an alert:

```
Frontend sends:
POST /api/generate-sar
{
  "alertId": "ALERT_TEST_001",
  "alertData": { /* alert details */ }
}

Backend responds:
{
  "sarContent": "Professional SAR document...",
  "alert_id": "ALERT_TEST_001",
  "status": "success",
  "method": "RAG+LLM",
  "provider": "Groq"
}
```

### From Backend/API

```javascript
const { generateSAR } = require('./sar-generator-v2');

const alertData = {
  alert_id: 'ALERT_001',
  transaction_id: 'TXN_001',
  account_id: 'ACC_001',
  confidence_score: 95,
  risk_level: 'CRITICAL',
  patterns_detected: ['Structuring', 'Layering'],
  amount_received: 50000,
  receiving_currency: 'USD'
};

const result = await generateSAR(alertData);
console.log(result.sar_text); // Professional SAR document
```

## Features

### RAG Enhancement

The RAG system automatically:

1. **Retrieves relevant regulations** based on detected patterns
   - Structuring → 31 U.S.C. § 5318, 31 C.F.R. Part 1020
   - Terrorist Financing → Counter-Terrorist Financing Indicators

2. **Matches fraud patterns** with detailed descriptions and indicators
   - Smurfing
   - Structuring
   - Layering
   - Integration

3. **Provides compliance context** for the LLM
   - KYC requirements
   - CIP procedures
   - Enhanced due diligence triggers

### LLM Generation

The LLM generates:

- Professional SAR formatted document
- Regulatory-compliant language
- Proper section organization
- Clear findings and recommendations
- Investigation methodology documentation

### Fallback Strategy

If LLM generation fails:

1. Try primary provider (Groq)
2. Try secondary providers (OpenAI, Anthropic)
3. Fall back to template-based generation
4. Always returns valid SAR document

## Environment Variables

```env
# RAG Configuration
USE_RAG=true                    # Enable RAG system
USE_LLM=true                    # Enable LLM integration
LLM_PROVIDER=groq              # Primary provider

# Groq
GROQ_API_KEY=xxx              # Groq API key
GROQ_MODEL=mixtral-8x7b-32768 # Model selection

# OpenAI
OPENAI_API_KEY=xxx            # OpenAI API key
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic
ANTHROPIC_API_KEY=xxx         # Anthropic API key
ANTHROPIC_MODEL=claude-3-opus-20240229

# Debugging
INCLUDE_RAG_CONTEXT=false     # Include RAG context in response
```

## Performance Metrics

### Processing Time
- **RAG Context Building**: ~50-100ms
- **LLM Generation** (Groq): ~1-3 seconds
- **LLM Generation** (OpenAI): ~2-4 seconds
- **LLM Generation** (Anthropic): ~2-5 seconds
- **Fallback Template**: ~100ms

### Cost Estimates (Per SAR)
- **Groq**: Free tier (up to 5k requests/day)
- **OpenAI**: ~$0.01-0.05 per SAR
- **Anthropic**: ~$0.03-0.10 per SAR
- **Template Fallback**: $0

## Troubleshooting

### "Groq API key not configured"
```bash
# Check .env for GROQ_API_KEY
echo $GROQ_API_KEY

# If empty, set it
export GROQ_API_KEY=your-key-here
```

### "All LLM providers failed"

Check logs:
```bash
# Backend logs show which providers failed
# Check API keys and internet connection
# Fallback to template will be used
```

### SAR not generating

1. Check database connection
2. Verify alert data is complete
3. Check LLM provider configuration
4. Review server logs for errors

```bash
# Enable debug logging
LOG_LEVEL=debug
```

## Advanced Configuration

### Change Default Provider

```bash
# Use OpenAI instead of Groq
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Disable RAG for Performance

```bash
USE_RAG=false  # Skip RAG, use simpler prompts
```

### Include RAG Context in Response

```bash
INCLUDE_RAG_CONTEXT=true  # Helpful for debugging/analysis
```

## API Response Example

### Successful LLM Generation

```json
{
  "sarContent": "[Professional SAR document here...]",
  "alert_id": "ALERT_TEST_001",
  "generated_at": "2026-03-29T12:00:00.000Z",
  "status": "success",
  "method": "RAG+LLM",
  "provider": "Groq",
  "model": "mixtral-8x7b-32768",
  "fallback": false
}
```

### Fallback Template Generation

```json
{
  "sarContent": "[Template-based SAR document...]",
  "alert_id": "ALERT_TEST_001",
  "generated_at": "2026-03-29T12:00:00.000Z",
  "status": "success",
  "method": "Template (Fallback)",
  "provider": "fallback",
  "fallback": true
}
```

## Next Steps

1. **Get API Key**: Get Groq API key from https://console.groq.com
2. **Configure .env**: Add API key to `.env` file
3. **Restart Backend**: Kill and restart `node server.js`
4. **Test SAR Generation**: Click "Generate SAR" in frontend
5. **Monitor Logs**: Check backend terminal for generation details

## Testing

### Manual Testing

```bash
# Test RAG system
const RAGSystem = require('./rag-system');
const rag = new RAGSystem();
console.log(rag.getAvailableProviders());

# Test LLM service
const LLMService = require('./llm-service');
const llm = new LLMService();
const result = await llm.generateText("Test prompt", "System message");
```

### Integration Testing

```bash
curl -X POST http://localhost:3000/api/generate-sar \
  -H "Content-Type: application/json" \
  -d '{"alertId": "ALERT_TEST_001"}'
```

---

For more information, refer to the main README.md or contact the development team.
