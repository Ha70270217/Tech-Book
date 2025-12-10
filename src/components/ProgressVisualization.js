import React from 'react';
import { useProgressTracker } from './ProgressTracker';

// Progress visualization components for the textbook UI

// Chapter progress bar component
export const ChapterProgressBar = ({ chapterId, progress, size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className="w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`bg-green-500 transition-all duration-500 ease-in-out ${sizeClass}`}
        style={{ width: `${progress}%` }}
      ></div>
      <div className="text-right text-xs text-gray-600 mt-1">
        {progress}% complete
      </div>
    </div>
  );
};

// Progress summary card component
export const ProgressSummaryCard = ({ userId }) => {
  const { getProgressSummary, isAuthenticated } = useProgressTracker(userId);

  const summary = getProgressSummary();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.overallProgress}%</div>
          <div className="text-sm text-gray-600">Overall</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.completedChapters}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{summary.totalChapters}</div>
          <div className="text-sm text-gray-600">Total Chapters</div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="mt-4 text-sm text-gray-600">
          {summary.totalChapters > 0
            ? `Keep going! You're making great progress through the textbook.`
            : 'Start your learning journey by exploring the first chapter!'}
        </div>
      )}
    </div>
  );
};

// Progress chart component
export const ProgressChart = ({ userId }) => {
  const { getProgressSummary } = useProgressTracker(userId);
  const summary = getProgressSummary();

  if (summary.chapters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chapter Progress</h3>
        <p className="text-gray-600">No progress data available yet. Start reading to track your progress!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Chapter Progress</h3>

      <div className="space-y-4">
        {summary.chapters.map((chapter, index) => (
          <div key={chapter.id} className="border-b border-gray-100 pb-3 last:border-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Chapter {index + 1}</span>
              <span className="text-sm text-gray-600">{chapter.progress}%</span>
            </div>
            <ChapterProgressBar chapterId={chapter.id} progress={chapter.progress} size="small" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Section progress tracker component
export const SectionProgressTracker = ({ userId, chapterId, sectionId, title }) => {
  const { progress, markSectionComplete, markSectionInProgress } = useProgressTracker(
    userId,
    chapterId,
    sectionId
  );

  const isCompleted = progress === 100;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isCompleted
              ? 'bg-green-100 text-green-800'
              : progress > 0
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {isCompleted ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
          </span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      </div>

      <div className="mt-3">
        <ChapterProgressBar chapterId={chapterId} progress={progress} size="small" />
      </div>

      <div className="mt-3 flex space-x-2">
        <button
          onClick={markSectionInProgress}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          Mark In Progress
        </button>
        <button
          onClick={markSectionComplete}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
};

// Progress dashboard component
export const ProgressDashboard = ({ userId }) => {
  return (
    <div className="space-y-6">
      <ProgressSummaryCard userId={userId} />
      <ProgressChart userId={userId} />
    </div>
  );
};

export default ProgressDashboard;