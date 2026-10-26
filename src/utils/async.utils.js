/**
 * Wrapper para handlers async: encaminha qualquer rejeição para o
 * error handler central, evitando try/catch repetido em todo controller.
 *
 * @param {(req: any, res: any, next: any) => Promise<any>} handler
 * @returns {(req: any, res: any, next: any) => void}
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
