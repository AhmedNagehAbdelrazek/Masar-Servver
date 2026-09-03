import { Sequelize, Options } from 'sequelize';
import path from 'path';
import fs from 'fs';

export interface ConnectionOverrides {
  host?: string;
  port?: number | string;
  database?: string;
  username?: string;
  password?: string;
  logging?: boolean | ((sql: string) => void);
  [key: string]: unknown;
}

function loadEnv(): void {
  if (process.env.DB_NAME) return;
  const envPath: string = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines: string[] = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed: string = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex: number = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key: string = trimmed.slice(0, eqIndex).trim();
    let value: string = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function createConnection(overrides: ConnectionOverrides = {}): Sequelize {
  loadEnv();
  const portEnv: string | undefined = process.env.DB_PORT;
  const parsedPort: number = portEnv ? parseInt(portEnv, 10) : NaN;
  const config: Options = {
    dialect: 'postgres',
    host: (overrides.host as string) || process.env.DB_HOST || 'localhost',
    port:
      (overrides.port as number) ??
      (Number.isFinite(parsedPort) ? parsedPort : 5432),
    database: (overrides.database as string) || process.env.DB_NAME,
    username: (overrides.username as string) || process.env.DB_USERNAME,
    password: (overrides.password as string) || process.env.DB_PASSWORD,
    logging:
      (overrides.logging as Options['logging']) ?? (false as Options['logging']),
  };

  return new Sequelize(config);
}

export { createConnection };
export default { createConnection };
module.exports = { createConnection };
