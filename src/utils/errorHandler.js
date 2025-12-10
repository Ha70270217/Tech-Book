// Comprehensive error handling and fallback strategies

class ErrorHandler {
  constructor() {
    this.errorHandlers = new Map();
    this.fallbackStrategies = new Map();
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.reportingEnabled = true;
    this.reportingEndpoint = null;
    this.reportingHeaders = {};

    // Set up global error handlers
    this.setupGlobalErrorHandling();
  }

  // Set up global error handling
  setupGlobalErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'uncaught-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandled-rejection',
        message: event.reason?.message || String(event.reason),
        error: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });
  }

  // Main error handling function
  handleError(errorInfo) {
    // Add to error log
    this.addToErrorLog(errorInfo);

    // Execute custom error handlers if available
    if (this.errorHandlers.has(errorInfo.type)) {
      const handler = this.errorHandlers.get(errorInfo.type);
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Apply fallback strategy if available
    if (this.fallbackStrategies.has(errorInfo.type)) {
      const strategy = this.fallbackStrategies.get(errorInfo.type);
      try {
        strategy(errorInfo);
      } catch (strategyError) {
        console.error('Error in fallback strategy:', strategyError);
      }
    }

    // Report error if enabled
    if (this.reportingEnabled) {
      this.reportError(errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorInfo);
    }
  }

  // Add error to log
  addToErrorLog(errorInfo) {
    this.errorLog.push(errorInfo);

    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  // Register a custom error handler
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  // Register a fallback strategy
  registerFallbackStrategy(errorType, strategy) {
    this.fallbackStrategies.set(errorType, strategy);
  }

  // Report error to external service
  async reportError(errorInfo) {
    if (!this.reportingEndpoint) return;

    try {
      const response = await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.reportingHeaders
        },
        body: JSON.stringify({
          error: errorInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId()
        })
      });

      if (!response.ok) {
        console.error('Failed to report error:', response.status);
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }

  // Get session ID for tracking
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  // Create a safe wrapper for functions that might throw errors
  safeExecute(fn, fallbackValue = null, onError = null) {
    try {
      return fn();
    } catch (error) {
      this.handleError({
        type: 'function-error',
        message: error.message,
        error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        functionName: fn.name
      });

      if (onError) {
        onError(error);
      }

      return fallbackValue;
    }
  }

  // Async version of safe execution
  async safeExecuteAsync(asyncFn, fallbackValue = null, onError = null) {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleError({
        type: 'async-function-error',
        message: error.message,
        error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        functionName: asyncFn.name
      });

      if (onError) {
        await onError(error);
      }

      return fallbackValue;
    }
  }

  // Safe API call with fallback and retry logic
  async safeApiCall(url, options = {}, fallbackResponse = null, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;

        // If this was the last attempt, break the loop
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // If all attempts failed, log the error and return fallback
    this.handleError({
      type: 'api-call-failed',
      message: `API call failed after ${maxRetries} attempts: ${url}`,
      error: lastError,
      url,
      options,
      maxRetries,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    return fallbackResponse;
  }

  // Safe component rendering with error boundary behavior
  safeRender(renderFn, fallbackComponent = null) {
    try {
      return renderFn();
    } catch (error) {
      this.handleError({
        type: 'render-error',
        message: error.message,
        error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      return fallbackComponent || this.getDefaultFallbackComponent(error);
    }
  }

  // Get default fallback component
  getDefaultFallbackComponent(error) {
    return (
      <div className="error-fallback">
        <h3>Something went wrong</h3>
        <p>We're sorry, but an error occurred while loading this content.</p>
        {process.env.NODE_ENV === 'development' && (
          <details>
            <summary>Error details</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  // Graceful degradation for missing features
  gracefulDegradation(featureCheck, degradedFunctionality, enhancedFunctionality) {
    if (this.safeExecute(featureCheck, false)) {
      return enhancedFunctionality;
    } else {
      this.handleError({
        type: 'feature-not-supported',
        message: 'Browser feature not supported, using degraded functionality',
        featureCheck: featureCheck.toString(),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      return degradedFunctionality;
    }
  }

  // Fallback for service worker issues
  handleServiceWorkerError(error) {
    this.handleError({
      type: 'service-worker-error',
      message: error.message || 'Service worker error occurred',
      error,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    // Fallback to network-only strategy
    console.warn('Service worker failed, falling back to network-only strategy');
  }

  // Fallback for storage issues
  handleStorageError(error, key, value) {
    this.handleError({
      type: 'storage-error',
      message: `Failed to store data in ${key}: ${error.message}`,
      error,
      key,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    // Attempt to clear some storage space
    this.attemptStorageCleanup();
  }

  // Attempt to clean up storage when full
  attemptStorageCleanup() {
    try {
      // Remove oldest cache entries
      const keys = Object.keys(localStorage);
      if (keys.length > 100) { // Arbitrary threshold
        // Remove oldest entries (oldest 10%)
        const removeCount = Math.floor(keys.length * 0.1);
        for (let i = 0; i < removeCount; i++) {
          localStorage.removeItem(keys[i]);
        }
      }
    } catch (cleanupError) {
      console.error('Storage cleanup failed:', cleanupError);
    }
  }

  // Network error fallback
  handleNetworkError(error, url, method = 'GET') {
    this.handleError({
      type: 'network-error',
      message: `Network request failed: ${method} ${url}`,
      error,
      url,
      method,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    // Check if we're offline
    if (!navigator.onLine) {
      // Try to serve from cache
      return this.attemptOfflineFallback(url);
    }

    // Return a generic error response
    return {
      error: true,
      message: 'Network request failed',
      fallback: true
    };
  }

  // Attempt offline fallback
  async attemptOfflineFallback(url) {
    try {
      // Check if we have cached content for this URL
      if ('caches' in window) {
        const cache = await caches.open('offline-cache');
        const response = await cache.match(url);

        if (response) {
          console.log('Serving from offline cache:', url);
          return response;
        }
      }

      // Return a generic offline page
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Offline - content not available in cache',
          offline: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (fallbackError) {
      console.error('Offline fallback failed:', fallbackError);
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Unable to load content offline',
          offline: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Timeout wrapper for promises
  promiseWithTimeout(promise, timeoutMs, timeoutMessage = 'Operation timed out') {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise.then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  // Safe timeout execution
  safeTimeout(callback, delay, fallback = null) {
    let executed = false;

    const timer = setTimeout(() => {
      executed = true;
      try {
        callback();
      } catch (error) {
        this.handleError({
          type: 'timeout-error',
          message: 'Error in timeout callback',
          error,
          delay,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    }, delay);

    // Return a function to cancel the timeout and handle cancellation
    return () => {
      if (!executed) {
        clearTimeout(timer);
        return fallback;
      }
      return null;
    };
  }

  // Error recovery function
  async attemptRecovery(errorInfo, recoverySteps) {
    for (const step of recoverySteps) {
      try {
        await step();
        return true; // Recovery successful
      } catch (recoveryError) {
        console.warn('Recovery step failed:', recoveryError);
        // Continue to next recovery step
      }
    }
    return false; // All recovery steps failed
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorTypes: {},
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
      errorRate: 0 // Errors per hour
    };

    // Count error types
    this.errorLog.forEach(error => {
      if (!stats.errorTypes[error.type]) {
        stats.errorTypes[error.type] = 0;
      }
      stats.errorTypes[error.type]++;
    });

    // Calculate error rate (per hour)
    if (this.errorLog.length > 0) {
      const timeSpan = Date.now() - new Date(this.errorLog[0].timestamp).getTime();
      const hours = timeSpan / (1000 * 60 * 60);
      stats.errorRate = hours > 0 ? this.errorLog.length / hours : 0;
    }

    return stats;
  }

  // Export error logs
  exportErrorLogs(format = 'json') {
    const data = {
      logs: this.errorLog,
      stats: this.getErrorStats(),
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'Type,Message,Timestamp,URL\n';
      this.errorLog.forEach(log => {
        csv += `"${log.type}","${log.message.replace(/"/g, '""')}","${log.timestamp}","${log.url.replace(/"/g, '""')}"\n`;
      });
      return csv;
    }

    return null;
  }

  // Download error logs
  downloadErrorLogs(filename = 'error-logs', format = 'json') {
    const data = this.exportErrorLogs(format);
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

  // Clear error logs
  clearErrorLogs() {
    this.errorLog = [];
  }

  // Configure error reporting
  configureReporting(endpoint, headers = {}) {
    this.reportingEndpoint = endpoint;
    this.reportingHeaders = headers;
  }

  // Enable/disable error reporting
  setReporting(enabled) {
    this.reportingEnabled = enabled;
  }

  // Get recent errors
  getRecentErrors(count = 10) {
    return this.errorLog.slice(-count);
  }

  // Check if error is of a specific type
  isErrorOfType(error, typePattern) {
    if (typeof typePattern === 'string') {
      return error.type && error.type.includes(typePattern);
    } else if (typePattern instanceof RegExp) {
      return error.type && typePattern.test(error.type);
    }
    return false;
  }

  // Subscribe to error events
  subscribeToErrors(callback) {
    if (!this.errorSubscribers) {
      this.errorSubscribers = [];
    }
    this.errorSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.errorSubscribers.indexOf(callback);
      if (index !== -1) {
        this.errorSubscribers.splice(index, 1);
      }
    };
  }

  // Notify error subscribers
  notifyErrorSubscribers(errorInfo) {
    if (this.errorSubscribers) {
      this.errorSubscribers.forEach(subscriber => {
        try {
          subscriber(errorInfo);
        } catch (subscriberError) {
          console.error('Error in error subscriber:', subscriberError);
        }
      });
    }
  }

  // Enhanced error handler that also notifies subscribers
  handleError(errorInfo) {
    // Add to error log
    this.addToErrorLog(errorInfo);

    // Notify subscribers
    this.notifyErrorSubscribers(errorInfo);

    // Execute custom error handlers if available
    if (this.errorHandlers.has(errorInfo.type)) {
      const handler = this.errorHandlers.get(errorInfo.type);
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Apply fallback strategy if available
    if (this.fallbackStrategies.has(errorInfo.type)) {
      const strategy = this.fallbackStrategies.get(errorInfo.type);
      try {
        strategy(errorInfo);
      } catch (strategyError) {
        console.error('Error in fallback strategy:', strategyError);
      }
    }

    // Report error if enabled
    if (this.reportingEnabled) {
      this.reportError(errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorInfo);
    }
  }

  // Destroy the error handler instance
  destroy() {
    // Clear all event listeners
    window.removeEventListener('error', this.globalErrorHandler);
    window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);

    // Clear all handlers and strategies
    this.errorHandlers.clear();
    this.fallbackStrategies.clear();
    this.errorSubscribers = [];
  }
}

// Singleton instance
const errorHandler = new ErrorHandler();

// Export the class and instance
export { ErrorHandler, errorHandler };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.ErrorHandler = errorHandler;
}