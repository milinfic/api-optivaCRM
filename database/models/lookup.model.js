/**
 * Tabelas "lookup" simples: id + name (+ is_active).
 *
 * Todas compartilham o mesmo formato, então o repository é gerado a partir
 * do nome da tabela.
 */

const db = require('../connection');

/**
 * @param {string} table
 * @param {any} [trx]
 * @returns {any}
 */
const q = (table, trx) => (trx ? db(table).transacting(trx) : db(table));

/**
 * Cria o repository de uma tabela de apoio.
 *
 * @param {{ table: string, orderBy?: string, activeColumn?: string }} config
 */
const createLookupRepository = ({ table, orderBy = 'name', activeColumn = null }) => {
  /**
   * @param {{ onlyActive?: boolean }} [params]
   * @returns {Promise<object[]>}
   */
  const list = async (params = {}) => {
    const query = q(table).select('*');

    if (activeColumn && params.onlyActive) {
      query.where(activeColumn, true);
    }

    return query.orderBy(orderBy);
  };

  /**
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  const findById = async (id) => (await q(table).where('id', id).first()) ?? null;

  /**
   * @param {object} data
   * @returns {Promise<object>}
   */
  const create = async (data) => {
    const [row] = await q(table).insert(data).returning('*');

    return row;
  };

  /**
   * @param {number} id
   * @param {object} data
   * @returns {Promise<object|null>}
   */
  const update = async (id, data) => {
    const payload = { ...data };

    if (activeColumn) payload.updated_at = new Date();

    const [row] = await q(table)
      .update(payload)
      .where('id', id)
      .returning('*');

    return row ?? null;
  };

  /**
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  const remove = async (id) => {
    const deleted = await q(table).where('id', id).del();

    return deleted > 0;
  };

  return { list, findById, create, update, remove, table };
};

module.exports = { createLookupRepository };
