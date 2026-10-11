import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RejectSubscriptionDto, SubscriptionIdParam } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

// Express parity: Routes/adminSubscriptionRoutes.ts subscription section
// (all protect + admin). Plan/payment-method admin routes already live in
// the plans + payment-methods modules. Wave 7 admin module must not duplicate.
@Controller('admin/subscriptions')
@Roles('admin')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('pending')
  listPending(
    @Query() query: { status?: string; sort?: string },
  ): Promise<{ pending: Record<string, unknown>[] }> {
    return this.subscriptions.listPending(query).then((pending) => ({ pending }));
  }

  @Post(':subscription_id/approve')
  @HttpCode(200)
  approveSubscription(
    @Param() params: SubscriptionIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string; subscription_id: string; balance_added: number }> {
    return this.subscriptions.approve(params.subscription_id, user?.id ?? '');
  }

  @Post(':subscription_id/reject')
  @HttpCode(200)
  rejectSubscription(
    @Param() params: SubscriptionIdParam,
    @Body() dto: RejectSubscriptionDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string; subscription_id: string }> {
    return this.subscriptions.reject(params.subscription_id, dto.reason, user?.id ?? '');
  }
}
