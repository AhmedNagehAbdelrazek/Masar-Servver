import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';
import type { CreatePlanDto } from './dto/create-plan.dto.js';
import type { UpdatePlanDto } from './dto/update-plan.dto.js';

// Port of Main Server/Services/planService.ts (plans + payment methods).
// Audit writes go through the global AuditInterceptor (best-effort); the
// explicit auditService.track calls are intentionally not duplicated.
const PLANS_ACTIVE_KEY = 'plans:active';
const PLANS_CACHE_TTL = 60;

// Shared-DB note: `payment_methods.type` is a plain TEXT/VARCHAR column holding
// the wire value verbatim ('bank_account' | 'e-wallet' | 'mobile_money').
// Both servers read/write the hyphenated form — no enum-member translation.
// OUT_METHOD_TYPE keeps the legacy underscore key so rows written by older
// builds still render correctly.
const DB_METHOD_TYPE: Record<string, string> = {
  bank_account: 'bank_account',
  'e-wallet': 'e-wallet',
  e_wallet: 'e-wallet',
  mobile_money: 'mobile_money',
};

const OUT_METHOD_TYPE: Record<string, string> = {
  bank_account: 'bank_account',
  e_wallet: 'e-wallet',
  mobile_money: 'mobile_money',
};

interface PlanRow {
  id: string;
  name: string;
  periodDays: number;
  percentageCut: unknown;
  cost: unknown;
  status: string | null;
  features: unknown;
  isFree: boolean;
  freeOffer: unknown;
  isActive: boolean;
}

interface MethodRow {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  email: string | null;
  isActive: boolean;
}

function toPlanDTO(plan: PlanRow): Record<string, unknown> {
  const dto: Record<string, unknown> = {
    id: plan.id,
    name: plan.name,
    period_days: Number(plan.periodDays),
    percentage_cut: Number(plan.percentageCut as number),
    cost: Number(plan.cost as number),
    status: plan.status ?? null,
    features: (plan.features as unknown[]) ?? [],
    is_free: plan.isFree,
    free_offer: plan.isFree ? (plan.freeOffer ?? null) : null,
  };
  if (plan.isActive !== undefined) dto.is_active = plan.isActive;
  return dto;
}

