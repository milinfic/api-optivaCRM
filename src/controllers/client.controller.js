const clientService = require('../services/client.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

/**
 * GET /clients?page&limit&search&active&client_segment_id&client_group_id
 */
exports.list = asyncHandler(async (req, res) => {
  const result = await clientService.list(req.query);

  return ok(res, result);
});

/**
 * GET /clients/:id
 */
exports.readById = asyncHandler(async (req, res) => {
  const client = await clientService.findById(Number(req.params.id));

  if (!client) return fail(res, 'Cliente não encontrado.', 404);

  return ok(res, client);
});

/**
 * POST /clients
 */
exports.create = asyncHandler(async (req, res) => {
  const result = await clientService.create(req.body);

  if (!result.success) return fail(res, result.message, 400);

  return ok(res, result.data, 201);
});

/**
 * PUT /clients/:id
 */
exports.update = asyncHandler(async (req, res) => {
  const result = await clientService.update(Number(req.params.id), req.body);

  if (!result.success) return fail(res, result.message, 400);

  return ok(res, result.data);
});

/**
 * DELETE /clients/:id
 */
exports.remove = asyncHandler(async (req, res) => {
  const result = await clientService.remove(Number(req.params.id));

  if (!result.success) return fail(res, result.message, 404);

  return ok(res, { message: 'Cliente removido.' });
});
