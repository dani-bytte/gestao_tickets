require('dotenv').config();
module.exports = {
    url: process.env.MONGO_URI,
    options: {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        connectTimeoutMS: 10000                 
      }
  };