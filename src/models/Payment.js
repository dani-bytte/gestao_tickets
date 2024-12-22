const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true
  },
  originalValue: {
    type: Number,
    required: true
  },
  finalValue: {
    type: Number,
    required: true
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  confirmedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);