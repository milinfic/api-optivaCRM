const { corsOrigin } = require('../config/env');

const allowedOrigins = new Set(String(corsOrigin).split(',').map((origin) => origin.trim()).filter(Boolean));

exports.verifyOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({ success: false, message: 'Origem não autorizada.' });
  }
  return next();
};
