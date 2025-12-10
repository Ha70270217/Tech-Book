import React, { useState, useEffect } from 'react';
import { useExercises } from './ExerciseComponents';

// Assessment analytics and reporting component
export const AssessmentAnalytics = ({ userId, chapterId }) => {
  const { responses, exercises, getExerciseStats } = useExercises();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month', 'year'

  useEffect(() => {
    if (exercises.length > 0 && responses.length > 0) {
      generateAnalytics();
    }
  }, [exercises, responses, timeRange]);

  const generateAnalytics = () => {
    // Filter responses by time range if needed
    let filteredResponses = [...responses];

    if (timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      filteredResponses = responses.filter(resp =>
        new Date(resp.submitted_at) >= startDate
      );
    }

    // Calculate overall performance
    const totalResponses = filteredResponses.length;
    const correctResponses = filteredResponses.filter(resp => resp.is_correct === true).length;
    const averageScore = totalResponses > 0
      ? Math.round(filteredResponses.reduce((sum, resp) => sum + (resp.score || 0), 0) / totalResponses)
      : 0;

    // Calculate performance by exercise type
    const performanceByType = {};
    exercises.forEach(exercise => {
      if (!performanceByType[exercise.type]) {
        performanceByType[exercise.type] = {
          total: 0,
          completed: 0,
          correct: 0,
          averageScore: 0
        };
      }
    });

    filteredResponses.forEach(resp => {
      const exercise = exercises.find(ex => ex.id === resp.exercise_id);
      if (exercise) {
        const typeData = performanceByType[exercise.type];
        typeData.total++;
        typeData.completed++;
        if (resp.is_correct === true) {
          typeData.correct++;
        }
        typeData.averageScore += resp.score || 0;
      }
    });

    // Calculate average scores for each type
    Object.keys(performanceByType).forEach(type => {
      const typeData = performanceByType[type];
      if (typeData.completed > 0) {
        typeData.averageScore = Math.round(typeData.averageScore / typeData.completed);
      }
    });

    // Calculate performance by difficulty
    const performanceByDifficulty = {};
    exercises.forEach(exercise => {
      if (!performanceByDifficulty[exercise.difficulty]) {
        performanceByDifficulty[exercise.difficulty] = {
          total: 0,
          completed: 0,
          correct: 0,
          averageScore: 0
        };
      }
    });

    filteredResponses.forEach(resp => {
      const exercise = exercises.find(ex => ex.id === resp.exercise_id);
      if (exercise) {
        const diffData = performanceByDifficulty[exercise.difficulty];
        diffData.total++;
        diffData.completed++;
        if (resp.is_correct === true) {
          diffData.correct++;
        }
        diffData.averageScore += resp.score || 0;
      }
    });

    // Calculate average scores for each difficulty
    Object.keys(performanceByDifficulty).forEach(difficulty => {
      const diffData = performanceByDifficulty[difficulty];
      if (diffData.completed > 0) {
        diffData.averageScore = Math.round(diffData.averageScore / diffData.completed);
      }
    });

    // Calculate time spent per exercise
    const totalTimeSpent = filteredResponses.reduce((sum, resp) => sum + (resp.time_spent || 0), 0);
    const avgTimePerExercise = totalResponses > 0
      ? Math.round(totalTimeSpent / totalResponses)
      : 0;

    // Calculate improvement over time (comparing first half vs second half of responses)
    let improvement = 0;
    if (filteredResponses.length > 1) {
      const sortedResponses = [...filteredResponses].sort((a, b) =>
        new Date(a.submitted_at) - new Date(b.submitted_at)
      );
      const midpoint = Math.floor(sortedResponses.length / 2);
      const firstHalf = sortedResponses.slice(0, midpoint);
      const secondHalf = sortedResponses.slice(midpoint);

      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum, resp) => sum + (resp.score || 0), 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, resp) => sum + (resp.score || 0), 0) / secondHalf.length
        : 0;

      improvement = Math.round(secondHalfAvg - firstHalfAvg);
    }

    setAnalyticsData({
      overall: {
        totalResponses,
        correctResponses,
        averageScore,
        accuracy: totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0,
        totalTimeSpent,
        avgTimePerExercise,
        improvement
      },
      byType: performanceByType,
      byDifficulty: performanceByDifficulty
    });
  };

  const exportAnalytics = (format = 'json') => {
    if (!analyticsData) return null;

    const exportData = {
      userId,
      chapterId,
      exportTimestamp: new Date().toISOString(),
      timeRange,
      analytics: analyticsData
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      let csv = 'Metric,Value\n';
      csv += `Total Responses,${analyticsData.overall.totalResponses}\n`;
      csv += `Correct Responses,${analyticsData.overall.correctResponses}\n`;
      csv += `Average Score,${analyticsData.overall.averageScore}\n`;
      csv += `Accuracy %,${analyticsData.overall.accuracy}\n`;
      csv += `Total Time Spent (seconds),${analyticsData.overall.totalTimeSpent}\n`;
      csv += `Avg Time per Exercise (seconds),${analyticsData.overall.avgTimePerExercise}\n`;
      csv += `Improvement,${analyticsData.overall.improvement}\n`;
      return csv;
    }
    return null;
  };

  const downloadAnalytics = (filename = 'assessment-analytics', format = 'json') => {
    const data = exportAnalytics(format);
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

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Analytics</h2>
        <p className="text-gray-600">Generating analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Assessment Analytics</h2>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={() => downloadAnalytics('analytics', 'json')}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Export JSON
          </button>
          <button
            onClick={() => downloadAnalytics('analytics', 'csv')}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Responses</h3>
          <p className="text-2xl font-bold text-blue-600">{analyticsData.overall.totalResponses}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Accuracy</h3>
          <p className="text-2xl font-bold text-green-600">{analyticsData.overall.accuracy}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">Avg Score</h3>
          <p className="text-2xl font-bold text-purple-600">{analyticsData.overall.averageScore}%</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">Avg Time</h3>
          <p className="text-2xl font-bold text-yellow-600">{analyticsData.overall.avgTimePerExercise}s</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Type */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Performance by Exercise Type</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.byType).map(([type, data]) => (
              <div key={type} className="border-b border-gray-200 pb-2">
                <div className="flex justify-between mb-1">
                  <span className="capitalize font-medium">{type}</span>
                  <span className="text-sm">{data.averageScore}% avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${data.completed > 0 ? (data.correct / data.completed) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{data.correct}/{data.completed} correct</span>
                  <span>{data.completed} completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance by Difficulty */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Performance by Difficulty</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.byDifficulty).map(([difficulty, data]) => (
              <div key={difficulty} className="border-b border-gray-200 pb-2">
                <div className="flex justify-between mb-1">
                  <span className="capitalize font-medium">{difficulty}</span>
                  <span className="text-sm">{data.averageScore}% avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${data.completed > 0 ? (data.correct / data.completed) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{data.correct}/{data.completed} correct</span>
                  <span>{data.completed} completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">Performance Trend</h3>
        <p className="text-sm text-gray-600">
          {analyticsData.overall.improvement > 0
            ? `You're improving! Your recent scores are ${analyticsData.overall.improvement} points higher than earlier.`
            : analyticsData.overall.improvement < 0
            ? `Focus on improvement. Your recent scores are ${Math.abs(analyticsData.overall.improvement)} points lower than earlier.`
            : 'Your performance has been consistent over time.'}
        </p>
      </div>
    </div>
  );
};

export default AssessmentAnalytics;