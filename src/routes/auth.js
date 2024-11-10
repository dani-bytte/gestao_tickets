// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('@controllers/authController');

router.get('/register', authController.renderRegisterPage);
router.post('/register', authController.registerValidation, authController.registerUser);
router.get('/login', authController.renderLoginPage);
router.post('/login', authController.loginLimiter, authController.loginUser);
router.get('/logout', authController.logoutUser);

module.exports = router;