"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabase = ensureDatabase;
exports.migrate = migrate;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const pg_1 = require("pg");
const config_1 = require("./config");
function adminConnectionString(dbName) {
    const url = new URL(config_1.config.database.url);
    url.pathname = `/${dbName}`;
    return url.toString();
}
async function ensureDatabase() {
    const dbName = new URL(config_1.config.database.url).pathname.replace(/^\//, '');
    const adminPool = new pg_1.Pool({
        connectionString: adminConnectionString('postgres'),
        max: 1,
        connectionTimeoutMillis: 5000,
    });
    try {
        await adminPool.query('SELECT 1');
    }
    catch (err) {
        console.error('[init] Unable to connect to postgres database:', err);
        throw err;
    }
    try {
        const { rowCount } = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (rowCount === 0) {
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`[init] Database ${dbName} created.`);
        }
    }
    finally {
        await adminPool.end();
    }
}
async function migrate() {
    const migrationPath = (0, node_path_1.resolve)(__dirname, '../migrations/001_init.sql');
    const sql = (0, node_fs_1.readFileSync)(migrationPath, 'utf8');
    console.log('[migrate] Running migration...');
    const pool = new pg_1.Pool({
        connectionString: config_1.config.database.url,
        max: 1,
        connectionTimeoutMillis: 5000,
    });
    try {
        await pool.query(sql);
    }
    finally {
        await pool.end();
    }
    console.log('[migrate] Done.');
}
//# sourceMappingURL=initDb.js.map