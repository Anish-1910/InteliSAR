import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Chatbot from './Chatbot';
import AlertAnalytics from './AlertAnalytics';
import './SARPage.css';

const DiffViewer = ({ original, edited }) => {
  const getLineDiff = (origLine, editLine) => {
    if (origLine === editLine) return { type: 'same', line: origLine };
    if (!origLine) return { type: 'added', line: editLine };
    if (!editLine) return { type: 'deleted', line: origLine };
    return { type: 'modified', line: editLine };
  };

  const origLines = original.split('\n');
  const editLines = edited.split('\n');
  const maxLines = Math.max(origLines.length, editLines.length);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Changes Preview</h3>
      <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
        {Array.from({ length: maxLines }).map((_, idx) => {
          const origLine = origLines[idx] || '';
          const editLine = editLines[idx] || '';
          const diff = getLineDiff(origLine, editLine);

          if (diff.type === 'same') {
            return (
              <div key={idx} className="flex text-gray-600">
                <span className="w-10 text-right pr-4 text-gray-400">{idx + 1}</span>
                <span>{diff.line}</span>
              </div>
            );
          } else if (diff.type === 'deleted') {
            return (
              <div key={idx} className="flex bg-red-50 text-red-800 border-l-4 border-red-500">
                <span className="w-10 text-right pr-4 text-red-500">{idx + 1}</span>
                <span className="flex-1">
                  <span className="text-red-600 font-bold">−</span> {diff.line}
                </span>
              </div>
            );
          } else if (diff.type === 'added') {
            return (
              <div key={idx} className="flex bg-green-50 text-green-800 border-l-4 border-green-500">
                <span className="w-10 text-right pr-4 text-green-500">{idx + 1}</span>
                <span className="flex-1">
                  <span className="text-green-600 font-bold">+</span> {diff.line}
                </span>
              </div>
            );
          } else {
            return (
              <div key={idx} className="flex bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500">
                <span className="w-10 text-right pr-4 text-yellow-500">{idx + 1}</span>
                <span className="flex-1">
                  <span className="text-yellow-600 font-bold">~</span> {diff.line}
                </span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

const SARPage = () => {
  const navigate = useNavigate();
  const { alertId } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sarContent, setSarContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [versions, setVersions] = useState([]);
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);
  const [format, setFormat] = useState('text'); // 'text' or 'pdf'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [isDownloading, setIsDownloading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your SAR assistant. How can I help you with this suspicious activity report?", sender: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchAlertDetails();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true);
      const response = await axios.get('http://localhost:3000/api/templates');
      setTemplates(response.data.templates || []);
      if (response.data.templates && response.data.templates.length > 0) {
        setSelectedTemplate(response.data.templates[0]);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplates(['default']);
      setSelectedTemplate('default');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleGenerateSAR = async () => {
    if (!alert) return;

    setIsGenerating(true);
    try {
      console.log(`Generating SAR for alert: ${alert.alert_id} in format: ${format}`);
      
      if (format === 'pdf') {
        // Generate PDF - returns binary data
        const response = await axios.post(
          'http://localhost:3000/api/generate-sar-pdf',
          {
            alertId: alert.alert_id || alertId,
            templateName: selectedTemplate
          },
          { responseType: 'blob' }
        );

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `SAR_${alert.alert_id}_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSarContent(`PDF generated and downloaded: SAR_${alert.alert_id}_${Date.now()}.pdf`);
      } else {
        // Generate text SAR
        const response = await axios.post('http://localhost:3000/api/generate-sar', {
          alertId: alert.alert_id || alertId,
          alertData: {
            alert_id: alert.alert_id || alertId,
            ...alert
          }
        });

        setSarContent(response.data.sar_text);
        setEditedContent(response.data.sar_text);
        setVersions([{ content: response.data.sar_text, timestamp: new Date() }]);
      }
      
      setIsEditing(false);
      setShowDiff(false);
    } catch (err) {
      setError('Failed to generate SAR: ' + err.message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSAR = () => {
    if (!isEditing) {
      setEditedContent(sarContent);
    }
    setIsEditing(!isEditing);
    setShowDiff(false);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      setSarContent(editedContent);
      setVersions([...versions, { content: editedContent, timestamp: new Date() }]);
      setIsEditing(false);
      setShowDiff(false);
      setIsChatbotMinimized(false);
    }
  };

  const handleRevertVersion = (versionIdx) => {
    setSarContent(versions[versionIdx].content);
    setEditedContent(versions[versionIdx].content);
  };

  const handleSaveSAR = () => {
    handleSaveEdit();
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
              {/* Format Selection */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFormat('text')}
                  className={`px-3 py-1 rounded transition-colors ${
                    format === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setFormat('pdf')}
                  className={`px-3 py-1 rounded transition-colors ${
                    format === 'pdf'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PDF
                </button>
              </div>

              {/* Template Selection */}
              {format === 'pdf' && templates.length > 0 && (
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {templates.map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              )}

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
                {isEditing ? 'Edit Mode On' : 'Edit SAR'}
              </button>

              {isEditing && (
                <>
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showDiff ? 'Hide Diff' : 'View Diff'}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(sarContent);
                      setShowDiff(false);
                      setIsChatbotMinimized(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </>
              )}
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
        <div className={`grid gap-6 h-[calc(100vh-280px)] ${isEditing ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* SAR Generation Section */}
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden ${isEditing ? 'col-span-1' : 'lg:col-span-3'}`}>
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
                    // Split View Layout
                    <div className="grid grid-cols-2 gap-6 min-h-full">
                      {/* Left Pane - Original (Read-Only) */}
                      <div className="flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Original SAR</h4>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Read-Only</span>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white p-4">
                          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                            {sarContent}
                          </pre>
                        </div>
                      </div>

                      {/* Right Pane - Editable */}
                      <div className="flex flex-col border-2 border-green-300 rounded-lg overflow-hidden">
                        <div className="bg-green-100 px-4 py-3 border-b-2 border-green-300 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Edited SAR</h4>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Editing</span>
                        </div>
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="flex-1 p-4 border-0 focus:ring-0 font-mono text-sm resize-none"
                          placeholder="Make your edits here..."
                          style={{ minHeight: '400px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Normal View
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

              {/* Show Diff if requested */}
              {isEditing && showDiff && sarContent && editedContent && (
                <DiffViewer original={sarContent} edited={editedContent} />
              )}
            </div>
          </div>

          {/* Chatbot Section (1/4) - Only show when not editing */}
          {!isEditing && (
            <Chatbot alertId={alertId} alertData={alert} />
          )}
        </div>

        {/* Alert Analytics Section - Display below SAR generation */}
        {sarContent && !isEditing && (
          <AlertAnalytics alert={alert} />
        )}
      </main>

      {/* Floating Chatbot Popup - Only show when editing */}
      {isEditing && (
        <>
          {isChatbotMinimized ? (
            // Minimized Chatbot Icon
            <button
              onClick={() => setIsChatbotMinimized(false)}
              className="fixed bottom-8 right-8 flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-50 animate-fadeIn"
              title="Open SAR Assistant"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          ) : (
            // Full Chatbot Window
            <div className="fixed bottom-8 right-8 w-96 h-96 bg-white rounded-lg shadow-2xl border-2 border-blue-500 flex flex-col z-50 animate-fadeIn">
              {/* Floating Chatbot Header */}
              <div className="p-4 bg-blue-600 text-white rounded-t-lg flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold">SAR Assistant</h3>
                </div>
                <button
                  onClick={() => setIsChatbotMinimized(true)}
                  className="text-white hover:bg-blue-700 p-1 rounded transition-colors"
                  title="Minimize SAR Assistant"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-300'
                      }`}
                    >
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-lg">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about SAR..."
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
          )}
        </>
      )}
    </div>
  );
};

export default SARPage;