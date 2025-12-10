import React, { useState, useEffect } from 'react';

// Chapter order customization context for managing personalized learning paths
const ChapterOrderContext = React.createContext();

// Chapter order provider component
export const ChapterOrderProvider = ({ children, userId, defaultChapterOrder }) => {
  const [chapterOrder, setChapterOrder] = useState([]);
  const [isCustomized, setIsCustomized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with default chapter order or load from localStorage
  useEffect(() => {
    if (userId && defaultChapterOrder) {
      loadChapterOrder();
    }
  }, [userId, defaultChapterOrder]);

  const loadChapterOrder = () => {
    setIsLoading(true);
    try {
      // Try to load from localStorage first
      const savedOrder = localStorage.getItem(`chapterOrder_${userId}`);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setChapterOrder(parsedOrder.order);
        setIsCustomized(parsedOrder.isCustomized);
      } else {
        // Use default order if no saved order exists
        setChapterOrder(defaultChapterOrder);
        setIsCustomized(false);
      }
    } catch (error) {
      console.error('Error loading chapter order:', error);
      setChapterOrder(defaultChapterOrder || []);
      setIsCustomized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChapterOrder = (newOrder, isCustom = true) => {
    try {
      const orderData = {
        order: newOrder,
        isCustomized: isCustom,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(`chapterOrder_${userId}`, JSON.stringify(orderData));
      setChapterOrder(newOrder);
      setIsCustomized(isCustom);

      // In a real implementation, we would also save to the API
      // try {
      //   await fetch('/api/users/chapter-order', {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //     },
      //     body: JSON.stringify({
      //       chapter_order: newOrder,
      //       is_customized: isCustom
      //     })
      //   });
      // } catch (error) {
      //   console.error('Error saving chapter order to API:', error);
      // }
    } catch (error) {
      console.error('Error saving chapter order:', error);
    }
  };

  // Reset to default order
  const resetToDefault = () => {
    if (defaultChapterOrder) {
      saveChapterOrder(defaultChapterOrder, false);
    }
  };

  // Move a chapter to a new position
  const moveChapter = (fromIndex, toIndex) => {
    const newOrder = [...chapterOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    saveChapterOrder(newOrder, true);
  };

  // Swap two chapters
  const swapChapters = (index1, index2) => {
    const newOrder = [...chapterOrder];
    [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
    saveChapterOrder(newOrder, true);
  };

  // Move chapter up in the order
  const moveChapterUp = (index) => {
    if (index > 0) {
      moveChapter(index, index - 1);
    }
  };

  // Move chapter down in the order
  const moveChapterDown = (index) => {
    if (index < chapterOrder.length - 1) {
      moveChapter(index, index + 1);
    }
  };

  // Get the current chapter order
  const getCurrentOrder = () => {
    return chapterOrder;
  };

  const value = {
    chapterOrder,
    isCustomized,
    isLoading,
    moveChapter,
    swapChapters,
    moveChapterUp,
    moveChapterDown,
    resetToDefault,
    getCurrentOrder
  };

  return (
    <ChapterOrderContext.Provider value={value}>
      {children}
    </ChapterOrderContext.Provider>
  );
};

// Custom hook to use the chapter order context
export const useChapterOrder = () => {
  const context = React.useContext(ChapterOrderContext);
  if (!context) {
    throw new Error('useChapterOrder must be used within a ChapterOrderProvider');
  }
  return context;
};

// Chapter item for drag and drop
const ChapterItem = ({ chapter, index, totalChapters, onMoveUp, onMoveDown }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
      <div className="flex items-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
        <div className="ml-3">
          <h4 className="font-medium text-gray-800">{chapter.title || `Chapter ${index + 1}`}</h4>
          <p className="text-sm text-gray-600">{chapter.description || 'Chapter description'}</p>
        </div>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className={`p-2 rounded ${
            index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Move up"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === totalChapters - 1}
          className={`p-2 rounded ${
            index === totalChapters - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Move down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Chapter order customization component
export const ChapterOrderCustomization = ({ userId, defaultChapterOrder }) => {
  const { chapterOrder, isCustomized, moveChapterUp, moveChapterDown, resetToDefault } = useChapterOrder();

  if (!chapterOrder || chapterOrder.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No chapters available for customization</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Customize Learning Path</h3>
        {isCustomized && (
          <button
            onClick={resetToDefault}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Reset to Default
          </button>
        )}
      </div>

      {isCustomized && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <p>You have customized your learning path. Chapters will appear in your preferred order.</p>
        </div>
      )}

      <div className="space-y-2">
        {chapterOrder.map((chapter, index) => (
          <ChapterItem
            key={chapter.id || index}
            chapter={chapter}
            index={index}
            totalChapters={chapterOrder.length}
            onMoveUp={moveChapterUp}
            onMoveDown={moveChapterDown}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">How to customize your learning path:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Use the up/down arrows to reorder chapters</li>
          <li>• Organize chapters based on your learning preferences</li>
          <li>• Your customized order is saved automatically</li>
          <li>• Click "Reset to Default" to restore original order</li>
        </ul>
      </div>
    </div>
  );
};

// Component to display chapters in the user's preferred order
export const OrderedChapterList = ({ userId, chapters, defaultOrder, renderItem }) => {
  const { chapterOrder, isLoading } = useChapterOrder();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no custom order is set, use the original order
  const orderedChapters = chapterOrder && chapterOrder.length > 0
    ? chapterOrder.map(orderedChapter => {
        // Find the full chapter data based on the ID in the ordered list
        return chapters.find(ch => ch.id === orderedChapter.id) || orderedChapter;
      })
    : chapters;

  if (!orderedChapters || orderedChapters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No chapters available</p>
      </div>
    );
  }

  return (
    <div>
      {orderedChapters.map((chapter, index) => (
        <div key={chapter.id || index} className="mb-4">
          {renderItem ? renderItem(chapter, index) : (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium">{chapter.title || `Chapter ${index + 1}`}</h3>
              <p className="text-gray-600">{chapter.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChapterOrderContext;