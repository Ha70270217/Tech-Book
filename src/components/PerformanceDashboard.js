import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';
import { performanceBudget } from '../utils/performanceBudget';

// Performance dashboard component
const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    updateMetrics();

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    try {
      // Get performance metrics
      const perfMetrics = performanceMonitor.getPerformanceSummary();
      setMetrics(perfMetrics);

      // Get budget status
      const budgetStats = performanceBudget.getBudgetStatus();
      setBudgetStatus(budgetStats);

      // Get summary
      const perfSummary = performanceBudget.getPerformanceSummary();
      setSummary(perfSummary);

      // Get recommendations
      const recs = performanceBudget.getRecommendations();
      setRecommendations(recs);

      setLoading(false);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    performanceBudget.downloadReport('performance-report', format);
  };

  const getMetricStatus = (current, max) => {
    if (current === null) return 'unknown';
    const ratio = current / max;
    if (ratio <= 1) return 'good';
    if (ratio <= 1.2) return 'warning';
    return 'poor';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize application performance metrics</p>

          <div className="flex flex-wrap items-center justify-between mt-6">
            <div className="flex space-x-2 mb-4 md:mb-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'overview'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'metrics'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'budget'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Budget
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'recommendations'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Recommendations
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('json')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Performance Score</h2>
                  <p className="text-gray-600">Overall performance rating</p>
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(summary.score)}`}>
                  {summary.score}
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                <p className="text-gray-700">{summary.summary}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Violations</p>
                    <p className="text-2xl font-bold text-red-600">{summary.violations}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recommendations</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.recommendations}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{summary.passed ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Update</p>
                    <p className="text-2xl font-bold text-gray-800">{new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Core Web Vitals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">LCP (ms)</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {metrics.metrics.largestContentfulPaint?.toFixed(0) || 'N/A'}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                    getMetricStatus(metrics.metrics.largestContentfulPaint, 2500) === 'good' ? 'bg-green-100 text-green-800' :
                    getMetricStatus(metrics.metrics.largestContentfulPaint, 2500) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getMetricStatus(metrics.metrics.largestContentfulPaint, 2500)}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">CLS</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {metrics.metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                    getMetricStatus(metrics.metrics.cumulativeLayoutShift, 0.1) === 'good' ? 'bg-green-100 text-green-800' :
                    getMetricStatus(metrics.metrics.cumulativeLayoutShift, 0.1) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getMetricStatus(metrics.metrics.cumulativeLayoutShift, 0.1)}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">FID (ms)</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {metrics.metrics.firstInputDelay?.toFixed(0) || 'N/A'}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                    getMetricStatus(metrics.metrics.firstInputDelay, 100) === 'good' ? 'bg-green-100 text-green-800' :
                    getMetricStatus(metrics.metrics.firstInputDelay, 100) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getMetricStatus(metrics.metrics.firstInputDelay, 100)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700">Page Load (ms)</h3>
                  <p className="text-lg font-bold text-gray-800">
                    {metrics.metrics.pageLoadTime?.toFixed(0) || 'N/A'}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700">FCP (ms)</h3>
                  <p className="text-lg font-bold text-gray-800">
                    {metrics.metrics.firstContentfulPaint?.toFixed(0) || 'N/A'}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700">Avg Load (ms)</h3>
                  <p className="text-lg font-bold text-gray-800">
                    {metrics.metrics.avgPageLoadTime?.toFixed(0) || 'N/A'}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700">Resources</h3>
                  <p className="text-lg font-bold text-gray-800">
                    {metrics.metrics.resourceLoadTimes?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && budgetStatus && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Compliance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(budgetStatus).map(([metric, data]) => (
                      <tr key={metric}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {typeof data.current === 'number' ? data.current.toLocaleString() : data.current}
                          <span className="text-xs ml-1">{data.unit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.max.toLocaleString()}
                          <span className="text-xs ml-1">{data.unit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            data.withinBudget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {data.withinBudget ? 'Within Budget' : 'Exceeded'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h2>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{rec.metric}</h3>
                          <p className="text-gray-600">{rec.message}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recommendations at this time. Performance metrics are within acceptable ranges!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;