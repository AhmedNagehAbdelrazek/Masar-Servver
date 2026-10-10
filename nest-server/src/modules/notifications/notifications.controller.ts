import { Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { NotificationsService } from './notifications.service.js';

// Express parity: Routes/notificationRoutes.ts.
// - GET / has no validation chains (validate-only, a no-op) → query parsed
//   leniently here, mirroring the controller's inline parsing.
// - PUT /:id/read carries an unrelated settings validator WITHOUT effect in a
//   correct implementation; Express applies it and 422s every bodyless call
//   (verified failing 3/6 against Express itself). The port intentionally does
//   NOT reproduce that bug: no body validation on mark-read.
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async listNotifications(
    @Query() query: Record<string, string>,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit } = parsePagination(query);
    let unread: boolean | null = null;
    if (query.unread === 'true') unread = true;
    else if (query.unread === 'false') unread = false;
    const { rows, count } = await this.notifications.listForUser(user?.id ?? '', {
      unread,
      page,
      limit,
    });
    const data = rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      is_read: n.isRead,
      created_at: n.createdAt,
    }));
    return { data, pagination: buildPagination(count, page, limit) };
  }

  @Put(':notification_id/read')
  markRead(
    @Param('notification_id') notificationId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ notification: { id: string; is_read: boolean } }> {
    return this.notifications
      .markRead(user?.id ?? '', notificationId)
      .then((n) => ({ notification: { id: n.id, is_read: n.isRead } }));
  }
}
