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
var NotificationsService_1;
import { ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { InAppChannel } from './channels/in-app.channel.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { interpolate, TEMPLATES } from './templates.js';
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    realtime;
    sms;
    push;
    inApp;
    logger = new Logger(NotificationsService_1.name);
    constructor(prisma, realtime, sms, push, inApp) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.sms = sms;
        this.push = push;
        this.inApp = inApp;
    }
    async sendToUser(user, type, { channels = ['in_app'], vars = {}, data = {} } = {}) {
        const template = TEMPLATES[type];
        if (!template) {
            this.logger.warn(`[notification] unknown type: ${type}`);
            return null;
        }
        const locale = user?.locale ?? 'ar';
        const entry = (template[locale] ?? template.en);
        const message = {
            type,
            title: interpolate(entry.title, vars),
            body: interpolate(entry.body, vars),
        };
        let allowedChannels = [...channels];
        try {
            const setting = await this.prisma.notificationSetting.findFirst({
                where: { userId: user.id, notificationType: { in: [type, String(type).toLowerCase()] } },
            });
            if (setting) {
                if (!setting.enabledInApp)
                    allowedChannels = allowedChannels.filter((c) => c !== 'in_app');
                if (!setting.enabledPush)
                    allowedChannels = allowedChannels.filter((c) => c !== 'push');
            }
        }
        catch (err) {
            this.logger.warn(`[notification] settings check failed: ${err.message}`);
        }
        const results = {};
        if (allowedChannels.includes('sms')) {
            try {
                await this.sms.send(user, message);
                results.sms = true;
            }
            catch (err) {
                results.sms = false;
                this.logger.warn(`[notification] sms failed: ${err.message}`);
            }
        }
        if (allowedChannels.includes('push')) {
            try {
                await this.push.send(user, message, data);
                results.push = true;
            }
            catch (err) {
                results.push = false;
                this.logger.warn(`[notification] push failed: ${err.message}`);
            }
        }
        if (allowedChannels.includes('in_app')) {
            try {
                results.in_app = await this.inApp.send(user, message, data);
            }
            catch (err) {
                results.in_app = null;
                this.logger.warn(`[notification] in_app failed: ${err.message}`);
            }
        }
        return results;
    }
    async notifyBookedPassengers(tripIds, type, { vars = {}, data = {}, channels = ['in_app', 'push'] } = {}) {
        if (!tripIds || tripIds.length === 0)
            return;
        try {
            const bookings = await this.prisma.booking.findMany({
                where: { tripId: { in: tripIds }, status: { in: ['confirmed', 'pending'] } },
                include: {
                    trip: { select: { originCity: true, destinationCity: true } },
                    passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } },
                },
            });
            const seen = new Set();
            for (const booking of bookings) {
                const passenger = booking.passenger;
                if (!passenger || seen.has(passenger.id))
                    continue;
                seen.add(passenger.id);
                const trip = booking.trip;
                const route = trip ? `${trip.originCity} → ${trip.destinationCity}` : '';
                await this.sendToUser(passenger, type, { channels, vars: { route, ...vars }, data });
            }
        }
        catch (err) {
            this.logger.warn(`[notification] notifyBookedPassengers failed: ${err.message}`);
        }
    }
    async notifyConfirmedPassengers(tripIds, type, { vars = {}, data = {}, channels = ['in_app', 'push'] } = {}) {
        const ids = Array.isArray(tripIds) ? tripIds : [tripIds];
        if (ids.length === 0)
            return 0;
        try {
            const bookings = await this.prisma.booking.findMany({
                where: { tripId: { in: ids }, status: 'confirmed' },
                include: {
                    trip: { select: { originCity: true, destinationCity: true } },
                    passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } },
                },
            });
            let count = 0;
            const seen = new Set();
            for (const booking of bookings) {
                const passenger = booking.passenger;
                if (!passenger || seen.has(passenger.id))
                    continue;
                seen.add(passenger.id);
                const trip = booking.trip;
                const route = trip ? `${trip.originCity} → ${trip.destinationCity}` : '';
                await this.sendToUser(passenger, type, { channels, vars: { route, ...vars }, data });
                count += 1;
            }
            return count;
        }
        catch (err) {
            this.logger.warn(`[notification] notifyConfirmedPassengers failed: ${err.message}`);
            return 0;
        }
    }
    async listForUser(userId, { unread = null, page = 1, limit = 20 } = {}) {
        const where = { userId };
        if (unread === true)
            where.isRead = false;
        else if (unread === false)
            where.isRead = true;
        const [rows, count] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);
        return { rows: rows, count };
    }
    async markRead(userId, notificationId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new NotFoundException({ message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' });
        }
        if (notification.userId !== userId) {
            throw new ForbiddenException({
                message: 'You can only mark your own notifications as read',
                code: 'FORBIDDEN',
            });
        }
        if (!notification.isRead) {
            await this.prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            });
            await this.emitCount(userId);
        }
        return { id: notification.id, isRead: true };
    }
    async markAllRead(userId) {
        const res = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        await this.emitCount(userId);
        return { marked: res.count };
    }
    async countUnread(userId) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }
    async emitCount(userId) {
        try {
            const unreadCount = await this.countUnread(userId);
            this.realtime.emitToUser(userId, 'notification:count', {
                unread_count: unreadCount,
                timestamp: Date.now(),
            });
        }
        catch {
        }
    }
};
NotificationsService = NotificationsService_1 = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => RealtimeGateway))),
    __metadata("design:paramtypes", [PrismaService,
        RealtimeGateway,
        SmsChannel,
        PushChannel,
        InAppChannel])
], NotificationsService);
export { NotificationsService };
//# sourceMappingURL=notifications.service.js.map