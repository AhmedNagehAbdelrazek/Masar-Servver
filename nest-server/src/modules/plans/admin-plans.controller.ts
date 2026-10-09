import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UuidPlanIdParam } from './dto/plan-id.param.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlansService } from './plans.service.js';

// Express parity: Routes/adminSubscriptionRoutes.ts plan section
// (all protect + admin). NOTE: DELETE carries planIdValidation WITHOUT the
// `validate` middleware in Express, so a malformed UUID falls through to a
// 404 — hence the plain-string param here, while PUT validates to 422.
@Controller('admin/plans')
@Roles('admin')
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  listPlans(): Promise<{ plans: Record<string, unknown>[] }> {
    return this.plans.listPlans().then((plans) => ({ plans }));
  }

  @Post()
  @HttpCode(201)
  createPlan(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ plan: Record<string, unknown> }> {
    return this.plans.createPlan(dto, user?.id ?? '').then((plan) => ({ plan }));
  }

  @Put(':plan_id')
  updatePlan(
    @Param() params: UuidPlanIdParam,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ plan: Record<string, unknown> }> {
    return this.plans.updatePlan(params.plan_id, dto, user?.id ?? '').then((plan) => ({ plan }));
  }

  @Delete(':plan_id')
  deactivatePlan(
    @Param('plan_id') planId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.plans.deactivatePlan(planId, user?.id ?? '');
  }
}
