const db = require('../connection');
const { pagination } = require('../../src/utils/pagination.utils');

/**
 * Query builder de `opportunities`.
 *
 * @param {any} [trx]
 * @returns {any}
 */
const q = (trx) => (trx ? db('opportunities').transacting(trx) : db('opportunities'));

/**
 * Lista oportunidades com cliente, status, tipo e responsável.
 *
 * @param {object} params
 * @returns {Promise<{ data: object[], total: number, page: number, limit: number }>}
 */
exports.list = async (params = {}) => {
  const { page, limit, offset } = pagination(params, { limit: params.limit || 20 });

  const base = () => {
    const query = db('opportunities')
      .leftJoin('clients', 'clients.id', 'opportunities.client_id')
      .leftJoin('opportunities_status', 'opportunities_status.id', 'opportunities.opportunity_status_id')
      .leftJoin('opportunities_type', 'opportunities_type.id', 'opportunities.opportunity_type_id')
      .leftJoin('users', 'users.id', 'opportunities.user_id')
      .whereNull('opportunities.deleted_at');

    if (params.search) {
      query.where('opportunities.title', 'ilike', `%${String(params.search).trim()}%`);
    }

    if (params.client_id) {
      query.where('opportunities.client_id', Number(params.client_id));
    }

    if (params.opportunity_status_id) {
      query.where('opportunities.opportunity_status_id', Number(params.opportunity_status_id));
    }

    if (params.opportunity_type_id) {
      query.where('opportunities.opportunity_type_id', Number(params.opportunity_type_id));
    }

    return query;
  };

  const [{ count }] = await base().count({ count: 'opportunities.id' });

  const data = await base()
    .select(
      'opportunities.*',
      'clients.name as client_name',
      'opportunities_status.status as status_name',
      'opportunities_type.type as type_name',
      'users.name as user_name'
    )
    .orderBy('opportunities.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total: Number(count), page, limit };
};

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) =>
  (await q()
    .leftJoin('clients', 'clients.id', 'opportunities.client_id')
    .leftJoin('opportunities_status', 'opportunities_status.id', 'opportunities.opportunity_status_id')
    .leftJoin('opportunities_type', 'opportunities_type.id', 'opportunities.opportunity_type_id')
    .where('opportunities.id', id)
    .select(
      'opportunities.*',
      'clients.name as client_name',
      'opportunities_status.status as status_name',
      'opportunities_type.type as type_name'
    )
    .first()) ?? null;

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
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object|null>}
 */
exports.update = async (id, data, trx = null) => {
  const [row] = await q(trx)
    .update({ ...data, updated_at: new Date() })
    .where('id', id)
    .returning('*');

  return row ?? null;
};

/**
 * Soft delete.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
exports.remove = async (id) => {
  const updated = await q()
    .update({ deleted_at: new Date() })
    .where('id', id)
    .whereNull('deleted_at');

  return updated > 0;
};

/**
 * Histórico de status.
 *
 * @param {number} opportunityId
 * @returns {Promise<object[]>}
 */
exports.statusHistory = async (opportunityId) =>
  db('opportunity_status_history')
    .leftJoin(
      'opportunities_status as from_status',
      'from_status.id',
      'opportunity_status_history.from_opportunity_status_id'
    )
    .leftJoin(
      'opportunities_status as to_status',
      'to_status.id',
      'opportunity_status_history.opportunity_status_id'
    )
    .where('opportunity_status_history.opportunities_id', opportunityId)
    .select(
      'opportunity_status_history.*',
      'from_status.status as from_status_name',
      'to_status.status as to_status_name'
    )
    .orderBy('opportunity_status_history.created_at', 'desc');

/**
 * Logs de alteração.
 *
 * @param {number} opportunityId
 * @returns {Promise<object[]>}
 */
exports.logs = async (opportunityId) =>
  db('opportunity_logs')
    .leftJoin('users', 'users.id', 'opportunity_logs.user_id')
    .leftJoin('event_types', 'event_types.id', 'opportunity_logs.event_type_id')
    .where('opportunity_logs.opportunity_id', opportunityId)
    .select(
      'opportunity_logs.*',
      'users.name as user_name',
      'event_types.code as event_code',
      'event_types.description as event_description'
    )
    .orderBy('opportunity_logs.created_at', 'desc');

/**
 * Comentários.
 *
 * @param {number} opportunityId
 * @returns {Promise<object[]>}
 */
exports.comments = async (opportunityId) =>
  db('opportunity_comments')
    .leftJoin('users', 'users.id', 'opportunity_comments.user_id')
    .where('opportunity_comments.opportunity_id', opportunityId)
    .select('opportunity_comments.*', 'users.name as user_name')
    .orderBy('opportunity_comments.created_at', 'desc');

/**
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.createComment = async (data, trx = null) => {
  const [row] = await (trx ? db('opportunity_comments').transacting(trx) : db('opportunity_comments'))
    .insert(data)
    .returning('*');

  return row;
};

/**
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.createStatusHistory = async (data, trx = null) => {
  const [row] = await (trx
    ? db('opportunity_status_history').transacting(trx)
    : db('opportunity_status_history'))
    .insert(data)
    .returning('*');

  return row;
};

/**
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.createLog = async (data, trx = null) => {
  const [row] = await (trx ? db('opportunity_logs').transacting(trx) : db('opportunity_logs'))
    .insert(data)
    .returning('*');

  return row;
};

/**
 * Total do pipeline por status (dashboard).
 *
 * @returns {Promise<object[]>}
 */
exports.pipelineByStatus = async () =>
  db('opportunities')
    .leftJoin('opportunities_status', 'opportunities_status.id', 'opportunities.opportunity_status_id')
    .whereNull('opportunities.deleted_at')
    .groupBy('opportunities_status.status')
    .select(
      'opportunities_status.status as status',
      db.raw('count(*)::int as total'),
      db.raw('coalesce(sum(opportunities.estimated_value), 0)::numeric as value')
    )
    .orderBy('value', 'desc');
