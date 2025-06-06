// src/controllers/homeController.js
const User = require('@models/User');
const ProfileUser = require('@models/ProfileUser');
const Ticket = require('@models/Ticket');
const logger = require('@config/logger');
const connectToMongoDB = require('@config/mongoConnection');
const { STATUS, PAYMENT_STATUS } = require('@config/constants');
const Discount = require('@models/Discount');
const Payment = require('@models/Payment');

const getDashboardData = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await connectToMongoDB();

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
    await connectToMongoDB();

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdueTickets = await Ticket.find({
      endDate: { $lt: today },
      status: { $ne: 'finalizado' },
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store');
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
    await connectToMongoDB();

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

    res.setHeader('Cache-Control', 'no-store');
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
    await connectToMongoDB();

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

    res.setHeader('Cache-Control', 'no-store');
    res.json(tickets);
  } catch (error) {
    logger.error('Erro ao buscar próximos tickets:', error);
    res.status(500).json({ error: 'Erro ao buscar próximos tickets' });
  }
};

const getUserOverdueTickets = async (req, res) => {
  try {
    await connectToMongoDB();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdueTickets = await Ticket.find({
      createdBy: req.user._id,
      endDate: { $lt: today },
      status: { $ne: 'finalizado' },
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json(overdueTickets);
  } catch (error) {
    logger.error('Erro ao buscar seus tickets vencidos:', error);
    res.status(500).json({ error: 'Erro ao buscar seus tickets vencidos' });
  }
};

const getUserTodayTickets = async (req, res) => {
  try {
    await connectToMongoDB();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find({
      createdBy: req.user._id,
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento',
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json(tickets);
  } catch (error) {
    logger.error('Erro ao buscar seus tickets de hoje:', error);
    res.status(500).json({ error: 'Erro ao buscar seus tickets de hoje' });
  }
};

const getUserUpcomingTickets = async (req, res) => {
  try {
    await connectToMongoDB();

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const tickets = await Ticket.find({
      createdBy: req.user._id,
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento',
    })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json(tickets);
  } catch (error) {
    logger.error('Erro ao buscar seus próximos tickets:', error);
    res.status(500).json({ error: 'Erro ao buscar seus próximos tickets' });
  }
};

const registerInfo = async (req, res) => {

  const { fullName, nickname, birthDay, birthMonth, birthYear, pixKey, whatsapp, email } = req.body;

  try {
    await connectToMongoDB();

    if (
      !birthDay ||
      !birthMonth ||
      !birthYear ||
      birthDay < 1 ||
      birthDay > 31 ||
      birthMonth < 1 ||
      birthMonth > 12 ||
      birthYear < 1900 ||
      birthYear > new Date().getFullYear()
    ) {
      return res.status(400).json({ error: 'Data de nascimento inválida' });
    }

    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ error: 'Data de nascimento inválida' });
    }

    const user = await User.findById(req.user._id).populate('profile');
    if (!user) {
      logger.warn('Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.profile) {
      logger.warn('Perfil já criado para este usuário');
      return res.status(400).json({ message: 'Perfil já criado para este usuário' });
    }

    const newProfileUser = new ProfileUser({
      user: req.user._id,
      fullName,
      nickname,
      birthDate,
      pixKey,
      whatsapp,
      email,
    });

    await newProfileUser.save();

    user.profile = newProfileUser._id;
    await user.save();

    res.status(201).json({ message: 'Informações registradas com sucesso' });
  } catch (error) {
    logger.error('Erro ao registrar informações:', error);
    res.status(500).json({ error: 'Erro ao registrar informações' });
  }
};

const getProfile = async (req, res) => {
  try {
    await connectToMongoDB();

    const requestedUserId = req.query.user;

    if (!requestedUserId) {
      const user = await User.findById(req.user._id).populate('profile');
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      return res.json(user.profile);
    }

    if (requestedUserId !== req.user._id.toString()) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    const user = await User.findById(requestedUserId).populate('profile');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user.profile);
  } catch (error) {
    logger.error('Erro ao obter informações do perfil:', error);
    res.status(500).json({ message: 'Erro ao obter informações do perfil' });
  }
};


const getUserDashboardData = async (req, res) => {
  try {
    await connectToMongoDB();

    const userId = req.user._id;

    // Get user's tickets counts
    const totalTickets = await Ticket.countDocuments({ createdBy: userId });
    const pendingTickets = await Ticket.countDocuments({ 
      createdBy: userId,
      status: 'andamento' 
    });
    const completedTickets = await Ticket.countDocuments({ 
      createdBy: userId,
      status: 'finalizado', 
      payment: 'pendente' 
    });

    // Calculate due tickets
    const today = new Date();
    const dPlus2 = new Date(today);
    const dueTickets = await Ticket.countDocuments({
      createdBy: userId,
      endDate: { $lte: dPlus2 },
      status: 'andamento',
    });

    // Calculate today's and upcoming tickets
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const todayTickets = await Ticket.countDocuments({
      createdBy: userId,
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento',
    });

    const upcomingTickets = await Ticket.countDocuments({
      createdBy: userId,
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento',
    });

    // Get tickets by month for the user
    const ticketsByMonth = await Ticket.aggregate([
      {
        $match: {
          createdBy: userId
        }
      },
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
      totalTickets,
      pendingTickets,
      completedTickets,
      dueTickets,
      todayTickets,
      upcomingTickets,
      ticketsByMonth: ticketsByMonthArray,
    });
  } catch (error) {
    logger.error('Erro ao obter dados do dashboard do usuário:', error);
    res.status(500).json({ message: 'Erro ao obter dados do dashboard' });
  }
};

const getUsersTicketsCount = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await connectToMongoDB();

    const usersWithTickets = await Ticket.aggregate([
      {
        $group: {
          _id: '$createdBy',
          ticketCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          username: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo.username', 0] },
              else: 'none'
            }
          },
          ticketCount: 1,
          _id: 0
        }
      }
    ]);

    res.json(usersWithTickets);
  } catch (error) {
    logger.error('Erro ao obter contagem de tickets por usuário:', error);
    res.status(500).json({ error: 'Erro ao obter contagem de tickets por usuário' });
  }
};

