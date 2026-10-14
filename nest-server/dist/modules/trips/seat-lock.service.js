var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SeatLockService_1;
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
function validationError(message) {
    return new UnprocessableEntityException({ message, code: 'VALIDATION_ERROR' });
}
export const SEAT_LOCK_TTL = 300;
export function seatLockKey(tripId, seatNumber) {
    return `seat_lock:${tripId}:${seatNumber}`;
}
let SeatLockService = SeatLockService_1 = class SeatLockService {
    prisma;
    redis;
    logger = new Logger(SeatLockService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async checkSeatLock(tripId, seatNumber) {
        try {
            const raw = await this.redis.getKey(seatLockKey(tripId, seatNumber));
            if (!raw)
                return { locked: false, passengerId: null, expiresAt: null };
            const info = JSON.parse(raw);
            return { locked: true, passengerId: info.passenger_id ?? null, expiresAt: info.expires_at ?? null };
        }
        catch {
            return { locked: false, passengerId: null, expiresAt: null };
        }
    }
    async acquireSeatLock(tripId, seatNumber, passengerId) {
        const key = seatLockKey(tripId, seatNumber);
        const payload = JSON.stringify({
            passenger_id: passengerId,
            locked_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + SEAT_LOCK_TTL * 1000).toISOString(),
        });
        try {
            return await this.redis.setKeyNx(key, payload, SEAT_LOCK_TTL);
        }
        catch (err) {
            this.logger.warn(`seat lock acquire failed: ${err.message}`);
            return false;
        }
    }
    async releaseSeatLock(tripId, seatNumber) {
        return (await this.redis.deleteKey(seatLockKey(tripId, seatNumber))) > 0;
    }
    async lockSeats(tripId, seatNumbers, passengerId) {
        const unique = [...new Set(seatNumbers.map((n) => Number(n)))];
        if (unique.some((n) => !Number.isInteger(n) || n < 1)) {
            throw validationError('SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS');
        }
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
        if (trip.status !== 'published') {
            throw validationError('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
        }
        const seats = await this.prisma.tripSeat.findMany({ where: { tripId } });
        const byNumber = new Map(seats.map((s) => [s.seatNumber, s]));
        for (const n of unique) {
            const seat = byNumber.get(n);
            if (!seat)
                throw new NotFoundException({ message: 'SEAT_NOT_FOUND', code: 'SEAT_NOT_FOUND' });
            if (seat.seatType !== 'available') {
                throw validationError('SEAT_IS_NOT_AVAILABLE_FOR_BOOKING');
            }
            const lock = await this.checkSeatLock(tripId, n);
            if (lock.locked && lock.passengerId !== passengerId) {
                throw new ConflictException({
                    message: 'SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER',
                    code: 'SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER',
                });
            }
        }
        const acquired = [];
        for (const n of unique) {
            const lock = await this.checkSeatLock(tripId, n);
            if (lock.locked && lock.passengerId === passengerId) {
                acquired.push(n);
                continue;
            }
            const ok = await this.acquireSeatLock(tripId, n, passengerId);
            if (!ok) {
                for (const a of acquired) {
                    try {
                        await this.releaseSeatLock(tripId, a);
                    }
                    catch {
                    }
                }
                throw new ConflictException({
                    message: 'COULD_NOT_ACQUIRE_SEAT_LOCK',
                    code: 'COULD_NOT_ACQUIRE_SEAT_LOCK',
                });
            }
            acquired.push(n);
        }
        return {
            lock_ids: acquired.map((n) => `${tripId}:${n}`),
            seat_numbers: acquired,
            expires_in: SEAT_LOCK_TTL,
            message: 'SEATS_LOCKED_FIVE_MINUTES',
        };
    }
    async lockSeat(tripId, seatNumber, passengerId) {
        const result = await this.lockSeats(tripId, [seatNumber], passengerId);
        return {
            lock_id: result.lock_ids[0],
            seat_number: result.seat_numbers[0],
            expires_in: result.expires_in,
            message: 'SEAT_LOCKED_FIVE_MINUTES',
        };
    }
    async releaseSeat(tripId, seatNumber, passengerId) {
        const lock = await this.checkSeatLock(tripId, seatNumber);
        if (!lock.locked) {
            throw new NotFoundException({
                message: 'SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST',
                code: 'SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST',
            });
        }
        if (lock.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'CANNOT_RELEASE_LOCK_HELD_BY_ANOTHER_PASSENGER',
                code: 'CANNOT_RELEASE_LOCK_HELD_BY_ANOTHER_PASSENGER',
            });
        }
        const deleted = await this.releaseSeatLock(tripId, seatNumber);
        if (!deleted) {
            throw new NotFoundException({
                message: 'SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST',
                code: 'SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST',
            });
        }
        return { message: 'SEAT_LOCK_RELEASED' };
    }
};
SeatLockService = SeatLockService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RedisService])
], SeatLockService);
export { SeatLockService };
//# sourceMappingURL=seat-lock.service.js.map