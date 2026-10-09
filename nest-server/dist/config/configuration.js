export default () => ({
    port: parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appLocale: process.env.APP_LOCALE ?? 'ar',
    database: {
        url: process.env.DATABASE_URL ?? '',
    },
    jwt: {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
        expiry: process.env.JWT_EXPIRY ?? '24h',
        refreshExpiry: '7d',
    },
    redis: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    maps: {
        serverKey: process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '',
        mock: (process.env.MAPS_MOCK ?? 'true') === 'true',
        regionCode: process.env.GOOGLE_MAPS_REGION_CODE ?? 'jo',
        timeoutMs: parseInt(process.env.GOOGLE_MAPS_TIMEOUT_MS ?? '5000', 10),
        routeCacheTtlSeconds: parseInt(process.env.ROUTE_CACHE_TTL_SECONDS ?? '86400', 10),
    },
    tracking: {
        intervalSeconds: parseInt(process.env.TRACKING_INTERVAL_SECONDS ?? '5', 10),
        batchMaxPoints: parseInt(process.env.TRACKING_BATCH_MAX_POINTS ?? '60', 10),
        maxPointAgeSeconds: parseInt(process.env.TRACKING_MAX_POINT_AGE_SECONDS ?? '300', 10),
    },
    audit: {
        collectorUrl: process.env.AUDIT_COLLECTOR_URL ?? '',
        clientKey: process.env.AUDIT_CLIENT_KEY ?? '',
        clientSecret: process.env.AUDIT_CLIENT_SECRET ?? '',
    },
});
//# sourceMappingURL=configuration.js.map