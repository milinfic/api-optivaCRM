const authService = require('../services/auth.service');
const { clearAuthCookies, cookieName } = require('../utils/cookies.utils');

const buildUser = (payload) => ({
  id: payload.sub,
  email: payload.email,
  clientId: payload.data_base
});

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.[cookieName('accessToken')];
    const refreshToken = req.cookies?.[cookieName('refreshToken')];
    const payload = token && authService.verifyAccessToken(token);

    if (!payload?.sub || !payload?.sid || !(await authService.isSessionActive(payload.sid))) {
      if (!refreshToken) clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Não autenticado.' });
    }

    req.user = buildUser(payload);
    return next();
  } catch (error) {
    return next(error);
  }
};
