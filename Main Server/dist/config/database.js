"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatabase = validateDatabase;
exports.syncSchema = syncSchema;
exports.initDatabase = initDatabase;
const sequelize_1 = require("sequelize");
const pg_1 = __importDefault(require("pg"));
const config_1 = __importDefault(require("./config"));
// 1700 is the OID for NUMERIC/DECIMAL in Postgres
pg_1.default.types.setTypeParser(1700, (val) => {
    return val === null ? null : parseFloat(val);
});
const environment = process.env.NODE_ENV || 'development';
const dbConfig = config_1.default[environment];
const sequelize = new sequelize_1.Sequelize(dbConfig);
async function validateDatabase() {
    // Connect a separate connection to the default database
    const tempSequelize = new sequelize_1.Sequelize({
        dialect: 'postgres',
        dialectOptions: {},
        ...dbConfig,
        database: 'postgres',
    });
    try {
        await tempSequelize.authenticate();
        const [results] = (await tempSequelize.query('SELECT 1 FROM pg_database WHERE datname = $1', {
            bind: [dbConfig.database],
        }));
        if (results.length === 0) {
            const dbName = dbConfig.database;
            await tempSequelize.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created.`);
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    finally {
        await tempSequelize.close();
    }
}
async function syncSchema() {
    try {
        await sequelize.authenticate();
        // Migrations own the schema; sync only creates missing tables so a
        // fresh DB still boots without manual steps. `alter: true` is disabled
        // because it emits uncastable ALTERs (TEXT→TEXT[], varchar→enum) and
        // crashes startup; use a migration for column type changes instead.
        await sequelize.sync({ force: false });
        console.log('Connection to database established successfully.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
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
        await syncSchema();
        return sequelize;
    }
    if (doRun) {
        const { runMigrations } = require('../migrations');
        await runMigrations({ redo: true });
    }
    await syncSchema();
    return sequelize;
}
exports.default = sequelize;
// CommonJS compatibility: `require('./config/database')` should return the Sequelize instance with initDatabase attached
sequelize.initDatabase = initDatabase;
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
//# sourceMappingURL=database.js.map