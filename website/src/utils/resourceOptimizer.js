// Resource optimization utility for efficient loading and caching

class ResourceOptimizer {
  constructor() {
    this.resourceCache = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    this.loadedResources = new Set();
    this.cacheSizeLimit = 100; // Maximum number of resources to cache
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes expiry
    this.isOnline = navigator.onLine;

    // Initialize
    this.init();
  }

  init() {
    // Set up online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      // Resume preload queue when back online
      this.processPreloadQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Preload a resource
  async preloadResource(url, type = 'auto') {
    if (!url) return;

    // Don't preload if offline
    if (!this.isOnline) return;

    // Check if already loaded or loading
    if (this.loadedResources.has(url) || this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    // Determine resource type if not specified
    if (type === 'auto') {
      if (url.endsWith('.js')) type = 'script';
      else if (url.endsWith('.css')) type = 'style';
      else if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) type = 'image';
      else type = 'other';
    }

    let promise;

    switch (type) {
      case 'script':
        promise = this.loadScript(url);
        break;
      case 'style':
        promise = this.loadStyle(url);
        break;
      case 'image':
        promise = this.loadImage(url);
        break;
      default:
        promise = this.loadResource(url);
    }

    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      this.loadedResources.add(url);
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  // Load script resource
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(src)) {
        resolve(this.resourceCache.get(src));
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        this.cacheResource(src, script);
        resolve(script);
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  // Load CSS resource
  loadStyle(href) {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(href)) {
        resolve(this.resourceCache.get(href));
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      link.onload = () => {
        this.cacheResource(href, link);
        resolve(link);
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  // Load image resource
  loadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(src)) {
        resolve(this.resourceCache.get(src));
        return;
      }

      const img = new Image();

      img.onload = () => {
        this.cacheResource(src, img);
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  // Generic resource loader
  async loadResource(url) {
    if (this.resourceCache.has(url)) {
      return this.resourceCache.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load resource: ${url} (${response.status})`);
    }

    const contentType = response.headers.get('content-type');
    let content;

    if (contentType && contentType.includes('application/json')) {
      content = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      content = await response.text();
    } else {
      content = await response.blob();
    }

    this.cacheResource(url, content);
    return content;
  }

  // Cache a resource
  cacheResource(key, resource) {
    // Check cache size limit
    if (this.resourceCache.size >= this.cacheSizeLimit) {
      // Remove oldest entries
      const oldestKey = this.resourceCache.keys().next().value;
      this.resourceCache.delete(oldestKey);
    }

    this.resourceCache.set(key, {
      resource,
      timestamp: Date.now(),
      type: this.getResourceType(key)
    });
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.match(/\.(mp4|webm|ogg|avi|mov)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) return 'audio';
    if (url.endsWith('.json')) return 'json';
    return 'other';
  }

  // Get cached resource
  getCachedResource(key) {
    const cached = this.resourceCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.resource;
    } else {
      // Remove expired cache entry
      this.resourceCache.delete(key);
      return null;
    }
  }

  // Preload resources in advance
  async preloadResources(resources, priority = 'normal') {
    if (!Array.isArray(resources)) return;

    // Sort by priority if needed
    const sortedResources = [...resources];
    if (priority === 'high') {
      // High priority resources first
      sortedResources.sort((a, b) => {
        const aPriority = this.getResourcePriority(a.url || a);
        const bPriority = this.getResourcePriority(b.url || b);
        return bPriority - aPriority;
      });
    }

    const promises = sortedResources.map(resource => {
      const url = typeof resource === 'string' ? resource : resource.url;
      const type = typeof resource === 'string' ? 'auto' : resource.type || 'auto';
      return this.preloadResource(url, type);
    });

    return Promise.allSettled(promises);
  }

  // Get resource priority (higher number = higher priority)
  getResourcePriority(url) {
    if (url.includes('critical') || url.includes('main') || url.includes('core')) return 5;
    if (url.includes('essential') || url.includes('important')) return 4;
    if (url.includes('chapter') || url.includes('lesson')) return 3;
    if (url.includes('exercise') || url.includes('quiz')) return 2;
    return 1;
  }

  // Add resource to preload queue
  addToPreloadQueue(resource, priority = 'normal') {
    this.preloadQueue.push({ resource, priority, timestamp: Date.now() });
    // Process queue in next tick to avoid blocking
    setTimeout(() => this.processPreloadQueue(), 0);
  }

  // Process preload queue
  async processPreloadQueue() {
    if (!this.isOnline || this.preloadQueue.length === 0) return;

    // Sort queue by priority and age
    this.preloadQueue.sort((a, b) => {
      const priorityDiff = this.getResourcePriority(b.resource) - this.getResourcePriority(a.resource);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp; // Older items first
    });

    // Process high priority items first
    const highPriorityItems = this.preloadQueue.filter(item => this.getResourcePriority(item.resource) >= 4);
    const normalPriorityItems = this.preloadQueue.filter(item => this.getResourcePriority(item.resource) < 4);

    // Preload high priority items immediately
    for (const item of highPriorityItems) {
      await this.preloadResource(item.resource);
      this.preloadQueue = this.preloadQueue.filter(i => i !== item);
    }

    // Preload normal priority items with throttling
    for (const item of normalPriorityItems) {
      await this.preloadResource(item.resource);
      this.preloadQueue = this.preloadQueue.filter(i => i !== item);
      // Small delay between requests to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Lazy load images when they come into view
  lazyLoadImages(container = document) {
    const images = container.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.removeAttribute('data-src');

              // Remove observer when image is loaded
              img.addEventListener('load', () => {
                observer.unobserve(img);
              });
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without Intersection Observer
      images.forEach(img => {
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      });
    }
  }

  // Prefetch resources likely to be needed soon
  async prefetchResources(resources) {
    if (!this.isOnline) return;

    // Use the browser's prefetch mechanism if available
    if ('connection' in navigator && navigator.connection.saveData) {
      // User has data saving enabled, skip prefetching
      return;
    }

    for (const resource of resources) {
      try {
        // Use HTTP prefetch hint
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);

        // Also add to preload queue for better control
        this.addToPreloadQueue(resource, 'normal');
      } catch (error) {
        console.warn('Failed to prefetch resource:', resource, error);
      }
    }
  }

  // Get resource loading statistics
  getStats() {
    return {
      cacheSize: this.resourceCache.size,
      loadedResources: this.loadedResources.size,
      loadingPromises: this.loadingPromises.size,
      preloadQueue: this.preloadQueue.length,
      isOnline: this.isOnline,
      cacheExpiry: this.cacheExpiry,
      cacheSizeLimit: this.cacheSizeLimit
    };
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.resourceCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.resourceCache.delete(key);
      }
    }
  }

  // Clear all cache
  clearAllCache() {
    this.resourceCache.clear();
    this.loadedResources.clear();
    this.loadingPromises.clear();
    this.preloadQueue = [];
  }

  // Get network information if available
  getNetworkInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  // Adjust loading strategy based on network conditions
  getLoadingStrategy() {
    const networkInfo = this.getNetworkInfo();

    if (!networkInfo) {
      return 'standard'; // Unknown network conditions
    }

    if (networkInfo.saveData) {
      return 'conservative'; // User prefers to save data
    }

    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      return 'conservative';
    }

    if (networkInfo.effectiveType === '3g') {
      return 'moderate';
    }

    return 'aggressive'; // Good network conditions
  }

  // Optimize loading based on network conditions
  async adaptiveLoad(url, options = {}) {
    const strategy = this.getLoadingStrategy();

    switch (strategy) {
      case 'conservative':
        // Only load essential resources
        if (options.priority !== 'high') {
          return this.loadResource(url);
        }
        break;
      case 'moderate':
        // Load with moderate optimization
        return this.preloadResource(url, options.type || 'auto');
      case 'aggressive':
      default:
        // Load aggressively with prefetching
        this.prefetchResources([url]);
        return this.preloadResource(url, options.type || 'auto');
    }
  }
}

// Singleton instance
const resourceOptimizer = new ResourceOptimizer();

// Export the class and instance
export { ResourceOptimizer, resourceOptimizer };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.ResourceOptimizer = resourceOptimizer;
}