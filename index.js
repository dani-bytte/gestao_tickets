const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const logger = require('./config/logger');

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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://minios3.muonityzone.top"]
    }
  },
  strictTransportSecurity: false // Disable HSTS
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    minPoolSize: 5,             
    maxPoolSize: 10,          
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000,     
    family: 4                   
}).then(() => {
  logger.info('Conectado ao MongoDB');
}).catch(err => {
  logger.error('Erro na conexão MongoDB:', err);
  process.exit(1);
});

// Rotas
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/home', require('./routes/home'));
app.use('/tickets', require('./routes/tickets'));
app.use('/services', require('./routes/services'));

// Error Handlers
app.use(errorHandler);
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', { 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;