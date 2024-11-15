// src/routes/auth.js
const express = require('express');
const { 
  registerValidation, 
  loginLimiter, 
  changePasswordLimiter, 
  registerUser, 
  loginUser, 
  changePassword, 
  logoutUser 
} = require('@controllers/authController');
const auth = require('@middleware/auth/auth');

const router = express.Router();

router.post('/register', auth, registerValidation, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', auth, logoutUser);
router.post('/change-password', auth, changePasswordLimiter, changePassword);

module.exports = router;