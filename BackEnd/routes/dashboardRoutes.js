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

   
    // Total des livres - Utiliser la première ligne du premier élément
    const totalBooksQuery = 'SELECT COUNT(*) AS totalBooks FROM books';
    console.log('Executing totalBooksQuery');
    const totalBooksResult = await pool.query(totalBooksQuery);
    console.log('Total Books Query Raw Result:', totalBooksResult);
    
    // Extraction correcte du nombre de livres
    const totalBooks = totalBooksResult[0][0].totalBooks;
    console.log('Total Books:', totalBooks);

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
    
    // Mapping des jours français
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
    const activityData = {
      labels: daysOrder,
      datasets: [
        {
          data: daysOrder.map(dayFr => {
            // Trouver le jour anglais correspondant
            const dayEn = Object.keys(dayMap).find(key => dayMap[key] === dayFr);
            
            // Rechercher les données de prêts pour ce jour
            const matchingDay = dayEn ? activityResult.find(row => 
              row.day && row.day.toLowerCase() === dayEn.toLowerCase()
            ) : null;

            // Retourner le nombre de prêts ou 0
            return matchingDay ? matchingDay.loans : 0;
          }),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

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