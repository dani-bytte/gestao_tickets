// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('@models/User');
const logger = require('@config/logger');

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
    req.user.isTemporaryPassword = decoded.isTemporaryPassword;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token expirado
      logger.warn('Token expirado.');
      return res.status(401).json({ message: 'Por favor, faça login novamente.' });
    } else if (error.name === 'JsonWebTokenError') {
      // Token inválido
      logger.warn('Token inválido.');
      return res.status(401).json({ message: 'Token inválido.' });
    } else {
      // Outro erro
      logger.error('Erro na autenticação:', error);
      return res.status(500).json({ message: 'Erro na autenticação.' });
    }
  }
};

module.exports = auth;