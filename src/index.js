require('module-alias/register');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('@middleware/errorHandler');
const helmet = require('helmet');
const logger = require('@config/logger');
const compression = require('compression');
const timeout = require('connect-timeout');
const requestLogger = require('@middleware/logging/requestLogger');
const errorLogger = require('@middleware/logging/errorLogger');
const routes = require('@routes');

const app = express();

require('dotenv').config();

// Configuração do EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:", "blob:", "https://minios3.muonityzone.top"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://minios3.muonityzone.top"],
      // Removida a diretiva cache-control que estava causando erro
    }
  },
  strictTransportSecurity: false
}));

// index.js - após as configurações do Helmet
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Adicione headers de cache separadamente
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.use(timeout('15s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Add before routes
app.use(requestLogger);

// Conexão ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  connectTimeoutMS: 10000
}).then(() => {
  logger.info('Conectado ao MongoDB');
}).catch(err => {
  logger.error('Erro na conexão MongoDB:', err);
  process.exit(1);
});

// Middleware para garantir fechamento adequado de conexões
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.connection) {
      req.connection.removeAllListeners();
    }
  });
  next();
});

// Rotas
app.use(routes);

// Add after routes, before error handler
app.use(errorLogger);

// Error Handlers
app.use(errorHandler);
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', { 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// Adicione manipuladores de eventos para processo
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta http://localhost:${PORT}`);
});

module.exports = app;