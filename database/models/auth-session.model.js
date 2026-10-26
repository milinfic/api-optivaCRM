const db = require('../connection');

exports.create = async ({ id, userId, tokenHash, expiresAt }) => db.transaction(async (trx) => {
  await trx('auth_sessions')
    .where('expires_at', '<=', trx.fn.now())
    .orWhereNotNull('revoked_at')
    .del();
  await trx('auth_sessions').insert({ id, user_id: userId, expires_at: expiresAt });
  await trx('auth_session_tokens').insert({ session_id: id, token_hash: tokenHash });
});

exports.rotate = async ({ tokenHash, nextTokenHash }) => db.transaction(async (trx) => {
  const [token] = await trx('auth_session_tokens').where({ token_hash: tokenHash }).forUpdate();
  if (!token) return { status: 'invalid' };

  const [session] = await trx('auth_sessions').where({ id: token.session_id }).forUpdate();
  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
    return { status: 'inactive' };
  }

  if (token.used_at) {
    await trx('auth_sessions').where({ id: session.id }).update({ revoked_at: trx.fn.now() });
    return { status: 'replay' };
  }

  await trx('auth_session_tokens').where({ token_hash: tokenHash }).update({ used_at: trx.fn.now() });
  await trx('auth_session_tokens').insert({ session_id: session.id, token_hash: nextTokenHash });
  await trx('auth_sessions').where({ id: session.id }).update({ last_used_at: trx.fn.now() });
  return { status: 'ok', sessionId: session.id, userId: session.user_id, expiresAt: session.expires_at };
});

exports.isActive = async (id) => {
  const session = await db('auth_sessions').where({ id }).whereNull('revoked_at').first();
  return Boolean(session && new Date(session.expires_at) > new Date());
};

exports.revokeByTokenHash = async (tokenHash) => db.transaction(async (trx) => {
  const token = await trx('auth_session_tokens').where({ token_hash: tokenHash }).first();
  if (!token) return false;
  await trx('auth_sessions').where({ id: token.session_id }).whereNull('revoked_at')
    .update({ revoked_at: trx.fn.now() });
  return true;
});

exports.revokeById = async (id) => {
  const updated = await db('auth_sessions').where({ id }).whereNull('revoked_at')
    .update({ revoked_at: db.fn.now() });
  return updated > 0;
};
