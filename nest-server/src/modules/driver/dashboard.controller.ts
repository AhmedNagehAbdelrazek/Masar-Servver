import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { DriverService } from './driver.service.js';

// Express parity: Routes/dashboardRoutes.ts mounted at /api/driver/dashboard.
@Controller('driver/dashboard')
@Roles('driver')
export class DashboardController {
  constructor(private readonly driver: DriverService) {}

  @Get()
  getDashboard(@CurrentUser() user?: AuthUser): Promise<Record<string, unknown>> {
    return this.driver.getDashboard(user?.id ?? '');
  }
}
