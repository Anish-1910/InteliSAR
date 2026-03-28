# PDF SAR Template Management API

## Overview

The system now supports dynamic PDF SAR generation with customizable templates. Upload your own SAR templates (PDF or JSON format), and the system will generate SARs matching your format with data filled in automatically.

## API Endpoints

### 1. List Available Templates
**GET** `/api/templates`

Returns all available SAR templates in the system.

**Response:**
```json
{
  "templates": ["default", "barclays_v1", "custom_template"],
  "total": 3,
  "status": "success"
}
```

---

### 2. Upload New Template
**POST** `/api/templates/upload`

Upload a new SAR template in PDF or JSON format.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Files: 
  - `template` (required): PDF or JSON file
  - `templateName` (optional): Custom name for template (defaults to filename without extension)

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/api/templates/upload \
  -F "template=@path/to/SAR_template.pdf" \
  -F "templateName=my_custom_sar"
```

**Response (Success):**
```json
{
  "status": "success",
  "templateName": "my_custom_sar",
  "message": "Template uploaded successfully"
}
```

**Response (PDF Template - requires field mapping):**
```json
{
  "status": "success",
  "templateName": "my_custom_sar",
  "message": "PDF template uploaded. Please map the fields in the extraction form.",
  "template": {
    "name": "my_custom_sar",
    "originalFile": "SAR_template.pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "sections": [
      {
        "name": "header",
        "fields": ["title", "date", "institution"]
      },
      {
        "name": "content",
        "fields": ["sar_number", "filing_status", "narrative"]
      }
    ]
  }
}
```

---

### 3. Generate SAR in PDF Format
**POST** `/api/generate-sar-pdf`

Generate a Suspicious Activity Report in PDF format using a specific template.

**Request Body:**
```json
{
  "alertId": 123,
  "templateName": "default"
}
```

**Alternatively, send full alert data:**
```json
{
  "alertData": {
    "alert_id": 123,
    "account_id": 456,
    "transaction_id": 789,
    "confidence_score": 87.5,
    "risk_level": "high",
    "patterns_detected": ["Structuring", "Rapid_Transfers"],
    "amount_paid": 50000,
    "payment_currency": "USD"
  },
  "templateName": "default"
}
```

**Response:**
Returns PDF file as binary data with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="SAR_123_1705317000000.pdf"
```

**Error Responses:**
```json
{
  "error": "alert_id is required"
}

{
  "error": "Alert not found"
}

{
  "error": "PDF generation failed",
  "sarText": "Fallback text SAR if PDF generation failed"
}
```

---

### 4. Generate SAR in Text Format
**POST** `/api/generate-sar-text`

Generate a SAR in plain text format with RAG and LLM enhancement.

**Request Body:**
```json
{
  "alertId": 123
}
```

**Response:**
```json
{
  "sar_text": "SUSPICIOUS ACTIVITY REPORT\n\nFiling Institution: Barclays Bank\n...",
  "format": "text",
  "method": "llm",
  "provider": "groq",
  "model": "mixtral-8x7b-32768",
  "ragContext": {
    "applicableRules": ["31 U.S.C. § 5318"],
    "relevantPatterns": ["Structuring"]
  }
}
```

---

### 5. Delete Template
**DELETE** `/api/templates/:name`

Remove a SAR template from the system.

**Parameters:**
- `name`: Template name (cannot delete "default")

**Response (Success):**
```json
{
  "status": "success",
  "message": "Template 'custom_template' deleted"
}
```

**Response (Error):**
```json
{
  "error": "Cannot delete default template"
}

{
  "error": "Template 'nonexistent' not found"
}
```

---

## Template Formats

### JSON Template Format
```json
{
  "name": "my_template",
  "header": {
    "title": "SUSPICIOUS ACTIVITY REPORT",
    "institution": "{institution_name}",
    "date": "{report_date}"
  },
  "sections": [
    {
      "title": "FILING INFORMATION",
      "fields": {
        "sar_id": "SAR ID: {sar_id}",
        "status": "Status: {status}",
        "priority": "Priority: {risk_level}"
      }
    },
    {
      "title": "TRANSACTION DETAILS",
      "fields": {
        "amount": "Amount: ${amount_paid} {payment_currency}",
        "from_account": "From: {from_account}",
        "to_account": "To: {to_account}",
        "timestamp": "Date/Time: {timestamp}"
      }
    },
    {
      "title": "NARRATIVE",
      "fields": {
        "narrative": "{sar_text}"
      }
    }
  ]
}
```

