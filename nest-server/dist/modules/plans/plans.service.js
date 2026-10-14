var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PlansService_1;
import { ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
const PLANS_ACTIVE_KEY = 'plans:active';
const PLANS_CACHE_TTL = 60;
const DB_METHOD_TYPE = {
    bank_account: 'bank_account',
    'e-wallet': 'e-wallet',
    e_wallet: 'e-wallet',
    mobile_money: 'mobile_money',
};
const OUT_METHOD_TYPE = {
    bank_account: 'bank_account',
    e_wallet: 'e-wallet',
    mobile_money: 'mobile_money',
};
function toPlanDTO(plan) {
    const dto = {
        id: plan.id,
        name: plan.name,
        period_days: Number(plan.periodDays),
        percentage_cut: Number(plan.percentageCut),
        cost: Number(plan.cost),
        status: plan.status ?? null,
        features: plan.features ?? [],
        is_free: plan.isFree,
        free_offer: plan.isFree ? (plan.freeOffer ?? null) : null,
    };
    if (plan.isActive !== undefined)
        dto.is_active = plan.isActive;
    return dto;
}
function toMethodDTO(method) {
    const dto = {
        id: method.id,
        name: method.name,
        account_number: method.accountNumber,
        type: OUT_METHOD_TYPE[method.type] ?? method.type,
        email: method.email ?? null,
    };
    if (method.isActive !== undefined)
        dto.is_active = method.isActive;
    return dto;
}
let PlansService = PlansService_1 = class PlansService {
    prisma;
    redis;
    logger = new Logger(PlansService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getActivePlans() {
        try {
            const cached = await this.redis.getKey(PLANS_ACTIVE_KEY);
            if (cached)
                return JSON.parse(cached);
        }
        catch (err) {
            this.logger.warn(`plan cache read failed: ${err.message}`);
        }
        const plans = await this.prisma.subscriptionPlan.findMany({
            where: { isActive: true, isFree: false },
            orderBy: { createdAt: 'asc' },
        });
        const dto = plans.map((p) => toPlanDTO(p));
        try {
            await this.redis.setKey(PLANS_ACTIVE_KEY, JSON.stringify(dto), PLANS_CACHE_TTL);
        }
        catch (err) {
            this.logger.warn(`plan cache write failed: ${err.message}`);
        }
        return dto;
    }
    async getActivePaymentMethods() {
        const methods = await this.prisma.paymentMethod.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        return methods.map((m) => toMethodDTO(m));
    }
    async listPlans() {
        const plans = await this.prisma.subscriptionPlan.findMany({ orderBy: { createdAt: 'asc' } });
        const counts = await this.prisma.driverSubscription.groupBy({
            by: ['planId'],
            where: { status: 'active' },
            _count: { id: true },
        });
        const activeByPlan = new Map(counts.map((r) => [r.planId, r._count.id]));
        return plans.map((p) => ({
            ...toPlanDTO(p),
            active_subscribers: activeByPlan.get(p.id) ?? 0,
        }));
    }
    async ensureSingleFreePlan(isFree, excludeId) {
        if (!isFree)
            return;
        const where = { isFree: true, isActive: true };
        if (excludeId)
            where.id = { not: excludeId };
        const existing = await this.prisma.subscriptionPlan.findFirst({ where });
        if (existing) {
            throw new ConflictException({ message: 'A free plan already exists', code: 'FREE_PLAN_EXISTS' });
        }
    }
    async invalidatePlansCache() {
        try {
            await this.redis.deleteKey(PLANS_ACTIVE_KEY);
        }
        catch (err) {
            this.logger.warn(`plan cache invalidation failed: ${err.message}`);
        }
    }
    async createPlan(data, _actorId) {
        const isFree = Boolean(data.is_free);
        if (isFree && data.free_offer == null) {
            throw new UnprocessableEntityException({
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: [
                    {
                        field: 'free_offer',
                        message: 'free_offer is required for a free plan',
                    },
                ],
            });
        }
        await this.ensureSingleFreePlan(isFree);
        const plan = await this.prisma.subscriptionPlan.create({
            data: {
                name: data.name,
                periodDays: data.period_days,
                percentageCut: data.percentage_cut ?? 0,
                cost: data.cost ?? 0,
                status: data.status ?? null,
                features: data.features ?? [],
                isFree,
                freeOffer: isFree
                    ? (data.free_offer ?? Prisma.DbNull)
                    : Prisma.DbNull,
                isActive: true,
            },
        });
        await this.invalidatePlansCache();
        return toPlanDTO(plan);
    }
    async updatePlan(planId, data, _actorId) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new NotFoundException({ message: 'Plan not found', code: 'PLAN_NOT_FOUND' });
        const isFree = data.is_free !== undefined ? Boolean(data.is_free) : plan.isFree;
        const willBeActive = data.is_active !== undefined ? Boolean(data.is_active) : plan.isActive;
        if (isFree && willBeActive)
            await this.ensureSingleFreePlan(true, planId);
        const updated = await this.prisma.subscriptionPlan.update({
            where: { id: planId },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.period_days !== undefined ? { periodDays: data.period_days } : {}),
                ...(data.percentage_cut !== undefined ? { percentageCut: data.percentage_cut } : {}),
                ...(data.cost !== undefined ? { cost: data.cost } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.features !== undefined ? { features: data.features } : {}),
                ...(data.is_free !== undefined ? { isFree } : {}),
                ...(data.is_active !== undefined ? { isActive: willBeActive } : {}),
                ...(data.free_offer !== undefined
                    ? {
                        freeOffer: isFree
                            ? (data.free_offer ?? Prisma.DbNull)
                            : Prisma.DbNull,
                    }
                    : {}),
            },
        });
        await this.invalidatePlansCache();
        return toPlanDTO(updated);
    }
    async getFreePlan() {
        const plan = await this.prisma.subscriptionPlan.findFirst({
            where: { isFree: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!plan)
            throw new NotFoundException({ message: 'FREE_PLAN_NOT_FOUND', code: 'FREE_PLAN_NOT_FOUND' });
        return toPlanDTO(plan);
    }
    async updateFreePlan(data, actorId) {
        const plan = await this.prisma.subscriptionPlan.findFirst({
            where: { isFree: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!plan)
            throw new NotFoundException({ message: 'FREE_PLAN_NOT_FOUND', code: 'FREE_PLAN_NOT_FOUND' });
        return this.updatePlan(plan.id, data, actorId);
    }
    async deactivatePlan(planId, _actorId) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new NotFoundException({ message: 'Plan not found', code: 'PLAN_NOT_FOUND' });
        await this.prisma.subscriptionPlan.update({ where: { id: planId }, data: { isActive: false } });
        await this.invalidatePlansCache();
        return { message: 'PLAN_DEACTIVATED' };
    }
    async listPaymentMethods() {
        const methods = await this.prisma.paymentMethod.findMany({ orderBy: { createdAt: 'asc' } });
        return methods.map((m) => toMethodDTO(m));
    }
    async createPaymentMethod(data, _actorId) {
        const method = await this.prisma.paymentMethod.create({
            data: {
                name: data.name,
                accountNumber: data.account_number,
                type: DB_METHOD_TYPE[data.type],
                email: data.email ?? null,
                isActive: true,
            },
        });
        return toMethodDTO(method);
    }
    async updatePaymentMethod(methodId, data, _actorId) {
        const method = await this.prisma.paymentMethod.findUnique({ where: { id: methodId } });
        if (!method) {
            throw new NotFoundException({ message: 'Payment method not found', code: 'PAYMENT_METHOD_NOT_FOUND' });
        }
        const updated = await this.prisma.paymentMethod.update({
            where: { id: methodId },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.account_number !== undefined ? { accountNumber: data.account_number } : {}),
                ...(data.type !== undefined ? { type: DB_METHOD_TYPE[data.type] } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
            },
        });
        return toMethodDTO(updated);
    }
    async deactivatePaymentMethod(methodId, _actorId) {
        const method = await this.prisma.paymentMethod.findUnique({ where: { id: methodId } });
        if (!method) {
            throw new NotFoundException({ message: 'Payment method not found', code: 'PAYMENT_METHOD_NOT_FOUND' });
        }
        await this.prisma.paymentMethod.update({ where: { id: methodId }, data: { isActive: false } });
        return { message: 'PAYMENT_METHOD_DEACTIVATED' };
    }
};
PlansService = PlansService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RedisService])
], PlansService);
export { PlansService };
//# sourceMappingURL=plans.service.js.map