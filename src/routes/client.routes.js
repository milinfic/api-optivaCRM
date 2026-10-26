const express = require('express');
const router = express.Router();

const controller = require('../controllers/client.controller');
const validator = require('../middleware/validation.middleware');

router.get('/', controller.list);
router.get('/:id', validator.idParam, controller.readById);
router.post('/', controller.create);
router.put('/:id', validator.idParam, controller.update);
router.delete('/:id', validator.idParam, controller.remove);

module.exports = router;
