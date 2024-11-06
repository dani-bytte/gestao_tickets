function checkUserRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para acessar essa página.' });
    }
    console.log('Verificando papel do usuário:', req.user.role);

    next();
  };
}

module.exports = checkUserRole;