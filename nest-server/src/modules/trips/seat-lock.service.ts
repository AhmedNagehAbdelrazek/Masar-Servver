import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';

function validationError(message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ message, code: 'VALIDATION_ERROR' });
}

// Port of Main Server/Services/seatLockService.ts + utils/seatLock.ts.
// Redis key seat_lock:{tripId}:{seatNumber} = JSON {passenger_id, locked_at,
// expires_at}, EX 300 NX. All-or-nothing multi-lock with rollback.
export const SEAT_LOCK_TTL = 300;

export function seatLockKey(tripId: string, seatNumber: number | string): string {
  return `seat_lock:${tripId}:${seatNumber}`;
}

interface LockInfo {
  passenger_id: string;
  locked_at: string;
  expires_at: string;
}

@Injectable()
export class SeatLockService {
  private readonly logger = new Logger(SeatLockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkSeatLock(
    tripId: string,
    seatNumber: number | string,
  ): Promise<{ locked: boolean; passengerId: string | null; expiresAt: string | null }> {
    try {
      const raw = await this.redis.getKey(seatLockKey(tripId, seatNumber));
      if (!raw) return { locked: false, passengerId: null, expiresAt: null };
      const info = JSON.parse(raw) as LockInfo;
      return { locked: true, passengerId: info.passenger_id ?? null, expiresAt: info.expires_at ?? null };
    } catch {
      return { locked: false, passengerId: null, expiresAt: null };
    }
  }

  private async acquireSeatLock(
    tripId: string,
    seatNumber: number | string,
    passengerId: string,
  ): Promise<boolean> {
    const key = seatLockKey(tripId, seatNumber);
    const payload = JSON.stringify({
      passenger_id: passengerId,
      locked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SEAT_LOCK_TTL * 1000).toISOString(),
    });
    try {
      return await this.redis.setKeyNx(key, payload, SEAT_LOCK_TTL);
    } catch (err) {
      this.logger.warn(`seat lock acquire failed: ${(err as Error).message}`);
      return false;
    }
  }

  async releaseSeatLock(tripId: string, seatNumber: number | string): Promise<boolean> {
    return (await this.redis.deleteKey(seatLockKey(tripId, seatNumber))) > 0;
  }

  async lockSeats(
    tripId: string,
    seatNumbers: (number | string)[],
    passengerId: string,
  ): Promise<{ lock_ids: string[]; seat_numbers: number[]; expires_in: number; message: string }> {
    const unique = [...new Set(seatNumbers.map((n) => Number(n)))];
    if (unique.some((n) => !Number.isInteger(n) || n < 1)) {
      throw validationError('SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS');
    }
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.status !== 'published') {
      throw validationError('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
    }
    const seats = await this.prisma.tripSeat.findMany({ where: { tripId } });
    const byNumber = new Map(seats.map((s) => [s.seatNumber, s]));
    for (const n of unique) {
      const seat = byNumber.get(n);
      if (!seat) throw new NotFoundException({ message: 'SEAT_NOT_FOUND', code: 'SEAT_NOT_FOUND' });
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
    const acquired: number[] = [];
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
          } catch {
            // best-effort rollback
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

  async lockSeat(
    tripId: string,
    seatNumber: number | string,
    passengerId: string,
  ): Promise<{ lock_id: string; seat_number: number; expires_in: number; message: string }> {
    const result = await this.lockSeats(tripId, [seatNumber], passengerId);
    return {
      lock_id: result.lock_ids[0] as string,
      seat_number: result.seat_numbers[0] as number,
      expires_in: result.expires_in,
      message: 'SEAT_LOCKED_FIVE_MINUTES',
    };
  }

  async releaseSeat(
    tripId: string,
    seatNumber: number | string,
    passengerId: string,
  ): Promise<{ message: string }> {
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
}
