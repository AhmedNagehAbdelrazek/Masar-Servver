import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';

@Public()
@Controller()
export class HealthController {
  @Get('healthz')
  healthz(): { status: string; timestamp: string; uptime: number } {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  }

  @Get('health/realtime')
  realtime(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
