// home.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authRole = require('../middleware/roleAuth');

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
