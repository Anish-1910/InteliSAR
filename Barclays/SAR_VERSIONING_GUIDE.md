# SAR Report Versioning & Data Flow System

Complete guide to the new versioning system for SAR (Suspicious Activity Reports) with automatic version tracking, audit trails, and revertable changes.

---

## System Overview

### Data Flow Architecture

```
ML Model Analysis
    ↓
ml_predictions table (stores raw predictions)
    ↓
Alerts Generated
    ↓
alerts table (stores alert records)
    ↓
SAR Generated (Version 1)
    ↓
version_log table (stores all versions with edit history)
    ↓
SAR Edited (Creates Version 2, 3, etc.)
    ↓
Versions remain in database - all revertable
```

### Key Components

1. **ml_predictions table**: Stores raw ML model predictions
2. **alerts table**: Stores generated alerts with confidence scores
3. **version_log table**: Complete version history with edit tracking and full SAR content

---

## Version Management Endpoints

### 1. Generate SAR (Auto-saves Version 1)

**Endpoint**: `POST /api/generate-sar`

```javascript
Request:
{
  "alertId": "ALERT_TEST_001",
  "alertData": { /* alert details */ }
}

Response:
{
  "sar_text": "Full SAR content...",
  "sections": { /* SAR sections */ },
  "alert_id": "ALERT_TEST_001",
  "status": "success",
  "version_saved": true,  // Version 1 automatically created
  "metadata": { /* metadata */ }
}
```

**Behavior**:
- Generates SAR content
- Automatically creates Version 1 in `version_log` table
- Sets `change_type` to "GENERATED"
- Subsequent SAR generations for same alert do NOT create new versions

---

### 2. Save/Update SAR Version

**Endpoint**: `POST /api/sar/version/save`

Creates Version 2, 3, 4, etc. when SAR is edited.

```javascript
Request:
{
  "alert_id": "ALERT_TEST_001",
  "sar_content": "Updated SAR content...",
  "analyst_id": "ANALYST_001",
  "analyst_name": "John Doe",
  "role": "ANALYST",
  "change_type": "MODIFIED",
  "change_description": "Updated findings section with additional patterns",
  "field_changed": "findings"
}

Response:
{
  "status": "success",
  "version_id": 42,
  "version_number": 2,
  "alert_id": "ALERT_TEST_001",
  "message": "Version 2 saved successfully",
  "timestamp": "2026-03-29T10:30:00Z"
}
```

**Features**:
- Auto-increments version number
- Stores editor information (analyst_id, analyst_name, role)
- Records change metadata
- Can track specific field changes
- Timestamp automatically recorded

---

### 3. Get Version History

**Endpoint**: `GET /api/sar/versions/:alertId`

Retrieves complete version history for an alert.

```javascript
Request:
GET /api/sar/versions/ALERT_TEST_001

Response:
{
  "status": "success",
  "alert_id": "ALERT_TEST_001",
  "versions": [
    {
      "version_id": 40,
      "version_number": 1,
      "analyst_name": "System",
      "change_type": "GENERATED",
      "change_description": "Initial SAR generation",
      "sar_status_before": "DRAFT",
      "sar_status_after": "DRAFT",
      "change_timestamp": "2026-03-29T09:00:00Z"
    },
    {
      "version_id": 41,
      "version_number": 2,
      "analyst_name": "John Doe",
      "change_type": "MODIFIED",
      "change_description": "Updated findings with pattern analysis",
      "sar_status_before": "DRAFT",
      "sar_status_after": "DRAFT",
      "change_timestamp": "2026-03-29T10:30:00Z"
    },
    {
      "version_id": 42,
      "version_number": 3,
      "analyst_name": "Jane Smith",
      "change_type": "MODIFIED",
      "change_description": "Approved by senior analyst",
      "sar_status_before": "DRAFT",
      "sar_status_after": "APPROVED",
      "change_timestamp": "2026-03-29T11:45:00Z"
    }
  ],
  "total_versions": 3
}
```

**Features**:
- Shows complete edit history
- Lists analyst who made each change
- Shows change type and description
- Displays status before/after each change
- Ordered chronologically

---

### 4. Get Specific Version Content

**Endpoint**: `GET /api/sar/version/:versionId`

Retrieves the complete SAR content for a specific version.

```javascript
Request:
GET /api/sar/version/41

Response:
{
  "status": "success",
  "version_id": 41,
  "alert_id": "ALERT_TEST_001",
  "version_number": 2,
  "sar_content": "Full SAR text content for version 2...",
  "sar_format": "TEXT",
  "analyst_id": "ANALYST_001",
  "analyst_name": "John Doe",
  "role": "ANALYST",
  "change_type": "MODIFIED",
  "change_description": "Updated findings section",
  "sar_status_before": "DRAFT",
  "sar_status_after": "DRAFT",
  "change_timestamp": "2026-03-29T10:30:00Z"
}
```

