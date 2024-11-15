// src/controllers/ticketController.js
const multer = require('multer');
const { minioClient, minioConfig, getSignedUrl } = require('@config/minioClient');
const logger = require('@config/logger');
const Ticket = require('@models/Ticket');
const Service = require('@models/Service');

const upload = multer({ storage: multer.memoryStorage() });

const createTicket = async (req, res) => {
  try {
    const { ticket, service, client, email, startDate, endDate, timeZone } = req.body;
    let proofUrl = null;

    if (req.file) {
      const fileName = `Stelaryous/${req.user.username}_${req.file.originalname}`;
      await minioClient.putObject(minioConfig.bucketName, fileName, req.file.buffer, {
        'Content-Type': req.file.mimetype
      });

      proofUrl = fileName;
      logger.info('Arquivo de comprovante enviado:', fileName);
    }

    // Ajustar as datas para o fuso horário recebido
    const startDateTime = new Date(`${startDate}T00:00:00${timeZone}`);
    const endDateTime = new Date(`${endDate}T00:00:00${timeZone}`);

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
    logger.info(`Ticket criado por ${req.user.username}`);

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket: newTicket
    });

  } catch (error) {
    logger.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
};

const getSignedProofUrl = async (req, res) => {
  try {
    const { fileName } = req.params;
    const signedUrl = await getSignedUrl(fileName);
    res.json({ signedUrl });
  } catch (error) {
    logger.error('Erro ao obter URL assinada:', error);
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

    res.json(tickets);
  } catch (err) {
    logger.error('Erro ao carregar os tickets:', err);
    res.status(500).json({ error: 'Erro ao carregar os tickets' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('service', 'name')
      .lean();

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Erro ao buscar ticket:', error);
    res.status(500).json({ error: 'Erro ao buscar ticket.' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const { status, payment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Permitir que todos os papéis atualizem o status
    if (
      ['admin', 'financeiro', 'user'].includes(req.user.role) &&
      ['finalizado', 'andamento', 'pendente'].includes(status)
    ) {
      ticket.status = status;
    }
    
    // Permitir que apenas admin e financeiro atualizem o pagamento
    if (
      ['admin', 'financeiro'].includes(req.user.role) &&
      ['completo', 'pendente'].includes(payment)
    ) {
      ticket.payment = payment;
    }

    await ticket.save();
    res.json({ message: 'Ticket atualizado com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro ao atualizar ticket.' });
  }
};

module.exports = {
  upload,
  createTicket,
  getSignedProofUrl,
  listTickets,
  getTicketById,
  updateTicket
};