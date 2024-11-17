// src/controllers/authController.js
const { body, validationResult } = require('express-validator');
const User = require('@models/User');
const jwt = require('jsonwebtoken');
const logger = require('@config/logger');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const transporter = require('@config/emailConfig');
require('dotenv').config();

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Username deve ter no mínimo 3 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email inválido'),
];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 3 tentativas
  message: { 
    error: 'Muitas tentativas de alteração de senha. Tente novamente em 1 hora.' 
  }
});

const registerUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário ou email já existe' });
    }

    // Gerar uma senha provisória
    const temporaryPassword = crypto.randomBytes(8).toString('hex');

    const user = new User({
      username,
      password: temporaryPassword,
      email,
      isTemporaryPassword: true,
    });
    await user.save();

    logger.info(`Novo usuário registrado: ${username} com senha provisória`);

    // Enviar a senha provisória ao usuário
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Sua senha provisória',
      text: `Olá ${username},\n\nSua senha provisória é: ${temporaryPassword}\n\nPor favor, altere sua senha após o primeiro login.\n\nObrigado!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error('Erro ao enviar email:', error);
        return res.status(500).json({ error: 'Erro ao enviar email' });
      }
      logger.info('Email enviado:', info.response);
      res.status(201).json({ message: 'Usuário registrado com sucesso. A senha provisória foi enviada.' });
    });
  } catch (err) {
    logger.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const tokenPayload = {
      userId: user._id,
      isTemporaryPassword: user.isTemporaryPassword, // Inclua essa informação no payload
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`Login bem-sucedido: ${username}`);

    // Indique no response se a senha é provisória
    res.json({ token, role: user.role, isTemporaryPassword: user.isTemporaryPassword });
  } catch (err) {
    logger.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validar força da nova senha
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'A nova senha deve ter pelo menos 8 caracteres',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(400).json({ error: 'Senha antiga inválida' });
    }

    user.password = newPassword;
    user.isTemporaryPassword = false;

    await user.save();

    logger.info(`Senha alterada para o usuário: ${user.username}`);

    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    logger.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Logout bem-sucedido' });
};

const validateToken = async (req, res) => {
  try {
    // Se o middleware de autenticação passar, o token é válido
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
};

module.exports = {
  registerValidation,
  loginLimiter,
  changePasswordLimiter,
  registerUser,
  loginUser,
  changePassword,
  logoutUser,
  validateToken,
};