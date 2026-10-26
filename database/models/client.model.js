const db = require('../connection');
const { pagination } = require('../../src/utils/pagination.utils');

/**
 * Query builder de `clients`.
 *
 * @param {any} [trx]
 * @returns {any}
 */
const q = (trx) => (trx ? db('clients').transacting(trx) : db('clients'));

/**
 * Colunas de busca textual.
 */
const SEARCH_COLUMNS = ['clients.name', 'clients.trade_name', 'clients.code', 'clients.cpf_cnpj'];

/**
 * Filtros comuns das listagens.
 *
 * @param {any} query
 * @param {object} params
 */
const applyFilters = (query, params = {}) => {
  if (params.search) {
    const term = `%${String(params.search).trim()}%`;

    query.where(function () {
      for (const column of SEARCH_COLUMNS) {
        this.orWhere(column, 'ilike', term);
      }
    });
  }

  if (params.active !== undefined && params.active !== null && params.active !== '') {
    query.where('clients.active', params.active === true || params.active === 'true');
  }

  if (params.client_segment_id) {
    query.where('clients.client_segment_id', Number(params.client_segment_id));
  }

  if (params.client_group_id) {
    query.where('clients.client_group_id', Number(params.client_group_id));
  }

  return query;
};

/**
 * Lista clientes com paginação, segmento, grupo e quantidade de oportunidades.
 *
 * @param {object} params
 * @returns {Promise<{ data: object[], total: number, page: number, limit: number }>}
 */
exports.list = async (params = {}) => {
  const { page, limit, offset } = pagination(params, { limit: params.limit || 20 });

  const base = () => applyFilters(db('clients').whereNull('clients.deleted_at'), params);

  const [{ count }] = await base().count({ count: 'clients.id' });

  const data = await base()
    .leftJoin('client_segments', 'client_segments.id', 'clients.client_segment_id')
    .leftJoin('client_groups', 'client_groups.id', 'clients.client_group_id')
    .select(
      'clients.*',
      'client_segments.name as segment_name',
      'client_groups.name as group_name'
    )
    .orderBy('clients.name')
    .limit(limit)
    .offset(offset);

  return { data, total: Number(count), page, limit };
};

/**
 * Busca cliente por id com os relacionamentos 1:1.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) => {
  const client = await q()
    .where('clients.id', id)
    .whereNull('clients.deleted_at')
    .first();

  if (!client) return null;

  const [commercial, financial, settings, marketing, types] = await Promise.all([
    db('client_commercial').where('client_id', id).first(),
    db('client_financial').where('client_id', id).first(),
    db('client_settings').where('client_id', id).first(),
    db('client_marketing').where('client_id', id).first(),
    db('client_client_types').where('client_id', id).pluck('client_type_id')
  ]);

  return {
    ...client,
    commercial: commercial ?? null,
    financial: financial ?? null,
    settings: settings ?? null,
    marketing: marketing ?? null,
    client_type_ids: types
  };
};

/**
 * Verifica se o código já existe (opcionalmente ignorando um id).
 *
 * @param {string} code
 * @param {number} [ignoreId]
 * @returns {Promise<boolean>}
 */
exports.codeExists = async (code, ignoreId = null) => {
  const query = q().where('code', code);

  if (ignoreId) query.whereNot('id', ignoreId);

  const row = await query.first();

  return Boolean(row);
};

/**
 * Cria o cliente.
 *
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.create = async (data, trx = null) => {
  const [row] = await q(trx).insert(data).returning('*');

  return row;
};

/**
 * Atualiza o cliente.
 *
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
    .update({ deleted_at: new Date(), active: false })
    .where('id', id)
    .whereNull('deleted_at');

  return updated > 0;
};

/**
 * Contadores para o dashboard.
 *
 * @returns {Promise<object>}
 */
exports.stats = async () => {
  const [clients] = await db('clients')
    .whereNull('deleted_at')
    .count({ total: '*' })
    .count({ active: db.raw('case when active then 1 end') });

  const [opportunities] = await db('opportunities')
    .whereNull('deleted_at')
    .count({ total: '*' })
    .sum({ value: 'estimated_value' });

  return {
    clients: Number(clients?.total ?? 0),
    activeClients: Number(clients?.active ?? 0),
    opportunities: Number(opportunities?.total ?? 0),
    pipelineValue: Number(opportunities?.value ?? 0)
  };
};
