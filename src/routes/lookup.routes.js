const express = require('express');
const router = express.Router();

const controller = require('../controllers/lookup.controller');

router.get('/:resource', controller.list);
router.post('/:resource', controller.create);
router.put('/:resource/:id', controller.update);
router.delete('/:resource/:id', controller.remove);

module.exports = router;
