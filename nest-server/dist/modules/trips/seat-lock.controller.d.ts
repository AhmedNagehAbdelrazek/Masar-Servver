import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { LockSeatDto } from './dto/create-trip.dto.js';
import { SeatLockService } from './seat-lock.service.js';
declare class SeatLockTripParam {
    trip_id: string;
}
declare class ReleaseSeatLockParam extends SeatLockTripParam {
    seat_number: number;
}
export declare class SeatLockController {
    private readonly seatLocks;
    constructor(seatLocks: SeatLockService);
    lockSeat(params: SeatLockTripParam, dto: LockSeatDto, user?: AuthUser): Promise<Record<string, unknown>>;
    releaseSeat(params: ReleaseSeatLockParam, user?: AuthUser): Promise<{
        message: string;
    }>;
}
export {};
