// src/config/routesConfig.js
const authRoutes = require('@routes/auth');
const homeRoutes = require('@routes/home');
const serviceRoutes = require('@routes/services');
const ticketRoutes = require('@routes/tickets');

module.exports = [
  { path: '/auth', controller: authRoutes },
  { path: '/home', controller: homeRoutes },
  { path: '/services', controller: serviceRoutes },
  { path: '/tickets', controller: ticketRoutes },
];