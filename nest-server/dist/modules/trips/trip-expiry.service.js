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
var TripExpiryService_1;
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { SeatLockService } from './seat-lock.service.js';
import { TRIP_DURATION_HOURS } from './trip.constants.js';
import { TripsService as TripsServiceToken } from './trips.service.js';
const STARTED_STATUSES = ['in_progress', 'ongoing'];
const UNOPERATED_STATUSES = ['published', 'full'];
let TripExpiryService = TripExpiryService_1 = class TripExpiryService {
    prisma;
    trips;
    seatLocks;
    notifications;
    home;
    logger = new Logger(TripExpiryService_1.name);
    constructor(prisma, trips, seatLocks, notifications, home) {
        this.prisma = prisma;
        this.trips = trips;
        this.seatLocks = seatLocks;
        this.notifications = notifications;
        this.home = home;
    }
    unoperatedCutoff(now) {
        return now;
    }
    lifecycleCutoff(now) {
        return new Date(now.getTime() - TRIP_DURATION_HOURS * 3600 * 1000);
    }
    async expireUnoperatedTrip(tripId) {
        await this.prisma.trip.update({ where: { id: tripId }, data: { status: 'cancelled' } });
        const updated = await this.prisma.booking.updateMany({
            where: { tripId, status: { in: ['confirmed', 'pending'] } },
            data: { status: 'no_show' },
        });
        const seats = await this.prisma.tripSeat.findMany({
            where: { tripId },
            select: { seatNumber: true },
        });
        for (const s of seats) {
            try {
                await this.seatLocks.releaseSeatLock(tripId, s.seatNumber);
            }
            catch {
            }
        }
        try {
            await this.notifications.notifyConfirmedPassengers([tripId], 'TRIP_CANCELLED', {
                data: { trip_id: tripId },
            });
        }
        catch {
        }
        try {
            await this.home.invalidateHomeForTrip(tripId, '');
        }
        catch {
        }
        return updated.count;
    }
    async closeOutStaleTrip(trip, result) {
        try {
            if (STARTED_STATUSES.includes(trip.status)) {
                await this.trips.completeTrip(trip.driverId, trip.id);
                result.autoCompleted.push(trip.id);
            }
            else {
                result.noShowBookings += await this.expireUnoperatedTrip(trip.id);
                result.expiredUnoperated.push(trip.id);
            }
        }
        catch (err) {
            result.errors.push({ tripId: trip.id, message: err.message });
        }
    }
    async refreshStaleTrips(tripIds) {
        const result = {
            autoCompleted: [],
            expiredUnoperated: [],
            noShowBookings: 0,
            errors: [],
            touched: 0,
        };
        try {
            const now = new Date();
            const scoped = Array.isArray(tripIds) ? tripIds.filter((id) => typeof id === 'string') : null;
            const trips = await this.prisma.trip.findMany({
                where: {
                    isRecurring: false,
                    ...(scoped ? { id: { in: scoped } } : {}),
                    OR: [
                        { status: { in: [...UNOPERATED_STATUSES] }, departureTime: { lte: this.unoperatedCutoff(now) } },
                        { status: { in: [...STARTED_STATUSES] }, departureTime: { lte: this.lifecycleCutoff(now) } },
                    ],
                },
                select: { id: true, driverId: true, status: true },
            });
            for (const trip of trips) {
                await this.closeOutStaleTrip(trip, result);
            }
            result.touched = result.autoCompleted.length + result.expiredUnoperated.length;
            return result;
        }
        catch (err) {
            result.errors.push({ tripId: null, message: err.message });
            return result;
        }
    }
};
TripExpiryService = TripExpiryService_1 = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => TripsServiceToken))),
    __metadata("design:paramtypes", [PrismaService, Function, SeatLockService,
        NotificationsService,
        HomeService])
], TripExpiryService);
export { TripExpiryService };
//# sourceMappingURL=trip-expiry.service.js.map