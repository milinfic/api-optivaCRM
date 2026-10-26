const crypto = require('crypto');
const userModel = require('../../database/models/user.model');
const authSessionModel = require('../../database/models/auth-session.model');
const jwtConfig = require('../config/jwt');
const { jwt: envJwt } = require('../config/env');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const durationMs = (value) => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(String(value).trim());
  if (!match) throw new Error('Duração de token inválida.');
  return Number(match[1]) * ({ ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 })[match[2].toLowerCase()];
};
const newRefreshToken = () => crypto.randomBytes(64).toString('base64url');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueAccessToken = (user, sessionId) => jwtConfig.generateAccessToken({
  sub: user.id,
  email: user.email,
  data_base: user.data_base,
  sid: sessionId
});

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

exports.verifyAccessToken = (token) => jwtConfig.verifyAccessToken(token);
exports.isSessionActive = (sessionId) => authSessionModel.isActive(sessionId);

exports.login = async (email, password) => {
  try {
    const user = await userModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { success: false, message: 'Credenciais inválidas.' };
    }

    const now = Date.now();
    const expiresAt = new Date(now + durationMs(envJwt.refreshExpiresIn));
    const refreshToken = newRefreshToken();
    const sessionId = crypto.randomUUID();
    await authSessionModel.create({ id: sessionId, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt });

    return {
      success: true,
      accessToken: issueAccessToken(user, sessionId),
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: publicUser(user)
    };
  } catch (error) {
    console.error('auth.service login error:', error.message);
    return { success: false, message: 'Erro interno.', statusCode: 500 };
  }
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.length > 200) {
    return { success: false, message: 'Sessão inválida.' };
  }

  try {
    const nextRefreshToken = newRefreshToken();
    const rotated = await authSessionModel.rotate({
      tokenHash: hashToken(refreshToken),
      nextTokenHash: hashToken(nextRefreshToken)
    });

    if (rotated.status !== 'ok') return { success: false, message: 'Sessão inválida ou expirada.' };

    const user = await userModel.findById(rotated.userId);
    if (!user) {
      await authSessionModel.revokeByTokenHash(hashToken(nextRefreshToken));
      return { success: false, message: 'Sessão inválida ou expirada.' };
    }

    return {
      success: true,
      accessToken: issueAccessToken(user, rotated.sessionId),
      refreshToken: nextRefreshToken,
      refreshExpiresAt: rotated.expiresAt
    };
  } catch (error) {
    console.error('auth.service refresh error:', error.message);
    return { success: false, message: 'Erro interno.', statusCode: 500 };
  }
};

exports.logout = async (refreshToken, accessToken) => {
  if (refreshToken && typeof refreshToken === 'string') {
    const revokedByRefresh = await authSessionModel.revokeByTokenHash(hashToken(refreshToken));
    if (revokedByRefresh) return true;
  }
  const payload = accessToken && this.verifyAccessToken(accessToken);
  return payload?.sid ? authSessionModel.revokeById(payload.sid) : false;
};

exports.register = async (data) => {
  try {
    const existing = await userModel.findByEmail(data.email);
    if (existing) return { success: false, message: 'E-mail já cadastrado.' };
    const password = await bcrypt.hash(data.password, saltRounds);
    const user = await userModel.create({ name: data.name, email: data.email, password });
    return { success: true, user: publicUser(user) };
  } catch (error) {
    console.error('auth.service register error:', error.message);
    return { success: false, message: 'Erro ao criar usuário.', statusCode: 500 };
  }
};
