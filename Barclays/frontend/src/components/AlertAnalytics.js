import React from 'react';

const AlertAnalytics = ({ alert }) => {
  if (!alert) return null;

  // Generate sample trend data based on alert
  const trendData = [
    { day: 'Mon', amount: 1200, risk: 25 },
    { day: 'Tue', amount: 1900, risk: 40 },
    { day: 'Wed', amount: 900, risk: 30 },
    { day: 'Thu', amount: 2200, risk: 65 },
    { day: 'Fri', amount: 2290, risk: 80 },
    { day: 'Sat', amount: 2000, risk: 55 },
    { day: 'Sun', amount: 2200, risk: 72 },
  ];

  // Risk breakdown data
  const riskBreakdown = [
    { category: 'Sanctions Match', percentage: 35, color: 'from-red-500 to-red-600' },
    { category: 'PEP Check', percentage: 25, color: 'from-orange-500 to-orange-600' },
    { category: 'Unusual Pattern', percentage: 20, color: 'from-yellow-500 to-yellow-600' },
    { category: 'Geographic', percentage: 15, color: 'from-purple-500 to-purple-600' },
    { category: 'Amount Threshold', percentage: 5, color: 'from-blue-500 to-blue-600' },
  ];

  // TransactionTypes data
  const transactionTypes = [
    { type: 'Wire Transfer', count: 45, color: '#3B82F6' },
    { type: 'Cryptocurrency', count: 28, color: '#10B981' },
    { type: 'Cash Deposit', count: 18, color: '#F59E0B' },
    { type: 'International', count: 12, color: '#EF4444' },
  ];

  // Calculate max value for chart scaling
  const maxAmount = Math.max(...trendData.map(d => d.amount));
  const maxRisk = 100;

  // Generate simple bar chart
  const renderTrendChart = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction Trend (7 Days)</h3>
        <div className="space-y-4">
          {trendData.map((data, idx) => {
            const amountHeight = (data.amount / maxAmount) * 200;
            return (
              <div key={idx} className="flex items-end space-x-2">
                <div className="w-12">
                  <p className="text-xs font-medium text-gray-600 text-center">{data.day}</p>
                </div>
                <div className="flex-1 flex items-end space-x-2">
                  {/* Amount Bar */}
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer group relative"
                    style={{ height: `${amountHeight}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.amount}
                    </div>
                  </div>
                  {/* Risk Bar */}
                  <div
                    className="bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all hover:from-red-600 hover:to-red-500 cursor-pointer group relative"
                    style={{ height: `${(data.risk / maxRisk) * 200}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Risk: {data.risk}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-8 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
            <span className="text-gray-600">Transaction Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-400 rounded"></div>
            <span className="text-gray-600">Risk Score</span>
          </div>
        </div>
      </div>
    );
  };

  // Risk breakdown donut chart
  const renderRiskBreakdown = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Factor Breakdown</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {riskBreakdown.map((item, idx) => {
                  let startAngle = 0;
                  for (let i = 0; i < idx; i++) {
                    startAngle += (riskBreakdown[i].percentage / 100) * 360;
                  }
                  const endAngle = startAngle + (item.percentage / 100) * 360;
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const startX = 50 + 40 * Math.cos(startRad);
                  const startY = 50 + 40 * Math.sin(startRad);
                  const endX = 50 + 40 * Math.cos(endRad);
                  const endY = 50 + 40 * Math.sin(endRad);
                  
                  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                  
                  const colors = [
                    '#EF4444', '#F97316', '#EAB308', '#A855F7', '#3B82F6'
                  ];
                  
                  return (
                    <path
                      key={idx}
                      d={`M ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} L ${50 + 25 * Math.cos((startRad + endRad) / 2)} ${50 + 25 * Math.sin((startRad + endRad) / 2)} Z`}
                      fill={colors[idx]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {alert.confidence_score || 72}%
                  </p>
                  <p className="text-xs text-gray-500">Threat Level</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {riskBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-purple-500', 'bg-blue-500'][idx]}`}></div>
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Transaction type distribution
  const renderTransactionTypes = () => {
    const total = transactionTypes.reduce((sum, t) => sum + t.count, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction Pattern Analysis</h3>
        <div className="space-y-4">
          {transactionTypes.map((item, idx) => {
            const percentage = (item.count / total) * 100;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count} ‧ {percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 hover:shadow-lg"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-900">{total}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-600 font-medium">High Risk Types</p>
            <p className="text-2xl font-bold text-red-900">{transactionTypes.slice(1, 3).reduce((sum, t) => sum + t.count, 0)}</p>
          </div>
        </div>
      </div>
    );
  };

  // Customer profile insights
  const renderCustomerInsights = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Risk Profile</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm text-blue-600 font-medium">Account Age</p>
              <p className="text-2xl font-bold text-blue-900">2.3 years</p>
            </div>
            <div className="text-blue-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div>
              <p className="text-sm text-green-600 font-medium">Average Monthly Volume</p>
              <p className="text-2xl font-bold text-green-900">$45,230</p>
            </div>
            <div className="text-green-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div>
              <p className="text-sm text-orange-600 font-medium">Previous Alerts</p>
              <p className="text-2xl font-bold text-orange-900">3 alerts</p>
            </div>
            <div className="text-orange-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6v2m0 4v2m0-6v2m0 4v2" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
            <div>
              <p className="text-sm text-red-600 font-medium">Sanctions Check</p>
              <p className="text-2xl font-bold text-red-900">FLAGGED ⚠️</p>
            </div>
            <div className="text-red-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8a4 4 0 100-8 4 4 0 000 8zM6 15H4a6 6 0 00-6 6v3h16v-3a6 6 0 00-6-6h-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Alert Analytics & Insights</h2>
      
      {/* Grid layout for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTrendChart()}
        {renderRiskBreakdown()}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTransactionTypes()}
        {renderCustomerInsights()}
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <h3 className="text-xl font-bold mb-6">Executive Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">{alert.confidence_score || 72}%</p>
            <p className="text-purple-100 text-sm">Confidence Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">${alert.amount ? alert.amount.toLocaleString() : '245,000'}</p>
            <p className="text-purple-100 text-sm">Transaction Amount</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">3</p>
            <p className="text-purple-100 text-sm">Risk Factors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">CRITICAL</p>
            <p className="text-purple-100 text-sm">Alert Level</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-white bg-opacity-20 rounded-lg border border-white border-opacity-30 backdrop-blur">
          <p className="text-sm leading-relaxed">
            This transaction matches {riskBreakdown.length} risk criteria. Immediate investigation recommended based on sanctions database match and unusual transaction pattern for this customer account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertAnalytics;
