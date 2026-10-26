const express = require('express');
const router = express.Router();

const controller = require('../controllers/opportunity.controller');
const validator = require('../middleware/validation.middleware');

router.get('/', controller.list);
router.get('/:id', validator.idParam, controller.readById);
router.post('/', controller.create);
router.put('/:id', validator.idParam, controller.update);
router.delete('/:id', validator.idParam, controller.remove);

// Detalhes
router.get('/:id/status-history', validator.idParam, controller.statusHistory);
router.get('/:id/logs', validator.idParam, controller.logs);
router.get('/:id/comments', validator.idParam, controller.comments);
router.post('/:id/comments', validator.idParam, controller.addComment);

module.exports = router;
