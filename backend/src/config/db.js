const { Pool, types } = require("pg");

types.setTypeParser(1700, (val) => parseFloat(val)); // NUMERIC → number
types.setTypeParser(1082, (val) => val); // DATE → "2026-11-07"
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;