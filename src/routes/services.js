// src/routes/services.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const checkUserRole = require('@middleware/auth/roleAuth');
const serviceController = require('@controllers/serviceController');

router.use(auth);
router.use(checkUserRole(['financeiro', 'admin']));

router.post(
  '/register',
  serviceController.serviceValidation,
  serviceController.registerService
);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);

module.exports = router;