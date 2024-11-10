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
router.get('/admin', auth, authRole('admin'), homeController.renderAdminPage);
router.get('/financeiro', auth, authRole('financeiro'), homeController.renderFinanceiroPage);
router.get('/user', auth, homeController.renderUserPage);
router.get('/', auth, homeController.redirectToRolePage);

module.exports = router;