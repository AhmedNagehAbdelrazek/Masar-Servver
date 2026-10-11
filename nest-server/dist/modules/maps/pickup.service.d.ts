import { PrismaService } from '../../prisma/prisma.service.js';
import { GeoService } from './geo.service.js';
import { RouteService } from './route.service.js';
export interface PickupCheck {
    accepted: boolean;
    distanceM: number;
    detourSeconds: number;
    reason: string | null;
    point: {
        lat: number;
        lng: number;
        label: string | null;
        pickupType: 'stop' | 'custom';
        pickupStopId: string | null;
    } | null;
}
export declare class PickupService {
    private readonly prisma;
    private readonly routes;
    private readonly geo;
    constructor(prisma: PrismaService, routes: RouteService, geo: GeoService);
    assertBookable(trip: {
        status: string;
    }): void;
    validatePickup(tripId: string, input: {
        pickup_type?: string;
        pickup_stop_id?: string | null;
        lat?: number | null;
        lng?: number | null;
        pickup_label?: string | null;
        label?: string | null;
    }): Promise<PickupCheck>;
}
