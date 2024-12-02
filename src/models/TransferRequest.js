// models/TicketTransfer.js
const mongoose = require('mongoose');

const ticketTransferSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transferTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  progressPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  clientInfo: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  reason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TicketTransfer', ticketTransferSchema);