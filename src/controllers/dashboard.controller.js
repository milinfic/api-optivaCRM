const service = require('../services/dashboard.service');
const { ok } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

/**
 * GET /dashboard/summary
 */
exports.summary = asyncHandler(async (req, res) => ok(res, await service.summary()));
