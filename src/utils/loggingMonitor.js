// Comprehensive logging and monitoring system

class LoggingMonitor {
  constructor() {
    this.logs = [];
    this.maxLogSize = 10000; // Keep last 10,000 logs
    this.logLevel = 'info'; // debug, info, warn, error
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    this.logBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000; // Flush every 5 seconds
    this.flushTimer = null;

    this.loggers = new Map(); // Named loggers
    this.filters = []; // Log filters
    this.transformers = []; // Log transformers

    this.isMonitoring = false;
    this.performanceMonitoring = true;
    this.userActivityTracking = true;

    this.metrics = {
      pageViews: 0,
      errors: 0,
      warnings: 0,
      performance: {},
      userActions: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.sessionId = this.generateSessionId();
    this.userId = null;

    this.setupGlobalMonitoring();
    this.startFlushTimer();
  }

  // Set up global monitoring
  setupGlobalMonitoring() {
    // Monitor console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (this.logLevelInt <= this.logLevels.error) {
        this.log('error', 'Console Error', {
          message: args[0],
          args: args.slice(1),
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }
    };

    // Monitor console warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      if (this.logLevelInt <= this.logLevels.warn) {
        this.log('warn', 'Console Warning', {
          message: args[0],
          args: args.slice(1),
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }
    };

    // Monitor API calls
    this.interceptFetch();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor performance
    this.startPerformanceMonitoring();
  }

  // Intercept fetch calls for monitoring
  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = function(...args) {
      const [url, options = {}] = args;

      // Log the request
      const requestId = self.generateRequestId();
      self.log('info', 'API Request', {
        type: 'api-request',
        requestId,
        url,
        method: options.method || 'GET',
        headers: options.headers,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      self.metrics.apiCalls++;

      // Execute the original fetch and monitor the response
      return originalFetch.apply(this, args)
        .then(response => {
          // Clone response to read body without consuming it
          const responseClone = response.clone();

          responseClone.text().then(body => {
            self.log('info', 'API Response', {
              type: 'api-response',
              requestId,
              url,
              status: response.status,
              statusText: response.statusText,
              body: body.length > 1000 ? body.substring(0, 1000) + '...' : body,
              timestamp: new Date().toISOString(),
              duration: responseClone.headers.get('X-Response-Time') || 'N/A'
            });
          }).catch(() => {
            // Ignore errors reading response body
          });

          return response;
        })
        .catch(error => {
          self.log('error', 'API Error', {
            type: 'api-error',
            requestId,
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw error;
        });
    };
  }

  // Monitor resource loading
  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.log('info', 'Resource Loaded', {
              type: 'resource-load',
              name: entry.name,
              duration: entry.duration,
              transferSize: entry.transferSize,
              decodedBodySize: entry.decodedBodySize,
              mimeType: entry.mimeType,
              timestamp: new Date().toISOString()
            });
          }
        });
      }).observe({ entryTypes: ['resource'] });
    }
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    if (!('performance' in window)) return;

    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.log('info', 'Navigation Timing', {
              type: 'navigation',
              url: entry.name,
              loadTime: entry.loadEventEnd - entry.fetchStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
              firstByte: entry.responseStart - entry.requestStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              timestamp: new Date().toISOString()
            });
          }
        });
      }).observe({ entryTypes: ['navigation'] });

      // Monitor paint timing
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name === 'first-paint') {
            this.log('info', 'First Paint', {
              type: 'paint-timing',
              name: entry.name,
              startTime: entry.startTime,
              timestamp: new Date().toISOString()
            });
          } else if (entry.name === 'first-contentful-paint') {
            this.log('info', 'First Contentful Paint', {
              type: 'paint-timing',
              name: entry.name,
              startTime: entry.startTime,
              timestamp: new Date().toISOString()
            });
          }
        });
      }).observe({ entryTypes: ['paint'] });
    }
  }

  // Generate session ID
  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Generate request ID
  generateRequestId() {
    return 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Set log level
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.logLevel = level;
      this.logLevelInt = this.logLevels[level];
    }
  }

  // Add log filter
  addFilter(filterFn) {
    this.filters.push(filterFn);
  }

  // Add log transformer
  addTransformer(transformerFn) {
    this.transformers.push(transformerFn);
  }

  // Main logging function
  log(level, message, data = {}) {
    if (this.logLevels[level] === undefined || this.logLevels[level] < this.logLevels[this.logLevel]) {
      return;
    }

    const logEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      performance: this.getPerformanceMetrics()
    };

    // Apply filters
    for (const filter of this.filters) {
      if (filter(logEntry)) {
        return; // Skip logging if filter returns true
      }
    }

    // Apply transformers
    let transformedEntry = { ...logEntry };
    for (const transformer of this.transformers) {
      transformedEntry = { ...transformedEntry, ...transformer(transformedEntry) };
    }

    // Add to buffer
    this.logBuffer.push(transformedEntry);

    // Maintain buffer size
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Update metrics
    this.updateMetrics(logEntry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logFn = console[level] || console.log;
      logFn(`[${level.toUpperCase()}] ${message}`, {
        ...data,
        timestamp: logEntry.timestamp,
        sessionId: logEntry.sessionId
      });
    }
  }

  // Update metrics based on log entry
  updateMetrics(logEntry) {
    switch (logEntry.level) {
      case 'error':
        this.metrics.errors++;
        break;
      case 'warn':
        this.metrics.warnings++;
        break;
    }

    if (logEntry.data && logEntry.data.type) {
      switch (logEntry.data.type) {
        case 'page-view':
          this.metrics.pageViews++;
          break;
        case 'user-action':
          this.metrics.userActions++;
          break;
        case 'api-request':
          this.metrics.apiCalls++;
          break;
        case 'cache-hit':
          this.metrics.cacheHits++;
          break;
        case 'cache-miss':
          this.metrics.cacheMisses++;
          break;
      }
    }
  }

  // Get current performance metrics
  getPerformanceMetrics() {
    if (!('performance' in window)) return {};

    const timing = performance.timing;
    return {
      navigationStart: timing.navigationStart,
      loadEventEnd: timing.loadEventEnd,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
      responseStart: timing.responseStart,
      requestStart: timing.requestStart,
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      timeToFirstByte: timing.responseStart - timing.requestStart
    };
  }

  // Start flush timer
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  // Flush logs to external service
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    if (this.logEndpoint) {
      try {
        await fetch(this.logEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.logHeaders
          },
          body: JSON.stringify({
            logs: logsToFlush,
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to flush logs:', error);
        // Put logs back in buffer if failed
        this.logBuffer = [...logsToFlush, ...this.logBuffer];
      }
    }
  }

  // Set log endpoint for remote logging
  setLogEndpoint(endpoint, headers = {}) {
    this.logEndpoint = endpoint;
    this.logHeaders = headers;
  }

  // Log different levels
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  // Log user action
  logUserAction(action, element = null, additionalData = {}) {
    this.log('info', 'User Action', {
      type: 'user-action',
      action,
      element: element ? {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100)
      } : null,
      ...additionalData
    });
  }

  // Log page view
  logPageView(url = window.location.href, title = document.title) {
    this.log('info', 'Page View', {
      type: 'page-view',
      url,
      title,
      referrer: document.referrer,
      scrollDepth: 0 // Will be updated as user scrolls
    });

    // Monitor scroll depth
    this.monitorScrollDepth();
  }

  // Monitor scroll depth
  monitorScrollDepth() {
    let maxScroll = 0;

    const updateScrollDepth = () => {
      const scrolled = (window.scrollY + window.innerHeight) / document.body.clientHeight;
      const scrollPercent = Math.min(Math.round(scrolled * 100), 100);

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        // Log significant scroll events
        if (scrollPercent % 25 === 0 || scrollPercent === 100) {
          this.log('info', 'Scroll Depth', {
            type: 'scroll-depth',
            percent: scrollPercent,
            maxScroll: maxScroll
          });
        }
      }
    };

    window.addEventListener('scroll', updateScrollDepth);
  }

  // Log performance metric
  logPerformance(metricName, value, additionalData = {}) {
    this.log('info', 'Performance Metric', {
      type: 'performance',
      metric: metricName,
      value,
      ...additionalData
    });
  }

  // Log API call
  logApiCall(url, method = 'GET', responseTime, status, additionalData = {}) {
    this.log('info', 'API Call', {
      type: 'api-call',
      url,
      method,
      responseTime,
      status,
      ...additionalData
    });
  }

  // Log cache activity
  logCacheActivity(operation, key, hit = null, additionalData = {}) {
    this.log('info', 'Cache Activity', {
      type: 'cache-activity',
      operation,
      key,
      hit,
      ...additionalData
    });
  }

  // Get log statistics
  getLogStats() {
    const stats = {
      totalLogs: this.logBuffer.length,
      logLevels: { debug: 0, info: 0, warn: 0, error: 0 },
      recentLogs: this.logBuffer.slice(-20), // Last 20 logs
      metrics: { ...this.metrics }
    };

    // Count log levels
    this.logBuffer.forEach(log => {
      if (stats.logLevels[log.level] !== undefined) {
        stats.logLevels[log.level]++;
      }
    });

    return stats;
  }

  // Get logs by level
  getLogsByLevel(level) {
    return this.logBuffer.filter(log => log.level === level);
  }

  // Get logs by type
  getLogsByType(type) {
    return this.logBuffer.filter(log => log.data && log.data.type === type);
  }

  // Search logs
  searchLogs(searchTerm) {
    return this.logBuffer.filter(log =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Export logs
  exportLogs(format = 'json') {
    const data = {
      logs: this.logBuffer,
      stats: this.getLogStats(),
      exportTimestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'Level,Message,Timestamp,URL,User Agent\n';
      this.logBuffer.forEach(log => {
        csv += `"${log.level}","${log.message.replace(/"/g, '""')}","${log.timestamp}","${log.url.replace(/"/g, '""')}","${log.userAgent.replace(/"/g, '""')}"\n`;
      });
      return csv;
    }

    return null;
  }

  // Download logs
  downloadLogs(filename = 'application-logs', format = 'json') {
    const data = this.exportLogs(format);
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

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId;
  }

  // Clear logs
  clearLogs() {
    this.logBuffer = [];
  }

  // Destroy the logger instance
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Restore original console methods
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
    }
  }

  // Create a named logger
  createLogger(name) {
    if (!this.loggers.has(name)) {
      const logger = {
        debug: (message, data = {}) => this.log('debug', `[${name}] ${message}`, data),
        info: (message, data = {}) => this.log('info', `[${name}] ${message}`, data),
        warn: (message, data = {}) => this.log('warn', `[${name}] ${message}`, data),
        error: (message, data = {}) => this.log('error', `[${name}] ${message}`, data),
        log: (level, message, data = {}) => this.log(level, `[${name}] ${message}`, data)
      };

      this.loggers.set(name, logger);
    }

    return this.loggers.get(name);
  }

  // Get a named logger
  getLogger(name) {
    return this.loggers.get(name) || this.createLogger(name);
  }

  // Monitor memory usage
  monitorMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.log('info', 'Memory Usage', {
        type: 'memory-usage',
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Monitor network conditions
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.log('info', 'Network Conditions', {
        type: 'network-conditions',
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track custom event
  trackEvent(category, action, label = '', value = null) {
    this.log('info', 'Custom Event', {
      type: 'custom-event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Log application state
  logAppState(state, additionalData = {}) {
    this.log('info', 'Application State', {
      type: 'app-state',
      state: typeof state === 'object' ? JSON.stringify(state) : state,
      ...additionalData,
      timestamp: new Date().toISOString()
    });
  }

  // Performance mark
  mark(name, data = {}) {
    if ('performance' in window) {
      performance.mark(name);
      this.log('info', 'Performance Mark', {
        type: 'performance-mark',
        name,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Performance measure
  measure(name, startMark, endMark, data = {}) {
    if ('performance' in window) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];

      this.log('info', 'Performance Measure', {
        type: 'performance-measure',
        name,
        startMark,
        endMark,
        duration: measure.duration,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Log error with stack trace
  logErrorWithStackTrace(error, additionalData = {}) {
    const stackTrace = error.stack || new Error().stack;

    this.log('error', 'Error with Stack Trace', {
      type: 'error-with-stack',
      message: error.message,
      stack: stackTrace,
      error: error.toString(),
      ...additionalData,
      timestamp: new Date().toISOString()
    });
  }

  // Batch log multiple entries
  batchLog(entries) {
    const batchId = this.generateRequestId();

    entries.forEach((entry, index) => {
      this.log(entry.level || 'info', entry.message, {
        ...entry.data,
        batchId,
        batchIndex: index,
        batchSize: entries.length
      });
    });
  }

  // Get aggregated metrics
  getAggregatedMetrics() {
    return {
      ...this.metrics,
      logStats: this.getLogStats(),
      performance: this.getPerformanceMetrics(),
      session: {
        id: this.sessionId,
        userId: this.userId,
        startTime: this.sessionStartTime || new Date().toISOString()
      }
    };
  }

  // Report metrics to external service
  async reportMetrics() {
    if (!this.metricsEndpoint) return;

    try {
      await fetch(this.metricsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.metricsHeaders
        },
        body: JSON.stringify(this.getAggregatedMetrics())
      });
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }

  // Set metrics reporting endpoint
  setMetricsEndpoint(endpoint, headers = {}) {
    this.metricsEndpoint = endpoint;
    this.metricsHeaders = headers;
  }

  // Start periodic metrics reporting
  startPeriodicReporting(interval = 30000) { // Default to every 30 seconds
    this.stopPeriodicReporting();

    this.periodicReportingInterval = setInterval(() => {
      this.reportMetrics();
    }, interval);
  }

  // Stop periodic metrics reporting
  stopPeriodicReporting() {
    if (this.periodicReportingInterval) {
      clearInterval(this.periodicReportingInterval);
      this.periodicReportingInterval = null;
    }
  }
}

// Singleton instance
const loggingMonitor = new LoggingMonitor();

// Export the class and instance
export { LoggingMonitor, loggingMonitor };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    loggingMonitor.logPageView();
  });
}