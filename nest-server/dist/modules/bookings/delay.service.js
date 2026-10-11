var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DelayService_1;
import { ForbiddenException, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
function serializeDelay(event) {
    return {
        id: event.id,
        booking_id: event.bookingId,
        party: event.party,
        delay_minutes: event.delayMinutes,
        reason: event.reason,
        reported_by: event.reportedBy,
        created_at: event.createdAt,
    };
}
let DelayService = DelayService_1 = class DelayService {
    prisma;
    notifications;
    logger = new Logger(DelayService_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async loadBookingForUser(userId, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { trip: { select: { driverId: true } } },
        });
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        const trip = booking.trip;
        if (booking.passengerId !== userId && (!trip || trip.driverId !== userId)) {
            throw new ForbiddenException({
                message: 'YOU_ARE_NOT_PART_OF_THIS_BOOKING',
                code: 'FORBIDDEN',
            });
        }
        return { id: booking.id, passengerId: booking.passengerId, tripId: booking.tripId, trip };
    }
    async reportDelay(userId, bookingId, { party, delay_minutes, reason }) {
        const booking = await this.loadBookingForUser(userId, bookingId);
        const isPassenger = booking.passengerId === userId;
        const isDriver = booking.trip !== null && booking.trip.driverId === userId;
        if (party !== 'driver' && party !== 'passenger') {
            throw new UnprocessableEntityException({
                message: 'PARTY_MUST_BE_DRIVER_OR_PASSENGER',
                code: 'VALIDATION_ERROR',
            });
        }
        if (party === 'passenger' && !isPassenger) {
            throw new ForbiddenException({
                message: 'ONLY_THE_BOOKING_PASSENGER_CAN_REPORT_A_PASSENGER_DELAY',
                code: 'FORBIDDEN',
            });
        }
        if (party === 'driver' && !isDriver) {
            throw new ForbiddenException({
                message: 'ONLY_THE_TRIP_DRIVER_CAN_REPORT_A_DRIVER_DELAY',
                code: 'FORBIDDEN',
            });
        }
        const event = await this.prisma.delayEvent.create({
            data: {
                bookingId,
                party: party,
                delayMinutes: delay_minutes,
                reason: reason ?? null,
                reportedBy: userId,
            },
        });
        try {
            const counterpartyId = party === 'driver' ? booking.passengerId : (booking.trip?.driverId ?? null);
            if (counterpartyId) {
                const counterparty = await this.prisma.user.findUnique({ where: { id: counterpartyId } });
                if (counterparty) {
                    await this.notifications.sendToUser(counterparty, 'DELAY_REPORTED', {
                        vars: { delay_minutes: String(delay_minutes), reason: reason ?? 'Not specified.' },
                        data: { trip_id: booking.tripId, booking_id: bookingId },
                    });
                }
            }
        }
        catch (err) {
            this.logger.warn(`delay notify failed: ${err.message}`);
        }
        return { delay_event: serializeDelay(event) };
    }
    async listDelays(userId, bookingId, filters = {}) {
        await this.loadBookingForUser(userId, bookingId);
        const { page, limit, offset } = parsePagination(filters);
        const [rows, count] = await Promise.all([
            this.prisma.delayEvent.findMany({
                where: {
                    bookingId,
                    ...(filters.party ? { party: filters.party } : {}),
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.delayEvent.count({
                where: {
                    bookingId,
                    ...(filters.party ? { party: filters.party } : {}),
                },
            }),
        ]);
        return {
            data: rows.map((r) => serializeDelay(r)),
            pagination: buildPagination(count, page, limit),
        };
    }
};
DelayService = DelayService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], DelayService);
export { DelayService };
//# sourceMappingURL=delay.service.js.map