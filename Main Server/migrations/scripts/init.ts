import fs from 'fs';
import path from 'path';
import { createConnection } from '../main/connection';
import { runMigrations } from '../main/runner';
import type { Sequelize } from 'sequelize';

const MIGRATIONS_ROOT: string = path.join(__dirname, '..');
const VERSIONS_DIR: string = path.join(MIGRATIONS_ROOT, 'versions');

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

function cleanName(filename: string): string {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/_+/g, '_');
}

export async function initMigrations(): Promise<void> {
  console.log('[init] Setting up migration system...');

  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    console.log('[init] Created migrations/versions/');
  }

  const rootFiles: string[] = fs.readdirSync(MIGRATIONS_ROOT).filter((f: string) => {
    return f.endsWith('.js') && /^\d+-.+\.js$/.test(f);
  });

  if (rootFiles.length > 0) {
    console.log(`[init] Found ${rootFiles.length} migration(s) in root. Moving to versions/...`);
    rootFiles.sort((a: string, b: string) => {
      const na: number = parseInt(a, 10);
      const nb: number = parseInt(b, 10);
      return na - nb;
    });

    for (const file of rootFiles) {
      const num: number = parseInt(file, 10);
      const newName: string = `${pad(num)}-${cleanName(file)}`;
      const src: string = path.join(MIGRATIONS_ROOT, file);
      const dest: string = path.join(VERSIONS_DIR, newName);
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[init] ${file} → versions/${newName}`);
    }
  }

  const snapshotFiles: string[] = ['_current.json', '_current_bak.json'];
  for (const f of snapshotFiles) {
    const src: string = path.join(MIGRATIONS_ROOT, f);
    if (fs.existsSync(src)) {
      const dest: string = path.join(VERSIONS_DIR, f);
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[init] ${f} → versions/${f}`);
    }
  }

  let conn: Sequelize | undefined;
  try {
    conn = createConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[init] _schema_migrations table ready.');
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.warn('[init] Could not connect to DB:', msg);
    console.warn('[init] File organization done. Run "db:init" later when DB is available.');
    console.log('[init] Done! Migration files are ready.');
    return;
  } finally {
    if (conn) await conn.close();
  }

  console.log('[init] Running pending migrations...');
  await runMigrations({ sequelize: createConnection() });

  console.log('[init] Done! Migration system is ready.');
}

export default { initMigrations };
module.exports = { initMigrations };
