import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { TripIdParam } from './dto/create-trip.dto.js';
import { TripsService } from './trips.service.js';
export declare class AdminTripController {
    private readonly trips;
    constructor(trips: TripsService);
    getAdminTripRoute(params: TripIdParam, user?: AuthUser): Promise<Record<string, unknown>>;
    getAdminTripActual(params: TripIdParam, user?: AuthUser): Promise<Record<string, unknown>>;
}
