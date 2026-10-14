export interface MapsConfig {
    serverApiKey: string;
    regionCode: string;
    countryBias: string;
    timeoutMs: number;
    maxRetries: number;
    mock: boolean;
    routeCacheTtlSeconds: number;
    pickupMaxDistanceFromRouteM: number;
    detourMaxSeconds: number;
    pickupEditCutoffMinutes: number;
    maxTripStops: number;
    trackingIntervalSeconds: number;
    trackingBatchMaxPoints: number;
    trackingMaxPointAgeSeconds: number;
    proximityNearMeters: number;
    proximityArrivedMeters: number;
    actualPathSimplifyToleranceM: number;
}
export declare function getMapsConfig(): MapsConfig;
