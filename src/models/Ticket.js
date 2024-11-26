// models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticket: { 
    type: String, 
    required: true,
    unique: true
  },
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service',
    required: true 
  },
  client: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['andamento', 'finalizado'],  // Changed from 'pendente'
    default: 'andamento'                // Changed default value
  },
  payment: { 
    type: String, 
    enum: ['pendente', 'completo'], 
    default: 'pendente' 
  },
  proofUrl: { 
    type: String, 
    required: false 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isHidden: { 
    type: Boolean, 
    default: false 
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
