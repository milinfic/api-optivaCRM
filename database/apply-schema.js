/**
 * Aplica o schema do CRM (database/schema.sql).
 *
 * Executar: npm run db:schema
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('./connection');

(async () => {
  try {
    const file = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(file, 'utf8');

    await db.raw(sql);

    const { rows } = await db.raw(`
      select table_name
        from information_schema.tables
       where table_schema = 'public'
       order by table_name
    `);

    console.log(`✅ Schema aplicado. ${rows.length} tabela(s) no banco.`);

    await db.destroy();
  } catch (error) {
    console.error('ERRO ao aplicar schema:', error.message);
    await db.destroy();
    process.exit(1);
  }
})();
