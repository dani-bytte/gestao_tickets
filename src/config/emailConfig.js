// src/config/emailConfig.js
const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL.USER,
    pass: env.EMAIL.PASS
  }
});

module.exports = transporter;