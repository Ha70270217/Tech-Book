const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const AssessmentResponse = require('../models/AssessmentResponse');
const Exercise = require('../models/Exercise');
const InputSanitizer = require('../utils/sanitizer');
const Joi = require('joi');

const router = express.Router();

// Submit an assessment response
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { exercise_id, chapter_id, response, time_spent } = req.body;

    // Validate input
    const responseSchema = Joi.object({
      exercise_id: Joi.number().integer().required(),
      chapter_id: Joi.string().required(),
      response: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.array()).required(),
      time_spent: Joi.number().integer().min(0).optional()
    });

    const { error } = responseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get the exercise to check if it exists and get the correct answer
    const exerciseResult = await query(
      'SELECT * FROM exercises WHERE id = $1 AND is_active = true',
      [exercise_id]
    );

    if (exerciseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const exercise = Exercise.fromDBFormat(exerciseResult.rows[0]);

    // Calculate if the response is correct
    let is_correct = null;
    let score = 0;

    if (exercise.type === 'multiple_choice') {
      // For multiple choice, compare the response with the correct answer
      is_correct = response.toString() === exercise.correct_answer;
      score = is_correct ? 100 : 0;
    } else if (exercise.type === 'short_answer' || exercise.type === 'essay') {
      // For short answer and essay, we can't automatically grade
      // Set to null to indicate manual grading is needed
      is_correct = null;
      score = 0; // Will be set by instructor
    } else if (exercise.type === 'coding') {
      // For coding exercises, we would have a more complex validation
      // For now, we'll set to null to indicate manual grading is needed
      is_correct = null;
      score = 0; // Will be set by instructor or automated tests
    }

    // Sanitize inputs
    const sanitizedData = {
      user_id: req.user.id,
      exercise_id: exercise_id,
      chapter_id: InputSanitizer.sanitizeId(chapter_id),
      response: response,
      is_correct: is_correct,
      score: score,
      time_spent: time_spent || 0
    };

    // Get the attempt number
    const attemptResult = await query(
      'SELECT COUNT(*) as count FROM assessment_responses WHERE user_id = $1 AND exercise_id = $2',
      [sanitizedData.user_id, sanitizedData.exercise_id]
    );
    const attempt_number = parseInt(attemptResult.rows[0].count) + 1;

    const insertQuery = `
      INSERT INTO assessment_responses (user_id, exercise_id, chapter_id, response, is_correct, score, attempt_number, submitted_at, time_spent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const now = new Date().toISOString();
    const result = await query(insertQuery, [
      sanitizedData.user_id,
      sanitizedData.exercise_id,
      sanitizedData.chapter_id,
      sanitizedData.response,
      sanitizedData.is_correct,
      sanitizedData.score,
      attempt_number,
      now,
      sanitizedData.time_spent
    ]);

    const assessmentResponse = AssessmentResponse.fromDBFormat(result.rows[0]);

    res.status(201).json({
      response: assessmentResponse.toAPIFormat(),
      is_correct: is_correct,
      score: score
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's responses for a specific exercise
router.get('/exercise/:exerciseId', authenticateToken, async (req, res) => {
  try {
    const { exerciseId } = req.params;

    // Sanitize the exercise ID
    const sanitizedExerciseId = InputSanitizer.sanitizeId(exerciseId);

    const result = await query(
      'SELECT * FROM assessment_responses WHERE user_id = $1 AND exercise_id = $2 ORDER BY submitted_at DESC',
      [req.user.id, sanitizedExerciseId]
    );

    const responses = result.rows.map(row => AssessmentResponse.fromDBFormat(row));

    res.json({
      responses
    });
  } catch (error) {
    console.error('Get exercise responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's responses for a chapter
router.get('/chapter/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Sanitize the chapter ID
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    const result = await query(
      'SELECT * FROM assessment_responses WHERE user_id = $1 AND chapter_id = $2 ORDER BY submitted_at DESC',
      [req.user.id, sanitizedChapterId]
    );

    const responses = result.rows.map(row => AssessmentResponse.fromDBFormat(row));

    res.json({
      responses
    });
  } catch (error) {
    console.error('Get chapter responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's assessment history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { chapterId, exerciseId, limit = 50, offset = 0 } = req.query;

    let queryStr = 'SELECT * FROM assessment_responses WHERE user_id = $1';
    let queryParams = [req.user.id];

    if (chapterId) {
      queryStr += ' AND chapter_id = $' + (queryParams.length + 1);
      queryParams.push(InputSanitizer.sanitizeId(chapterId));
    }

    if (exerciseId) {
      queryStr += ' AND exercise_id = $' + (queryParams.length + 1);
      queryParams.push(InputSanitizer.sanitizeId(exerciseId));
    }

    queryStr += ' ORDER BY submitted_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);

    const responses = result.rows.map(row => AssessmentResponse.fromDBFormat(row));

    res.json({
      responses,
      count: responses.length
    });
  } catch (error) {
    console.error('Get assessment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assessment statistics for a user
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has permission to view these stats
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get overall statistics
    const statsResult = await query(`
      SELECT
        COUNT(*) as total_responses,
        AVG(score) as average_score,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN is_correct = false THEN 1 ELSE 0 END) as incorrect_answers,
        AVG(time_spent) as average_time_spent
      FROM assessment_responses
      WHERE user_id = $1
    `, [userId]);

    const stats = statsResult.rows[0];

    // Get statistics by chapter
    const chapterStatsResult = await query(`
      SELECT
        chapter_id,
        COUNT(*) as total_responses,
        AVG(score) as average_score,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct_answers
      FROM assessment_responses
      WHERE user_id = $1
      GROUP BY chapter_id
      ORDER BY chapter_id
    `, [userId]);

    const chapterStats = chapterStatsResult.rows;

    res.json({
      overall: {
        total_responses: parseInt(stats.total_responses),
        average_score: stats.average_score ? parseFloat(stats.average_score).toFixed(2) : 0,
        correct_answers: parseInt(stats.correct_answers),
        incorrect_answers: parseInt(stats.incorrect_answers),
        average_time_spent: stats.average_time_spent ? Math.round(parseFloat(stats.average_time_spent)) : 0
      },
      by_chapter: chapterStats
    });
  } catch (error) {
    console.error('Get assessment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a response score (for instructors/admins)
router.put('/:responseId', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin or instructor role
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { responseId } = req.params;
    const { score, is_correct, feedback } = req.body;

    // Validate inputs
    if (score !== undefined && (score < 0 || score > 100)) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    // Sanitize inputs
    const sanitizedResponseId = InputSanitizer.sanitizeId(responseId);
    const sanitizedScore = score !== undefined ? parseFloat(score) : undefined;
    const sanitizedIsCorrect = is_correct !== undefined ? Boolean(is_correct) : undefined;
    const sanitizedFeedback = feedback ? InputSanitizer.sanitizeString(feedback) : undefined;

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 2; // Start from 2 since responseId is 1

    if (sanitizedScore !== undefined) {
      updateFields.push(`score = $${valueIndex}`);
      updateValues.push(sanitizedScore);
      valueIndex++;
    }

    if (sanitizedIsCorrect !== undefined) {
      updateFields.push(`is_correct = $${valueIndex}`);
      updateValues.push(sanitizedIsCorrect);
      valueIndex++;
    }

    if (sanitizedFeedback !== undefined) {
      updateFields.push(`feedback = $${valueIndex}`);
      updateValues.push(sanitizedFeedback);
      valueIndex++;
    }

    updateValues.push(sanitizedResponseId); // responseId

    const updateQuery = `
      UPDATE assessment_responses
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }

    const assessmentResponse = AssessmentResponse.fromDBFormat(result.rows[0]);

    res.json({
      response: assessmentResponse.toAPIFormat()
    });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;