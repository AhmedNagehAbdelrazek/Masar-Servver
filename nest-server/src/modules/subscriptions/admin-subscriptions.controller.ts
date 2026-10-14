import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  AdminSubscriptionListQuery,
  RejectSubscriptionDto,
  SubscriptionIdParam,
} from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

// Express parity: Routes/adminSubscriptionRoutes.ts subscription section
// (all protect + admin). Stats + review dossier extend the dashboard surface
// (Figma 10831:13497, 10840:37484, 10846:39083/42189/42450). Static routes
// (pending, stats) are declared before :subscription_id so they are never
// captured as a subscription id.
@Controller('admin/subscriptions')
@Roles('admin')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.subscriptions.getStats();
  }

  @Get('pending')
  listPending(
    @Query() query: AdminSubscriptionListQuery,
  ): Promise<{ pending: Record<string, unknown>[] }> {
    return this.subscriptions.listPending(query).then((pending) => ({ pending }));
  }

  @Get(':subscription_id')
  getDetail(@Param() params: SubscriptionIdParam): Promise<Record<string, unknown>> {
    return this.subscriptions.getDetail(params.subscription_id);
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
