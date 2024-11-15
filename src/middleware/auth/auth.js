// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('@models/User');
const logger = require('@config/logger');
const { ROLES } = require('@config/constants');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    res.status(500).json({ message: 'Erro na autenticação' });
  }
};

module.exports = auth;