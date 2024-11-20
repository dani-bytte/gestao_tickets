// src/routes/tickets.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const {
  createTicket,
  listServices,
  upload,
  getProofImage,
  listTickets,
  getTicketById,
  updateTicket
} = require('@controllers/ticketController');
const { isUser } = require('@controllers/roleController');

router.use(auth);

router.post('/new', upload.single('proof'), createTicket);
router.get('/services', isUser, listServices);
router.get('/proof-image/:fileName', auth, isUser, getProofImage);
router.get('/', isUser, listTickets);
router.get('/:id', isUser, getTicketById);
router.put('/:id', isUser, updateTicket);

module.exports = router;