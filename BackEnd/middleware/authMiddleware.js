const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// Clé secrète et date d'expiration
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_key';
const JWT_EXPIRES_IN = '1h';
// Fonction de hashage de mot de passe
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
// Comparaison de password avec hashage
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
// Génération du token JWT avec utilisateur
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
// Vérification de token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
// Middleware pour authentifier les requêtes
const authenticateToken = (req, res, next) => {
  console.log("Headers reçus :", req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }
    if (user.is_admin !== undefined) {
      user.isAdmin = user.is_admin === 1 ? true : false;
      delete user.is_admin; // Remove the old property to avoid confusion
    }
    req.user = user;
    next();
  });
};
// Fonction pour vérifier si user est admin
const isAdmin = (req, res, next) => {
  // Only check isAdmin property
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  isAdmin
};