import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

// Component to display performance metrics and offline status
const PerformanceIndicator = () => {
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [performanceData, setPerformanceData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update online status
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial performance data
    const perfData = performanceMonitor.getPerformanceSummary();
    setPerformanceData(perfData);

    // Update performance data periodically
    const interval = setInterval(() => {
      const updatedData = performanceMonitor.getPerformanceSummary();
      setPerformanceData(updatedData);
    }, 10000); // Update every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  if (!performanceData) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Performance</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-500 hover:text-gray-700"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className={`flex items-center ${getStatusColor(performanceData.overallScore)}`}>
          <div className="w-3 h-3 rounded-full mr-2 bg-current"></div>
          <span className="font-bold">{performanceData.overallScore}</span>
          <span className="ml-1 text-sm">{getScoreLabel(performanceData.overallScore)}</span>
        </div>

        <div className={`flex items-center ${onlineStatus ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${onlineStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <span className="text-sm">{onlineStatus ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {showDetails && (
        <div className="border-t pt-3 text-sm">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>LCP: {Math.round(performanceData.metrics.largestContentfulPaint)}ms</div>
            <div className={getStatusColor(performanceData.standards.scores.lcp)}>
              {performanceData.standards.scores.lcp}
            </div>
            <div>CLS: {performanceData.metrics.cumulativeLayoutShift.toFixed(3)}</div>
            <div className={getStatusColor(performanceData.standards.scores.cls)}>
              {performanceData.standards.scores.cls}
            </div>
            <div>FID: {Math.round(performanceData.metrics.firstInputDelay)}ms</div>
            <div className={getStatusColor(performanceData.standards.scores.fid)}>
              {performanceData.standards.scores.fid}
            </div>
          </div>

          {performanceData.recommendations.length > 0 && (
            <div className="mt-2">
              <div className="font-medium text-sm text-gray-700 mb-1">Recommendations:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {performanceData.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceIndicator;