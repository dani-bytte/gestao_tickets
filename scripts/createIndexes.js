const mongoose = require('mongoose');
const path = require('path');
require('module-alias/register');
const env = require('../src/config/env');

async function createIndexes() {
  await mongoose.connect(env.MONGO_URI);
  
  await mongoose.connection.collection('tickets').createIndex({ "service": 1 });
  await mongoose.connection.collection('tickets').createIndex({ "startDate": 1 });
  
  console.log('Indexes created successfully');
  process.exit(0);
}

createIndexes().catch(console.error);