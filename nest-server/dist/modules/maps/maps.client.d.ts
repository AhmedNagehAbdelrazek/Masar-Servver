export interface RoutePoint {
    lat: number;
    lng: number;
}
export interface ComputedRoute {
    polyline: string;
    distanceM: number;
    durationS: number;
    cached: boolean;
}
declare const MOCK_CORRIDOR: RoutePoint[];
export declare class MapsClient {
    private readonly logger;
    readonly fetchCalls: {
        routes: number;
        geocode: number;
    };
    private get mock();
    private get timeoutMs();
    private get maxRetries();
    private sleep;
    private fetchJson;
    routeHash(points: RoutePoint[]): string;
    computeRoutes({ origin, destination, intermediates, languageCode, }: {
        origin: RoutePoint;
        destination: RoutePoint;
        intermediates?: RoutePoint[];
        languageCode?: string;
    }): Promise<ComputedRoute>;
    reverseGeocode({ lat, lng, languageCode, }: {
        lat: number;
        lng: number;
        languageCode?: string;
    }): Promise<{
        city: string;
        area: string;
        label: string;
    }>;
}
export { MOCK_CORRIDOR };
