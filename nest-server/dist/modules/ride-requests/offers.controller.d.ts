import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AgreePriceDto, DecideOfferDto, DriverOffersQuery, OfferIdParam } from './dto/ride-request.dto.js';
import { RideRequestsService } from './ride-requests.service.js';
export declare class OffersController {
    private readonly requests;
    constructor(requests: RideRequestsService);
    decideOffer(params: OfferIdParam, dto: DecideOfferDto, user?: AuthUser): Promise<{
        offer: Record<string, unknown>;
    }>;
    agreePrice(params: OfferIdParam, dto: AgreePriceDto, user?: AuthUser): Promise<{
        offer: Record<string, unknown>;
    }>;
    listMyOffers(query: DriverOffersQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
