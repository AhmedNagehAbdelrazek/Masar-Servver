const { Sequelize } = require('sequelize');
const config = require('./config');
const { execSync } = require('child_process');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const sequelize = new Sequelize(dbConfig);
const pg = require('pg');
  // 1700 is the OID for NUMERIC/DECIMAL in Postgres
  pg.types.setTypeParser(1700, function(val) {
    return val === null ? null : parseFloat(val);
  });
async function validateDatabase() {
  // Connect a separate connection to the default database
  const tempSequelize = new Sequelize({
    dialect: 'postgres',
    dialectOptions: {},
    ...dbConfig,
    database: 'postgres'
  });

  try {
    await tempSequelize.authenticate();
    const [results] = await tempSequelize.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      { bind: [dbConfig.database] }
    );

    if (results.length === 0) {
      await tempSequelize.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database ${dbConfig.database} created.`);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await tempSequelize.close();
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync({
      force:false,
      alter:true,
    });
    console.log('Connection to database established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

/**
 * Run Sequelize migrations using CLI.
 * Requires .sequelizerc to be present.
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'pipe' });
    console.log('Migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

/**
 * Initializes the database connection and runs migrations (migration-first).
 *
 * In test environment, migrations are skipped by default.
 */
async function initDatabase({ runMigrations: doRun = true } = {}) {
  await validateDatabase();

  if (process.env.NODE_ENV === 'test') {
    return sequelize;
  }

  if (doRun) {
    // await runMigrations();
  }

  return sequelize;
}

module.exports = sequelize;
module.exports.initDatabase = initDatabase;
