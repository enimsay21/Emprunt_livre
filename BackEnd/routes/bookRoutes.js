const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// recupération de tous les livres
router.get('/', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM books');
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir un livre par ID
router.get('/:id', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
   
    if (books.length === 0) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
   
    res.json(books[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Ajouter un livre par admin
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, author, isbn, cover_url, description, genre,total_copies } = req.body;
   
    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, cover_url, description, genre,total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?,?)',
      [title, author, isbn, cover_url, description, genre,total_copies, total_copies]
    );
   
    res.status(201).json({
      id: result.insertId,
      title,
      author,
      isbn,
      cover_url,
      description,
      genre,
      total_copies,
      available_copies: total_copies
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// modifier un livre par admin
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, author, isbn, cover_url, description,genre, total_copies, available_copies } = req.body;
   
    await pool.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, cover_url = ?, description = ?, genre=?,total_copies = ?, available_copies = ? WHERE id = ?',
      [title, author, isbn, cover_url, description, genre,total_copies, available_copies, req.params.id]
    );
   
    res.json({ message: 'Livre mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer un livre par admin
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log('Attempting to delete book with ID:', bookId);
    
 
    const [bookCheck] = await pool.query('SELECT id FROM books WHERE id = ?', [bookId]);
    
    if (bookCheck.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    //verifier si deja emprunter
    const [activeLoans] = await pool.query(
      'SELECT * FROM loans WHERE book_id = ? AND status = "active"',
      [bookId]
    );
    
    if (activeLoans.length > 0) {
      return res.status(400).json({ 
        message: 'Ce livre est actuellement emprunté et ne peut pas être supprimé',
        activeLoans: activeLoans.length
      });
    }
    
   //supprimer tous les emprunte dece livre
    await pool.query('DELETE FROM loans WHERE book_id = ?', [bookId]);
    
    // supprimer book
    await pool.query('DELETE FROM books WHERE id = ?', [bookId]);
    
    res.json({ message: 'Livre supprimé avec succès', id: bookId });
  } catch (error) {
    console.error('Error in delete book route:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression', 
      error: error.message
    });
  }
});

module.exports = router;