const fs = require('fs');
const path = require('path');
const { createConnection } = require('../main/connection');
const { runMigrations } = require('../main/runner');

const MIGRATIONS_ROOT = path.join(__dirname, '..');
const VERSIONS_DIR = path.join(MIGRATIONS_ROOT, 'versions');

function pad(n) {
  return String(n).padStart(3, '0');
}

function cleanName(filename) {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/_+/g, '_');
}

async function initMigrations() {
  console.log('[init] Setting up migration system...');

  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    console.log('[init] Created migrations/versions/');
  }

  const rootFiles = fs.readdirSync(MIGRATIONS_ROOT).filter((f) => {
    return f.endsWith('.js') && /^\d+-.+\.js$/.test(f);
  });

  if (rootFiles.length > 0) {
    console.log(`[init] Found ${rootFiles.length} migration(s) in root. Moving to versions/...`);
    rootFiles.sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      return na - nb;
    });

    for (const file of rootFiles) {
      const num = parseInt(file, 10);
      const newName = `${pad(num)}-${cleanName(file)}`;
      const src = path.join(MIGRATIONS_ROOT, file);
      const dest = path.join(VERSIONS_DIR, newName);
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[init] ${file} → versions/${newName}`);
    }
  }

  const snapshotFiles = ['_current.json', '_current_bak.json'];
  for (const f of snapshotFiles) {
    const src = path.join(MIGRATIONS_ROOT, f);
    if (fs.existsSync(src)) {
      const dest = path.join(VERSIONS_DIR, f);
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[init] ${f} → versions/${f}`);
    }
  }

  let conn;
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
  } catch (err) {
    console.warn('[init] Could not connect to DB:', err.message);
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

module.exports = { initMigrations };
