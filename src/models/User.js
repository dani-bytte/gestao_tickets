// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ROLES } = require('@config/constants');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: [ROLES.ADMIN, ROLES.USER, ROLES.FINANCEIRO], default: ROLES.USER }, // Define a role do usuário
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileUser' }, // Referência ao ProfileUser
  isTemporaryPassword: { type: Boolean, default: true }, // Novo campo
});


// Middleware para hash da senha
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
