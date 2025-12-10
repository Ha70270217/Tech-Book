// routes/sections.js - Section management routes
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const InputSanitizer = require('../utils/sanitizer');

const router = express.Router();

// Get all sections (or sections for a specific chapter)
router.get('/', async (req, res) => {
  try {
    const { chapterId } = req.query;

    // In a real implementation, this would fetch from the database
    // For now, returning sample data
    let sections = [
      { id: 1, chapter_id: 1, title: 'Overview', type: 'overview', order: 1 },
      { id: 2, chapter_id: 1, title: 'Key Concepts', type: 'concepts', order: 2 },
      { id: 3, chapter_id: 1, title: 'Examples / Diagrams', type: 'examples', order: 3 },
      { id: 4, chapter_id: 1, title: 'Exercises / Q&A', type: 'exercises', order: 4 },
      { id: 5, chapter_id: 1, title: 'References', type: 'references', order: 5 }
    ];

    if (chapterId) {
      const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);
      sections = sections.filter(section => section.chapter_id == sanitizedChapterId);
    }

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sections',
      error: error.message
    });
  }
});

// Get a specific section by ID
router.get('/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const sanitizedSectionId = InputSanitizer.sanitizeId(sectionId);

    // In a real implementation, this would fetch from the database
    // For now, returning sample data
    const section = {
      id: parseInt(sanitizedSectionId),
      chapter_id: 1,
      title: `Section ${sanitizedSectionId}`,
      type: 'overview',
      order: parseInt(sanitizedSectionId),
      content: 'Sample section content',
      exercises: []
    };

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section',
      error: error.message
    });
  }
});

module.exports = router;