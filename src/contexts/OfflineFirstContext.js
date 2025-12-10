import React, { createContext, useContext, useEffect, useState } from 'react';
import { offlineFirstService } from '../services/OfflineFirstService';

// Create the OfflineFirst context
const OfflineFirstContext = createContext();

// Provider component
export const OfflineFirstProvider = ({ children }) => {
  const [offlineStatus, setOfflineStatus] = useState({
    isOnline: navigator.onLine,
    hasPendingSync: false,
    pendingSyncCount: 0
  });

  const [syncProgress, setSyncProgress] = useState({
    isSyncing: false,
    completed: 0,
    total: 0
  });

  useEffect(() => {
    // Update offline status
    const updateStatus = () => {
      const status = offlineFirstService.getOfflineStatus();
      setOfflineStatus(status);
    };

    // Initial status
    updateStatus();

    // Add event listeners
    offlineFirstService.addEventListener('online', updateStatus);
    offlineFirstService.addEventListener('offline', updateStatus);
    offlineFirstService.addEventListener('sync-success', updateStatus);
    offlineFirstService.addEventListener('sync-failed', updateStatus);

    // Listen for service changes
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => {
      // Clean up event listeners
      offlineFirstService.removeEventListener('online', updateStatus);
      offlineFirstService.removeEventListener('offline', updateStatus);
      offlineFirstService.removeEventListener('sync-success', updateStatus);
      offlineFirstService.removeEventListener('sync-failed', updateStatus);

      clearInterval(interval);
    };
  }, []);

  // Function to perform offline-first request
  const makeRequest = async (url, options = {}) => {
    try {
      return await offlineFirstService.makeRequest(url, options);
    } catch (error) {
      console.error('Offline-first request failed:', error);
      throw error;
    }
  };

  // Function to force sync
  const forceSync = async () => {
    setSyncProgress({ isSyncing: true, completed: 0, total: offlineStatus.pendingSyncCount });

    try {
      await offlineFirstService.forceSync();
    } finally {
      setSyncProgress({ isSyncing: false, completed: 0, total: 0 });
    }
  };

  // Value to provide through context
  const value = {
    offlineStatus,
    syncProgress,
    makeRequest,
    forceSync,
    isOnline: offlineStatus.isOnline,
    hasPendingSync: offlineStatus.hasPendingSync,
    pendingSyncCount: offlineStatus.pendingSyncCount
  };

  return (
    <OfflineFirstContext.Provider value={value}>
      {children}
    </OfflineFirstContext.Provider>
  );
};

// Custom hook to use the offline-first context
export const useOfflineFirst = () => {
  const context = useContext(OfflineFirstContext);
  if (!context) {
    throw new Error('useOfflineFirst must be used within an OfflineFirstProvider');
  }
  return context;
};

// Higher-order component to wrap components that need offline-first functionality
export const withOfflineFirst = (Component) => {
  return (props) => (
    <OfflineFirstProvider>
      <Component {...props} />
    </OfflineFirstProvider>
  );
};

export default OfflineFirstContext;