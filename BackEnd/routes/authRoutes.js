const express = require('express');
const router = express.Router();
const pool = require('../configBD/BD');
const { generateToken, hashPassword, comparePassword } = require('../middleware/authMiddleware');


const nodemailer = require('nodemailer'); // For sending emails

// Configure nodemailer for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'yasminefkikih@gmail.com',
    // Important: Create an App Password in your Google account!
    pass: process.env.EMAIL_PASSWORD || 'ynqz mcjs zfxd rufd' 
  },
  // Add these options to help with Gmail connectivity issues
  secure: true,
  
});

// Add this to test the connection when server starts
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email server error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Inscription
// Ensure register route sets is_admin to 0 by default
router.post('/register', async (req, res) => {
    try {
      const { username, email, telephone, cin, password } = req.body;
      
      // Check if user already exists
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Username or email already in use' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Insert new user with is_admin explicitly set to 0
      const [result] = await pool.query(
        'INSERT INTO users (username, email, telephone, cin, password, is_admin) VALUES (?, ?, ?, ?, ?, 0)',
        [username, email, telephone, cin, hashedPassword]
      );
      
      // Create JWT token
      const user = { id: result.insertId, username, is_admin: 0 };
      const token = generateToken(user);
      
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          username, 
          isAdmin: false
        } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email= ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    const user = users[0];
    
    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    // Créer un token JWT
    const token = generateToken(user);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.is_admin 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// Forgot Password - Step 1: Request password reset with verification code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // For security reasons, we still return a success message even if the email doesn't exist
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a verification code shortly' 
      });
    }

    const user = users[0];
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 3600000); // Code expires in 1 hour
    
    // Update the user with the verification code and expiry
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [verificationCode, codeExpiry, user.id]
    );

    // Send verification code email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'yasminefkikih@gmail.com',
      to: email,
      subject: 'BookEase - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4C2808;">BookEase Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your BookEase account. Please use the verification code below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <h1 style="font-size: 36px; letter-spacing: 5px; color: #4C2808;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The BookEase Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'If your email exists in our system, you will receive a verification code shortly' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password - Step 2: Verify code and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    // Find the user with the matching email and verification code that hasn't expired
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
      [email, verificationCode]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const user = users[0];

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password and clear the reset token
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;