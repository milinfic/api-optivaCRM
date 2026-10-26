const { isProduction } = require('../config/env');

/**
 * @param {number} maxAge
 * @returns {import('express').CookieOptions}
 */
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/'
});

const cookieName = (name) => isProduction ? `__Host-${name}` : name;

/**
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken: string }} tokens
 * @param {{ accessTokenMaxAge: number, refreshTokenMaxAge: number }} maxAges
 */
const setAuthCookies = (res, tokens, maxAges) => {
  const refreshMaxAge = Math.max(0, new Date(tokens.refreshExpiresAt).getTime() - Date.now());
  res.cookie(cookieName('accessToken'), tokens.accessToken, cookieOptions(maxAges.accessTokenMaxAge));
  res.cookie(cookieName('refreshToken'), tokens.refreshToken, cookieOptions(refreshMaxAge));
};

/**
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  res.clearCookie(cookieName('accessToken'), clearCookieOptions());
  res.clearCookie(cookieName('refreshToken'), clearCookieOptions());
};

module.exports = { setAuthCookies, clearAuthCookies, cookieName };
