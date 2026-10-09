declare const _default: () => {
    port: number;
    nodeEnv: string;
    appLocale: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiry: string;
        refreshExpiry: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    maps: {
        serverKey: string;
        mock: boolean;
        regionCode: string;
        timeoutMs: number;
        routeCacheTtlSeconds: number;
    };
    tracking: {
        intervalSeconds: number;
        batchMaxPoints: number;
        maxPointAgeSeconds: number;
    };
    audit: {
        collectorUrl: string;
        clientKey: string;
        clientSecret: string;
    };
};
export default _default;
