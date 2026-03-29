import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

/**
 * Intelligent Chatbot Component
 * Provides RAG-based querying for alerts and SARs
 * Supports risk analysis and compliance checking
 */
const Chatbot = ({ alertId, alertData }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your AML Compliance Assistant. I can help you understand alerts, compliance requirements, and suspicious activity patterns. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Send message to chatbot API
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('[Chatbot] Sending request:', { message: inputValue, alertId });
      
      const response = await fetch('http://localhost:3000/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          alertId: alertId || null,
          sectionContext: null,
        }),
      });

      console.log('[Chatbot] Response status:', response.status);
      const data = await response.json();
      console.log('[Chatbot] Response data:', data);

      if (response.ok && data.status === 'success') {
        // Add bot response
        const botMessage = {
          type: 'bot',
          text: data.response || data.message || 'No response generated',
          confidence: data.confidence,
          sources: data.sources || [],
          recommendations: data.recommendations || [],
          follow_up_questions: data.follow_up_questions || [],
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          type: 'bot',
          text: `⚠️ ${data.message || data.error || 'Failed to get response'}. Please check the server is running.`,
          error: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('[Chatbot] Network error:', error);
      const errorMessage = {
        type: 'bot',
        text: `❌ Network Error: ${error.message}. Make sure the backend server is running on port 3000.`,
        error: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Perform risk analysis
   */
  const handleRiskAnalysis = async () => {
    if (!alertData) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/chatbot/analyze-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertData }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisData(data);
        setShowAnalysis(true);

        // Add to chat
        const analysisMessage = {
          type: 'bot',
          text: `Risk Analysis Complete:\n${data.summary}`,
          analysis: data,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, analysisMessage]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Perform compliance check
   */
  const handleComplianceCheck = async () => {
    if (!alertData) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/chatbot/compliance-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertData }),
      });

      const data = await response.json();

      if (response.ok) {
        let complianceText = `Compliance Check Results:\n`;
        complianceText += `Risk Level: ${data.compliance_risk}\n\n`;
        complianceText += `Findings:\n`;
        data.findings.forEach(f => {
          complianceText += `• ${f}\n`;
        });
        complianceText += `\nRequired Actions:\n`;
        data.required_actions.forEach(a => {
          complianceText += `• ${a}\n`;
        });

        const complianceMessage = {
          type: 'bot',
          text: complianceText,
          compliance: data,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, complianceMessage]);
      }
    } catch (error) {
      console.error('Compliance check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle quick question suggestion
   */
  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <h3>AML Compliance Assistant</h3>
          <p className="status">
            {alertId ? `Alert: ${alertId}` : 'General inquiry'}
          </p>
        </div>
        <div className="header-actions">
          {/* Action buttons removed for better UI spacing */}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.type} ${msg.error ? 'error' : ''}`}
          >
            <div className="message-bubble">
              <p className="message-text">{msg.text}</p>

              {msg.confidence !== undefined && (
                <div className="confidence-badge">
                  Confidence: {(msg.confidence * 100).toFixed(0)}%
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  <strong>Sources:</strong>
                  <ul>
                    {msg.sources.map((source, i) => (
                      <li key={i}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="recommendations">
                  <strong>Recommendations:</strong>
                  <ul>
                    {msg.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                <div className="follow-up">
                  <strong>You might also ask:</strong>
                  <div className="quick-questions">
                    {msg.follow_up_questions.map((q, i) => (
                      <button
                        key={i}
                        className="quick-question"
                        onClick={() => handleQuickQuestion(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msg.analysis && (
                <div className="analysis-preview">
                  <strong>Risk Analysis Results:</strong>
                  <div className="risk-breakdown">
                    {Object.entries(msg.analysis.risk_analysis?.risk_score_breakdown || {}).map(
                      ([key, value]) => (
                        <div key={key} className="metric">
                          <span>{key.replace(/_/g, ' ')}:</span>
                          <span className="value">{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {msg.compliance && (
                <div className="compliance-preview">
                  <strong>Compliance Status:</strong>
                  <div className={`risk-indicator ${msg.compliance.compliance_risk.toLowerCase()}`}>
                    Risk: {msg.compliance.compliance_risk}
                  </div>
                </div>
              )}

              <div className="message-time">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot">
            <div className="message-bubble loading">
              <span className="typing-indicator"></span>
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Ask about this alert, compliance requirements, or suspicious patterns..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          title="Send message"
        >
          Send
        </button>
      </form>

      {showAnalysis && analysisData && (
        <div className="analysis-panel">
          <div className="panel-header">
            <h4>Risk Analysis Details</h4>
            <button
              className="close-btn"
              onClick={() => setShowAnalysis(false)}
            >
              ✕
            </button>
          </div>
          <div className="panel-content">
            <div className="analysis-section">
              <h5>Transaction Patterns:</h5>
              <ul>
                {analysisData.risk_analysis?.transaction_pattern?.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="analysis-section">
              <h5>Behavioral Flags:</h5>
              <ul>
                {analysisData.risk_analysis?.behavioral_flags?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="analysis-section">
              <h5>Regulatory Concerns:</h5>
              <ul>
                {analysisData.risk_analysis?.regulatory_concerns?.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
