// TranslationController.js - Controller for managing translations and localization

const Translation = require('../models/Translation');
const Locale = require('../models/Locale');

class TranslationController {
  // Get all translations for a specific content ID and language
  static async getTranslations(req, res) {
    try {
      const { contentId, language } = req.query;

      let translations = [];

      if (contentId && language) {
        // Get translations for specific content ID and language
        translations = await Translation.getForContentAndLanguage(contentId, language);
      } else if (contentId) {
        // Get all translations for specific content ID across all languages
        translations = await Translation.getForContent(contentId);
      } else if (language) {
        // Get all translations for specific language
        translations = await Translation.getForLanguage(language);
      } else {
        // Get all translations
        translations = await Translation.getAll();
      }

      res.status(200).json({
        success: true,
        data: translations.map(translation => translation.toAPIFormat())
      });
    } catch (error) {
      console.error('Error fetching translations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch translations',
        error: error.message
      });
    }
  }

  // Create or update a translation
  static async createOrUpdateTranslation(req, res) {
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
      console.error('Error creating/updating translation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create or update translation',
        error: error.message
      });
    }
  }

  // Get available locales
  static async getLocales(req, res) {
    try {
      const { isActive } = req.query;
      let locales;

      if (isActive === 'true' || isActive === true) {
        locales = await Locale.getActive();
      } else {
        locales = await Locale.getAll();
      }

      res.status(200).json({
        success: true,
        data: locales.map(locale => locale.toAPIFormat())
      });
    } catch (error) {
      console.error('Error fetching locales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch locales',
        error: error.message
      });
    }
  }

  // Get translation for specific content in specific language
  static async getTranslationForContent(req, res) {
    try {
      const { contentId, language } = req.params;

      if (!contentId || !language) {
        return res.status(400).json({
          success: false,
          message: 'Content ID and language are required'
        });
      }

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
      console.error('Error fetching translation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch translation',
        error: error.message
      });
    }
  }

  // Get content synchronization status
  static async getContentSyncStatus(req, res) {
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
      console.error('Error fetching content sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content sync status',
        error: error.message
      });
    }
  }

  // Submit translation for review
  static async submitTranslationForReview(req, res) {
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
      console.error('Error submitting translation for review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit translation for review',
        error: error.message
      });
    }
  }

  // Update translation review status
  static async updateTranslationReviewStatus(req, res) {
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
      console.error('Error updating translation review status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update translation review status',
        error: error.message
      });
    }
  }
}

module.exports = TranslationController;