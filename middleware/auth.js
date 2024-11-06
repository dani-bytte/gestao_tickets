// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  try {
    // Verifica token nos cookies
    const token = req.cookies.token;
    
    // Se não houver token
    if (!token) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token não fornecido' 
        });
      }
      return res.redirect('/auth/login');
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verifica se o token expirou
    if (Date.now() >= decoded.exp * 1000) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    // Busca usuário no banco
    const user = await User.findById(decoded.userId)
      .select('-password')  // Exclui o campo password
      .lean();  // Retorna objeto JavaScript puro

    // Se usuário não existe mais
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Adiciona usuário à requisição
    req.user = user;
    res.locals.user = user; // Disponível para templates
    res.locals.isAuthenticated = true;
    res.locals.userRole = user.role;

    // Log de acesso
    logger.info(`Usuário ${user.username} acessou ${req.originalUrl}`);

    next();

  } catch (error) {
    // Log do erro
    logger.error('Erro de autenticação:', error);

    // Limpa cookie em caso de erro
    res.clearCookie('token');

    // Retorna erro apropriado
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    return res.redirect('/auth/login');
  }
};

module.exports = auth;