const getPendingFinalizedTickets = async (req, res) => {
  try {
    await connectToMongoDB();

    const tickets = await Ticket.find({
      status: STATUS.FINALIZADO,
      payment: PAYMENT_STATUS.PENDENTE
    })
      .populate('createdBy', 'username')
      .populate('service', 'value')
      .populate('discount', 'desconto')
      .lean();

    const result = tickets.map(ticket => {
      const serviceValue = ticket.service.value;
      const discountValue = ticket.discount ? (serviceValue * ticket.discount.desconto) / 100 : 0;
      const finalValue = serviceValue - discountValue;

      return {
        ticketNumber: ticket.ticket,
        userName: ticket.createdBy ? ticket.createdBy.username : 'Usuário não encontrado',
        finalValue: finalValue,
        discountApplied: ticket.discount ? `${ticket.discount.desconto}%` : '0%',
        repasse: ticket.repasse ? `${ticket.repasse}%` : 'N/A',
        proofUrl: ticket.proofUrl || null
      };
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro ao buscar tickets finalizados e pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets finalizados e pendentes' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    await connectToMongoDB();

    const { ticketId, finalValue, newDiscountId } = req.body;

    // Find ticket by ticket number instead of _id
    const ticket = await Ticket.findOne({ ticket: ticketId })
      .populate('service', 'value')
      .populate('discount', 'desconto');

    if (!ticket) {
      logger.warn(`Ticket não encontrado: ${ticketId}`);
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Calculate original value
    const originalValue = ticket.service.value;
    let discountApplied = 0;

    // Update discount if provided
    if (newDiscountId) {
      try {
        const newDiscount = await Discount.findById(newDiscountId);
        if (newDiscount) {
          ticket.discount = newDiscountId;
          discountApplied = newDiscount.desconto;
        }
      } catch (discountError) {
        logger.error('Erro ao aplicar desconto:', discountError);
      }
    }

    // Create payment record
    const payment = new Payment({
      ticket: ticket._id,
      ticketNumber: ticket.ticket,
      originalValue,
      finalValue,
      discountApplied,
      confirmedBy: req.user._id
    });

    await payment.save();

    // Update ticket status
    ticket.payment = 'completo';
    await ticket.save();

    res.json({
      message: 'Pagamento confirmado com sucesso',
      payment: payment
    });

  } catch (error) {
    logger.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
};

module.exports = {
  getDashboardData,
  getOverdueTickets,
  getTodayTickets,
  getUpcomingTickets,
  registerInfo,
  getProfile,
  getUserDashboardData,
  getUserOverdueTickets,
  getUserTodayTickets,
  getUserUpcomingTickets,
  getUsersTicketsCount,
  getPendingFinalizedTickets,
  confirmPayment
};