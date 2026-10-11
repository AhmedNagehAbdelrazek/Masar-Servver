import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RecentSearchService } from '../subscriptions/recent-search.service.js';
import {
  CreateTripDto,
  TripIdParam,
  TripPassengersQuery,
  TripSearchQuery,
} from './dto/create-trip.dto.js';
import { IsUUID } from 'class-validator';
import { CancelTripDto, UpdateTripDto } from './dto/create-trip.dto.js';
import { ReplaceStopsDto, SetPickupStatusDto, TripPickupParams } from './dto/route.dto.js';
import { AttachOfferBody } from '../ride-requests/dto/ride-request.dto.js';
import { RideRequestsService } from '../ride-requests/ride-requests.service.js';
import { TripsService } from './trips.service.js';

class AttachOfferParams {
  @IsUUID()
  trip_id!: string;

  @IsUUID()
  offer_id!: string;
}

// Express parity: Routes/tripRoutes.ts mounted at /api/trips.
// Wave 5.2 adds lifecycle (start/complete/update/cancel-penalty). Stops,
// route, pickups and offer-attach land in later sub-waves.
@Controller('trips')
export class TripsController {
  constructor(
    private readonly trips: TripsService,
    private readonly recentSearch: RecentSearchService,
    private readonly offers: RideRequestsService,
  ) {}

  @Post()
  @HttpCode(201)
  @Roles('driver')
  createTrip(
    @Body() dto: CreateTripDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    trip_id: string;
    status: string;
    total_seats: number;
    available_seats: number;
    estimated_earnings: number;
    total_profit: number;
    message: string;
  }> {
    return this.trips.createTrip(user?.id ?? '', dto);
  }

  @Get('driver/my-trips')
  @Roles('driver')
  getDriverTrips(
    @Query() query: { status?: string },
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trips: Record<string, unknown>[] }> {
    return this.trips
      .getDriverTrips(user?.id ?? '', query.status ?? null)
      .then((trips) => ({ trips }));
  }

  @Get('search/available')
  searchAvailableTrips(
    @Query() query: TripSearchQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trips: Record<string, unknown>[]; returning_trips: Record<string, unknown>[] }> {
    return this.trips
      .getAvailableTrips({
        originCity: query.origin_city,
        destinationCity: query.destination_city,
        date: query.date,
        returnDate: query.return_date,
        genderPreference: query.gender_preference ?? null,
        timeFrom: query.time_from,
        timeTo: query.time_to,
        vehicleType: query.vehicle_type,
        seats: query.seats,
      })
      .then(async ({ trips, returningTrips }) => {
        const serializeWithDriver = (arr: Record<string, unknown>[]): Record<string, unknown>[] =>
          arr.map((t) => {
            const driver = t.driver as Record<string, unknown> | null;
            const vehicle = t.vehicle as Record<string, unknown> | null;
            return {
              ...t,
              driver: driver
                ? {
                    id: driver.id,
                    full_name: (driver.fullName as string) ?? (driver.full_name as string),
                    rating: Number(driver.avgRating ?? driver.rating) || 0,
                    profile_picture_url: (driver.avatarUrl as string) ?? (driver.profile_picture_url as string) ?? null,
                    avatar_url: (driver.avatarUrl as string) ?? (driver.avatar_url as string) ?? null,
                    gender: (driver.gender as string) ?? null,
                  }
                : driver,
              vehicle: vehicle
                ? {
                    id: vehicle.id,
                    vehicle_type: (vehicle.vehicleType as string) ?? (vehicle.vehicle_type as string),
                    manufacturer: vehicle.manufacturer,
                    model: vehicle.model,
                    plate_number: (vehicle.plateNumber as string) ?? (vehicle.plate_number as string),
                    plateNumber: (vehicle.plateNumber as string) ?? (vehicle.plate_number as string),
                    color: vehicle.color,
                    seats: vehicle.seats,
                  }
                : vehicle,
            };
          });
        if (
          user?.role === 'passenger' &&
          query.origin_city &&
          query.destination_city
        ) {
          try {
            await this.recentSearch.recordSearch(user.id, query.origin_city, query.destination_city);
          } catch {
            // best-effort
          }
        }
        return { trips: serializeWithDriver(trips), returning_trips: serializeWithDriver(returningTrips) };
      });
  }

