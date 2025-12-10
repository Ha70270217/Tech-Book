const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const TranslationController = require('../controllers/TranslationController');
const { query } = require('../db/connection');
const Translation = require('../models/Translation');
const Locale = require('../models/Locale');
const InputSanitizer = require('../utils/sanitizer');
const Joi = require('joi');

const router = express.Router();

// Get all supported locales
router.get('/locales', async (req, res) => {
  try {
    const { isActive } = req.query;

    let queryStr = 'SELECT * FROM locales';
    let queryParams = [];

    if (isActive !== undefined) {
      queryStr += ` WHERE is_active = $${queryParams.length + 1}`;
      queryParams.push(isActive === 'true');
    }

    queryStr += ' ORDER BY name';

    const result = await query(queryStr, queryParams);
    const locales = result.rows.map(row => Locale.fromDBFormat(row));

    res.json({
      locales
    });
  } catch (error) {
    console.error('Get locales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific locale
router.get('/locales/:localeCode', async (req, res) => {
  try {
    const { localeCode } = req.params;

    // Sanitize the locale code
    const sanitizedLocaleCode = InputSanitizer.sanitizeId(localeCode);

    const result = await query(
      'SELECT * FROM locales WHERE code = $1',
      [sanitizedLocaleCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Locale not found' });
    }

    const locale = Locale.fromDBFormat(result.rows[0]);

    res.json({
      locale: locale.toAPIFormat()
    });
  } catch (error) {
    console.error('Get locale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new locale (admin only)
router.post('/locales', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code, name, native_name, direction } = req.body;

    // Validate input
    const localeData = {
      code,
      name,
      native_name,
      direction
    };

    const validation = Locale.validate(localeData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Sanitize inputs
    const sanitizedData = {
      code: InputSanitizer.sanitizeString(code),
      name: InputSanitizer.sanitizeString(name),
      native_name: InputSanitizer.sanitizeString(native_name),
      direction: direction ? InputSanitizer.sanitizeString(direction) : 'ltr'
    };

    // Check if locale already exists
    const existingResult = await query(
      'SELECT id FROM locales WHERE code = $1',
      [sanitizedData.code]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Locale already exists' });
    }

    const insertQuery = `
      INSERT INTO locales (code, name, native_name, direction, is_active, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(insertQuery, [
      sanitizedData.code,
      sanitizedData.name,
      sanitizedData.native_name,
      sanitizedData.direction,
      true, // is_active
      false, // is_default
      now,
      now
    ]);

    const locale = Locale.fromDBFormat(result.rows[0]);

    res.status(201).json({
      locale: locale.toAPIFormat()
    });
  } catch (error) {
    console.error('Create locale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a locale (admin only)
router.put('/locales/:localeCode', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { localeCode } = req.params;
    const { name, native_name, direction, is_active, is_default } = req.body;

    // Sanitize the locale code
    const sanitizedLocaleCode = InputSanitizer.sanitizeId(localeCode);

    // Get existing locale to ensure it exists
    const existingResult = await query(
      'SELECT * FROM locales WHERE code = $1',
      [sanitizedLocaleCode]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Locale not found' });
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 2; // Start from 2 since localeCode is 1

    if (name !== undefined) {
      updateFields.push(`name = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(name));
      valueIndex++;
    }

    if (native_name !== undefined) {
      updateFields.push(`native_name = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(native_name));
      valueIndex++;
    }

    if (direction !== undefined) {
      updateFields.push(`direction = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(direction));
      valueIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      updateValues.push(is_active);
      valueIndex++;
    }

    if (is_default !== undefined) {
      updateFields.push(`is_default = $${valueIndex}`);
      updateValues.push(is_default);
      valueIndex++;
    }

    // Update the updated_at time
    updateFields.push(`updated_at = $${valueIndex}`);
    updateValues.push(new Date().toISOString());
    valueIndex++;

    updateValues.push(sanitizedLocaleCode); // localeCode

    // If setting as default, unset other defaults
    if (is_default === true) {
      await query('UPDATE locales SET is_default = false WHERE code != $1', [sanitizedLocaleCode]);
    }

    const updateQuery = `
      UPDATE locales
      SET ${updateFields.join(', ')}
      WHERE code = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    const locale = Locale.fromDBFormat(result.rows[0]);

    res.json({
      locale: locale.toAPIFormat()
    });
  } catch (error) {
    console.error('Update locale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get translations for a specific locale and context
router.get('/translations/:localeCode', async (req, res) => {
  try {
    const { localeCode } = req.params;
    const { context, status = 'approved' } = req.query;

    // Sanitize inputs
    const sanitizedLocaleCode = InputSanitizer.sanitizeId(localeCode);
    const sanitizedContext = context ? InputSanitizer.sanitizeString(context) : null;
    const sanitizedStatus = status ? InputSanitizer.sanitizeString(status) : 'approved';

    let queryStr = 'SELECT * FROM translations WHERE target_language = $1 AND status = $2';
    let queryParams = [sanitizedLocaleCode, sanitizedStatus];

    if (sanitizedContext) {
      queryStr += ' AND context = $' + (queryParams.length + 1);
      queryParams.push(sanitizedContext);
    }

    queryStr += ' ORDER BY key';

    const result = await query(queryStr, queryParams);
    const translations = result.rows.map(row => Translation.fromDBFormat(row));

    res.json({
      translations
    });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific translation
router.get('/translations/:localeCode/:key', async (req, res) => {
  try {
    const { localeCode, key } = req.params;

    // Sanitize inputs
    const sanitizedLocaleCode = InputSanitizer.sanitizeId(localeCode);
    const sanitizedKey = InputSanitizer.sanitizeString(key);

    const result = await query(
      'SELECT * FROM translations WHERE target_language = $1 AND key = $2 AND status = $3',
      [sanitizedLocaleCode, sanitizedKey, 'approved']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    const translation = Translation.fromDBFormat(result.rows[0]);

    res.json({
      translation: translation.toAPIFormat()
    });
  } catch (error) {
    console.error('Get translation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new translation (admin or translator only)
router.post('/translations', authenticateToken, requireRole(['admin', 'translator']), async (req, res) => {
  try {
    const { key, source_text, target_language, translated_text, context } = req.body;

    // Validate input
    const translationData = {
      key,
      source_text,
      target_language,
      translated_text,
      context
    };

    const validation = Translation.validate(translationData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Sanitize inputs
    const sanitizedData = {
      key: InputSanitizer.sanitizeString(key),
      source_text: InputSanitizer.sanitizeString(source_text),
      target_language: InputSanitizer.sanitizeString(target_language),
      translated_text: InputSanitizer.sanitizeString(translated_text),
      context: context ? InputSanitizer.sanitizeString(context) : ''
    };

    // Check if translation already exists for this key and language
    const existingResult = await query(
      'SELECT id FROM translations WHERE key = $1 AND target_language = $2',
      [sanitizedData.key, sanitizedData.target_language]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Translation already exists for this key and language' });
    }

    const insertQuery = `
      INSERT INTO translations (key, source_text, target_language, translated_text, context, status, created_at, updated_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(insertQuery, [
      sanitizedData.key,
      sanitizedData.source_text,
      sanitizedData.target_language,
      sanitizedData.translated_text,
      sanitizedData.context,
      'pending', // status - requires approval
      now,
      now,
      req.user.id // created_by
    ]);

    const translation = Translation.fromDBFormat(result.rows[0]);

    res.status(201).json({
      translation: translation.toAPIFormat()
    });
  } catch (error) {
    console.error('Create translation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a translation (admin or translator only)
router.put('/translations/:id', authenticateToken, requireRole(['admin', 'translator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { translated_text, context, status } = req.body;

    // Sanitize the ID
    const sanitizedId = InputSanitizer.sanitizeId(id);

    // Get existing translation to ensure it exists
    const existingResult = await query(
      'SELECT * FROM translations WHERE id = $1',
      [sanitizedId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 2; // Start from 2 since id is 1

    if (translated_text !== undefined) {
      updateFields.push(`translated_text = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(translated_text));
      valueIndex++;
    }

    if (context !== undefined) {
      updateFields.push(`context = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(context));
      valueIndex++;
    }

    if (status !== undefined && req.user.role === 'admin') {
      // Only admins can change status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updateFields.push(`status = $${valueIndex}`);
      updateValues.push(status);
      valueIndex++;
    }

    // Update the updated_at time
    updateFields.push(`updated_at = $${valueIndex}`);
    updateValues.push(new Date().toISOString());
    valueIndex++;

    updateValues.push(sanitizedId); // id

    const updateQuery = `
      UPDATE translations
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    const translation = Translation.fromDBFormat(result.rows[0]);

    res.json({
      translation: translation.toAPIFormat()
    });
  } catch (error) {
    console.error('Update translation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a translation (admin only)
router.put('/translations/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Sanitize the ID
    const sanitizedId = InputSanitizer.sanitizeId(id);

    // Get existing translation to ensure it exists
    const existingResult = await query(
      'SELECT * FROM translations WHERE id = $1',
      [sanitizedId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    const updateQuery = `
      UPDATE translations
      SET status = 'approved', approved_by = $1, approved_at = $2, updated_at = $3
      WHERE id = $4
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(updateQuery, [
      req.user.id, // approved_by
      now, // approved_at
      now, // updated_at
      sanitizedId // id
    ]);

    const translation = Translation.fromDBFormat(result.rows[0]);

    res.json({
      translation: translation.toAPIFormat(),
      message: 'Translation approved successfully'
    });
  } catch (error) {
    console.error('Approve translation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all translations (admin only)
router.get('/translations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, target_language, context, limit = 50, offset = 0 } = req.query;

    let queryStr = 'SELECT * FROM translations WHERE 1=1';
    let queryParams = [];

    if (status) {
      queryStr += ' AND status = $' + (queryParams.length + 1);
      queryParams.push(InputSanitizer.sanitizeString(status));
    }

    if (target_language) {
      queryStr += ' AND target_language = $' + (queryParams.length + 1);
      queryParams.push(InputSanitizer.sanitizeString(target_language));
    }

    if (context) {
      queryStr += ' AND context = $' + (queryParams.length + 1);
      queryParams.push(InputSanitizer.sanitizeString(context));
    }

    queryStr += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);
    const translations = result.rows.map(row => Translation.fromDBFormat(row));

    res.json({
      translations,
      count: translations.length
    });
  } catch (error) {
    console.error('Get all translations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get translations for content ID and language (public)
router.get('/translations/:contentId/:language', async (req, res) => {
  try {
    const { contentId, language } = req.params;
    const translation = await Translation.getByContentAndLanguage(contentId, language);

    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: translation.toAPIFormat()
    });
  } catch (error) {
    console.error('Get translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation',
      error: error.message
    });
  }
});

// Get translations with query parameters (public)
router.get('/translations', async (req, res) => {
  try {
    const { contentId, language } = req.query;
    let translations = [];

    if (contentId && language) {
      translations = await Translation.getForContentAndLanguage(contentId, language);
    } else if (contentId) {
      translations = await Translation.getForContent(contentId);
    } else if (language) {
      translations = await Translation.getForLanguage(language);
    } else {
      translations = await Translation.getAll();
    }

    res.status(200).json({
      success: true,
      data: translations.map(translation => translation.toAPIFormat())
    });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translations',
      error: error.message
    });
  }
});

// Create or update translation (admin or translator only)
router.post('/translations', authenticateToken, requireRole(['admin', 'translator']), async (req, res) => {
  try {
    const { content_id, language_code, translated_text, review_status } = req.body;

    // Validate required fields
    if (!content_id || !language_code || !translated_text) {
      return res.status(400).json({
        success: false,
        message: 'Content ID, language code, and translated text are required'
      });
    }

    // Check if translation already exists
    const existingTranslation = await Translation.getByContentAndLanguage(content_id, language_code);

    let translation;
    if (existingTranslation) {
      // Update existing translation
      existingTranslation.translated_text = translated_text;
      existingTranslation.review_status = review_status || 'pending';
      existingTranslation.updated_at = new Date().toISOString();

      translation = await Translation.update(existingTranslation);
    } else {
      // Create new translation
      const newTranslation = new Translation({
        content_id,
        language_code,
        translated_text,
        review_status: review_status || 'pending'
      });

      const validation = Translation.validate(newTranslation.toDBFormat());
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid translation data',
          errors: validation.errors
        });
      }

      translation = await Translation.create(newTranslation);
    }

    res.status(200).json({
      success: true,
      data: translation.toAPIFormat(),
      message: existingTranslation ? 'Translation updated successfully' : 'Translation created successfully'
    });
  } catch (error) {
    console.error('Create/update translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create or update translation',
      error: error.message
    });
  }
});

// Get content synchronization status
router.get('/content/:contentId/sync-status', async (req, res) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'Content ID is required'
      });
    }

    // Get all translations for this content ID
    const translations = await Translation.getForContent(contentId);

    // Get all active locales
    const locales = await Locale.getActive();

    // Create sync status for each locale
    const syncStatus = locales.map(locale => {
      const translation = translations.find(t => t.language_code === locale.code);
      return {
        locale: locale.toAPIFormat(),
        isTranslated: !!translation,
        reviewStatus: translation ? translation.review_status : 'missing',
        lastUpdated: translation ? translation.updated_at : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        contentId,
        syncStatus
      }
    });
  } catch (error) {
    console.error('Get content sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content sync status',
      error: error.message
    });
  }
});

// Submit translation for review
router.post('/translations/submit', authenticateToken, async (req, res) => {
  try {
    const { content_id, language_code, translated_text } = req.body;

    if (!content_id || !language_code || !translated_text) {
      return res.status(400).json({
        success: false,
        message: 'Content ID, language code, and translated text are required'
      });
    }

    // Create translation with 'pending' review status
    const newTranslation = new Translation({
      content_id,
      language_code,
      translated_text,
      review_status: 'pending'
    });

    const validation = Translation.validate(newTranslation.toDBFormat());
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid translation data',
        errors: validation.errors
      });
    }

    const translation = await Translation.create(newTranslation);

    res.status(200).json({
      success: true,
      data: translation.toAPIFormat(),
      message: 'Translation submitted for review successfully'
    });
  } catch (error) {
    console.error('Submit translation for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit translation for review',
      error: error.message
    });
  }
});

// Update translation review status (admin only)
router.put('/translations/:translationId/review', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { translationId } = req.params;
    const { review_status, reviewer_notes } = req.body;

    if (!translationId || !review_status) {
      return res.status(400).json({
        success: false,
        message: 'Translation ID and review status are required'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(review_status)) {
      return res.status(400).json({
        success: false,
        message: `Review status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existingTranslation = await Translation.getById(translationId);
    if (!existingTranslation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }

    existingTranslation.review_status = review_status;
    existingTranslation.reviewer_notes = reviewer_notes;
    existingTranslation.updated_at = new Date().toISOString();

    const updatedTranslation = await Translation.update(existingTranslation);

    res.status(200).json({
      success: true,
      data: updatedTranslation.toAPIFormat(),
      message: 'Translation review status updated successfully'
    });
  } catch (error) {
    console.error('Update translation review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update translation review status',
      error: error.message
    });
  }
});

module.exports = router;