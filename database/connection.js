require('dotenv').config();
const knex = require('knex');

const { types } = require('pg');
types.setTypeParser(20, val => parseInt(val, 10));
types.setTypeParser(1700, val => parseFloat(val));

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  pool: { min: 0, max: 10 }
});

module.exports = db;