  @Get(':trip_id')
  getTripById(@Param() params: TripIdParam): Promise<Record<string, unknown>> {
    return this.trips.getTripById(params.trip_id);
  }

  @Get(':trip_id/options')
  getTripOptions(@Param() params: TripIdParam): Promise<Record<string, unknown>> {
    return this.trips.getTripOptions(params.trip_id);
  }

  @Get(':trip_id/seats')
  getTripSeats(@Param() params: TripIdParam): Promise<Record<string, unknown>> {
    return this.trips.getTripSeats(params.trip_id);
  }

  @Get(':trip_id/empty-seats')
  getTripEmptySeats(@Param() params: TripIdParam): Promise<Record<string, unknown>> {
    return this.trips.getTripSeats(params.trip_id);
  }

  @Get(':trip_id/attributes')
  getTripAttributes(@Param() params: TripIdParam): Promise<Record<string, unknown>> {
    return this.trips.getTripAttributes(params.trip_id);
  }

  @Post(':trip_id/start')
  @HttpCode(200)
  @Roles('driver')
  startTrip(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trip_id: string; status: string; message: string; tracking_link: string }> {
    return this.trips.startTrip(user?.id ?? '', params.trip_id);
  }

  @Post(':trip_id/complete')
  @HttpCode(200)
  @Roles('driver')
  completeTrip(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    trip_id: string;
    commission: number;
    plan_name: string | null;
    balance_after: number;
    is_in_debt: boolean;
  }> {
    return this.trips.completeTrip(user?.id ?? '', params.trip_id);
  }

  @Put(':trip_id')
  @Roles('driver')
  updateTrip(
    @Param() params: TripIdParam,
    @Body() dto: UpdateTripDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trip: Record<string, unknown> }> {
    return this.trips.updateTrip(user?.id ?? '', params.trip_id, dto);
  }

  @Post(':trip_id/cancel')
  @HttpCode(200)
  @Roles('driver')
  cancelTripWithPenalty(
    @Param() params: TripIdParam,
    @Body() dto: CancelTripDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    message: string;
    trip_id: string;
    status: string;
    penalty_id: string;
    penalty_type: string;
  }> {
    return this.trips.cancelTripWithPenalty(user?.id ?? '', params.trip_id, {
      reason: dto.reason,
      note: dto.note,
    });
  }

  @Delete(':trip_id')
  @Roles('driver')
  cancelTrip(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trip: { id: string; status: string; notified_passengers: number } }> {
    return this.trips.cancelTrip(user?.id ?? '', params.trip_id);
  }

  @Patch(':trip_id/stops')
  @Roles('driver')
  updateTripStops(
    @Param() params: TripIdParam,
    @Body() dto: ReplaceStopsDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ trip_id: string; stops: number; route_status: string }> {
    return this.trips.replaceTripStops(user?.id ?? '', params.trip_id, dto.stops);
  }

  @Get(':trip_id/route')
  @Roles('driver', 'admin')
  getTripRoute(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getTripRoute(user?.id ?? '', user?.role ?? '', params.trip_id);
  }

  @Get(':trip_id/route/actual')
  @Roles('driver', 'passenger')
  getTripActual(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getTripActual(user?.id ?? '', user?.role ?? '', params.trip_id);
  }

  @Post(':trip_id/offers/:offer_id/attach')
  @HttpCode(201)
  @Roles('driver')
  attachOfferToTrip(
    @Param() params: AttachOfferParams,
    @Body() dto: AttachOfferBody,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking: Record<string, unknown>; offer: Record<string, unknown> }> {
    return this.offers.attachOfferToTrip(user?.id ?? '', params.trip_id, params.offer_id, dto);
  }

  @Patch(':trip_id/pickups/:booking_id')
  @Roles('driver')
  setTripPickupStatus(
    @Param() params: TripPickupParams,
    @Body() dto: SetPickupStatusDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking_id: string; pickup_status: string }> {
    return this.trips.setPickupStatus(
      user?.id ?? '',
      params.trip_id,
      params.booking_id,
      dto.pickup_status,
    );
  }

  @Get(':trip_id/passengers')
  @Roles('driver')
  getTripPassengers(
    @Param() params: TripIdParam,
    @Query() query: TripPassengersQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getTripPassengers(user?.id ?? '', params.trip_id, {
      status: query.status,
    });
  }
}
