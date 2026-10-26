require('dotenv').config();

const app = require('./src/app');
const { port } = require('./src/config/env');

const server = app.listen(port, () => {
  console.log(`✅ Optiva CRM rodando em http://localhost:${port}`);
});

/**
 * Encerramento gracioso.
 *
 * @param {string} signal
 */
const shutdown = (signal) => {
  console.log(`\n${signal} recebido, encerrando...`);

  server.close(() => {
    const db = require('./database/connection');

    db.destroy().finally(() => process.exit(0));
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
