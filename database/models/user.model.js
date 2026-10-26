const db = require('../connection');

/**
 * Query builder do model, com transação opcional.
 *
 * @param {any} [trx]
 * @returns {any}
 */
const q = (trx) => (trx ? db('users').transacting(trx) : db('users'));

/**
 * Cria o model de um usuário.
 *
 * @param {{ name: string, email: string, password: string, data_base?: string }} data
 * @returns {object}
 */
exports.create = async (data, trx = null) => {
  const [row] = await q(trx)
    .insert({
      name: data.name,
      email: data.email,
      password: data.password,
      data_base: data.data_base ?? null
    })
    .returning('*');

  return row ?? null;
};

/**
 * Busca usuário por e-mail.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
exports.findByEmail = async (email) =>
  (await q().where('email', email).whereNull('deleted_at').first()) ?? null;

/**
 * Busca usuário por id.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) =>
  (await q().where('id', id).whereNull('deleted_at').first()) ?? null;

/**
 * Busca usuário pelo refresh token (validação da sessão).
 *
 * @param {string} email
 * @param {string} refreshToken
 * @returns {Promise<object|null>}
 */
exports.findByRefreshToken = async (email, refreshToken) =>
  (await q().where({ email, refresh_token: refreshToken }).whereNull('deleted_at').first()) ?? null;

/**
 * Atualiza o refresh token.
 *
 * @param {number} id
 * @param {string|null} refreshToken
 * @returns {Promise<boolean>}
 */
exports.updateRefreshToken = async (id, refreshToken) => {
  const updated = await q()
    .update({ refresh_token: refreshToken, updated_at: new Date() })
    .where('id', id);

  return updated > 0;
};

/**
 * Lista usuários ativos (para selects de vendedor/supervisor).
 *
 * @returns {Promise<object[]>}
 */
exports.list = async () =>
  q().select('id', 'name', 'email').whereNull('deleted_at').orderBy('name');
