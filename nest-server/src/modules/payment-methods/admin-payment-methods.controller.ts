import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  UuidMethodIdParam,
} from '../plans/dto/payment-method.dto.js';
import { PlansService } from '../plans/plans.service.js';

// Express parity: Routes/adminSubscriptionRoutes.ts payment-method section
// (all protect + admin, response key `method`). Unlike the /payment-methods
// mount, DELETE here IS validated (422 on malformed UUID).
@Controller('admin/payment-methods')
@Roles('admin')
export class AdminPaymentMethodsController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  listPaymentMethods(): Promise<{ methods: Record<string, unknown>[] }> {
    return this.plans.listPaymentMethods().then((methods) => ({ methods }));
  }

  @Post()
  @HttpCode(201)
  createPaymentMethod(
    @Body() dto: CreatePaymentMethodDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ method: Record<string, unknown> }> {
    return this.plans.createPaymentMethod(dto, user?.id ?? '').then((method) => ({ method }));
  }

  @Put(':method_id')
  updatePaymentMethod(
    @Param() params: UuidMethodIdParam,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ method: Record<string, unknown> }> {
    return this.plans
      .updatePaymentMethod(params.method_id, dto, user?.id ?? '')
      .then((method) => ({ method }));
  }

  @Delete(':method_id')
  deactivatePaymentMethod(
    @Param() params: UuidMethodIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.plans.deactivatePaymentMethod(params.method_id, user?.id ?? '');
  }
}
