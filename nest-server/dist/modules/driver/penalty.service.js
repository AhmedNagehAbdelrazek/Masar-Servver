var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PenaltyService_1;
import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnforcementService } from './enforcement.service.js';
const STATUS_BY_TYPE = {
    warning: 'warned',
    suspension: 'suspended',
    ban: 'banned',
};
let PenaltyService = PenaltyService_1 = class PenaltyService {
    prisma;
    enforcement;
    logger = new Logger(PenaltyService_1.name);
    constructor(prisma, enforcement) {
        this.prisma = prisma;
        this.enforcement = enforcement;
    }
    async listForDriver(userId, filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const where = { userId };
        if (filters.active === 'true' || filters.active === true) {
            const now = new Date();
            where.startsAt = { lte: now };
            where.OR = [{ endsAt: null }, { endsAt: { gte: now } }];
        }
        const [rows, count] = await Promise.all([
            this.prisma.penalty.findMany({
                where: where,
                include: { user: { select: { status: true } } },
                orderBy: { startsAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.penalty.count({ where: where }),
        ]);
        return {
            data: rows.map((p) => ({
                id: p.id,
                type: p.type,
                reason: p.reason,
                starts_at: p.startsAt,
                ends_at: p.endsAt,
                is_appealed: p.isAppealed,
                enforcement_state: p.user?.status ?? null,
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async issue(actorId, payload) {
        const { user_id: userId, type, reason, details, complaint_id: complaintId, ends_at: endsAt } = payload;
        if (type === 'suspension' && !endsAt) {
            throw new UnprocessableEntityException({
                message: 'ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION',
                code: 'VALIDATION_ERROR',
                details: [{ field: 'ends_at', message: 'ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION' }],
            });
        }
        if (type === 'ban' && endsAt) {
            throw new UnprocessableEntityException({
                message: 'ENDS_AT_IS_FORBIDDEN_FOR_A_BAN',
                code: 'VALIDATION_ERROR',
                details: [{ field: 'ends_at', message: 'ENDS_AT_IS_FORBIDDEN_FOR_A_BAN' }],
            });
        }
        if (endsAt && Number.isNaN(Date.parse(endsAt))) {
            throw new UnprocessableEntityException({
                message: 'ENDS_AT_MUST_BE_A_VALID_ISO_8601_DATETIME',
                code: 'VALIDATION_ERROR',
                details: [{ field: 'ends_at', message: 'ENDS_AT_MUST_BE_A_VALID_ISO_8601_DATETIME' }],
            });
        }
        if (endsAt && new Date(endsAt) <= new Date()) {
            throw new UnprocessableEntityException({
                message: 'ENDS_AT_MUST_BE_IN_THE_FUTURE',
                code: 'VALIDATION_ERROR',
                details: [{ field: 'ends_at', message: 'ENDS_AT_MUST_BE_IN_THE_FUTURE' }],
            });
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const penalty = await this.prisma.penalty.create({
            data: {
                userId,
                complaintId: complaintId ?? null,
                type: type,
                reason,
                details: details ?? null,
                startsAt: new Date(),
                endsAt: endsAt ? new Date(endsAt) : null,
                issuedBy: actorId,
            },
        });
        const newStatus = STATUS_BY_TYPE[type];
        if (newStatus) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: newStatus },
            });
        }
        try {
            const plan = this.enforcement.revocationForPenalty(type);
            if (plan.applies) {
                this.enforcement.revoke(userId, {
                    action: plan.action ?? 'suspend',
                    reason,
                    actorId,
                    duration: type === 'suspension' && endsAt ? String(endsAt) : null,
                });
            }
        }
        catch (err) {
            this.logger.warn(`[penaltyService] enforcement revocation failed: ${err.message}`);
        }
        return {
            penalty: {
                id: penalty.id,
                user_id: penalty.userId,
                type: penalty.type,
                reason: penalty.reason,
                details: penalty.details ?? null,
                starts_at: penalty.startsAt,
                ends_at: penalty.endsAt,
                issued_by: penalty.issuedBy,
            },
        };
    }
};
PenaltyService = PenaltyService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EnforcementService])
], PenaltyService);
export { PenaltyService };
//# sourceMappingURL=penalty.service.js.map