### PDF Template Format
Upload a PDF file with form fields or visual indicators. The system will extract the structure and create a JSON representation that can be used for PDF generation.

---

## Usage Workflow

### 1. **Upload a Custom Template**
```bash
curl -X POST http://localhost:3000/api/templates/upload \
  -F "template=@my_sar_format.pdf" \
  -F "templateName=my_format"
```

### 2. **List Available Templates**
```bash
curl http://localhost:3000/api/templates
```

### 3. **Generate SAR in Your Format**
```bash
curl -X POST http://localhost:3000/api/generate-sar-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": 123,
    "templateName": "my_format"
  }' \
  --output sar_report.pdf
```

### 4. **Switch to Different Format**
Simply upload a new template with a different name and use it in subsequent generation requests.

---

## Field Mapping

Available fields for template substitution:

### Alert/Transaction Fields
- `{alert_id}` - Alert ID
- `{account_id}` - Account ID
- `{transaction_id}` - Transaction ID
- `{confidence_score}` - Confidence score (0-100)
- `{risk_level}` - Risk level (low/medium/high/critical)
- `{priority}` - Alert priority
- `{patterns_detected}` - Comma-separated list of detected patterns
- `{status}` - Alert status

### Transaction Details
- `{from_account}` - Originating account
- `{to_account}` - Destination account
- `{timestamp}` - Transaction timestamp
- `{amount_paid}` - Amount paid
- `{payment_currency}` - Currency code
- `{amount_received}` - Amount received
- `{receiving_currency}` - Receiving currency code
- `{payment_format}` - Payment method

### Account Information
- `{customer_name}` - Account holder name
- `{account_type}` - Type of account

### System Fields
- `{sar_id}` - Generated SAR ID (UUID)
- `{report_date}` - Report generation date
- `{institution_name}` - Institution name (Barclays)
- `{sar_text}` - Full narrative SAR text (LLM-generated)

### RAG Context Fields
- `{applicable_regulations}` - Relevant regulations
- `{compliance_notes}` - Key compliance considerations
- `{pattern_context}` - Context about detected patterns

---

## Error Handling

The API includes comprehensive error handling:

| Error | Status | Resolution |
|-------|--------|-----------|
| Missing `alert_id` | 400 | Provide either `alertId` or full `alertData` |
| Alert not found | 404 | Verify alert ID exists in database |
| Invalid template | 400 | Check template structure matches JSON schema |
| PDF generation failed | 500 | System returns text SAR as fallback |
| Template upload failed | 500 | Check file format (PDF/JSON) and size (<50MB) |

---

## Frontend Integration

### React Example
```javascript
// Generate PDF SAR
const generatePDFSAR = async (alertId, templateName = 'default') => {
  const response = await fetch('/api/generate-sar-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId, templateName })
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAR_${alertId}.pdf`;
    a.click();
  }
};

// Upload template
const uploadTemplate = async (file) => {
  const formData = new FormData();
  formData.append('template', file);
  formData.append('templateName', file.name.replace(/\.[^.]+$/, ''));

  const response = await fetch('/api/templates/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// List templates
const listTemplates = async () => {
  const response = await fetch('/api/templates');
  const data = await response.json();
  return data.templates;
};
```

---

## Performance Notes

- **PDF Generation**: ~2-5 seconds per SAR (depends on LLM provider)
- **Template Upload**: ~1-2 seconds for typical SAR templates
- **File Size Limit**: 50MB per upload
- **Supported Formats**: PDF, JSON

## FAQ

**Q: Can I modify templates after uploading?**  
A: Currently, you need to delete and re-upload. Direct editing support coming soon.

**Q: What if LLM generation fails?**  
A: System falls back to rule-based SAR generation from RAG context.

**Q: Can I use multiple templates?**  
A: Yes, upload as many as needed and switch between them in generation requests.

**Q: How are templates stored?**  
A: Templates are stored in the `sar_templates/` directory as JSON files.

---

## Quick Start

1. **Upload your SAR template:**
   ```bash
   curl -X POST http://localhost:3000/api/templates/upload \
     -F "template=@your_template.pdf"
   ```

2. **Verify upload:**
   ```bash
   curl http://localhost:3000/api/templates
   ```

3. **Generate SAR in your format:**
   ```bash
   curl -X POST http://localhost:3000/api/generate-sar-pdf \
     -H "Content-Type: application/json" \
     -d '{"alertId": 123, "templateName": "your_template"}' \
     --output my_sar.pdf
   ```

Done! Your SAR is ready for download.
