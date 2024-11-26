// models/User.js
const mongoose = require('mongoose');
const argon2 = require('argon2'); // Importar argon2
const { ROLES } = require('@config/constants'); // Importar ROLES

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: [ROLES.ADMIN, ROLES.USER, ROLES.FINANCEIRO], default: ROLES.USER }, // Define a role do usuário
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileUser' }, // Referência ao ProfileUser
  isTemporaryPassword: { type: Boolean, default: true }, // Novo campo
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

// Middleware para hash da senha
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await argon2.hash(this.password); // Usar argon2 para hash da senha
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return argon2.verify(this.password, candidatePassword); // Usar argon2 para comparar senhas
};

module.exports = mongoose.model('User', userSchema);
