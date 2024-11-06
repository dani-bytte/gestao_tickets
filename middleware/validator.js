// middleware/validator.js
const { body, validationResult } = require('express-validator');

const validateTicket = [
  body('ticket').notEmpty().trim(),
  body('service').notEmpty(),
  body('client').notEmpty().trim(),
  body('email').isEmail(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];