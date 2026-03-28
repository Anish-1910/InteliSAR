import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const SARPage = () => {
  const navigate = useNavigate();
  const { alertId } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sarContent, setSarContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your SAR assistant. How can I help you with this suspicious activity report?", sender: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);

  const fetchAlertDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/alerts/${alertId}`);
      setAlert(response.data.alert);
      setError(null);
    } catch (err) {
      setError('Failed to fetch alert details: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSAR = async () => {
    if (!alert) return;

    setIsGenerating(true);
    try {
      const response = await axios.post('http://localhost:3000/api/generate-sar', {
        alertId: alert.alert_id,
        alertData: alert
      });

      setSarContent(response.data.sarContent);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to generate SAR: ' + err.message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSAR = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveSAR = () => {
    // Here you would save the edited SAR content
    setIsEditing(false);
    // You could make an API call to save the edited content
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user'
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        text: "I understand your question about this SAR. Based on the alert details, I recommend reviewing the transaction patterns and customer history before finalizing the report.",
        sender: 'bot'
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getRiskLevelStyle = (riskLevel) => {
    const styles = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      medium: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      low: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      minimal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
    };
    return styles[riskLevel?.toLowerCase()] || styles.low;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Alert</h2>
          <p className="text-gray-600 mb-4">{error || 'Alert not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const riskStyle = getRiskLevelStyle(alert.risk_level);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">SAR Generation</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateSAR}
                disabled={isGenerating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate SAR
                  </>
                )}
              </button>
              <button
                onClick={handleEditSAR}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  isEditing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Save Edit' : 'Edit SAR'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Information Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alert #{alert.alert_id}</h2>
                <p className="text-sm text-gray-600">Transaction ID: {alert.transaction_id}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}>
                  {alert.risk_level} Risk
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {alert.confidence_score}% Confidence
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Account: {alert.account_id}</p>
              <p className="text-sm text-gray-600">Customer: {alert.customer_name || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          {/* SAR Generation Section (3/4) */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Suspicious Activity Report</h3>
                {sarContent && (
                  <span className="text-sm text-green-600 font-medium">Generated Successfully</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {sarContent ? (
                <div>
                  {isEditing ? (
                    <textarea
                      value={sarContent}
                      onChange={(e) => setSarContent(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Edit the SAR content..."
                      style={{ minHeight: '400px' }}
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                        {sarContent}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2">No SAR Generated Yet</h4>
                  <p className="text-center mb-4">Click the "Generate SAR" button above to create a comprehensive suspicious activity report for this alert.</p>
                  <button
                    onClick={handleGenerateSAR}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating SAR...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Generate SAR Now
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chatbot Section (1/4) */}
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">SAR Assistant</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about this SAR..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SARPage;