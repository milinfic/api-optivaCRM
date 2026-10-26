const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('./env');

/**
 * Converte '15m' / '1d' em milissegundos (para o maxAge do cookie).
 *
 * @param {string} value
 * @returns {number}
 */
const toMs = (value) => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(String(value).trim());

  if (!match) return 0;

  const factors = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };

  return Number(match[1]) * factors[match[2].toLowerCase()];
};

exports.accessTokenMaxAge = toMs(jwtConfig.accessExpiresIn);
exports.refreshTokenMaxAge = toMs(jwtConfig.refreshExpiresIn);

exports.generateAccessToken = (payload) => jwt.sign(payload, jwtConfig.accessSecret, {
  algorithm: 'HS256',
  issuer: jwtConfig.issuer,
  audience: jwtConfig.audience,
  expiresIn: jwtConfig.accessExpiresIn
});

exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.accessSecret, {
      algorithms: ['HS256'],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  } catch {
    return null;
  }
};

