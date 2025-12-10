// Locale model for managing supported languages and their settings
class Locale {
  constructor(data = {}) {
    this.id = data.id || null;
    this.code = data.code; // Language code (e.g., 'en', 'ur', 'es')
    this.name = data.name; // Full name (e.g., 'English', 'Urdu', 'Spanish')
    this.native_name = data.native_name; // Native name (e.g., 'English', 'اردو', 'Español')
    this.direction = data.direction || 'ltr'; // Text direction: 'ltr' or 'rtl'
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.is_default = data.is_default !== undefined ? data.is_default : false;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  // Validate locale data
  static validate(data) {
    const errors = [];

    if (!data.code) {
      errors.push('Locale code is required');
    } else if (data.code.length > 10) {
      errors.push('Locale code must be 10 characters or less');
    }

    if (!data.name) {
      errors.push('Locale name is required');
    }

    if (data.direction && !['ltr', 'rtl'].includes(data.direction)) {
      errors.push('Invalid text direction. Must be "ltr" or "rtl"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to database format
  toDBFormat() {
    return {
      code: this.code,
      name: this.name,
      native_name: this.native_name,
      direction: this.direction,
      is_active: this.is_active,
      is_default: this.is_default,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Create from database format
  static fromDBFormat(dbData) {
    return new Locale({
      id: dbData.id,
      code: dbData.code,
      name: dbData.name,
      native_name: dbData.native_name,
      direction: dbData.direction,
      is_active: dbData.is_active,
      is_default: dbData.is_default,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    });
  }

  // Create from API format
  static fromAPIFormat(apiData) {
    return new Locale({
      code: apiData.code,
      name: apiData.name,
      native_name: apiData.native_name,
      direction: apiData.direction,
      is_active: apiData.is_active,
      is_default: apiData.is_default
    });
  }

  // Convert to API format
  toAPIFormat() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      native_name: this.native_name,
      direction: this.direction,
      is_active: this.is_active,
      is_default: this.is_default,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Static methods for database operations
  static async create(locale) {
    const { query } = require('../db/connection');
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO locales (code, name, native_name, direction, is_active, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        locale.code,
        locale.name,
        locale.native_name,
        locale.direction,
        locale.is_active,
        locale.is_default,
        now,
        now
      ]
    );

    return Locale.fromDBFormat(result.rows[0]);
  }

  static async update(locale) {
    const { query } = require('../db/connection');
    const now = new Date().toISOString();

    const result = await query(
      `UPDATE locales
       SET name = $1, native_name = $2, direction = $3, is_active = $4, is_default = $5, updated_at = $6
       WHERE code = $7
       RETURNING *`,
      [
        locale.name,
        locale.native_name,
        locale.direction,
        locale.is_active,
        locale.is_default,
        now,
        locale.code
      ]
    );

    return Locale.fromDBFormat(result.rows[0]);
  }

  static async getAll() {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM locales ORDER BY name'
    );

    return result.rows.map(row => Locale.fromDBFormat(row));
  }

  static async getActive() {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM locales WHERE is_active = true ORDER BY name'
    );

    return result.rows.map(row => Locale.fromDBFormat(row));
  }

  static async getByCode(code) {
    const { query } = require('../db/connection');

    const result = await query(
      'SELECT * FROM locales WHERE code = $1',
      [code]
    );

    return result.rows.length > 0 ? Locale.fromDBFormat(result.rows[0]) : null;
  }
}

module.exports = Locale;