// Performance budget and measurement tools

class PerformanceBudget {
  constructor() {
    this.budgets = {
      // Core Web Vitals
      lcp: { max: 2500, current: null, unit: 'ms' }, // Largest Contentful Paint
      cls: { max: 0.1, current: null, unit: 'unitless' }, // Cumulative Layout Shift
      fid: { max: 100, current: null, unit: 'ms' }, // First Input Delay

      // Additional metrics
      fcp: { max: 1800, current: null, unit: 'ms' }, // First Contentful Paint
      ttfb: { max: 600, current: null, unit: 'ms' }, // Time to First Byte
      fmp: { max: 3000, current: null, unit: 'ms' }, // First Meaningful Paint

      // Resource budgets
      totalSize: { max: 2 * 1024 * 1024, current: null, unit: 'bytes' }, // 2MB total
      jsSize: { max: 1 * 1024 * 1024, current: null, unit: 'bytes' }, // 1MB JS
      cssSize: { max: 200 * 1024, current: null, unit: 'bytes' }, // 200KB CSS
      imageCount: { max: 15, current: null, unit: 'count' }, // Max 15 images
      requestCount: { max: 50, current: null, unit: 'count' }, // Max 50 requests
    };

    this.observers = [];
    this.pageLoadMetrics = {};
    this.audits = [];
    this.isMonitoring = false;
  }

  // Initialize performance monitoring
  init() {
    if (this.isMonitoring) return;

    // Start measuring Core Web Vitals
    this.measureCoreWebVitals();

    // Measure other metrics
    this.measureAdditionalMetrics();

    // Start resource monitoring
    this.monitorResources();

    this.isMonitoring = true;
  }

