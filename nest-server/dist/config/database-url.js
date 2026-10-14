export function resolveDatabaseUrl(env = process.env) {
    if (env.DATABASE_URL)
        return env.DATABASE_URL;
    return (`postgresql://${env.DB_USERNAME ?? ''}:${env.DB_PASSWORD ?? ''}` +
        `@${env.DB_HOST ?? 'localhost'}:${env.DB_PORT ?? '5432'}/${env.DB_NAME ?? ''}?schema=public`);
}
//# sourceMappingURL=database-url.js.map