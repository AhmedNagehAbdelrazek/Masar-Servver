"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = createConnection;
const sequelize_1 = require("sequelize");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function loadEnv() {
    if (process.env.DB_NAME)
        return;
    const envPath = path_1.default.join(process.cwd(), '.env');
    if (!fs_1.default.existsSync(envPath))
        return;
    const lines = fs_1.default.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}
function createConnection(overrides = {}) {
    loadEnv();
    const portEnv = process.env.DB_PORT;
    const parsedPort = portEnv ? parseInt(portEnv, 10) : NaN;
    const config = {
        dialect: 'postgres',
        host: overrides.host || process.env.DB_HOST || 'localhost',
        port: overrides.port ??
            (Number.isFinite(parsedPort) ? parsedPort : 5432),
        database: overrides.database || process.env.DB_NAME,
        username: overrides.username || process.env.DB_USERNAME,
        password: overrides.password || process.env.DB_PASSWORD,
        logging: overrides.logging ?? false,
    };
    return new sequelize_1.Sequelize(config);
}
exports.default = { createConnection };
module.exports = { createConnection };
//# sourceMappingURL=connection.js.map