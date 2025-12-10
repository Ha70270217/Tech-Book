// Performance alerts and notification system

class PerformanceAlerts {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      // Core Web Vitals thresholds
      lcp: { warning: 2000, critical: 4000, unit: 'ms' }, // Largest Contentful Paint
      cls: { warning: 0.05, critical: 0.25, unit: 'unitless' }, // Cumulative Layout Shift
      fid: { warning: 75, critical: 200, unit: 'ms' }, // First Input Delay

      // Additional metrics thresholds
      fcp: { warning: 1500, critical: 3000, unit: 'ms' }, // First Contentful Paint
      ttfb: { warning: 400, critical: 800, unit: 'ms' }, // Time to First Byte
      fmp: { warning: 2500, critical: 5000, unit: 'ms' }, // First Meaningful Paint

      // Resource thresholds
      totalSize: { warning: 1.5 * 1024 * 1024, critical: 3 * 1024 * 1024, unit: 'bytes' }, // 1.5MB, 3MB
      jsSize: { warning: 800 * 1024, critical: 1.5 * 1024 * 1024, unit: 'bytes' }, // 800KB, 1.5MB
      cssSize: { warning: 150 * 1024, critical: 300 * 1024, unit: 'bytes' }, // 150KB, 300KB
      imageCount: { warning: 10, critical: 25, unit: 'count' }, // 10, 25 images
      requestCount: { warning: 35, critical: 75, unit: 'count' }, // 35, 75 requests
    };

    this.notificationSettings = {
      enabled: true,
      showWarnings: true,
      showCritical: true,
      desktopNotifications: false,
      toastDuration: 5000, // 5 seconds
      emailAlerts: false,
      webhookUrl: null
    };

    this.alertCallbacks = new Map();
    this.isMonitoring = false;
    this.monitorInterval = null;
  }

  // Initialize performance alerts
  init() {
    if (this.isMonitoring) return;

    // Start monitoring
    this.startMonitoring();

    // Set up Core Web Vitals monitoring
    this.setupCoreWebVitalsMonitoring();

    this.isMonitoring = true;
  }

  // Setup Core Web Vitals monitoring
  setupCoreWebVitalsMonitoring() {
    // Largest Contentful Paint monitoring
    if ('LargestContentfulPaint' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.checkThreshold('lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Cumulative Layout Shift monitoring
    if ('LayoutShift' in window) {
      new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.checkThreshold('cls', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // First Input Delay monitoring
    if ('EventTiming' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0];
          const fid = firstInput.processingStart - firstInput.startTime;

          this.checkThreshold('fid', fid);
        }
      }).observe({ entryTypes: ['first-input'] });
    }
  }

  // Start monitoring
  startMonitoring() {
    // Monitor every 10 seconds
    this.monitorInterval = setInterval(() => {
      this.checkAllThresholds();
    }, 10000);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
  }

  // Check all thresholds
  checkAllThresholds() {
    // Get current performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Check paint metrics
      if ('paint' in performance) {
        performance.getEntriesByType('paint').forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.checkThreshold('fcp', entry.startTime);
          }
        });
      }

      // Check navigation timing
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.checkThreshold('ttfb', ttfb);
      }
    }

    // Check resource usage
    this.checkResourceUsage();
  }

  // Check resource usage
  checkResourceUsage() {
    if (typeof window !== 'undefined') {
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

      const imageCount = document.querySelectorAll('img').length;
      const requestCount = resources.length;

      this.checkThreshold('totalSize', totalSize);
      this.checkThreshold('jsSize', jsSize);
      this.checkThreshold('cssSize', cssSize);
      this.checkThreshold('imageCount', imageCount);
      this.checkThreshold('requestCount', requestCount);
    }
  }

  // Check threshold for a specific metric
  checkThreshold(metricName, value) {
    if (!this.thresholds[metricName] || value === null || value === undefined) return;

    const thresholds = this.thresholds[metricName];
    let level = null;
    let severity = null;

    if (value >= thresholds.critical) {
      level = 'critical';
      severity = 'critical';
    } else if (value >= thresholds.warning) {
      level = 'warning';
      severity = 'warning';
    }

    if (level) {
      const alert = {
        id: this.generateAlertId(metricName, level),
        metric: metricName,
        value: value,
        threshold: thresholds[level],
        level: level,
        severity: severity,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        message: this.generateAlertMessage(metricName, value, thresholds[level], level)
      };

      this.addAlert(alert);
      this.triggerNotification(alert);
      this.executeCallbacks(metricName, alert);

      return alert;
    }

    return null;
  }

  // Generate alert message
  generateAlertMessage(metricName, value, threshold, level) {
    const metricLabel = this.getMetricLabel(metricName);
    const unit = this.thresholds[metricName].unit;

    if (level === 'critical') {
      return `CRITICAL: ${metricLabel} is ${value}${unit}, exceeding critical threshold of ${threshold}${unit}`;
    } else {
      return `WARNING: ${metricLabel} is ${value}${unit}, exceeding warning threshold of ${threshold}${unit}`;
    }
  }

  // Get metric label for display
  getMetricLabel(metricName) {
    const labels = {
      lcp: 'Largest Contentful Paint',
      cls: 'Cumulative Layout Shift',
      fid: 'First Input Delay',
      fcp: 'First Contentful Paint',
      ttfb: 'Time to First Byte',
      fmp: 'First Meaningful Paint',
      totalSize: 'Total Page Size',
      jsSize: 'JavaScript Bundle Size',
      cssSize: 'CSS Bundle Size',
      imageCount: 'Number of Images',
      requestCount: 'Number of Requests'
    };

    return labels[metricName] || metricName.replace(/([A-Z])/g, ' $1').trim();
  }

  // Add alert to the system
  addAlert(alert) {
    this.alerts.unshift(alert);

    // Keep only last 100 alerts to prevent memory issues
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // Dispatch custom event
    const event = new CustomEvent('performanceAlert', {
      detail: alert
    });
    window.dispatchEvent(event);
  }

  // Trigger notification for an alert
  triggerNotification(alert) {
    if (!this.notificationSettings.enabled) return;

    // Show toast notification
    if ((alert.severity === 'warning' && this.notificationSettings.showWarnings) ||
        (alert.severity === 'critical' && this.notificationSettings.showCritical)) {
      this.showToastNotification(alert);
    }

    // Show desktop notification if enabled
    if (this.notificationSettings.desktopNotifications) {
      this.showDesktopNotification(alert);
    }

    // Send webhook if configured
    if (this.notificationSettings.webhookUrl) {
      this.sendWebhookNotification(alert);
    }

    // Send email if enabled (in a real app, this would be server-side)
    if (this.notificationSettings.emailAlerts) {
      this.sendEmailNotification(alert);
    }
  }

  // Show toast notification
  showToastNotification(alert) {
    if (typeof document === 'undefined') return;

    // Create toast container if it doesn't exist
    let container = document.getElementById('performance-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'performance-toast-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
      document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-lg ${
      alert.severity === 'critical'
        ? 'bg-red-100 border border-red-300 text-red-800'
        : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
    }`;

    toast.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-medium">${alert.level.toUpperCase()}</h4>
          <p class="text-sm mt-1">${alert.message}</p>
          <p class="text-xs opacity-75 mt-1">${new Date(alert.timestamp).toLocaleTimeString()}</p>
        </div>
        <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, this.notificationSettings.toastDuration);
  }

  // Show desktop notification
  showDesktopNotification(alert) {
    if (!('Notification' in window)) return;

    // Request permission if not already granted
    if (Notification.permission === 'granted') {
      new Notification('Performance Alert', {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `perf-alert-${alert.id}`
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Performance Alert', {
            body: alert.message,
            icon: '/favicon.ico',
            tag: `perf-alert-${alert.id}`
          });
        }
      });
    }
  }

  // Send webhook notification
  async sendWebhookNotification(alert) {
    if (!this.notificationSettings.webhookUrl) return;

    try {
      await fetch(this.notificationSettings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'performance_alert',
          alert: alert,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  // Simulate sending email notification
  async sendEmailNotification(alert) {
    // In a real application, this would call a server endpoint
    // to send an email notification
    console.log('Email notification would be sent:', alert);
  }

  // Execute callbacks for a specific metric
  executeCallbacks(metricName, alert) {
    if (this.alertCallbacks.has(metricName)) {
      const callbacks = this.alertCallbacks.get(metricName);
      callbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error(`Error in alert callback for ${metricName}:`, error);
        }
      });
    }
  }

  // Add callback for specific metric alerts
  addCallback(metricName, callback) {
    if (!this.alertCallbacks.has(metricName)) {
      this.alertCallbacks.set(metricName, []);
    }
    this.alertCallbacks.get(metricName).push(callback);
  }

  // Remove callback for specific metric
  removeCallback(metricName, callback) {
    if (this.alertCallbacks.has(metricName)) {
      const callbacks = this.alertCallbacks.get(metricName);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Generate unique alert ID
  generateAlertId(metricName, level) {
    return `${metricName}-${level}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get alerts by severity
  getAlertsBySeverity(severity) {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  // Get alerts by metric
  getAlertsByMetric(metricName) {
    return this.alerts.filter(alert => alert.metric === metricName);
  }

  // Get recent alerts (last N minutes)
  getRecentAlerts(minutes = 60) {
    const timeThreshold = Date.now() - (minutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= timeThreshold);
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = [];
  }

  // Clear alerts older than N minutes
  clearOldAlerts(minutes = 60) {
    const timeThreshold = Date.now() - (minutes * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp < timeThreshold);
  }

  // Update threshold values
  updateThreshold(metricName, newThresholds) {
    if (this.thresholds[metricName]) {
      this.thresholds[metricName] = { ...this.thresholds[metricName], ...newThresholds };
    }
  }

  // Update notification settings
  updateNotificationSettings(settings) {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
  }

  // Get alert statistics
  getAlertStats() {
    const stats = {
      total: this.alerts.length,
      warnings: this.alerts.filter(alert => alert.severity === 'warning').length,
      critical: this.alerts.filter(alert => alert.severity === 'critical').length,
      byMetric: {}
    };

    // Count by metric
    this.alerts.forEach(alert => {
      if (!stats.byMetric[alert.metric]) {
        stats.byMetric[alert.metric] = { warnings: 0, critical: 0 };
      }

      if (alert.severity === 'warning') {
        stats.byMetric[alert.metric].warnings++;
      } else {
        stats.byMetric[alert.metric].critical++;
      }
    });

    return stats;
  }

  // Get current alert status
  getAlertStatus() {
    const recentAlerts = this.getRecentAlerts(5); // Last 5 minutes
    const hasCritical = recentAlerts.some(alert => alert.severity === 'critical');
    const hasWarnings = recentAlerts.some(alert => alert.severity === 'warning');

    return {
      hasCritical,
      hasWarnings,
      status: hasCritical ? 'critical' : hasWarnings ? 'warning' : 'ok',
      count: recentAlerts.length,
      recentAlerts
    };
  }

  // Pause monitoring temporarily
  pauseMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  // Resume monitoring
  resumeMonitoring() {
    if (!this.monitorInterval) {
      this.startMonitoring();
    }
  }

  // Get all current thresholds
  getThresholds() {
    return { ...this.thresholds };
  }

  // Get current notification settings
  getNotificationSettings() {
    return { ...this.notificationSettings };
  }

  // Export alerts data
  exportAlerts(format = 'json') {
    const data = {
      alerts: this.alerts,
      thresholds: this.thresholds,
      settings: this.notificationSettings,
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'ID,Metric,Value,Threshold,Level,Severity,Timestamp,URL,Message\n';
      this.alerts.forEach(alert => {
        csv += `"${alert.id}","${alert.metric}",${alert.value},${alert.threshold},"${alert.level}","${alert.severity}","${new Date(alert.timestamp).toISOString()}","${alert.url}","${alert.message.replace(/"/g, '""')}"\n`;
      });
      return csv;
    }

    return null;
  }

  // Download alerts report
  downloadReport(filename = 'performance-alerts', format = 'json') {
    const data = this.exportAlerts(format);
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
}

// Singleton instance
const performanceAlerts = new PerformanceAlerts();

// Export the class and instance
export { PerformanceAlerts, performanceAlerts };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    performanceAlerts.init();
  });
}