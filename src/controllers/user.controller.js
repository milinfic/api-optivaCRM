const service = require('../services/user.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

exports.list = asyncHandler(async (req, res) => ok(res, await service.list(req.query)));

exports.readById = asyncHandler(async (req, res) => {
  const user = await service.findById(Number(req.params.id));

  if (!user) return fail(res, 'Usuário não encontrado.', 404);

  return ok(res, user);
});

exports.update = asyncHandler(async (req, res) => {
  const result = await service.update(Number(req.params.id), req.body);

  if (!result.success) return fail(res, result.message, 400);

  return ok(res, result.data);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await service.remove(Number(req.params.id));

  if (!result.success) return fail(res, result.message, 404);

  return ok(res, { message: 'Usuário desativado.' });
});
