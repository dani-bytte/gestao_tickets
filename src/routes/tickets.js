// src/routes/tickets.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const ticketController = require('@controllers/ticketController');
const { isAdmin, isUser } = require('@controllers/roleController');

router.use(auth);

router.post('/new', auth, isUser, ticketController.upload.single('proof'), ticketController.createTicket);
router.get('/proof-url/:fileName', auth, ticketController.getSignedProofUrl);
router.get('/', auth, isUser, ticketController.listTickets);
router.get('/:id', auth, isUser, ticketController.getTicketById);
router.put('/:id', auth, isUser, ticketController.updateTicket);

module.exports = router;