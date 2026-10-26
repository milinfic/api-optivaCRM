const authService = require('../services/auth.service');
const jwtConfig = require('../config/jwt');
const { setAuthCookies, clearAuthCookies, cookieName } = require('../utils/cookies.utils');
const { ok, fail } = require('../utils/response.utils');
const { asyncHandler } = require('../utils/async.utils');

const respondWithTokens = (res, result) => {
  if (!result.success) return fail(res, result.message || 'Não autorizado.', result.statusCode || 401);

  setAuthCookies(res, result, {
    accessTokenMaxAge: jwtConfig.accessTokenMaxAge
  });

  // Tokens ficam apenas nos cookies HttpOnly; JavaScript recebe somente os dados públicos.
  return ok(res, { user: result.user ?? null });
};

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  return respondWithTokens(res, result);
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[cookieName('refreshToken')];
  const result = await authService.refresh(token);
  if (!result.success) clearAuthCookies(res);
  return respondWithTokens(res, result);
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(
    req.cookies?.[cookieName('refreshToken')],
    req.cookies?.[cookieName('accessToken')]
  );
  clearAuthCookies(res);
  return ok(res, { message: 'Sessão encerrada.' });
});

exports.profile = asyncHandler(async (req, res) => ok(res, {
  id: req.user.id,
  email: req.user.email,
  dataBase: req.user.clientId
}));

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  if (!result.success) return fail(res, result.message, result.statusCode || 400);
  return ok(res, result.user, 201);
});
