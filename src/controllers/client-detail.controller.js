const detail = require('../services/client-detail.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

/**
 * Responde no formato padrão a partir de um resultado de service.
 */
const respond = (res, result, status = 200) =>
  result.success ? ok(res, result.data, status) : fail(res, result.message, 400);

/* ------------------------------- Endereços ------------------------------ */

exports.listAddresses = asyncHandler(async (req, res) =>
  ok(res, await detail.listAddresses(Number(req.params.id)))
);

exports.createAddress = asyncHandler(async (req, res) =>
  respond(res, await detail.createAddress(Number(req.params.id), req.body), 201)
);

exports.updateAddress = asyncHandler(async (req, res) =>
  respond(res, await detail.updateAddress(Number(req.params.addressId), req.body))
);

exports.removeAddress = asyncHandler(async (req, res) =>
  respond(res, await detail.removeAddress(Number(req.params.addressId)))
);

/* -------------------------------- Contatos ------------------------------ */

exports.listContacts = asyncHandler(async (req, res) =>
  ok(res, await detail.listContacts(Number(req.params.id)))
);

exports.createContact = asyncHandler(async (req, res) =>
  respond(res, await detail.createContact(Number(req.params.id), req.body), 201)
);

exports.updateContact = asyncHandler(async (req, res) =>
  respond(res, await detail.updateContact(Number(req.params.contactId), req.body))
);

exports.removeContact = asyncHandler(async (req, res) =>
  respond(res, await detail.removeContact(Number(req.params.contactId)))
);

/* ------------------------------- Documentos ----------------------------- */

exports.listDocuments = asyncHandler(async (req, res) =>
  ok(res, await detail.listDocuments(Number(req.params.id)))
);

exports.createDocument = asyncHandler(async (req, res) =>
  respond(res, await detail.createDocument(Number(req.params.id), req.body, req.user?.id), 201)
);

exports.removeDocument = asyncHandler(async (req, res) =>
  respond(res, await detail.removeDocument(Number(req.params.documentId)))
);
