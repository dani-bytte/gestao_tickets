// routes/tickets.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { minioClient, minioConfig, getSignedUrl } = require('../config/minioClient');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const Ticket = require('../models/Ticket');
const Service = require('../models/Service');

const upload = multer({ storage: multer.memoryStorage() });

// GET route for ticket form
router.get('/new', auth, async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.render('ticketForm', {
      title: 'Cadastro de Ticket',
      services: services,
      errors: [],
      error: null,
      oldData: {}
    });
  } catch (error) {
    logger.error('Error loading ticket form:', error);
    res.status(500).render('error', {
      title: 'Erro',
      error: 'Erro ao carregar formulário'
    });
  }
});

// POST route for creating ticket
router.post('/new', auth, upload.single('proof'), async (req, res) => {
  try {
    const { ticket, service, client, email, startDate, endDate } = req.body;
    let proofUrl = null;

    if (req.file) {
      const fileName = `Stelaryous/${req.user}_${req.file.originalname}`;
      await minioClient.putObject(minioConfig.bucketName, fileName, req.file.buffer, {
        'Content-Type': req.file.mimetype
      });

      proofUrl = fileName;
      logger.info('Proof file uploaded:', fileName);
    }

    const newTicket = new Ticket({
      ticket,
      service,
      client,
      email,
      startDate,
      endDate,
      proofUrl,
      status: 'andamento',
      payment: 'pendente',
      createdBy: req.user._id
    });

    await newTicket.save();
    res.redirect('/tickets');

  } catch (error) {
    logger.error('Error creating ticket:', error);
    res.status(500).render('ticketForm', {
      title: 'Cadastro de Ticket',
      services: await Service.find().lean(),
      errors: [],
      error: 'Erro ao criar ticket',
      oldData: req.body
    });
  }
});

// Endpoint to get signed URL for proof
router.get('/proof-url/:fileName', auth, async (req, res) => {
  try {
    const { fileName } = req.params;
    const signedUrl = await getSignedUrl(fileName);
    res.json({ signedUrl });
  } catch (error) {
    logger.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Erro ao obter URL assinada.' });
  }
});

// Listar todos os tickets
router.get('/', auth, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'admin' || req.user.role === 'financeiro') {
      tickets = await Ticket.find()
        .populate('createdBy', 'username')
        .populate('service', 'name')
        .lean();
    } else {
      tickets = await Ticket.find({ createdBy: req.user._id })
        .populate('createdBy', 'username')
        .populate('service', 'name')
        .lean();
    }
    res.render('ticketList', { tickets });
  } catch (err) {
    logger.error('Error loading tickets:', err);
    res.status(500).send('Erro ao carregar os tickets');
  }
});

// GET route for fetching ticket details
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('service', 'name')
      .lean();
    res.json(ticket);
  } catch (error) {
    logger.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Erro ao buscar ticket.' });
  }
});

// PUT route for updating ticket
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, payment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    // Permitir que todos os papéis atualizem o status
    if (['admin', 'financeiro', 'user'].includes(req.user.role) && (status === 'finalizado' || status === 'andamento' || status === 'pendente')) {
      ticket.status = status;
    }
    
    // Permitir que apenas admin e financeiro atualizem o pagamento
    if (['admin', 'financeiro'].includes(req.user.role) && (payment === 'completo' || payment === 'pendente')) {
      ticket.payment = payment;
    }

    await ticket.save();
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Erro ao atualizar ticket.' });
  }
});

router.get('/ticketForm', async (req, res) => {
  try {
    const services = await Service.find();
    res.render('ticketForm', { services });
  } catch (error) {
    res.status(500).send('Erro ao carregar o formulário.');
  }
});

module.exports = router;
