var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { maskPhone } from '../../common/utils/masking.js';
import { PrismaService } from '../../prisma/prisma.service.js';
let AdminModerationService = class AdminModerationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUsers(filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const where = {
            ...(filters.role ? { role: filters.role } : {}),
            ...(filters.status ? { status: filters.status } : {}),
        };
        const [rows, count] = await Promise.all([
            this.prisma.user.findMany({
                where: where,
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    status: true,
                    avgRating: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.user.count({ where: where }),
        ]);
        return {
            data: rows.map((u) => ({
                id: u.id,
                full_name: u.fullName,
                phone: maskPhone(u.phone),
                role: u.role,
                status: u.status,
                avg_rating: Number(u.avgRating) || 0,
                created_at: u.createdAt,
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async updateUserStatus(actorId, userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { status: dto.status },
        });
        if (dto.reason) {
            await this.prisma.notification.create({
                data: {
                    userId: updated.id,
                    type: 'VERIFICATION_REJECTED',
                    title: 'Account status updated',
                    body: `Your account status was changed to ${dto.status}. Reason: ${dto.reason}`,
                    data: { status: dto.status },
                    sentVia: ['in_app'],
                },
            });
        }
        return {
            user: { id: updated.id, status: updated.status, updated_by: actorId },
        };
    }
};
AdminModerationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], AdminModerationService);
export { AdminModerationService };
//# sourceMappingURL=admin-moderation.service.js.map