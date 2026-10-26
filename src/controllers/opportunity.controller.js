const service = require('../services/opportunity.service');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

const respond = (res, result, status = 200) =>
  result.success ? ok(res, result.data, status) : fail(res, result.message, 400);

exports.list = asyncHandler(async (req, res) => ok(res, await service.list(req.query)));

exports.readById = asyncHandler(async (req, res) => {
  const opportunity = await service.findById(Number(req.params.id));

  if (!opportunity) return fail(res, 'Oportunidade não encontrada.', 404);

  return ok(res, opportunity);
});

exports.create = asyncHandler(async (req, res) =>
  respond(res, await service.create(req.body, req.user?.id), 201)
);

exports.update = asyncHandler(async (req, res) =>
  respond(res, await service.update(Number(req.params.id), req.body, req.user?.id))
);

exports.remove = asyncHandler(async (req, res) =>
  respond(res, await service.remove(Number(req.params.id)))
);

exports.statusHistory = asyncHandler(async (req, res) =>
  ok(res, await service.statusHistory(Number(req.params.id)))
);

exports.logs = asyncHandler(async (req, res) =>
  ok(res, await service.logs(Number(req.params.id)))
);

exports.comments = asyncHandler(async (req, res) =>
  ok(res, await service.comments(Number(req.params.id)))
);

exports.addComment = asyncHandler(async (req, res) =>
  respond(res, await service.addComment(Number(req.params.id), req.body, req.user?.id), 201)
);
