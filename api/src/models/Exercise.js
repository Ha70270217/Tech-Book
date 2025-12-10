// Exercise model for storing exercises and their metadata
class Exercise {
  constructor(data = {}) {
    this.id = data.id || null;
    this.chapter_id = data.chapter_id;
    this.section_id = data.section_id;
    this.type = data.type || 'multiple_choice'; // multiple_choice, short_answer, coding, essay
    this.title = data.title || '';
    this.description = data.description || '';
    this.question = data.question || '';
    this.options = data.options || []; // For multiple choice questions
    this.correct_answer = data.correct_answer || null;
    this.explanation = data.explanation || '';
    this.difficulty = data.difficulty || 'medium'; // easy, medium, hard
    this.tags = data.tags || [];
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.is_active = data.is_active !== undefined ? data.is_active : true;
  }

  // Validate exercise data
  static validate(data) {
    const errors = [];

    if (!data.chapter_id) {
      errors.push('Chapter ID is required');
    }

    if (!data.type) {
      errors.push('Exercise type is required');
    } else if (!['multiple_choice', 'short_answer', 'coding', 'essay'].includes(data.type)) {
      errors.push('Invalid exercise type. Must be one of: multiple_choice, short_answer, coding, essay');
    }

    if (!data.question) {
      errors.push('Question is required');
    }

    if (data.type === 'multiple_choice' && (!data.options || data.options.length === 0)) {
      errors.push('Multiple choice questions must have options');
    }

    if (data.difficulty && !['easy', 'medium', 'hard'].includes(data.difficulty)) {
      errors.push('Invalid difficulty. Must be one of: easy, medium, hard');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to database format
  toDBFormat() {
    return {
      chapter_id: this.chapter_id,
      section_id: this.section_id,
      type: this.type,
      title: this.title,
      description: this.description,
      question: this.question,
      options: JSON.stringify(this.options),
      correct_answer: this.correct_answer,
      explanation: this.explanation,
      difficulty: this.difficulty,
      tags: JSON.stringify(this.tags),
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_active: this.is_active
    };
  }

  // Create from database format
  static fromDBFormat(dbData) {
    return new Exercise({
      id: dbData.id,
      chapter_id: dbData.chapter_id,
      section_id: dbData.section_id,
      type: dbData.type,
      title: dbData.title,
      description: dbData.description,
      question: dbData.question,
      options: dbData.options ? JSON.parse(dbData.options) : [],
      correct_answer: dbData.correct_answer,
      explanation: dbData.explanation,
      difficulty: dbData.difficulty,
      tags: dbData.tags ? JSON.parse(dbData.tags) : [],
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
      is_active: dbData.is_active
    });
  }

  // Create from API format
  static fromAPIFormat(apiData) {
    return new Exercise({
      id: apiData.id,
      chapter_id: apiData.chapter_id,
      section_id: apiData.section_id,
      type: apiData.type,
      title: apiData.title,
      description: apiData.description,
      question: apiData.question,
      options: apiData.options || [],
      correct_answer: apiData.correct_answer,
      explanation: apiData.explanation,
      difficulty: apiData.difficulty,
      tags: apiData.tags || [],
      is_active: apiData.is_active
    });
  }

  // Convert to API format
  toAPIFormat() {
    return {
      id: this.id,
      chapter_id: this.chapter_id,
      section_id: this.section_id,
      type: this.type,
      title: this.title,
      description: this.description,
      question: this.question,
      options: this.options,
      correct_answer: this.correct_answer,
      explanation: this.explanation,
      difficulty: this.difficulty,
      tags: this.tags,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_active: this.is_active
    };
  }
}

module.exports = Exercise;