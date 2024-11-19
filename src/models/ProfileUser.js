const mongoose = require('mongoose');

const profileUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure 1:1 relationship
  },
  fullName: { 
    type: String, 
    required: true 
  },
  nickname: { 
    type: String, 
    required: true 
  },
  birthDate: { 
    type: Date, 
    required: true 
  },
  pixKey: { 
    type: String, 
    required: true 
  },
  whatsapp: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  }
}, {
  timestamps: true // Add created/updated timestamps
});

// Add indexes for common queries
profileUserSchema.index({ user: 1 });
profileUserSchema.index({ email: 1 });

const ProfileUser = mongoose.model('ProfileUser', profileUserSchema);

module.exports = ProfileUser;