  // Measure Core Web Vitals
  measureCoreWebVitals() {
    // Largest Contentful Paint
    if ('LargestContentfulPaint' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.budgets.lcp.current = lastEntry.startTime;
        this.pageLoadMetrics.lcp = lastEntry.startTime;

        // Check budget
        this.checkBudget('lcp');
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Cumulative Layout Shift
    if ('LayoutShift' in window) {
      new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.budgets.cls.current = clsValue;
        this.pageLoadMetrics.cls = clsValue;

        // Check budget
        this.checkBudget('cls');
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // First Input Delay (using Event Timing API)
    if ('EventTiming' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0];
          const fid = firstInput.processingStart - firstInput.startTime;

          this.budgets.fid.current = fid;
          this.pageLoadMetrics.fid = fid;

          // Check budget
          this.checkBudget('fid');
        }
      }).observe({ entryTypes: ['first-input'] });
    }
  }

  // Measure additional performance metrics
  measureAdditionalMetrics() {
    // First Contentful Paint
    if ('paint' in performance) {
      performance.getEntriesByType('paint').forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.budgets.fcp.current = entry.startTime;
          this.pageLoadMetrics.fcp = entry.startTime;
          this.checkBudget('fcp');
        }
      });
    }

    // Time to First Byte
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.budgets.ttfb.current = ttfb;
        this.pageLoadMetrics.ttfb = ttfb;
        this.checkBudget('ttfb');
      }
    });

    // First Meaningful Paint (approximation)
    window.addEventListener('load', () => {
      // Approximate FMP as time to DOM content loaded + rendering
      const fmp = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      this.budgets.fmp.current = fmp;
      this.pageLoadMetrics.fmp = fmp;
      this.checkBudget('fmp');
    });
  }

  // Monitor resource usage
  monitorResources() {
    // Resource timing for size calculations
    window.addEventListener('load', () => {
      this.calculateResourceUsage();
    });

    // Count images
    window.addEventListener('load', () => {
      const images = document.querySelectorAll('img');
      this.budgets.imageCount.current = images.length;
      this.pageLoadMetrics.imageCount = images.length;
      this.checkBudget('imageCount');
    });
  }

  // Calculate resource usage
  calculateResourceUsage() {
    const resources = performance.getEntriesByType('resource');

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    resources.forEach(resource => {
      if (resource.transferSize) {
        totalSize += resource.transferSize;

        if (resource.name.includes('.js')) {
          jsSize += resource.transferSize;
        } else if (resource.name.includes('.css')) {
          cssSize += resource.transferSize;
        }
      }
    });

    this.budgets.totalSize.current = totalSize;
    this.budgets.jsSize.current = jsSize;
    this.budgets.cssSize.current = cssSize;
    this.budgets.requestCount.current = resources.length;

    this.pageLoadMetrics.totalSize = totalSize;
    this.pageLoadMetrics.jsSize = jsSize;
    this.pageLoadMetrics.cssSize = cssSize;
    this.pageLoadMetrics.requestCount = resources.length;

    // Check budgets
    this.checkBudget('totalSize');
    this.checkBudget('jsSize');
    this.checkBudget('cssSize');
    this.checkBudget('requestCount');
  }

  // Check if metric is within budget
  checkBudget(metricName) {
    const budget = this.budgets[metricName];
    if (!budget || budget.current === null) return true;

    const isWithinBudget = budget.current <= budget.max;

    // Log budget violation
    if (!isWithinBudget) {
      this.logBudgetViolation(metricName, budget.current, budget.max);
    }

    return isWithinBudget;
  }

  // Log budget violation
  logBudgetViolation(metricName, currentValue, maxValue) {
    const violation = {
      metric: metricName,
      currentValue,
      maxValue,
      unit: this.budgets[metricName].unit,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      severity: this.getSeverity(metricName, currentValue, maxValue)
    };

    this.audits.push(violation);

    // Log to console
    console.warn(`PERFORMANCE BUDGET VIOLATION: ${metricName} is ${currentValue}${this.budgets[metricName].unit}, max allowed is ${maxValue}${this.budgets[metricName].unit}`, violation);

    // Dispatch custom event
    const event = new CustomEvent('performanceBudgetViolation', {
      detail: violation
    });
    window.dispatchEvent(event);
  }

  // Get severity level
  getSeverity(metricName, currentValue, maxValue) {
    const ratio = currentValue / maxValue;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  // Get current metrics
  getCurrentMetrics() {
    return { ...this.pageLoadMetrics };
  }

  // Get budget status
  getBudgetStatus() {
    const status = {};
    for (const [metric, budget] of Object.entries(this.budgets)) {
      status[metric] = {
        current: budget.current,
        max: budget.max,
        unit: budget.unit,
        withinBudget: this.checkBudget(metric),
        percentage: budget.current !== null ? Math.round((budget.current / budget.max) * 100) : 0
      };
    }
    return status;
  }

  // Get performance score (0-100)
  getPerformanceScore() {
    const status = this.getBudgetStatus();
    let totalScore = 0;
    let count = 0;

    for (const [metric, data] of Object.entries(status)) {
      if (data.current !== null) {
        // Calculate score based on how close to budget we are
        const ratio = Math.min(data.current / data.max, 1);
        const metricScore = Math.max(0, 100 - (ratio * 100));
        totalScore += metricScore;
        count++;
      }
    }

    return count > 0 ? Math.round(totalScore / count) : 100;
  }

  // Get audit report
  getAuditReport() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: this.getCurrentMetrics(),
      budgetStatus: this.getBudgetStatus(),
      violations: [...this.audits],
      performanceScore: this.getPerformanceScore(),
      recommendations: this.getRecommendations()
    };
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];
    const status = this.getBudgetStatus();

    if (status.lcp.current > status.lcp.max) {
      recommendations.push({
        metric: 'lcp',
        message: 'Optimize Largest Contentful Paint by loading critical resources first',
        priority: 'high'
      });
    }

    if (status.cls.current > status.cls.max) {
      recommendations.push({
        metric: 'cls',
        message: 'Reduce Cumulative Layout Shift by setting image/video dimensions',
        priority: 'high'
      });
    }

    if (status.totalSize.current > status.totalSize.max) {
      recommendations.push({
        metric: 'totalSize',
        message: `Reduce total page weight by ${Math.round((status.totalSize.current - status.totalSize.max) / 1024)}KB`,
        priority: 'medium'
      });
    }

    if (status.jsSize.current > status.jsSize.max) {
      recommendations.push({
        metric: 'jsSize',
        message: `Reduce JavaScript bundle size by ${Math.round((status.jsSize.current - status.jsSize.max) / 1024)}KB`,
        priority: 'medium'
      });
    }

    if (status.requestCount.current > status.requestCount.max) {
      recommendations.push({
        metric: 'requestCount',
        message: `Reduce number of HTTP requests from ${status.requestCount.current} to ${status.requestCount.max}`,
        priority: 'low'
      });
    }

    return recommendations;
  }

  // Export budget data
  exportData(format = 'json') {
    const data = this.getAuditReport();

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Metric,Current,Max,Unit,Within Budget,Percentage\n';

      for (const [metric, status] of Object.entries(data.budgetStatus)) {
        csv += `"${metric}",${status.current},${status.max},${status.unit},${status.withinBudget},${status.percentage}\n`;
      }

      return csv;
    }

    return null;
  }

  // Download performance report
  downloadReport(filename = 'performance-report', format = 'json') {
    const data = this.exportData(format);
    if (!data) return;

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
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

  // Set custom budget
  setBudget(metric, max) {
    if (this.budgets.hasOwnProperty(metric)) {
      this.budgets[metric].max = max;
    } else {
      throw new Error(`Unknown metric: ${metric}`);
    }
  }

  // Reset audits
  resetAudits() {
    this.audits = [];
    this.pageLoadMetrics = {};
  }

  // Get performance summary
  getPerformanceSummary() {
    const status = this.getBudgetStatus();
    const score = this.getPerformanceScore();
    const recommendations = this.getRecommendations();

    return {
      score,
      passed: score >= 90,
      metrics: status,
      violations: this.audits.length,
      recommendations: recommendations.length,
      summary: this.getSummaryText(score, recommendations.length)
    };
  }

  // Get summary text
  getSummaryText(score, recommendationCount) {
    if (score >= 90) {
      return 'Excellent performance! All budgets are within limits.';
    } else if (score >= 70) {
      return `Good performance, but ${recommendationCount} recommendations available for improvement.`;
    } else if (score >= 50) {
      return `Fair performance. Several metrics are exceeding budgets.`;
    } else {
      return `Poor performance. Significant improvements needed.`;
    }
  }

  // Enable performance monitoring
  enableMonitoring() {
    this.init();
  }

  // Disable performance monitoring
  disableMonitoring() {
    this.isMonitoring = false;
    // Disconnect observers in a real implementation
  }
}

// Singleton instance
const performanceBudget = new PerformanceBudget();

// Export the class and instance
export { PerformanceBudget, performanceBudget };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    performanceBudget.init();
  });
}