---

### 5. Get Current/Latest Version

**Endpoint**: `GET /api/sar/current/:alertId`

Retrieves the most recent version of a SAR.

```javascript
Request:
GET /api/sar/current/ALERT_TEST_001

Response:
{
  "status": "success",
  "alert_id": "ALERT_TEST_001",
  "version_id": 42,
  "version_number": 3,
  "sar_content": "Latest SAR content...",
  "sar_format": "TEXT",
  "analyst_name": "Jane Smith",
  "role": "ANALYST",
  "sar_status": "APPROVED",
  "change_timestamp": "2026-03-29T11:45:00Z"
}
```

---

### 6. Revert to Previous Version

**Endpoint**: `POST /api/sar/version/revert/:versionId`

Reverts to a previous version by creating a NEW version pointing to old content.

```javascript
Request:
POST /api/sar/version/revert/41
{
  "analyst_id": "ANALYST_002",
  "analyst_name": "Manager Name",
  "role": "ADMIN"
}

Response:
{
  "status": "success",
  "alert_id": "ALERT_TEST_001",
  "reverted_from_version": 2,
  "new_version_number": 4,
  "new_version_id": 43,
  "message": "Successfully reverted to version 2. Created new version 4",
  "timestamp": "2026-03-29T12:00:00Z"
}
```

**Important**:
- Does NOT delete or modify existing versions
- Creates a NEW version with reverted content
- Maintains complete audit trail
- Previous "bad" versions remain visible in history

---

## Database Schema

### version_log Table

```sql
Column Name         | Type      | Description
--------------------|-----------|----------------------------------
version_id          | SERIAL    | Unique version identifier
alert_id            | VARCHAR   | Foreign key to alerts table
analyst_id          | VARCHAR   | ID of person making change
analyst_name        | VARCHAR   | Human-readable analyst name
role                | VARCHAR   | ANALYST, ADMIN, REVIEWER, SYSTEM
version_number      | INT       | Version number (1, 2, 3...)
sar_content         | TEXT      | Full SAR content for this version
sar_format          | VARCHAR   | TEXT or PDF
field_changed       | VARCHAR   | Which field was edited
old_value           | TEXT      | Previous value
new_value           | TEXT      | New value
change_description  | TEXT      | Human-readable change summary
change_type         | VARCHAR   | GENERATED, MODIFIED, APPROVED, REVERTED
sar_status_before   | VARCHAR   | SAR status before change
sar_status_after    | VARCHAR   | SAR status after change
change_timestamp    | TIMESTAMP | When change occurred
created_at          | TIMESTAMP | When record created
```

---

## Workflow Example

### Scenario: SAR Generation → Editing → Approval → Revert

**Step 1: Generate SAR (Version 1)**
```bash
POST /api/generate-sar
{
  "alertId": "ALERT_001",
  "alertData": { ...alert data... }
}
# ✓ Version 1 auto-created with GENERATED status
```

**Step 2: Analyst Reviews and Edits (Version 2)**
```bash
POST /api/sar/version/save
{
  "alert_id": "ALERT_001",
  "sar_content": "Updated SAR content...",
  "analyst_id": "ANALYST_001",
  "analyst_name": "John Analyst",
  "role": "ANALYST",
  "change_type": "MODIFIED",
  "change_description": "Added pattern analysis for structuring"
}
# ✓ Version 2 created
```

**Step 3: Senior Analyst Approves (Version 3)**
```bash
POST /api/sar/version/save
{
  "alert_id": "ALERT_001",
  "sar_content": "Approved SAR content...",
  "analyst_id": "ANALYST_SENIOR",
  "analyst_name": "Jane Senior",
  "role": "SENIOR_ANALYST",
  "change_type": "APPROVED",
  "change_description": "Approved by senior analyst"
}
# ✓ Version 3 created with APPROVED status
```

**Step 4: Discover Issue, Revert to Version 1**
```bash
POST /api/sar/version/revert/40
{
  "analyst_id": "ADMIN_001",
  "analyst_name": "Admin User",
  "role": "ADMIN"
}
# ✓ Version 4 created with Version 1 content
# All previous versions (1, 2, 3) remain in history
```

**Step 5: View Complete History**
```bash
GET /api/sar/versions/ALERT_001
# Returns all 4 versions with full metadata
```

---

## Data Flow: ML Predictions → Alerts

### ML Predictions Table Usage

When ML model scores a transaction:

