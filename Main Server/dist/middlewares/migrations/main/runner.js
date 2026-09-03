"use strict";
const fs = require('fs');
const path = require('path');
const { createConnection } = require('./connection');
// PostgreSQL error codes that mean "the thing you tried to change already exists"
// or "the thing you tried to drop is already gone". These are treated as
// successful no-ops so re-running a migration never crashes:
//   42701  duplicate_column
//   42P07  duplicate_table / duplicate index
//   42710  duplicate_object (e.g. constraint already exists)
//   42P01  undefined_table (table already dropped — used when re-applying)
//   42703  undefined_column (column already dropped — used when re-applying)
const IDEMPOTENT_ERROR_CODES = new Set(['42701', '42P07', '42710', '42P01', '42703']);
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
// Migrations are tracked by their FILE NAME (unique), not by the numeric version —
// two files with the same version number can no longer shadow each other.
async function ensureSchemaMigrationsTable(sequelize) {
    await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      version VARCHAR(255),
      name VARCHAR(255),
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
    // Upgrade a legacy table that was keyed by version only.
    await sequelize.query('ALTER TABLE _schema_migrations ADD COLUMN IF NOT EXISTS filename VARCHAR(255)');
}
// Converts legacy version-only tracking rows to filenames. Rows whose version+name
// match exactly one migration file are claimed by that file; anything else becomes
// an "_orphaned-" tombstone so it can never be re-run or shadow a real file.
async function backfillFilename(sequelize, files) {
    const [rows] = await sequelize.query('SELECT version, name FROM _schema_migrations WHERE filename IS NULL');
    if (rows.length === 0)
        return;
    for (const row of rows) {
        const matches = files.filter((f) => String(parseVersion(f)) === String(row.version) &&
            parseMigrationName(f) === row.name);
        const filename = matches.length === 1 ? matches[0] : `_orphaned-${row.version}-${row.name}.js`;
        await sequelize.query('UPDATE _schema_migrations SET filename = $1 WHERE version = $2 AND filename IS NULL', { bind: [filename, String(row.version)] });
    }
    await sequelize.query('ALTER TABLE _schema_migrations DROP CONSTRAINT IF EXISTS _schema_migrations_pkey');
    await sequelize.query('ALTER TABLE _schema_migrations ADD CONSTRAINT _schema_migrations_pkey PRIMARY KEY (filename)');
}
async function executeCommand(queryInterface, command, index) {
    console.log(`  [#${index}] ${command.fn}`);
    if (command.fn === 'rawQuery') {
        return queryInterface.sequelize.query(command.params[0]);
    }
    if (typeof queryInterface[command.fn] !== 'function') {
        throw new Error(`[migrate] Unknown migration command fn: ${command.fn}`);
    }
    return queryInterface[command.fn].apply(queryInterface, command.params);
}
// Runs a migration command-by-command. Each already-existing change is skipped
// individually (recorded) instead of failing the whole file, so a migration can
// safely be re-run after a manual DB edit.
async function runMigrationFileV2(migration, queryInterface, Sequelize) {
    const commands = migration.migrationCommands;
    if (!Array.isArray(commands) || commands.length === 0) {
        await migration.up(queryInterface, Sequelize);
        return [];
    }
    const skipped = [];
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (!command || typeof command.fn !== 'string' || !Array.isArray(command.params)) {
            throw new Error(`[migrate] Invalid command #${i} in ${(migration.info && migration.info.name) || 'migration'}`);
        }
        try {
            await executeCommand(queryInterface, command, i);
        }
        catch (err) {
            const code = err && err.parent && err.parent.code;
            if (code && IDEMPOTENT_ERROR_CODES.has(code)) {
                skipped.push({ index: i, fn: command.fn, code, sql: err.sql || (err.parent && err.parent.sql) });
            }
            else {
                throw err;
            }
        }
    }
    return skipped;
}
async function runMigrations(options = {}) {
    const versionsDir = options.versionsDir || getVersionsDir();
    if (!fs.existsSync(versionsDir)) {
        console.log('[migrate] No versions/ directory found. Skipping.');
        return { applied: [], skipped: [] };
    }
    const sequelize = options.sequelize || createConnection(options);
    const Sequelize = require('sequelize');
    try {
        await ensureSchemaMigrationsTable(sequelize);
        const files = fs
            .readdirSync(versionsDir)
            .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
            .sort((a, b) => {
            const va = parseVersion(a) || 0;
            const vb = parseVersion(b) || 0;
            if (va === vb)
                return a.localeCompare(b);
            return va - vb;
        });
        const versionCounts = new Map();
        for (const f of files) {
            const v = parseVersion(f);
            if (v !== null)
                versionCounts.set(v, (versionCounts.get(v) || 0) + 1);
        }
        for (const [v, n] of versionCounts) {
            if (n > 1) {
                console.log(`[migrate] ⚠ ${n} files share version ${v}; they are tracked independently by filename and run in filename order`);
            }
        }
        if (options.redo) {
            await sequelize.query('DELETE FROM _schema_migrations');
            console.log('[migrate] redo: cleared applied-migration tracking');
        }
        else {
            await backfillFilename(sequelize, files);
        }
        const [appliedRows] = await sequelize.query('SELECT filename FROM _schema_migrations');
        const appliedSet = new Set(appliedRows.map((r) => r.filename));
        const pending = files.filter((f) => !appliedSet.has(f));
        if (pending.length === 0) {
            console.log('[migrate] All migrations already applied.');
            return { applied: [], skipped: [] };
        }
        const queryInterface = sequelize.getQueryInterface();
        const applied = [];
        const skipped = [];
        for (const file of pending) {
            const version = String(parseVersion(file) || '');
            const name = parseMigrationName(file);
            const filePath = path.join(versionsDir, file);
            console.log(`[migrate] Running ${file}...`);
            const resolved = require.resolve(filePath);
            delete require.cache[resolved];
            const migration = require(filePath);
            const skippedHere = await runMigrationFileV2(migration, queryInterface, Sequelize);
            await sequelize.query('DELETE FROM _schema_migrations WHERE filename = $1', {
                bind: [file],
            });
            await sequelize.query('INSERT INTO _schema_migrations (filename, version, name, applied_at) VALUES ($1, $2, $3, NOW())', { bind: [file, version, name] });
            for (const s of skippedHere) {
                console.log(`[migrate]   ⚠ #${s.index} ${s.fn} skipped — already exists (${s.code})`);
            }
            console.log(`[migrate] ✓ ${file} applied${skippedHere.length ? ` (${skippedHere.length} command(s) already present)` : ''}`);
            applied.push(file);
            skipped.push(...skippedHere);
        }
        console.log(`[migrate] Done. ${applied.length} migration(s) applied.`);
        return { applied, skipped };
    }
    finally {
        if (!options.sequelize) {
            await sequelize.close();
        }
    }
}
module.exports = { runMigrations, getVersionsDir };
//# sourceMappingURL=runner.js.map