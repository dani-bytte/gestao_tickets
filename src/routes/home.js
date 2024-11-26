// src/routes/home.js
const express = require('express');
const router = express.Router();
const auth = require('@middleware/auth/auth');
const homeController = require('@controllers/homeController');
const { isAdmin, isUser } = require('@controllers/roleController');

router.get('/admin/dashboard-data', auth, isAdmin, homeController.getDashboardData);
router.get('/admin/overdue-tickets', auth, isAdmin, homeController.getOverdueTickets);
router.get('/admin/today-tickets', auth, isAdmin, homeController.getTodayTickets);
router.get('/admin/upcoming-tickets', auth, isAdmin, homeController.getUpcomingTickets);
router.post('/admin/register-info', auth, homeController.registerInfo);
router.get('/profile', auth, homeController.getProfile);

module.exports = router;