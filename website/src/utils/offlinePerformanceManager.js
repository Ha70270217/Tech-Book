// Offline and Performance Manager - Integrates all offline and performance features

import { offlineFirstService } from './services/OfflineFirstService';
import { performanceMonitor } from './performanceMonitor';
import { performanceBudget } from './performanceBudget';
import { performanceAlerts } from './performanceAlerts';
import { performanceTesting } from './performanceTesting';
import { resourceOptimizer } from './resourceOptimizer';
import { imageOptimizer } from './imageOptimizer';

class OfflinePerformanceManager {
  constructor() {
    this.isInitialized = false;
    this.components = {
      offlineFirstService,
      performanceMonitor,
      performanceBudget,
      performanceAlerts,
      performanceTesting,
      resourceOptimizer,
      imageOptimizer
    };

    this.config = {
      enableOffline: true,
      enablePerformanceMonitoring: true,
      enableResourceOptimization: true,
      enableImageOptimization: true,
      enableAlerts: true,
      enableTesting: true,
      enableBudgetTracking: true
    };
  }

  // Initialize all components
  async init(config = {}) {
    if (this.isInitialized) return;

    // Merge configuration
    this.config = { ...this.config, ...config };

    try {
      // Initialize offline-first service
      if (this.config.enableOffline) {
        this.components.offlineFirstService.init();
      }

      // Initialize performance monitor
      if (this.config.enablePerformanceMonitoring) {
        this.components.performanceMonitor.init();
      }

      // Initialize performance budget
      if (this.config.enableBudgetTracking) {
        this.components.performanceBudget.init();
      }

      // Initialize performance alerts
      if (this.config.enableAlerts) {
        this.components.performanceAlerts.init();
      }

      // Initialize resource optimizer
      if (this.config.enableResourceOptimization) {
        // Preload critical resources
        this.preloadCriticalResources();
      }

      // Initialize image optimizer
      if (this.config.enableImageOptimization) {
        // Setup lazy loading for images
        this.setupImageLazyLoading();
      }

      this.isInitialized = true;
      console.log('Offline and Performance Manager initialized successfully');

      // Run initial performance tests
      if (this.config.enableTesting) {
        this.runInitialPerformanceTests();
      }

    } catch (error) {
      console.error('Failed to initialize Offline and Performance Manager:', error);
      throw error;
    }
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      '/css/custom.css',
      '/js/main.js',
      '/manifest.json',
      '/sw.js',
      '/docs/',
      '/docs/chapter-1/'
    ];

