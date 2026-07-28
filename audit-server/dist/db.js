"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = require("./config");
const pool = new pg_1.Pool({
    connectionString: config_1.config.database.url,
    max: config_1.config.database.maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    application_name: 'audit-server',
});
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err);
});
exports.default = pool;
//# sourceMappingURL=db.js.map