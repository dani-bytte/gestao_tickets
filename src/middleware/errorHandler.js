// middleware/errorHandler.js
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Erro de validação',
        details: err.errors
      }
    });
  }

  // Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Token inválido'
      }
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : err.message,
      status: err.status || 500
    }
  });
};

module.exports = errorHandler;