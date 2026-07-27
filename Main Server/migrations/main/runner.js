const fs = require('fs');
const path = require('path');
const { createConnection } = require('./connection');

const IGNORED_ERROR_CODES = ['42701', '42P07', '42P01'];

function getVersionsDir() {
  return path.join(__dirname, '..', 'versions');
}

function parseVersion(filename) {
  const match = filename.match(/^(\d+).+\.js$/);
  return match ? parseInt(match[1], 10) : null;
}

function parseMigrationName(filename) {
  const match = filename.match(/^\d+-(.+)\.js$/);
  return match ? match[1].replace(/_/g, ' ') : filename;
}

async function ensureSchemaMigrationsTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(sequelize) {
  const [results] = await sequelize.query(
    'SELECT version FROM _schema_migrations ORDER BY version ASC'
  );
  return results.map((r) => r.version);
}

async function runMigrations(options = {}) {
  const versionsDir = options.versionsDir || getVersionsDir();

  if (!fs.existsSync(versionsDir)) {
    console.log('[migrate] No versions/ directory found. Skipping.');
    return;
  }

  const sequelize = options.sequelize || createConnection(options);

  try {
    await ensureSchemaMigrationsTable(sequelize);

    const files = fs
      .readdirSync(versionsDir)
      .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
      .sort((a, b) => {
        const va = parseVersion(a) || 0;
        const vb = parseVersion(b) || 0;
        return va - vb;
      });

    const applied = await getAppliedMigrations(sequelize);
    const appliedSet = new Set(applied);

    const pending = files.filter((f) => {
      const version = parseVersion(f);
      return version !== null && !appliedSet.has(String(version));
    });

    if (pending.length === 0) {
      console.log('[migrate] All migrations already applied.');
      return;
    }

    let appliedCount = 0;

    for (const file of pending) {
      const version = String(parseVersion(file));
      const name = parseMigrationName(file);
      const filePath = path.join(versionsDir, file);

      console.log(`[migrate] Running ${file}...`);

      try {
        const migration = require(filePath);
        const queryInterface = sequelize.getQueryInterface();
        const Sequelize = require('sequelize');

        await migration.up(queryInterface, Sequelize);

        await sequelize.query(
          'INSERT INTO _schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
          { bind: [version, name] }
        );

        appliedCount++;
        console.log(`[migrate] ✓ ${file} applied`);
      } catch (err) {
        if (err.parent && IGNORED_ERROR_CODES.includes(err.parent.code)) {
          console.log(`[migrate] ⚠ ${file} skipped (already exists): ${err.sql || ''}`);
          await sequelize.query(
            'INSERT INTO _schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
            { bind: [version, name] }
          );
          appliedCount++;
        } else {
          console.error(`[migrate] ✗ ${file} FAILED`);
          console.error(err);
          throw err;
        }
      }
    }

    console.log(`[migrate] Done. ${appliedCount} migration(s) applied.`);
  } finally {
    if (!options.sequelize) {
      await sequelize.close();
    }
  }
}

module.exports = { runMigrations, getVersionsDir };
