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
import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UnprocessableEntityException } from '@nestjs/common';
import { LockSeatDto } from './dto/create-trip.dto.js';
import { SeatLockService } from './seat-lock.service.js';
class SeatLockTripParam {
    trip_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], SeatLockTripParam.prototype, "trip_id", void 0);
class ReleaseSeatLockParam extends SeatLockTripParam {
    seat_number;
}
__decorate([
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], ReleaseSeatLockParam.prototype, "seat_number", void 0);
let SeatLockController = class SeatLockController {
    seatLocks;
    constructor(seatLocks) {
        this.seatLocks = seatLocks;
    }
    lockSeat(params, dto, user) {
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
            return this.seatLocks.lockSeats(params.trip_id, dto.seat_numbers, user?.id ?? '');
        }
        return this.seatLocks.lockSeat(params.trip_id, dto.seat_number, user?.id ?? '');
    }
    releaseSeat(params, user) {
        return this.seatLocks.releaseSeat(params.trip_id, params.seat_number, user?.id ?? '');
    }
};
__decorate([
    Post(':trip_id/seats/lock'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SeatLockTripParam,
        LockSeatDto, Object]),
    __metadata("design:returntype", Promise)
], SeatLockController.prototype, "lockSeat", null);
__decorate([
    Delete(':trip_id/seats/lock/:seat_number'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReleaseSeatLockParam, Object]),
    __metadata("design:returntype", Promise)
], SeatLockController.prototype, "releaseSeat", null);
SeatLockController = __decorate([
    Controller('trips'),
    __metadata("design:paramtypes", [SeatLockService])
], SeatLockController);
export { SeatLockController };
//# sourceMappingURL=seat-lock.controller.js.map