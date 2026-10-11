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
var InAppChannel_1;
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../../realtime/realtime.gateway.js';
let InAppChannel = InAppChannel_1 = class InAppChannel {
    prisma;
    realtime;
    logger = new Logger(InAppChannel_1.name);
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async send(user, message, data = {}) {
        if (!user?.id)
            return null;
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    userId: user.id,
                    type: message.type,
                    title: message.title,
                    body: message.body,
                    data: data,
                    sentVia: ['in_app'],
                },
            });
            this.realtime.emitToUser(user.id, 'notification:new', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                reference_id: null,
                reference_type: null,
                created_at: notification.createdAt.toISOString(),
                timestamp: Date.now(),
            });
            const unreadCount = await this.prisma.notification.count({
                where: { userId: user.id, isRead: false },
            });
            this.realtime.emitToUser(user.id, 'notification:count', {
                unread_count: unreadCount,
                timestamp: Date.now(),
            });
            return { id: notification.id };
        }
        catch (err) {
            this.logger.warn(`[notification] in_app failed: ${err.message}`);
            return null;
        }
    }
};
InAppChannel = InAppChannel_1 = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => RealtimeGateway))),
    __metadata("design:paramtypes", [PrismaService,
        RealtimeGateway])
], InAppChannel);
export { InAppChannel };
//# sourceMappingURL=in-app.channel.js.map