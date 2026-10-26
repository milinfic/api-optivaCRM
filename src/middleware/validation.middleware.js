const { body, param, validationResult } = require('express-validator');

/**
 * Converte os erros do express-validator em resposta 400 padronizada.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos.',
      errors: errors.array().map(error => ({ field: error.path, message: error.msg }))
    });
  }

  next();
};

exports.handleValidation = handleValidation;

exports.login = [
  body('email').trim().notEmpty().withMessage('E-mail é obrigatório.').bail()
    .isEmail().withMessage('E-mail inválido.'),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
  handleValidation
];

exports.register = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('email').trim().notEmpty().withMessage('E-mail é obrigatório.').bail()
    .isEmail().withMessage('E-mail inválido.'),
  body('password').isLength({ min: 4 }).withMessage('Senha deve ter ao menos 4 caracteres.'),
  handleValidation
];

exports.idParam = [
  param('id').isInt({ min: 1 }).withMessage('Id inválido.'),
  handleValidation
];
