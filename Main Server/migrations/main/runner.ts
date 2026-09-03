import fs from 'fs';
import path from 'path';
import { createConnection } from './connection';
import type { Sequelize, QueryInterface } from 'sequelize';

// PostgreSQL error codes that mean "the thing you tried to change already exists"
// or "the thing you tried to drop is already gone". These are treated as
// successful no-ops so re-running a migration never crashes:
//   42701  duplicate_column
//   42P07  duplicate_table / duplicate index
//   42710  duplicate_object (e.g. constraint already exists)
//   42P01  undefined_table (table already dropped — used when re-applying)
//   42703  undefined_column (column already dropped — used when re-applying)
const IDEMPOTENT_ERROR_CODES: Set<string> = new Set([
  '42701',
  '42P07',
  '42710',
  '42P01',
  '42703',
]);

export function getVersionsDir(): string {
  return path.join(__dirname, '..', 'versions');
}

function parseVersion(filename: string): number | null {
  const match: RegExpMatchArray | null = filename.match(/^(\d+).+\.js$/);
  return match ? parseInt(match[1], 10) : null;
}

function parseMigrationName(filename: string): string {
  const match: RegExpMatchArray | null = filename.match(/^\d+-(.+)\.js$/);
  return match ? match[1].replace(/_/g, ' ') : filename;
}

export interface MigrationCommand {
  fn: string;
  params: unknown[];
}

export interface MigrationFile {
  migrationCommands?: MigrationCommand[];
  up?: (queryInterface: QueryInterface, Sequelize: unknown) => Promise<void>;
  info?: { name?: string };
  [key: string]: unknown;
}

export interface SkippedCommand {
  index: number;
  fn: string;
  code: string;
  sql?: string;
}

interface QueryError extends Error {
  sql?: string;
  parent?: { code?: string; sql?: string };
}

interface RunMigrationsOptions {
  versionsDir?: string;
  sequelize?: Sequelize;
  redo?: boolean;
  host?: string;
  port?: number | string;
  database?: string;
  username?: string;
  password?: string;
  logging?: unknown;
  [key: string]: unknown;
}

interface RunMigrationsResult {
  applied: string[];
  skipped: SkippedCommand[];
}

// Migrations are tracked by their FILE NAME (unique), not by the numeric version —
// two files with the same version number can no longer shadow each other.
async function ensureSchemaMigrationsTable(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      version VARCHAR(255),
      name VARCHAR(255),
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Upgrade a legacy table that was keyed by version only.
  await sequelize.query(
    'ALTER TABLE _schema_migrations ADD COLUMN IF NOT EXISTS filename VARCHAR(255)'
  );
}

// Converts legacy version-only tracking rows to filenames. Rows whose version+name
// match exactly one migration file are claimed by that file; anything else becomes
// an "_orphaned-" tombstone so it can never be re-run or shadow a real file.
async function backfillFilename(sequelize: Sequelize, files: string[]): Promise<void> {
  const [rows] = (await sequelize.query(
    'SELECT version, name FROM _schema_migrations WHERE filename IS NULL'
  )) as unknown as [Array<{ version: string; name: string }>, unknown];
  if (rows.length === 0) return;

  for (const row of rows) {
    const matches: string[] = files.filter(
      (f: string) =>
        String(parseVersion(f)) === String(row.version) &&
        parseMigrationName(f) === row.name
    );
    const filename: string =
      matches.length === 1 ? matches[0] : `_orphaned-${row.version}-${row.name}.js`;
    await sequelize.query(
      'UPDATE _schema_migrations SET filename = $1 WHERE version = $2 AND filename IS NULL',
      { bind: [filename, String(row.version)] }
    );
  }

  await sequelize.query(
    'ALTER TABLE _schema_migrations DROP CONSTRAINT IF EXISTS _schema_migrations_pkey'
  );
  await sequelize.query(
    'ALTER TABLE _schema_migrations ADD CONSTRAINT _schema_migrations_pkey PRIMARY KEY (filename)'
  );
}

async function executeCommand(
  queryInterface: QueryInterface,
  command: MigrationCommand,
  index: number
): Promise<unknown> {
  console.log(`  [#${index}] ${command.fn}`);
  if (command.fn === 'rawQuery') {
    return (queryInterface.sequelize as Sequelize).query(command.params[0] as string);
  }
  const fn: unknown = (queryInterface as unknown as Record<string, unknown>)[command.fn];
  if (typeof fn !== 'function') {
    throw new Error(`[migrate] Unknown migration command fn: ${command.fn}`);
  }
  return (fn as (...args: unknown[]) => unknown).apply(queryInterface, command.params);
}

