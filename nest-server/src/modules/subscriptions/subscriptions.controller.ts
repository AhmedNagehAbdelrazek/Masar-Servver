import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreateSubscriptionDto } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

// Express parity: Routes/subscriptionRoutes.ts (driver-only).
@Controller('subscriptions')
@Roles('driver')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Post()
  @HttpCode(201)
  createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ subscription_id: string; status: string; message: string }> {
    return this.subscriptions
      .createSubscription(user?.id ?? '', dto)
      .then((sub) => ({
        subscription_id: sub.id,
        status: sub.status,
        message: 'SUBSCRIPTION_PENDING_ADMIN_APPROVAL',
      }));
  }

  @Get()
  getMySubscriptions(
    @CurrentUser() user?: AuthUser,
  ): Promise<{ subscriptions: Record<string, unknown>[] }> {
    return this.subscriptions.getMySubscriptions(user?.id ?? '').then((subscriptions) => ({
      subscriptions,
    }));
  }

  @Get('current')
  getCurrentSubscription(
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.subscriptions.getCurrentSubscription(user?.id ?? '');
  }
}
