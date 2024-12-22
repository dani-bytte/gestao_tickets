// src/controllers/ticketController.js
const multer = require('multer');
const sharp = require('sharp');
const { connectToMinio, initializeBucket } = require('@config/minioConnection');
const logger = require('@config/logger');
const Ticket = require('@models/Ticket');
const Service = require('@models/Service');
const Category = require('@models/Category'); 
const { minioConfig } = require('@config/minioClient');
const connectToMongoDB = require('@config/mongoConnection');
const { body, validationResult } = require('express-validator');
const Discount = require('@models/Discount');

const upload = multer({ storage: multer.memoryStorage() });

const createTicket = async (req, res) => {
  try {
    await connectToMongoDB();

    const { ticket, serviceId, client, email, startDate, discountId } = req.body;
    let proofUrl = null;

    if (!ticket || !serviceId || !client || !email || !startDate) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Handle default/no discount case
    let finalDiscountId = null;
    if (discountId && discountId !== 'default') {
      finalDiscountId = discountId;
    }

    const existingTicket = await Ticket.findOne({ ticket });
    if (existingTicket) {
      logger.warn(`Tentativa de criar ticket duplicado: ${ticket} por usuário ${req.user.username}`);
      return res.status(409).json({ error: 'Ticket já existe' });
    }

    if (req.file) {
      await initializeBucket(); // Ensure bucket is initialized
      const minioClient = connectToMinio();
      const fileName = `Stelaryous/${req.user.username}/${ticket}.webp`;
      // Get directory path from the full file path
      const dirPath = `Stelaryous/${req.user.username}`;

      // Create directory if it doesn't exist
      const exists = await minioClient.bucketExists(minioConfig.bucketName);
      if (!exists) {
        await minioClient.makeBucket(minioConfig.bucketName);
      }

      try {
        await minioClient.putObject(minioConfig.bucketName, dirPath + '/', '');
      } catch (err) {
        // Directory already exists, continue
      }

      // Convert the image to WebP format
      const webpBuffer = await sharp(req.file.buffer)
        .webp()
        .toBuffer();

      await minioClient.putObject(minioConfig.bucketName, fileName, webpBuffer, {
        'Content-Type': 'image/webp'
      });

      proofUrl = fileName; // Deve ser uma string
      logger.info('Arquivo de comprovante enviado:', fileName);
    }

    // Buscar o serviço para obter o dueDate
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime)) {
      return res.status(400).json({ error: 'Data de início inválida' });
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + service.dueDate);

    const newTicket = new Ticket({
      ticket,
      service: serviceId,
      client,
      email,
      startDate: startDateTime,
      endDate: endDateTime,
      proofUrl,
      status: 'andamento',
      payment: 'pendente',
      createdBy: req.user._id,
      discount: finalDiscountId // Will be null if discountId is 'default' or not provided
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

const getProofImage = async (req, res) => {
  try {
    await connectToMongoDB();

    const { fileName } = req.params;
    const minioClient = connectToMinio();

    // Verificar se o usuário tem acesso ao ticket
    const ticket = await Ticket.findOne({ proofUrl: fileName });

    if (!ticket) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // Verificar se o usuário tem permissão para acessar a imagem deste ticket
    if (
      ticket.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Obter o objeto do MinIO
    minioClient.getObject(
      minioConfig.bucketName,
      fileName,
      (err, dataStream) => {
        if (err) {
          logger.error('Erro ao obter objeto do MinIO:', err);
          return res.status(500).json({ error: 'Erro ao obter a imagem' });
        }

        res.setHeader('Content-Type', 'image/jpeg'); // Ajuste conforme o tipo de imagem
        dataStream.pipe(res);
      }
    );
  } catch (error) {
    logger.error('Erro ao recuperar imagem:', error);
    res.status(500).json({ error: 'Erro ao recuperar imagem' });
  }
};

const listTickets = async (req, res) => {
  try {
    await connectToMongoDB();

    let query = { isHidden: false };
    if (req.user.role !== 'admin' && req.user.role !== 'financeiro') {
      query.createdBy = req.user._id;
    }

    const tickets = await Ticket.find(query)
      .populate('createdBy', 'username')
      .populate('service', 'name')
      .populate('discount', 'desconto cargo') // Popula o campo discount
      .lean();

    res.json(tickets);
  } catch (err) {
    logger.error('Erro ao carregar os tickets:', err);
    res.status(500).json({ error: 'Erro ao carregar os tickets' });
  }
};

const getTicketById = async (req, res) => {
  try {
    await connectToMongoDB();

    const ticket = await Ticket.findById(req.params.id)
      .populate('service', 'name')
      .populate('createdBy', 'username')
      .populate('discount', 'desconto cargo') // Popula o campo discount
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
    await connectToMongoDB();

    const { status, payment, discountId } = req.body;
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

    // Atualizar o campo discount opcionalmente
    if (discountId) {
      ticket.discount = discountId;
    }

    await ticket.save();
    res.json({ message: 'Ticket atualizado com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro ao atualizar ticket.' });
  }
};

const handleViewProof = async () => {
  if (!ticket.proofUrl) return;

  console.log('ticket.proofUrl:', ticket.proofUrl);

  try {
    const token = localStorage.getItem('token');
    const encodedFileName = encodeURIComponent(ticket.proofUrl);

    // Use direct proxy endpoint with token
    const proxyUrl = `/api/tickets/proof-image/${encodedFileName}?token=${token}`;
    setProofUrl(proxyUrl);
    setDialogOpen(true);
  } catch (error) {
    console.error('Error:', error);
    toast({
      title: 'Error',
      description: 'Failed to open proof document',
      variant: 'destructive',
    });
  }
};

const handleCreateTicket = async () => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('ticket', newTicket.ticket);
    formData.append('serviceId', newTicket.serviceId);
    formData.append('client', newTicket.client);
    formData.append('email', newTicket.email);
    formData.append('startDate', newTicket.startDate);
    formData.append('endDate', newTicket.endDate);
    if (newTicket.proof) {
      formData.append('proof', newTicket.proof);
    }

    const response = await fetch('/api/tickets/new', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }

    const result = await response.json();
    console.log('Ticket criado:', result);

    setIsDialogOpen(false);
    setNewTicket({
      ticket: '',
      serviceId: '',
      client: '',
      email: '',
      startDate: '',
      endDate: '',
      proof: null,
    });
    await fetchTickets();

    toast({
      title: 'Success',
      description: 'Ticket created successfully',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    toast({
      title: 'Error',
      description: 'An unexpected error occurred',
      variant: 'destructive',
    });
  }
};

const listServices = async (req, res) => {
  try {
    const services = await Service.find({ isHidden: false })
      .populate('category', 'name')
      .select('-type -__v')
      .lean();
    res.json(services);
  } catch (error) {
    logger.error('Erro ao listar serviços:', error);
    res.status(500).json({ error: 'Erro ao listar serviços' });
  }
};

// Validation middleware
const validateService = [
  body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('dueDate').isInt({ min: 1 }).withMessage('Prazo deve ser um número positivo'),
  body('value').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
];

const validateCategory = [
  body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
];

// Create new service
const createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dueDate, value, category } = req.body;

    // Verify if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    const service = new Service({
      name,
      dueDate,
      value,
      category,
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    logger.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Check if category already exists
    const categoryExists = await Category.findOne({ name: name.toUpperCase() });
    if (categoryExists) {
      return res.status(400).json({ error: 'Categoria já existe' });
    }

    const category = new Category({
      name: name.toUpperCase(),
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    logger.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

// List all categories
const listCategories = async (req, res) => {
  try {
    const categories = await Category.find().select('-__v').lean();
    res.json(categories);
  } catch (error) {
    logger.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
};

const hideTicket = async (req, res) => {
  try {
    await connectToMongoDB();

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Only admin or ticket creator can hide
    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    ticket.isHidden = true;
    await ticket.save();

    logger.info(`Ticket ${ticket._id} ocultado por ${req.user.username}`);
    res.json({ message: 'Ticket ocultado com sucesso' });
  } catch (error) {
    logger.error('Erro ao ocultar ticket:', error);
    res.status(500).json({ error: 'Erro ao ocultar ticket' });
  }
};

const hideService = async (req, res) => {
  try {
    await connectToMongoDB();

    // Only admin can hide services
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    service.isHidden = true;
    await service.save();

    logger.info(`Serviço ${service._id} ocultado por ${req.user.username}`);
    res.json({ message: 'Serviço ocultado com sucesso' });
  } catch (error) {
    logger.error('Erro ao ocultar serviço:', error);
    res.status(500).json({ error: 'Erro ao ocultar serviço' });
  }
};

const listDiscounts = async (req, res) => {
  try {
    await connectToMongoDB();
    const discounts = await Discount.find().lean();
    res.json(discounts);
  } catch (error) {
    logger.error('Erro ao listar descontos:', error);
    res.status(500).json({ error: 'Erro ao listar descontos' });
  }
};

const createDiscount = async (req, res) => {
  try {
    await connectToMongoDB();

    const { desconto, cargo } = req.body;

    if (!desconto || !cargo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const newDiscount = new Discount({
      desconto,
      cargo,
      visivel: true
    });

    await newDiscount.save();
    logger.info(`Desconto criado para cargo ${cargo}`);
    res.status(201).json(newDiscount);
  } catch (error) {
    logger.error('Erro ao criar desconto:', error);
    res.status(500).json({ error: 'Erro ao criar desconto' });
  }
};

const hideDiscount = async (req, res) => {
  try {
    await connectToMongoDB();

    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ error: 'Desconto não encontrado' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    discount.visivel = !discount.visivel;
    await discount.save();

    logger.info(`Visibilidade do desconto ${discount._id} alterada por ${req.user.username}`);
    res.json({ message: 'Visibilidade do desconto alterada com sucesso' });
  } catch (error) {
    logger.error('Erro ao alterar visibilidade do desconto:', error);
    res.status(500).json({ error: 'Erro ao alterar visibilidade do desconto' });
  }
};

const updateDiscount = async (req, res) => {
  try {
    await connectToMongoDB();

    const { desconto, cargo } = req.body;
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({ error: 'Desconto não encontrado' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    if (desconto) discount.desconto = desconto;
    if (cargo) discount.cargo = cargo;

    await discount.save();
    logger.info(`Desconto ${discount._id} atualizado por ${req.user.username}`);
    res.json({ message: 'Desconto atualizado com sucesso' });

  } catch (error) {
    logger.error('Erro ao atualizar desconto:', error);
    res.status(500).json({ error: 'Erro ao atualizar desconto' });
  }
};

module.exports = {
  upload,
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  getProofImage,
  handleViewProof,
  handleCreateTicket,
  listServices,
  validateService,
  validateCategory,
  createService,
  createCategory,
  listCategories,
  hideTicket,
  hideService,
  listDiscounts,
  createDiscount,
  hideDiscount,
  updateDiscount
};