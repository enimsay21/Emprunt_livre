// BackEnd/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Get the same JWT_SECRET used in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_key';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  console.log("Headers reçus :", req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
 
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
 
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Return more specific error messages when possible
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    // Always convert is_admin to isAdmin for consistency
    if (user.is_admin !== undefined) {
      user.isAdmin = user.is_admin === 1 ? true : false;
      delete user.is_admin; // Remove the old property to avoid confusion
    }
   
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // Only check isAdmin property
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
 
  next();
};

module.exports = { authenticateToken, isAdmin };