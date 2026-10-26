const db = require('../connection');

const q = (trx) => (trx ? db('client_documents').transacting(trx) : db('client_documents'));

/**
 * Lista documentos de um cliente.
 *
 * @param {number} clientId
 * @returns {Promise<object[]>}
 */
exports.listByClient = async (clientId) =>
  q()
    .leftJoin('type_documents', 'type_documents.id', 'client_documents.type_documents_id')
    .leftJoin('users', 'users.id', 'client_documents.created_by')
    .where('client_documents.client_id', clientId)
    .select(
      'client_documents.*',
      'type_documents.document_type as type_name',
      'users.name as created_by_name'
    )
    .orderBy('client_documents.uploaded_at', 'desc');

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) => (await q().where('id', id).first()) ?? null;

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
exports.create = async (data) => {
  const [row] = await q().insert(data).returning('*');

  return row;
};

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
exports.remove = async (id) => {
  const deleted = await q().where('id', id).del();

  return deleted > 0;
};
