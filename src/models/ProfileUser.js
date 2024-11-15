const mongoose = require('mongoose');

const profileUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  nickname: { type: String, required: true },
  birthDate: { type: Date, required: true },
  pixKey: { type: String, required: true },
  whatsapp: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const ProfileUser = mongoose.model('ProfileUser', profileUserSchema);

module.exports = ProfileUser;