const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès interdit, vous devez être administrateur' });
    }

    // Total des livres
    const totalBooksQuery = 'SELECT COUNT(*) AS totalBooks FROM books';
    const totalBooksResult = await pool.query(totalBooksQuery);
    const totalBooks = totalBooksResult[0][0].totalBooks;

    // Total des livres empruntés
    const loanedBooksQuery = 'SELECT COUNT(*) AS loanedBooks FROM loans WHERE status = "active"';
    const loanedBooksResult = await pool.query(loanedBooksQuery);
    const loanedBooks = loanedBooksResult[0][0].loanedBooks;

    // Total des utilisateurs
    const totalUsersQuery = 'SELECT COUNT(*) AS totalUsers FROM users';
    const totalUsersResult = await pool.query(totalUsersQuery);
    const totalUsers = totalUsersResult[0][0].totalUsers;
    
    // Emprunts récents (dernière semaine)
    const recentLoansQuery = `
      SELECT COUNT(*) AS recentLoans 
      FROM loans 
      WHERE borrowed_date > NOW() - INTERVAL 7 DAY
    `;
    const recentLoansResult = await pool.query(recentLoansQuery);
    const recentLoans = recentLoansResult[0][0].recentLoans;

    // Récupérer les données d'activité pour le graphique
    const activityQuery = `
      SELECT 
        DAYNAME(borrowed_date) AS day,
        COUNT(*) AS loans 
      FROM loans 
      WHERE borrowed_date > NOW() - INTERVAL 7 DAY 
      GROUP BY DAYNAME(borrowed_date)
      ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `;
    const activityResult = await pool.query(activityQuery);
    
    // Mapping des jours anglais vers l'abréviation
    const dayMap = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };

    // Préparer les données pour le graphique
    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // Initialiser toutes les valeurs à 0
    const activityCounts = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };
    
    // Remplir avec les données réelles
    activityResult[0].forEach(row => {
      if (row.day && dayMap[row.day]) {
        activityCounts[dayMap[row.day]] = Number(row.loans);
      }
    });
    
    // Construire l'objet de données pour le graphique
    const activityData = {
      labels: daysOrder,
      datasets: [
        {
          data: daysOrder.map(day => activityCounts[day]),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    // Log pour déboguer
    console.log('Activity data being sent:', JSON.stringify(activityData, null, 2));

    res.json({
      totalBooks,
      loanedBooks,
      totalUsers,
      recentLoans,
      activityData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      message: 'Erreur interne du serveur', 
      error: error.message 
    });
  }
});

module.exports = router;