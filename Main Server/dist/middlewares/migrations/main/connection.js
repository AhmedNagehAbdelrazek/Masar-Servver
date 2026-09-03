"use strict";
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
function loadEnv() {
    if (process.env.DB_NAME)
        return;
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath))
        return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}
function createConnection(overrides = {}) {
    loadEnv();
    const config = {
        dialect: 'postgres',
        host: overrides.host || process.env.DB_HOST || 'localhost',
        port: overrides.port || parseInt(process.env.DB_PORT, 10) || 5432,
        database: overrides.database || process.env.DB_NAME,
        username: overrides.username || process.env.DB_USERNAME,
        password: overrides.password || process.env.DB_PASSWORD,
        logging: overrides.logging ?? false,
    };
    return new Sequelize(config);
}
module.exports = { createConnection };
//# sourceMappingURL=connection.js.map