const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome do serviço
  type: { type: String, required: true },
  dueDate: { type: Number, required: true }, // Prazo em dias
  value: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
});

module.exports = mongoose.model('Service', serviceSchema);
