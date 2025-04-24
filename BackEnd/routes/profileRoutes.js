const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');


const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    
    const userId = req.user.id;
    
    const [users] = await pool.query(
      'SELECT id, username, email, telephone, cin, is_admin, profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
   
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      telephone: user.telephone,
      cin: user.cin,
      profileImage: user.profile_image,
      isAdmin: user.is_admin === 1 ? true : false 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// modifier profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, telephone } = req.body;
    

    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // modifier profile
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
    
 //modifier profile
    const [users] = await pool.query(
      'SELECT id, username, email, telephone, cin, is_admin, profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    const user = users[0];
    
 
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      telephone: user.telephone,
      cin: user.cin,
      profileImage: user.profile_image,
      isAdmin: user.is_admin === 1 ? true : false 
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
    
  
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    

    const hashedPassword = await hashPassword(newPassword);
    
    
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

 // modifier profile image 
router.post('/image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
   
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

// recuperer profile image
router.get('/image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    
    const [users] = await pool.query(
      'SELECT profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0 || !users[0].profile_image) {
      return res.status(404).json({ message: 'No profile image found' });
    }
    

    res.json({ 
      imageUrl: users[0].profile_image
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;