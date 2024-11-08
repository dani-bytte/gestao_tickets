// home.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authRole = require('../middleware/roleAuth');
const User = require('../models/User');
const Ticket = require('../models/Ticket');



// Rota para buscar os dados da dashboard
router.get('/admin/dashboard-data', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

  try {
    const totalUsers = await User.countDocuments();
    
    // Count only tickets in progress
    const totalTickets = await Ticket.countDocuments({ 
      status: 'andamento'
    });
    
    const pendingTickets = await Ticket.countDocuments({ 
      status: 'andamento' 
    });
    
    // Count completed tickets that are not paid
    const completedTickets = await Ticket.countDocuments({ 
      status: 'finalizado',
      payment: 'pendente'
    });

    const today = new Date();
    const dPlus2 = new Date(today);
    dPlus2.setDate(today.getDate() + 2);
    
    // Include only tickets in progress for due tickets count
    const dueTickets = await Ticket.countDocuments({ 
      endDate: { $lte: dPlus2 },
      status: 'andamento'
    });

    // Get today's date (start and end)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get next 2 days range
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    // Count tickets due today
    const todayTickets = await Ticket.countDocuments({
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento'
    });

    // Count tickets due in next 2 days
    const upcomingTickets = await Ticket.countDocuments({
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento'
    });

    res.json({
      totalUsers,
      totalTickets,
      pendingTickets,
      completedTickets,
      dueTickets,
      todayTickets,
      upcomingTickets
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Erro ao buscar dados da dashboard');
  }
});

router.get('/admin/overdue-tickets', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final do dia atual
    
    const overdueTickets = await Ticket.find({ 
      endDate: { $lt: today }, // Buscar todos os tickets com endDate anterior a hoje
      status: { $ne: 'finalizado' } // Excluir tickets finalizados
    })
    .populate('createdBy', 'username')
    .select('ticket endDate createdBy status')
    .lean();

    res.json(overdueTickets);
  } catch (error) {
    console.error('Error fetching overdue tickets:', error);
    res.status(500).send('Erro ao buscar tickets vencidos');
  }
});

router.get('/admin/today-tickets', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Acesso negado');

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find({
      endDate: { $gte: todayStart, $lte: todayEnd },
      status: 'andamento'
    })
    .populate('createdBy', 'username')
    .select('ticket endDate createdBy status')
    .lean();

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching today tickets:', error);
    res.status(500).send('Erro ao buscar tickets');
  }
});

router.get('/admin/upcoming-tickets', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Acesso negado');

  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(todayEnd.getDate() + 2);

    const tickets = await Ticket.find({
      endDate: { $gt: todayEnd, $lte: twoDaysLater },
      status: 'andamento'
    })
    .populate('createdBy', 'username')
    .select('ticket endDate createdBy status')
    .lean();

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching upcoming tickets:', error);
    res.status(500).send('Erro ao buscar tickets');
  }
});

// Rota acessível apenas por administradores
router.get('/admin', auth, authRole('admin'), (req, res) => {
  res.render('admin', { username: req.user.username });
});

// Rota acessível apenas por usuários financeiros
router.get('/financeiro', auth, authRole('financeiro'), (req, res) => {
  res.render('financeiro', { username: req.user.username });
});

// Rota padrão para qualquer usuário autenticado
router.get('/user', auth, (req, res) => {
  res.render('user', { username: req.user.username });
});

// Rota principal para redirecionar de acordo com a função
router.get('/', auth, (req, res) => {
  const role = req.user.role;
  if (role === 'admin') {
    res.redirect('/home/admin');
  } else if (role === 'financeiro') {
    res.redirect('/home/financeiro');
  } else {
    res.redirect('/home/user');
  }
});

module.exports = router;
