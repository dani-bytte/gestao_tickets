// src/controllers/authController.js
const { body, validationResult } = require('express-validator');
const User = require('@models/User');
const jwt = require('jsonwebtoken');
const logger = require('@config/logger');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const transporter = require('@config/emailConfig');
const role = require('@config/constants').ROLES;
const ProfileUser = require('@models/ProfileUser');
const connectToMongoDB = require('@config/mongoConnection');
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
  max: 10, // máximo 10 tentativas
  message: { 
    error: 'Muitas tentativas de alteração de senha. Tente novamente em 1 hora.' 
  }
});

const registerUser = async (req, res) => {
  if (req.user.role !== role.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await connectToMongoDB();

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
    await connectToMongoDB();

    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    if (!user.isActive) {
      logger.warn(`Tentativa de login de usuário desativado: ${username}`);
      return res.status(403).json({ error: 'Usuário desativado' });
    }

    const profile = await ProfileUser.findOne({ user: user._id }).lean();
    const hasProfile = !!profile;

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      isTemporaryPassword: user.isTemporaryPassword,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`Login bem-sucedido: ${username}, hasProfile: ${hasProfile}`);

    res.json({ 
      token, 
      role: user.role, 
      isTemporaryPassword: user.isTemporaryPassword,
      hasProfile
    });
  } catch (err) {
    logger.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Supondo que o ID do usuário esteja no token JWT
    const { oldPassword, newPassword } = req.body;

    // Verifique se o usuário tem permissão para mudar a senha
    const user = await User.findById(userId);
    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(403).json({ message: 'Usuário não encontrado' });
    }

    // Verifique se a senha antiga está correta
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      console.log('Senha antiga incorreta');
      return res.status(403).json({ message: 'Senha antiga incorreta' });
    }

    // Atualize a senha
    user.password = newPassword;
    user.isTemporaryPassword = false;
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao mudar a senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
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

const userinfo = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await connectToMongoDB();

    const users = await User.find({ isActive: true })
      .select('id username email role isTemporaryPassword isActive')
      .lean();
    res.json(users);
  } catch (error) {
    logger.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

const registerInfo = async (req, res) => {
  const { fullName, nickname, birthDay, birthMonth, birthYear, pixKey, whatsapp, email } = req.body;

  try {
    await connectToMongoDB();

    if (
      !birthDay ||
      !birthMonth ||
      !birthYear ||
      birthDay < 1 ||
      birthDay > 31 ||
      birthMonth < 1 ||
      birthMonth > 12 ||
      birthYear < 1900 ||
      birthYear > new Date().getFullYear()
    ) {
      return res.status(400).json({ error: 'Data de nascimento inválida' });
    }

    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ error: 'Data de nascimento inválida' });
    }

    const user = await User.findById(req.user._id).populate('profile');
    if (!user) {
      logger.warn('Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.profile) {
      logger.warn('Perfil já criado para este usuário');
      return res.status(400).json({ message: 'Perfil já criado para este usuário' });
    }

    const newProfileUser = new ProfileUser({
      user: req.user._id, // Certifique-se de que o campo user está sendo preenchido
      fullName,
      nickname,
      birthDate,
      pixKey,
      whatsapp,
      email,
    });

    await newProfileUser.save();

    user.profile = newProfileUser._id;
    await user.save();

    res.status(201).json({ message: 'Informações registradas com sucesso' });
  } catch (error) {
    logger.error('Erro ao registrar informações:', error);
    res.status(500).json({ error: 'Erro ao registrar informações' });
  }
};

const deactivateUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await connectToMongoDB();

    const { userId } = req.params;

    // Prevent self-deactivation
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Não é possível desativar seu próprio usuário' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Prevent deactivating other admins
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Não é possível desativar outros administradores' });
    }

    user.isActive = false;
    await user.save();

    logger.info(`Usuário ${user.username} desativado por ${req.user.username}`);
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    logger.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
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
  userinfo,
  registerInfo,
  deactivateUser,
};