// src/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);
