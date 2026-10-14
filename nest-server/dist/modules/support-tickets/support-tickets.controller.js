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
import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AddTicketMessageDto, CreateTicketDto, ListTicketsQuery, TicketIdParam, UpdateTicketDto, UpdateTicketStatusDto, } from './dto/support-ticket.dto.js';
import { SupportTicketsService } from './support-tickets.service.js';
let SupportTicketsController = class SupportTicketsController {
    tickets;
    constructor(tickets) {
        this.tickets = tickets;
    }
    createTicket(dto, user) {
        return this.tickets
            .createTicket({ id: user?.id ?? '', role: user?.role ?? '' }, dto)
            .then((support_ticket) => ({ support_ticket }));
    }
    listTickets(query, user) {
        return this.tickets.listTickets({ id: user?.id ?? '', role: user?.role ?? '' }, query);
    }
    getTicket(ticketId, user) {
        return this.tickets.getTicket({ id: user?.id ?? '', role: user?.role ?? '' }, ticketId);
    }
    updateTicket(params, dto, user) {
        return this.tickets
            .updateTicket(user?.id ?? '', params.ticket_id, dto)
            .then((support_ticket) => ({ support_ticket }));
    }
    updateStatus(params, dto, user) {
        return this.tickets
            .updateTicketStatus(user?.id ?? '', params.ticket_id, dto.status)
            .then((support_ticket) => ({ support_ticket }));
    }
    addMessage(params, dto, user) {
        return this.tickets
            .addMessage({ id: user?.id ?? '', role: user?.role ?? '' }, params.ticket_id, dto.message)
            .then((ticket_message) => ({ ticket_message }));
    }
};
__decorate([
    Post(),
    HttpCode(201),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTicketDto, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "createTicket", null);
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListTicketsQuery, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "listTickets", null);
__decorate([
    Get(':ticket_id'),
    __param(0, Param('ticket_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "getTicket", null);
__decorate([
    Put(':ticket_id'),
    Roles('admin', 'support', 'moderator'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TicketIdParam,
        UpdateTicketDto, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "updateTicket", null);
__decorate([
    Put(':ticket_id/status'),
    Roles('admin', 'support', 'moderator'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TicketIdParam,
        UpdateTicketStatusDto, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "updateStatus", null);
__decorate([
    Post(':ticket_id/messages'),
    HttpCode(201),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TicketIdParam,
        AddTicketMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SupportTicketsController.prototype, "addMessage", null);
SupportTicketsController = __decorate([
    Controller('support-tickets'),
    __metadata("design:paramtypes", [SupportTicketsService])
], SupportTicketsController);
export { SupportTicketsController };
//# sourceMappingURL=support-tickets.controller.js.map