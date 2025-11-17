const { Pool } = require('pg');

const buildPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    const config = { connectionString: process.env.DATABASE_URL };
    if (process.env.PGSSLMODE === 'require') {
      config.ssl = { rejectUnauthorized: false };
    }
    return config;
  }

  const config = {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };

  if (process.env.PGSSLMODE === 'require') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected Postgres error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
