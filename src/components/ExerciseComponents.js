import React, { useState, useEffect } from 'react';

// Exercise context for managing exercises across the application
const ExerciseContext = React.createContext();

// Exercise provider component
export const ExerciseProvider = ({ children, userId, chapterId }) => {
  const [exercises, setExercises] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Load exercises for the chapter
  useEffect(() => {
    if (chapterId) {
      loadExercises();
    }
  }, [chapterId]);

  // Load user's responses
  useEffect(() => {
    if (userId && chapterId) {
      loadResponses();
    }
  }, [userId, chapterId]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use mock data. In a real implementation, we would fetch from the API
      const mockExercises = [
        {
          id: 1,
          chapter_id: chapterId,
          section_id: 'section-1',
          type: 'multiple_choice',
          title: 'Basic Concepts',
          description: 'Test your understanding of basic concepts',
          question: 'What is the primary function of a PID controller?',
          options: [
            'To amplify signals',
            'To filter noise',
            'To control system response',
            'To convert analog to digital'
          ],
          correct_answer: '2', // Index of correct answer
          explanation: 'A PID controller is used to control system response by adjusting the output based on the error between desired and actual values.',
          difficulty: 'easy',
          tags: ['control', 'pid', 'robotics']
        },
        {
          id: 2,
          chapter_id: chapterId,
          section_id: 'section-2',
          type: 'short_answer',
          title: 'Explain Feedback',
          description: 'Describe the importance of feedback in control systems',
          question: 'Explain the concept of feedback in control systems and why it is important.',
          explanation: 'Feedback is crucial in control systems as it allows the system to adjust its behavior based on the difference between desired and actual outputs.',
          difficulty: 'medium',
          tags: ['feedback', 'control', 'systems']
        },
        {
          id: 3,
          chapter_id: chapterId,
          section_id: 'section-3',
          type: 'multiple_choice',
          title: 'Stability Analysis',
          description: 'Determine system stability',
          question: 'Which of the following is NOT a method for analyzing system stability?',
          options: [
            'Routh-Hurwitz criterion',
            'Nyquist criterion',
            'Laplace transform',
            'Root locus method'
          ],
          correct_answer: '2',
          explanation: 'While Laplace transform is a useful tool for system analysis, it is not specifically a method for stability analysis like the other options.',
          difficulty: 'hard',
          tags: ['stability', 'analysis', 'control']
        }
      ];
      setExercises(mockExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      // For now, we'll use localStorage. In a real implementation, we would fetch from the API
      const responseKey = `exerciseResponses_${userId}_${chapterId}`;
      const responseData = localStorage.getItem(responseKey);
      if (responseData) {
        setResponses(JSON.parse(responseData));
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const saveResponse = async (exerciseId, response, timeSpent) => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      console.error('Exercise not found');
      return null;
    }

    // Calculate score based on exercise type and response
    let is_correct = null;
    let score = 0;
    let feedback = '';

    if (exercise.type === 'multiple_choice') {
      is_correct = response === exercise.correct_answer;
      score = is_correct ? 100 : 0;
      feedback = is_correct ? 'Correct!' : `Incorrect. ${exercise.explanation}`;
    } else if (exercise.type === 'short_answer' || exercise.type === 'essay') {
      // For short answer and essay, we can't automatically grade
      // Set to null to indicate manual grading is needed
      is_correct = null;
      score = 0; // Will be set by instructor
      feedback = `Response submitted. ${exercise.explanation}`;
    } else if (exercise.type === 'coding') {
      // For coding exercises, we would have a more complex validation
      // For now, we'll set to null to indicate manual grading is needed
      is_correct = null;
      score = 0; // Will be set by instructor or automated tests
      feedback = 'Code submitted for evaluation.';
    }

    const newResponse = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      exercise_id: exerciseId,
      chapter_id: chapterId,
      response,
      is_correct,
      score,
      time_spent: timeSpent,
      feedback,
      submitted_at: new Date().toISOString()
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Save to localStorage
    const responseKey = `exerciseResponses_${userId}_${chapterId}`;
    localStorage.setItem(responseKey, JSON.stringify(updatedResponses));

    // In a real implementation, we would also send to the API
    try {
      // const token = localStorage.getItem('authToken');
      // await fetch('/api/assessments', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     exercise_id: exerciseId,
      //     chapter_id: chapterId,
      //     response,
      //     time_spent: timeSpent
      //   })
      // });
    } catch (error) {
      console.error('Error saving response to API:', error);
    }

    return newResponse;
  };

  const getExerciseById = (exerciseId) => {
    return exercises.find(ex => ex.id === exerciseId);
  };

  const getResponseForExercise = (exerciseId) => {
    return responses.find(resp => resp.exercise_id === exerciseId);
  };

  const getExerciseStats = () => {
    const total = exercises.length;
    const completed = responses.length;
    const correct = responses.filter(resp => {
      const exercise = getExerciseById(resp.exercise_id);
      return exercise && resp.is_correct === true;
    }).length;
    const averageScore = completed > 0
      ? Math.round(responses.reduce((sum, resp) => sum + (resp.score || 0), 0) / completed)
      : 0;

    // Calculate stats by exercise type
    const typeStats = {};
    exercises.forEach(exercise => {
      if (!typeStats[exercise.type]) {
        typeStats[exercise.type] = { total: 0, completed: 0, correct: 0 };
      }
      typeStats[exercise.type].total++;

      const response = responses.find(r => r.exercise_id === exercise.id);
      if (response) {
        typeStats[exercise.type].completed++;
        if (response.is_correct === true) {
          typeStats[exercise.type].correct++;
        }
      }
    });

    // Calculate stats by difficulty
    const difficultyStats = {};
    exercises.forEach(exercise => {
      if (!difficultyStats[exercise.difficulty]) {
        difficultyStats[exercise.difficulty] = { total: 0, completed: 0, correct: 0 };
      }
      difficultyStats[exercise.difficulty].total++;

      const response = responses.find(r => r.exercise_id === exercise.id);
      if (response) {
        difficultyStats[exercise.difficulty].completed++;
        if (response.is_correct === true) {
          difficultyStats[exercise.difficulty].correct++;
        }
      }
    });

    return {
      total,
      completed,
      correct,
      averageScore,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      typeStats,
      difficultyStats
    };
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const resetProgress = () => {
    setResponses([]);
    setCurrentExerciseIndex(0);
    const responseKey = `exerciseResponses_${userId}_${chapterId}`;
    localStorage.removeItem(responseKey);
  };

  const value = {
    exercises,
    responses,
    isLoading,
    currentExerciseIndex,
    getExerciseById,
    getResponseForExercise,
    getExerciseStats,
    saveResponse,
    nextExercise,
    prevExercise,
    resetProgress
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};

// Custom hook to use the exercise context
export const useExercises = () => {
  const context = React.useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercises must be used within an ExerciseProvider');
  }
  return context;
};

// Multiple choice exercise component
export const MultipleChoiceExercise = ({ exercise, onResponse, userResponse, isSubmitted, responseFeedback }) => {
  const [selectedOption, setSelectedOption] = useState(userResponse || '');

  useEffect(() => {
    if (userResponse !== undefined) {
      setSelectedOption(userResponse);
    }
  }, [userResponse]);

  const handleOptionSelect = (optionIndex) => {
    if (!isSubmitted) {
      setSelectedOption(optionIndex.toString());
      onResponse(optionIndex.toString());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{exercise.title}</h3>
        <p className="text-gray-600 mt-2">{exercise.question}</p>
      </div>

      <div className="space-y-3">
        {exercise.options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedOption === index.toString()
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                selectedOption === index.toString()
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-400'
              }`}>
                {selectedOption === index.toString() && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span>{option}</span>
            </div>
          </div>
        ))}
      </div>

      {isSubmitted && (
        <div className={`mt-4 p-3 rounded-lg ${
          selectedOption === exercise.correct_answer
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <p className="font-medium">
            {selectedOption === exercise.correct_answer ? 'Correct!' : 'Incorrect'}
          </p>
          {responseFeedback ? (
            <p className="mt-1">{responseFeedback}</p>
          ) : (
            <>
              <p className="mt-1">{exercise.explanation}</p>
              {selectedOption !== exercise.correct_answer && (
                <p className="mt-1 font-medium">Correct answer: {exercise.options[parseInt(exercise.correct_answer)]}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Short answer exercise component
export const ShortAnswerExercise = ({ exercise, onResponse, userResponse, isSubmitted, responseFeedback }) => {
  const [answer, setAnswer] = useState(userResponse || '');

  useEffect(() => {
    if (userResponse !== undefined) {
      setAnswer(userResponse);
    }
  }, [userResponse]);

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    onResponse(value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{exercise.title}</h3>
        <p className="text-gray-600 mt-2">{exercise.question}</p>
      </div>

      <textarea
        value={answer}
        onChange={handleAnswerChange}
        disabled={isSubmitted}
        placeholder="Type your answer here..."
        className={`w-full p-3 border rounded-lg ${
          isSubmitted ? 'bg-gray-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
        rows="4"
      />

      {isSubmitted && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
          <p className="font-medium">Feedback:</p>
          {responseFeedback ? (
            <p className="mt-1">{responseFeedback}</p>
          ) : (
            <p className="mt-1">{exercise.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Coding exercise component
export const CodingExercise = ({ exercise, onResponse, userResponse, isSubmitted, responseFeedback }) => {
  const [code, setCode] = useState(userResponse || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (userResponse !== undefined) {
      setCode(userResponse);
    }
  }, [userResponse]);

  const handleCodeChange = (e) => {
    const value = e.target.value;
    setCode(value);
    onResponse(value);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    try {
      // In a real implementation, we would send the code to a secure execution environment
      // For now, we'll just simulate the execution
      setTimeout(() => {
        setOutput('Code executed successfully! Output: Hello, World!');
        setIsRunning(false);
      }, 1000);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{exercise.title}</h3>
        <p className="text-gray-600 mt-2">{exercise.question}</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-gray-700">Code Editor</label>
          <button
            onClick={runCode}
            disabled={isRunning || isSubmitted}
            className={`px-3 py-1 rounded text-sm ${
              isRunning || isSubmitted
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>

        <textarea
          value={code}
          onChange={handleCodeChange}
          disabled={isSubmitted}
          placeholder="Write your code here..."
          className={`w-full p-3 border rounded-lg font-mono text-sm ${
            isSubmitted ? 'bg-gray-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          rows="10"
          spellCheck="false"
        />
      </div>

      {output && (
        <div className="mb-4">
          <label className="font-medium text-gray-700 mb-2 block">Output</label>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
            {output}
          </pre>
        </div>
      )}

      {isSubmitted && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
          <p className="font-medium">Feedback:</p>
          {responseFeedback ? (
            <p className="mt-1">{responseFeedback}</p>
          ) : (
            <p className="mt-1">{exercise.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Exercise renderer component
export const ExerciseRenderer = ({ exercise, onResponse, userResponse, isSubmitted, responseFeedback }) => {
  switch (exercise.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceExercise
          exercise={exercise}
          onResponse={onResponse}
          userResponse={userResponse}
          isSubmitted={isSubmitted}
          responseFeedback={responseFeedback}
        />
      );
    case 'short_answer':
    case 'essay':
      return (
        <ShortAnswerExercise
          exercise={exercise}
          onResponse={onResponse}
          userResponse={userResponse}
          isSubmitted={isSubmitted}
          responseFeedback={responseFeedback}
        />
      );
    case 'coding':
      return (
        <CodingExercise
          exercise={exercise}
          onResponse={onResponse}
          userResponse={userResponse}
          isSubmitted={isSubmitted}
          responseFeedback={responseFeedback}
        />
      );
    default:
      return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p>Unsupported exercise type: {exercise.type}</p>
        </div>
      );
  }
};

// Exercise list component
export const ExerciseList = ({ chapterId }) => {
  const { exercises, getResponseForExercise, saveResponse, currentExerciseIndex, nextExercise, prevExercise, getExerciseStats } = useExercises();
  const [startTime, setStartTime] = useState(Date.now());
  const [userResponses, setUserResponses] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];
  const stats = getExerciseStats();

  if (!currentExercise) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No exercises available</p>
      </div>
    );
  }

  const handleResponse = (response) => {
    setUserResponses(prev => ({
      ...prev,
      [currentExercise.id]: response
    }));
  };

  const submitResponse = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // Convert to seconds
    const response = userResponses[currentExercise.id];

    if (response !== undefined) {
      await saveResponse(currentExercise.id, response, timeSpent);
      setIsSubmitted(true);
    }
  };

  const resetCurrentExercise = () => {
    setUserResponses(prev => ({
      ...prev,
      [currentExercise.id]: undefined
    }));
    setIsSubmitted(false);
    setStartTime(Date.now());
  };

  const hasResponse = currentExercise.id in userResponses;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Exercises</h2>
        <div className="text-sm text-gray-600">
          {stats.completed} of {stats.total} completed ({stats.percentage}%)
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between">
          <span>Exercise {currentExerciseIndex + 1} of {exercises.length}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            currentExercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            currentExercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {currentExercise.difficulty}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <ExerciseRenderer
        exercise={currentExercise}
        onResponse={handleResponse}
        userResponse={getResponseForExercise(currentExercise.id)?.response || userResponses[currentExercise.id]}
        isSubmitted={isSubmitted}
        responseFeedback={getResponseForExercise(currentExercise.id)?.feedback}
      />

      <div className="flex justify-between mt-6">
        <button
          onClick={prevExercise}
          disabled={currentExerciseIndex === 0}
          className={`px-4 py-2 rounded-lg ${
            currentExerciseIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        {!isSubmitted ? (
          <button
            onClick={submitResponse}
            disabled={!hasResponse}
            className={`px-4 py-2 rounded-lg ${
              !hasResponse
                ? 'bg-blue-200 text-blue-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={() => {
              resetCurrentExercise();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Try Again
          </button>
        )}

        <button
          onClick={nextExercise}
          disabled={currentExerciseIndex === exercises.length - 1}
          className={`px-4 py-2 rounded-lg ${
            currentExerciseIndex === exercises.length - 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Exercise dashboard component
export const ExerciseDashboard = ({ userId, chapterId }) => {
  const { getExerciseStats, resetProgress } = useExercises();
  const stats = getExerciseStats();

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Exercise Progress</h2>
        <button
          onClick={resetProgress}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Reset Progress
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Exercises</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.correct}</div>
          <div className="text-sm text-gray-600">Correct</div>
        </div>

        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.averageScore}%</div>
          <div className="text-sm text-gray-600">Avg. Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats by type */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">By Exercise Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.typeStats).map(([type, typeStat]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type}</span>
                <span>{typeStat.completed}/{typeStat.total} ({typeStat.total > 0 ? Math.round((typeStat.correct / typeStat.total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats by difficulty */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">By Difficulty</h3>
          <div className="space-y-2">
            {Object.entries(stats.difficultyStats).map(([difficulty, diffStat]) => (
              <div key={difficulty} className="flex justify-between">
                <span className="capitalize">{difficulty}</span>
                <span>{diffStat.completed}/{diffStat.total} ({diffStat.total > 0 ? Math.round((diffStat.correct / diffStat.total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseContext;