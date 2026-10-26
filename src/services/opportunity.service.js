const Opportunities = require('../../database/models/opportunity.model');
const { pick } = require('../utils/sanitize.utils');

const OPPORTUNITY_FIELDS = {
  client_id: 'number',
  user_id: 'number',
  opportunity_type_id: 'number',
  opportunity_status_id: 'number',
  title: 'string',
  description: 'string',
  estimated_value: 'number',
  probability: 'number',
  expected_close_date: 'date'
};

const COMMENT_FIELDS = {
  detail: 'string'
};

exports.list = async (params) => Opportunities.list(params);

exports.findById = async (id) => Opportunities.findById(id);

/**
 * Cria uma oportunidade.
 *
 * @param {object} body
 * @param {number} [userId]
 */
exports.create = async (body, userId = null) => {
  const data = pick(body, OPPORTUNITY_FIELDS);

  if (!data.client_id) return { success: false, message: 'Cliente é obrigatório.' };
  if (!data.title) return { success: false, message: 'Título é obrigatório.' };

  if (data.probability != null) {
    data.probability = Math.min(100, Math.max(0, data.probability));
  }

  if (!data.user_id && userId) data.user_id = userId;

  return { success: true, data: await Opportunities.create(data) };
};

/**
 * Atualiza a oportunidade e registra mudança de status.
 *
 * @param {number} id
 * @param {object} body
 * @param {number} [userId]
 */
exports.update = async (id, body, userId = null) => {
  const current = await Opportunities.findById(id);

  if (!current) return { success: false, message: 'Oportunidade não encontrada.' };

  const data = pick(body, OPPORTUNITY_FIELDS);

  if (data.probability != null) {
    data.probability = Math.min(100, Math.max(0, data.probability));
  }

  const updated = await Opportunities.update(id, data);

  const statusChanged =
    data.opportunity_status_id != null &&
    Number(data.opportunity_status_id) !== Number(current.opportunity_status_id);

  if (statusChanged) {
    await Opportunities.createStatusHistory({
      opportunities_id: id,
      from_opportunity_status_id: current.opportunity_status_id ?? null,
      opportunity_status_id: Number(data.opportunity_status_id),
      reason: body.status_reason ?? null
    });

    await Opportunities.createLog({
      opportunity_id: id,
      user_id: userId ?? null,
      event_type_id: null,
      field_name: 'opportunity_status_id',
      old_value: String(current.opportunity_status_id ?? ''),
      new_value: String(data.opportunity_status_id)
    });
  }

  return { success: true, data: updated };
};

/**
 * Soft delete.
 *
 * @param {number} id
 */
exports.remove = async (id) => {
  const removed = await Opportunities.remove(id);

  return removed
    ? { success: true }
    : { success: false, message: 'Oportunidade não encontrada.' };
};

exports.statusHistory = async (id) => Opportunities.statusHistory(id);
exports.logs = async (id) => Opportunities.logs(id);
exports.comments = async (id) => Opportunities.comments(id);

/**
 * Adiciona comentário.
 *
 * @param {number} id
 * @param {object} body
 * @param {number} [userId]
 */
exports.addComment = async (id, body, userId = null) => {
  const data = pick(body, COMMENT_FIELDS);

  if (!data.detail) return { success: false, message: 'Comentário é obrigatório.' };

  return {
    success: true,
    data: await Opportunities.createComment({
      opportunity_id: id,
      user_id: userId ?? null,
      detail: data.detail
    })
  };
};

exports.pipelineByStatus = async () => Opportunities.pipelineByStatus();
