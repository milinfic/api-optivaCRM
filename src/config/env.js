require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Lê uma variável obrigatória. Falha no boot em vez de falhar silenciosamente
 * em tempo de execução.
 *
 * @param {string} name
 * @param {string} [fallback] permitido apenas fora de produção
 * @returns {string}
 */
const required = (name, fallback) => {
  const value = process.env[name] || (!isProduction ? fallback : undefined);

  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);

  return value;
};

const accessSecret = required('ACCESS_TOKEN_SECRET', 'local-development-access-secret-change-before-deploy');
if (isProduction && Buffer.byteLength(accessSecret, 'utf8') < 32) {
  throw new Error('ACCESS_TOKEN_SECRET deve ter pelo menos 32 bytes.');
}

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    accessSecret,
    issuer: process.env.JWT_ISSUER || 'optiva-api',
    audience: process.env.JWT_AUDIENCE || 'optiva-web',
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  }
};
