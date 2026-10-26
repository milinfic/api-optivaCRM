/**
 * Resposta de sucesso padronizada.
 *
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} [status]
 */
const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

/**
 * Resposta de erro padronizada.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [status]
 * @param {any} [errors]
 */
const fail = (res, message, status = 400, errors = undefined) => {
  const body = { success: false, message };

  if (errors) body.errors = errors;

  return res.status(status).json(body);
};

module.exports = { ok, fail };
