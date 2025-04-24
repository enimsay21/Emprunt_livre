const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const bcrypt = require('bcrypt');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// recuper users
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, telephone, cin, is_admin ,profile_image FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a user   ID 
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if the user is admin or if it's their own profile
    if (req.user.isAdmin || req.user.id === userId) {
      const [users] = await pool.query('SELECT id, username, email, telephone, cin, is_admin,profile_image FROM users WHERE id = ?', [userId]);
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(users[0]);
    } else {
      return res.status(403).json({ message: 'Access not authorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile 
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, telephone, cin, password, is_admin } = req.body;
    
    // Check if user is admin or updating their own profile
    if (req.user.isAdmin || req.user.id === userId) {
      let updateQuery = 'UPDATE users SET username = ?, email = ?';
      let queryParams = [username, email];
      
      // Include telephone and cin if provided
      if (telephone !== undefined) {
        updateQuery += ', telephone = ?';
        queryParams.push(telephone);
      }
      
      if (cin !== undefined) {
        updateQuery += ', cin = ?';
        queryParams.push(cin);
      }
      
      // If a new password is provided, hash it
      if (password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updateQuery += ', password = ?';
        queryParams.push(hashedPassword);
      }
      
      // Only admin can update admin status
      if (is_admin !== undefined && req.user.isAdmin) {
        updateQuery += ', is_admin = ?';
        queryParams.push(is_admin ? 1 : 0);
      }
      
      updateQuery += ' WHERE id = ?';
      queryParams.push(userId);
      
      const [result] = await pool.query(updateQuery, queryParams);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Profile updated successfully' });
    } else {
      return res.status(403).json({ message: 'Access not authorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change admin status (admin only)
router.put('/:id/admin-status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_admin } = req.body;
    
    const [result] = await pool.query('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: `Admin status ${is_admin ? 'granted' : 'removed'} successfully`,
      is_admin 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// suprimer user par admin
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // verfier si un eùprunt active
    const [activeLoan] = await pool.query('SELECT * FROM loans WHERE user_id = ? AND status = "active"', [userId]);
    
    if (activeLoan.length > 0) {
      return res.status(400).json({ message: 'This user has active loans and cannot be deleted' });
    }
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
//image de profile
router.get('/:id/image', authenticateToken, async (req, res) => {
  try {

    const userId = parseInt(req.params.id);
 
    if (req.user.isAdmin || req.user.id === userId) {

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
    } else {
      return res.status(403).json({ message: 'Access not authorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;