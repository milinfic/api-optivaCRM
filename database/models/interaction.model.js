const db = require('../connection');
const { pagination } = require('../../src/utils/pagination.utils');

const q = (trx) => (trx ? db('client_interactions').transacting(trx) : db('client_interactions'));

/**
 * Lista interações (opcionalmente por cliente ou oportunidade).
 *
 * @param {object} params
 * @returns {Promise<{ data: object[], total: number, page: number, limit: number }>}
 */
exports.list = async (params = {}) => {
  const { page, limit, offset } = pagination(params, { limit: params.limit || 20 });

  const base = () => {
    const query = q()
      .leftJoin('clients', 'clients.id', 'client_interactions.client_id')
      .leftJoin(
        'client_interactions_types',
        'client_interactions_types.id',
        'client_interactions.interaction_type_id'
      )
      .leftJoin('users', 'users.id', 'client_interactions.user_id');

    if (params.client_id) query.where('client_interactions.client_id', Number(params.client_id));
    if (params.opportunity_id) query.where('client_interactions.opportunity_id', Number(params.opportunity_id));

    return query;
  };

  const [{ count }] = await base().count({ count: 'client_interactions.id' });

  const data = await base()
    .select(
      'client_interactions.*',
      'clients.name as client_name',
      'client_interactions_types.description as type_description',
      'client_interactions_types.color as type_color',
      'client_interactions_types.icon as type_icon',
      'users.name as user_name'
    )
    .orderBy('client_interactions.interaction_date', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total: Number(count), page, limit };
};

/**
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.create = async (data, trx = null) => {
  const [row] = await q(trx).insert(data).returning('*');

  return row;
};

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) => (await q().where('id', id).first()) ?? null;

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
exports.remove = async (id) => {
  const deleted = await q().where('id', id).del();

  return deleted > 0;
};

/**
 * Próximos contatos agendados (dashboard).
 *
 * @param {number} [limit]
 * @returns {Promise<object[]>}
 */
exports.upcoming = async (limit = 10) =>
  q()
    .leftJoin('clients', 'clients.id', 'client_interactions.client_id')
    .whereNotNull('client_interactions.next_contact_date')
    .where('client_interactions.next_contact_date', '>=', db.raw('now()'))
    .select(
      'client_interactions.id',
      'client_interactions.subject',
      'client_interactions.next_contact_date',
      'clients.name as client_name'
    )
    .orderBy('client_interactions.next_contact_date')
    .limit(limit);
