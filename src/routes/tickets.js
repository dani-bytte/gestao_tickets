// src/routes/tickets.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const {
  createTicket,
  upload,
  getProofImage,
  listTickets,
  getTicketById,
  updateTicket,
  listServices,
  listCategories,
  createService,
  createCategory,
  validateService,
  validateCategory,
  hideTicket,
  hideService
} = require('@controllers/ticketController');
const { isUser, isAdmin } = require('@controllers/roleController');

router.use(auth);

router.post('/new', upload.single('proof'), createTicket);
router.get('/proof-image/:fileName', auth, isUser, getProofImage);
router.get('/list', isUser, listTickets);
router.get('/:id', isUser, getTicketById);
router.put('/:id', isUser, updateTicket);
router.put('/:id/hide', auth, isUser, hideTicket);

// Add routes for services and categories
router.get('/services/list', auth, listServices);
router.post('/services/new', auth, isAdmin, validateService, createService);
router.put('/services/:id/hide', auth, isAdmin, hideService);
router.get('/categories/list', auth, listCategories);
router.post('/categories/new', auth, isAdmin, validateCategory, createCategory);

module.exports = router;