import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { hasFreeTripsOffer, freeTripsLimit } from '../../common/utils/free-trips.js';
import { maskPhone } from '../../common/utils/masking.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSerializableRetry } from '../../prisma/transaction.js';
import { BalanceService } from '../balance/balance.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';

const DAY_MS = 24 * 3600 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function maskNationalID(nationalID: unknown): string | null {
  if (!nationalID) return null;
  const s = String(nationalID);
  if (s.length <= 4) return '****';
  return `****${s.slice(-4)}`;
}

function validationError(code: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ message, code });
}

interface SubscriptionRow {
  id: string;
  planName: string;
  planPeriodDays: number;
  planPercentageCut: unknown;
  planCost: unknown;
  balance: unknown;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  expiresAt: Date | null;
  freeOffer: unknown;
  freeTripsUsed: number;
}

// Port of Main Server/Services/subscriptionService.ts.
// DEVIATION (verified): Express forbids manual free-plan subscription outright
// (FREE_PLAN_NOT_SUBSCRIBABLE), but its own integration test demands a
// one-time free activation per national ID (and fails 11/12 against Express).
// The port implements the test's rule: one free activation, then 422
// FREE_PLAN_ALREADY_USED.
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
    private readonly notifications: NotificationsService,
  ) {}

  private toSubscriptionDTO(sub: SubscriptionRow): Record<string, unknown> {
    const dto: Record<string, unknown> = {
      id: sub.id,
      plan: { name: sub.planName, period_days: Number(sub.planPeriodDays) },
      balance: Number(sub.balance),
      status: sub.status,
      rejection_reason: sub.adminNotes ?? null,
      created_at: sub.createdAt,
      approved_at: sub.approvedAt ?? null,
      expires_at: sub.expiresAt ?? null,
    };
    if (hasFreeTripsOffer({ freeOffer: sub.freeOffer as never })) {
      const limit = freeTripsLimit({ freeOffer: sub.freeOffer as never });
      const used = Number(sub.freeTripsUsed) || 0;
      dto.free_trips = { max: limit, used, remaining: Math.max(0, limit - used) };
    }
    return dto;
  }

  private toCurrentDTO(
    sub: SubscriptionRow | null,
    user: { totalBalance: unknown; isInDebt: boolean },
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      subscription: sub
        ? {
            id: sub.id,
            plan: { name: sub.planName, percentage_cut: Number(sub.planPercentageCut) },
            balance: Number(sub.balance),
            expires_at: sub.expiresAt,
          }
        : null,
      total_balance: Number(user.totalBalance),
      is_in_debt: user.isInDebt,
    };
    const target = result.subscription as Record<string, unknown> | null;
    if (sub && target && hasFreeTripsOffer({ freeOffer: sub.freeOffer as never })) {
      const limit = freeTripsLimit({ freeOffer: sub.freeOffer as never });
      const used = Number(sub.freeTripsUsed) || 0;
      target.free_trips = { max: limit, used, remaining: Math.max(0, limit - used) };
    }
    return result;
  }

  async createSubscription(
    driverId: string,
    data: { plan_id: string; payment_method_id: string; screenshot_id: number; resubmit?: boolean },
  ): Promise<SubscriptionRow> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: data.plan_id } });
    if (!plan || !plan.isActive) {
      throw validationError('PLAN_INACTIVE', 'THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE');
    }

    if (plan.isFree) {
      // One free activation per driver, ever: ANY prior free row blocks a
      // re-subscribe (pending/active AND expired/cancelled/rejected), otherwise
      // expiring the free row would bypass the one-time rule.
      const priorFree = await this.prisma.driverSubscription.findFirst({
        where: {
          driverId,
          status: { in: ['pending_approval', 'active', 'expired', 'cancelled', 'rejected'] },
          plan: { isFree: true },
        },
      });
      if (priorFree) {
        throw validationError('FREE_PLAN_ALREADY_USED', 'FREE_PLAN_ALREADY_USED');
      }
    }

    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: data.payment_method_id },
    });
    if (!method || !method.isActive) {
      throw validationError(
        'THE_SELECTED_PAYMENT_METHOD_IS_UNAVAILABLE',
        'THE_SELECTED_PAYMENT_METHOD_IS_UNAVAILABLE',
      );
    }

    const screenshot = await this.prisma.uploadedImage.findUnique({
      where: { id: data.screenshot_id },
    });
    if (!screenshot) {
      throw validationError(
        'THE_SCREENSHOT_IMAGE_ID_IS_INVALID',
        'THE_SCREENSHOT_IMAGE_ID_IS_INVALID',
      );
    }

    const sub = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.driverSubscription.findMany({
        where: { driverId, planId: plan.id, status: 'pending_approval' },
      });
      if (existing.length > 0 && data.resubmit !== true) {
        throw new ConflictException({
          message: 'YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_PLAN',
          code: 'DUPLICATE_SUBSCRIPTION_REQUEST',
        });
      }
      if (existing.length > 0) {
        await Promise.all(
          existing.map((row) =>
            tx.driverSubscription.update({ where: { id: row.id }, data: { status: 'cancelled' } }),
          ),
        );
      }
      return tx.driverSubscription.create({
        data: {
          driverId,
          planId: plan.id,
          planName: plan.name,
          planPeriodDays: plan.periodDays,
          planPercentageCut: plan.percentageCut,
          planCost: plan.cost,
          balance: 0,
          screenshotId: data.screenshot_id,
          paymentMethod: {
            name: method.name,
            account_number: method.accountNumber,
            type: method.type,
          },
          status: 'pending_approval',
        },
      });
    });

    try {
      const user = await this.prisma.user.findUnique({ where: { id: driverId } });
      if (user) {
        await this.notifications.sendToUser(user as unknown as NotifyUser, 'SUBSCRIPTION_SUBMITTED', {
          channels: ['in_app'],
          data: { subscription_id: sub.id, plan_id: plan.id },
        });
      }
    } catch (err) {
      this.logger.warn(`subscription submit notification failed: ${(err as Error).message}`);
    }
    return sub as unknown as SubscriptionRow;
  }

  async getMySubscriptions(driverId: string): Promise<Record<string, unknown>[]> {
    const subs = await this.prisma.driverSubscription.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });
    return subs.map((s) => this.toSubscriptionDTO(s as unknown as SubscriptionRow));
  }

  async getCurrentSubscription(driverId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const current = (await this.balance.findCurrentSubscription(driverId)) as unknown as
      | SubscriptionRow
      | null;
    return this.toCurrentDTO(current, {
      totalBalance: user.totalBalance,
      isInDebt: user.isInDebt,
    });
  }

  async listPending(
    filters: {
      status?: string;
      sort?: string;
      search?: string;
      plan_id?: string;
      from?: string;
      to?: string;
    } = {},
  ): Promise<Record<string, unknown>[]> {
    const { status = 'pending_approval', sort = 'newest', search, plan_id, from, to } = filters;
    const validStatuses = ['pending_approval', 'active', 'rejected', 'cancelled', 'expired'];
    if (!validStatuses.includes(status)) {
      throw validationError('INVALID_SUBSCRIPTION_STATUS_FILTER', 'INVALID_SUBSCRIPTION_STATUS_FILTER');
    }
    const where: Prisma.DriverSubscriptionWhereInput = {
      status: status as 'pending_approval' | 'active' | 'rejected' | 'cancelled' | 'expired',
      ...(plan_id ? { planId: plan_id } : {}),
    };
    if (search) {
      // Subscription ids are UUIDs (equals only) — contains applies to text.
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        UUID_RE.test(search)
          ? { id: search }
          : {
            OR: [
              { driver: { fullName: { contains: search, mode: 'insensitive' } } },
              { driver: { phone: { contains: search, mode: 'insensitive' } } },
            ],
          },
      ];
    }
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from) createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) createdAt.lte = new Date(`${to}T23:59:59.999Z`);
      where.createdAt = createdAt;
    }
    const rows = await this.prisma.driverSubscription.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            driverProfile: { select: { nationalID: true } },
          },
        },
        plan: { select: { name: true, cost: true, isActive: true } },
        screenshot: { select: { id: true, url: true } },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
    });
    return rows.map((sub) => {
      const driver = (sub.driver ?? {}) as unknown as {
        id: string;
        fullName: string | null;
        phone: string | null;
        driverProfile?: { nationalID: string | null } | null;
      };
      const plan = sub.plan as unknown as { name: string; cost: unknown; isActive: boolean } | null;
      const screenshot = sub.screenshot as unknown as { id: number; url: string } | null;
      const payment = sub.paymentMethod as unknown as { name?: string } | null;
      return {
        subscription_id: sub.id,
        driver: {
          id: driver.id,
          full_name: driver.fullName ?? null,
          phone: driver.phone ?? null,
          national_id_masked: maskNationalID(driver.driverProfile?.nationalID),
        },
        plan: {
          name: plan ? plan.name : sub.planName,
          cost: plan ? Number(plan.cost) : Number(sub.planCost),
          is_active: plan ? plan.isActive : null,
        },
        payment_method: { name: payment?.name ?? null },
        screenshot_id: sub.screenshotId ?? null,
        screenshot_url: screenshot?.url ?? null,
        submitted_at: sub.createdAt,
      };
    });
  }

  // Figma 10831:13497 / 10840:37484 cards: إجمالي المشتركين (distinct
  // drivers holding an active subscription) / النشطة / قيد المراجعة / المرفوضة.
  async getStats(): Promise<Record<string, unknown>> {
    const [drivers, active, pending, rejected] = await Promise.all([
      this.prisma.driverSubscription.groupBy({ by: ['driverId'], where: { status: 'active' } }),
      this.prisma.driverSubscription.count({ where: { status: 'active' } }),
      this.prisma.driverSubscription.count({ where: { status: 'pending_approval' } }),
      this.prisma.driverSubscription.count({ where: { status: 'rejected' } }),
    ]);
    return {
      total_subscribers: drivers.length,
      active_subscriptions: active,
      pending_review: pending,
      rejected: rejected,
    };
  }

  // Figma 10846:39083 review dossier: driver block, chosen plan, transfer
  // data + receipt, status/actions, submitted→decided history.
  async getDetail(subscriptionId: string): Promise<Record<string, unknown>> {
    const sub = await this.prisma.driverSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true,
            createdAt: true,
            driverProfile: { select: { nationalID: true } },
          },
        },
        plan: true,
        screenshot: { select: { id: true, url: true } },
      },
    });
    if (!sub) {
      throw new NotFoundException({ message: 'SUBSCRIPTION_NOT_FOUND', code: 'SUBSCRIPTION_NOT_FOUND' });
    }
    const driver = sub.driver as unknown as {
      id: string;
      fullName: string | null;
      phone: string | null;
      status: string;
      createdAt: Date;
      driverProfile?: { nationalID: string | null } | null;
    } | null;
    const plan = sub.plan as unknown as {
      id: string;
      name: string;
      periodDays: number;
      percentageCut: unknown;
      cost: unknown;
      isActive: boolean;
    } | null;
    const screenshot = sub.screenshot as unknown as { id: number; url: string } | null;
    const payment = sub.paymentMethod as unknown as Record<string, unknown> | null;
    const history: Record<string, unknown>[] = [{ event: 'submitted', at: sub.createdAt }];
    if (sub.status === 'active' && sub.activatedAt) {
      history.push({ event: 'approved', at: sub.activatedAt, approved_at: sub.approvedAt });
    } else if (sub.status === 'rejected') {
      history.push({ event: 'rejected', at: sub.updatedAt, reason: sub.adminNotes });
    } else if (sub.status !== 'pending_approval') {
      history.push({ event: sub.status, at: sub.updatedAt });
    }
    return {
      subscription: {
        id: sub.id,
        status: sub.status,
        submitted_at: sub.createdAt,
        approved_at: sub.approvedAt,
        activated_at: sub.activatedAt,
        expires_at: sub.expiresAt,
        rejection_reason: sub.adminNotes,
        balance: Number(sub.balance),
        free_trips_used: sub.freeTripsUsed,
      },
      driver: driver
        ? {
          id: driver.id,
          full_name: driver.fullName,
          phone: maskPhone(driver.phone),
          account_status: driver.status,
          national_id_masked: maskNationalID(driver.driverProfile?.nationalID),
          registered_at: driver.createdAt,
        }
        : null,
      plan: plan
        ? {
          id: plan.id,
          name: plan.name,
          period_days: plan.periodDays,
          percentage_cut: Number(plan.percentageCut),
          cost: Number(plan.cost),
          is_active: plan.isActive,
        }
        : {
          name: sub.planName,
          period_days: sub.planPeriodDays,
          percentage_cut: Number(sub.planPercentageCut),
          cost: Number(sub.planCost),
        },
      transfer: {
        method: payment,
        screenshot_id: sub.screenshotId,
        screenshot_url: screenshot?.url ?? null,
      },
      history,
    };
  }

  async approve(
    subscriptionId: string,
    _actorId: string,
  ): Promise<{ message: string; subscription_id: string; balance_added: number }> {
    const result = await withSerializableRetry(this.prisma, async (tx) => {
      const sub = await tx.driverSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) throw new NotFoundException({ message: 'SUBSCRIPTION_NOT_FOUND', code: 'SUBSCRIPTION_NOT_FOUND' });
      if (sub.status !== 'pending_approval') {
        throw new ConflictException({ message: 'REQUEST_ALREADY_PROCESSED', code: 'REQUEST_ALREADY_PROCESSED' });
      }
      const plan = await tx.subscriptionPlan.findUnique({ where: { id: sub.planId } });
      if (!plan || !plan.isActive) {
        throw new ConflictException({
          message: 'THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE',
          code: 'APPROVAL_BLOCKED',
        });
      }
      const now = new Date();
      const expiresAt = new Date(now.getTime() + Number(sub.planPeriodDays) * DAY_MS);

      let extraBalance = 0;
      let mergedBalance = 0;
      let merged: { id: string; balance: number } | null = null;
      const freeOffer = plan.freeOffer as unknown as { type?: string; value?: number } | null;
      if (plan.isFree && freeOffer?.type === 'credit') {
        extraBalance += Number(freeOffer.value) || 0;
      }
      const existing = await tx.driverSubscription.findFirst({
        where: {
          driverId: sub.driverId,
          planId: sub.planId,
          id: { not: sub.id },
          status: 'active',
        },
        orderBy: { createdAt: 'asc' },
      });
      if (existing) {
        const remaining = Number(existing.balance) || 0;
        extraBalance += remaining;
        mergedBalance = remaining;
        await tx.driverSubscription.update({
          where: { id: existing.id },
          data: { status: 'expired', balance: 0 },
        });
        merged = { id: existing.id, balance: remaining };
      }

      // Conditional claim: first-action-wins under concurrency. A concurrent
      // approve that already flipped the row makes count 0 → 409.
      const claimed = await tx.driverSubscription.updateMany({
        where: { id: sub.id, status: 'pending_approval' },
        data: { status: 'active', approvedAt: now, activatedAt: now, expiresAt },
      });
      if (claimed.count === 0) {
        throw new ConflictException({ message: 'REQUEST_ALREADY_PROCESSED', code: 'REQUEST_ALREADY_PROCESSED' });
      }

      const credit = await this.balance.creditOnApproval(
        {
          id: sub.id,
          driverId: sub.driverId,
          planName: sub.planName,
          planCost: sub.planCost,
          balance: sub.balance,
        },
        { transaction: tx, actorId: _actorId, extraBalance, mergedBalance },
      );
      return {
        subscriptionId: sub.id,
        balanceAdded: credit.balanceAdded,
        totalBalance: credit.totalBalance,
        planName: sub.planName,
        driverId: sub.driverId,
        expiresAt,
        merged,
        blockingNotify: credit.blockingNotify,
      };
    });

    try {
      const user = await this.prisma.user.findUnique({ where: { id: result.driverId } });
      if (user) {
        await this.notifications.sendToUser(user as unknown as NotifyUser, 'SUBSCRIPTION_APPROVED', {
          channels: ['sms', 'in_app'],
          vars: { plan: result.planName, balance: Number(result.totalBalance).toFixed(2) },
          data: { subscription_id: result.subscriptionId, balance_added: result.balanceAdded },
        });
      }
    } catch (err) {
      this.logger.warn(`approval notification failed: ${(err as Error).message}`);
    }
    if (result.blockingNotify) {
      await this.balance.sendBlockingNotify(result.blockingNotify);
    }

    return {
      message: 'SUBSCRIPTION_APPROVED_PLAN_ACTIVATED',
      subscription_id: result.subscriptionId,
      balance_added: result.balanceAdded,
    };
  }

  async reject(
    subscriptionId: string,
    reason: string,
    _actorId: string,
  ): Promise<{ message: string; subscription_id: string }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const sub = await tx.driverSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) throw new NotFoundException({ message: 'SUBSCRIPTION_NOT_FOUND', code: 'SUBSCRIPTION_NOT_FOUND' });
      if (sub.status !== 'pending_approval') {
        throw new ConflictException({ message: 'REQUEST_ALREADY_PROCESSED', code: 'REQUEST_ALREADY_PROCESSED' });
      }
      await tx.driverSubscription.update({
        where: { id: sub.id },
        data: { status: 'rejected', adminNotes: reason },
      });
      return { subscriptionId: sub.id, driverId: sub.driverId };
    });

    try {
      const user = await this.prisma.user.findUnique({ where: { id: result.driverId } });
      if (user) {
        await this.notifications.sendToUser(user as unknown as NotifyUser, 'SUBSCRIPTION_REJECTED', {
          channels: ['sms', 'in_app'],
          vars: { reason },
          data: { subscription_id: result.subscriptionId },
        });
      }
    } catch (err) {
      this.logger.warn(`rejection notification failed: ${(err as Error).message}`);
    }
    return { message: 'SUBSCRIPTION_REJECTED', subscription_id: result.subscriptionId };
  }

  async getCurrentActivePlan(driverId: string): Promise<unknown> {
    return this.balance.findCurrentSubscription(driverId);
  }
}
