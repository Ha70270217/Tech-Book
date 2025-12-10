const bcrypt = require('bcryptjs');
const validator = require('validator');

class PasswordUtil {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Generate salt and hash password
    const saltRounds = 12; // Higher number is more secure but slower
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }

  /**
   * Compare a plain text password with a hashed password
   * @param {string} plainPassword - Plain text password to compare
   * @param {string} hashedPassword - Hashed password to compare against
   * @returns {Promise<boolean>} - True if passwords match, false otherwise
   */
  static async comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {Error} - If password doesn't meet requirements
   */
  static validatePasswordStrength(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if email is valid, false otherwise
   */
  static validateEmail(email) {
    return validator.isEmail(email);
  }

  /**
   * Generate a random password (for password reset scenarios)
   * @param {number} length - Length of the password (default: 12)
   * @returns {string} - Generated password
   */
  static generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}

module.exports = PasswordUtil;