import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  AgreePriceDto,
  DecideOfferDto,
  DriverOffersQuery,
  OfferIdParam,
} from './dto/ride-request.dto.js';
import { RideRequestsService } from './ride-requests.service.js';

// Express parity: Routes/offersRoutes.ts (passenger) + GET driver/offers.
@Controller()
export class OffersController {
  constructor(private readonly requests: RideRequestsService) {}

  @Put('offers/:offer_id')
  @Roles('passenger')
  decideOffer(
    @Param() params: OfferIdParam,
    @Body() dto: DecideOfferDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ offer: Record<string, unknown> }> {
    return this.requests
      .decideOffer(user?.id ?? '', params.offer_id, dto.action)
      .then((offer) => ({ offer }));
  }

  @Put('offers/:offer_id/price')
  @Roles('passenger')
  agreePrice(
    @Param() params: OfferIdParam,
    @Body() dto: AgreePriceDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ offer: Record<string, unknown> }> {
    return this.requests
      .agreeOfferPrice(user?.id ?? '', params.offer_id, dto.agreed_fare)
      .then((offer) => ({ offer }));
  }

  @Get('driver/offers')
  @Roles('driver')
  listMyOffers(
    @Query() query: DriverOffersQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.requests.listDriverOffers(user?.id ?? '', query);
  }
}
