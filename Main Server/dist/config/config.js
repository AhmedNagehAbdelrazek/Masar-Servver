"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.production = exports.test = exports.development = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Runtime entrypoints (e.g., server.js) are responsible for loading environment variables.
// Avoid loading real `.env` during tests; Jest setup loads `.env.test` instead.
if (process.env.NODE_ENV !== 'test') {
    dotenv_1.default.config();
}
function shouldUseSsl() {
    const sslMode = String(process.env.PGSSLMODE || process.env.DB_SSL_MODE || '').toLowerCase();
    const explicitSsl = ['require', 'true', '1', 'yes', 'on'].includes(sslMode) ||
        process.env.DB_SSL === 'true';
    if (!explicitSsl) {
        return undefined;
    }
    return {
        require: true,
        // Many managed Postgres providers terminate TLS with a certificate chain
        // that is not trusted by local Node installs. Allow opt-in verification
        // via DB_SSL_REJECT_UNAUTHORIZED=true when a trusted CA is available.
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    };
}
const sslOptions = shouldUseSsl();
const sslDialectOptions = sslOptions
    ? {
        ssl: sslOptions,
    }
    : undefined;
const baseConfig = {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '', 10),
    ...(sslDialectOptions ? { dialectOptions: sslDialectOptions } : {}),
};
exports.development = {
    ...baseConfig,
    logging: false,
    define: {
        createdAt: 'createdat',
        updatedAt: 'updatedat',
    },
    dialect: 'postgres',
};
exports.test = {
    ...baseConfig,
    logging: false,
    define: {
        createdAt: 'createdat',
        updatedAt: 'updatedat',
    },
    dialect: 'postgres',
};
exports.production = {
    ...baseConfig,
    logging: false,
    define: {
        createdAt: 'createdat',
        updatedAt: 'updatedat',
    },
    dialect: 'postgres',
};
const config = {
    development: exports.development,
    test: exports.test,
    production: exports.production,
};
exports.default = config;
//# sourceMappingURL=config.js.map