// AssessmentResponse model for storing user responses to exercises
class AssessmentResponse {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.exercise_id = data.exercise_id;
    this.chapter_id = data.chapter_id;
    this.response = data.response || null;
    this.is_correct = data.is_correct !== undefined ? data.is_correct : null;
    this.score = data.score || 0; // Score out of 100
    this.attempt_number = data.attempt_number || 1;
    this.submitted_at = data.submitted_at || new Date().toISOString();
    this.feedback = data.feedback || '';
    this.time_spent = data.time_spent || 0; // Time spent on the exercise in seconds
  }

  // Validate assessment response data
  static validate(data) {
    const errors = [];

    if (!data.user_id) {
      errors.push('User ID is required');
    }

    if (!data.exercise_id) {
      errors.push('Exercise ID is required');
    }

    if (!data.chapter_id) {
      errors.push('Chapter ID is required');
    }

    if (data.score !== undefined && (data.score < 0 || data.score > 100)) {
      errors.push('Score must be between 0 and 100');
    }

    if (data.attempt_number && data.attempt_number < 1) {
      errors.push('Attempt number must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to database format
  toDBFormat() {
    return {
      user_id: this.user_id,
      exercise_id: this.exercise_id,
      chapter_id: this.chapter_id,
      response: this.response,
      is_correct: this.is_correct,
      score: this.score,
      attempt_number: this.attempt_number,
      submitted_at: this.submitted_at,
      feedback: this.feedback,
      time_spent: this.time_spent
    };
  }

  // Create from database format
  static fromDBFormat(dbData) {
    return new AssessmentResponse({
      id: dbData.id,
      user_id: dbData.user_id,
      exercise_id: dbData.exercise_id,
      chapter_id: dbData.chapter_id,
      response: dbData.response,
      is_correct: dbData.is_correct,
      score: dbData.score,
      attempt_number: dbData.attempt_number,
      submitted_at: dbData.submitted_at,
      feedback: dbData.feedback,
      time_spent: dbData.time_spent
    });
  }

  // Create from API format
  static fromAPIFormat(apiData) {
    return new AssessmentResponse({
      user_id: apiData.user_id,
      exercise_id: apiData.exercise_id,
      chapter_id: apiData.chapter_id,
      response: apiData.response,
      is_correct: apiData.is_correct,
      score: apiData.score,
      attempt_number: apiData.attempt_number,
      submitted_at: apiData.submitted_at,
      feedback: apiData.feedback,
      time_spent: apiData.time_spent
    });
  }

  // Convert to API format
  toAPIFormat() {
    return {
      id: this.id,
      user_id: this.user_id,
      exercise_id: this.exercise_id,
      chapter_id: this.chapter_id,
      response: this.response,
      is_correct: this.is_correct,
      score: this.score,
      attempt_number: this.attempt_number,
      submitted_at: this.submitted_at,
      feedback: this.feedback,
      time_spent: this.time_spent
    };
  }
}

module.exports = AssessmentResponse;