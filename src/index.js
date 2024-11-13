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
const assets = require('connect-assets');
const dbConfig = require('@config/database');

const app = express();

require('dotenv').config();

// Configuração do EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração do connect-assets
app.use(assets({
  paths: [
    path.join(__dirname, 'public', 'js'),
    path.join(__dirname, 'public', 'css')
  ],
  helperContext: app.locals
}));

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:", "blob:", "https://minios3.muonityzone.top"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://minios3.muonityzone.top"],
    }
  },
  strictTransportSecurity: false
}));

// Middleware para forçar a limpeza do cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(timeout('15s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Logger de requisições
app.use(requestLogger);

// Conexão ao MongoDB
mongoose.connect(dbConfig.url, dbConfig.options)
  .then(() => {
    logger.info('Conectado ao MongoDB');
  })
  .catch(err => {
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

// Middleware para lidar com rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).render('404', { content: 'partials/404' });
  logger.warn(`Rota não encontrada: ${req.originalUrl}`);
});

// Middleware para erros do servidor (500)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  logger.warn(`Erro interno do servidor: ${err.message}`);
  res.status(500).render('500', { message: 'Ocorreu um erro no servidor' });
});

// Logger de erros
app.use(errorLogger);

// Manipulador de erros
app.use(errorHandler);
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', { 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// Manipuladores de eventos para processo
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