import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { UnprocessableEntityException } from '@nestjs/common';
import { LockSeatDto } from './dto/create-trip.dto.js';
import { SeatLockService } from './seat-lock.service.js';

class SeatLockTripParam {
  @IsUUID()
  trip_id!: string;
}

class ReleaseSeatLockParam extends SeatLockTripParam {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  seat_number!: number;
}

// Express parity: Routes/seatLockRoutes.ts mounted at /api/trips (any
// authenticated user locks; tests use passengers). Exactly one of
// seat_number / seat_numbers is required (422 otherwise).
@Controller('trips')
export class SeatLockController {
  constructor(private readonly seatLocks: SeatLockService) {}

  @Post(':trip_id/seats/lock')
  @HttpCode(200)
  lockSeat(
    @Param() params: SeatLockTripParam,
    @Body() dto: LockSeatDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    const hasSingle = dto.seat_number !== undefined && dto.seat_number !== null;
    const hasMulti = dto.seat_numbers !== undefined && dto.seat_numbers !== null;
    if ((hasSingle && hasMulti) || (!hasSingle && !hasMulti)) {
      throw new UnprocessableEntityException({
        message: 'VALIDATION_FAILED',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'seat_number', message: 'PROVIDE_SEAT_NUMBER_OR_SEAT_NUMBERS_NOT_BOTH' }],
      });
    }
    if (hasMulti) {
      return this.seatLocks.lockSeats(
        params.trip_id,
        dto.seat_numbers as (number | string)[],
        user?.id ?? '',
      ) as unknown as Promise<Record<string, unknown>>;
    }
    return this.seatLocks.lockSeat(
      params.trip_id,
      dto.seat_number as number,
      user?.id ?? '',
    ) as unknown as Promise<Record<string, unknown>>;
  }

  @Delete(':trip_id/seats/lock/:seat_number')
  releaseSeat(
    @Param() params: ReleaseSeatLockParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.seatLocks.releaseSeat(params.trip_id, params.seat_number, user?.id ?? '');
  }
}
