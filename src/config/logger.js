// config/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Carregamos o módulo env primeiro antes de usar as variáveis
const { NODE_ENV } = require('./env');

// Diretório de logs
const logsDir = path.join(__dirname, '..', '..', 'logs');

// Garantir que o diretório de logs existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato customizado para logs de desenvolvimento
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

// Formato customizado para logs de produção
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    // Logs de erro
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Logs combinados
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Configuração específica para desenvolvimento
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

module.exports = logger;