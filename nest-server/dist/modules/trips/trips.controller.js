var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, forwardRef, Get, HttpCode, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RecentSearchService } from '../subscriptions/recent-search.service.js';
import { CreateTripDto, TripIdParam, TripPassengersQuery, TripSearchQuery, } from './dto/create-trip.dto.js';
import { IsUUID } from 'class-validator';
import { CancelTripDto, UpdateTripDto } from './dto/create-trip.dto.js';
import { ReplaceStopsDto, SetPickupStatusDto, TripPickupParams } from './dto/route.dto.js';
import { AttachOfferBody } from '../ride-requests/dto/ride-request.dto.js';
import { RideRequestsService } from '../ride-requests/ride-requests.service.js';
import { TripsService } from './trips.service.js';
class AttachOfferParams {
    trip_id;
    offer_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AttachOfferParams.prototype, "trip_id", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AttachOfferParams.prototype, "offer_id", void 0);
let TripsController = class TripsController {
    trips;
    recentSearch;
    offers;
    constructor(trips, recentSearch, offers) {
        this.trips = trips;
        this.recentSearch = recentSearch;
        this.offers = offers;
    }
    createTrip(dto, user) {
        return this.trips.createTrip(user?.id ?? '', dto);
    }
    getDriverTrips(query, user) {
        return this.trips
            .getDriverTrips(user?.id ?? '', query.status ?? null)
            .then((trips) => ({ trips }));
    }
    searchAvailableTrips(query, user) {
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
            const serializeWithDriver = (arr) => arr.map((t) => {
                const driver = t.driver;
                const vehicle = t.vehicle;
                return {
                    ...t,
                    driver: driver
                        ? {
                            id: driver.id,
                            full_name: driver.fullName ?? driver.full_name,
                            rating: Number(driver.avgRating ?? driver.rating) || 0,
                            profile_picture_url: driver.avatarUrl ?? driver.profile_picture_url ?? null,
                            avatar_url: driver.avatarUrl ?? driver.avatar_url ?? null,
                            gender: driver.gender ?? null,
                        }
                        : driver,
                    vehicle: vehicle
                        ? {
                            id: vehicle.id,
                            vehicle_type: vehicle.vehicleType ?? vehicle.vehicle_type,
                            manufacturer: vehicle.manufacturer,
                            model: vehicle.model,
                            plate_number: vehicle.plateNumber ?? vehicle.plate_number,
                            plateNumber: vehicle.plateNumber ?? vehicle.plate_number,
                            color: vehicle.color,
                            seats: vehicle.seats,
                        }
                        : vehicle,
                };
            });
            if (user?.role === 'passenger' &&
                query.origin_city &&
                query.destination_city) {
                try {
                    await this.recentSearch.recordSearch(user.id, query.origin_city, query.destination_city);
                }
                catch {
                }
            }
            return { trips: serializeWithDriver(trips), returning_trips: serializeWithDriver(returningTrips) };
        });
    }
    getTripById(params) {
        return this.trips.getTripById(params.trip_id);
    }
    getTripOptions(params) {
        return this.trips.getTripOptions(params.trip_id);
    }
    getTripSeats(params) {
        return this.trips.getTripSeats(params.trip_id);
    }
    getTripEmptySeats(params) {
        return this.trips.getTripSeats(params.trip_id);
    }
    getTripAttributes(params) {
        return this.trips.getTripAttributes(params.trip_id);
    }
    startTrip(params, user) {
        return this.trips.startTrip(user?.id ?? '', params.trip_id);
    }
    completeTrip(params, user) {
        return this.trips.completeTrip(user?.id ?? '', params.trip_id);
    }
    updateTrip(params, dto, user) {
        return this.trips.updateTrip(user?.id ?? '', params.trip_id, dto);
    }
    cancelTripWithPenalty(params, dto, user) {
        return this.trips.cancelTripWithPenalty(user?.id ?? '', params.trip_id, {
            reason: dto.reason,
            note: dto.note,
        });
    }
    cancelTrip(params, user) {
        return this.trips.cancelTrip(user?.id ?? '', params.trip_id);
    }
    updateTripStops(params, dto, user) {
        return this.trips.replaceTripStops(user?.id ?? '', params.trip_id, dto.stops);
    }
    getTripRoute(params, user) {
        return this.trips.getTripRoute(user?.id ?? '', user?.role ?? '', params.trip_id);
    }
    getTripActual(params, user) {
        return this.trips.getTripActual(user?.id ?? '', user?.role ?? '', params.trip_id);
    }
    attachOfferToTrip(params, dto, user) {
        return this.offers.attachOfferToTrip(user?.id ?? '', params.trip_id, params.offer_id, dto);
    }
    setTripPickupStatus(params, dto, user) {
        return this.trips.setPickupStatus(user?.id ?? '', params.trip_id, params.booking_id, dto.pickup_status);
    }
    getTripPassengers(params, query, user) {
        return this.trips.getTripPassengers(user?.id ?? '', params.trip_id, {
            status: query.status,
        });
    }
};
__decorate([
    Post(),
    HttpCode(201),
    Roles('driver'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTripDto, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "createTrip", null);
__decorate([
    Get('driver/my-trips'),
    Roles('driver'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getDriverTrips", null);
__decorate([
    Get('search/available'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripSearchQuery, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "searchAvailableTrips", null);
__decorate([
    Get(':trip_id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripById", null);
__decorate([
    Get(':trip_id/options'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripOptions", null);
__decorate([
    Get(':trip_id/seats'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripSeats", null);
__decorate([
    Get(':trip_id/empty-seats'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripEmptySeats", null);
__decorate([
    Get(':trip_id/attributes'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripAttributes", null);
__decorate([
    Post(':trip_id/start'),
    HttpCode(200),
    Roles('driver'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "startTrip", null);
__decorate([
    Post(':trip_id/complete'),
    HttpCode(200),
    Roles('driver'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "completeTrip", null);
__decorate([
    Put(':trip_id'),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam,
        UpdateTripDto, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "updateTrip", null);
__decorate([
    Post(':trip_id/cancel'),
    HttpCode(200),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam,
        CancelTripDto, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "cancelTripWithPenalty", null);
__decorate([
    Delete(':trip_id'),
    Roles('driver'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "cancelTrip", null);
__decorate([
    Patch(':trip_id/stops'),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam,
        ReplaceStopsDto, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "updateTripStops", null);
__decorate([
    Get(':trip_id/route'),
    Roles('driver', 'admin'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripRoute", null);
__decorate([
    Get(':trip_id/route/actual'),
    Roles('driver', 'passenger'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripActual", null);
__decorate([
    Post(':trip_id/offers/:offer_id/attach'),
    HttpCode(201),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AttachOfferParams,
        AttachOfferBody, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "attachOfferToTrip", null);
__decorate([
    Patch(':trip_id/pickups/:booking_id'),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripPickupParams,
        SetPickupStatusDto, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "setTripPickupStatus", null);
__decorate([
    Get(':trip_id/passengers'),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Query()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam,
        TripPassengersQuery, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTripPassengers", null);
TripsController = __decorate([
    Controller('trips'),
    __param(2, Inject(forwardRef(() => RideRequestsService))),
    __metadata("design:paramtypes", [TripsService,
        RecentSearchService,
        RideRequestsService])
], TripsController);
export { TripsController };
//# sourceMappingURL=trips.controller.js.map