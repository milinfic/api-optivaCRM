const express = require('express');
const router = express.Router();

const controller = require('../controllers/user.controller');
const validator = require('../middleware/validation.middleware');

router.get('/', controller.list);
router.get('/:id', validator.idParam, controller.readById);
router.put('/:id', validator.idParam, controller.update);
router.delete('/:id', validator.idParam, controller.remove);

module.exports = router;
