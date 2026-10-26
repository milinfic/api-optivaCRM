const lookups = require('../../database/models/lookups');
const { pick } = require('../utils/sanitize.utils');

/**
 * Metadados de cada tabela de apoio: campos aceitos e coluna de exibição.
 */
const CONFIG = {
  'client-segments': { model: lookups.ClientSegments, fields: { name: 'string', is_active: 'boolean' } },
  'client-groups': { model: lookups.ClientGroups, fields: { name: 'string', is_active: 'boolean' } },
  'client-types': { model: lookups.ClientTypes, fields: { name: 'string' } },
  'address-types': { model: lookups.AddressTypes, fields: { type: 'string' }, required: 'type' },
  'contact-types': {
    model: lookups.ContactTypes,
    fields: { code: 'string', description: 'string' },
    required: 'description'
  },
  'type-documents': {
    model: lookups.TypeDocuments,
    fields: { document_type: 'string' },
    required: 'document_type'
  },
  'opportunity-types': { model: lookups.OpportunityTypes, fields: { type: 'string' }, required: 'type' },
  'opportunity-statuses': { model: lookups.OpportunityStatuses, fields: { status: 'string' }, required: 'status' },
  'interaction-types': {
    model: lookups.InteractionTypes,
    fields: { description: 'string', color: 'string', icon: 'string' },
    required: 'description'
  },
  'event-types': {
    model: lookups.EventTypes,
    fields: { module: 'string', code: 'string', description: 'string' },
    required: 'code'
  }
};

/**
 * Resolve a configuração de uma tabela.
 *
 * @param {string} resource
 * @returns {object|null}
 */
const resolve = (resource) => CONFIG[resource] ?? null;

exports.config = CONFIG;
exports.resolve = resolve;

exports.list = async (resource, params = {}) => {
  const config = resolve(resource);

  if (!config) return { success: false, message: 'Recurso inválido.' };

  return { success: true, data: await config.model.list(params) };
};

exports.create = async (resource, body) => {
  const config = resolve(resource);

  if (!config) return { success: false, message: 'Recurso inválido.' };

  const data = pick(body, config.fields);

  if (config.required && !data[config.required]) {
    return { success: false, message: 'Campo obrigatório não informado.' };
  }

  return { success: true, data: await config.model.create(data) };
};

exports.update = async (resource, id, body) => {
  const config = resolve(resource);

  if (!config) return { success: false, message: 'Recurso inválido.' };

  const data = pick(body, config.fields);

  const updated = await config.model.update(id, data);

  return updated
    ? { success: true, data: updated }
    : { success: false, message: 'Registro não encontrado.' };
};

exports.remove = async (resource, id) => {
  const config = resolve(resource);

  if (!config) return { success: false, message: 'Recurso inválido.' };

  const removed = await config.model.remove(id);

  return removed
    ? { success: true }
    : { success: false, message: 'Registro não encontrado.' };
};
