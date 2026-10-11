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
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TripsService } from '../trips/trips.service.js';
import { BookingsService } from './bookings.service.js';
import { DelayService } from './delay.service.js';
import { BookingIdParam, CreateBookingDto, DelayListQuery, DriverBookingListQuery, EditPickupDto, PassengerBookingListQuery, ReportDelayDto, } from './dto/booking.dto.js';
let BookingsController = class BookingsController {
    bookings;
    delays;
    trips;
    constructor(bookings, delays, trips) {
        this.bookings = bookings;
        this.delays = delays;
        this.trips = trips;
    }
    listMyBookings(query, user) {
        return this.bookings.listForPassenger(user?.id ?? '', query);
    }
    createBooking(dto, user) {
        return this.bookings.createBooking(user?.id ?? '', dto).then((booking) => ({ booking }));
    }
    getBooking(bookingId, user) {
        return this.bookings.getForPassenger(user?.id ?? '', bookingId);
    }
    getDriverProfile(params, user) {
        return this.bookings.getDriverReveal(user?.id ?? '', user?.role ?? '', params.booking_id);
    }
    cancelBooking(bookingId, user) {
        return this.bookings.cancelBooking(user?.id ?? '', bookingId);
    }
    getBookingRoute(params, user) {
        return this.trips.getBookingRoute(user?.id ?? '', user?.role ?? '', params.booking_id);
    }
    editBookingPickup(params, dto, user) {
        return this.bookings.editPickup(user?.id ?? '', params.booking_id, dto);
    }
    reportDelay(params, dto, user) {
        return this.delays.reportDelay(user?.id ?? '', params.booking_id, dto);
    }
    listDelays(params, query, user) {
        return this.delays.listDelays(user?.id ?? '', params.booking_id, query);
    }
    getDriverBookings(query, user) {
        return this.bookings.listForDriver(user?.id ?? '', query);
    }
    getDriverBooking(bookingId, user) {
        return this.bookings.getForDriver(user?.id ?? '', bookingId);
    }
};
__decorate([
    Get('bookings'),
    Roles('passenger'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PassengerBookingListQuery, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "listMyBookings", null);
__decorate([
    Post('bookings'),
    HttpCode(201),
    Roles('passenger'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createBooking", null);
__decorate([
    Get('bookings/:booking_id'),
    Roles('passenger'),
    __param(0, Param('booking_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBooking", null);
__decorate([
    Get('bookings/:booking_id/driver-profile'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingIdParam, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getDriverProfile", null);
__decorate([
    Put('bookings/:booking_id/cancel'),
    Roles('passenger'),
    __param(0, Param('booking_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancelBooking", null);
__decorate([
    Get('bookings/:booking_id/route'),
    Roles('passenger', 'driver'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingIdParam, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBookingRoute", null);
__decorate([
    Patch('bookings/:booking_id/pickup'),
    Roles('passenger'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingIdParam,
        EditPickupDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "editBookingPickup", null);
__decorate([
    Post('bookings/:booking_id/delay'),
    HttpCode(201),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingIdParam,
        ReportDelayDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "reportDelay", null);
__decorate([
    Get('bookings/:booking_id/delays'),
    __param(0, Param()),
    __param(1, Query()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingIdParam,
        DelayListQuery, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "listDelays", null);
__decorate([
    Get('driver/bookings'),
    Roles('driver'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverBookingListQuery, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getDriverBookings", null);
__decorate([
    Get('driver/bookings/:booking_id'),
    Roles('driver'),
    __param(0, Param('booking_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getDriverBooking", null);
BookingsController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [BookingsService,
        DelayService,
        TripsService])
], BookingsController);
export { BookingsController };
//# sourceMappingURL=bookings.controller.js.map