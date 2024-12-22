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
router.get('/admin/ticketscount', auth, isAdmin, homeController.getUsersTicketsCount);

router.get('/profile', auth, homeController.getProfile);


// User dashboard
router.get('/user-dashboard', auth, isUser, homeController.getUserDashboardData);
router.get('/dueTickets', auth, isUser, homeController.getUserOverdueTickets);
router.get('/todayTickets', auth, isUser, homeController.getUserTodayTickets);
router.get('/upcoming-tickets', auth, isUser, homeController.getUserUpcomingTickets);

// payment
router.post('/admin/payments/confirm', auth, isAdmin, homeController.confirmPayment);
router.get('/admin/payments/list', auth, isAdmin, homeController.getPendingFinalizedTickets);


module.exports = router;