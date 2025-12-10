import React, { useState, useEffect } from 'react';

// Progress tracker component for client-side progress tracking
const ProgressTracker = ({ userId, chapterId, sectionId, onProgressUpdate }) => {
  const [progress, setProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Check if user is authenticated by looking for token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  // Load progress from localStorage when component mounts
  useEffect(() => {
    const savedProgress = loadProgress();
    if (savedProgress) {
      setProgress(savedProgress);
    }
  }, [chapterId, sectionId]);

  // Load progress from localStorage
  const loadProgress = () => {
    if (!userId || !chapterId) return 0;

    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return 0;

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};
      const chapterProgress = userProgress[chapterId] || {};
      return chapterProgress.progress || 0;
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
      return 0;
    }
  };

  // Save progress to localStorage
  const saveProgress = (newProgress, newSectionId = null) => {
    if (!userId || !chapterId) return;

    let allProgress = {};
    const progressData = localStorage.getItem('userProgress');
    if (progressData) {
      try {
        allProgress = JSON.parse(progressData);
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    }

    // Initialize user data if it doesn't exist
    if (!allProgress[userId]) {
      allProgress[userId] = {};
    }

    // Initialize chapter data if it doesn't exist
    if (!allProgress[userId][chapterId]) {
      allProgress[userId][chapterId] = {
        progress: 0,
        sections: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Update progress
    allProgress[userId][chapterId].progress = newProgress;
    allProgress[userId][chapterId].lastUpdated = new Date().toISOString();

    // Update section progress if sectionId is provided
    const effectiveSectionId = newSectionId || sectionId;
    if (effectiveSectionId) {
      allProgress[userId][chapterId].sections[effectiveSectionId] = {
        completed: newProgress >= 100,
        lastAccessed: new Date().toISOString()
      };
    }

    try {
      localStorage.setItem('userProgress', JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  };

  // Update progress
  const updateProgress = (newProgress, newSectionId = null) => {
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    setProgress(newProgress);
    saveProgress(newProgress, newSectionId);

    // Call the callback if provided
    if (onProgressUpdate) {
      onProgressUpdate({
        userId,
        chapterId,
        sectionId: newSectionId || sectionId,
        progress: newProgress,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Mark section as completed
  const markSectionComplete = (sectionIdOverride = null) => {
    const targetSectionId = sectionIdOverride || sectionId;
    updateProgress(100, targetSectionId);
  };

  // Mark section as in-progress
  const markSectionInProgress = (sectionIdOverride = null) => {
    const targetSectionId = sectionIdOverride || sectionId;
    updateProgress(Math.min(progress + 25, 99), targetSectionId); // Don't mark as 100% unless explicitly completed
  };

  // Mark specific section as completed (for when user completes a section)
  const markSpecificSectionComplete = (sectionId) => {
    // Calculate new progress based on completed sections
    const newProgress = calculateProgressForSection(sectionId);
    updateProgress(newProgress, sectionId);
  };

  // Calculate progress based on completed sections
  const calculateProgressForSection = (completedSectionId) => {
    // In a real implementation, we would calculate based on the total number of sections
    // For now, we'll just increment progress by a fixed amount per section
    // This would need to be more sophisticated based on the actual chapter structure

    // For this example, let's assume each section contributes equally to the chapter
    // We'll need to know how many sections are in the chapter
    const sectionsInChapter = getSectionsInChapter(chapterId);
    const completedSections = getCompletedSections(chapterId, completedSectionId);

    const calculatedProgress = Math.min(
      Math.round((completedSections / sectionsInChapter) * 100),
      100
    );

    return calculatedProgress;
  };

  // Helper function to get sections in a chapter (would come from content metadata)
  const getSectionsInChapter = (chapterId) => {
    // This would normally come from content metadata
    // For now, we'll return a default value
    const defaultSections = {
      'chapter-1': 5, // index, key-concepts, examples, exercises, references
      'chapter-2': 5,
      'chapter-3': 5,
      'chapter-4': 5,
      'chapter-5': 5,
      'chapter-6': 5
    };
    return defaultSections[chapterId] || 5;
  };

  // Helper function to get completed sections
  const getCompletedSections = (chapterId, newlyCompletedSectionId = null) => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return newlyCompletedSectionId ? 1 : 0;

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};
      const chapterProgress = userProgress[chapterId] || {};
      const sections = chapterProgress.sections || {};

      // Count already completed sections
      let count = Object.keys(sections).filter(id => sections[id].completed).length;

      // Add the newly completed section if it's not already counted
      if (newlyCompletedSectionId && !sections[newlyCompletedSectionId]?.completed) {
        count++;
      }

      return count;
    } catch (error) {
      console.error('Error counting completed sections:', error);
      return newlyCompletedSectionId ? 1 : 0;
    }
  };

  // Get progress summary for all chapters
  const getProgressSummary = () => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return { totalChapters: 0, completedChapters: 0, overallProgress: 0 };

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};

      const chapters = Object.keys(userProgress);
      const totalChapters = chapters.length;
      const completedChapters = chapters.filter(chapterId => {
        return userProgress[chapterId].progress === 100;
      }).length;

      const overallProgress = totalChapters > 0
        ? Math.round(chapters.reduce((sum, id) => sum + userProgress[id].progress, 0) / totalChapters)
        : 0;

      return {
        totalChapters,
        completedChapters,
        overallProgress,
        chapters: chapters.map(id => ({
          id,
          progress: userProgress[id].progress,
          lastUpdated: userProgress[id].lastUpdated
        }))
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return { totalChapters: 0, completedChapters: 0, overallProgress: 0 };
    }
  };

  // Reset progress for a specific chapter
  const resetChapterProgress = (chapterIdToReset) => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);
      if (!allProgress[userId]) return;

      // Remove the specific chapter's progress
      delete allProgress[userId][chapterIdToReset];

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // If resetting the current chapter, update local state
      if (chapterIdToReset === chapterId) {
        setProgress(0);
      }
    } catch (error) {
      console.error('Error resetting chapter progress:', error);
    }
  };

  // Reset all progress for the user
  const resetAllProgress = () => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);

      // Remove all progress for this user
      delete allProgress[userId];

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // Reset local state
      setProgress(0);
    } catch (error) {
      console.error('Error resetting all progress:', error);
    }
  };

  // Clear progress for a specific section
  const clearSectionProgress = (sectionIdToClear) => {
    if (!sectionIdToClear) return;

    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);
      if (!allProgress[userId] || !allProgress[userId][chapterId]) return;

      const chapterProgress = allProgress[userId][chapterId];

      // Remove the specific section from the sections tracking
      if (chapterProgress.sections && chapterProgress.sections[sectionIdToClear]) {
        delete chapterProgress.sections[sectionIdToClear];
      }

      // Recalculate progress based on remaining sections
      const sections = chapterProgress.sections || {};
      const completedSections = Object.keys(sections).filter(id => sections[id].completed).length;
      const totalSections = getSectionsInChapter(chapterId);

      chapterProgress.progress = Math.min(
        Math.round((completedSections / totalSections) * 100),
        100
      );

      // Update status based on new progress
      if (chapterProgress.progress === 100) {
        chapterProgress.completion_status = 'completed';
      } else if (chapterProgress.progress > 0) {
        chapterProgress.completion_status = 'in_progress';
      } else {
        chapterProgress.completion_status = 'not_started';
      }

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // Update local state
      setProgress(chapterProgress.progress);
    } catch (error) {
      console.error('Error clearing section progress:', error);
    }
  };

  // Export progress data for the user
  const exportProgress = (format = 'json') => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) {
      console.warn('No progress data to export');
      return null;
    }

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};

      // Create export data with metadata
      const exportData = {
        userId,
        exportTimestamp: new Date().toISOString(),
        exportFormat: format,
        progress: userProgress,
        summary: getProgressSummary()
      };

      if (format === 'json') {
        // Return as JSON string
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        return convertToCSV(exportData);
      } else {
        throw new Error('Unsupported export format. Use "json" or "csv".');
      }
    } catch (error) {
      console.error('Error exporting progress:', error);
      return null;
    }
  };

  // Helper function to convert progress data to CSV
  const convertToCSV = (exportData) => {
    const { progress } = exportData;

    // Prepare CSV header
    let csv = 'Chapter ID,Progress (%),Status,Last Updated,Completed At\n';

    // Add rows for each chapter
    Object.entries(progress).forEach(([chapterId, chapterData]) => {
      csv += `"${chapterId}",${chapterData.progress},"${chapterData.completion_status}","${chapterData.lastUpdated || ''}","${chapterData.completed_at || ''}"\n`;
    });

    return csv;
  };

  // Download progress data as a file
  const downloadProgress = (filename = 'progress-export', format = 'json') => {
    const data = exportProgress(format);
    if (!data) return;

    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show notification to the user
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Check for milestones and achievements
  const checkMilestones = (newProgress, chapterId) => {
    const milestones = [
      { progress: 25, message: "Quarter way through! Great progress on this chapter!" },
      { progress: 50, message: "Halfway there! You're doing an excellent job!" },
      { progress: 75, message: "Almost there! Keep up the good work!" },
      { progress: 100, message: "Chapter completed! Congratulations on finishing this chapter!" }
    ];

    const completedMilestones = milestones.filter(m =>
      newProgress >= m.progress && progress < m.progress
    );

    completedMilestones.forEach(milestone => {
      showNotification(milestone.message, 'success');
    });

    // Check for overall progress milestones
    if (chapterId) {
      const summary = getProgressSummary();
      const overallMilestones = [
        { progress: 25, message: "You've completed 25% of the textbook! Excellent start!" },
        { progress: 50, message: "You're halfway through the textbook! Keep going!" },
        { progress: 75, message: "You're almost done with the textbook! Amazing progress!" },
        { progress: 100, message: "You've completed the entire textbook! Congratulations!" }
      ];

      const completedOverallMilestones = overallMilestones.filter(m =>
        summary.overallProgress >= m.progress &&
        (getPreviousOverallProgress() < m.progress || getPreviousOverallProgress() === undefined)
      );

      completedOverallMilestones.forEach(milestone => {
        showNotification(milestone.message, 'success');
      });
    }
  };

  // Helper function to get previous overall progress
  const getPreviousOverallProgress = () => {
    // In a real implementation, we would store the previous overall progress
    // For now, we'll return a default value
    const progressData = localStorage.getItem('overallProgressHistory');
    if (progressData) {
      try {
        const history = JSON.parse(progressData);
        return history.previousOverallProgress || 0;
      } catch (error) {
        console.error('Error getting previous overall progress:', error);
        return 0;
      }
    }
    return 0;
  };

  // Update progress with milestone checking
  const updateProgressWithMilestones = (newProgress, newSectionId = null) => {
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    // Check for milestones before updating progress
    checkMilestones(newProgress, chapterId);

    setProgress(newProgress);
    saveProgress(newProgress, newSectionId);

    // Call the callback if provided
    if (onProgressUpdate) {
      onProgressUpdate({
        userId,
        chapterId,
        sectionId: newSectionId || sectionId,
        progress: newProgress,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    progress,
    updateProgress,
    updateProgressWithMilestones,
    markSectionComplete,
    markSectionInProgress,
    markSpecificSectionComplete,
    getProgressSummary,
    resetChapterProgress,
    resetAllProgress,
    clearSectionProgress,
    exportProgress,
    downloadProgress,
    showNotification,
    notifications,
    isAuthenticated
  };
};

// React hook version of the progress tracker
export const useProgressTracker = (userId, chapterId, sectionId, onProgressUpdate) => {
  const [progress, setProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  // Load progress from localStorage when component mounts
  useEffect(() => {
    const savedProgress = loadProgress();
    if (savedProgress !== null) {
      setProgress(savedProgress);
    }
  }, [chapterId, sectionId]);

  const loadProgress = () => {
    if (!userId || !chapterId) return null;

    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return null;

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};
      const chapterProgress = userProgress[chapterId] || {};
      return chapterProgress.progress || 0;
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
      return null;
    }
  };

  const saveProgress = (newProgress, newSectionId = null) => {
    if (!userId || !chapterId) return;

    let allProgress = {};
    const progressData = localStorage.getItem('userProgress');
    if (progressData) {
      try {
        allProgress = JSON.parse(progressData);
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    }

    // Initialize user data if it doesn't exist
    if (!allProgress[userId]) {
      allProgress[userId] = {};
    }

    // Initialize chapter data if it doesn't exist
    if (!allProgress[userId][chapterId]) {
      allProgress[userId][chapterId] = {
        progress: 0,
        sections: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Update progress
    allProgress[userId][chapterId].progress = newProgress;
    allProgress[userId][chapterId].lastUpdated = new Date().toISOString();

    // Update section progress if sectionId is provided
    const effectiveSectionId = newSectionId || sectionId;
    if (effectiveSectionId) {
      allProgress[userId][chapterId].sections[effectiveSectionId] = {
        completed: newProgress >= 100,
        lastAccessed: new Date().toISOString()
      };
    }

    try {
      localStorage.setItem('userProgress', JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  };

  const updateProgress = (newProgress, newSectionId = null) => {
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    setProgress(newProgress);
    saveProgress(newProgress, newSectionId);

    // Call the callback if provided
    if (onProgressUpdate) {
      onProgressUpdate({
        userId,
        chapterId,
        sectionId: newSectionId || sectionId,
        progress: newProgress,
        timestamp: new Date().toISOString()
      });
    }
  };

  const markSectionComplete = (sectionIdOverride = null) => {
    const targetSectionId = sectionIdOverride || sectionId;
    updateProgress(100, targetSectionId);
  };

  const markSectionInProgress = (sectionIdOverride = null) => {
    const targetSectionId = sectionIdOverride || sectionId;
    updateProgress(Math.min(progress + 25, 99), targetSectionId); // Don't mark as 100% unless explicitly completed
  };

  // Mark specific section as completed (for when user completes a section)
  const markSpecificSectionComplete = (sectionId) => {
    // Calculate new progress based on completed sections
    const newProgress = calculateProgressForSection(sectionId);
    updateProgress(newProgress, sectionId);
  };

  // Calculate progress based on completed sections
  const calculateProgressForSection = (completedSectionId) => {
    // In a real implementation, we would calculate based on the total number of sections
    // For now, we'll just increment progress by a fixed amount per section
    // This would need to be more sophisticated based on the actual chapter structure

    // For this example, let's assume each section contributes equally to the chapter
    // We'll need to know how many sections are in the chapter
    const sectionsInChapter = getSectionsInChapter(chapterId);
    const completedSections = getCompletedSections(chapterId, completedSectionId);

    const calculatedProgress = Math.min(
      Math.round((completedSections / sectionsInChapter) * 100),
      100
    );

    return calculatedProgress;
  };

  // Helper function to get sections in a chapter (would come from content metadata)
  const getSectionsInChapter = (chapterId) => {
    // This would normally come from content metadata
    // For now, we'll return a default value
    const defaultSections = {
      'chapter-1': 5, // index, key-concepts, examples, exercises, references
      'chapter-2': 5,
      'chapter-3': 5,
      'chapter-4': 5,
      'chapter-5': 5,
      'chapter-6': 5
    };
    return defaultSections[chapterId] || 5;
  };

  // Helper function to get completed sections
  const getCompletedSections = (chapterId, newlyCompletedSectionId = null) => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return newlyCompletedSectionId ? 1 : 0;

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};
      const chapterProgress = userProgress[chapterId] || {};
      const sections = chapterProgress.sections || {};

      // Count already completed sections
      let count = Object.keys(sections).filter(id => sections[id].completed).length;

      // Add the newly completed section if it's not already counted
      if (newlyCompletedSectionId && !sections[newlyCompletedSectionId]?.completed) {
        count++;
      }

      return count;
    } catch (error) {
      console.error('Error counting completed sections:', error);
      return newlyCompletedSectionId ? 1 : 0;
    }
  };

  const getProgressSummary = () => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return { totalChapters: 0, completedChapters: 0, overallProgress: 0 };

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};

      const chapters = Object.keys(userProgress);
      const totalChapters = chapters.length;
      const completedChapters = chapters.filter(chapterId => {
        return userProgress[chapterId].progress === 100;
      }).length;

      const overallProgress = totalChapters > 0
        ? Math.round(chapters.reduce((sum, id) => sum + userProgress[id].progress, 0) / totalChapters)
        : 0;

      return {
        totalChapters,
        completedChapters,
        overallProgress,
        chapters: chapters.map(id => ({
          id,
          progress: userProgress[id].progress,
          lastUpdated: userProgress[id].lastUpdated
        }))
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return { totalChapters: 0, completedChapters: 0, overallProgress: 0 };
    }
  };

  // Reset progress for a specific chapter
  const resetChapterProgress = (chapterIdToReset) => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);
      if (!allProgress[userId]) return;

      // Remove the specific chapter's progress
      delete allProgress[userId][chapterIdToReset];

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // If resetting the current chapter, update local state
      if (chapterIdToReset === chapterId) {
        setProgress(0);
      }
    } catch (error) {
      console.error('Error resetting chapter progress:', error);
    }
  };

  // Reset all progress for the user
  const resetAllProgress = () => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);

      // Remove all progress for this user
      delete allProgress[userId];

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // Reset local state
      setProgress(0);
    } catch (error) {
      console.error('Error resetting all progress:', error);
    }
  };

  // Clear progress for a specific section
  const clearSectionProgress = (sectionIdToClear) => {
    if (!sectionIdToClear) return;

    const progressData = localStorage.getItem('userProgress');
    if (!progressData) return;

    try {
      const allProgress = JSON.parse(progressData);
      if (!allProgress[userId] || !allProgress[userId][chapterId]) return;

      const chapterProgress = allProgress[userId][chapterId];

      // Remove the specific section from the sections tracking
      if (chapterProgress.sections && chapterProgress.sections[sectionIdToClear]) {
        delete chapterProgress.sections[sectionIdToClear];
      }

      // Recalculate progress based on remaining sections
      const sections = chapterProgress.sections || {};
      const completedSections = Object.keys(sections).filter(id => sections[id].completed).length;
      const totalSections = getSectionsInChapter(chapterId);

      chapterProgress.progress = Math.min(
        Math.round((completedSections / totalSections) * 100),
        100
      );

      // Update status based on new progress
      if (chapterProgress.progress === 100) {
        chapterProgress.completion_status = 'completed';
      } else if (chapterProgress.progress > 0) {
        chapterProgress.completion_status = 'in_progress';
      } else {
        chapterProgress.completion_status = 'not_started';
      }

      localStorage.setItem('userProgress', JSON.stringify(allProgress));

      // Update local state
      setProgress(chapterProgress.progress);
    } catch (error) {
      console.error('Error clearing section progress:', error);
    }
  };

  // Export progress data for the user
  const exportProgress = (format = 'json') => {
    const progressData = localStorage.getItem('userProgress');
    if (!progressData) {
      console.warn('No progress data to export');
      return null;
    }

    try {
      const allProgress = JSON.parse(progressData);
      const userProgress = allProgress[userId] || {};

      // Create export data with metadata
      const exportData = {
        userId,
        exportTimestamp: new Date().toISOString(),
        exportFormat: format,
        progress: userProgress,
        summary: getProgressSummary()
      };

      if (format === 'json') {
        // Return as JSON string
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        return convertToCSV(exportData);
      } else {
        throw new Error('Unsupported export format. Use "json" or "csv".');
      }
    } catch (error) {
      console.error('Error exporting progress:', error);
      return null;
    }
  };

  // Helper function to convert progress data to CSV
  const convertToCSV = (exportData) => {
    const { progress } = exportData;

    // Prepare CSV header
    let csv = 'Chapter ID,Progress (%),Status,Last Updated,Completed At\n';

    // Add rows for each chapter
    Object.entries(progress).forEach(([chapterId, chapterData]) => {
      csv += `"${chapterId}",${chapterData.progress},"${chapterData.completion_status}","${chapterData.lastUpdated || ''}","${chapterData.completed_at || ''}"\n`;
    });

    return csv;
  };

  // Download progress data as a file
  const downloadProgress = (filename = 'progress-export', format = 'json') => {
    const data = exportProgress(format);
    if (!data) return;

    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show notification to the user
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Check for milestones and achievements
  const checkMilestones = (newProgress, chapterId) => {
    const milestones = [
      { progress: 25, message: "Quarter way through! Great progress on this chapter!" },
      { progress: 50, message: "Halfway there! You're doing an excellent job!" },
      { progress: 75, message: "Almost there! Keep up the good work!" },
      { progress: 100, message: "Chapter completed! Congratulations on finishing this chapter!" }
    ];

    const completedMilestones = milestones.filter(m =>
      newProgress >= m.progress && progress < m.progress
    );

    completedMilestones.forEach(milestone => {
      showNotification(milestone.message, 'success');
    });

    // Check for overall progress milestones
    if (chapterId) {
      const summary = getProgressSummary();
      const overallMilestones = [
        { progress: 25, message: "You've completed 25% of the textbook! Excellent start!" },
        { progress: 50, message: "You're halfway through the textbook! Keep going!" },
        { progress: 75, message: "You're almost done with the textbook! Amazing progress!" },
        { progress: 100, message: "You've completed the entire textbook! Congratulations!" }
      ];

      const completedOverallMilestones = overallMilestones.filter(m =>
        summary.overallProgress >= m.progress &&
        (getPreviousOverallProgress() < m.progress || getPreviousOverallProgress() === undefined)
      );

      completedOverallMilestones.forEach(milestone => {
        showNotification(milestone.message, 'success');
      });
    }
  };

  // Helper function to get previous overall progress
  const getPreviousOverallProgress = () => {
    // In a real implementation, we would store the previous overall progress
    // For now, we'll return a default value
    const progressData = localStorage.getItem('overallProgressHistory');
    if (progressData) {
      try {
        const history = JSON.parse(progressData);
        return history.previousOverallProgress || 0;
      } catch (error) {
        console.error('Error getting previous overall progress:', error);
        return 0;
      }
    }
    return 0;
  };

  // Update progress with milestone checking
  const updateProgressWithMilestones = (newProgress, newSectionId = null) => {
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    // Check for milestones before updating progress
    checkMilestones(newProgress, chapterId);

    setProgress(newProgress);
    saveProgress(newProgress, newSectionId);

    // Call the callback if provided
    if (onProgressUpdate) {
      onProgressUpdate({
        userId,
        chapterId,
        sectionId: newSectionId || sectionId,
        progress: newProgress,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    progress,
    updateProgress,
    updateProgressWithMilestones,
    markSectionComplete,
    markSectionInProgress,
    markSpecificSectionComplete,
    getProgressSummary,
    resetChapterProgress,
    resetAllProgress,
    clearSectionProgress,
    exportProgress,
    downloadProgress,
    showNotification,
    notifications,
    isAuthenticated
  };
};

// Progress display component
export const ProgressDisplay = ({ progress, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`relative ${sizeClass} flex items-center justify-center rounded-full border-4 border-gray-200`}>
      <div
        className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent"
        style={{
          clipPath: `polygon(0 0, 0 0, 0 0, 0 0, ${progress > 0 ? '0 0, ' : ''}${progress > 25 ? '100% 0%, ' : ''}${progress > 50 ? '100% 100%, ' : ''}${progress > 75 ? '0 100%, ' : ''}0 100%, 0 0)`,
          borderColor: '#2e8555',
          clipPath: `path("M 50,50 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0")`,
          background: `conic-gradient(#2e8555 ${progress}%, #e5e7eb ${progress}%)`,
        }}
      />
      <span className="relative z-10 font-bold text-gray-700">
        {progress}%
      </span>
    </div>
  );
};

export default useProgressTracker;