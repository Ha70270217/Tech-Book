const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please log in again.'
      });
    }

    return res.status(403).json({
      error: 'Invalid token.'
    });
  }
};

// Middleware to generate JWT tokens
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      // Add any other claims needed
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'textbook-api',
      audience: 'textbook-users'
    }
  );
};

// Middleware to check if user has specific role/permission (if needed in future)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to refresh tokens
const refreshToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token without expiration check
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    // Generate new token with updated expiry
    const newToken = generateToken({
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    });

    res.json({ token: newToken });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  requireRole,
  refreshToken
};