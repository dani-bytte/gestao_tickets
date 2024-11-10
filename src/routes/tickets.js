// src/routes/tickets.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const ticketController = require('@controllers/ticketController');

router.use(auth);

router.get('/new', ticketController.renderTicketForm);
router.post('/new', ticketController.upload.single('proof'), ticketController.createTicket);
router.get('/proof-url/:fileName', ticketController.getSignedProofUrl);
router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);

module.exports = router;