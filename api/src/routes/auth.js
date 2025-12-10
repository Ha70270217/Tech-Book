const express = require('express');
const User = require('../models/User');
const OAuthService = require('../utils/oauth');
const PasswordUtil = require('../utils/password');
const InputSanitizer = require('../utils/sanitizer');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const Joi = require('joi');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const loginSchema = Joi.object({
      provider: Joi.string().valid('google', 'github', 'email').required(),
      id_token: Joi.string().optional(),
      email: Joi.string().email().when('provider', {
        is: 'email',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      password: Joi.string().when('provider', {
        is: 'email',
        then: Joi.string().min(8).required(), // Increased minimum length to 8
        otherwise: Joi.optional()
      })
    });

    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { provider, id_token, email, password } = req.body;

    let user;

    if (provider === 'email') {
      // Email/password authentication
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required for email authentication' });
      }

      // Find user by email
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      user = result.rows[0];

      // Verify password using our utility
      const validPassword = await PasswordUtil.comparePassword(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // OAuth provider authentication
      if (!id_token) {
        return res.status(400).json({ error: 'ID token is required for OAuth authentication' });
      }

      // In a real implementation, you would verify the ID token with the provider
      // For this example, we'll assume the token is valid and extract user info
      // This is simplified - in production, verify with provider APIs

      // Find user by provider and provider ID
      const result = await query('SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2', [provider, id_token]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found. Please register first.' });
      }

      user = result.rows[0];
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    // Return user info and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint (for email provider)
router.post('/register', async (req, res) => {
  try {
    const registerSchema = Joi.object({
      email: Joi.string().email().required(),
      username: Joi.string().min(3).max(30).optional(),
      password: Joi.string().min(8).required(), // Increased minimum length to 8
      language: Joi.string().valid('en', 'ur').default('en')
    });

    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let { email, username, password, language } = req.body;

    // Sanitize inputs
    email = InputSanitizer.validateAndSanitizeEmail(email);
    if (!email) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (username) {
      username = InputSanitizer.sanitizeInput(username);
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password using our utility
    const hashedPassword = await PasswordUtil.hashPassword(password);

    // Create new user
    const newUser = new User({
      email,
      username,
      auth_provider: 'email',
      auth_provider_id: email, // For email auth, use email as provider ID
      language: language,
      preferences: {}
    });

    // Validate user data
    const validation = newUser.validate();
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Insert user into database
    const result = await query(
      'INSERT INTO users (id, email, username, auth_provider, auth_provider_id, preferences, language, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, username, language',
      [newUser.id, newUser.email, newUser.username, newUser.auth_provider, newUser.auth_provider_id, JSON.stringify(newUser.preferences), newUser.language, hashedPassword]
    );

    // Generate JWT token
    const token = generateToken({
      id: result.rows[0].id,
      email: result.rows[0].email,
      username: result.rows[0].username
    });

    res.status(201).json({
      token,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('Password')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, username, language, preferences, created_at, updated_at FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    let { username, language, preferences } = req.body;

    // Sanitize inputs
    if (username) {
      username = InputSanitizer.sanitizeInput(username);
    }

    // Validate inputs
    if (username && (username.length < 3 || username.length > 30)) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (language && !['en', 'ur'].includes(language)) {
      return res.status(400).json({ error: 'Language must be either "en" or "ur"' });
    }

    // Sanitize preferences if provided
    if (preferences) {
      preferences = InputSanitizer.sanitizePreferences(preferences);
    }

    // Update user
    const result = await query(
      'UPDATE users SET username = COALESCE($1, username), language = COALESCE($2, language), preferences = COALESCE($3, preferences), updated_at = NOW() WHERE id = $4 RETURNING id, email, username, language, preferences, updated_at',
      [username, language, preferences ? JSON.stringify(preferences) : null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth routes
router.get('/google', (req, res) => {
  try {
    const authUrl = OAuthService.getGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth setup error:', error);
    res.status(500).json({ error: 'Failed to initiate Google OAuth' });
  }
});

router.get('/github', (req, res) => {
  try {
    const authUrl = OAuthService.getGitHubAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('GitHub OAuth setup error:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub OAuth' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // In a real implementation, you would exchange the code for tokens
    // For this example, we'll simulate the process
    // In production, use the code to get tokens from Google's token endpoint

    // For now, return an error indicating this is a placeholder
    res.status(501).json({
      error: 'Google OAuth callback endpoint not fully implemented in this example. In production, this would exchange the code for tokens and create/authenticate the user.'
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: 'Google OAuth callback failed' });
  }
});

// GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // In a real implementation, you would exchange the code for an access token
    // For this example, we'll simulate the process
    // In production, use the code to get an access token from GitHub's token endpoint

    // For now, return an error indicating this is a placeholder
    res.status(501).json({
      error: 'GitHub OAuth callback endpoint not fully implemented in this example. In production, this would exchange the code for an access token, get user data, and create/authenticate the user.'
    });
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).json({ error: 'GitHub OAuth callback failed' });
  }
});

module.exports = router;