// Progress synchronization utility for syncing client-side progress with server
class ProgressSync {
  constructor(apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.syncInterval = 30000; // Sync every 30 seconds
    this.syncQueue = [];
    this.isSyncing = false;
  }

  // Initialize progress sync
  init() {
    // Start periodic sync
    this.startPeriodicSync();

    // Initialize retry queue processing
    this.initRetryProcessing();

    // Sync when page is about to be unloaded
    window.addEventListener('beforeunload', () => {
      this.syncAll();
    });

    // Sync when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncAll();
      }
    });
  }

  // Start periodic synchronization
  startPeriodicSync() {
    setInterval(() => {
      this.syncAll();
    }, this.syncInterval);
  }

  // Sync all pending progress updates
  async syncAll() {
    if (this.isSyncing) return; // Prevent concurrent syncs

    this.isSyncing = true;

    try {
      // Get all pending progress updates from localStorage
      const pendingUpdates = this.getPendingUpdates();

      for (const update of pendingUpdates) {
        await this.syncProgress(update);
      }
    } catch (error) {
      console.error('Error during progress sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual progress update to server
  async syncProgress(progressData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // If not authenticated, keep the progress in localStorage
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/progress/chapter/${progressData.chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completion_percentage: progressData.progress,
          section_id: progressData.sectionId || null,
          status: this.getStatusFromProgress(progressData.progress)
        })
      });

      if (response.ok) {
        // Mark as synced in localStorage
        this.markAsSynced(progressData.id);
        // Remove from retry queue if it was there
        this.removeFromRetryQueue(progressData.id);
      } else {
        console.error('Failed to sync progress:', response.statusText);
        // Add to retry queue for later attempt
        this.addToRetryQueue(progressData);
      }
    } catch (error) {
      console.error('Error syncing progress:', error);
      // Add to retry queue for later attempt
      this.addToRetryQueue(progressData);
    }
  }

  // Add progress data to retry queue
  addToRetryQueue(progressData) {
    try {
      let retryQueue = JSON.parse(localStorage.getItem('progressRetryQueue') || '[]');

      // Check if this progress update is already in the queue
      const existingIndex = retryQueue.findIndex(item => item.id === progressData.id);
      if (existingIndex !== -1) {
        // Update the existing entry
        retryQueue[existingIndex] = {
          ...progressData,
          retryCount: retryQueue[existingIndex].retryCount + 1,
          lastRetry: new Date().toISOString()
        };
      } else {
        // Add new entry
        retryQueue.push({
          ...progressData,
          retryCount: 1,
          lastRetry: new Date().toISOString()
        });
      }

      // Limit the queue size to prevent it from growing indefinitely
      if (retryQueue.length > 100) {
        retryQueue = retryQueue.slice(-100); // Keep only the last 100 items
      }

      localStorage.setItem('progressRetryQueue', JSON.stringify(retryQueue));
    } catch (error) {
      console.error('Error adding to retry queue:', error);
    }
  }

  // Remove progress data from retry queue
  removeFromRetryQueue(progressId) {
    try {
      let retryQueue = JSON.parse(localStorage.getItem('progressRetryQueue') || '[]');
      retryQueue = retryQueue.filter(item => item.id !== progressId);
      localStorage.setItem('progressRetryQueue', JSON.stringify(retryQueue));
    } catch (error) {
      console.error('Error removing from retry queue:', error);
    }
  }

  // Process retry queue
  async processRetryQueue() {
    try {
      const retryQueue = JSON.parse(localStorage.getItem('progressRetryQueue') || '[]');

      for (const progressData of retryQueue) {
        // Limit retries to 5 attempts
        if (progressData.retryCount >= 5) {
          console.warn(`Max retries reached for progress ${progressData.id}, removing from queue`);
          this.removeFromRetryQueue(progressData.id);
          continue;
        }

        // Attempt to sync
        await this.syncProgress(progressData);

        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error processing retry queue:', error);
    }
  }

  // Initialize retry queue processing
  initRetryProcessing() {
    // Process retry queue when the app starts
    this.processRetryQueue();

    // Process retry queue periodically (every 5 minutes)
    setInterval(() => {
      this.processRetryQueue();
    }, 5 * 60 * 1000);
  }

  // Get pending updates from localStorage
  getPendingUpdates() {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return [];

    try {
      const allProgress = JSON.parse(progressData);
      const userId = localStorage.getItem('userId'); // Assuming user ID is stored

      if (!userId || !allProgress[userId]) return [];

      const userProgress = allProgress[userId];
      const updates = [];

      Object.keys(userProgress).forEach(chapterId => {
        const chapterProgress = userProgress[chapterId];
        updates.push({
          id: `${userId}_${chapterId}`,
          userId,
          chapterId,
          progress: chapterProgress.progress,
          sectionId: chapterProgress.lastSectionId || null,
          timestamp: chapterProgress.lastUpdated || new Date().toISOString()
        });
      });

      return updates;
    } catch (error) {
      console.error('Error getting pending updates:', error);
      return [];
    }
  }

  // Mark progress as synced
  markAsSynced(progressId) {
    // In our implementation, we'll just keep track of the sync status in localStorage
    // The progress data itself is updated when synced successfully
  }

  // Get progress from server
  async fetchProgress() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.progress;
      } else {
        console.error('Failed to fetch progress:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  }

  // Merge server progress with local progress
  mergeProgress(serverProgress, localProgress) {
    if (!serverProgress || !localProgress) {
      return serverProgress || localProgress;
    }

    // For each chapter, keep the higher progress value
    const merged = { ...localProgress };

    if (serverProgress && serverProgress.length) {
      serverProgress.forEach(serverChapter => {
        const chapterId = serverChapter.chapter_id;
        if (!merged[chapterId] || serverChapter.completion_percentage > merged[chapterId].progress) {
          merged[chapterId] = {
            progress: serverChapter.completion_percentage,
            lastUpdated: serverChapter.updated_at,
            lastSectionId: serverChapter.section_id
          };
        }
      });
    }

    return merged;
  }

  // Get status based on progress percentage
  getStatusFromProgress(progress) {
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in_progress';
    return 'not_started';
  }

  // Sync progress from server to client
  async syncFromServer() {
    const serverProgress = await this.fetchProgress();
    if (!serverProgress) return;

    const localProgress = this.getLocalProgress();
    const mergedProgress = this.mergeProgress(serverProgress, localProgress);

    // Update localStorage with merged progress
    this.saveLocalProgress(mergedProgress);
  }

  // Get local progress from localStorage
  getLocalProgress() {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return {};

    try {
      return JSON.parse(progressData);
    } catch (error) {
      console.error('Error parsing local progress:', error);
      return {};
    }
  }

  // Save progress to localStorage
  saveLocalProgress(progress) {
    try {
      localStorage.setItem('userProgress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }

  // Calculate overall progress
  calculateOverallProgress(progress) {
    if (!progress) return 0;

    const userId = localStorage.getItem('userId');
    if (!userId || !progress[userId]) return 0;

    const userProgress = progress[userId];
    const chapters = Object.keys(userProgress);

    if (chapters.length === 0) return 0;

    const totalProgress = chapters.reduce((sum, chapterId) => {
      return sum + userProgress[chapterId].progress;
    }, 0);

    return Math.round(totalProgress / chapters.length);
  }
}

// Initialize progress sync
const progressSync = new ProgressSync();
progressSync.init();

export default progressSync;