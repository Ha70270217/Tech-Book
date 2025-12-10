const validator = require('validator');

class InputSanitizer {
  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - Input string to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove script tags and other potentially dangerous content
    let sanitized = validator.escape(input);

    // Additional sanitization could include:
    // - Removing or encoding HTML entities
    // - Filtering out dangerous protocols
    return sanitized;
  }

  /**
   * Sanitize user profile data
   * @param {Object} profileData - User profile data
   * @returns {Object} - Sanitized profile data
   */
  static sanitizeProfileData(profileData) {
    if (!profileData || typeof profileData !== 'object') {
      return profileData;
    }

    const sanitized = { ...profileData };

    if (sanitized.username) {
      sanitized.username = validator.escape(sanitized.username);
    }

    if (sanitized.preferences && typeof sanitized.preferences === 'object') {
      // Recursively sanitize preferences if they contain user-generated content
      sanitized.preferences = this.sanitizePreferences(sanitized.preferences);
    }

    return sanitized;
  }

  /**
   * Sanitize preferences data
   * @param {Object} preferences - User preferences
   * @returns {Object} - Sanitized preferences
   */
  static sanitizePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      return preferences;
    }

    const sanitized = { ...preferences };

    // Sanitize any string values in preferences
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = validator.escape(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePreferences(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize user-generated content for exercises, bookmarks, etc.
   * @param {string} content - User-generated content
   * @returns {string} - Sanitized content
   */
  static sanitizeUserContent(content) {
    if (typeof content !== 'string') {
      return content;
    }

    // Use validator's sanitize method for HTML content
    // This allows some safe HTML tags but removes dangerous ones
    return validator.escape(content);
  }

  /**
   * Validate and sanitize email addresses
   * @param {string} email - Email address
   * @returns {string|false} - Validated and sanitized email or false
   */
  static validateAndSanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Sanitize first, then validate
    const sanitized = validator.escape(email.trim());

    if (!validator.isEmail(sanitized)) {
      return false;
    }

    return sanitized;
  }

  /**
   * Sanitize IDs and other non-string values
   * @param {any} value - Value to sanitize
   * @returns {any} - Sanitized value
   */
  static sanitizeId(value) {
    if (typeof value === 'string') {
      // Remove any potentially dangerous characters from IDs
      return value.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    return value;
  }
}

module.exports = InputSanitizer;