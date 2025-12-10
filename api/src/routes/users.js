const express = require('express');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const Joi = require('joi');
const PasswordUtil = require('../utils/password');

const router = express.Router();

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT preferences FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = result.rows[0].preferences;
    res.json({
      preferences: typeof preferences === 'string' ? JSON.parse(preferences) : preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;

    // Validate preferences structure
    if (preferences && typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Preferences must be an object' });
    }

    const result = await query(
      'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING preferences',
      [JSON.stringify(preferences), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      preferences: preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings (theme, notification preferences, etc.)
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { theme, notifications, timezone, language } = req.body;

    // Validate inputs
    const validThemes = ['light', 'dark', 'auto'];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: `Theme must be one of: ${validThemes.join(', ')}` });
    }

    const validLanguages = ['en', 'ur'];
    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ error: `Language must be one of: ${validLanguages.join(', ')}` });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (theme !== undefined) {
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'), '{theme}', '"${theme}"')`);
    }

    if (notifications !== undefined) {
      const notificationValue = notifications ? 'true' : 'false';
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'), '{notifications}', '${notificationValue}'::jsonb)`);
    }

    if (timezone !== undefined) {
      updates.push(`timezone = $${valueIndex}`);
      values.push(timezone);
      valueIndex++;
    }

    if (language !== undefined) {
      updates.push(`language = $${valueIndex}`);
      values.push(language);
      valueIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one setting must be provided' });
    }

    // Add user ID to values
    values.push(req.user.id);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${valueIndex}
      RETURNING preferences, timezone, language
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    res.json({
      preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences,
      timezone: row.timezone,
      language: row.language
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get current user to verify current password
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValid = await PasswordUtil.comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate and hash new password
    const hashedNewPassword = await PasswordUtil.hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    if (error.message.includes('Password')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;