    this.components.resourceOptimizer.preloadResources(criticalResources, 'high');
  }

  // Setup image lazy loading
  setupImageLazyLoading() {
    // Use Intersection Observer for modern browsers
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (src) {
              // Optimize image before loading
              this.components.imageOptimizer.lazyLoadAndOptimize(img);
              observer.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src attribute
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  // Run initial performance tests
  async runInitialPerformanceTests() {
    try {
      // Run common benchmarks
      const commonBenchmarks = await this.components.performanceTesting.runCommonBenchmarks();
      console.log('Initial performance benchmarks completed:', commonBenchmarks);

      // Run loading performance test
      const loadingBenchmark = await this.components.performanceTesting.benchmarkLoading();
      console.log('Loading performance benchmark completed:', loadingBenchmark);

      // Run rendering performance test
      const renderingBenchmark = await this.components.performanceTesting.benchmarkRendering();
      console.log('Rendering performance benchmark completed:', renderingBenchmark);

      // Run memory benchmark
      const memoryBenchmark = await this.components.performanceTesting.benchmarkMemory();
      console.log('Memory benchmark completed:', memoryBenchmark);

    } catch (error) {
      console.error('Error running initial performance tests:', error);
    }
  }

  // Make a request with offline-first approach and performance monitoring
  async makeRequest(url, options = {}) {
    // Start performance monitoring for this request
    const startTime = performance.now();
    const requestId = this.generateRequestId(url, options);

    try {
      // Use offline-first service
      const result = await this.components.offlineFirstService.makeRequest(url, options);

      // Record performance metrics
      const duration = performance.now() - startTime;

      // Update performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.components.performanceMonitor.trackMetric('request-duration', duration);
        this.components.performanceMonitor.trackMetric('request-success', 1);
      }

      // Check performance budget
      if (this.config.enableBudgetTracking) {
        // This would be handled by the performance budget system
      }

      return result;

    } catch (error) {
      // Record performance metrics for failed requests
      const duration = performance.now() - startTime;

      if (this.config.enablePerformanceMonitoring) {
        this.components.performanceMonitor.trackMetric('request-duration', duration);
        this.components.performanceMonitor.trackMetric('request-failure', 1);
      }

      // Trigger performance alert
      if (this.config.enableAlerts) {
        this.components.performanceAlerts.checkThreshold('request-failure', 1);
      }

      throw error;
    }
  }

  // Optimize an image
  async optimizeImage(file, options = {}) {
    if (!this.config.enableImageOptimization) {
      return file;
    }

    try {
      const optimized = await this.components.imageOptimizer.compressImage(file, options);
      return optimized;
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original file if optimization fails
      return file;
    }
  }

  // Preload resources with optimization
  async preloadOptimizedResources(resources, options = {}) {
    if (!this.config.enableResourceOptimization) {
      return;
    }

    try {
      // Use resource optimizer
      await this.components.resourceOptimizer.preloadResources(resources, options.priority);
    } catch (error) {
      console.error('Error preloading resources:', error);
    }
  }

  // Get offline status
  getOfflineStatus() {
    if (!this.config.enableOffline) {
      return { isOnline: true, hasPendingSync: false, pendingSyncCount: 0 };
    }

    return this.components.offlineFirstService.getOfflineStatus();
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const metrics = {};

    if (this.config.enablePerformanceMonitoring) {
      metrics.performance = this.components.performanceMonitor.getMetrics();
    }

    if (this.config.enableBudgetTracking) {
      metrics.budgetStatus = this.components.performanceBudget.getBudgetStatus();
    }

    if (this.config.enableAlerts) {
      metrics.alerts = this.components.performanceAlerts.getAlertStats();
    }

    if (this.config.enableTesting) {
      metrics.testing = this.components.performanceTesting.getPerformanceSummary();
    }

    return metrics;
  }

  // Get performance score
  getPerformanceScore() {
    if (this.config.enableBudgetTracking) {
      return this.components.performanceBudget.getPerformanceScore();
    }
    return 100; // Default score if budget tracking is disabled
  }

  // Force sync pending operations
  async forceSync() {
    if (!this.config.enableOffline) return;

    return await this.components.offlineFirstService.forceSync();
  }

  // Clear offline data
  async clearOfflineData() {
    if (!this.config.enableOffline) return;

    return await this.components.offlineFirstService.clearOfflineData();
  }

  // Get system status
  getStatus() {
    return {
      initialized: this.isInitialized,
      config: this.config,
      offline: this.getOfflineStatus(),
      performance: this.getPerformanceMetrics(),
      timestamp: Date.now()
    };
  }

  // Generate request ID
  generateRequestId(url, options) {
    return `${url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export performance data
  exportPerformanceData(format = 'json') {
    const data = {
      performance: this.getPerformanceMetrics(),
      status: this.getStatus(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Metric,Value,Unit,Timestamp\n';
      if (data.performance.performance) {
        Object.entries(data.performance.performance.metrics).forEach(([key, value]) => {
          if (typeof value === 'number') {
            csv += `"${key}",${value},"ms","${new Date(data.timestamp).toISOString()}"\n`;
          }
        });
      }
      return csv;
    }

    return null;
  }

  // Download performance report
  downloadPerformanceReport(filename = 'performance-report', format = 'json') {
    const data = this.exportPerformanceData(format);
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

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];

    if (this.config.enableBudgetTracking) {
      recommendations.push(...this.components.performanceBudget.getRecommendations());
    }

    if (this.config.enableAlerts) {
      const alertStats = this.components.performanceAlerts.getAlertStats();
      if (alertStats.critical > 0) {
        recommendations.push({
          priority: 'high',
          category: 'alerts',
          message: `${alertStats.critical} critical performance alerts detected`
        });
      }
    }

    return recommendations;
  }

  // Run performance audit
  async runPerformanceAudit() {
    const results = {
      performanceScore: this.getPerformanceScore(),
      metrics: this.getPerformanceMetrics(),
      recommendations: this.getRecommendations(),
      status: this.getStatus(),
      timestamp: Date.now()
    };

    // Trigger performance alerts based on audit results
    if (this.config.enableAlerts) {
      if (results.performanceScore < 70) {
        this.components.performanceAlerts.checkThreshold('performance-score', results.performanceScore);
      }
    }

    return results;
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {};

    if (this.config.enableResourceOptimization) {
      stats.resourceOptimizer = this.components.resourceOptimizer.getStats();
    }

    if (this.config.enableImageOptimization) {
      stats.imageOptimizer = this.components.imageOptimizer.getCacheStats();
    }

    return stats;
  }

  // Clear all caches
  clearAllCaches() {
    if (this.config.enableResourceOptimization) {
      this.components.resourceOptimizer.clearAllCache();
    }

    if (this.config.enableImageOptimization) {
      this.components.imageOptimizer.clearCache();
    }
  }

  // Enable a specific feature
  enableFeature(feature) {
    if (this.config.hasOwnProperty(feature)) {
      this.config[feature] = true;
    }
  }

  // Disable a specific feature
  disableFeature(feature) {
    if (this.config.hasOwnProperty(feature)) {
      this.config[feature] = false;
    }
  }

  // Pause monitoring
  pauseMonitoring() {
    if (this.config.enablePerformanceMonitoring) {
      this.components.performanceMonitor.destroy();
    }

    if (this.config.enableAlerts) {
      this.components.performanceAlerts.pauseMonitoring();
    }
  }

  // Resume monitoring
  resumeMonitoring() {
    if (this.config.enablePerformanceMonitoring) {
      this.components.performanceMonitor.init();
    }

    if (this.config.enableAlerts) {
      this.components.performanceAlerts.resumeMonitoring();
    }
  }
}

// Singleton instance
const offlinePerformanceManager = new OfflinePerformanceManager();

// Export the class and instance
export { OfflinePerformanceManager, offlinePerformanceManager };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await offlinePerformanceManager.init();
      console.log('Offline and Performance Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Offline and Performance Manager:', error);
    }
  });
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.OfflinePerformanceManager = offlinePerformanceManager;
}