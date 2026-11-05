import { redis } from '../config/redis';

export const SEAT_LOCK_PREFIX: string = 'seat_lock:';
export const SEAT_LOCK_TTL: number = 300; // 5 minutes

export interface SeatLockData {
  passenger_id: string;
  locked_at: number;
  expires_at: number;
}

export interface AcquireSeatLockResult {
  locked: boolean;
  expiresAt: Date | null;
}

export interface CheckSeatLockResult {
  locked: boolean;
  passengerId: string | null;
  expiresAt: Date | null;
}

/**
 * Generate Redis key for seat lock
 */
export const getSeatLockKey = (tripId: string, seatNumber: number | string): string => `${SEAT_LOCK_PREFIX}${tripId}:${seatNumber}`;

/**
 * Acquire a seat lock for a passenger
 */
export const acquireSeatLock = async (tripId: string, seatNumber: number | string, passengerId: string): Promise<AcquireSeatLockResult> => {
  const key: string = getSeatLockKey(tripId, seatNumber);
  const now: number = Date.now();
  const expiresAt: Date = new Date(now + SEAT_LOCK_TTL * 1000);

  const lockData: string = JSON.stringify({
    passenger_id: passengerId,
    locked_at: now,
    expires_at: expiresAt.getTime(),
  } as SeatLockData);

  // SETNX with TTL - atomic operation
  const result: unknown = await (redis as unknown as { set: (...args: unknown[]) => Promise<unknown> }).set(key, lockData, 'EX', SEAT_LOCK_TTL, 'NX');

  if (result === 'OK') {
    return { locked: true, expiresAt };
  }

  // Lock exists - check if it's expired (shouldn't happen with TTL, but safety check)
  const existing: string | null = await redis.get(key);
  if (!existing) {
    // Lock expired between NX and GET - retry once
    const retry: unknown = await (redis as unknown as { set: (...args: unknown[]) => Promise<unknown> }).set(key, lockData, 'EX', SEAT_LOCK_TTL, 'NX');
    if (retry === 'OK') {
      return { locked: true, expiresAt };
    }
  }

  return { locked: false, expiresAt: null };
};

/**
 * Check if a seat is currently locked
 */
export const checkSeatLock = async (tripId: string, seatNumber: number | string): Promise<CheckSeatLockResult> => {
  const key: string = getSeatLockKey(tripId, seatNumber);
  const data: string | null = await redis.get(key);

  if (!data) {
    return { locked: false, passengerId: null, expiresAt: null };
  }

  try {
    const parsed = JSON.parse(data) as SeatLockData;
    return {
      locked: true,
      passengerId: parsed.passenger_id,
      expiresAt: new Date(parsed.expires_at),
    };
  } catch (_err: unknown) {
    return { locked: false, passengerId: null, expiresAt: null };
  }
};

/**
 * Release a seat lock
 */
export const releaseSeatLock = async (tripId: string, seatNumber: number | string): Promise<boolean> => {
  const key: string = getSeatLockKey(tripId, seatNumber);
  const result: number = await redis.del(key);
  return result > 0;
};

/**
 * Extend a seat lock TTL
 */
export const extendSeatLock = async (tripId: string, seatNumber: number | string): Promise<boolean> => {
  const key: string = getSeatLockKey(tripId, seatNumber);
  const result: number = await redis.expire(key, SEAT_LOCK_TTL);
  return result === 1;
};

const seatLock = {
  acquireSeatLock,
  checkSeatLock,
  releaseSeatLock,
  extendSeatLock,
  getSeatLockKey,
  SEAT_LOCK_TTL,
};
export default seatLock;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = {
    acquireSeatLock,
    checkSeatLock,
    releaseSeatLock,
    extendSeatLock,
    getSeatLockKey,
    SEAT_LOCK_TTL,
  };
  // @ts-ignore
  module.exports.acquireSeatLock = acquireSeatLock;
  // @ts-ignore
  module.exports.checkSeatLock = checkSeatLock;
  // @ts-ignore
  module.exports.releaseSeatLock = releaseSeatLock;
  // @ts-ignore
  module.exports.extendSeatLock = extendSeatLock;
  // @ts-ignore
  module.exports.getSeatLockKey = getSeatLockKey;
  // @ts-ignore
  module.exports.SEAT_LOCK_TTL = SEAT_LOCK_TTL;
  // @ts-ignore
  module.exports.default = seatLock;
}
