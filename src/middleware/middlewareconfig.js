// middleware/middlewares.js

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const timeout = require('connect-timeout');
const requestLogger = require('./logging/requestLogger');
const errorLogger = require('./logging/errorLogger');
const errorHandler = require('./errorHandler');

// Helmet middleware
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:", "blob:", "https://minios3.muonityzone.top"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://minios3.muonityzone.top"],
    },
  },
  strictTransportSecurity: false,
});

// Cache-Control middleware
const cacheControlMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// Body parser middleware
const bodyParserMiddleware = [
  express.json(),
  express.urlencoded({ extended: true }),
];

// Cookie parser middleware
const cookieParserMiddleware = cookieParser();

// Compression middleware
const compressionMiddleware = compression();

// Timeout middleware
const timeoutMiddleware = [
  timeout('15s'),
  (req, res, next) => {
    if (!req.timedout) next();
  },
];

// Connection cleanup middleware
const connectionCleanupMiddleware = (req, res, next) => {
  res.on('finish', () => {
    if (req.connection) {
      req.connection.removeAllListeners();
    }
  });
  next();
};

// Static files middleware
const staticMiddleware = express.static(path.join(__dirname, '../public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
});

module.exports = {
  helmetMiddleware,
  cacheControlMiddleware,
  bodyParserMiddleware,
  cookieParserMiddleware,
  compressionMiddleware,
  timeoutMiddleware,
  connectionCleanupMiddleware,
  staticMiddleware,
  requestLogger,
  errorLogger,
  errorHandler,
};