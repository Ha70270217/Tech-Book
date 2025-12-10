// routes/chapters.js - Chapter management routes
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const InputSanitizer = require('../utils/sanitizer');

const router = express.Router();

// Get all chapters
router.get('/', async (req, res) => {
  try {
    // In a real implementation, this would fetch from the database
    // For now, returning sample data
    const chapters = [
      { id: 1, title: 'Introduction to Physical AI', slug: 'introduction-to-physical-ai', order: 1 },
      { id: 2, title: 'Basics of Humanoid Robotics', slug: 'basics-of-humanoid-robotics', order: 2 },
      { id: 3, title: 'ROS 2 Fundamentals', slug: 'ros-2-fundamentals', order: 3 },
      { id: 4, title: 'Digital Twin Simulation (Gazebo + Isaac)', slug: 'digital-twin-simulation', order: 4 },
      { id: 5, title: 'Vision-Language-Action Systems', slug: 'vision-language-action-systems', order: 5 },
      { id: 6, title: 'Capstone: Simple AI-Robot Pipeline', slug: 'capstone-ai-robot-pipeline', order: 6 }
    ];

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapters',
      error: error.message
    });
  }
});

// Get a specific chapter by ID
router.get('/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    // In a real implementation, this would fetch from the database
    // For now, returning sample data based on ID
    const chapter = {
      id: parseInt(sanitizedChapterId),
      title: `Chapter ${sanitizedChapterId}`,
      slug: `chapter-${sanitizedChapterId}`,
      order: parseInt(sanitizedChapterId),
      description: 'Sample chapter description',
      sections: []
    };

    res.json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapter',
      error: error.message
    });
  }
});

// Get chapter sections
router.get('/:chapterId/sections', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const sanitizedChapterId = InputSanitizer.sanitizeId(chapterId);

    // In a real implementation, this would fetch from the database
    // For now, returning sample data
    const sections = [
      { id: 1, chapter_id: sanitizedChapterId, title: 'Overview', type: 'overview', order: 1 },
      { id: 2, chapter_id: sanitizedChapterId, title: 'Key Concepts', type: 'concepts', order: 2 },
      { id: 3, chapter_id: sanitizedChapterId, title: 'Examples / Diagrams', type: 'examples', order: 3 },
      { id: 4, chapter_id: sanitizedChapterId, title: 'Exercises / Q&A', type: 'exercises', order: 4 },
      { id: 5, chapter_id: sanitizedChapterId, title: 'References', type: 'references', order: 5 }
    ];

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Get chapter sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapter sections',
      error: error.message
    });
  }
});

module.exports = router;