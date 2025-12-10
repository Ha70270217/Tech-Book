// Offline-First Service for ensuring app works seamlessly offline and syncs when online

class OfflineFirstService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.offlineStorage = new Map(); // In-memory cache for quick access
    this.pendingOperations = new Map(); // Operations waiting to be synced
    this.eventListeners = new Map(); // Event listeners for offline/online events

    // Initialize service
    this.init();
  }

  // Initialize the service
  init() {
    // Set up online/offline event listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initialize IndexedDB through our cache service
    import('./../utils/offlineCache').then(({ offlineCache }) => {
      this.cacheService = offlineCache;
    });

    // Start sync polling when online
    this.startSyncPolling();
  }

  // Handle online event
  handleOnline() {
    this.isOnline = true;
    console.log('Connection restored, attempting sync...');

    // Trigger sync
    this.syncPendingOperations();

    // Notify listeners
    this.notifyEventListeners('online');
  }

  // Handle offline event
  handleOffline() {
    this.isOnline = false;
    console.log('Connection lost, operating in offline mode...');

    // Notify listeners
    this.notifyEventListeners('offline');
  }

  // Make a request using offline-first approach
  async makeRequest(url, options = {}) {
    const { method = 'GET', data, headers = {}, ...restOptions } = options;

    // Create a unique operation ID
    const operationId = this.generateOperationId(url, method, data);

    // Check if we're online
    if (this.isOnline) {
      try {
        // Try to make the request directly
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: data ? JSON.stringify(data) : undefined,
          ...restOptions
        });

        if (response.ok) {
          const result = await response.json();

          // Cache the result for offline access
          await this.cacheService.storeContent(
            `response-${operationId}`,
            result,
            url,
            'api-response'
          );

          return result;
        } else {
          // If request fails but we're online, throw error
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.warn('Online request failed, falling back to offline:', error);
        // Fall back to offline mode
        return this.handleOfflineRequest(operationId, url, method, data);
      }
    } else {
      // We're offline, handle offline request
      return this.handleOfflineRequest(operationId, url, method, data);
    }
  }

  // Handle request when offline
  async handleOfflineRequest(operationId, url, method, data) {
    // For GET requests, try to serve from cache
    if (method === 'GET') {
      const cachedResponse = await this.cacheService.getContent(`response-${operationId}`);
      if (cachedResponse && cachedResponse.content) {
        console.log('Serving from offline cache');
        return cachedResponse.content;
      } else {
        throw new Error('No cached data available and device is offline');
      }
    }

    // For other methods (POST, PUT, DELETE), queue for later sync
    const operation = {
      id: operationId,
      url,
      method,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 5
    };

    // Add to sync queue
    this.addToSyncQueue(operation);

    // Store operation for later
    this.pendingOperations.set(operationId, operation);

    // Return optimistic response for certain operations
    if (method === 'POST') {
      // Return a temporary ID for the new resource
      return { id: `temp-${Date.now()}`, status: 'pending', message: 'Operation queued for sync' };
    } else if (method === 'PUT' || method === 'DELETE') {
      return { status: 'pending', message: 'Operation queued for sync' };
    }

    throw new Error('Cannot perform this operation while offline');
  }

  // Add operation to sync queue
  addToSyncQueue(operation) {
    this.syncQueue.push(operation);
    this.saveSyncQueue();
  }

  // Remove operation from sync queue
  removeFromSyncQueue(operationId) {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    this.pendingOperations.delete(operationId);
    this.saveSyncQueue();
  }

  // Save sync queue to persistent storage
  saveSyncQueue() {
    try {
      localStorage.setItem('offlineSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load sync queue from persistent storage
  loadSyncQueue() {
    try {
      const queueData = localStorage.getItem('offlineSyncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Start sync polling
  startSyncPolling() {
    // Load any pending operations from storage
    this.loadSyncQueue();

    // Poll for sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000); // 30 seconds
  }

  // Sync pending operations
  async syncPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`Attempting to sync ${this.syncQueue.length} operations`);

    const operationsToSync = [...this.syncQueue];
    const successfulSyncs = [];

    for (const operation of operationsToSync) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: operation.data ? JSON.stringify(operation.data) : undefined
        });

        if (response.ok) {
          // Success - remove from queue
          const index = this.syncQueue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.syncQueue.splice(index, 1);
            successfulSyncs.push(operation);

            // Update any related cached content
            await this.updateRelatedCache(operation);
          }

          // Notify listeners of successful sync
          this.notifyEventListeners('sync-success', operation);
        } else {
          // Failed sync - increment retry count
          operation.retries++;

          if (operation.retries >= operation.maxRetries) {
            // Remove from queue after max retries
            const index = this.syncQueue.findIndex(op => op.id === operation.id);
            if (index !== -1) {
              this.syncQueue.splice(index, 1);
              this.notifyEventListeners('sync-failed', operation);
            }
          } else {
            // Keep in queue for retry
            console.warn(`Sync failed for operation ${operation.id}, will retry (${operation.retries}/${operation.maxRetries})`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        operation.retries++;

        if (operation.retries >= operation.maxRetries) {
          const index = this.syncQueue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.syncQueue.splice(index, 1);
            this.notifyEventListeners('sync-failed', operation);
          }
        }
      }
    }

    // Save updated queue
    this.saveSyncQueue();

    if (successfulSyncs.length > 0) {
      console.log(`Successfully synced ${successfulSyncs.length} operations`);
    }
  }

  // Update related cache after successful sync
  async updateRelatedCache(operation) {
    // Invalidate related cache entries
    if (operation.method === 'POST') {
      // For POST operations, clear related list caches
      const urlParts = operation.url.split('/');
      const resource = urlParts[urlParts.length - 1]; // Last part of URL

      // Clear cache for related list endpoints
      const listKeys = Array.from(this.offlineStorage.keys()).filter(key =>
        key.includes(resource) && key.includes('list')
      );

      listKeys.forEach(key => {
        this.offlineStorage.delete(key);
      });
    } else if (operation.method === 'PUT' || operation.method === 'DELETE') {
      // For PUT/DELETE, clear specific item cache
      const itemKey = `response-${this.generateOperationId(operation.url, 'GET')}`;
      await this.cacheService.storeContent(itemKey, null, operation.url, 'api-response');
    }
  }

  // Generate unique operation ID
  generateOperationId(url, method, data) {
    const str = `${url}-${method}-${JSON.stringify(data || {})}-${Date.now()}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${method}-${hash}`;
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Notify event listeners
  notifyEventListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      hasPendingSync: this.syncQueue.length > 0,
      pendingSyncCount: this.syncQueue.length,
      syncQueue: this.syncQueue
    };
  }

  // Force sync
  async forceSync() {
    if (this.isOnline) {
      await this.syncPendingOperations();
    }
  }

  // Clear all offline data (for debugging/reset)
  async clearOfflineData() {
    // Clear sync queue
    this.syncQueue = [];
    this.pendingOperations.clear();
    localStorage.removeItem('offlineSyncQueue');

    // Clear in-memory cache
    this.offlineStorage.clear();

    // Clear IndexedDB through cache service
    if (this.cacheService) {
      // Clear old cache entries (keep recent ones)
      await this.cacheService.clearOldCache(0); // Clear everything
    }
  }

  // Get statistics about offline usage
  getStatistics() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      cachedItems: this.offlineStorage.size,
      lastSyncTime: localStorage.getItem('lastSyncTime'),
      totalRequestsServed: localStorage.getItem('totalRequestsServed') || 0
    };
  }
}

// Singleton instance
const offlineFirstService = new OfflineFirstService();

// Export the class and instance
export { OfflineFirstService, offlineFirstService };

// Make service available globally for debugging
if (typeof window !== 'undefined') {
  window.OfflineFirstService = offlineFirstService;
}