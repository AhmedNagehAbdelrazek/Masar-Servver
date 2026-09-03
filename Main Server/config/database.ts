import { Sequelize, Options } from 'sequelize';
import pg from 'pg';
import config from './config';

// 1700 is the OID for NUMERIC/DECIMAL in Postgres
pg.types.setTypeParser(1700, (val: string | null): number | null => {
  return val === null ? null : parseFloat(val);
});

const environment: string = process.env.NODE_ENV || 'development';
const dbConfig: Options = (config as Record<string, Options>)[environment] as Options;

const sequelize: Sequelize = new Sequelize(dbConfig);

export async function validateDatabase(): Promise<void> {
  // Connect a separate connection to the default database
  const tempSequelize = new Sequelize({
    dialect: 'postgres',
    dialectOptions: {},
    ...(dbConfig as object),
    database: 'postgres',
  } as Options);

  try {
    await tempSequelize.authenticate();
    const [results] = (await tempSequelize.query('SELECT 1 FROM pg_database WHERE datname = $1', {
      bind: [ (dbConfig as unknown as { database?: string }).database ],
    })) as unknown as [Array<unknown>, unknown];

    if ((results as unknown[]).length === 0) {
      const dbName = (dbConfig as unknown as { database?: string }).database;
      await tempSequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created.`);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await tempSequelize.close();
  }
}

export async function syncSchema(): Promise<void> {
  try {
    await sequelize.authenticate();
    // Migrations own the schema; sync only creates missing tables so a
    // fresh DB still boots without manual steps. `alter: true` is disabled
    // because it emits uncastable ALTERs (TEXT→TEXT[], varchar→enum) and
    // crashes startup; use a migration for column type changes instead.
    await sequelize.sync({ force: false });
    console.log('Connection to database established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

/**
 * Initializes the database connection and runs migrations (migration-first).
 *
 * In test environment, migrations are skipped by default.
 */
export async function initDatabase({ runMigrations: doRun = true }: { runMigrations?: boolean } = {}): Promise<Sequelize> {
  await validateDatabase();

  if (process.env.NODE_ENV === 'test') {
    await syncSchema();
    return sequelize;
  }

  if (doRun) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runMigrations } = require('../migrations') as { runMigrations: (opts?: { redo?: boolean }) => Promise<void> };
    await runMigrations({ redo: true });
  }

  await syncSchema();

  return sequelize;
}

export default sequelize;

// CommonJS compatibility: `require('./config/database')` should return the Sequelize instance with initDatabase attached
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(sequelize as unknown as Record<string, unknown> & { initDatabase: typeof initDatabase }).initDatabase = initDatabase;

// Ensure `module.exports` is the sequelize instance itself for existing JS consumers
// This assignment preserves runtime behavior where `const sequelize = require('./config/database')` gets the instance
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // no augmentation needed
  }
}
// @ts-ignore - CommonJS interop
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = sequelize;
  // @ts-ignore
  module.exports.initDatabase = initDatabase;
  // @ts-ignore
  module.exports.validateDatabase = validateDatabase;
  // @ts-ignore
  module.exports.syncSchema = syncSchema;
  // @ts-ignore
  module.exports.default = sequelize;
}
