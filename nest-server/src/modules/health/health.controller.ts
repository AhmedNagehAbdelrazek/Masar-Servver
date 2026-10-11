import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService, type RealtimeSnapshot } from '../../realtime/realtime-metrics.service.js';

@Public()
@Controller()
export class HealthController {
  constructor(
    private readonly metrics: RealtimeMetricsService,
    private readonly gateway: RealtimeGateway,
  ) {}

  @Get('healthz')
  healthz(): { status: string; timestamp: string; uptime: number } {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  }

  // Port of Main Server/Controllers/realtimeHealthController.ts: serves the
  // realtime metrics snapshot (same shape as Express getSnapshot).
  @Get('health/realtime')
  realtime(): RealtimeSnapshot {
    return this.metrics.getSnapshot(this.gateway.server ?? null);
  }
}
