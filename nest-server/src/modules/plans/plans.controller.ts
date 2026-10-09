import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PlansService } from './plans.service.js';

// Express parity: Routes/planRoutes.ts GET /api/plans (protect + driver).
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @Roles('driver')
  listActivePlans(): Promise<{ plans: Record<string, unknown>[] }> {
    return this.plans.getActivePlans().then((plans) => ({ plans }));
  }
}