// Runs a migration command-by-command. Each already-existing change is skipped
// individually (recorded) instead of failing the whole file, so a migration can
// safely be re-run after a manual DB edit.
async function runMigrationFileV2(
  migration: MigrationFile,
  queryInterface: QueryInterface,
  SequelizeLib: unknown
): Promise<SkippedCommand[]> {
  const commands: MigrationCommand[] | undefined = migration.migrationCommands as MigrationCommand[] | undefined;

  if (!Array.isArray(commands) || commands.length === 0) {
    if (typeof migration.up === 'function') {
      await migration.up(queryInterface, SequelizeLib);
    }
    return [];
  }

  const skipped: SkippedCommand[] = [];
  for (let i = 0; i < commands.length; i++) {
    const command: MigrationCommand = commands[i];
    if (!command || typeof command.fn !== 'string' || !Array.isArray(command.params)) {
      throw new Error(
        `[migrate] Invalid command #${i} in ${(migration.info && migration.info.name) || 'migration'}`
      );
    }
    try {
      await executeCommand(queryInterface, command, i);
    } catch (err: unknown) {
      const qErr: QueryError = err as QueryError;
      const code: string | undefined = qErr && qErr.parent && qErr.parent.code;
      if (code && IDEMPOTENT_ERROR_CODES.has(code)) {
        skipped.push({
          index: i,
          fn: command.fn,
          code,
          sql: qErr.sql || (qErr.parent && qErr.parent.sql),
        });
      } else {
        throw err;
      }
    }
  }
  return skipped;
}

export async function runMigrations(options: RunMigrationsOptions = {}): Promise<RunMigrationsResult> {
  const versionsDir: string = (options.versionsDir as string) || getVersionsDir();

  if (!fs.existsSync(versionsDir)) {
    console.log('[migrate] No versions/ directory found. Skipping.');
    return { applied: [], skipped: [] };
  }

  const sequelize: Sequelize = (options.sequelize as Sequelize) || createConnection(options as unknown as Record<string, string>);
  const SequelizeLib: unknown = require('sequelize');

  try {
    await ensureSchemaMigrationsTable(sequelize);

    const files: string[] = fs
      .readdirSync(versionsDir)
      .filter((f: string) => f.endsWith('.js') && !f.startsWith('_'))
      .sort((a: string, b: string) => {
        const va: number = parseVersion(a) || 0;
        const vb: number = parseVersion(b) || 0;
        if (va === vb) return a.localeCompare(b);
        return va - vb;
      });

    const versionCounts: Map<number, number> = new Map();
    for (const f of files) {
      const v: number | null = parseVersion(f);
      if (v !== null) versionCounts.set(v, (versionCounts.get(v) || 0) + 1);
    }
    for (const [v, n] of versionCounts) {
      if (n > 1) {
        console.log(
          `[migrate] ⚠ ${n} files share version ${v}; they are tracked independently by filename and run in filename order`
        );
      }
    }

    if (options.redo) {
      await sequelize.query('DELETE FROM _schema_migrations');
      console.log('[migrate] redo: cleared applied-migration tracking');
    } else {
      await backfillFilename(sequelize, files);
    }

    const [appliedRows] = (await sequelize.query('SELECT filename FROM _schema_migrations')) as unknown as [
      Array<{ filename: string }>,
      unknown
    ];
    const appliedSet: Set<string> = new Set(appliedRows.map((r: { filename: string }) => r.filename));

    const pending: string[] = files.filter((f: string) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log('[migrate] All migrations already applied.');
      return { applied: [], skipped: [] };
    }

    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    const applied: string[] = [];
    const skipped: SkippedCommand[] = [];

    for (const file of pending) {
      const version: string = String(parseVersion(file) || '');
      const name: string = parseMigrationName(file);
      const filePath: string = path.join(versionsDir, file);

      console.log(`[migrate] Running ${file}...`);

      const resolved: string = require.resolve(filePath);
      delete require.cache[resolved];
      const migration: MigrationFile = require(filePath) as MigrationFile;

      const skippedHere: SkippedCommand[] = await runMigrationFileV2(migration, queryInterface, SequelizeLib);

      await sequelize.query('DELETE FROM _schema_migrations WHERE filename = $1', {
        bind: [file],
      });
      await sequelize.query(
        'INSERT INTO _schema_migrations (filename, version, name, applied_at) VALUES ($1, $2, $3, NOW())',
        { bind: [file, version, name] }
      );

      for (const s of skippedHere) {
        console.log(`[migrate]   ⚠ #${s.index} ${s.fn} skipped — already exists (${s.code})`);
      }
      console.log(
        `[migrate] ✓ ${file} applied${skippedHere.length ? ` (${skippedHere.length} command(s) already present)` : ''}`
      );
      applied.push(file);
      skipped.push(...skippedHere);
    }

    console.log(`[migrate] Done. ${applied.length} migration(s) applied.`);
    return { applied, skipped };
  } finally {
    if (!options.sequelize) {
      await sequelize.close();
    }
  }
}

export default { runMigrations, getVersionsDir };
module.exports = { runMigrations, getVersionsDir };
