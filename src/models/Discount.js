// src/models/Discount.js
const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  cargo: {
    type: String,
    required: [true, 'Cargo é obrigatório'],
    trim: true
  },
  desconto: {
    type: Number,
    required: [true, 'Valor do desconto é obrigatório'],
    min: [0, 'Desconto não pode ser negativo'],
    max: [100, 'Desconto não pode ser maior que 100%']
  },
  visivel: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discount', discountSchema);