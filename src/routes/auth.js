// src/routes/auth.js
const express = require('express');
const { 
  registerValidation, 
  loginLimiter, 
  changePasswordLimiter, 
  registerUser, 
  loginUser, 
  changePassword, 
  logoutUser,
  validateToken,
  userinfo
} = require('@controllers/authController');
const { isAdmin, isUser } = require('@controllers/roleController');
const auth = require('@middleware/auth/auth');

const router = express.Router();

router.post('/register', auth, isAdmin, registerValidation, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', auth, isUser, logoutUser);
router.post('/change-password', auth, isUser, changePasswordLimiter, changePassword);
router.get('/validate-token', auth, validateToken);
router.get('/userinfo', auth, isAdmin, userinfo);

module.exports = router;