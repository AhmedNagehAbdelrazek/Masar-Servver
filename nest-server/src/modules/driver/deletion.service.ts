import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ensureOperational, loadDriverUser } from '../../common/access/user-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { NotifyUser } from '../notifications/notifications.service.js';

// Port of Main Server/Services/deletionRequestService.ts.
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 5 = Friday, 6 = Saturday
    if (day !== 5 && day !== 6) remaining -= 1;
  }
  return date;
}

@Injectable()
export class DeletionService {
  private readonly logger = new Logger(DeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async hasPendingRequest(userId: string): Promise<boolean> {
    const pending = await this.prisma.deletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });
    return pending !== null;
  }

  private async alertAdmins(driverId: string, fullName?: string | null, phone?: string | null): Promise<number> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin', status: 'active' },
      });
      for (const admin of admins) {
        await this.notifications.sendToUser(admin as unknown as NotifyUser, 'ADMIN_DELETION_NEW', {
          channels: ['in_app'],
          vars: { driver_name: fullName ?? 'A driver', phone: phone ?? '' },
          data: { driver_id: driverId },
        });
      }
      return admins.length;
    } catch (err) {
      this.logger.warn(`[deletion-request] admin alert failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async requestDeletion(
    userId: string,
    { reason = null as string | null, confirmation = false } = {},
  ): Promise<{ request_id: string; status: string; estimated_completion: Date }> {
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
        .sendToUser(fullUser as unknown as NotifyUser, 'DELETION_REQUESTED', {
          channels: ['in_app'],
          vars: {},
          data: { request_id: request.id, estimated_completion: request.estimatedCompletion },
        })
        .catch((err: Error) => this.logger.warn(`[deletion-request] user notify failed: ${err.message}`));
    }
    await this.alertAdmins(
      user.id,
      fullUser?.fullName as string | null,
      fullUser?.phone as string | null,
    );
    return {
      request_id: request.id,
      status: request.status,
      estimated_completion: request.estimatedCompletion as Date,
    };
  }

  async cancelDeletionRequest(userId: string): Promise<{ request_id: string; status: string }> {
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
        .sendToUser(fullUser as unknown as NotifyUser, 'DELETION_REQUEST_CANCELLED', {
          channels: ['in_app'],
          vars: {},
          data: { request_id: pending.id },
        })
        .catch((err: Error) => this.logger.warn(`[deletion-request] cancel notify failed: ${err.message}`));
    }
    return { request_id: pending.id, status: updated.status };
  }
}
