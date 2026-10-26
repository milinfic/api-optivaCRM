/**
 * Paginação padrão das listagens.
 *
 * @param {any} query
 * @param {{ page?: number, limit?: number, maxLimit?: number }} [options]
 * @returns {{ page: number, limit: number, offset: number }}
 */
const pagination = (query = {}, options = {}) => {
  const maxLimit = options.maxLimit ?? 200;
  const defaultLimit = options.limit ?? 20;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));

  return { page, limit, offset: (page - 1) * limit };
};

module.exports = { pagination };
