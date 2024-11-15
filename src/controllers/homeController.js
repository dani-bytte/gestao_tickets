// src/controllers/homeController.js
const User = require('@models/User');
const ProfileUser = require('@models/ProfileUser');
const Ticket = require('@models/Ticket');
const logger = require('@config/logger');
const { ROLES } = require('@config/constants');

const getDashboardData = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const pendingTickets = await Ticket.countDocuments({ status: 'andamento' });
    const completedTickets = await Ticket.countDocuments({ status: 'finalizado', payment: 'pendente' });

    const today = new Date();
    const dPlus2 = new Date(today);
    const dueTickets = await Ticket.countDocuments({
      endDate: { $lte: dPlus2 },
      status: 'andamento',
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const todayTickets = await Ticket.countDocuments({
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento',
    });
    const upcomingTickets = await Ticket.countDocuments({
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento',
    });

    // Assumindo que você tem um campo createdAt no modelo Ticket
    const ticketsByMonth = await Ticket.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const ticketsByMonthArray = Array(12).fill(0);
    ticketsByMonth.forEach((ticket) => {
      ticketsByMonthArray[ticket._id - 1] = ticket.count;
    });

    res.json({
      totalUsers,
      totalTickets,
      pendingTickets,
      completedTickets,
      dueTickets,
      todayTickets,
      upcomingTickets,
      ticketsByMonth: ticketsByMonthArray,
    });
  } catch (error) {
    logger.error('Erro ao obter dados do dashboard:', error);
    res.status(500).json({ message: 'Erro ao obter dados do dashboard' });
  }
};

const getOverdueTickets = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdueTickets = await Ticket.find({
      endDate: { $lt: today },
      status: { $ne: 'finalizado' },
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(overdueTickets);
  } catch (error) {
    logger.error('Erro ao buscar tickets vencidos:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets vencidos' });
  }
};

const getTodayTickets = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find({
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento',
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(tickets);
  } catch (error) {
    logger.error('Erro ao buscar tickets de hoje:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets de hoje' });
  }
};

const getUpcomingTickets = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const tickets = await Ticket.find({
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento',
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(tickets);
  } catch (error) {
    logger.error('Erro ao buscar próximos tickets:', error);
    res.status(500).json({ error: 'Erro ao buscar próximos tickets' });
  }
};

const registerInfo = async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { fullName, nickname, birthDate, pixKey, whatsapp, email } = req.body;

  // Log dos dados recebidos
  //console.log('Dados recebidos:', { fullName, nickname, birthDate, pixKey, whatsapp, email });

  try {
    // Verificar se o usuário já possui um perfil
    const user = await User.findById(req.user._id).populate('profile');
    if (!user) {
      logger.warn('Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.profile) {
      // Se o usuário já possui um perfil, retornar uma mensagem apropriada
      logger.warn('Perfil já criado para este usuário');
      return res.status(400).json({ message: 'Perfil já criado para este usuário' });
    }

    // Criar um novo documento ProfileUser
    const newProfileUser = new ProfileUser({
      fullName,
      nickname,
      birthDate,
      pixKey,
      whatsapp,
      email,
    });

    await newProfileUser.save();

    // Atualizar o usuário atual para referenciar o novo ProfileUser
    user.profile = newProfileUser._id;
    await user.save();

    res.status(201).json({ message: 'Informações registradas com sucesso' });
  } catch (error) {
    logger.error('Erro ao registrar informações:', error);
    console.error('Erro ao registrar informações:', error); // Adiciona log no console
    res.status(500).json({ error: 'Erro ao registrar informações' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('profile');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user.profile);
  } catch (error) {
    logger.error('Erro ao obter informações do perfil:', error);
    res.status(500).json({ message: 'Erro ao obter informações do perfil' });
  }
};

module.exports = {
  getDashboardData,
  getOverdueTickets,
  getTodayTickets,
  getUpcomingTickets,
  registerInfo,
  getProfile,
};