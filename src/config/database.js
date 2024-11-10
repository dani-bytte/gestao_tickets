require('dotenv').config();
module.exports = {
    url: process.env.MONGO_URI,
    options: {
        minPoolSize: 5,             
        maxPoolSize: 10,          
        serverSelectionTimeoutMS: 5000, 
        socketTimeoutMS: 45000,     
        family: 4                   
      }
  };