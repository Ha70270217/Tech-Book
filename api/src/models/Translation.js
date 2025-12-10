// Translation model for storing translated content
class Translation {
  constructor(data = {}) {
    this.id = data.id || null;
    this.key = data.key; // Unique identifier for the translatable string
    this.source_text = data.source_text; // Original text in source language
    this.target_language = data.target_language; // Target language code (e.g., 'ur', 'en')
    this.translated_text = data.translated_text; // Translated text
    this.context = data.context || ''; // Context for the translation (e.g., 'chapter-1', 'exercises')
    this.status = data.status || 'pending'; // 'pending', 'approved', 'rejected'
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.created_by = data.created_by || null; // User ID of translator
    this.approved_by = data.approved_by || null; // User ID of approver
    this.approved_at = data.approved_at || null;
  }

  // Validate translation data
  static validate(data) {
    const errors = [];

    if (!data.key) {
      errors.push('Translation key is required');
    }

    if (!data.source_text) {
      errors.push('Source text is required');
    }

    if (!data.target_language) {
      errors.push('Target language is required');
    }

    if (!data.translated_text) {
      errors.push('Translated text is required');
    }

    if (data.status && !['pending', 'approved', 'rejected'].includes(data.status)) {
      errors.push('Invalid status. Must be one of: pending, approved, rejected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to database format
  toDBFormat() {
    return {
      key: this.key,
      source_text: this.source_text,
      target_language: this.target_language,
      translated_text: this.translated_text,
      context: this.context,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      approved_by: this.approved_by,
      approved_at: this.approved_at
    };
  }

  // Create from database format
  static fromDBFormat(dbData) {
    return new Translation({
      id: dbData.id,
      key: dbData.key,
      source_text: dbData.source_text,
      target_language: dbData.target_language,
      translated_text: dbData.translated_text,
      context: dbData.context,
      status: dbData.status,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
      created_by: dbData.created_by,
      approved_by: dbData.approved_by,
      approved_at: dbData.approved_at
    });
  }

  // Create from API format
  static fromAPIFormat(apiData) {
    return new Translation({
      key: apiData.key,
      source_text: apiData.source_text,
      target_language: apiData.target_language,
      translated_text: apiData.translated_text,
      context: apiData.context,
      status: apiData.status,
      created_by: apiData.created_by,
      approved_by: apiData.approved_by
    });
  }

  // Convert to API format
  toAPIFormat() {
    return {
      id: this.id,
      key: this.key,
      source_text: this.source_text,
      target_language: this.target_language,
      translated_text: this.translated_text,
      context: this.context,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      approved_by: this.approved_by,
      approved_at: this.approved_at
    };
  }

  // Static methods for database operations
  static async create(translation) {
    const { query } = require('../db/connection');
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO translations (key, source_text, target_language, translated_text, context, status, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        translation.key,
        translation.source_text,
        translation.target_language,
        translation.translated_text,
        translation.context,
        translation.status,
        now,
        now,
        translation.created_by
      ]
    );

    return Translation.fromDBFormat(result.rows[0]);
  }

  static async update(translation) {
    const { query } = require('../db/connection');
    const now = new Date().toISOString();

    const result = await query(
      `UPDATE translations
       SET translated_text = $1, context = $2, status = $3, updated_at = $4, approved_by = $5, approved_at = $6
       WHERE id = $7
       RETURNING *`,
      [
        translation.translated_text,
        translation.context,
        translation.status,
        now,
        translation.approved_by,
        translation.approved_at,
        translation.id
      ]
    );

    return Translation.fromDBFormat(result.rows[0]);
  }

  static async getById(id) {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM translations WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? Translation.fromDBFormat(result.rows[0]) : null;
  }

  static async getByContentAndLanguage(contentId, language) {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM translations WHERE key = $1 AND target_language = $2',
      [contentId, language]
    );

    return result.rows.length > 0 ? Translation.fromDBFormat(result.rows[0]) : null;
  }

  static async getForContent(contentId) {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM translations WHERE key = $1',
      [contentId]
    );

    return result.rows.map(row => Translation.fromDBFormat(row));
  }

  static async getForLanguage(language) {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM translations WHERE target_language = $1',
      [language]
    );

    return result.rows.map(row => Translation.fromDBFormat(row));
  }

  static async getAll() {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM translations ORDER BY created_at DESC'
    );

    return result.rows.map(row => Translation.fromDBFormat(row));
  }
}

module.exports = Translation;