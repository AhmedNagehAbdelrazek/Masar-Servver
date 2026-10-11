export type LatLng = [number, number];
export declare class GeoService {
    haversineM(a: LatLng, b: LatLng): number;
    haversineKm(a: LatLng, b: LatLng): number;
    decode(encoded: string): LatLng[];
    encode(points: LatLng[]): string;
    private segDistM;
    distanceFromRouteM(point: LatLng, route: LatLng[]): number;
    alongRouteM(point: LatLng, route: LatLng[]): number;
    simplify(points: LatLng[], toleranceM: number): LatLng[];
}
