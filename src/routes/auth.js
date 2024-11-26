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
  userinfo,
  deactivateUser
} = require('@controllers/authController');
const { isAdmin, isUser } = require('@controllers/roleController');
const auth = require('@middleware/auth/auth');

const router = express.Router();

router.post('/register', auth, isAdmin, registerValidation, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', auth, logoutUser);
router.post('/change-password', auth, changePasswordLimiter, changePassword);
router.get('/validate-token', auth, validateToken);
router.get('/userinfo', auth, isAdmin, userinfo);
router.put('/users/:userId/deactivate', auth, isAdmin, deactivateUser);

module.exports = router;