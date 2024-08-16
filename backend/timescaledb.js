const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.TIMESCALE_DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
