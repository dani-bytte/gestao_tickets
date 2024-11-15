// src/controllers/serviceController.js
const { body, validationResult } = require('express-validator');
const Category = require('@models/Category');
const Service = require('@models/Service');
const logger = require('@config/logger');

const serviceValidation = [
  body('serviceType')
    .trim()
    .notEmpty()
    .withMessage('Tipo de serviço é obrigatório'),
  body('dueDate')
    .isInt()
    .withMessage('Data de vencimento inválida'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Valor deve ser positivo'),
  body('category').custom(async (value, { req }) => {
    if (value === 'new' && !req.body.newCategory) {
      throw new Error('Nova categoria é obrigatória');
    }
    return true;
  }),
];

const registerService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceType, dueDate, value, category, newCategory } = req.body;
    let categoryId;

    if (category === 'new' && newCategory) {
      const newCategoryDoc = new Category({ name: newCategory });
      await newCategoryDoc.save();
      categoryId = newCategoryDoc._id;
    } else {
      categoryId = category;
    }

    const newService = new Service({
      name: serviceType,
      type: serviceType,
      dueDate: parseInt(dueDate),
      value: parseFloat(value),
      category: categoryId,
      createdBy: req.user._id,
    });

    await newService.save();
    logger.info(`Novo serviço cadastrado por ${req.user.username}`);

    res.status(201).json({
      message: 'Serviço cadastrado com sucesso',
      service: newService,
    });
  } catch (error) {
    logger.error('Erro ao cadastrar serviço:', error);
    res.status(500).json({ error: 'Erro ao cadastrar o serviço' });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('category')
      .populate('createdBy', 'username')
      .lean();

    res.json(services);
  } catch (error) {
    logger.error('Erro ao listar serviços:', error);
    res.status(500).json({ error: 'Erro ao carregar serviços' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.json(service);
  } catch (error) {
    logger.error('Erro ao buscar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  serviceValidation,
  registerService,
  getServices,
  getServiceById,
};