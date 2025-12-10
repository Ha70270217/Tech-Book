// User model based on data-model.md
// Fields: ID, email, username, auth_provider, auth_provider_id, preferences, language, timezone, created_at, updated_at

class User {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.email = data.email;
    this.username = data.username;
    this.auth_provider = data.auth_provider;
    this.auth_provider_id = data.auth_provider_id;
    this.preferences = data.preferences || {};
    this.language = data.language || 'en';
    this.timezone = data.timezone;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  generateId() {
    // Generate a UUID-like string
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Email format is invalid');
    }

    if (this.username && (this.username.length < 3 || this.username.length > 30)) {
      errors.push('Username must be between 3 and 30 characters');
    }

    if (!this.auth_provider || !['google', 'github', 'email'].includes(this.auth_provider)) {
      errors.push('Valid auth provider is required');
    }

    if (!this.auth_provider_id) {
      errors.push('Auth provider ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to database format
  toDBFormat() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      auth_provider: this.auth_provider,
      auth_provider_id: this.auth_provider_id,
      preferences: JSON.stringify(this.preferences),
      language: this.language,
      timezone: this.timezone,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Convert from database format
  static fromDBFormat(dbData) {
    return new User({
      id: dbData.id,
      email: dbData.email,
      username: dbData.username,
      auth_provider: dbData.auth_provider,
      auth_provider_id: dbData.auth_provider_id,
      preferences: typeof dbData.preferences === 'string' ? JSON.parse(dbData.preferences) : dbData.preferences,
      language: dbData.language,
      timezone: dbData.timezone,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    });
  }
}

module.exports = User;