```sql
-- 1. ML model generates prediction
INSERT INTO ml_predictions 
(account_id, transaction_id, rule_violated, score, prediction_timestamp)
VALUES ('ACC_001', 'TXN_001', 'Sudden Spike', 95, NOW());
```

### Alerts Table Usage

When alert threshold is triggered:

```sql
-- 2. Alert is generated from high-scoring prediction
INSERT INTO alerts 
(alert_id, transaction_id, account_id, confidence_score, risk_level, status, alert_timestamp)
VALUES ('ALERT_001', 'TXN_001', 'ACC_001', 95, 'CRITICAL', 'NEW', NOW());
```

### SAR Creation & Versioning

```sql
-- 3. SAR is generated and Version 1 auto-created
-- When /api/generate-sar is called, automatically:
INSERT INTO version_log
(alert_id, analyst_id, analyst_name, role, version_number, sar_content, 
 sar_format, change_type, change_description, sar_status_before, sar_status_after)
VALUES ('ALERT_001', 'SYSTEM', 'System', 'SYSTEM', 1, 'Full SAR content...',
        'TEXT', 'GENERATED', 'Initial SAR generated by system', 'DRAFT', 'DRAFT');
```

---

## Best Practices

### For Analysts

1. **Always provide change descriptions**: Makes audit trail meaningful
2. **Use appropriate change_type**: MODIFIED, APPROVED, APPROVED, REJECTED
3. **Add meaningful field_changed**: Helps track what was edited

### For Admins

1. **Regular version cleanup**: Old versions can be archived if needed
2. **Monitor revert operations**: Check audit log for unusual reversions
3. **Version documentation**: Maintain records of why versions were reverted

### For System Developers

1. **Auto-label SYSTEM operations**: For automatic version creation
2. **Include analyst context**: Always store who made the change
3. **Preserve old content**: Never delete versions, only archive

---

## Querying Version History

### Get all changes for an alert

```sql
SELECT version_number, analyst_name, change_type, change_description, change_timestamp
FROM version_log
WHERE alert_id = 'ALERT_001'
ORDER BY version_number ASC;
```

### Find who approved a SAR

```sql
SELECT analyst_name, change_timestamp
FROM version_log
WHERE alert_id = 'ALERT_001'
AND change_type = 'APPROVED'
LIMIT 1;
```

### Get revert history

```sql
SELECT version_number, analyst_name, change_timestamp
FROM version_log
WHERE alert_id = 'ALERT_001'
AND change_type = 'REVERTED'
ORDER BY change_timestamp DESC;
```

---

## Integration with Frontend

### In SARPage.js

```javascript
// Load version history
const fetchVersionHistory = async (alertId) => {
  const response = await fetch(`http://localhost:3000/api/sar/versions/${alertId}`);
  const data = await response.json();
  setVersions(data.versions);
};

// Save edited version
const handleSaveEdit = async () => {
  const response = await fetch('http://localhost:3000/api/sar/version/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_id: alertId,
      sar_content: editedContent,
      analyst_id: getCurrentUserId(),
      analyst_name: getCurrentUserName(),
      role: getCurrentUserRole(),
      change_type: 'MODIFIED',
      change_description: 'Updated by analyst'
    })
  });
};

// Revert to version
const handleRevert = async (versionId) => {
  const response = await fetch(`http://localhost:3000/api/sar/version/revert/${versionId}`, {
    method: 'POST',
    body: JSON.stringify({
      analyst_id: getCurrentUserId(),
      analyst_name: getCurrentUserName(),
      role: getCurrentUserRole()
    })
  });
};
```

---

## Compliance & Audit

- ✅ **Complete audit trail**: Every change tracked with analyst info
- ✅ **Non-destructive**: All versions preserved permanently  
- ✅ **Traceable reversions**: Revert operations create new versions
- ✅ **Timestamped**: Every change has exact timestamp
- ✅ **Role-based tracking**: Captures who did what
- ✅ **Status history**: Before/after status tracked for each change

---

## Troubleshooting

### Version not saving?
- Check alert_id exists in alerts table
- Verify analyst_id is provided
- Ensure sar_content is not empty

### Can't revert to version?
- Confirm version_id exists
- Check that alert_id matches
- Verify proper analyst credentials

### Missing version history?
- Verify version_log table has data
- Check alert exists in alerts table
- Ensure SAR generation auto-save is working

---

## Summary

This versioning system provides:

- ✅ **Automatic Version 1 Creation**: No manual setup needed
- ✅ **Complete Edit History**: Every change tracked with metadata
- ✅ **Non-Destructive Reversions**: Old versions remain accessible
- ✅ **Audit Trail**: Analyst ID, role, timestamp for every change
- ✅ **Easy Rollback**: Single endpoint to revert any version
- ✅ **Full Compliance**: Meets regulatory requirements for SAR documentation
