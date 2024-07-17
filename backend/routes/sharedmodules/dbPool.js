const { Pool } = require('pg');
const dotenv = require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: true, // Note that this is required to connect to the Render server.
});

module.exports = pool;
