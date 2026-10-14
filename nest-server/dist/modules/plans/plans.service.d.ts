import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';
import type { CreatePlanDto } from './dto/create-plan.dto.js';
import type { UpdatePlanDto } from './dto/update-plan.dto.js';
export declare class PlansService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    getActivePlans(): Promise<Record<string, unknown>[]>;
    getActivePaymentMethods(): Promise<Record<string, unknown>[]>;
    listPlans(): Promise<Record<string, unknown>[]>;
    private ensureSingleFreePlan;
    private invalidatePlansCache;
    createPlan(data: CreatePlanDto, _actorId: string): Promise<Record<string, unknown>>;
    updatePlan(planId: string, data: UpdatePlanDto, _actorId: string): Promise<Record<string, unknown>>;
    getFreePlan(): Promise<Record<string, unknown>>;
    updateFreePlan(data: UpdatePlanDto, actorId: string): Promise<Record<string, unknown>>;
    deactivatePlan(planId: string, _actorId: string): Promise<{
        message: string;
    }>;
    listPaymentMethods(): Promise<Record<string, unknown>[]>;
    createPaymentMethod(data: CreatePaymentMethodDto, _actorId: string): Promise<Record<string, unknown>>;
    updatePaymentMethod(methodId: string, data: UpdatePaymentMethodDto, _actorId: string): Promise<Record<string, unknown>>;
    deactivatePaymentMethod(methodId: string, _actorId: string): Promise<{
        message: string;
    }>;
}
