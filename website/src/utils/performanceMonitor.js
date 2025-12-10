// Performance monitoring utility for tracking app performance

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigationStart: 0,
      loadComplete: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    };

    this.performanceObservers = [];
    this.pageLoadTimes = [];
    this.resourceLoadTimes = [];
  }

  // Initialize performance monitoring
  init() {
    this.metrics.navigationStart = performance.timing.navigationStart;

    // Monitor DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.domContentLoaded = performance.now();
    });

    // Monitor page load complete
    window.addEventListener('load', () => {
      this.metrics.loadComplete = performance.now();
      this.calculateMetrics();
    });

    // Monitor paint events
    if ('paint' in performance) {
      performance.getEntriesByType('paint').forEach(entry => {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }

    // Observe Largest Contentful Paint
    if ('largest-contentful-paint' in performance) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.performanceObservers.push(lcpObserver);
    }

    // Observe Cumulative Layout Shift
    if ('layout-shift' in performance) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.performanceObservers.push(clsObserver);
    }

    // Observe First Input Delay
    if ('first-input' in performance) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        this.metrics.firstInputDelay = firstEntry.processingStart - firstEntry.startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.performanceObservers.push(fidObserver);
    }

    // Monitor resource loading
    this.monitorResourceLoading();
  }

  // Calculate derived metrics
  calculateMetrics() {
    this.metrics.pageLoadTime = this.metrics.loadComplete;
    this.metrics.domContentLoadedTime = this.metrics.domContentLoaded;
  }

  // Monitor resource loading times
  monitorResourceLoading() {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.resourceLoadTimes.push({
          name: entry.name,
          duration: entry.duration,
          entryType: entry.entryType,
          startTime: entry.startTime
        });
      });
    });
    resourceObserver.observe({ entryTypes: ['resource', 'navigation'] });
    this.performanceObservers.push(resourceObserver);
  }

  // Track page load time
  trackPageLoadTime() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    this.pageLoadTimes.push(loadTime);
    return loadTime;
  }

  // Get current performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      pageLoadTimes: [...this.pageLoadTimes],
      resourceLoadTimes: [...this.resourceLoadTimes],
      avgPageLoadTime: this.pageLoadTimes.length > 0
        ? this.pageLoadTimes.reduce((a, b) => a + b, 0) / this.pageLoadTimes.length
        : 0,
      avgResourceLoadTime: this.resourceLoadTimes.length > 0
        ? this.resourceLoadTimes.reduce((a, b) => a + b.duration, 0) / this.resourceLoadTimes.length
        : 0
    };
  }

  // Report performance metrics
  reportMetrics() {
    const metrics = this.getMetrics();
    console.group('Performance Metrics');
    console.log('Page Load Time:', metrics.pageLoadTime, 'ms');
    console.log('DOM Content Loaded:', metrics.domContentLoadedTime, 'ms');
    console.log('First Paint:', metrics.firstPaint, 'ms');
    console.log('First Contentful Paint:', metrics.firstContentfulPaint, 'ms');
    console.log('Largest Contentful Paint:', metrics.largestContentfulPaint, 'ms');
    console.log('Cumulative Layout Shift:', metrics.cumulativeLayoutShift);
    console.log('First Input Delay:', metrics.firstInputDelay, 'ms');
    console.log('Average Page Load Time:', metrics.avgPageLoadTime, 'ms');
    console.log('Average Resource Load Time:', metrics.avgResourceLoadTime, 'ms');
    console.log('Total Resources Loaded:', metrics.resourceLoadTimes.length);
    console.groupEnd();

    // Send metrics to analytics (in a real implementation)
    this.sendToAnalytics(metrics);
  }

  // Send metrics to analytics service
  sendToAnalytics(metrics) {
    // In a real implementation, this would send metrics to an analytics service
    // For now, we'll just store them locally
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
      storedMetrics.push({
        timestamp: Date.now(),
        ...metrics
      });

      // Keep only the last 100 metrics to avoid storage overflow
      if (storedMetrics.length > 100) {
        storedMetrics.shift();
      }

      localStorage.setItem('performanceMetrics', JSON.stringify(storedMetrics));
    } catch (error) {
      console.error('Error storing performance metrics:', error);
    }
  }

  // Get performance recommendations
  getRecommendations() {
    const metrics = this.getMetrics();
    const recommendations = [];

    if (metrics.pageLoadTime > 3000) {
      recommendations.push('Consider optimizing page load time (current: ' + metrics.pageLoadTime + 'ms)');
    }

    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push('Optimize Largest Contentful Paint (current: ' + metrics.largestContentfulPaint + 'ms)');
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift (current: ' + metrics.cumulativeLayoutShift + ')');
    }

    if (metrics.firstInputDelay > 100) {
      recommendations.push('Improve First Input Delay (current: ' + metrics.firstInputDelay + 'ms)');
    }

    return recommendations;
  }

  // Check if performance meets standards
  checkPerformanceStandards() {
    const metrics = this.getMetrics();

    return {
      passes: {
        lcp: metrics.largestContentfulPaint <= 2500,
        cls: metrics.cumulativeLayoutShift <= 0.1,
        fid: metrics.firstInputDelay <= 100
      },
      scores: {
        lcp: this.calculateScore(metrics.largestContentfulPaint, 2500, 4000),
        cls: this.calculateScore(metrics.cumulativeLayoutShift, 0.1, 0.25, true), // Lower is better
        fid: this.calculateScore(metrics.firstInputDelay, 100, 300)
      }
    };
  }

  // Calculate performance score (0-100)
  calculateScore(value, thresholdGood, thresholdPoor, lowerIsBetter = false) {
    if (lowerIsBetter) {
      if (value <= thresholdGood) return 100;
      if (value >= thresholdPoor) return 0;
      return Math.round(100 - ((value - thresholdGood) / (thresholdPoor - thresholdGood)) * 100);
    } else {
      if (value <= thresholdGood) return 100;
      if (value >= thresholdPoor) return 0;
      return Math.round(100 - ((value - thresholdGood) / (thresholdPoor - thresholdGood)) * 100);
    }
  }

  // Cleanup performance observers
  destroy() {
    this.performanceObservers.forEach(observer => {
      observer.disconnect();
    });
    this.performanceObservers = [];
  }

  // Get performance summary
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    const standards = this.checkPerformanceStandards();

    return {
      metrics,
      standards,
      recommendations: this.getRecommendations(),
      overallScore: Math.round((standards.scores.lcp + standards.scores.cls + standards.scores.fid) / 3),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export the class and instance
export { PerformanceMonitor, performanceMonitor };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    performanceMonitor.init();

    // Report metrics after a delay to allow for all metrics to be captured
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 3000);
  });
}