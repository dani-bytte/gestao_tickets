// src/controllers/homeController.js
const User = require('@models/User');
const Ticket = require('@models/Ticket');

const getDashboardData = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

  try {
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments({ status: 'andamento' });
    const pendingTickets = await Ticket.countDocuments({ status: 'andamento' });
    const completedTickets = await Ticket.countDocuments({ status: 'finalizado', payment: 'pendente' });

    const today = new Date();
    const dPlus2 = new Date(today);
    dPlus2.setDate(today.getDate() + 2);
    const dueTickets = await Ticket.countDocuments({ endDate: { $lte: dPlus2 }, status: 'andamento' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const todayTickets = await Ticket.countDocuments({ endDate: { $gte: todayStart, $lte: todayEnd }, status: 'andamento' });
    const upcomingTickets = await Ticket.countDocuments({ endDate: { $gt: todayEnd, $lte: twoDaysLater }, status: 'andamento' });

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json({ totalUsers, totalTickets, pendingTickets, completedTickets, dueTickets, todayTickets, upcomingTickets });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Erro ao buscar dados da dashboard');
  }
};

const getOverdueTickets = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdueTickets = await Ticket.find({ endDate: { $lt: today }, status: { $ne: 'finalizado' } })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(overdueTickets);
  } catch (error) {
    console.error('Error fetching overdue tickets:', error);
    res.status(500).send('Erro ao buscar tickets vencidos');
  }
};

const getTodayTickets = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Acesso negado');

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find({ endDate: { $gte: todayStart, $lte: todayEnd }, status: 'andamento' })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching today tickets:', error);
    res.status(500).send('Erro ao buscar tickets');
  }
};

const getUpcomingTickets = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Acesso negado');

  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const tickets = await Ticket.find({ endDate: { $gt: todayEnd, $lte: twoDaysLater }, status: 'andamento' })
      .populate('createdBy', 'username')
      .select('ticket endDate createdBy status')
      .lean();

    res.setHeader('Cache-Control', 'no-store'); // Evitar cache
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching upcoming tickets:', error);
    res.status(500).send('Erro ao buscar tickets');
  }
};

const renderAdminPage = (req, res) => {
  res.render('admin', { username: req.user.username });
};

const renderFinanceiroPage = (req, res) => {
  res.render('financeiro', { username: req.user.username });
};

const renderUserPage = (req, res) => {
  res.render('user', { username: req.user.username });
};

const redirectToRolePage = (req, res) => {
  const role = req.user.role;
  if (role === 'admin') {
    res.redirect('/admin');
  } else if (role === 'financeiro') {
    res.redirect('/financeiro');
  } else {
    res.redirect('/user');
  }
};

module.exports = {
  getDashboardData,
  getOverdueTickets,
  getTodayTickets,
  getUpcomingTickets,
  renderAdminPage,
  renderFinanceiroPage,
  renderUserPage,
  redirectToRolePage
};