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
import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';
import { BookingMessagesParam, ChatHistoryQuery, TicketMessagesParam, } from './dto/chat-history.query.js';
let ChatController = class ChatController {
    chat;
    constructor(chat) {
        this.chat = chat;
    }
    getBookingMessages(params, query, user) {
        return this.chat.listBookingMessages({ id: user?.id ?? '', role: user?.role ?? '' }, {
            bookingId: params.bookingId,
            page: query.page,
            limit: query.limit,
            beforeId: query.before_id,
        });
    }
    getTicketMessages(params, query, user) {
        return this.chat.listSupportMessages({ id: user?.id ?? '', role: user?.role ?? '' }, {
            supportTicketId: params.ticketId,
            page: query.page,
            limit: query.limit,
            beforeId: query.before_id,
        });
    }
};
__decorate([
    Get('bookings/:bookingId/messages'),
    __param(0, Param()),
    __param(1, Query()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingMessagesParam,
        ChatHistoryQuery, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getBookingMessages", null);
__decorate([
    Get('tickets/:ticketId/messages'),
    __param(0, Param()),
    __param(1, Query()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TicketMessagesParam,
        ChatHistoryQuery, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getTicketMessages", null);
ChatController = __decorate([
    Controller('chat'),
    __metadata("design:paramtypes", [ChatService])
], ChatController);
export { ChatController };
//# sourceMappingURL=chat.controller.js.map