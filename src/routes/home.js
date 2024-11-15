// src/routes/home.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const homeController = require('@controllers/homeController');

router.get('/admin/dashboard-data', auth, homeController.getDashboardData);
router.get('/admin/overdue-tickets', auth, homeController.getOverdueTickets);
router.get('/admin/today-tickets', auth, homeController.getTodayTickets);
router.get('/admin/upcoming-tickets', auth, homeController.getUpcomingTickets);
router.post('/admin/register-info', auth, homeController.registerInfo);
router.get('/profile', auth, homeController.getProfile);

module.exports = router;