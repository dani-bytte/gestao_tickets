// config/logger.js
const winston = require('winston');
const path = require('path');

// Custom format for development logs
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

// Custom format for production logs
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Development-specific configuration
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

module.exports = logger;