function toMethodDTO(method: MethodRow): Record<string, unknown> {
  const dto: Record<string, unknown> = {
    id: method.id,
    name: method.name,
    account_number: method.accountNumber,
    type: OUT_METHOD_TYPE[method.type] ?? method.type,
    email: method.email ?? null,
  };
  if (method.isActive !== undefined) dto.is_active = method.isActive;
  return dto;
}

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Active plan catalog for drivers (Redis-cached). Free plans excluded. */
  async getActivePlans(): Promise<Record<string, unknown>[]> {
    try {
      const cached = await this.redis.getKey(PLANS_ACTIVE_KEY);
      if (cached) return JSON.parse(cached) as Record<string, unknown>[];
    } catch (err) {
      this.logger.warn(`plan cache read failed: ${(err as Error).message}`);
    }
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isFree: false },
      orderBy: { createdAt: 'asc' },
    });
    const dto = plans.map((p) => toPlanDTO(p as unknown as PlanRow));
    try {
      await this.redis.setKey(PLANS_ACTIVE_KEY, JSON.stringify(dto), PLANS_CACHE_TTL);
    } catch (err) {
      this.logger.warn(`plan cache write failed: ${(err as Error).message}`);
    }
    return dto;
  }

  async getActivePaymentMethods(): Promise<Record<string, unknown>[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return methods.map((m) => toMethodDTO(m as unknown as MethodRow));
  }

  async listPlans(): Promise<Record<string, unknown>[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({ orderBy: { createdAt: 'asc' } });
    // Figma 10831:13497 plan cards show المشتركون per plan.
    const counts = await this.prisma.driverSubscription.groupBy({
      by: ['planId'],
      where: { status: 'active' },
      _count: { id: true },
    });
    const activeByPlan = new Map(counts.map((r) => [r.planId, r._count.id]));
    return plans.map((p) => ({
      ...toPlanDTO(p as unknown as PlanRow),
      active_subscribers: activeByPlan.get(p.id) ?? 0,
    }));
  }

  private async ensureSingleFreePlan(isFree: boolean, excludeId?: string): Promise<void> {
    if (!isFree) return;
    const where: Prisma.SubscriptionPlanWhereInput = { isFree: true, isActive: true };
    if (excludeId) where.id = { not: excludeId };
    const existing = await this.prisma.subscriptionPlan.findFirst({ where });
    if (existing) {
      throw new ConflictException({ message: 'A free plan already exists', code: 'FREE_PLAN_EXISTS' });
    }
  }

  private async invalidatePlansCache(): Promise<void> {
    try {
      await this.redis.deleteKey(PLANS_ACTIVE_KEY);
    } catch (err) {
      this.logger.warn(`plan cache invalidation failed: ${(err as Error).message}`);
    }
  }

  async createPlan(data: CreatePlanDto, _actorId: string): Promise<Record<string, unknown>> {
    const isFree = Boolean(data.is_free);
    // Express runs free_offer validation even when the key is absent
    // (class-validator skips absent properties, so this lives here).
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
          ? ((data.free_offer ?? Prisma.DbNull) as Prisma.InputJsonValue)
          : Prisma.DbNull,
        isActive: true,
      },
    });
    await this.invalidatePlansCache();
    return toPlanDTO(plan as unknown as PlanRow);
  }

  async updatePlan(planId: string, data: UpdatePlanDto, _actorId: string): Promise<Record<string, unknown>> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException({ message: 'Plan not found', code: 'PLAN_NOT_FOUND' });
    const isFree = data.is_free !== undefined ? Boolean(data.is_free) : plan.isFree;
    const willBeActive = data.is_active !== undefined ? Boolean(data.is_active) : plan.isActive;
    if (isFree && willBeActive) await this.ensureSingleFreePlan(true, planId);
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
                ? ((data.free_offer ?? Prisma.DbNull) as Prisma.InputJsonValue)
                : Prisma.DbNull,
            }
          : {}),
      },
    });
    await this.invalidatePlansCache();
    return toPlanDTO(updated as unknown as PlanRow);
  }

  // Figma 10840:36658 (إدارة الباقة المجانية): single free-plan config.
  // Update-only — 404 when no free plan exists (create one via POST /admin/plans).
  async getFreePlan(): Promise<Record<string, unknown>> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { isFree: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!plan) throw new NotFoundException({ message: 'FREE_PLAN_NOT_FOUND', code: 'FREE_PLAN_NOT_FOUND' });
    return toPlanDTO(plan as unknown as PlanRow);
  }

  async updateFreePlan(data: UpdatePlanDto, actorId: string): Promise<Record<string, unknown>> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { isFree: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!plan) throw new NotFoundException({ message: 'FREE_PLAN_NOT_FOUND', code: 'FREE_PLAN_NOT_FOUND' });
    return this.updatePlan(plan.id, data, actorId);
  }

  async deactivatePlan(planId: string, _actorId: string): Promise<{ message: string }> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException({ message: 'Plan not found', code: 'PLAN_NOT_FOUND' });
    await this.prisma.subscriptionPlan.update({ where: { id: planId }, data: { isActive: false } });
    await this.invalidatePlansCache();
    return { message: 'PLAN_DEACTIVATED' };
  }

  async listPaymentMethods(): Promise<Record<string, unknown>[]> {
    const methods = await this.prisma.paymentMethod.findMany({ orderBy: { createdAt: 'asc' } });
    return methods.map((m) => toMethodDTO(m as unknown as MethodRow));
  }

  async createPaymentMethod(data: CreatePaymentMethodDto, _actorId: string): Promise<Record<string, unknown>> {
    const method = await this.prisma.paymentMethod.create({
      data: {
        name: data.name,
        accountNumber: data.account_number,
        type: DB_METHOD_TYPE[data.type],
        email: data.email ?? null,
        isActive: true,
      },
    });
    return toMethodDTO(method as unknown as MethodRow);
  }

  async updatePaymentMethod(
    methodId: string,
    data: UpdatePaymentMethodDto,
    _actorId: string,
  ): Promise<Record<string, unknown>> {
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
    return toMethodDTO(updated as unknown as MethodRow);
  }

  async deactivatePaymentMethod(methodId: string, _actorId: string): Promise<{ message: string }> {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id: methodId } });
    if (!method) {
      throw new NotFoundException({ message: 'Payment method not found', code: 'PAYMENT_METHOD_NOT_FOUND' });
    }
    await this.prisma.paymentMethod.update({ where: { id: methodId }, data: { isActive: false } });
    return { message: 'PAYMENT_METHOD_DEACTIVATED' };
  }
}
