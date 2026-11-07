const { Pool, types } = require("pg");

types.setTypeParser(1700, (val) => parseFloat(val)); // NUMERIC → number

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;