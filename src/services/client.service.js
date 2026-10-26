const Clients = require('../../database/models/client.model');
const clientChild = require('../../database/models/client-child.model');
const { pick, transaction } = require('../utils/sanitize.utils');

/**
 * Campos do cliente aceitos na escrita.
 */
const CLIENT_FIELDS = {
  code: 'string',
  name: 'string',
  trade_name: 'string',
  cpf_cnpj: 'string',
  rg_ie: 'string',
  im: 'string',
  birth_foundation_date: 'date',
  active: 'boolean',
  client_segment_id: 'number',
  client_group_id: 'number'
};

const COMMERCIAL_FIELDS = {
  seller_id: 'number',
  supervisor_id: 'number',
  market_segment: 'string',
  sales_channel: 'string',
  credit_limit: 'number',
  max_discount: 'number',
  payment_term_id: 'number',
  price_table_id: 'number'
};

const FINANCIAL_FIELDS = {
  preferred_payment_method: 'string',
  bank_name: 'string',
  agency: 'string',
  account_number: 'string',
  pix_key: 'string',
  due_day: 'number',
  financial_blocked: 'boolean',
  block_reason: 'string'
};

const SETTINGS_FIELDS = {
  blocked: 'boolean',
  block_reason: 'string',
  allow_partial_invoice: 'boolean',
  allow_sale_without_stock: 'boolean',
  require_purchase_order: 'boolean',
  require_special_approval: 'boolean'
};

const MARKETING_FIELDS = {
  lead_source: 'string',
  campaign: 'string',
  email_marketing: 'boolean',
  whatsapp_marketing: 'boolean',
  sms_marketing: 'boolean',
  lgpd_consent: 'boolean',
  lgpd_consent_date: 'date'
};

/**
 * Lista clientes paginados.
 *
 * @param {object} params
 */
exports.list = async (params) => Clients.list(params);

/**
 * Busca cliente completo (dados + relacionamentos 1:1 + tipos).
 *
 * @param {number} id
 */
exports.findById = async (id) => Clients.findById(id);

/**
 * Cria o cliente com todos os blocos opcionais.
 *
 * @param {object} body
 * @returns {Promise<{ success: boolean, message?: string, data?: object }>}
 */
exports.create = async (body) => {
  const data = pick(body, CLIENT_FIELDS);

  if (!data.code) return { success: false, message: 'Código é obrigatório.' };
  if (!data.name) return { success: false, message: 'Nome é obrigatório.' };

  if (await Clients.codeExists(data.code)) {
    return { success: false, message: 'Já existe um cliente com este código.' };
  }

  const id = await transaction(async (trx) => {
    const client = await Clients.create(data, trx);

    await clientChild.commercial.upsert(client.id, pick(body.commercial, COMMERCIAL_FIELDS), trx);
    await clientChild.financial.upsert(client.id, pick(body.financial, FINANCIAL_FIELDS), trx);
    await clientChild.settings.upsert(client.id, pick(body.settings, SETTINGS_FIELDS), trx);
    await clientChild.marketing.upsert(client.id, pick(body.marketing, MARKETING_FIELDS), trx);
    await clientChild.clientTypes.sync(client.id, body.client_type_ids ?? [], trx);

    return client.id;
  });

  return { success: true, data: await Clients.findById(id) };
};

/**
 * Atualiza o cliente e os blocos enviados.
 *
 * @param {number} id
 * @param {object} body
 * @returns {Promise<{ success: boolean, message?: string, data?: object }>}
 */
exports.update = async (id, body) => {
  const current = await Clients.findById(id);

  if (!current) return { success: false, message: 'Cliente não encontrado.' };

  const data = pick(body, CLIENT_FIELDS);

  if (data.code && data.code !== current.code && (await Clients.codeExists(data.code, id))) {
    return { success: false, message: 'Já existe um cliente com este código.' };
  }

  await transaction(async (trx) => {
    await Clients.update(id, data, trx);

    if (body.commercial) {
      await clientChild.commercial.upsert(id, pick(body.commercial, COMMERCIAL_FIELDS), trx);
    }

    if (body.financial) {
      await clientChild.financial.upsert(id, pick(body.financial, FINANCIAL_FIELDS), trx);
    }

    if (body.settings) {
      await clientChild.settings.upsert(id, pick(body.settings, SETTINGS_FIELDS), trx);
    }

    if (body.marketing) {
      await clientChild.marketing.upsert(id, pick(body.marketing, MARKETING_FIELDS), trx);
    }

    if (Array.isArray(body.client_type_ids)) {
      await clientChild.clientTypes.sync(id, body.client_type_ids, trx);
    }
  });

  return { success: true, data: await Clients.findById(id) };
};

/**
 * Soft delete do cliente.
 *
 * @param {number} id
 */
exports.remove = async (id) => {
  const removed = await Clients.remove(id);

  return removed
    ? { success: true }
    : { success: false, message: 'Cliente não encontrado.' };
};

/**
 * Estatísticas do dashboard.
 */
exports.stats = async () => Clients.stats();

exports.CLIENT_FIELDS = CLIENT_FIELDS;
