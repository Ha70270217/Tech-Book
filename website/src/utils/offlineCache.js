// Utility for offline content caching and synchronization

class OfflineCache {
  constructor() {
    this.DB_NAME = 'TextbookDB';
    this.DB_VERSION = 1;
    this.CONTENT_STORE = 'content';
    this.PROGRESS_STORE = 'progress';
    this.BOOKMARKS_STORE = 'bookmarks';

    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        this.db = e.target.result;

        // Create object stores if they don't exist
        if (!this.db.objectStoreNames.contains(this.CONTENT_STORE)) {
          const contentStore = this.db.createObjectStore(this.CONTENT_STORE, { keyPath: 'id' });
          contentStore.createIndex('url', 'url', { unique: true });
          contentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!this.db.objectStoreNames.contains(this.PROGRESS_STORE)) {
          const progressStore = this.db.createObjectStore(this.PROGRESS_STORE, { keyPath: 'id' });
          progressStore.createIndex('userId', 'userId', { unique: false });
          progressStore.createIndex('chapterId', 'chapterId', { unique: false });
        }

        if (!this.db.objectStoreNames.contains(this.BOOKMARKS_STORE)) {
          const bookmarksStore = this.db.createObjectStore(this.BOOKMARKS_STORE, { keyPath: 'id' });
          bookmarksStore.createIndex('userId', 'userId', { unique: false });
          bookmarksStore.createIndex('chapterId', 'chapterId', { unique: false });
        }

        console.log('Database setup complete');
      };
    });
  }

  // Store content for offline access
  async storeContent(contentId, content, url, type = 'document') {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CONTENT_STORE], 'readwrite');
      const objectStore = transaction.objectStore(this.CONTENT_STORE);

      const contentData = {
        id: contentId,
        url: url,
        type: type,
        content: content,
        timestamp: Date.now()
      };

      const request = objectStore.put(contentData);

      request.onsuccess = () => {
        console.log(`Content stored: ${contentId}`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error storing content:', request.error);
        reject(request.error);
      };
    });
  }

  // Retrieve content from offline storage
  async getContent(contentId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CONTENT_STORE], 'readonly');
      const objectStore = transaction.objectStore(this.CONTENT_STORE);

      const request = objectStore.get(contentId);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Content retrieved: ${contentId}`);
          resolve(request.result);
        } else {
          console.log(`Content not found: ${contentId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Error retrieving content:', request.error);
        reject(request.error);
      };
    });
  }

  // Store user progress
  async storeProgress(userId, chapterId, progressData) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.PROGRESS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(this.PROGRESS_STORE);

      const progressRecord = {
        id: `${userId}-${chapterId}-${Date.now()}`,
        userId: userId,
        chapterId: chapterId,
        data: progressData,
        timestamp: Date.now()
      };

      const request = objectStore.put(progressRecord);

      request.onsuccess = () => {
        console.log(`Progress stored for user ${userId}, chapter ${chapterId}`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error storing progress:', request.error);
        reject(request.error);
      };
    });
  }

  // Retrieve user progress
  async getProgress(userId, chapterId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.PROGRESS_STORE], 'readonly');
      const objectStore = transaction.objectStore(this.PROGRESS_STORE);

      // Create a compound key query if needed
      const index = objectStore.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        const results = request.result.filter(record => record.chapterId === chapterId);
        if (results.length > 0) {
          // Return the most recent progress record
          const latest = results.reduce((prev, current) =>
            (prev.timestamp > current.timestamp) ? prev : current
          );
          resolve(latest.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Error retrieving progress:', request.error);
        reject(request.error);
      };
    });
  }

  // Store bookmarks
  async storeBookmark(userId, bookmarkData) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.BOOKMARKS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(this.BOOKMARKS_STORE);

      const bookmarkRecord = {
        id: `${userId}-${Date.now()}`,
        userId: userId,
        ...bookmarkData,
        timestamp: Date.now()
      };

      const request = objectStore.put(bookmarkRecord);

      request.onsuccess = () => {
        console.log(`Bookmark stored for user ${userId}`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error storing bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  // Get user bookmarks
  async getBookmarks(userId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.BOOKMARKS_STORE], 'readonly');
      const objectStore = transaction.objectStore(this.BOOKMARKS_STORE);

      const index = objectStore.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error retrieving bookmarks:', request.error);
        reject(request.error);
      };
    });
  }

  // Sync data with server when online
  async syncWithServer() {
    if (!navigator.onLine) {
      console.log('Offline - skipping sync');
      return;
    }

    try {
      // Get pending data to sync
      const pendingData = JSON.parse(localStorage.getItem('pendingSyncData') || '[]');

      for (const item of pendingData) {
        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(item.data)
          });

          if (response.ok) {
            // Remove successfully synced item
            const updatedPending = pendingData.filter(p => p.id !== item.id);
            localStorage.setItem('pendingSyncData', JSON.stringify(updatedPending));
            console.log('Synced item:', item.id);
          } else {
            console.error('Failed to sync item:', item.id);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  // Pre-cache essential content
  async preCacheEssentialContent() {
    const essentialUrls = [
      '/',
      '/docs/',
      '/docs/chapter-1/',
      '/docs/chapter-1/index',
      '/docs/chapter-1/key-concepts',
      '/docs/chapter-1/examples',
      '/docs/chapter-1/exercises',
      '/css/custom.css',
      '/js/main.js'
    ];

    for (const url of essentialUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const content = await response.text();
          await this.storeContent(`url-${btoa(url)}`, content, url, 'page');
        }
      } catch (error) {
        console.error(`Failed to cache ${url}:`, error);
      }
    }
  }

  // Check if content is cached
  async isContentCached(contentId) {
    const content = await this.getContent(contentId);
    return content !== null;
  }

  // Clear old cache entries
  async clearOldCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days in milliseconds
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CONTENT_STORE], 'readwrite');
      const objectStore = transaction.objectStore(this.CONTENT_STORE);

      const request = objectStore.getAll();

      request.onsuccess = () => {
        const now = Date.now();
        const expiredItems = request.result.filter(item =>
          now - item.timestamp > maxAge
        );

        const deletePromises = expiredItems.map(item => {
          return new Promise((res, rej) => {
            const delReq = objectStore.delete(item.id);
            delReq.onsuccess = () => res();
            delReq.onerror = () => rej(delReq.error);
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            console.log(`Cleared ${expiredItems.length} expired cache entries`);
            resolve(expiredItems.length);
          })
          .catch(reject);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Singleton instance
const offlineCache = new OfflineCache();

// Export the class and instance
export { OfflineCache, offlineCache };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await offlineCache.init();
      console.log('Offline cache initialized');
    } catch (error) {
      console.error('Failed to initialize offline cache:', error);
    }
  });
}