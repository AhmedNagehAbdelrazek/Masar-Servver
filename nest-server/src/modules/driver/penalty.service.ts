import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnforcementService } from './enforcement.service.js';
import { AccountBlockingService } from './account-blocking.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';

const STATUS_BY_TYPE: Record<string, string> = {
  warning: 'warned',
  suspension: 'suspended',
  ban: 'banned',
};

const STATUS_RANK: Record<string, number> = {
  active: 0,
  warned: 1,
  suspended: 2,
  banned: 3,
};

const REASON_LABELS: Record<string, string> = {
  repeat_cancel: 'تكرار إلغاء الرحلات',
  late: 'عدم الالتزام بالمواعيد',
  misbehavior: 'سلوك غير لائق',
  rules_violation: 'مخالفة قواعد المنصة',
  driver_complaint: 'شكوى من راكب',
  severe_repeat: 'انتهاكات متكررة جسيمة',
  dangerous_behavior: 'سلوك خطير أثناء الرحلة',
  tos_violation: 'انتهاك شروط الاستخدام',
  other: 'أخرى',
};

function humanReason(reason: string): string {
  return REASON_LABELS[reason] || reason;
}

function durationLabel(endsAt: string | null | undefined): string {
  if (!endsAt) return 'غير محدد';
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return String(endsAt);
  return new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// Port of main-server/Services/penaltyService.ts. listForDriver serves the
// driver endpoint now; issue() serves the admin endpoint (wired to
// POST /api/admin/penalties by AdminPenaltiesController).
@Injectable()
export class PenaltyService {
  private readonly logger = new Logger(PenaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enforcement: EnforcementService,
    private readonly blocking: AccountBlockingService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForDriver(
    userId: string,
    filters: { active?: string | boolean; page?: unknown; limit?: unknown } = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(filters);
    const where: Record<string, unknown> = { userId };
    // Accept boolean true as well: the query parser may yield a boolean.
    if (filters.active === 'true' || filters.active === true) {
      const now = new Date();
      where.startsAt = { lte: now };
      where.OR = [{ endsAt: null }, { endsAt: { gte: now } }];
    }
    const [rows, count] = await Promise.all([
      this.prisma.penalty.findMany({
        where: where as never,
        include: { user: { select: { status: true } } },
        orderBy: { startsAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.penalty.count({ where: where as never }),
    ]);
    return {
      data: rows.map((p) => ({
        id: p.id,
        type: p.type,
        reason: p.reason,
        starts_at: p.startsAt,
        ends_at: p.endsAt,
        is_appealed: p.isAppealed,
        enforcement_state: (p.user as unknown as { status: string } | null)?.status ?? null,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async issue(
    actorId: string,
    payload: {
      user_id: string;
      type: string;
      reason: string;
      details?: string | null;
      complaint_id?: string | null;
      ends_at?: string | null;
      confirm_reviewed_log?: boolean | null;
      allow_open_suspension?: boolean;
    },
  ): Promise<{ penalty: Record<string, unknown> }> {
    const { user_id: userId, type, reason, details, complaint_id: complaintId, ends_at: endsAt } = payload;
    // Port of the cross-field ends_at rules in penaltyService.issue +
    // penaltyValidator.ts (suspension requires ends_at, ban forbids it,
    // ends_at must be in the future). DTO format checks run first via the
    // global ApiValidationPipe; these throw the same 422 VALIDATION_ERROR
    // envelope as Express ApiErrors.validation().
    if (type === 'suspension' && !endsAt && !payload.allow_open_suspension) {
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
    // Figma ban modals (10012:23728 + passenger/complaint/conversation
    // equivalents): أؤكد مراجعة سجل الحساب checkbox. Bans without an
    // explicit confirmation are rejected.
    if (type === 'ban' && payload.confirm_reviewed_log !== true) {
      throw new UnprocessableEntityException({
        message: 'CONFIRM_REVIEWED_LOG_REQUIRED',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'confirm_reviewed_log', message: 'CONFIRM_REVIEWED_LOG_REQUIRED' }],
      });
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });

    const penalty = await this.prisma.penalty.create({
      data: {
        userId,
        complaintId: complaintId ?? null,
        type: type as 'warning' | 'suspension' | 'ban',
        reason,
        details: details ?? null,
        startsAt: new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        issuedBy: actorId,
      },
    });
    const newStatus = STATUS_BY_TYPE[type];
    const currentRank = STATUS_RANK[user.status] ?? 0;
    if (newStatus && (STATUS_RANK[newStatus] ?? 0) > currentRank) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: newStatus as 'warned' | 'suspended' | 'banned' },
      });
    }

    let blockedInventory: Record<string, number> | null = null;
    if (type !== 'warning') {
      try {
        blockedInventory = await this.blocking.blockInventory(actorId, user, humanReason(reason));
      } catch (err) {
        this.logger.warn(`[penaltyService] account inventory block failed: ${(err as Error).message}`);
      }
    }

    const template =
      type === 'warning'
        ? 'ACCOUNT_WARNING'
        : type === 'suspension'
          ? 'ACCOUNT_SUSPENDED'
          : 'ACCOUNT_BANNED';
    const channels: ('in_app' | 'push' | 'sms')[] =
      type === 'warning'
        ? ['in_app', 'push']
        : ['in_app', 'push', 'sms'];
    try {
      await this.notifications.sendToUser(user as unknown as NotifyUser, template, {
        channels,
        vars: {
          reason: humanReason(reason),
          duration: durationLabel(endsAt),
        },
        data: {
          penalty_id: penalty.id,
          type,
          ends_at: endsAt ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`[penaltyService] penalty notification failed: ${(err as Error).message}`);
    }

    try {
      const plan = this.enforcement.revocationForPenalty(type);
      if (plan.applies) {
        this.enforcement.revoke(userId, {
          action: plan.action ?? 'suspend',
          reason: humanReason(reason),
          actorId,
          duration: type === 'suspension' && endsAt ? String(endsAt) : null,
        });
      }
    } catch (err) {
      this.logger.warn(`[penaltyService] enforcement revocation failed: ${(err as Error).message}`);
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
      ...(blockedInventory ? { inventory: blockedInventory } : {}),
    };
  }
}
