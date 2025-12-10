const { query } = require('../db/connection');

class GDPRCompliance {
  /**
   * Get all personal data for a user (Right to Access)
   * @param {string} userId - User ID
   * @returns {Object} - User's personal data
   */
  static async getUserData(userId) {
    try {
      // Get user profile data
      const userResult = await query(
        'SELECT id, email, username, auth_provider, language, timezone, preferences, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const userData = userResult.rows[0];

      // Get user progress data
      const progressResult = await query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [userId]
      );

      // Get user bookmarks
      const bookmarkResult = await query(
        'SELECT * FROM bookmarks WHERE user_id = $1',
        [userId]
      );

      // Get user assessment responses
      const assessmentResult = await query(
        'SELECT * FROM assessment_responses WHERE user_id = $1',
        [userId]
      );

      return {
        profile: userData,
        progress: progressResult.rows,
        bookmarks: bookmarkResult.rows,
        assessments: assessmentResult.rows,
        exportTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GDPR data export error:', error);
      throw error;
    }
  }

  /**
   * Anonymize user data (Right to be Forgotten)
   * @param {string} userId - User ID
   */
  static async anonymizeUserData(userId) {
    try {
      // Begin transaction to ensure atomicity
      await query('BEGIN');

      // Update user account to anonymize personal information
      await query(`
        UPDATE users
        SET
          email = CONCAT('anonymized_', id, '@example.com'),
          username = CONCAT('user_', id),
          preferences = '{}',
          updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Anonymize progress data
      await query('UPDATE user_progress SET user_id = $1 WHERE user_id = $2', [`anonymized_${userId}`, userId]);

      // Anonymize bookmarks
      await query('UPDATE bookmarks SET user_id = $1 WHERE user_id = $2', [`anonymized_${userId}`, userId]);

      // Anonymize assessment responses
      await query('UPDATE assessment_responses SET user_id = $1 WHERE user_id = $2', [`anonymized_${userId}`, userId]);

      // Commit transaction
      await query('COMMIT');

      console.log(`User data anonymized for user ID: ${userId}`);
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('GDPR anonymization error:', error);
      throw error;
    }
  }

  /**
   * Completely delete user data (Right to be Forgotten - full deletion)
   * @param {string} userId - User ID
   */
  static async deleteUserAccount(userId) {
    try {
      // Begin transaction to ensure atomicity
      await query('BEGIN');

      // Delete assessment responses first (due to foreign key constraints)
      await query('DELETE FROM assessment_responses WHERE user_id = $1', [userId]);

      // Delete bookmarks
      await query('DELETE FROM bookmarks WHERE user_id = $1', [userId]);

      // Delete user progress
      await query('DELETE FROM user_progress WHERE user_id = $1', [userId]);

      // Delete the user account
      await query('DELETE FROM users WHERE id = $1', [userId]);

      // Commit transaction
      await query('COMMIT');

      console.log(`User account deleted for user ID: ${userId}`);
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('GDPR user deletion error:', error);
      throw error;
    }
  }

  /**
   * Request data deletion (Right to be Forgotten)
   * @param {string} userId - User ID
   * @param {string} deletionType - 'anonymize' or 'delete'
   */
  static async requestDataDeletion(userId, deletionType = 'anonymize') {
    if (deletionType === 'anonymize') {
      await this.anonymizeUserData(userId);
    } else if (deletionType === 'delete') {
      await this.deleteUserAccount(userId);
    } else {
      throw new Error('Invalid deletion type. Use "anonymize" or "delete"');
    }
  }

  /**
   * Check if user has consented to data processing
   * @param {string} userId - User ID
   * @returns {boolean} - True if user has consented
   */
  static async hasConsented(userId) {
    try {
      const result = await query(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const preferences = result.rows[0].preferences;
      const userPrefs = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;

      return userPrefs && userPrefs.consent && userPrefs.consent.dataProcessing === true;
    } catch (error) {
      console.error('GDPR consent check error:', error);
      return false;
    }
  }

  /**
   * Update user consent status
   * @param {string} userId - User ID
   * @param {Object} consent - Consent details
   */
  static async updateConsent(userId, consent) {
    try {
      const result = await query(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentPreferences = result.rows[0].preferences;
      const preferences = typeof currentPreferences === 'string' ? JSON.parse(currentPreferences) : currentPreferences || {};

      // Update consent information
      preferences.consent = {
        ...preferences.consent,
        ...consent,
        updatedAt: new Date().toISOString()
      };

      await query(
        'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(preferences), userId]
      );
    } catch (error) {
      console.error('GDPR consent update error:', error);
      throw error;
    }
  }

  /**
   * Get data retention information
   * @returns {Object} - Data retention policies
   */
  static getDataRetentionInfo() {
    return {
      userAccounts: '7 years after account closure',
      progressData: '5 years after last activity',
      assessmentData: '3 years after submission',
      logData: '30 days',
      backupData: '3 months',
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = GDPRCompliance;