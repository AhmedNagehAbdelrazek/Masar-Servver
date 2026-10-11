import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
export declare const SEAT_LOCK_TTL = 300;
export declare function seatLockKey(tripId: string, seatNumber: number | string): string;
export declare class SeatLockService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    checkSeatLock(tripId: string, seatNumber: number | string): Promise<{
        locked: boolean;
        passengerId: string | null;
        expiresAt: string | null;
    }>;
    private acquireSeatLock;
    releaseSeatLock(tripId: string, seatNumber: number | string): Promise<boolean>;
    lockSeats(tripId: string, seatNumbers: (number | string)[], passengerId: string): Promise<{
        lock_ids: string[];
        seat_numbers: number[];
        expires_in: number;
        message: string;
    }>;
    lockSeat(tripId: string, seatNumber: number | string, passengerId: string): Promise<{
        lock_id: string;
        seat_number: number;
        expires_in: number;
        message: string;
    }>;
    releaseSeat(tripId: string, seatNumber: number | string, passengerId: string): Promise<{
        message: string;
    }>;
}
