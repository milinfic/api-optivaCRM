const express = require('express');
const router = express.Router();

const controller = require('../controllers/interaction.controller');
const validator = require('../middleware/validation.middleware');

router.get('/', controller.list);
router.post('/', controller.create);
router.delete('/:id', validator.idParam, controller.remove);

module.exports = router;
