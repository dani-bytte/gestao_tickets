// src/middleware/auth/isAdmin.js
const user = require('@models/User');
const ProfileUser = require('@models/ProfileUser');
const { ROLES } = require('@config/constants');
const logger = require('@config/logger');
const connectToMongoDB = require('@config/mongoConnection');

const isAdmin = async (req, res, next) => {
  try {
    await connectToMongoDB();
    if (req.user && req.user.role === ROLES.ADMIN) {
      if (req.user.isTemporaryPassword) {
        logger.warn(`Admin ${req.user.username} tried to access with temporary password`);
        return res.status(403).json({ error: 'Acesso negado. Troque sua senha provisória primeiro.' });
      }

      logger.info(`Checking profile for admin user: ${req.user._id}`);
      const profile = await ProfileUser.findOne({ user: req.user._id }).lean();
      
      logger.info(`Profile found: ${!!profile}`);
      if (!profile) {
        logger.warn(`No profile found for admin: ${req.user.username}`);
        return res.status(403).json({ error: 'Acesso negado. Complete seu perfil primeiro.' });
      }

      next();
    } else {
      logger.warn('Non-admin access attempt');
      res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }
  } catch (error) {
    logger.error(`Error in isAdmin middleware: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const isUser = async (req, res, next) => {
  try {
    await connectToMongoDB();

    if (req.user && (req.user.role === ROLES.USER || req.user.role === ROLES.ADMIN)) {
      if (req.user.isTemporaryPassword) {
        logger.warn(`User ${req.user.username} tried to access with temporary password`);
        return res.status(403).json({ error: 'Acesso negado. Troque sua senha provisória primeiro.' });
      }

      logger.info(`Checking profile for user: ${req.user._id}`);
      const profile = await ProfileUser.findOne({ user: req.user._id }).lean();
      
      logger.info(`Profile found: ${!!profile}, UserId: ${req.user._id}`);
      if (!profile) {
        logger.warn(`No profile found for user: ${req.user.username}`);
        return res.status(403).json({ error: 'Acesso negado. Complete seu perfil primeiro.' });
      }

      next();
    } else {
      logger.warn('Unauthorized access attempt');
      res.status(403).json({ error: 'Acesso negado.' });
    }
  } catch (error) {
    logger.error(`Error in isUser middleware: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  isUser, isAdmin
};