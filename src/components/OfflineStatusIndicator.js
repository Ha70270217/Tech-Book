import React from 'react';
import { useOfflineFirst } from '../contexts/OfflineFirstContext';

// Component to display offline status and sync information
const OfflineStatusIndicator = () => {
  const { offlineStatus, syncProgress, forceSync } = useOfflineFirst();

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Offline Status</h3>
      </div>

      <div className="flex items-center space-x-3 mb-3">
        <div className={`flex items-center ${offlineStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${offlineStatus.isOnline ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <span className="text-sm">{offlineStatus.isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {offlineStatus.hasPendingSync && (
          <div className="flex items-center text-yellow-600">
            <div className="w-3 h-3 rounded-full mr-2 bg-yellow-600 animate-pulse"></div>
            <span className="text-sm">{offlineStatus.pendingSyncCount} pending</span>
          </div>
        )}

        {syncProgress.isSyncing && (
          <div className="flex items-center text-blue-600">
            <div className="w-3 h-3 rounded-full mr-2 bg-blue-600 animate-spin"></div>
            <span className="text-sm">Syncing...</span>
          </div>
        )}
      </div>

      {offlineStatus.hasPendingSync && (
        <button
          onClick={forceSync}
          disabled={syncProgress.isSyncing}
          className={`w-full px-3 py-1 rounded text-sm ${
            syncProgress.isSyncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {syncProgress.isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}

      <div className="mt-2 text-xs text-gray-600">
        {offlineStatus.isOnline
          ? 'Connected to server'
          : 'Operating in offline mode'}
      </div>
    </div>
  );
};

export default OfflineStatusIndicator;