const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  
  await mongoose.connection.collection('tickets').createIndex({ "service": 1 });
  await mongoose.connection.collection('tickets').createIndex({ "startDate": 1 });
  
  console.log('Indexes created successfully');
  process.exit(0);
}

createIndexes().catch(console.error);