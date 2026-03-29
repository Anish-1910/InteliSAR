import React, { useState } from 'react';
import axios from 'axios';
import './SARPanel.css';

function SARPanel({ alert }) {
  const [sarContent, setSarContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSAR = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Node.js backend to generate SAR using LLM
      const response = await axios.post(
        'http://localhost:3000/api/sar/generate',
        {
          alert_id: alert.alert_id,
          transaction_id: alert.transaction_id,
          account_id: alert.account_id,
          confidence_score: alert.confidence_score,
          risk_level: alert.risk_level,
          patterns_detected: alert.patterns_detected,
        }
      );

      setSarContent(response.data);
    } catch (err) {
      setError('Failed to generate SAR: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sar-panel">
      <div className="sar-header">
        <h2>📄 SAR Generation</h2>
        <div className="alert-info">
          <span className="label">Alert ID:</span>
          <span className="value">{alert.alert_id}</span>
        </div>
      </div>

      <div className="sar-content">
        {!sarContent ? (
          <div className="sar-empty">
            <p>Click the button below to generate a Suspicious Activity Report (SAR)</p>
            <button
              onClick={generateSAR}
              disabled={loading}
              className="generate-btn"
            >
              {loading ? '⏳ Generating SAR...' : '✨ Generate SAR'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="sar-result">
            <div className="sar-actions">
              <button onClick={generateSAR} className="regenerate-btn">
                🔄 Regenerate SAR
              </button>
              <button
                onClick={() => {
                  const element = document.createElement('a');
                  element.setAttribute(
                    'href',
                    'data:text/plain;charset=utf-8,' + encodeURIComponent(sarContent.sar_text)
                  );
                  element.setAttribute('download', `SAR_${alert.alert_id}.txt`);
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="download-btn"
              >
                📥 Download SAR
              </button>
            </div>

            <div className="sar-output">
              <pre>{sarContent.sar_text}</pre>
            </div>

            <div className="sar-metadata">
              <h3>Generation Details</h3>
              <p><strong>Generated At:</strong> {new Date(sarContent.generated_at).toLocaleString()}</p>
              <p><strong>Model:</strong> {sarContent.model}</p>
              <p><strong>Tokens Used:</strong> {sarContent.tokens_used}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SARPanel;