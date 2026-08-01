import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { config } from './config';

function adminConnectionString(dbName: string): string {
  const url = new URL(config.database.url);
  url.pathname = `/${dbName}`;
  return url.toString();
}

export async function ensureDatabase(): Promise<void> {
  const dbName = new URL(config.database.url).pathname.replace(/^\//, '');
  const adminPool = new Pool({
    connectionString: adminConnectionString('postgres'),
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  try {
    await adminPool.query('SELECT 1');
  } catch (err) {
    console.error('[init] Unable to connect to postgres database:', err);
    throw err;
  }

  try {
    const { rowCount } = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[init] Database ${dbName} created.`);
    }
  } finally {
    await adminPool.end();
  }
}

export async function migrate(): Promise<void> {
  const migrationPath = resolve(__dirname, '../migrations/001_init.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('[migrate] Running migration...');
  const pool = new Pool({
    connectionString: config.database.url,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
  console.log('[migrate] Done.');
}
