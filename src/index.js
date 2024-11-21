require('module-alias/register');
const express = require('express');
const helmet = require('helmet');
const logger = require('@config/logger');
const compression = require('compression');
const timeout = require('connect-timeout');
const requestLogger = require('@middleware/logging/requestLogger');
const errorLogger = require('@middleware/logging/errorLogger');
const routes = require('@routes');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Ajuste para confiar apenas no primeiro proxy

// Middlewares
app.use(helmet());

const allowedOrigins = ['http://localhost:3000', 'http://179.221.12.203', 'https://apistellar.squareweb.app/'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(timeout('15s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Logger de requisições
app.use(requestLogger);

// Middleware para garantir fechamento adequado de conexões
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.socket) {
      res.socket.removeAllListeners();
    }
  });
  next();
});

// Rotas
app.use(routes);

// Middleware para lidar com rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
  logger.warn(`Rota não encontrada: ${req.originalUrl}`);
});

// Middleware para erros do servidor (500)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Logger de erros
app.use(errorLogger);

// Manipulador de erros
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
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

const PORT = process.env.PORT || 3001; // Alterar para uma porta diferente, como 3001
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta http://localhost:${PORT}`);
});

module.exports = app;