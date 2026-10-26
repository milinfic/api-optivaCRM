const db = require('../connection');

/**
 * Query builder de uma tabela, com transação opcional.
 *
 * @param {string} table
 * @param {any} [trx]
 * @returns {any}
 */
const q = (table, trx) => (trx ? db(table).transacting(trx) : db(table));

/**
 * Cria um repositório para tabelas filhas do cliente (1:1 ou N:N),
 * onde toda operação é escopada por `client_id`.
 *
 * @param {string} table
 * @param {{ unique?: boolean }} [options] `unique: true` para relações 1:1
 */
const createClientChildRepository = (table, options = {}) => {
  /**
   * @param {number} clientId
   * @param {any} [trx]
   * @returns {Promise<object|null>}
   */
  const findByClient = async (clientId, trx = null) =>
    (await q(table, trx).where('client_id', clientId).first()) ?? null;

  /**
   * Insere ou atualiza o registro do cliente.
   *
   * @param {number} clientId
   * @param {object} data
   * @param {any} [trx]
   * @returns {Promise<object|null>}
   */
  const upsert = async (clientId, data, trx = null) => {
    const payload = { ...data };

    delete payload.id;
    delete payload.client_id;

    const current = await findByClient(clientId, trx);

    if (!current) {
      const [row] = await q(table, trx)
        .insert({ ...payload, client_id: clientId })
        .returning('*');

      return row ?? null;
    }

    if (!Object.keys(payload).length) return current;

    const [row] = await q(table, trx)
      .update(payload)
      .where('client_id', clientId)
      .returning('*');

    return row ?? null;
  };

  /**
   * @param {number} clientId
   * @returns {Promise<boolean>}
   */
  const remove = async (clientId) => {
    const deleted = await q(table).where('client_id', clientId).del();

    return deleted >= 0;
  };

  /**
   * Lista todos os registros de um cliente (para tabelas N).
   *
   * @param {number} clientId
   * @returns {Promise<object[]>}
   */
  const listByClient = async (clientId) =>
    q(table).where('client_id', clientId).orderBy('id');

  return { findByClient, upsert, remove, listByClient, table, unique: Boolean(options.unique) };
};

/**
 * Tabelas 1:1 do cliente.
 */
const commercial = createClientChildRepository('client_commercial', { unique: true });
const financial = createClientChildRepository('client_financial', { unique: true });
const settings = createClientChildRepository('client_settings', { unique: true });
const marketing = createClientChildRepository('client_marketing', { unique: true });

/**
 * Tipos de cliente (N:N).
 */
const clientTypes = {
  /**
   * @param {number} clientId
   * @returns {Promise<number[]>}
   */
  listByClient: async (clientId) =>
    q('client_client_types').where('client_id', clientId).pluck('client_type_id'),

  /**
   * Substitui os tipos do cliente.
   *
   * @param {number} clientId
   * @param {number[]} typeIds
   * @param {any} [trx]
   */
  sync: async (clientId, typeIds = [], trx = null) => {
    await q('client_client_types', trx).where('client_id', clientId).del();

    const rows = [...new Set((typeIds || []).map(Number).filter(Boolean))]
      .map(typeId => ({ client_id: clientId, client_type_id: typeId }));

    if (rows.length) {
      await q('client_client_types', trx).insert(rows);
    }

    return rows.map(row => row.client_type_id);
  }
};

module.exports = { commercial, financial, settings, marketing, clientTypes, createClientChildRepository };
