var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, } from 'class-validator';
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export class CreateTicketDto {
    category;
    subject;
    description;
    priority;
    booking_id;
    trip_id;
}
__decorate([
    IsNotEmpty(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
__decorate([
    IsNotEmpty(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "subject", void 0);
__decorate([
    IsNotEmpty(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsIn([...TICKET_PRIORITIES]),
    __metadata("design:type", Object)
], CreateTicketDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "booking_id", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "trip_id", void 0);
export class ListTicketsQuery {
    status;
    priority;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn([...TICKET_STATUSES]),
    __metadata("design:type", Object)
], ListTicketsQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsIn([...TICKET_PRIORITIES]),
    __metadata("design:type", Object)
], ListTicketsQuery.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], ListTicketsQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], ListTicketsQuery.prototype, "limit", void 0);
export class TicketIdParam {
    ticket_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], TicketIdParam.prototype, "ticket_id", void 0);
export class UpdateTicketDto {
    assigned_to;
    priority;
    category;
    resolution_notes;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "assigned_to", void 0);
__decorate([
    IsOptional(),
    IsIn([...TICKET_PRIORITIES]),
    __metadata("design:type", Object)
], UpdateTicketDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(4000),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "resolution_notes", void 0);
export class UpdateTicketStatusDto {
    status;
}
__decorate([
    IsNotEmpty(),
    IsIn([...TICKET_STATUSES]),
    __metadata("design:type", Object)
], UpdateTicketStatusDto.prototype, "status", void 0);
export class AddTicketMessageDto {
    message;
}
__decorate([
    IsNotEmpty(),
    IsString(),
    MaxLength(4000),
    __metadata("design:type", String)
], AddTicketMessageDto.prototype, "message", void 0);
//# sourceMappingURL=support-ticket.dto.js.map