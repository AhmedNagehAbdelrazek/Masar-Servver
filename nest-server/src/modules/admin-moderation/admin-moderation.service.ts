import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { maskPhone } from '../../common/utils/masking.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AdminUserListQuery, UpdateUserStatusDto } from './dto/admin-moderation.dto.js';

// Port of the user section of Main Server/Controllers/adminModerationController.ts
// (listUsers, updateUserStatus). Audit tracking is covered by the global
// AuditInterceptor; the status-change notification is kept verbatim.
@Injectable()
export class AdminModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    filters: AdminUserListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(filters);
    const where: Record<string, unknown> = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [rows, count] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never,
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
      this.prisma.user.count({ where: where as never }),
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

  async updateUserStatus(
    actorId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<{ user: Record<string, unknown> }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status as never },
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
}
