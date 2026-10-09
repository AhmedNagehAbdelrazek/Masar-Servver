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

// Express parity: Routes/paymentMethodRoutes.ts mounted at /api/payment-methods.
// GET / is authenticated WITHOUT role restriction; the rest is admin-only.
// NOTE: DELETE carries methodParamValidation WITHOUT `validate` in Express,
// so a malformed UUID falls through to a 404 (plain-string param here).
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  listActiveMethods(): Promise<{ methods: Record<string, unknown>[] }> {
    return this.plans.getActivePaymentMethods().then((methods) => ({ methods }));
  }

  @Get('all')
  @Roles('admin')
  listAllMethods(): Promise<{ methods: Record<string, unknown>[] }> {
    return this.plans.listPaymentMethods().then((methods) => ({ methods }));
  }

  @Post()
  @HttpCode(201)
  @Roles('admin')
  createMethod(
    @Body() dto: CreatePaymentMethodDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ payment_method: Record<string, unknown> }> {
    return this.plans.createPaymentMethod(dto, user?.id ?? '').then((payment_method) => ({
      payment_method,
    }));
  }

  @Put(':method_id')
  @Roles('admin')
  updateMethod(
    @Param() params: UuidMethodIdParam,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ payment_method: Record<string, unknown> }> {
    return this.plans
      .updatePaymentMethod(params.method_id, dto, user?.id ?? '')
      .then((payment_method) => ({ payment_method }));
  }

  @Delete(':method_id')
  @Roles('admin')
  deactivateMethod(
    @Param('method_id') methodId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.plans.deactivatePaymentMethod(methodId, user?.id ?? '');
  }
}
