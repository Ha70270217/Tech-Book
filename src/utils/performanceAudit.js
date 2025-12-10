// Performance audit and reporting tools

class PerformanceAudit {
  constructor() {
    this.auditResults = [];
    this.auditHistory = [];
    this.maxHistory = 100; // Keep last 100 audit results
    this.isAuditing = false;
    this.currentAudit = null;
    this.auditSettings = {
      enabled: true,
      autoRun: true,
      interval: 300000, // Run every 5 minutes
      thresholds: {
        lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
        cls: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
        fid: { good: 100, poor: 300 }, // First Input Delay
        fcp: { good: 1800, poor: 3000 }, // First Contentful Paint
        ttfb: { good: 800, poor: 1800 }, // Time to First Byte
        totalSize: { good: 1.5 * 1024 * 1024, poor: 3 * 1024 * 1024 }, // Total page size in bytes
        requestCount: { good: 30, poor: 60 } // Number of requests
      },
      metrics: [
        'lcp', 'cls', 'fid', 'fcp', 'ttfb', 'totalSize', 'requestCount'
      ]
    };
    this.auditInterval = null;
  }

  // Initialize the audit system
  init(settings = {}) {
    this.auditSettings = { ...this.auditSettings, ...settings };

    if (this.auditSettings.autoRun) {
      this.startAutoAudit();
    }

    // Run initial audit when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.runAudit('initial');
      });
    } else {
      this.runAudit('initial');
    }
  }

  // Start automatic auditing
  startAutoAudit() {
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
    }

    this.auditInterval = setInterval(() => {
      this.runAudit('scheduled');
    }, this.auditSettings.interval);
  }

  // Stop automatic auditing
  stopAutoAudit() {
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
      this.auditInterval = null;
    }
  }

  // Run a performance audit
  async runAudit(type = 'manual') {
    if (this.isAuditing) {
      console.warn('Audit already in progress, skipping');
      return null;
    }

    this.isAuditing = true;
    this.currentAudit = {
      id: this.generateAuditId(),
      type,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      results: {},
      recommendations: []
    };

    try {
      // Collect all performance metrics
      const metrics = await this.collectAllMetrics();

      // Evaluate metrics against thresholds
      const evaluations = this.evaluateMetrics(metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(evaluations, metrics);

      // Create audit result
      const auditResult = {
        ...this.currentAudit,
        results: metrics,
        evaluations,
        recommendations,
        score: this.calculatePerformanceScore(evaluations)
      };

      // Add to results and history
      this.auditResults.push(auditResult);

      this.auditHistory.push(auditResult);
      if (this.auditHistory.length > this.maxHistory) {
        this.auditHistory.shift();
      }

      // Trigger any registered callbacks
      this.triggerAuditCallbacks(auditResult);

      return auditResult;
    } catch (error) {
      console.error('Error running performance audit:', error);
      return null;
    } finally {
      this.isAuditing = false;
      this.currentAudit = null;
    }
  }

  // Collect all performance metrics
  async collectAllMetrics() {
    const metrics = {};

    // Collect Core Web Vitals
    metrics.lcp = await this.getLCP();
    metrics.cls = await this.getCLS();
    metrics.fid = await this.getFID();

    // Collect additional metrics
    metrics.fcp = await this.getFCP();
    metrics.ttfb = await this.getTTFB();

    // Collect resource metrics
    metrics.totalSize = await this.getTotalSize();
    metrics.requestCount = await this.getRequestCount();

    // Collect other metrics
    metrics.domContentLoaded = await this.getDOMContentLoadTime();
    metrics.pageLoad = await this.getPageLoadTime();
    metrics.speedIndex = await this.getSpeedIndex();

    return metrics;
  }

  // Get Largest Contentful Paint
  getLCP() {
    return new Promise((resolve) => {
      if ('LargestContentfulPaint' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          // Report the final LCP value
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      } else {
        resolve(null);
      }

      // If page has already loaded, resolve with null
      if (document.readyState === 'complete') {
        resolve(null);
      } else {
        window.addEventListener('load', () => {
          resolve(null); // LCP might not be available if no observer was set early enough
        });
      }
    });
  }

  // Get Cumulative Layout Shift
  getCLS() {
    return new Promise((resolve) => {
      let clsValue = 0;

      if ('LayoutShift' in window) {
        new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        }).observe({ entryTypes: ['layout-shift'] });
      }

      // CLS is cumulative, so return the value after a delay
      setTimeout(() => {
        resolve(clsValue);
      }, 5000); // Wait for potential late shifts
    });
  }

  // Get First Input Delay (estimated via Event Timing)
  getFID() {
    return new Promise((resolve) => {
      if ('EventTiming' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const firstInput = entries[0];
            const fid = firstInput.processingStart - firstInput.startTime;
            resolve(fid);
          }
        }).observe({ entryTypes: ['first-input'] });
      } else {
        resolve(null);
      }

      // If no input occurs, resolve with null after timeout
      setTimeout(() => {
        resolve(null);
      }, 10000);
    });
  }

  // Get First Contentful Paint
  getFCP() {
    return new Promise((resolve) => {
      if ('paint' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

        if (fcpEntry) {
          resolve(fcpEntry.startTime);
        } else {
          // Wait for FCP to occur
          new PerformanceObserver((list, obs) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

            if (fcpEntry) {
              obs.disconnect();
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });
        }
      } else {
        resolve(null);
      }
    });
  }

  // Get Time to First Byte
  getTTFB() {
    return new Promise((resolve) => {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0];
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        resolve(ttfb);
      } else {
        resolve(null);
      }
    });
  }

  // Get total page size
  getTotalSize() {
    return new Promise((resolve) => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;

      resources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
        }
      });

      resolve(totalSize);
    });
  }

  // Get request count
  getRequestCount() {
    return new Promise((resolve) => {
      const resources = performance.getEntriesByType('resource');
      const navigation = performance.getEntriesByType('navigation');

      resolve(resources.length + navigation.length);
    });
  }

  // Get DOM content loaded time
  getDOMContentLoadTime() {
    return new Promise((resolve) => {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0];
        resolve(navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
      } else {
        resolve(null);
      }
    });
  }

  // Get page load time
  getPageLoadTime() {
    return new Promise((resolve) => {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0];
        resolve(navEntry.loadEventEnd - navEntry.fetchStart);
      } else {
        resolve(null);
      }
    });
  }

  // Estimate Speed Index (simplified calculation)
  getSpeedIndex() {
    return new Promise((resolve) => {
      // Simplified speed index calculation
      // In a real implementation, this would require frame capture and analysis
      // For now, we'll use a combination of LCP and FCP as approximation
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0];
        // Approximation: weighted average of FCP and LCP
        const fcp = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
        const lcp = navEntry.loadEventEnd - navEntry.fetchStart; // Using load time as proxy
        resolve(Math.round((fcp * 0.3) + (lcp * 0.7)));
      } else {
        resolve(null);
      }
    });
  }

  // Evaluate metrics against thresholds
  evaluateMetrics(metrics) {
    const evaluations = {};

    for (const [metric, value] of Object.entries(metrics)) {
      if (value === null || value === undefined) {
        evaluations[metric] = {
          value,
          score: null,
          status: 'unknown',
          message: 'Metric not available'
        };
        continue;
      }

      const thresholds = this.auditSettings.thresholds[metric];
      if (!thresholds) {
        evaluations[metric] = {
          value,
          score: null,
          status: 'unknown',
          message: 'No thresholds defined for this metric'
        };
        continue;
      }

      let status, score, message;

      if (metric === 'cls') {
        // For CLS, lower is better
        if (value <= thresholds.good) {
          status = 'good';
          score = 100;
          message = 'Excellent cumulative layout shift';
        } else if (value <= thresholds.poor) {
          status = 'needs-improvement';
          score = Math.round(100 - ((value - thresholds.good) / (thresholds.poor - thresholds.good)) * 50);
          message = 'Moderate cumulative layout shift';
        } else {
          status = 'poor';
          score = Math.max(0, Math.round(50 - ((value - thresholds.poor) / thresholds.poor) * 50));
          message = 'High cumulative layout shift';
        }
      } else {
        // For other metrics, lower is better
        if (value <= thresholds.good) {
          status = 'good';
          score = 100;
          message = 'Excellent performance';
        } else if (value <= thresholds.poor) {
          status = 'needs-improvement';
          score = Math.round(100 - ((value - thresholds.good) / (thresholds.poor - thresholds.good)) * 50);
          message = 'Needs improvement';
        } else {
          status = 'poor';
          score = Math.max(0, Math.round(50 - ((value - thresholds.poor) / thresholds.poor) * 50));
          message = 'Poor performance';
        }
      }

      evaluations[metric] = {
        value,
        score,
        status,
        message
      };
    }

    return evaluations;
  }

  // Generate recommendations based on audit results
  generateRecommendations(evaluations, metrics) {
    const recommendations = [];

    // Add recommendations for metrics that need improvement
    for (const [metric, evaluation] of Object.entries(evaluations)) {
      if (evaluation.status === 'needs-improvement' || evaluation.status === 'poor') {
        const recommendation = this.createRecommendation(metric, evaluation, metrics);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    // Add general recommendations
    if (metrics.totalSize && metrics.totalSize > this.auditSettings.thresholds.totalSize.good) {
      recommendations.push({
        category: 'resource-optimization',
        priority: 'high',
        title: 'Reduce Total Page Weight',
        description: `Page size is ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB, which exceeds the recommended ${(this.auditSettings.thresholds.totalSize.good / 1024 / 1024).toFixed(2)}MB`,
        suggestion: 'Consider optimizing images, reducing JavaScript bundle size, and minimizing third-party resources'
      });
    }

    if (metrics.requestCount && metrics.requestCount > this.auditSettings.thresholds.requestCount.good) {
      recommendations.push({
        category: 'resource-optimization',
        priority: 'medium',
        title: 'Reduce HTTP Requests',
        description: `Page makes ${metrics.requestCount} requests, which exceeds the recommended ${this.auditSettings.thresholds.requestCount.good}`,
        suggestion: 'Consider bundling resources, using sprites for images, and eliminating unnecessary requests'
      });
    }

    return recommendations;
  }

  // Create specific recommendation for a metric
  createRecommendation(metric, evaluation, metrics) {
    switch (metric) {
      case 'lcp':
        return {
          category: 'loading-performance',
          priority: 'high',
          title: 'Optimize Largest Contentful Paint',
          description: `LCP is ${evaluation.value}ms, which is ${evaluation.message}`,
          suggestion: 'Consider optimizing the largest content element by using proper image sizing, preloading critical resources, and optimizing server response times'
        };

      case 'cls':
        return {
          category: 'visual-stability',
          priority: 'high',
          title: 'Reduce Cumulative Layout Shift',
          description: `CLS is ${evaluation.value}, which is ${evaluation.message}`,
          suggestion: 'Avoid layout shifts by setting explicit dimensions for images and videos, and avoid dynamically injecting content without reserved space'
        };

      case 'fid':
        return {
          category: 'interaction-readiness',
          priority: 'high',
          title: 'Improve First Input Delay',
          description: `FID is ${evaluation.value}ms, which is ${evaluation.message}`,
          suggestion: 'Reduce main thread work by breaking up long tasks, optimizing JavaScript execution, and using web workers for heavy computations'
        };

      case 'fcp':
        return {
          category: 'loading-performance',
          priority: 'medium',
          title: 'Optimize First Contentful Paint',
          description: `FCP is ${evaluation.value}ms, which is ${evaluation.message}`,
          suggestion: 'Optimize critical rendering path by eliminating render-blocking resources and optimizing CSS delivery'
        };

      case 'ttfb':
        return {
          category: 'server-performance',
          priority: 'high',
          title: 'Improve Time to First Byte',
          description: `TTFB is ${evaluation.value}ms, which is ${evaluation.message}`,
          suggestion: 'Optimize server response time by enabling compression, using a CDN, and optimizing server-side rendering'
        };

      default:
        return null;
    }
  }

  // Calculate overall performance score
  calculatePerformanceScore(evaluations) {
    const validEvaluations = Object.values(evaluations).filter(eval => eval.score !== null);
    if (validEvaluations.length === 0) {
      return 0;
    }

    const totalScore = validEvaluations.reduce((sum, eval) => sum + eval.score, 0);
    return Math.round(totalScore / validEvaluations.length);
  }

  // Generate performance report
  generateReport(auditResult = null) {
    const result = auditResult || this.auditResults[this.auditResults.length - 1];
    if (!result) {
      return null;
    }

    const report = {
      id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      url: result.url,
      userAgent: result.userAgent,
      score: result.score,
      metrics: {},
      recommendations: result.recommendations,
      summary: this.generateSummary(result),
      insights: this.generateInsights(result)
    };

    // Format metrics for report
    for (const [metric, evaluation] of Object.entries(result.evaluations)) {
      report.metrics[metric] = {
        value: evaluation.value,
        score: evaluation.score,
        status: evaluation.status,
        message: evaluation.message
      };
    }

    return report;
  }

  // Generate summary
  generateSummary(result) {
    const passed = Object.values(result.evaluations).filter(eval =>
      eval.status === 'good'
    ).length;
    const total = Object.values(result.evaluations).length;

    return {
      passed: passed,
      total: total,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
      performanceRating: this.getPerformanceRating(result.score),
      criticalIssues: result.recommendations.filter(rec => rec.priority === 'high').length,
      improvementOpportunities: result.recommendations.length
    };
  }

  // Get performance rating based on score
  getPerformanceRating(score) {
    if (score >= 90) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 25) return 'needs-improvement';
    return 'poor';
  }

  // Generate insights
  generateInsights(result) {
    const insights = [];

    // Add insights based on metrics
    if (result.results.lcp && result.results.lcp > this.auditSettings.thresholds.lcp.poor) {
      insights.push({
        type: 'warning',
        title: 'Slow Loading Detected',
        message: 'Your page takes too long to load the main content. Consider optimizing your largest content element.'
      });
    }

    if (result.results.cls && result.results.cls > this.auditSettings.thresholds.cls.poor) {
      insights.push({
        type: 'warning',
        title: 'Layout Instability',
        message: 'Your page experiences significant layout shifts. This can be frustrating for users.'
      });
    }

    if (result.results.totalSize && result.results.totalSize > this.auditSettings.thresholds.totalSize.poor) {
      insights.push({
        type: 'warning',
        title: 'Large Page Size',
        message: 'Your page is quite large. Consider optimizing assets to reduce bandwidth usage.'
      });
    }

    return insights;
  }

  // Export audit data
  exportData(format = 'json') {
    const data = {
      audits: this.auditHistory,
      summary: {
        totalAudits: this.auditHistory.length,
        averageScore: this.auditHistory.reduce((sum, audit) => sum + audit.score, 0) / this.auditHistory.length || 0,
        dateRange: {
          start: this.auditHistory.length > 0 ? this.auditHistory[0].timestamp : null,
          end: this.auditHistory.length > 0 ? this.auditHistory[this.auditHistory.length - 1].timestamp : null
        }
      },
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'Audit ID,Score,LCP (ms),CLS,FID (ms),FCP (ms),TTFB (ms),Total Size (KB),Request Count,Timestamp\n';
      this.auditHistory.forEach(audit => {
        csv += `"${audit.id}",${audit.score},${audit.results.lcp || ''},${audit.results.cls || ''},${audit.results.fid || ''},${audit.results.fcp || ''},${audit.results.ttfb || ''},${audit.results.totalSize ? Math.round(audit.results.totalSize / 1024) : ''},${audit.results.requestCount || ''},"${new Date(audit.timestamp).toISOString()}"\n`;
      });
      return csv;
    } else if (format === 'html') {
      return this.generateHTMLReport(data);
    }

    return null;
  }

  // Generate HTML report
  generateHTMLReport(data) {
    const avgScore = data.summary.averageScore.toFixed(1);
    const dateRange = data.summary.dateRange;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .audits-table { width: 100%; border-collapse: collapse; }
    .audits-table th, .audits-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .audits-table th { background-color: #f2f2f2; }
    .score-excellent { color: #22c55e; }
    .score-good { color: #eab308; }
    .score-poor { color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Performance Audit Report</h1>
    <p>Date Range: ${dateRange.start ? new Date(dateRange.start).toLocaleDateString() : 'N/A'} - ${dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'N/A'}</p>
    <p>Average Score: <span class="score-${this.getScoreClass(avgScore)}">${avgScore}</span></p>
  </div>

  <div class="summary">
    <div class="metric-card">
      <h3>Total Audits</h3>
      <p>${data.summary.totalAudits}</p>
    </div>
    <div class="metric-card">
      <h3>Average Score</h3>
      <p class="score-${this.getScoreClass(avgScore)}">${avgScore}/100</p>
    </div>
  </div>

  <h2>Detailed Results</h2>
  <table class="audits-table">
    <thead>
      <tr>
        <th>Audit ID</th>
        <th>Score</th>
        <th>LCP (ms)</th>
        <th>CLS</th>
        <th>TTFB (ms)</th>
        <th>Total Size (KB)</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${data.audits.map(audit => `
        <tr>
          <td>${audit.id}</td>
          <td class="score-${this.getScoreClass(audit.score)}">${audit.score}</td>
          <td>${audit.results.lcp ? audit.results.lcp.toFixed(2) : 'N/A'}</td>
          <td>${audit.results.cls ? audit.results.cls.toFixed(3) : 'N/A'}</td>
          <td>${audit.results.ttfb ? audit.results.ttfb.toFixed(2) : 'N/A'}</td>
          <td>${audit.results.totalSize ? Math.round(audit.results.totalSize / 1024) : 'N/A'}</td>
          <td>${new Date(audit.timestamp).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }

  // Get score class for styling
  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    return 'poor';
  }

  // Download report
  downloadReport(filename = 'performance-audit', format = 'json') {
    const data = this.exportData(format);
    if (!data) return;

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' :
            format === 'csv' ? 'text/csv' :
            'text/html'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Add audit callback
  addAuditCallback(callback) {
    if (!this.auditCallbacks) {
      this.auditCallbacks = [];
    }
    this.auditCallbacks.push(callback);
  }

  // Remove audit callback
  removeAuditCallback(callback) {
    if (this.auditCallbacks) {
      const index = this.auditCallbacks.indexOf(callback);
      if (index !== -1) {
        this.auditCallbacks.splice(index, 1);
      }
    }
  }

  // Trigger audit callbacks
  triggerAuditCallbacks(auditResult) {
    if (this.auditCallbacks) {
      this.auditCallbacks.forEach(callback => {
        try {
          callback(auditResult);
        } catch (error) {
          console.error('Error in audit callback:', error);
        }
      });
    }
  }

  // Get audit statistics
  getAuditStats() {
    if (this.auditHistory.length === 0) {
      return {
        totalAudits: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        scoreTrend: []
      };
    }

    const scores = this.auditHistory.map(audit => audit.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      totalAudits: this.auditHistory.length,
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      scoreTrend: this.calculateScoreTrend(scores),
      lastAudit: this.auditHistory[this.auditHistory.length - 1]
    };
  }

  // Calculate score trend
  calculateScoreTrend(scores) {
    if (scores.length < 2) return 'stable';

    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;

    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }

  // Get metric history
  getMetricHistory(metricName, days = 7) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const relevantAudits = this.auditHistory.filter(audit => audit.timestamp >= cutoffTime);

    return relevantAudits.map(audit => ({
      timestamp: audit.timestamp,
      value: audit.results[metricName],
      score: audit.evaluations[metricName]?.score || null
    }));
  }

  // Get performance trends
  getPerformanceTrends(days = 30) {
    const metrics = ['lcp', 'cls', 'fid', 'fcp', 'ttfb', 'totalSize', 'requestCount'];
    const trends = {};

    metrics.forEach(metric => {
      trends[metric] = this.getMetricHistory(metric, days);
    });

    return trends;
  }

  // Generate trend report
  generateTrendReport(days = 30) {
    const trends = this.getPerformanceTrends(days);
    const stats = this.getAuditStats();

    return {
      period: days,
      startDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString(),
      endDate: new Date().toISOString(),
      summary: stats,
      trends,
      recommendations: this.generateTrendRecommendations(trends)
    };
  }

  // Generate recommendations based on trends
  generateTrendRecommendations(trends) {
    const recommendations = [];

    for (const [metric, history] of Object.entries(trends)) {
      if (history.length < 2) continue;

      // Check if metric is trending negatively
      const recentValues = history.slice(-5).map(h => h.value).filter(v => v !== null);
      if (recentValues.length < 2) continue;

      const firstValue = recentValues[0];
      const lastValue = recentValues[recentValues.length - 1];

      // For metrics where lower is better (most performance metrics)
      if (metric !== 'cls' && lastValue > firstValue * 1.1) { // Increased by more than 10%
        recommendations.push({
          metric,
          trend: 'deteriorating',
          description: `${this.getMetricDisplayName(metric)} has increased by ${Math.round(((lastValue - firstValue) / firstValue) * 100)}% in the last ${recentValues.length} measurements`,
          priority: 'high'
        });
      } else if (metric === 'cls' && lastValue > firstValue * 1.1) { // Special case for CLS
        recommendations.push({
          metric,
          trend: 'deteriorating',
          description: `${this.getMetricDisplayName(metric)} has increased by ${Math.round(((lastValue - firstValue) / firstValue) * 100)}% in the last ${recentValues.length} measurements`,
          priority: 'high'
        });
      }
    }

    return recommendations;
  }

  // Get display name for metric
  getMetricDisplayName(metric) {
    const names = {
      lcp: 'Largest Contentful Paint',
      cls: 'Cumulative Layout Shift',
      fid: 'First Input Delay',
      fcp: 'First Contentful Paint',
      ttfb: 'Time to First Byte',
      totalSize: 'Total Page Size',
      requestCount: 'HTTP Request Count'
    };

    return names[metric] || metric;
  }

  // Generate unique audit ID
  generateAuditId() {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique report ID
  generateReportId() {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear audit history
  clearHistory() {
    this.auditHistory = [];
    this.auditResults = [];
  }

  // Destroy the audit instance
  destroy() {
    this.stopAutoAudit();
    this.auditCallbacks = [];
  }
}

// Singleton instance
const performanceAudit = new PerformanceAudit();

// Export the class and instance
export { PerformanceAudit, performanceAudit };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    performanceAudit.init();
  });
}