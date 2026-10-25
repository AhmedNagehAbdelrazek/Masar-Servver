import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AcceptRideRequestBody, CreateOfferDto, CreateRideRequestDto, ListRideRequestsQuery, RequestIdParam, UpdateRideRequestDto } from './dto/ride-request.dto.js';
import { RideRequestsService } from './ride-requests.service.js';
export declare class RideRequestsController {
    private readonly requests;
    constructor(requests: RideRequestsService);
    createRideRequest(dto: CreateRideRequestDto, user?: AuthUser): Promise<{
        ride_request: Record<string, unknown>;
    }>;
    listRequests(query: ListRideRequestsQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getRequest(requestId: string, user?: AuthUser): Promise<{
        ride_request: Record<string, unknown>;
    }>;
    getMatches(requestId: string, user?: AuthUser): Promise<{
        ride_request_id: string;
        matches: Record<string, unknown>[];
    }>;
    updateRideRequest(params: RequestIdParam, dto: UpdateRideRequestDto, user?: AuthUser): Promise<{
        ride_request: Record<string, unknown>;
    }>;
    submitOffer(params: RequestIdParam, dto: CreateOfferDto, user?: AuthUser): Promise<{
        offer: Record<string, unknown>;
    }>;
    listOffers(requestId: string, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
    }>;
    acceptRideRequest(params: RequestIdParam, dto: AcceptRideRequestBody, user?: AuthUser): Promise<{
        trip: Record<string, unknown>;
        booking: Record<string, unknown>;
        offer: Record<string, unknown>;
    }>;
}
