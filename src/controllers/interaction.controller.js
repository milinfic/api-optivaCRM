const service = require('../services/interaction.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

exports.list = asyncHandler(async (req, res) => ok(res, await service.list(req.query)));

exports.create = asyncHandler(async (req, res) => {
  const result = await service.create(req.body, req.user?.id);

  if (!result.success) return fail(res, result.message, 400);

  return ok(res, result.data, 201);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await service.remove(Number(req.params.id));

  if (!result.success) return fail(res, result.message, 404);

  return ok(res, { message: 'Interação removida.' });
});
