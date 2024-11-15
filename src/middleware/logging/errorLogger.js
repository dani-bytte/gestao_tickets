// middleware/errorLogger.js
const logger = require('@config/logger');

const errorLogger = (err, req, res, next) => {
  logger.error('Application error', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.body
    },
    user: req.user ? req.user.id : 'anonymous'
  });
  
  next(err);
};

module.exports = errorLogger;