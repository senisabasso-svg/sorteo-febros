const { Pool } = require('pg');

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRIVATE_URL
  );
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
});

let initialized = false;

async function init() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS participantes (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      celular TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  initialized = true;
}

async function createParticipante(data) {
  const result = await pool.query(
    `
      INSERT INTO participantes (nombre, direccion, ciudad, celular)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, direccion, ciudad, celular, created_at
    `,
    [data.nombre, data.direccion, data.ciudad, data.celular]
  );

  return result.rows[0];
}

async function getAllParticipantes() {
  const result = await pool.query(`
    SELECT id, nombre, direccion, ciudad, celular, created_at
    FROM participantes
    ORDER BY created_at DESC
  `);

  return result.rows;
}

async function getParticipantesCount() {
  const result = await pool.query('SELECT COUNT(*)::int AS total FROM participantes');
  return result.rows[0].total;
}

async function pickRandomWinner() {
  const result = await pool.query(`
    SELECT id, nombre, direccion, ciudad, celular, created_at
    FROM participantes
    ORDER BY RANDOM()
    LIMIT 1
  `);

  return result.rows[0] || null;
}

module.exports = {
  getDatabaseUrl,
  pool,
  init,
  createParticipante,
  getAllParticipantes,
  getParticipantesCount,
  pickRandomWinner,
};
