const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, telephone, cin, is_admin ,profile_image FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a user by ID (admin or the user themselves)
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

// Delete a user (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if there are active loans for this user
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
// Add this to your users.js routes file


// Route pour récupérer l'image de profil d'un utilisateur
router.get('/:id/image', authenticateToken, async (req, res) => {
  try {
    // Utiliser l'ID de l'URL au lieu de req.user.id
    const userId = parseInt(req.params.id);
    
    // Vérifier si l'utilisateur est admin ou s'il demande sa propre image
    if (req.user.isAdmin || req.user.id === userId) {
      // Obtenir l'URL de l'image de profil de l'utilisateur
      const [users] = await pool.query(
        'SELECT profile_image FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0 || !users[0].profile_image) {
        return res.status(404).json({ message: 'No profile image found' });
      }
      
      // Retourner l'URL de l'image
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