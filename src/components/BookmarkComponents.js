import React, { useState, useEffect } from 'react';

// Bookmark context for managing bookmarks across the application
const BookmarkContext = React.createContext();

// Bookmark provider component
export const BookmarkProvider = ({ children, userId }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load bookmarks from localStorage or API
  useEffect(() => {
    if (userId) {
      loadBookmarks();
    }
  }, [userId]);

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use localStorage. In a real implementation, we would fetch from the API
      const bookmarkData = localStorage.getItem('userBookmarks');
      if (bookmarkData) {
        const allBookmarks = JSON.parse(bookmarkData);
        setBookmarks(allBookmarks[userId] || []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookmarks = (newBookmarks) => {
    try {
      let allBookmarks = {};
      const bookmarkData = localStorage.getItem('userBookmarks');
      if (bookmarkData) {
        allBookmarks = JSON.parse(bookmarkData);
      }

      allBookmarks[userId] = newBookmarks;
      localStorage.setItem('userBookmarks', JSON.stringify(allBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  // Add a new bookmark
  const addBookmark = async (chapterId, sectionId, url, title, notes = '') => {
    if (!userId) return false;

    const newBookmark = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      chapter_id: chapterId,
      section_id: sectionId,
      url,
      title,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(updatedBookmarks);

    // In a real implementation, we would also send to the API
    try {
      // const response = await fetch('/api/bookmarks', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   },
      //   body: JSON.stringify({
      //     chapter_id: chapterId,
      //     section_id: sectionId,
      //     url,
      //     title,
      //     notes
      //   })
      // });
    } catch (error) {
      console.error('Error adding bookmark to API:', error);
    }

    return true;
  };

  // Remove a bookmark
  const removeBookmark = async (bookmarkId) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    saveBookmarks(updatedBookmarks);

    // In a real implementation, we would also delete from the API
    try {
      // await fetch(`/api/bookmarks/${bookmarkId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   }
      // });
    } catch (error) {
      console.error('Error removing bookmark from API:', error);
    }

    return true;
  };

  // Update a bookmark
  const updateBookmark = async (bookmarkId, updates) => {
    const updatedBookmarks = bookmarks.map(b =>
      b.id === bookmarkId ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
    );
    saveBookmarks(updatedBookmarks);

    // In a real implementation, we would also update the API
    try {
      // await fetch(`/api/bookmarks/${bookmarkId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   },
      //   body: JSON.stringify(updates)
      // });
    } catch (error) {
      console.error('Error updating bookmark in API:', error);
    }

    return true;
  };

  // Check if a URL is bookmarked
  const isBookmarked = (url) => {
    return bookmarks.some(b => b.url === url);
  };

  // Get bookmarks for a specific chapter
  const getBookmarksForChapter = (chapterId) => {
    return bookmarks.filter(b => b.chapter_id === chapterId);
  };

  // Get all bookmarks
  const getAllBookmarks = () => {
    return bookmarks;
  };

  // Import bookmarks from JSON
  const importBookmarks = async (jsonData) => {
    try {
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const importedBookmarks = parsedData.bookmarks || [];

      // Add each imported bookmark
      for (const bookmark of importedBookmarks) {
        const newBookmark = {
          ...bookmark,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate new ID
        };

        // Avoid duplicates by checking if URL already exists
        const existingBookmark = bookmarks.find(b => b.url === bookmark.url);
        if (!existingBookmark) {
          await addBookmark(
            bookmark.chapter_id,
            bookmark.section_id,
            bookmark.url,
            bookmark.title,
            bookmark.notes
          );
        }
      }

      return { success: true, importedCount: importedBookmarks.length };
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      return { success: false, error: error.message };
    }
  };

  // Backup bookmarks to a file
  const backupBookmarks = (format = 'json') => {
    const backupData = {
      userId,
      backupTimestamp: new Date().toISOString(),
      bookmarks,
      reminders: JSON.parse(localStorage.getItem('bookmarkReminders') || '[]')
    };

    if (format === 'json') {
      return JSON.stringify(backupData, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Title,URL,Notes,Chapter ID,Section ID,Created At\n';
      bookmarks.forEach(bookmark => {
        csv += `"${bookmark.title.replace(/"/g, '""')}","${bookmark.url.replace(/"/g, '""')}","${bookmark.notes.replace(/"/g, '""')}","${bookmark.chapter_id}","${bookmark.section_id}","${bookmark.created_at}"\n`;
      });
      return csv;
    }
    return null;
  };

  // Download backup as a file
  const downloadBackup = (filename = 'bookmarks-backup', format = 'json') => {
    const data = backupBookmarks(format);
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

  // Restore bookmarks from backup data
  const restoreFromBackup = async (backupData) => {
    try {
      const parsedData = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;

      // Restore bookmarks
      if (parsedData.bookmarks && Array.isArray(parsedData.bookmarks)) {
        // Clear current bookmarks
        saveBookmarks([]);

        // Add each bookmark from backup
        for (const bookmark of parsedData.bookmarks) {
          await addBookmark(
            bookmark.chapter_id,
            bookmark.section_id,
            bookmark.url,
            bookmark.title,
            bookmark.notes
          );
        }
      }

      // Restore reminders if available
      if (parsedData.reminders && Array.isArray(parsedData.reminders)) {
        localStorage.setItem('bookmarkReminders', JSON.stringify(parsedData.reminders));
      }

      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  };

  // Sync bookmarks with server
  const syncBookmarks = async () => {
    if (!userId) return { success: false, error: 'User not authenticated' };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      // Get all bookmarks from server
      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const serverData = await response.json();
        const serverBookmarks = serverData.bookmarks || [];

        // Merge server bookmarks with local ones
        const localBookmarks = bookmarks;
        const mergedBookmarks = [...localBookmarks];

        serverBookmarks.forEach(serverBookmark => {
          const existsLocally = localBookmarks.some(localBookmark =>
            localBookmark.url === serverBookmark.url
          );

          if (!existsLocally) {
            // Add server bookmark to local if it doesn't exist
            mergedBookmarks.push({
              ...serverBookmark,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate new local ID
            });
          }
        });

        // Update local bookmarks with merged data
        saveBookmarks(mergedBookmarks);

        // Upload any local bookmarks that don't exist on server
        for (const localBookmark of localBookmarks) {
          const existsOnServer = serverBookmarks.some(serverBookmark =>
            serverBookmark.url === localBookmark.url
          );

          if (!existsOnServer) {
            await uploadBookmarkToServer(localBookmark);
          }
        }

        return { success: true, message: 'Bookmarks synced successfully' };
      } else {
        throw new Error('Failed to fetch server bookmarks');
      }
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      return { success: false, error: error.message };
    }
  };

  // Upload a single bookmark to server
  const uploadBookmarkToServer = async (bookmark) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chapter_id: bookmark.chapter_id,
          section_id: bookmark.section_id,
          url: bookmark.url,
          title: bookmark.title,
          notes: bookmark.notes
        })
      });
    } catch (error) {
      console.error('Error uploading bookmark to server:', error);
    }
  };

  const value = {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    isBookmarked,
    getBookmarksForChapter,
    getAllBookmarks,
    importBookmarks,
    backupBookmarks,
    downloadBackup,
    restoreFromBackup,
    syncBookmarks
  };

  return (
    <BookmarkReminderProvider>
      <BookmarkContext.Provider value={value}>
        {children}
      </BookmarkContext.Provider>
    </BookmarkReminderProvider>
  );
};

