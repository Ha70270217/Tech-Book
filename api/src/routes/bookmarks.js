const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const Bookmark = require('../models/Bookmark');
const InputSanitizer = require('../utils/sanitizer');
const Joi = require('joi');

const router = express.Router();

// Get all bookmarks for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { chapterId, limit = 50, offset = 0 } = req.query;

    let queryStr = 'SELECT * FROM bookmarks WHERE user_id = $1';
    let queryParams = [req.user.id];

    if (chapterId) {
      queryStr += ' AND chapter_id = $2';
      queryParams = [req.user.id, InputSanitizer.sanitizeId(chapterId)];
    }

    queryStr += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);

    const bookmarks = result.rows.map(row => Bookmark.fromDBFormat(row));

    res.json({
      bookmarks,
      count: bookmarks.length
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new bookmark
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chapter_id, section_id, url, title, notes } = req.body;

    // Validate input
    const bookmarkData = {
      user_id: req.user.id,
      chapter_id,
      section_id,
      url,
      title,
      notes
    };

    const validation = Bookmark.validate(bookmarkData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Sanitize inputs
    const sanitizedData = {
      user_id: req.user.id,
      chapter_id: InputSanitizer.sanitizeId(chapter_id),
      section_id: section_id ? InputSanitizer.sanitizeId(section_id) : null,
      url: InputSanitizer.sanitizeUrl(url),
      title: InputSanitizer.sanitizeString(title),
      notes: InputSanitizer.sanitizeString(notes)
    };

    // Check if bookmark already exists for this URL and user
    const existingResult = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND url = $2',
      [sanitizedData.user_id, sanitizedData.url]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Bookmark already exists for this URL' });
    }

    const insertQuery = `
      INSERT INTO bookmarks (user_id, chapter_id, section_id, url, title, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(insertQuery, [
      sanitizedData.user_id,
      sanitizedData.chapter_id,
      sanitizedData.section_id,
      sanitizedData.url,
      sanitizedData.title,
      sanitizedData.notes,
      now,
      now
    ]);

    const bookmark = Bookmark.fromDBFormat(result.rows[0]);

    res.status(201).json({
      bookmark: bookmark.toAPIFormat()
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific bookmark
router.get('/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    // Sanitize the bookmark ID
    const sanitizedBookmarkId = InputSanitizer.sanitizeId(bookmarkId);

    const result = await query(
      'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
      [sanitizedBookmarkId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const bookmark = Bookmark.fromDBFormat(result.rows[0]);

    res.json({
      bookmark: bookmark.toAPIFormat()
    });
  } catch (error) {
    console.error('Get bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a bookmark
router.put('/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { section_id, title, notes } = req.body;

    // Sanitize the bookmark ID
    const sanitizedBookmarkId = InputSanitizer.sanitizeId(bookmarkId);

    // Get existing bookmark to ensure it belongs to the user
    const existingResult = await query(
      'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
      [sanitizedBookmarkId, req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 3; // Start from 3 since bookmarkId and userId are 1 and 2

    if (section_id !== undefined) {
      updateFields.push(`section_id = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeId(section_id));
      valueIndex++;
    }

    if (title !== undefined) {
      updateFields.push(`title = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(title));
      valueIndex++;
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(notes));
      valueIndex++;
    }

    // Update the updated_at time
    updateFields.push(`updated_at = $${valueIndex}`);
    updateValues.push(new Date().toISOString());
    valueIndex++;

    updateValues.push(sanitizedBookmarkId, req.user.id); // bookmarkId and userId

    const updateQuery = `
      UPDATE bookmarks
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex - 1} AND user_id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    const bookmark = Bookmark.fromDBFormat(result.rows[0]);

    res.json({
      bookmark: bookmark.toAPIFormat()
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a bookmark
router.delete('/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    // Sanitize the bookmark ID
    const sanitizedBookmarkId = InputSanitizer.sanitizeId(bookmarkId);

    const result = await query(
      'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2',
      [sanitizedBookmarkId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all bookmarks for a chapter
router.delete('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Sanitize the chapter ID
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    const result = await query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND chapter_id = $2',
      [req.user.id, sanitizedChapterId]
    );

    res.json({
      message: `Deleted ${result.rowCount} bookmarks for chapter ${sanitizedChapterId}`
    });
  } catch (error) {
    console.error('Delete chapter bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search bookmarks by title or notes
router.get('/search/:searchTerm', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Sanitize search term
    const sanitizedSearchTerm = InputSanitizer.sanitizeString(searchTerm);

    const searchQuery = `
      SELECT * FROM bookmarks
      WHERE user_id = $1
      AND (title ILIKE $2 OR notes ILIKE $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await query(searchQuery, [
      req.user.id,
      `%${sanitizedSearchTerm}%`,
      parseInt(limit),
      parseInt(offset)
    ]);

    const bookmarks = result.rows.map(row => Bookmark.fromDBFormat(row));

    res.json({
      bookmarks,
      count: bookmarks.length
    });
  } catch (error) {
    console.error('Search bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;