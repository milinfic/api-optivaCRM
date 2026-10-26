const service = require('../services/lookup.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

const respond = (res, result, status = 200) =>
  result.success ? ok(res, result.data, status) : fail(res, result.message, 400);

/**
 * GET /lookups/:resource
 */
exports.list = asyncHandler(async (req, res) => {
  const result = await service.list(req.params.resource, req.query);

  if (!result.success) return fail(res, result.message, 404);

  return ok(res, result.data);
});

/**
 * POST /lookups/:resource
 */
exports.create = asyncHandler(async (req, res) =>
  respond(res, await service.create(req.params.resource, req.body), 201)
);

/**
 * PUT /lookups/:resource/:id
 */
exports.update = asyncHandler(async (req, res) =>
  respond(res, await service.update(req.params.resource, Number(req.params.id), req.body))
);

/**
 * DELETE /lookups/:resource/:id
 */
exports.remove = asyncHandler(async (req, res) =>
  respond(res, await service.remove(req.params.resource, Number(req.params.id)))
);
