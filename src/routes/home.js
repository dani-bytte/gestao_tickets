// src/routes/home.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const authRole = require('@middleware/auth/roleAuth');
const homeController = require('@controllers/homeController');

router.get('/admin/dashboard-data', auth, homeController.getDashboardData);
router.get('/admin/overdue-tickets', auth, homeController.getOverdueTickets);
router.get('/admin/today-tickets', auth, homeController.getTodayTickets);
router.get('/admin/upcoming-tickets', auth, homeController.getUpcomingTickets);

//rotas paginas
router.get('/admin', auth, authRole(['admin']), homeController.renderAdminPage);
router.get('/financeiro', auth, authRole(['admin', 'financeiro']), homeController.renderFinanceiroPage);
router.get('/home', auth, authRole(['admin', 'financeiro', 'user']), homeController.redirectToRolePage);
router.get('/', auth, authRole(['admin', 'financeiro', 'user']), homeController.redirectToRolePage);

module.exports = router;