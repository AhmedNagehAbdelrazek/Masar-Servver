// Runtime entrypoints (e.g., server.js) are responsible for loading environment variables.
// Avoid loading real `.env` during tests; Jest setup loads `.env.test` instead.
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

// Function to parse DATABASE_URL
const parseDatabaseUrl = (url) => {
  const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const matches = url.match(regex);

  if (matches) {
    return {
      username: matches[1],
      password: matches[2],
      host: matches[3],
      port: parseInt(matches[4], 10),
      database: matches[5]
    };
  } else {
    throw new Error('Invalid DATABASE_URL format');
  }
};

const shouldUseSsl = () => {
  const sslMode = String(process.env.PGSSLMODE || process.env.DB_SSL_MODE || "").toLowerCase();
  const explicitSsl = ["require", "true", "1", "yes", "on"].includes(sslMode) || process.env.DB_SSL === "true";

  if (!explicitSsl) {
    return undefined;
  }

  return {
    require: true,
    // Many managed Postgres providers terminate TLS with a certificate chain
    // that is not trusted by local Node installs. Allow opt-in verification
    // via DB_SSL_REJECT_UNAUTHORIZED=true when a trusted CA is available.
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  };
};

const sslOptions = shouldUseSsl();
const sslDialectOptions = sslOptions
  ? {
      ssl: sslOptions,
    }
  : undefined;


const config = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  ...(sslDialectOptions ? { dialectOptions: sslDialectOptions } : {}),
};

module.exports = {
  development: {
    ...config,
    logging: false,
    define: {
      createdAt: "createdat",
      updatedAt: "updatedat"
    },
    dialect: 'postgres',
  },
  test: {
    ...config,
    logging: false,
    define: {
      createdAt: "createdat",
      updatedAt: "updatedat"
    },
    dialect: 'postgres',
  },
  production: {
    ...config,
    define: {
      createdAt: "createdat",
      updatedAt: "updatedat"
    },
    dialect: 'postgres',
  }
};
