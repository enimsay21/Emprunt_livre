const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken } = require('../middleware/authMiddleware');

// Obtenir toutes les notifications de l'utilisateur connecté
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer une nouvelle notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, title, message, type, related_id } = req.body;
    
    // Vérifier si l'utilisateur actuel est un administrateur ou s'il crée une notification pour lui-même
    if (req.user.id !== user_id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à créer des notifications pour d\'autres utilisateurs' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, message, type, related_id]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      user_id,
      title,
      message, 
      type,
      related_id,
      created_at: new Date(),
      read: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Vérifier que la notification appartient à l'utilisateur
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    if (notifications[0].user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à modifier cette notification' });
    }
    
    await pool.query(
      'UPDATE notifications SET `read` = true WHERE id = ?',
      [notificationId]
    );
    
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Vérifier que la notification appartient à l'utilisateur
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    if (notifications[0].user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette notification' });
    }
    
    await pool.query(
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;