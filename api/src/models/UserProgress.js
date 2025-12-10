// UserProgress model based on data-model.md
// Fields: ID, user_id, chapter_id, section_id, completion_status, completion_percentage, last_accessed_at, completed_at, created_at, updated_at

class UserProgress {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.user_id = data.user_id;
    this.chapter_id = data.chapter_id;
    this.section_id = data.section_id || null; // Can be null for chapter-level progress
    this.completion_status = data.completion_status || 'not_started'; // 'not_started', 'in_progress', 'completed'
    this.completion_percentage = data.completion_percentage || 0;
    this.last_accessed_at = data.last_accessed_at || new Date().toISOString();
    this.completed_at = data.completed_at || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  generateId() {
    // Generate a UUID-like string
    return 'progress_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.user_id) {
      errors.push('User ID is required');
    }

    if (!this.chapter_id) {
      errors.push('Chapter ID is required');
    }

    if (this.completion_percentage < 0 || this.completion_percentage > 100) {
      errors.push('Completion percentage must be between 0 and 100');
    }

    if (!['not_started', 'in_progress', 'completed'].includes(this.completion_status)) {
      errors.push('Completion status must be one of: not_started, in_progress, completed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update progress based on section completion
  updateProgress(sectionId, sectionCompletion = 0) {
    this.section_id = sectionId;
    this.completion_percentage = Math.max(this.completion_percentage, sectionCompletion);
    this.last_accessed_at = new Date().toISOString();

    // Update completion status based on percentage
    if (this.completion_percentage === 100) {
      this.completion_status = 'completed';
      this.completed_at = new Date().toISOString();
    } else if (this.completion_percentage > 0) {
      this.completion_status = 'in_progress';
    } else {
      this.completion_status = 'not_started';
    }

    this.updated_at = new Date().toISOString();
  }

  // Mark chapter as completed
  markCompleted() {
    this.completion_status = 'completed';
    this.completion_percentage = 100;
    this.completed_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  // Convert to database format
  toDBFormat() {
    return {
      id: this.id,
      user_id: this.user_id,
      chapter_id: this.chapter_id,
      section_id: this.section_id,
      completion_status: this.completion_status,
      completion_percentage: this.completion_percentage,
      last_accessed_at: this.last_accessed_at,
      completed_at: this.completed_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Convert from database format
  static fromDBFormat(dbData) {
    return new UserProgress({
      id: dbData.id,
      user_id: dbData.user_id,
      chapter_id: dbData.chapter_id,
      section_id: dbData.section_id,
      completion_status: dbData.completion_status,
      completion_percentage: dbData.completion_percentage,
      last_accessed_at: dbData.last_accessed_at,
      completed_at: dbData.completed_at,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    });
  }

  // Calculate progress based on completed sections
  static calculateProgress(completedSections, totalSections) {
    if (totalSections === 0) return 0;
    return Math.round((completedSections / totalSections) * 100);
  }
}

module.exports = UserProgress;