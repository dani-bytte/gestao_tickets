const mongoose = require('mongoose');
const logger = require('@config/logger');
const dbConfig = require('@config/database');

let isConnected = false;

const connectToMongoDB = async () => {
  if (!isConnected) {
    try {
      await mongoose.connect(dbConfig.url, dbConfig.options);
      isConnected = true;
      logger.info('Conectado ao MongoDB');
    } catch (err) {
      logger.error('Erro na conexão MongoDB:', err);
      process.exit(1);
    }
  }
};

module.exports = connectToMongoDB;