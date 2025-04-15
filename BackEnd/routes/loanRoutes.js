const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Obtenir tous les emprunts (admin peut voir tous, utilisateur ne voit que les siens)
router.get('/', authenticateToken, async (req, res) => {
    try {
      let query = `
        SELECT loans.*, 
               books.title, books.author, books.cover_url,
               users.username, users.email, users.telephone, users.cin
        FROM loans 
        JOIN books ON loans.book_id = books.id
        JOIN users ON loans.user_id = users.id`;
      let params = [];
      
      if (!req.user.isAdmin) {
        query += ' WHERE loans.user_id = ?';
        params.push(req.user.id);
      }
      
      const [loans] = await pool.query(query, params);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  });
// Nouvel endpoint pour vérifier les notifications (emprunts expirés ou qui expirent bientôt)
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Récupérer les emprunts actifs qui expirent dans moins de 3 jours ou sont déjà expirés
    const [notifications] = await pool.query(
      `SELECT loans.id, loans.due_date, books.title, books.cover_url
       FROM loans 
       JOIN books ON loans.book_id = books.id 
       WHERE loans.user_id = ? 
       AND loans.status = 'active' 
       AND (
         loans.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) 
         OR loans.due_date < CURDATE()
       )`,
      [user_id]
    );
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Emprunter un livre
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;
    
    // Vérifier si le livre est disponible
    const [books] = await pool.query(
      'SELECT * FROM books WHERE id = ? AND available_copies > 0',
      [book_id]
    );
    
    if (books.length === 0) {
      return res.status(400).json({ message: 'Livre non disponible ou inexistant' });
    }
    
    // Vérifier si l'utilisateur a déjà emprunté ce livre
    const [existingLoans] = await pool.query(
      'SELECT * FROM loans WHERE user_id = ? AND book_id = ? AND status = "active"',
      [user_id, book_id]
    );
    
    if (existingLoans.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà emprunté ce livre' });
    }
    
    // Calculer la date de retour (2 semaines plus tard)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Créer l'emprunt
    await pool.query(
      'INSERT INTO loans (user_id, book_id, due_date) VALUES (?, ?, ?)',
      [user_id, book_id, dueDate]
    );
    
    // Mettre à jour le nombre de copies disponibles
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );
    
    res.status(201).json({ message: 'Livre emprunté avec succès', due_date: dueDate });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Retourner un livre
router.put('/:id/return', authenticateToken, async (req, res) => {
  try {
    // Obtenir l'emprunt
    const [loans] = await pool.query(
      'SELECT * FROM loans WHERE id = ? AND status = "active"',
      [req.params.id]
    );
    
    if (loans.length === 0) {
      return res.status(404).json({ message: 'Emprunt non trouvé ou déjà retourné' });
    }
    
    const loan = loans[0];
    
    // Vérifier si l'utilisateur est l'emprunteur ou un admin
    if (loan.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à retourner ce livre' });
    }
    
    // Mettre à jour l'emprunt
    await pool.query(
      'UPDATE loans SET returned_date = NOW(), status = "returned" WHERE id = ?',
      [req.params.id]
    );
    
    // Mettre à jour le nombre de copies disponibles
    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [loan.book_id]
    );
    
    res.json({ message: 'Livre retourné avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;