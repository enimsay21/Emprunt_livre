// BackEnd/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// Helper functions for password hashing and comparison
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    // req.user is set by the authenticate middleware
    const userId = req.user.id;
    
    const [users] = await pool.query(
      'SELECT id, username, email, telephone, cin, is_admin, profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Directly use isAdmin instead of is_admin
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      telephone: user.telephone,
      cin: user.cin,
      profileImage: user.profile_image,
      isAdmin: user.is_admin === 1 ? true : false // Convert to boolean and ensure it's named isAdmin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, telephone } = req.body;
    
    // Check if email is already in use by another user
    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update the user profile
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updateFields = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (telephone) {
      updateFields.push('telephone = ?');
      updateValues.push(telephone);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ' WHERE id = ?';
    updateValues.push(userId);
    
    await pool.query(updateQuery, updateValues);
    
    // Get updated user data
    const [users] = await pool.query(
      'SELECT id, username, email, telephone, cin, is_admin, profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    const user = users[0];
    
    // Directly use isAdmin instead of is_admin
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      telephone: user.telephone,
      cin: user.cin,
      profileImage: user.profile_image,
      isAdmin: user.is_admin === 1 ? true : false // Convert to boolean and ensure it's named isAdmin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get the user with their current password
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile image URL
router.post('/image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    // Update the profile image URL in database
    await pool.query(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [imageUrl, userId]
    );
    
    res.json({ 
      message: 'Profile image updated successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ message: 'Failed to update profile image', error: error.message });
  }
});

// Get profile image
router.get('/image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the user's profile image URL
    const [users] = await pool.query(
      'SELECT profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0 || !users[0].profile_image) {
      return res.status(404).json({ message: 'No profile image found' });
    }
    
    // Return the image URL
    res.json({ 
      imageUrl: users[0].profile_image
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;