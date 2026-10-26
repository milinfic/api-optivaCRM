const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validator = require('../middleware/validation.middleware');

// PÚBLICAS
router.post('/login', validator.login, authController.login);
router.post('/refresh', authController.refresh);
router.post('/register', validator.register, authController.register);

// PROTEGIDAS
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware.verifyToken, authController.profile);

module.exports = router;
