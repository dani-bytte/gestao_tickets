// src/controllers/ticketController.js
const multer = require('multer');
const { minioClient, minioConfig, getSignedUrl } = require('@config/minioClient');
const logger = require('@config/logger');
const Ticket = require('@models/Ticket');
const Service = require('@models/Service');

const upload = multer({ storage: multer.memoryStorage() });

const renderTicketForm = async (req, res) => {
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
};

const createTicket = async (req, res) => {
  try {
    const { ticket, service, client, email, startDate, endDate, timeZone } = req.body;
    let proofUrl = null;

    if (req.file) {
      const fileName = `Stelaryous/${req.user}_${req.file.originalname}`;
      await minioClient.putObject(minioConfig.bucketName, fileName, req.file.buffer, {
        'Content-Type': req.file.mimetype
      });

      proofUrl = fileName;
      logger.info('Proof file uploaded:', fileName);
    }

    // Ajustar as datas para o fuso horário recebido
    const startDateTime = new Date(`${startDate}T00:00:00${timeZone}`);
    logger.info('Start date:', startDateTime);
    const endDateTime = new Date(`${endDate}T00:00:00${timeZone}`);
    logger.info('End date:', endDateTime);

    const newTicket = new Ticket({
      ticket,
      service,
      client,
      email,
      startDate: startDateTime,
      endDate: endDateTime,
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
};

const getSignedProofUrl = async (req, res) => {
  try {
    const { fileName } = req.params;
    const signedUrl = await getSignedUrl(fileName);
    res.json({ signedUrl });
  } catch (error) {
    logger.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Erro ao obter URL assinada.' });
  }
};

const listTickets = async (req, res) => {
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
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('service', 'name')
      .lean();
    res.json(ticket);
  } catch (error) {
    logger.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Erro ao buscar ticket.' });
  }
};

const updateTicket = async (req, res) => {
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
};

module.exports = {
  upload,
  renderTicketForm,
  createTicket,
  getSignedProofUrl,
  listTickets,
  getTicketById,
  updateTicket
};