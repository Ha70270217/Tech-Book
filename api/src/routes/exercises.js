const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const Exercise = require('../models/Exercise');
const InputSanitizer = require('../utils/sanitizer');
const Joi = require('joi');

const router = express.Router();

// Get exercises for a chapter
router.get('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { sectionId, type, difficulty, limit = 50, offset = 0 } = req.query;

    // Sanitize inputs
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);
    const sanitizedSectionId = sectionId ? InputSanitizer.sanitizeId(sectionId) : null;
    const sanitizedType = type ? InputSanitizer.sanitizeString(type) : null;
    const sanitizedDifficulty = difficulty ? InputSanitizer.sanitizeString(difficulty) : null;

    let queryStr = 'SELECT * FROM exercises WHERE chapter_id = $1 AND is_active = true';
    let queryParams = [sanitizedChapterId];

    if (sanitizedSectionId) {
      queryStr += ' AND section_id = $' + (queryParams.length + 1);
      queryParams.push(sanitizedSectionId);
    }

    if (sanitizedType) {
      queryStr += ' AND type = $' + (queryParams.length + 1);
      queryParams.push(sanitizedType);
    }

    if (sanitizedDifficulty) {
      queryStr += ' AND difficulty = $' + (queryParams.length + 1);
      queryParams.push(sanitizedDifficulty);
    }

    queryStr += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);

    const exercises = result.rows.map(row => Exercise.fromDBFormat(row));

    res.json({
      exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific exercise
router.get('/:exerciseId', authenticateToken, async (req, res) => {
  try {
    const { exerciseId } = req.params;

    // Sanitize the exercise ID
    const sanitizedExerciseId = InputSanitizer.sanitizeId(exerciseId);

    const result = await query(
      'SELECT * FROM exercises WHERE id = $1 AND is_active = true',
      [sanitizedExerciseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const exercise = Exercise.fromDBFormat(result.rows[0]);

    res.json({
      exercise: exercise.toAPIFormat()
    });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new exercise (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { chapter_id, section_id, type, title, description, question, options, correct_answer, explanation, difficulty, tags } = req.body;

    // Validate input
    const exerciseData = {
      chapter_id,
      section_id,
      type,
      title,
      description,
      question,
      options,
      correct_answer,
      explanation,
      difficulty,
      tags
    };

    const validation = Exercise.validate(exerciseData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Sanitize inputs
    const sanitizedData = {
      chapter_id: InputSanitizer.sanitizeId(chapter_id),
      section_id: section_id ? InputSanitizer.sanitizeId(section_id) : null,
      type: InputSanitizer.sanitizeString(type),
      title: InputSanitizer.sanitizeString(title),
      description: InputSanitizer.sanitizeString(description),
      question: InputSanitizer.sanitizeString(question),
      options: Array.isArray(options) ? options.map(opt => InputSanitizer.sanitizeString(opt)) : [],
      correct_answer: correct_answer ? InputSanitizer.sanitizeString(correct_answer) : null,
      explanation: InputSanitizer.sanitizeString(explanation),
      difficulty: difficulty ? InputSanitizer.sanitizeString(difficulty) : 'medium',
      tags: Array.isArray(tags) ? tags.map(tag => InputSanitizer.sanitizeString(tag)) : []
    };

    const insertQuery = `
      INSERT INTO exercises (chapter_id, section_id, type, title, description, question, options, correct_answer, explanation, difficulty, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(insertQuery, [
      sanitizedData.chapter_id,
      sanitizedData.section_id,
      sanitizedData.type,
      sanitizedData.title,
      sanitizedData.description,
      sanitizedData.question,
      JSON.stringify(sanitizedData.options),
      sanitizedData.correct_answer,
      sanitizedData.explanation,
      sanitizedData.difficulty,
      JSON.stringify(sanitizedData.tags),
      now,
      now
    ]);

    const exercise = Exercise.fromDBFormat(result.rows[0]);

    res.status(201).json({
      exercise: exercise.toAPIFormat()
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an exercise (admin only)
router.put('/:exerciseId', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { exerciseId } = req.params;
    const { section_id, type, title, description, question, options, correct_answer, explanation, difficulty, tags, is_active } = req.body;

    // Sanitize the exercise ID
    const sanitizedExerciseId = InputSanitizer.sanitizeId(exerciseId);

    // Get existing exercise to ensure it exists
    const existingResult = await query(
      'SELECT * FROM exercises WHERE id = $1',
      [sanitizedExerciseId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 2; // Start from 2 since exerciseId is 1

    if (section_id !== undefined) {
      updateFields.push(`section_id = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeId(section_id));
      valueIndex++;
    }

    if (type !== undefined) {
      updateFields.push(`type = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(type));
      valueIndex++;
    }

    if (title !== undefined) {
      updateFields.push(`title = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(title));
      valueIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(description));
      valueIndex++;
    }

    if (question !== undefined) {
      updateFields.push(`question = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(question));
      valueIndex++;
    }

    if (options !== undefined) {
      updateFields.push(`options = $${valueIndex}`);
      updateValues.push(JSON.stringify(options.map(opt => InputSanitizer.sanitizeString(opt))));
      valueIndex++;
    }

    if (correct_answer !== undefined) {
      updateFields.push(`correct_answer = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(correct_answer));
      valueIndex++;
    }

    if (explanation !== undefined) {
      updateFields.push(`explanation = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(explanation));
      valueIndex++;
    }

    if (difficulty !== undefined) {
      updateFields.push(`difficulty = $${valueIndex}`);
      updateValues.push(InputSanitizer.sanitizeString(difficulty));
      valueIndex++;
    }

    if (tags !== undefined) {
      updateFields.push(`tags = $${valueIndex}`);
      updateValues.push(JSON.stringify(tags.map(tag => InputSanitizer.sanitizeString(tag))));
      valueIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      updateValues.push(is_active);
      valueIndex++;
    }

    // Update the updated_at time
    updateFields.push(`updated_at = $${valueIndex}`);
    updateValues.push(new Date().toISOString());
    valueIndex++;

    updateValues.push(sanitizedExerciseId); // exerciseId

    const updateQuery = `
      UPDATE exercises
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    const exercise = Exercise.fromDBFormat(result.rows[0]);

    res.json({
      exercise: exercise.toAPIFormat()
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an exercise (admin only)
router.delete('/:exerciseId', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { exerciseId } = req.params;

    // Sanitize the exercise ID
    const sanitizedExerciseId = InputSanitizer.sanitizeId(exerciseId);

    const result = await query(
      'DELETE FROM exercises WHERE id = $1',
      [sanitizedExerciseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get exercises by difficulty level
router.get('/difficulty/:difficulty', authenticateToken, async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { chapterId, limit = 50, offset = 0 } = req.query;

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Sanitize inputs
    const sanitizedDifficulty = InputSanitizer.sanitizeString(difficulty);
    const sanitizedChapterId = chapterId ? InputSanitizer.sanitizeId(chapterId) : null;

    let queryStr = 'SELECT * FROM exercises WHERE difficulty = $1 AND is_active = true';
    let queryParams = [sanitizedDifficulty];

    if (sanitizedChapterId) {
      queryStr += ' AND chapter_id = $' + (queryParams.length + 1);
      queryParams.push(sanitizedChapterId);
    }

    queryStr += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);

    const exercises = result.rows.map(row => Exercise.fromDBFormat(row));

    res.json({
      exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('Get exercises by difficulty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search exercises by title or question
router.get('/search/:searchTerm', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { chapterId, type, limit = 20, offset = 0 } = req.query;

    // Sanitize search term
    const sanitizedSearchTerm = InputSanitizer.sanitizeString(searchTerm);
    const sanitizedChapterId = chapterId ? InputSanitizer.sanitizeId(chapterId) : null;
    const sanitizedType = type ? InputSanitizer.sanitizeString(type) : null;

    let searchQuery = `
      SELECT * FROM exercises
      WHERE is_active = true
      AND (title ILIKE $1 OR question ILIKE $1)
    `;
    let queryParams = [`%${sanitizedSearchTerm}%`];

    if (sanitizedChapterId) {
      searchQuery += ` AND chapter_id = $${queryParams.length + 1}`;
      queryParams.push(sanitizedChapterId);
    }

    if (sanitizedType) {
      searchQuery += ` AND type = $${queryParams.length + 1}`;
      queryParams.push(sanitizedType);
    }

    searchQuery += ` ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(searchQuery, queryParams);

    const exercises = result.rows.map(row => Exercise.fromDBFormat(row));

    res.json({
      exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('Search exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;