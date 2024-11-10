// src/routes/index.js
const express = require('express');
const router = express.Router();
const routesConfig = require('@config/routesConfig');

routesConfig.forEach(route => {
  router.use(route.path, route.controller);
});

module.exports = router;
