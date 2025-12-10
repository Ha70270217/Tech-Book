// Progress analytics and reporting utility
class ProgressAnalytics {
  constructor() {
    this.storageKey = 'progressAnalytics';
    this.eventQueue = [];
    this.isTracking = false;
  }

  // Initialize analytics tracking
  init() {
    this.isTracking = true;

    // Track page view when component loads
    this.trackEvent('page_view', {
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });

    // Track when user spends time on a page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - startTime;
      this.trackTimeSpent(timeSpent);
    });

    // Track visibility changes to calculate effective reading time
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User left the page
        const timeSpent = Date.now() - startTime;
        this.trackTimeSpent(timeSpent);
      } else {
        // User came back to the page
        startTime = Date.now();
      }
    });
  }

  // Track a custom event
  trackEvent(eventType, eventData = {}) {
    if (!this.isTracking) return;

    const event = {
      id: this.generateId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: {
        ...eventData,
        userAgent: navigator.userAgent,
        language: navigator.language,
        page: window.location.pathname,
        referrer: document.referrer
      }
    };

    this.eventQueue.push(event);
    this.saveEvents();
  }

  // Track time spent on a page/section
  trackTimeSpent(milliseconds) {
    if (!this.isTracking) return;

    const seconds = Math.round(milliseconds / 1000);
    if (seconds > 0) {
      this.trackEvent('time_spent', { seconds });
    }
  }

  // Track section completion
  trackSectionCompletion(sectionId, chapterId, timeToComplete) {
    this.trackEvent('section_completed', {
      sectionId,
      chapterId,
      timeToComplete: timeToComplete || 0
    });
  }

  // Track chapter completion
  trackChapterCompletion(chapterId, timeToComplete) {
    this.trackEvent('chapter_completed', {
      chapterId,
      timeToComplete: timeToComplete || 0
    });
  }

  // Track exercise interaction
  trackExerciseInteraction(exerciseId, type, response) {
    this.trackEvent('exercise_interaction', {
      exerciseId,
      type, // 'view', 'attempt', 'submit', 'correct', 'incorrect'
      response: response || null
    });
  }

  // Get analytics summary
  getAnalyticsSummary(userId) {
    const events = this.getStoredEvents();
    const progressData = this.getStoredProgress(userId);

    // Calculate various metrics
    const totalTimeSpent = events
      .filter(e => e.type === 'time_spent')
      .reduce((sum, e) => sum + (e.data.seconds || 0), 0);

    const sectionsCompleted = events
      .filter(e => e.type === 'section_completed')
      .length;

    const chaptersCompleted = events
      .filter(e => e.type === 'chapter_completed')
      .length;

    const exercisesAttempted = events
      .filter(e => e.type === 'exercise_interaction' && e.data.type === 'attempt')
      .length;

    const exercisesCorrect = events
      .filter(e => e.type === 'exercise_interaction' && e.data.type === 'correct')
      .length;

    const completionRate = progressData ? this.calculateCompletionRate(progressData) : 0;

    return {
      totalTimeSpent, // in seconds
      sectionsCompleted,
      chaptersCompleted,
      exercisesAttempted,
      exercisesCorrect,
      completionRate,
      accuracyRate: exercisesAttempted > 0 ? Math.round((exercisesCorrect / exercisesAttempted) * 100) : 0,
      eventsCount: events.length
    };
  }

  // Calculate completion rate from progress data
  calculateCompletionRate(progressData) {
    if (!progressData) return 0;

    const chapters = Object.keys(progressData);
    if (chapters.length === 0) return 0;

    const completedChapters = chapters.filter(chapterId => {
      return progressData[chapterId].progress === 100;
    }).length;

    return Math.round((completedChapters / chapters.length) * 100);
  }

  // Get detailed progress report
  getDetailedReport(userId) {
    const events = this.getStoredEvents();
    const progressData = this.getStoredProgress(userId);

    // Group events by type
    const eventsByType = {};
    events.forEach(event => {
      if (!eventsByType[event.type]) {
        eventsByType[event.type] = [];
      }
      eventsByType[event.type].push(event);
    });

    // Calculate time-based metrics
    const timeSpentEvents = eventsByType['time_spent'] || [];
    const totalTimeSpent = timeSpentEvents.reduce((sum, e) => sum + (e.data.seconds || 0), 0);

    // Calculate chapter-specific metrics
    const chapterEvents = {};
    events.forEach(event => {
      if (event.data.chapterId) {
        if (!chapterEvents[event.data.chapterId]) {
          chapterEvents[event.data.chapterId] = [];
        }
        chapterEvents[event.data.chapterId].push(event);
      }
    });

    // Calculate average time per chapter
    const chapterTimeAvg = {};
    Object.keys(chapterEvents).forEach(chapterId => {
      const chapterTimeEvents = chapterEvents[chapterId].filter(e => e.type === 'time_spent');
      const totalChapterTime = chapterTimeEvents.reduce((sum, e) => sum + (e.data.seconds || 0), 0);
      const timeCount = chapterTimeEvents.length;
      chapterTimeAvg[chapterId] = timeCount > 0 ? Math.round(totalChapterTime / timeCount) : 0;
    });

    return {
      summary: this.getAnalyticsSummary(userId),
      eventsByType,
      totalTimeSpent,
      chapterTimeAvg,
      chapterEvents,
      progressData
    };
  }

  // Save events to localStorage
  saveEvents() {
    try {
      // Keep only the last 1000 events to prevent storage from growing too large
      const eventsToSave = this.eventQueue.slice(-1000);
      localStorage.setItem(this.storageKey, JSON.stringify(eventsToSave));
    } catch (error) {
      console.error('Error saving analytics events:', error);
    }
  }

  // Get stored events
  getStoredEvents() {
    try {
      const eventsData = localStorage.getItem(this.storageKey);
      return eventsData ? JSON.parse(eventsData) : [];
    } catch (error) {
      console.error('Error loading analytics events:', error);
      return [];
    }
  }

  // Get stored progress for analytics
  getStoredProgress(userId) {
    try {
      const progressData = localStorage.getItem('userProgress');
      if (!progressData) return null;

      const allProgress = JSON.parse(progressData);
      return allProgress[userId] || null;
    } catch (error) {
      console.error('Error loading progress for analytics:', error);
      return null;
    }
  }

  // Generate unique ID for events
  generateId() {
    return 'event_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Export analytics data
  exportAnalytics(userId) {
    const report = this.getDetailedReport(userId);
    const exportData = {
      userId,
      exportTimestamp: new Date().toISOString(),
      report
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Reset analytics data (for testing or user request)
  resetAnalytics() {
    this.eventQueue = [];
    localStorage.removeItem(this.storageKey);
  }
}

// Initialize progress analytics
const progressAnalytics = new ProgressAnalytics();
progressAnalytics.init();

export default progressAnalytics;