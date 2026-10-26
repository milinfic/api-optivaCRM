const express = require('express');
const router = express.Router();

const controller = require('../controllers/client-detail.controller');
const validator = require('../middleware/validation.middleware');

// Endereços
router.get('/:id/addresses', validator.idParam, controller.listAddresses);
router.post('/:id/addresses', validator.idParam, controller.createAddress);
router.put('/:id/addresses/:addressId', controller.updateAddress);
router.delete('/:id/addresses/:addressId', controller.removeAddress);

// Contatos
router.get('/:id/contacts', validator.idParam, controller.listContacts);
router.post('/:id/contacts', validator.idParam, controller.createContact);
router.put('/:id/contacts/:contactId', controller.updateContact);
router.delete('/:id/contacts/:contactId', controller.removeContact);

// Documentos
router.get('/:id/documents', validator.idParam, controller.listDocuments);
router.post('/:id/documents', validator.idParam, controller.createDocument);
router.delete('/:id/documents/:documentId', controller.removeDocument);

module.exports = router;
