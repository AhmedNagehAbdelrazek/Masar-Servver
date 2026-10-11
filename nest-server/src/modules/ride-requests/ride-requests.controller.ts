import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  CreateOfferDto,
  CreateRideRequestDto,
  ListRideRequestsQuery,
  RequestIdParam,
  UpdateRideRequestDto,
} from './dto/ride-request.dto.js';
import { RideRequestsService } from './ride-requests.service.js';

// Express parity: Routes/rideRequestRoutes.ts (all protect).
// NOTE: GET :id, GET :id/matches and GET :id/offers carry param validation
// WITHOUT the `validate` middleware in Express — plain-string params here so
// malformed ids fall through to service 404s.
@Controller('ride-requests')
export class RideRequestsController {
  constructor(private readonly requests: RideRequestsService) {}

  @Post()
  @HttpCode(201)
  @Roles('passenger')
  createRideRequest(
    @Body() dto: CreateRideRequestDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ ride_request: Record<string, unknown> }> {
    return this.requests
      .createRideRequest(user?.id ?? '', dto)
      .then((ride_request) => ({ ride_request }));
  }

  @Get()
  listRequests(
    @Query() query: ListRideRequestsQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.requests.listRequests(
      { id: user?.id ?? '', role: user?.role ?? '' },
      query,
    );
  }

  @Get(':request_id')
  getRequest(
    @Param('request_id') requestId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ ride_request: Record<string, unknown> }> {
    return this.requests.getRequest({ id: user?.id ?? '', role: user?.role ?? '' }, requestId);
  }

  @Get(':request_id/matches')
  @Roles('passenger')
  getMatches(
    @Param('request_id') requestId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ ride_request_id: string; matches: Record<string, unknown>[] }> {
    return this.requests.getMatches({ id: user?.id ?? '', role: user?.role ?? '' }, requestId);
  }

  @Put(':request_id')
  @Roles('passenger')
  updateRideRequest(
    @Param() params: RequestIdParam,
    @Body() dto: UpdateRideRequestDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ ride_request: Record<string, unknown> }> {
    return this.requests
      .updateRideRequest(user?.id ?? '', params.request_id, dto)
      .then((result) => result as { ride_request: Record<string, unknown> });
  }

  @Post(':request_id/offers')
  @HttpCode(201)
  @Roles('driver')
  submitOffer(
    @Param() params: RequestIdParam,
    @Body() dto: CreateOfferDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ offer: Record<string, unknown> }> {
    return this.requests
      .submitOffer(user?.id ?? '', params.request_id, dto)
      .then((offer) => ({ offer }));
  }

  @Get(':request_id/offers')
  listOffers(
    @Param('request_id') requestId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[] }> {
    return this.requests.listOffersForRequest(user?.id ?? '', requestId);
  }
}
