const db = require('../../database/connection');

/**
 * Tipos de campo aceitos na escrita.
 */
const FIELD_TYPES = {
  string: (value) => (value === '' || value === null || value === undefined ? null : String(value).trim()),
  number: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  },
  boolean: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    return value === true || value === 'true' || value === 1 || value === '1';
  },
  date: (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return null;
  }
};

/**
 * Sanitiza os dados recebidos aplicando apenas os campos permitidos.
 *
 * @param {object} data
 * @param {Record<string, 'string'|'number'|'boolean'|'date'>} fields
 * @returns {object}
 */
const pick = (data = {}, fields = {}) => {
  const result = {};

  for (const [field, type] of Object.entries(fields)) {
    if (!(field in data)) continue;

    result[field] = FIELD_TYPES[type](data[field]);
  }

  return result;
};

/**
 * Executa as operações numa transação.
 *
 * @param {(trx: any) => Promise<any>} fn
 * @returns {Promise<any>}
 */
const transaction = (fn) => db.transaction(fn);

module.exports = { pick, transaction, FIELD_TYPES };
