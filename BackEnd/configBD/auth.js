// BackEnd/configBD/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Use a more secure secret and store it in environment variables in production
const JWT_SECRET = 'your_secure_jwt_secret_key';  
const JWT_EXPIRES_IN = '1h';

// Generate password hash
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Compare password with stored hash
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token with user data
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  isAdmin
};