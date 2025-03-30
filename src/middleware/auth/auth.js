// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('@models/User');
const logger = require('@config/logger');
const connectToMongoDB = require('@config/mongoConnection');
const env = require('@config/env');

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    await connectToMongoDB();

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Acesso negado. Usuário não encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.error('Erro na autenticação: Token inválido', error);
      return res.status(401).json({ error: 'Acesso negado. Token inválido.' });
    }
    logger.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

module.exports = auth;