// Custom hook to use the bookmark context
export const useBookmarks = () => {
  const context = React.useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

// Bookmark button component
export const BookmarkButton = ({ chapterId, sectionId, url, title, className = '' }) => {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const [isCurrentlyBookmarked, setIsCurrentlyBookmarked] = useState(false);

  useEffect(() => {
    setIsCurrentlyBookmarked(isBookmarked(url));
  }, [url, isBookmarked]);

  const handleToggleBookmark = async () => {
    if (isCurrentlyBookmarked) {
      // Find the bookmark ID for this URL
      const bookmark = bookmarks.find(b => b.url === url);
      if (bookmark) {
        await removeBookmark(bookmark.id);
        setIsCurrentlyBookmarked(false);
      }
    } else {
      await addBookmark(chapterId, sectionId, url, title);
      setIsCurrentlyBookmarked(true);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isCurrentlyBookmarked
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
      title={isCurrentlyBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${isCurrentlyBookmarked ? 'text-red-500' : 'text-gray-500'}`}
        fill={isCurrentlyBookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{isCurrentlyBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
};

// Bookmark reminder context
const BookmarkReminderContext = React.createContext();

// Bookmark reminder provider component
export const BookmarkReminderProvider = ({ children }) => {
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load reminders from localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('bookmarkReminders');
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        setReminders(parsed);
      } catch (error) {
        console.error('Error loading bookmark reminders:', error);
      }
    }
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('bookmarkReminders', JSON.stringify(reminders));
  }, [reminders]);

  // Check for upcoming reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newReminders = reminders.filter(reminder => {
        const reminderTime = new Date(reminder.reminder_time);
        const timeDiff = reminderTime - now;
        return timeDiff <= 60000 && timeDiff >= -60000; // Within 1 minute of reminder time
      });

      newReminders.forEach(reminder => {
        showNotification(reminder.title, reminder.message);
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reminders]);

  const showNotification = (title, message) => {
    const notification = {
      id: Date.now() + Math.random(),
      title,
      message,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const addReminder = (bookmarkId, reminderTime, title, message) => {
    const newReminder = {
      id: Date.now() + Math.random(),
      bookmark_id: bookmarkId,
      reminder_time: reminderTime,
      title,
      message,
      created_at: new Date().toISOString()
    };

    setReminders(prev => [...prev, newReminder]);
    return newReminder;
  };

  const removeReminder = (reminderId) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getRemindersForBookmark = (bookmarkId) => {
    return reminders.filter(r => r.bookmark_id === bookmarkId);
  };

  const value = {
    reminders,
    notifications,
    addReminder,
    removeReminder,
    getRemindersForBookmark
  };

  return (
    <BookmarkReminderContext.Provider value={value}>
      {children}
    </BookmarkReminderContext.Provider>
  );
};

// Custom hook to use the bookmark reminder context
export const useBookmarkReminders = () => {
  const context = React.useContext(BookmarkReminderContext);
  if (!context) {
    throw new Error('useBookmarkReminders must be used within a BookmarkReminderProvider');
  }
  return context;
};

// Bookmark list item component
export const BookmarkItem = ({ bookmark, onEdit, onDelete, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(bookmark.notes);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const { addReminder, getRemindersForBookmark } = useBookmarkReminders();
  const bookmarkReminders = getRemindersForBookmark(bookmark.id);

  const handleSaveNotes = async () => {
    if (onEdit) {
      await onEdit(bookmark.id, { notes: editedNotes });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedNotes(bookmark.notes);
    setIsEditing(false);
  };

  // Copy shareable link to clipboard
  const copyShareLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/share/bookmark/${bookmark.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
      setShowShareOptions(false);
    } catch (err) {
      console.error('Failed to copy share link:', err);
      alert('Failed to copy share link');
    }
  };

  // Share via Web Share API (mobile)
  const shareBookmark = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookmark.title,
          text: `Check out this bookmark: ${bookmark.title}`,
          url: bookmark.url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copy link
      copyShareLink();
    }
  };

  // Set a reminder for this bookmark
  const setBookmarkReminder = () => {
    if (!reminderTime) {
      alert('Please select a reminder time');
      return;
    }

    const reminder = addReminder(
      bookmark.id,
      reminderTime,
      reminderTitle || `Reminder: ${bookmark.title}`,
      reminderMessage || `Time to review: ${bookmark.title}`
    );

    alert('Reminder set successfully!');
    setShowReminderOptions(false);
    setReminderTime('');
    setReminderTitle('');
    setReminderMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3 border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4
            className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
            onClick={() => onNavigate && onNavigate(bookmark.url)}
          >
            {bookmark.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{bookmark.url}</p>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1 text-sm"
                rows="3"
                placeholder="Add notes about this bookmark..."
              />
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {bookmark.notes && (
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {bookmark.notes}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Bookmarked on {new Date(bookmark.created_at).toLocaleDateString()}
              </p>

              {/* Show reminders for this bookmark */}
              {bookmarkReminders.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="font-medium text-yellow-800">Reminders:</p>
                  {bookmarkReminders.map(reminder => (
                    <p key={reminder.id} className="text-yellow-700">
                      {new Date(reminder.reminder_time).toLocaleString()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowReminderOptions(!showReminderOptions)}
            className="text-gray-500 hover:text-purple-500 p-1"
            title="Set reminder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="text-gray-500 hover:text-blue-500 p-1"
            title="Share bookmark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-500 hover:text-blue-500 p-1"
            title="Edit notes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete && onDelete(bookmark.id)}
            className="text-gray-500 hover:text-red-500 p-1"
            title="Delete bookmark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reminder options dropdown */}
      {showReminderOptions && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Reminder Time</label>
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reminder Title</label>
              <input
                type="text"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Reminder title"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reminder Message</label>
              <input
                type="text"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Reminder message"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={setBookmarkReminder}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              Set Reminder
            </button>
          </div>
        </div>
      )}

      {/* Share options dropdown */}
      {showShareOptions && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={shareBookmark}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Bookmark list component
export const BookmarkList = ({ userId, chapterId }) => {
  const { bookmarks, getBookmarksForChapter, removeBookmark, updateBookmark } = useBookmarks();
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = chapterId ? getBookmarksForChapter(chapterId) : bookmarks;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, chapterId, searchTerm]);

  const handleDelete = async (bookmarkId) => {
    await removeBookmark(bookmarkId);
  };

  const handleEdit = async (bookmarkId, updates) => {
    await updateBookmark(bookmarkId, updates);
  };

  const handleNavigate = (url) => {
    window.location.href = url;
  };

  // Export bookmarks to JSON
  const exportBookmarks = (format = 'json') => {
    const exportData = {
      userId,
      exportTimestamp: new Date().toISOString(),
      bookmarks: chapterId ? getBookmarksForChapter(chapterId) : bookmarks
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Title,URL,Notes,Chapter ID,Section ID,Created At\n';
      (chapterId ? getBookmarksForChapter(chapterId) : bookmarks).forEach(bookmark => {
        csv += `"${bookmark.title.replace(/"/g, '""')}","${bookmark.url.replace(/"/g, '""')}","${bookmark.notes.replace(/"/g, '""')}","${bookmark.chapter_id}","${bookmark.section_id}","${bookmark.created_at}"\n`;
      });
      return csv;
    }
    return null;
  };

  // Download bookmarks as a file
  const downloadBookmarks = (filename = 'bookmarks', format = 'json') => {
    const data = exportBookmarks(format);
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

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="mt-2">No bookmarks yet</p>
        <p className="text-sm">Bookmark important sections to save them here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
        />
        <div className="flex space-x-2">
          <button
            onClick={() => downloadBookmarks('bookmarks', 'json')}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            title="Export bookmarks as JSON"
          >
            JSON
          </button>
          <button
            onClick={() => downloadBookmarks('bookmarks', 'csv')}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            title="Export bookmarks as CSV"
          >
            CSV
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {filteredBookmarks.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 py-4">No bookmarks match your search</p>
      )}
    </div>
  );
};

// Bookmark sidebar component
export const BookmarkSidebar = ({ userId, isOpen, onClose }) => {
  const { bookmarks } = useBookmarks();
  const [activeTab, setActiveTab] = useState('all');

  if (!isOpen) return null;

  const allBookmarks = bookmarks;
  const todayBookmarks = bookmarks.filter(b => {
    const bookmarkDate = new Date(b.created_at);
    const today = new Date();
    return bookmarkDate.toDateString() === today.toDateString();
  });
  const weekBookmarks = bookmarks.filter(b => {
    const bookmarkDate = new Date(b.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bookmarkDate >= weekAgo;
  });

  const getBookmarksToShow = () => {
    switch (activeTab) {
      case 'today':
        return todayBookmarks;
      case 'week':
        return weekBookmarks;
      case 'all':
      default:
        return allBookmarks;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bookmarks</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All ({allBookmarks.length})
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'today' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('today')}
          >
            Today ({todayBookmarks.length})
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'week' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('week')}
          >
            This Week ({weekBookmarks.length})
          </button>
        </div>

        <BookmarkList userId={userId} />
      </div>
    </div>
  );
};

export default BookmarkContext;