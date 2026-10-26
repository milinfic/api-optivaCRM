const Interactions = require('../../database/models/interaction.model');
const { pick } = require('../utils/sanitize.utils');

const INTERACTION_FIELDS = {
  client_id: 'number',
  interaction_type_id: 'number',
  opportunity_id: 'number',
  user_id: 'number',
  subject: 'string',
  description: 'string',
  next_contact_date: 'string'
};

/**
 * Normaliza uma data/hora para ISO (ou null).
 *
 * @param {any} value
 * @returns {string|null}
 */
const toTimestamp = (value) => {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

exports.list = async (params) => Interactions.list(params);

exports.create = async (body, userId = null) => {
  const data = pick(body, INTERACTION_FIELDS);

  if (!data.client_id) return { success: false, message: 'Cliente é obrigatório.' };
  if (!data.subject) return { success: false, message: 'Assunto é obrigatório.' };

  return {
    success: true,
    data: await Interactions.create({
      ...data,
      user_id: data.user_id ?? userId ?? null,
      created_by: userId ?? null,
      interaction_date: toTimestamp(body.interaction_date) ?? new Date(),
      next_contact_date: toTimestamp(data.next_contact_date)
    })
  };
};

exports.remove = async (id) => {
  const removed = await Interactions.remove(id);

  return removed ? { success: true } : { success: false, message: 'Interação não encontrada.' };
};

exports.upcoming = async (limit) => Interactions.upcoming(limit);
