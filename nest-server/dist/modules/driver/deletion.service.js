var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeletionService_1;
import { ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { ensureOperational, loadDriverUser } from '../../common/access/user-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export function addBusinessDays(from, days) {
    const date = new Date(from.getTime());
    let remaining = days;
    while (remaining > 0) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 5 && day !== 6)
            remaining -= 1;
    }
    return date;
}
let DeletionService = DeletionService_1 = class DeletionService {
    prisma;
    notifications;
    logger = new Logger(DeletionService_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async hasPendingRequest(userId) {
        const pending = await this.prisma.deletionRequest.findFirst({
            where: { userId, status: 'pending' },
        });
        return pending !== null;
    }
    async alertAdmins(driverId, fullName, phone) {
        try {
            const admins = await this.prisma.user.findMany({
                where: { role: 'admin', status: 'active' },
            });
            for (const admin of admins) {
                await this.notifications.sendToUser(admin, 'ADMIN_DELETION_NEW', {
                    channels: ['in_app'],
                    vars: { driver_name: fullName ?? 'A driver', phone: phone ?? '' },
                    data: { driver_id: driverId },
                });
            }
            return admins.length;
        }
        catch (err) {
            this.logger.warn(`[deletion-request] admin alert failed: ${err.message}`);
            return 0;
        }
    }
    async requestDeletion(userId, { reason = null, confirmation = false } = {}) {
        const user = await loadDriverUser(this.prisma, userId);
        ensureOperational(user);
        if (confirmation !== true) {
            throw new UnprocessableEntityException({
                message: 'CONFIRMATION_IS_REQUIRED_TO_REQUEST_ACCOUNT_DELETION',
                code: 'VALIDATION_ERROR',
            });
        }
        const existing = await this.prisma.deletionRequest.findFirst({
            where: { userId: user.id, status: 'pending' },
        });
        if (existing) {
            throw new ConflictException({
                message: 'A_DELETION_REQUEST_IS_ALREADY_PENDING',
                code: 'DELETION_ALREADY_REQUESTED',
            });
        }
        const estimatedCompletion = addBusinessDays(new Date(), 5);
        const request = await this.prisma.deletionRequest.create({
            data: { userId: user.id, reason, status: 'pending', estimatedCompletion },
        });
        await this.prisma.user.update({ where: { id: user.id }, data: { fcmToken: null } });
        const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (fullUser) {
            await this.notifications
                .sendToUser(fullUser, 'DELETION_REQUESTED', {
                channels: ['in_app'],
                vars: {},
                data: { request_id: request.id, estimated_completion: request.estimatedCompletion },
            })
                .catch((err) => this.logger.warn(`[deletion-request] user notify failed: ${err.message}`));
        }
        await this.alertAdmins(user.id, fullUser?.fullName, fullUser?.phone);
        return {
            request_id: request.id,
            status: request.status,
            estimated_completion: request.estimatedCompletion,
        };
    }
    async cancelDeletionRequest(userId) {
        const user = await loadDriverUser(this.prisma, userId);
        ensureOperational(user);
        const pending = await this.prisma.deletionRequest.findFirst({
            where: { userId: user.id, status: 'pending' },
        });
        if (!pending) {
            throw new NotFoundException({
                message: 'NO_PENDING_DELETION_REQUEST_FOUND',
                code: 'NO_PENDING_DELETION_REQUEST',
            });
        }
        const updated = await this.prisma.deletionRequest.update({
            where: { id: pending.id },
            data: { status: 'cancelled' },
        });
        const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (fullUser) {
            await this.notifications
                .sendToUser(fullUser, 'DELETION_REQUEST_CANCELLED', {
                channels: ['in_app'],
                vars: {},
                data: { request_id: pending.id },
            })
                .catch((err) => this.logger.warn(`[deletion-request] cancel notify failed: ${err.message}`));
        }
        return { request_id: pending.id, status: updated.status };
    }
};
DeletionService = DeletionService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], DeletionService);
export { DeletionService };
//# sourceMappingURL=deletion.service.js.map