const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const UserProgress = require('../models/UserProgress');
const InputSanitizer = require('../utils/sanitizer');
const Joi = require('joi');

const router = express.Router();

// Get user progress for all chapters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.query; // Optional: get progress for specific chapter

    let queryStr = 'SELECT * FROM user_progress WHERE user_id = $1';
    let queryParams = [req.user.id];

    if (chapterId) {
      queryStr += ' AND chapter_id = $2';
      queryParams = [req.user.id, chapterId];
    }

    queryStr += ' ORDER BY chapter_id, section_id';

    const result = await query(queryStr, queryParams);

    const progressData = result.rows.map(row => UserProgress.fromDBFormat(row));

    res.json({
      progress: progressData,
      totalChapters: [...new Set(progressData.map(p => p.chapter_id))].length
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get progress for a specific chapter
router.get('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Sanitize the chapter ID
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    const result = await query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND chapter_id = $2',
      [req.user.id, sanitizedChapterId]
    );

    if (result.rows.length === 0) {
      return res.json({
        progress: null,
        message: 'No progress found for this chapter'
      });
    }

    res.json({
      progress: UserProgress.fromDBFormat(result.rows[0])
    });
  } catch (error) {
    console.error('Get chapter progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update progress for a chapter
router.put('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { completion_percentage, section_id, status } = req.body;

    // Validate input
    const progressSchema = Joi.object({
      completion_percentage: Joi.number().min(0).max(100).required(),
      section_id: Joi.string().optional(),
      status: Joi.string().valid('not_started', 'in_progress', 'completed').optional()
    });

    const { error } = progressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Sanitize inputs
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);
    const sanitizedSectionId = section_id ? InputSanitizer.sanitizeId(section_id) : null;

    // Check if progress record exists
    const existingResult = await query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND chapter_id = $2',
      [req.user.id, sanitizedChapterId]
    );

    let result;
    const now = new Date().toISOString();

    if (existingResult.rows.length > 0) {
      // Update existing progress
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 3; // Start from 3 since user_id and chapter_id are 1 and 2

      updateFields.push(`completion_percentage = $${valueIndex}`);
      updateValues.push(completion_percentage);
      valueIndex++;

      if (sanitizedSectionId) {
        updateFields.push(`section_id = $${valueIndex}`);
        updateValues.push(sanitizedSectionId);
        valueIndex++;
      }

      if (status) {
        updateFields.push(`completion_status = $${valueIndex}`);
        updateValues.push(status);
        valueIndex++;
      }

      // Update the last accessed time
      updateFields.push(`last_accessed_at = $${valueIndex}`);
      updateValues.push(now);
      valueIndex++;

      // Update the updated_at time
      updateFields.push(`updated_at = $${valueIndex}`);
      updateValues.push(now);
      valueIndex++;

      // If status is 'completed', set completed_at
      if (status === 'completed' || completion_percentage === 100) {
        updateFields.push(`completed_at = $${valueIndex}`);
        updateValues.push(now);
        valueIndex++;
      }

      updateValues.push(req.user.id, sanitizedChapterId); // user_id and chapter_id

      const updateQuery = `
        UPDATE user_progress
        SET ${updateFields.join(', ')}
        WHERE user_id = $${valueIndex - 1} AND chapter_id = $${valueIndex}
        RETURNING *
      `;

      result = await query(updateQuery, updateValues);
    } else {
      // Create new progress record
      let completionStatus = status || 'in_progress';
      if (completion_percentage === 100) {
        completionStatus = 'completed';
      } else if (completion_percentage > 0) {
        completionStatus = 'in_progress';
      } else {
        completionStatus = 'not_started';
      }

      let completedAt = null;
      if (completionStatus === 'completed') {
        completedAt = now;
      }

      const insertQuery = `
        INSERT INTO user_progress
        (user_id, chapter_id, section_id, completion_status, completion_percentage, last_accessed_at, completed_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      result = await query(insertQuery, [
        req.user.id,
        sanitizedChapterId,
        sanitizedSectionId,
        completionStatus,
        completion_percentage,
        now,
        completedAt,
        now,
        now
      ]);
    }

    res.json({
      progress: UserProgress.fromDBFormat(result.rows[0])
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall progress summary for the user
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        chapter_id,
        completion_percentage,
        completion_status,
        last_accessed_at,
        completed_at
      FROM user_progress
      WHERE user_id = $1
      ORDER BY chapter_id
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.json({
        summary: {
          totalChapters: 0,
          completedChapters: 0,
          inProgressChapters: 0,
          overallProgress: 0,
          chapters: []
        }
      });
    }

    const progressRecords = result.rows.map(row => UserProgress.fromDBFormat(row));

    const completedChapters = progressRecords.filter(p => p.completion_status === 'completed').length;
    const inProgressChapters = progressRecords.filter(p => p.completion_status === 'in_progress').length;
    const totalChapters = progressRecords.length;

    // Calculate overall progress as average of all chapter progresses
    const overallProgress = totalChapters > 0
      ? Math.round(progressRecords.reduce((sum, p) => sum + p.completion_percentage, 0) / totalChapters)
      : 0;

    res.json({
      summary: {
        totalChapters,
        completedChapters,
        inProgressChapters,
        overallProgress,
        chapters: progressRecords
      }
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset progress for a chapter
router.delete('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Sanitize the chapter ID
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    await query(
      'DELETE FROM user_progress WHERE user_id = $1 AND chapter_id = $2',
      [req.user.id, sanitizedChapterId]
    );

    res.json({
      message: 'Chapter progress reset successfully'
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;