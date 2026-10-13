// Single place that builds the Postgres connection string: explicit
// DATABASE_URL wins, otherwise the split DB_* parts (same rule as the
// Express config and PrismaService). Used by the app, the boot-time
// migrate step, and ops scripts — do not duplicate this logic.
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  return (
    `postgresql://${env.DB_USERNAME ?? ''}:${env.DB_PASSWORD ?? ''}` +
    `@${env.DB_HOST ?? 'localhost'}:${env.DB_PORT ?? '5432'}/${env.DB_NAME ?? ''}?schema=public`
  );
}
