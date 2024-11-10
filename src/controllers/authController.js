// src/controllers/authController.js
const { body, validationResult } = require('express-validator');
const User = require('@models/User');
const jwt = require('jsonwebtoken');
const logger = require('@config/logger');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Username deve ter no mínimo 3 caracteres'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),
];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

const renderRegisterPage = (req, res) => {
  res.render('register', { errors: [] });
};

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', { errors: errors.array() });
    }

    const { username, password, email } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(400).render('register', { errors: [{ msg: 'Usuário ou email já existe' }] });
    }

    let user = new User({ username, password, email });
    await user.save();

    logger.info(`Novo usuário registrado: ${username}`);
    res.redirect('/auth/login');
  } catch (err) {
    logger.error('Erro no registro:', err);
    res.status(500).render('register', { errors: [{ msg: 'Erro no servidor' }] });
  }
};

const renderLoginPage = (req, res) => {
  res.render('login', { error: null });
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('login', { error: 'Credenciais inválidas' });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).render('login', { error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hora
    });

    logger.info(`Login bem sucedido: ${username}`);
    res.redirect('/home');
  } catch (err) {
    logger.error('Erro no login:', err);
    res.status(500).render('login', { error: 'Erro no servidor' });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};

module.exports = {
  registerValidation,
  loginLimiter,
  renderRegisterPage,
  registerUser,
  renderLoginPage,
  loginUser,
  logoutUser
};