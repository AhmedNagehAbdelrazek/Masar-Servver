import dotenv from 'dotenv';
import type { Options, Dialect } from 'sequelize';

// Runtime entrypoints (e.g., server.js) are responsible for loading environment variables.
// Avoid loading real `.env` during tests; Jest setup loads `.env.test` instead.
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

interface SslOptions {
  require: boolean;
  rejectUnauthorized: boolean;
}

function shouldUseSsl(): SslOptions | undefined {
  const sslMode: string = String(process.env.PGSSLMODE || process.env.DB_SSL_MODE || '').toLowerCase();
  const explicitSsl: boolean =
    (['require', 'true', '1', 'yes', 'on'] as readonly string[]).includes(sslMode) ||
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

const sslOptions: SslOptions | undefined = shouldUseSsl();
const sslDialectOptions: { ssl: SslOptions } | undefined = sslOptions
  ? {
      ssl: sslOptions,
    }
  : undefined;

interface BaseConfig {
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
  host: string | undefined;
  port: number;
  dialectOptions?: { ssl: SslOptions };
}

const baseConfig: BaseConfig = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '', 10),
  ...(sslDialectOptions ? { dialectOptions: sslDialectOptions } : {}),
};

export interface SequelizeEnvConfig extends Options {
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
  host: string | undefined;
  port: number;
  dialect: Dialect;
  logging: false;
  define: {
    createdAt: string;
    updatedAt: string;
  };
  dialectOptions?: { ssl: SslOptions };
}

export const development: SequelizeEnvConfig = {
  ...baseConfig,
  logging: false,
  define: {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
  },
  dialect: 'postgres',
};

export const test: SequelizeEnvConfig = {
  ...baseConfig,
  logging: false,
  define: {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
  },
  dialect: 'postgres',
};

export const production: SequelizeEnvConfig = {
  ...baseConfig,
  logging: false,
  define: {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
  },
  dialect: 'postgres',
};

const config = {
  development,
  test,
  production,
} as const;

export type Config = typeof config;
export type EnvName = keyof Config;

export default config;
