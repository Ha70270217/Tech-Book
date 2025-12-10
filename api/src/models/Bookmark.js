// Bookmark model for storing user bookmarks and notes
class Bookmark {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.chapter_id = data.chapter_id;
    this.section_id = data.section_id;
    this.url = data.url;
    this.title = data.title;
    this.notes = data.notes || '';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  // Validate bookmark data
  static validate(data) {
    const errors = [];

    if (!data.user_id) {
      errors.push('User ID is required');
    }

    if (!data.chapter_id) {
      errors.push('Chapter ID is required');
    }

    if (!data.url) {
      errors.push('URL is required');
    }

    if (data.notes && data.notes.length > 1000) {
      errors.push('Notes cannot exceed 1000 characters');
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
      chapter_id: this.chapter_id,
      section_id: this.section_id,
      url: this.url,
      title: this.title,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Create from database format
  static fromDBFormat(dbData) {
    return new Bookmark({
      id: dbData.id,
      user_id: dbData.user_id,
      chapter_id: dbData.chapter_id,
      section_id: dbData.section_id,
      url: dbData.url,
      title: dbData.title,
      notes: dbData.notes,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    });
  }

  // Create from API format
  static fromAPIFormat(apiData) {
    return new Bookmark({
      user_id: apiData.user_id,
      chapter_id: apiData.chapter_id,
      section_id: apiData.section_id,
      url: apiData.url,
      title: apiData.title,
      notes: apiData.notes
    });
  }

  // Convert to API format
  toAPIFormat() {
    return {
      id: this.id,
      user_id: this.user_id,
      chapter_id: this.chapter_id,
      section_id: this.section_id,
      url: this.url,
      title: this.title,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Bookmark;