const db = require('../../database/connection');
const userModel = require('../../database/models/user.model');
const { pick } = require('../utils/sanitize.utils');

const USER_FIELDS = { name: 'string', email: 'string', data_base: 'string' };

/**
 * Lista usuários ativos.
 *
 * @param {object} params
 * @returns {Promise<object[]>}
 */
exports.list = async (params = {}) => {
  const query = db('users')
    .select('id', 'name', 'email', 'data_base', 'created_at')
    .whereNull('deleted_at');

  if (params.search) {
    query.where('name', 'ilike', `%${String(params.search).trim()}%`);
  }

  return query.orderBy('name');
};

/**
 * Busca usuário por id.
 *
 * @param {number} id
 */
exports.findById = async (id) => {
  const user = await db('users')
    .select('id', 'name', 'email', 'data_base', 'created_at')
    .where('id', id)
    .whereNull('deleted_at')
    .first();

  return user ?? null;
};

/**
 * Atualiza nome/e-mail do usuário.
 *
 * @param {number} id
 * @param {object} body
 */
exports.update = async (id, body) => {
  const current = await userModel.findById(id);

  if (!current) return { success: false, message: 'Usuário não encontrado.' };

  const data = pick(body, USER_FIELDS);

  if (data.email && data.email !== current.email) {
    const existing = await userModel.findByEmail(data.email);

    if (existing) return { success: false, message: 'E-mail já cadastrado.' };
  }

  await db('users').update(data).where('id', id);

  return { success: true, data: await exports.findById(id) };
};

/**
 * Desativa o usuário (soft delete).
 *
 * @param {number} id
 */
exports.remove = async (id) => {
  const updated = await db('users')
    .update({ deleted_at: new Date() })
    .where('id', id)
    .whereNull('deleted_at');

  return updated > 0
    ? { success: true }
    : { success: false, message: 'Usuário não encontrado.' };
};
