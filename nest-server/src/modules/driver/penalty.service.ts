import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnforcementService } from './enforcement.service.js';

const STATUS_BY_TYPE: Record<string, string> = {
  warning: 'warned',
  suspension: 'suspended',
  ban: 'banned',
};

// Port of Main Server/Services/penaltyService.ts. listForDriver serves the
// driver endpoint now; issue() serves the admin endpoint (wired to
// POST /api/admin/penalties by AdminPenaltiesController).
@Injectable()
export class PenaltyService {
  private readonly logger = new Logger(PenaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enforcement: EnforcementService,
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
    },
  ): Promise<{ penalty: Record<string, unknown> }> {
    const { user_id: userId, type, reason, details, complaint_id: complaintId, ends_at: endsAt } = payload;
    // Port of the cross-field ends_at rules in penaltyService.issue +
    // penaltyValidator.ts (suspension requires ends_at, ban forbids it,
    // ends_at must be in the future). DTO format checks run first via the
    // global ApiValidationPipe; these throw the same 422 VALIDATION_ERROR
    // envelope as Express ApiErrors.validation().
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
    if (newStatus) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: newStatus as 'warned' | 'suspended' | 'banned' },
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
    };
  }
}
