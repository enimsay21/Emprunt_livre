const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/usersRoutes');
const loanRoutes = require('./routes/loanRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',  
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/stats', dashboardRoutes );
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// Root route
app.get('/', (req, res) => {
  res.send('BookEase API is running');
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});