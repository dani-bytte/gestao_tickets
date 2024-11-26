const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dueDate: { type: Number, required: true },
  value: { type: Number, required: true },
  isHidden: { type: Boolean, default: false },
  category: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true 
  }
});

module.exports = mongoose.model('Service', serviceSchema);
