import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pool from './db';

async function migrate() {
  const migrationPath = resolve(__dirname, '../migrations/001_init.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('[migrate] Running migration...');
  await pool.query(sql);
  console.log('[migrate] Done.');

  await pool.end();
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
